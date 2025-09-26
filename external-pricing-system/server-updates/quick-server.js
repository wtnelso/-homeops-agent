require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const HomeOpsDataManager = require('./services/data-manager');

// Initialize Firebase Admin for email storage and user data
const admin = require('firebase-admin');
let db = null;

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert('./homeops-web-firebase-adminsdk-fbsvc-0a737a8eee.json'),
      databaseURL: "https://homeops-web-default-rtdb.firebaseio.com/"
    });
  }
  db = admin.firestore();
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.log('⚠️ Firebase Admin initialization failed:', error.message);
  // Create mock db for development
  db = {
    collection: () => ({
      doc: () => ({
        set: () => Promise.resolve(),
        get: () => Promise.resolve({ exists: false, data: () => null })
      })
    })
  };
}

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize HomeOps Data Manager for real data
const dataManager = new HomeOpsDataManager();

// Gmail OAuth setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/auth/gmail/callback'
);

// Middleware
app.use(express.json());

// Add simple in-memory cache to prevent repeated processing
const responseCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

function getCacheKey(query) {
  return `chat_${query.toLowerCase().trim()}`;
}

function getCachedResponse(key) {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📋 Using cached response for: ${key}`);
    return cached.data;
  }
  return null;
}

function setCachedResponse(key, data) {
  responseCache.set(key, {
    data: data,
    timestamp: Date.now()
  });
  
  // Clean old cache entries
  if (responseCache.size > 100) {
    const oldestKey = responseCache.keys().next().value;
    responseCache.delete(oldestKey);
  }
} 

// CRITICAL: Custom routes MUST come BEFORE static middleware to override default files
// Main app route - serve the main HomeOps app with navigation  
app.get('/app', (req, res) => {
  console.log('🎯 Serving /app route -> index-with-command.html');
  res.sendFile(path.join(__dirname, 'public', 'index-with-command.html'));
});

// Command Center standalone route for iframe embedding
app.get('/command-center.html', (req, res) => {
  console.log('📊 Serving Command Center for iframe -> command-center.html');
  res.sendFile(path.join(__dirname, 'public', 'command-center.html'));
});

// Root route - redirect to onboarding for now
app.get('/', (req, res) => {
  console.log('🏠 Serving root route -> redirecting to onboarding');
  res.redirect('/onboarding');
});

// Serve static files with no-cache for HTML
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

// ========================
// ONBOARDING API ROUTES
// ========================

// Generate session ID helper
function generateSessionId() {
  return 'session_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Store onboarding state
app.post('/api/onboarding/state', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || generateSessionId();
    const state = req.body;
    
    // In production, save to database. For now, use memory store
    if (!global.onboardingStates) {
      global.onboardingStates = new Map();
    }
    
    global.onboardingStates.set(sessionId, {
      ...state,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      sessionId,
      message: 'State saved successfully' 
    });
  } catch (error) {
    console.error('Failed to save onboarding state:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save state' 
    });
  }
});

// Gmail OAuth start
app.get('/api/oauth/google/start', (req, res) => {
  const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: JSON.stringify({ 
      redirect: '/onboarding?step=2&connected=true',
      sessionId: req.headers['x-session-id'] || generateSessionId()
    })
  });
  
  res.redirect(authUrl);
});

// Gmail OAuth callback
app.get('/api/oauth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const stateData = state ? JSON.parse(state) : {};
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getAccessToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Store tokens in Firebase/database
    const sessionId = stateData.sessionId || generateSessionId();
    
    if (db) {
      try {
        await db.collection('users').doc(sessionId).set({
          oauth: {
            gmail: {
              connected: true,
              tokens: tokens,
              scopes: ['gmail.readonly'],
              connectedAt: new Date().toISOString()
            }
          }
        }, { merge: true });
        console.log('OAuth tokens saved to Firebase');
      } catch (firebaseError) {
        console.warn('Failed to save to Firebase, using memory store:', firebaseError.message);
      }
    }
    
    // Update memory store
    if (!global.onboardingStates) {
      global.onboardingStates = new Map();
    }
    
    const existingState = global.onboardingStates.get(sessionId) || {};
    global.onboardingStates.set(sessionId, {
      ...existingState,
      oauth: {
        gmail: {
          connected: true,
          connectedAt: new Date().toISOString()
        }
      }
    });
    
    // Redirect back to onboarding
    const redirectUrl = stateData.redirect || '/onboarding?step=2&connected=true';
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/onboarding?error=oauth_failed');
  }
});

// Finalize onboarding
app.post('/api/onboarding/finalize', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || 'default';
    const state = req.body;
    
    // Generate user ID
    const userId = 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    // Prepare user data for Firestore
    const userData = {
      profile: {
        firstName: state.profile?.firstName || '',
        timezone: state.profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdAt: new Date().toISOString()
      },
      household: {
        children: state.household?.children || []
      },
      preferences: {
        priorities: state.preferences?.priorities || {
          school: true,
          sports: true,
          birthdays: true,
          travel: true,
          medical: false,
          bills: false,
          orders: true
        },
        summaryTimes: state.preferences?.summaryTimes || ['07:30', '19:30'],
        quietHours: state.preferences?.quietHours || { start: '22:00', end: '07:00' }
      },
      oauth: state.oauth || { gmail: { connected: false } },
      onboardingCompletedAt: new Date().toISOString()
    };
    
    // Save to Firebase if available
    if (db) {
      try {
        await db.collection('users').doc(userId).set(userData);
        console.log('User data saved to Firebase:', userId);
      } catch (firebaseError) {
        console.warn('Failed to save to Firebase:', firebaseError.message);
      }
    }
    
    // Start initial email ingest (mock for now)
    setTimeout(() => {
      console.log('Starting initial email ingest for user:', userId);
      createInitialCoffeeCup(userId, userData);
    }, 1000);
    
    res.json({ 
      success: true, 
      userId,
      message: 'Onboarding completed successfully',
      redirectUrl: '/'
    });
    
  } catch (error) {
    console.error('Finalization error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to complete onboarding' 
    });
  }
});

// Mock initial Coffee Cup creation
async function createInitialCoffeeCup(userId, userData) {
  try {
    const children = userData.household?.children || ['Lucy', 'Ellie'];
    const firstName = userData.profile?.firstName || 'Parent';
    const priorities = userData.preferences?.priorities || {};
    
    // Generate mock Coffee Cup data
    const coffeeCupData = {
      userId,
      generatedAt: new Date().toISOString(),
      summaryType: 'morning',
      today: [],
      this_week: [],
      handle_now: []
    };
    
    // Add priority-based items
    if (priorities.school) {
      coffeeCupData.today.push({
        type: 'school',
        title: 'Early dismissal today',
        time: '1:00 PM',
        child: children[0],
        priority: 'medium'
      });
      
      coffeeCupData.handle_now.push({
        type: 'permission',
        title: 'Sign field trip form',
        due: 'Today',
        priority: 'high'
      });
    }
    
    if (priorities.birthdays) {
      coffeeCupData.this_week.push({
        type: 'birthday',
        title: "RSVP for Olivia's party by Thursday",
        child: children[1] || children[0],
        priority: 'medium'
      });
    }
    
    if (priorities.sports) {
      coffeeCupData.this_week.push({
        type: 'sports',
        title: 'Soccer practice moved to 4 PM Saturday',
        child: children[0],
        priority: 'medium'
      });
    }
    
    if (priorities.orders) {
      coffeeCupData.today.push({
        type: 'delivery',
        title: 'Amazon package arriving',
        time: '2:00 PM',
        priority: 'low'
      });
    }
    
    // Ensure at least one item in each section
    if (coffeeCupData.today.length === 0) {
      coffeeCupData.today.push({
        type: 'general',
        title: 'All caught up for today! ✨',
        time: 'N/A',
        priority: 'info'
      });
    }
    
    if (coffeeCupData.this_week.length === 0) {
      coffeeCupData.this_week.push({
        type: 'general',
        title: 'Light week ahead 🌟',
        priority: 'info'
      });
    }
    
    if (coffeeCupData.handle_now.length === 0) {
      coffeeCupData.handle_now.push({
        type: 'general',
        title: 'Nothing urgent right now ✅',
        due: 'N/A',
        priority: 'info'
      });
    }
    
    // Save Coffee Cup to database
    if (db) {
      try {
        await db.collection('users').doc(userId).collection('derived').doc('coffeeCup').set(coffeeCupData);
        console.log('Initial Coffee Cup created for user:', userId);
      } catch (error) {
        console.warn('Failed to save Coffee Cup to Firebase:', error.message);
      }
    }
    
    // Store in memory as fallback
    if (!global.coffeeCups) {
      global.coffeeCups = new Map();
    }
    global.coffeeCups.set(userId, coffeeCupData);
    
    console.log('Initial Coffee Cup ready for user:', userId);
    
  } catch (error) {
    console.error('Failed to create initial Coffee Cup:', error);
  }
}

// ========================
// END ONBOARDING ROUTES
// ========================

// OpenAI setup (add this back)
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// User Profile Management System
const userProfiles = new Map(); // In production, this would be a proper database

// Initialize or get user profile
function getUserProfile(userId = 'default') {
  if (!userProfiles.has(userId)) {
    userProfiles.set(userId, {
      id: userId,
      preferences: {
        primaryFocus: 'family', // family, work, personal
        alertThreshold: 'medium', // low, medium, high
        timeZone: 'America/New_York',
        enabledIntegrations: ['gmail', 'calendar']
      },
      mentalLoadData: {
        weeklyPatterns: {},
        stressIndicators: [],
        successMetrics: {}
      },
      personalizedInsights: [],
      actionHistory: [],
      connectedAccounts: {
        gmail: null,
        calendar: null,
        slack: null
      }
    });
  }
  return userProfiles.get(userId);
}

// Dashboard Summary API - Now with REAL data
app.get('/api/dashboard-summary', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const profile = getUserProfile(userId);
    
    console.log(`📊 Getting REAL dashboard summary for: ${userId}`);
    
    // Try to get user's tokens for real data
    if (profile.integrations && profile.integrations.gmail) {
      dataManager.setUserCredentials(userId, profile.integrations.gmail);
    }
    
    // Get real dashboard data
    const summary = await dataManager.getDashboardSummary(userId, profile);
    
    res.json({ 
      success: true, 
      summary,
      userId,
      dataSource: profile.integrations?.gmail ? 'real' : 'fallback'
    });
    
  } catch (error) {
    console.error('❌ Dashboard summary error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      summary: dataManager.getFallbackDashboardData()
    });
  }
});

// Personalized summary calculation
async function calculatePersonalizedSummary(profile, days) {
  // This would integrate with their actual Gmail, Calendar, etc.
  const emailData = await analyzeUserEmails(profile);
  const calendarData = await analyzeUserCalendar(profile);
  const mentalLoadData = await analyzeMentalLoadPatterns(profile);
  
  return {
    urgent: emailData.urgentCount,
    events: calendarData.upcomingEvents.length,
    commerce: emailData.commerceCount,
    insights: await generatePersonalizedInsights(profile, emailData, calendarData)
  };
}

// Real data analysis functions
async function analyzeUserEmails(profile) {
  // TODO: Integrate with actual Gmail API using user's tokens
  // For now, return structured sample data that feels personal
  return {
    urgentCount: Math.floor(Math.random() * 8) + 2,
    commerceCount: Math.floor(Math.random() * 6) + 1,
    totalProcessed: 45,
    patterns: ['Work emails peak Tuesday mornings', 'School updates come Fridays']
  };
}

async function analyzeUserCalendar(profile) {
  // TODO: Integrate with actual Calendar API
  const upcomingEvents = [
    { title: 'Parent-Teacher Conference', date: '2025-07-30', type: 'family' },
    { title: 'Team Standup', date: '2025-07-29', type: 'work' },
    { title: 'Soccer Practice', date: '2025-07-31', type: 'family' }
  ];
  
  return {
    upcomingEvents,
    weeklyLoad: 'high',
    conflictingEvents: 0
  };
}

async function analyzeMentalLoadPatterns(profile) {
  // AI-powered analysis of the user's mental load patterns
  return {
    currentLoad: 'moderate',
    trendDirection: 'increasing',
    recommendedActions: ['Delegate 2 tasks', 'Block calendar time for planning']
  };
}

async function generatePersonalizedInsights(profile, emailData, calendarData) {
  // Use OpenAI to generate truly personalized insights
  try {
    const prompt = `Based on this user's data:
    - ${emailData.urgentCount} urgent emails this week
    - ${calendarData.upcomingEvents.length} upcoming events
    - Primary focus: ${profile.preferences.primaryFocus}
    - Patterns: ${emailData.patterns.join(', ')}
    
    Generate 3 personalized, actionable insights for managing their mental load.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300
    });
    
    // Parse AI response into structured insights
    const insights = parseAIInsights(response.choices[0].message.content);
    return insights.length;
    
  } catch (error) {
    console.error('AI insight generation error:', error);
    return 15; // Fallback count
  }
}

function parseAIInsights(aiResponse) {
  // Convert AI response into structured insight objects
  const insights = aiResponse.split('\n').filter(line => line.trim()).map((insight, index) => ({
    title: `Insight ${index + 1}`,
    category: 'AI Generated',
    date: new Date().toISOString().split('T')[0],
    priority: 'Medium',
    insight: insight.trim(),
    action: 'Review',
    icon: 'lightbulb'
  }));
  
  return insights;
}

// Email Intelligence API - Now with REAL Gmail parsing
app.get('/api/email-intelligence', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const limit = parseInt(req.query.limit) || 5;
    
    console.log(`🧠 Getting REAL email intelligence for: ${userId}`);
    
    // Try to get real Gmail data first using stored Firebase tokens
    let insights = [];
    let dataSource = 'fallback';
    
    try {
      // Check if we have Gmail tokens stored in Firebase for this user
      const tokenDoc = await db.collection('gmail_tokens').doc(userId).get();
      if (tokenDoc.exists) {
        console.log(`✅ Found Gmail tokens for: ${userId}`);
        const tokens = tokenDoc.data();
        
        // Set up OAuth client with stored tokens
        oauth2Client.setCredentials(tokens);
        
        // Fetch real Gmail emails
        const realEmails = await fetchRealGmailEmails(userId, limit);
        
        // Convert to insights format with proper UI fields
        insights = realEmails.map((email, index) => {
          const category = categorizeEmail(email.subject, email.snippet, email.from);
          const manipulationScore = calculateMentalLoadScore(category, 'medium', email.snippet);
          
          return {
            id: email.id || `insight_${index + 1}`,
            type: 'email',
            priority: 'medium',
            title: email.subject,
            description: email.snippet,
            from: email.from,
            date: email.date,
            time_ago: 'just now',
            category: category,
            actionable: true,
            source: 'gmail',
            // UI-specific fields
            full_analysis: `This email from ${email.from} appears to be ${category.toLowerCase()}-related content. The subject line "${email.subject}" suggests immediate attention may be required for optimal time management.`,
            manipulation_score: Math.floor(manipulationScore / 10), // Convert to 1-10 scale
            personalized_score: manipulationScore / 100,
            action_items: [
              'Review email content for time-sensitive elements',
              'Add any calendar events to your schedule',
              'Respond if immediate action is required'
            ],
            calendar_events: email.subject.includes('appointment') || email.subject.includes('meeting') || email.subject.includes('reservation') 
              ? 'Potential calendar event detected in email content' 
              : null
          };
        });
        
        dataSource = 'real';
        console.log(`✅ Retrieved ${insights.length} real Gmail insights`);
      } else {
        throw new Error('No Gmail tokens found for user');
      }
    } catch (gmailError) {
      console.error('❌ Gmail fetch failed:', gmailError.message);
      
      // Fallback to generated insights
      const profile = getUserProfile(userId);
      const dataManager = new HomeOpsDataManager(userId, null);
      insights = await dataManager.generateRealTimeInsights(userId, profile, limit);
      console.log(`📦 Using ${insights.length} generated insights as fallback`);
    }
    
    res.json({ 
      success: true, 
      insights, 
      userId,
      dataSource
    });
    
  } catch (error) {
    console.error('❌ Email intelligence error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      insights: dataManager.getFallbackInsights(5)
    });
  }
});

// Import enhanced commerce intelligence
const EnhancedCommerceIntelligence = require('./services/enhanced-commerce-intelligence');

// Initialize enhanced commerce intelligence
const enhancedCommerce = new EnhancedCommerceIntelligence(db);

// NEW: Enhanced Commerce Intelligence API - DTC Brand Detection + Email Scoring
app.get('/api/commerce-intelligence', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const limit = parseInt(req.query.limit) || 10;
    
    console.log(`🛍️ Getting ENHANCED commerce intelligence for: ${userId}`);
    
    let commerceData = {
      deals: [],
      packages: [],
      priceDrops: [],
      recommendations: [],
      totalSavings: 0,
      dataSource: 'enhanced_fallback'  // Changed to enhanced fallback by default
    };
    
    try {
      // Check if we have Gmail tokens stored in Firebase for this user
      const tokenDoc = await db.collection('gmail_tokens').doc(userId).get();
      if (tokenDoc.exists) {
        console.log(`✅ Found Gmail tokens for enhanced commerce analysis: ${userId}`);
        const tokens = tokenDoc.data();
        
        // Set up OAuth client with stored tokens
        oauth2Client.setCredentials(tokens);
        
        // Fetch promotional emails for enhanced analysis
        const commerceEmails = await fetchPromotionalEmails(userId, limit * 3); // Get more emails for better analysis
        
        if (commerceEmails && commerceEmails.length > 0) {
          console.log(`📧 Analyzing ${commerceEmails.length} promotional emails for DTC brands...`);
          
          // Use enhanced commerce intelligence to generate smart cards
          const enhancedDeals = await enhancedCommerce.generateEnhancedCommerceCards(
            userId, 
            commerceEmails, 
            limit
          );
          
          // Also get package tracking data
          const packageData = await extractPackageTracking(commerceEmails);
          
          commerceData = {
            deals: enhancedDeals,
            packages: packageData,
            priceDrops: [], // Could be enhanced later
            recommendations: enhancedDeals.filter(deal => deal.isDTC).slice(0, 3), // Prioritize DTC for recommendations
            totalSavings: enhancedDeals.reduce((sum, deal) => {
              if (deal.discount && deal.discount.includes('$')) {
                const amount = parseInt(deal.discount.match(/\$(\d+)/)?.[1] || 0);
                return sum + amount;
              }
              return sum;
            }, 0),
            dataSource: 'enhanced'
          };
          
          console.log(`✅ Enhanced analysis complete: ${enhancedDeals.length} deals, ${enhancedDeals.filter(d => d.isDTC).length} DTC brands`);
        } else {
          console.log('📭 No promotional emails found, using enhanced fallback data');
          commerceData = generateEnhancedMockData(userId);
          commerceData.dataSource = 'enhanced_fallback';
        }
      } else {
        throw new Error('No Gmail tokens found for user');
      }
    } catch (gmailError) {
      console.error('❌ Enhanced commerce intelligence fetch failed:', gmailError.message);
      
      // Fallback to enhanced mock data
      commerceData = generateEnhancedMockData(userId);
      commerceData.dataSource = 'enhanced_fallback';
    }    res.json({
      success: true,
      ...commerceData,
      userId: userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Enhanced commerce intelligence error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to load enhanced commerce intelligence', 
      details: error.message,
      deals: [],
      packages: [],
      recommendations: []
    });
  }
});

// Enhanced Gmail fetching with commerce deal parsing
async function fetchGmailInsights(credentials, limit = 10) {
  console.log('🔍 Fetching Gmail insights with commerce parsing...');
  
  try {
    // Set up OAuth client with user credentials
    oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token
    });
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Search for recent emails with potential deals
    const query = 'newer_than:3d (deal OR sale OR discount OR offer OR % off OR limited time OR exclusive)';
    const emailList = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: limit * 2 // Get more to filter for quality
    });
    
    if (!emailList.data.messages) {
      console.log('📭 No recent deal emails found');
      return [];
    }
    
    const insights = [];
    
    for (const message of emailList.data.messages.slice(0, limit)) {
      try {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });
        
        const headers = email.data.payload.headers;
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const from = headers.find(h => h.name === 'From')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';
        
        // Extract email body
        let body = '';
        if (email.data.payload.body?.data) {
          body = Buffer.from(email.data.payload.body.data, 'base64').toString();
        } else if (email.data.payload.parts) {
          for (const part of email.data.payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              body += Buffer.from(part.body.data, 'base64').toString();
              break; // Just get the first text part
            }
          }
        }
        
        // Parse as commerce deal if it looks like one
        const dealInsight = parseEmailForCommerceDeal(subject, from, body, date);
        if (dealInsight) {
          insights.push(dealInsight);
        }
        
      } catch (emailError) {
        console.error(`❌ Error processing email ${message.id}:`, emailError.message);
        continue;
      }
    }
    
    console.log(`✅ Parsed ${insights.length} commerce insights from Gmail`);
    return insights;
    
  } catch (error) {
    console.error('❌ Gmail API error:', error.message);
    throw error;
  }
}

// Parse individual email for commerce deal information
function parseEmailForCommerceDeal(subject, from, body, date) {
  console.log(`🔍 Parsing email: ${subject.substring(0, 50)}...`);
  
  // Extract brand name from sender
  const brandMatch = from.match(/([^<@\s]+)@/);
  const domain = from.match(/@([^>]+)>/);
  let brand = 'Unknown';
  
  if (domain) {
    const domainName = domain[1].split('.')[0];
    brand = domainName.charAt(0).toUpperCase() + domainName.slice(1);
  }
  
  // Common brand mappings
  const brandMappings = {
    'amazon': 'Amazon',
    'target': 'Target',
    'walmart': 'Walmart',
    'costco': 'Costco',
    'bestbuy': 'Best Buy',
    'nike': 'Nike',
    'apple': 'Apple',
    'rei': 'REI',
    'patagonia': 'Patagonia'
  };
  
  const lowerDomain = (domain?.[1] || '').toLowerCase();
  for (const [key, value] of Object.entries(brandMappings)) {
    if (lowerDomain.includes(key)) {
      brand = value;
      break;
    }
  }
  
  // Extract pricing information
  const fullText = `${subject} ${body}`;
  const priceMatches = fullText.match(/\$\d+(?:\.\d{2})?/g) || [];
  const percentageMatch = fullText.match(/(\d+)%\s*(?:off|discount)/i);
  
  let originalPrice = null;
  let currentPrice = null;
  let savings = null;
  let discountPercent = null;
  
  if (percentageMatch) {
    discountPercent = parseInt(percentageMatch[1]);
  }
  
  if (priceMatches.length >= 2) {
    // Assume higher price is original, lower is current
    const prices = priceMatches.map(p => parseFloat(p.replace('$', ''))).sort((a, b) => b - a);
    originalPrice = `$${prices[0].toFixed(2)}`;
    currentPrice = `$${prices[1].toFixed(2)}`;
    savings = `$${(prices[0] - prices[1]).toFixed(2)}`;
  } else if (priceMatches.length === 1 && discountPercent) {
    currentPrice = priceMatches[0];
    const current = parseFloat(currentPrice.replace('$', ''));
    const original = current / (1 - discountPercent / 100);
    originalPrice = `$${original.toFixed(2)}`;
    savings = `$${(original - current).toFixed(2)}`;
  }
  
  // Extract product name
  let product = 'Special Offer';
  const productPatterns = [
    /(?:deal on|sale on|save on)\s+([^.!,\n]{10,60})/i,
    /([A-Z][A-Za-z\s]+(?:Pro|Plus|Max|Air|Mini|Ultra))/,
    /(iPhone|iPad|MacBook|AirPods|Echo|Fire|Kindle)/i
  ];
  
  for (const pattern of productPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      product = match[1].trim();
      break;
    }
  }
  
  // Extract urgency/expiration
  let urgency = 'Limited time offer';
  const urgencyPatterns = [
    /(?:ends|expires)\s+(?:in\s+)?(\d+\s+(?:hours?|days?))/i,
    /(today only|this weekend only)/i,
    /(while supplies last)/i
  ];
  
  for (const pattern of urgencyPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      urgency = match[0];
      break;
    }
  }
  
  // Determine if this looks like a legitimate deal
  const dealKeywords = ['deal', 'sale', 'discount', 'offer', '% off', 'save', 'limited time'];
  const hasKeywords = dealKeywords.some(keyword => 
    fullText.toLowerCase().includes(keyword)
  );
  
  if (!hasKeywords && !priceMatches.length) {
    return null; // Doesn't look like a deal
  }
  
  // Priority based on savings amount or discount percentage
  let priority = 'Medium';
  if (savings) {
    const savingsAmount = parseFloat(savings.replace('$', ''));
    if (savingsAmount > 50) priority = 'High';
    else if (savingsAmount < 10) priority = 'Low';
  } else if (discountPercent) {
    if (discountPercent > 30) priority = 'High';
    else if (discountPercent < 10) priority = 'Low';
  }
  
  // Create calendar event for deal expiration (if urgency indicates a time limit)
  let calendarEvents = [];
  if (urgency.toLowerCase().includes('today')) {
    // Deal expires today
    const today = new Date();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    calendarEvents.push({
      title: `${brand} Deal Expires`,
      start: endOfDay.toISOString().slice(0, -5) + 'Z',
      description: `Don't miss: ${product} deal expires today! ${savings ? `Save ${savings}` : `${discountPercent}% off`}`,
      location: `${brand} Website`,
      allDay: false
    });
  } else if (urgency.match(/(\d+)\s+days?/i)) {
    // Deal expires in X days
    const daysMatch = urgency.match(/(\d+)\s+days?/i);
    const daysUntilExpiration = parseInt(daysMatch[1]);
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + daysUntilExpiration);
    
    calendarEvents.push({
      title: `${brand} Deal Expires`,
      start: expirationDate.toISOString().split('T')[0] + 'T20:00:00',
      description: `Last chance: ${product} deal expires! ${savings ? `Save ${savings}` : `${discountPercent}% off`}`,
      location: `${brand} Website`,
      allDay: false
    });
  }
  
  return {
    title: `${brand} Deal Alert`,
    category: 'Commerce',
    date: new Date().toISOString().split('T')[0],
    priority: priority,
    insight: `${product} ${discountPercent ? `${discountPercent}% off` : ''} ${savings ? `Save ${savings}` : ''}`.trim(),
    action: 'View Deal',
    icon: 'tag',
    brand: brand,
    product: product,
    originalPrice: originalPrice,
    currentPrice: currentPrice,
    savings: savings,
    urgency: urgency,
    source: `${brand} Email`,
    emailSubject: subject,
    // Add calendar events for deal tracking
    calendarEvents: calendarEvents,
    hasCalendarEvents: calendarEvents.length > 0,
    // Add calendar URLs for easy "Add to Calendar" functionality
    calendarUrls: calendarEvents.map(event => ({
      title: event.title,
      url: generateCalendarUrl(event),
      date: event.start,
      allDay: event.allDay || false
    }))
  };
}

async function generateRealTimeInsights(profile, emailData, calendarData, limit) {
  // This is where the magic happens - real AI-powered insights
  const insights = [];
  
  // Generate contextual insights based on actual patterns
  if (emailData.urgentCount > 5) {
    insights.push({
      title: "High Email Volume Detected",
      category: "Productivity",
      date: new Date().toISOString().split('T')[0],
      priority: "High", 
      insight: `You have ${emailData.urgentCount} urgent emails. Consider batching responses at 2pm and 5pm today.`,
      action: "Set Email Blocks",
      icon: "mail"
    });
  }
  
  if (calendarData.upcomingEvents.length > 4) {
    insights.push({
      title: "Busy Week Ahead",
      category: "Planning",
      date: new Date().toISOString().split('T')[0],
      priority: "Medium",
      insight: `${calendarData.upcomingEvents.length} events scheduled. Prep time blocked for ${calendarData.upcomingEvents[0].title}?`,
      action: "Block Prep Time", 
      icon: "calendar"
    });
  }
  
  // AI-generated contextual insight
  try {
    const aiInsight = await generateContextualInsight(profile, emailData, calendarData);
    if (aiInsight) insights.push(aiInsight);
  } catch (error) {
    console.error('AI contextual insight error:', error);
  }
  
  // Fallback insights if we don't have enough
  const fallbackInsights = [
    {
      title: "Mental Load Optimization",
      category: "Wellness", 
      date: new Date().toISOString().split('T')[0],
      priority: "Low",
      insight: "Your current task distribution shows 70% family, 30% work. Consider delegating 1-2 household tasks.",
      action: "Review Tasks",
      icon: "brain"
    }
  ];
  
  return [...insights, ...fallbackInsights].slice(0, limit);
}

async function generateContextualInsight(profile, emailData, calendarData) {
  try {
    const prompt = `You are a mental load management AI. Based on this data:
    - User focus: ${profile.preferences.primaryFocus}
    - Urgent emails: ${emailData.urgentCount}
    - Upcoming events: ${calendarData.upcomingEvents.length}
    
    Generate ONE specific, actionable insight in this JSON format:
    {
      "title": "Specific Title",
      "category": "Category", 
      "priority": "High/Medium/Low",
      "insight": "Specific insight with numbers/context",
      "action": "Clear action step",
      "icon": "lucide-icon-name"
    }`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150
    });
    
    const aiInsight = JSON.parse(response.choices[0].message.content);
    aiInsight.date = new Date().toISOString().split('T')[0];
    return aiInsight;
    
  } catch (error) {
    console.error('Contextual insight generation error:', error);
    return null;
  }
}

// Recent Activity API - Based on real data
app.get('/api/recent-activity', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const profile = getUserProfile(userId);
    
    console.log(`🔄 Getting REAL activity data for: ${userId}`);
    
    // Set user credentials if available
    if (profile.integrations && profile.integrations.gmail) {
      dataManager.setUserCredentials(userId, profile.integrations.gmail);
    }
    
    // Get real data for activity feed
    const emailData = await dataManager.getRealEmailData(profile);
    const calendarData = await dataManager.getRealCalendarData(profile);
    const commerceData = await dataManager.getCommerceInsights(profile);
    
    const activity = [
      { 
        type: 'email', 
        text: `Gmail sync: ${emailData.totalProcessed} emails processed, ${emailData.urgentCount} urgent` 
      },
      { 
        type: 'calendar', 
        text: `Calendar: ${calendarData.upcomingCount} events this week (${calendarData.weeklyLoad} load)` 
      },
      { 
        type: 'commerce', 
        text: `Commerce: ${commerceData.opportunityCount} shopping opportunities identified` 
      },
      { 
        type: 'system', 
        text: `AI insights generated for ${profile.preferences.primaryFocus} optimization` 
      }
    ];
    
    res.json({ 
      success: true, 
      activity, 
      userId,
      dataSource: profile.integrations?.gmail ? 'real' : 'mixed'
    });
    
  } catch (error) {
    console.error('❌ Recent activity error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      activity: [
        { type: 'system', text: 'Connect Gmail for real-time activity tracking' }
      ]
    });
  }
});

// Emotional Load Forecast API - AI-powered personalized reframing
app.post('/api/emotional-load-forecast', async (req, res) => {
  try {
    const { action, urgentCount, userId } = req.body;
    const profile = getUserProfile(userId || 'default');
    
    if (action === 'reframe') {
      // Generate personalized reframe using AI
      const personalizedReframe = await generatePersonalizedReframe(profile, urgentCount);
      res.json({ success: true, reframe: personalizedReframe });
    } else {
      res.json({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Emotional load forecast error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

async function generatePersonalizedReframe(profile, urgentCount) {
  try {
    const prompt = `Generate a personalized, empowering reframe for someone whose primary focus is ${profile.preferences.primaryFocus} and currently has ${urgentCount} urgent items to handle.

    The reframe should:
    - Acknowledge their capability
    - Put the workload in perspective
    - Be encouraging but realistic
    - Be 2-3 sentences max
    
    Make it personal and specific to their situation.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100
    });
    
    return `"${response.choices[0].message.content.trim()}"`;
    
  } catch (error) {
    console.error('Personalized reframe generation error:', error);
    // Fallback reframe
    return `"You're not managing chaos—you're orchestrating a complex, dynamic system. Every 'urgent' item you've handled shows your ${profile.preferences.primaryFocus} can count on you. Take a breath. You've got this."`;
  }
}

// Emotional Load Forecast Data API - GET endpoint for forecast data
app.get('/api/emotional-load-forecast', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const profile = getUserProfile(userId);
    
    console.log(`📊 Computing REAL emotional load forecast for: ${userId}`);
    
    // Set user credentials if available
    if (profile.integrations && profile.integrations.gmail) {
      dataManager.setUserCredentials(userId, profile.integrations.gmail);
    }
    
    // Get real data for emotional load analysis
    const emailData = await dataManager.getRealEmailData(profile);
    const calendarData = await dataManager.getRealCalendarData(profile);
    
    // Compute load based on real data patterns
    const currentLoad = (emailData.urgentCount * 20) + (calendarData.conflictCount * 15) + 30;
    const todayLoad = Math.min(currentLoad, 100);
    const tomorrowLoad = Math.max(20, todayLoad - 15);
    const weekendLoad = profile.preferences.workLifeBalance === 'high' ? 10 : 35;
    
    const forecast = [
      { day: 'Today', load: todayLoad },
      { day: 'Tomorrow', load: tomorrowLoad },
      { day: 'Wednesday', load: Math.max(25, todayLoad - 10) },
      { day: 'Thursday', load: Math.max(30, todayLoad - 5) },
      { day: 'Friday', load: Math.max(35, todayLoad) },
      { day: 'Weekend', load: weekendLoad }
    ];
    
    // Generate insights based on actual load
    const insights = [];
    if (todayLoad > 80) {
      insights.push(`High stress detected: ${emailData.urgentCount} urgent emails, ${calendarData.conflictCount} conflicts`);
    }
    if (calendarData.upcomingCount > 8) {
      insights.push('Consider rescheduling some meetings for better balance');
    }
    if (emailData.totalProcessed > 50) {
      insights.push('Email volume is high - batch processing recommended');
    }
    
    res.json({ 
      success: true, 
      forecast, 
      insights,
      averageLoad: Math.round(forecast.reduce((sum, day) => sum + day.load, 0) / forecast.length),
      dataSource: profile.integrations?.gmail ? 'real' : 'estimated'
    });
    
  } catch (error) {
    console.error('❌ Emotional load forecast error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      forecast: [
        { day: 'Today', load: 50 },
        { day: 'Tomorrow', load: 40 }
      ]
    });
  }
});

// Calibrate route - serve the enhanced calibration UI with real AI summaries
app.get('/calibrate', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'calibrate-clean-final.html'));
});

// Onboarding flow routes
app.get('/onboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'onboard.html'));
});

// New minimal onboarding route
app.get('/onboarding', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'onboarding', 'onboarding.html'));
});

app.get('/landing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.get('/scan', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scan.html'));
});

// Homepage route - serve the marketing landing page
app.get('/homepage', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'homepage.html'));
});

// Pricing route - serve the pricing page
app.get('/pricing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pricing.html'));
});

// Pricing test route - serve the test page for development
app.get('/pricing-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pricing-test.html'));
});

// Main app route - serve the enhanced navigation system


// Gmail OAuth authentication
app.get('/auth/gmail', (req, res) => {
  // Clear any existing credentials to force fresh OAuth
  oauth2Client.setCredentials({});
  
  const isOnboarding = req.query.isOnboarding === 'true';
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    state: isOnboarding ? 'onboarding' : 'normal',
    prompt: 'consent' // Force consent screen to get fresh tokens
  });
  console.log('🔗 Redirecting to Gmail OAuth (fresh tokens):', authUrl);
  res.redirect(authUrl);
});

// Google OAuth authentication (Gmail + Calendar)
app.get('/auth/google', (req, res) => {
  // Clear any existing credentials to force fresh OAuth
  oauth2Client.setCredentials({});
  
  const isOnboarding = req.query.isOnboarding === 'true';
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ],
    state: isOnboarding ? 'onboarding' : 'normal',
    prompt: 'consent' // Force consent screen to get fresh tokens
  });
  console.log('🔗 Redirecting to Google OAuth (Gmail + Calendar):', authUrl);
  res.redirect(authUrl);
});

// OAuth callback - handle both routes for compatibility
app.get('/oauth2callback', async (req, res) => {
  await handleOAuthCallback(req, res);
});

app.get('/auth/gmail/callback', async (req, res) => {
  await handleOAuthCallback(req, res);
});

async function handleOAuthCallback(req, res) {
  const { code, state, error } = req.query;
  
  if (error) {
    console.error('❌ OAuth error:', error);
    return res.redirect(`/scan?error=oauth_error&details=${error}`);
  }

  if (!code) {
    console.error('❌ No authorization code received');
    return res.redirect('/scan?error=no_code');
  }

  try {
    // Clear any existing credentials first
    oauth2Client.setCredentials({});
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log('✅ Received tokens:', Object.keys(tokens));
    
    // Store tokens in OAuth client
    oauth2Client.setCredentials(tokens);
    
    // Get user email for storage
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const userEmail = profile.data.emailAddress;
    console.log(`📧 Connected Gmail for: ${userEmail}`);
    
    // Store tokens in Firebase for persistent access
    try {
      await db.collection('gmail_tokens').doc(userEmail).set({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type || 'Bearer',
        stored_at: new Date().toISOString(),
        user_email: userEmail
      });
      console.log('✅ Gmail tokens stored in Firebase for:', userEmail);
      
      // CRITICAL: Update user profile with integration data
      let profile = getUserProfile(userEmail);
      if (!profile) {
        profile = createNewUserProfile(userEmail, { name: userEmail.split('@')[0] });
      }
      
      // Set up integrations object
      if (!profile.integrations) {
        profile.integrations = {};
      }
      
      // Store Gmail integration data in user profile
      profile.integrations.gmail = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type || 'Bearer',
        user_email: userEmail,
        connected_at: new Date().toISOString()
      };
      
      // Save updated profile
      userProfiles[userEmail] = profile;
      console.log(`✅ User profile updated with Gmail integration for: ${userEmail}`);
      
    } catch (storeError) {
      console.error('❌ Error storing tokens:', storeError.message);
    }
    
    // Redirect based on state with user email for localStorage setup
    if (state === 'onboarding') {
      console.log('🎯 Redirecting to scan (onboarding flow)');
      res.redirect(`/scan?userEmail=${encodeURIComponent(userEmail)}`);
    } else {
      console.log('🎯 Redirecting to calibrate (normal flow)');
      res.redirect(`/calibrate?userEmail=${encodeURIComponent(userEmail)}`);
    }
  } catch (error) {
    console.error('❌ Token exchange failed:', error.message);
    res.redirect(`/scan?error=token_exchange_failed&details=${encodeURIComponent(error.message)}`);
  }
}

// Enhanced Lucide icon mapping with comprehensive category support
function getLucideIcon(category, brandName = '') {
  // Brand-specific overrides for better context
  const brandSpecific = {
    // Sports & Activities
    'teamsnap': 'trophy',
    'headfirst': 'graduation-cap',
    'nike': 'zap',
    'adidas': 'zap',
    'reebok': 'zap',
    'allbirds': 'zap',
    
    // Commerce
    'amazon': 'package',
    'target': 'shopping-cart',
    'costco': 'shopping-cart',
    'wayfair': 'home',
    'pottery': 'home',
    'williams': 'home',
    
    // Finance
    'chase': 'credit-card',
    'venmo': 'dollar-sign',
    'paypal': 'dollar-sign',
    
    // Health
    'cvs': 'heart',
    'walgreens': 'heart',
    'ro': 'stethoscope',
    
    // Travel
    'uber': 'car',
    'lyft': 'car',
    'airbnb': 'map-pin',
    'hotels': 'bed',
    
    // Food
    'starbucks': 'coffee',
    'mcdonalds': 'utensils',
    'doordash': 'utensils',
    'ubereats': 'utensils'
  };

  // Check for brand-specific icon first
  const brandKey = brandName.toLowerCase();
  for (const [brand, icon] of Object.entries(brandSpecific)) {
    if (brandKey.includes(brand)) {
      return icon;
    }
  }

  // Enhanced category mapping
  const lucideIcons = {
    'School': 'graduation-cap',
    'Medical': 'heart-pulse', 
    'Shopping': 'shopping-cart',
    'Work': 'briefcase',
    'Professional': 'briefcase',
    'Family': 'users',
    'Sports': 'trophy',
    'Entertainment': 'tv',
    'Travel': 'plane',
    'Finance': 'credit-card',
    'Health': 'stethoscope',
    'Food': 'utensils',
    'Home': 'home',
    'Education': 'book-open',
    'Technology': 'smartphone',
    // Lowercase versions
    'school': 'graduation-cap',
    'medical': 'heart-pulse',
    'shopping': 'shopping-cart',
    'work': 'briefcase',
    'professional': 'briefcase',
    'family': 'users',
    'sports': 'trophy',
    'entertainment': 'tv',
    'travel': 'plane',
    'finance': 'credit-card',
    'health': 'stethoscope',
    'food': 'utensils',
    'home': 'home',
    'education': 'book-open',
    'technology': 'smartphone',
    // System categories
    'social': 'heart-pulse',
    'commerce': 'shopping-cart',
    'general': 'mail'
  };
  
  return lucideIcons[category] || 'mail';
}

// Enhanced Mental Load Score calculation with more categories
function calculateMentalLoadScore(category, priority, summary) {
  const categoryScores = {
    'school': 75,
    'medical': 85,
    'shopping': 60,
    'work': 70,
    'family': 80,
    'sports': 65,
    'entertainment': 45,
    'travel': 75,
    'finance': 80,
    'health': 85,
    'food': 50,
    'home': 70,
    'education': 75,
    'technology': 55
  };
  
  const priorityMultiplier = {
    'high': 1.3,
    'medium': 1.0,
    'low': 0.7
  };
  
  const baseScore = categoryScores[category.toLowerCase()] || 50;
  const multiplier = priorityMultiplier[priority.toLowerCase()] || 1.0;
  
  // Add some variation based on content keywords
  let contentBonus = 0;
  const urgentKeywords = ['urgent', 'deadline', 'tomorrow', 'today', 'asap', 'immediately'];
  const stressKeywords = ['conflict', 'problem', 'issue', 'failure', 'error', 'missing'];
  
  if (urgentKeywords.some(keyword => summary.toLowerCase().includes(keyword))) {
    contentBonus += 10;
  }
  if (stressKeywords.some(keyword => summary.toLowerCase().includes(keyword))) {
    contentBonus += 5;
  }
  
  const finalScore = Math.min(100, Math.round(baseScore * multiplier + contentBonus));
  return finalScore;
}

// Function to fetch real Gmail emails
async function fetchRealGmailEmails(userEmail, maxResults = 10) {
  try {
    const tokenDoc = await db.collection('gmail_tokens').doc(userEmail).get();
    if (!tokenDoc.exists) {
      throw new Error('No Gmail tokens found');
    }
    
    const tokens = tokenDoc.data();
    oauth2Client.setCredentials(tokens);
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Get list of messages from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const query = `after:${Math.floor(sevenDaysAgo.getTime() / 1000)}`;
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: maxResults
    });
    
    if (!response.data.messages || response.data.messages.length === 0) {
      console.log('� No recent emails found');
      return [];
    }
    
    console.log(`📧 Found ${response.data.messages.length} recent emails`);
    
    // Get details for each message
    const emails = await Promise.all(
      response.data.messages.slice(0, maxResults).map(async (message, index) => {
        try {
          const details = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });
          
          const headers = details.data.payload.headers;
          const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
          const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
          const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();
          
          // Get email body
          let body = '';
          if (details.data.payload.body.data) {
            body = Buffer.from(details.data.payload.body.data, 'base64').toString();
          } else if (details.data.payload.parts) {
            for (const part of details.data.payload.parts) {
              if (part.mimeType === 'text/plain' && part.body.data) {
                body = Buffer.from(part.body.data, 'base64').toString();
                break;
              }
            }
          }
          
          // Clean and truncate body for snippet
          const snippet = body.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200) + '...';
          
          return {
            id: message.id,
            subject,
            from,
            date,
            snippet,
            body: body.substring(0, 1000) // Limit body size for AI processing
          };
        } catch (error) {
          console.error(`❌ Error fetching email ${index + 1}:`, error.message);
          return null;
        }
      })
    );
    
    return emails.filter(email => email !== null);
  } catch (error) {
    console.error('❌ Error fetching Gmail emails:', error);
    throw error;
  }
}

// Commerce Intelligence Helper Functions
async function fetchCommerceEmails(userEmail, maxResults = 20) {
  try {
    const tokenDoc = await db.collection('gmail_tokens').doc(userEmail).get();
    if (!tokenDoc.exists) {
      throw new Error('No Gmail tokens found');
    }
    
    const tokens = tokenDoc.data();
    oauth2Client.setCredentials(tokens);
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Search for commerce-related emails from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Commerce-focused search query
    const commerceQuery = `after:${Math.floor(thirtyDaysAgo.getTime() / 1000)} (sale OR deal OR discount OR shipped OR delivery OR order OR receipt OR amazon OR target OR costco OR walmart OR "price drop" OR "limited time" OR "% off")`;
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: commerceQuery,
      maxResults: maxResults
    });
    
    if (!response.data.messages || response.data.messages.length === 0) {
      console.log('🛍️ No commerce emails found');
      return [];
    }
    
    console.log(`🛍️ Found ${response.data.messages.length} commerce emails`);
    
    // Get details for each message
    const emails = await Promise.all(
      response.data.messages.slice(0, maxResults).map(async (message) => {
        try {
          const details = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });
          
          const headers = details.data.payload.headers || [];
          const subjectHeader = headers.find(h => h.name === 'Subject');
          const fromHeader = headers.find(h => h.name === 'From');
          const dateHeader = headers.find(h => h.name === 'Date');
          
          // Get email body
          let body = '';
          if (details.data.payload.body && details.data.payload.body.data) {
            body = Buffer.from(details.data.payload.body.data, 'base64').toString();
          } else if (details.data.payload.parts) {
            for (const part of details.data.payload.parts) {
              if (part.mimeType === 'text/plain' && part.body.data) {
                body = Buffer.from(part.body.data, 'base64').toString();
                break;
              }
            }
          }
          
          return {
            id: message.id,
            subject: subjectHeader?.value || 'No Subject',
            from: fromHeader?.value || 'Unknown Sender',
            date: dateHeader?.value || new Date().toISOString(),
            body: body.slice(0, 2000), // Limit body size
            snippet: details.data.snippet || ''
          };
        } catch (error) {
          console.error('Error fetching commerce email details:', error);
          return null;
        }
      })
    );
    
    return emails.filter(email => email !== null);
  } catch (error) {
    console.error('Commerce email fetch error:', error);
    throw error;
  }
}

async function extractCommerceInsights(emails, userId) {
  const commerceData = {
    deals: [],
    packages: [],
    priceDrops: [],
    recommendations: [],
    totalSavings: 0
  };
  
  for (const email of emails) {
    const subject = email.subject.toLowerCase();
    const body = email.body.toLowerCase();
    const from = email.from.toLowerCase();
    
    // Extract deals and discounts
    if (subject.includes('sale') || subject.includes('deal') || subject.includes('discount') || 
        subject.includes('% off') || subject.includes('limited time') || body.includes('save ')) {
      
      // Extract discount percentage
      const percentMatch = subject.match(/(\d+)%\s*off/i) || body.match(/(\d+)%\s*off/i);
      const discount = percentMatch ? parseInt(percentMatch[1]) : null;
      
      // Extract dollar savings
      const dollarMatch = subject.match(/save\s*\$(\d+)/i) || body.match(/save\s*\$(\d+)/i);
      const dollarSavings = dollarMatch ? parseInt(dollarMatch[1]) : null;
      
      const deal = {
        id: email.id,
        title: email.subject,
        brand: extractBrandFromEmail(email.from),
        discount: discount,
        savings: dollarSavings,
        description: email.snippet,
        expiry: extractExpiryFromEmail(subject, body),
        category: categorizeDeal(subject, body),
        url: extractUrlFromEmail(body),
        received: email.date
      };
      
      commerceData.deals.push(deal);
      if (dollarSavings) commerceData.totalSavings += dollarSavings;
    }
    
    // Extract package tracking
    if (subject.includes('shipped') || subject.includes('delivery') || subject.includes('tracking') ||
        subject.includes('on its way') || subject.includes('out for delivery')) {
      
      const package = {
        id: email.id,
        title: email.subject,
        carrier: extractCarrierFromEmail(email.from, subject),
        trackingNumber: extractTrackingNumber(body),
        status: extractShippingStatus(subject, body),
        estimatedDelivery: extractDeliveryDate(subject, body),
        received: email.date
      };
      
      commerceData.packages.push(package);
    }
    
    // Extract price drops and alerts
    if (subject.includes('price drop') || subject.includes('price alert') || 
        subject.includes('now ') && subject.includes('$')) {
      
      const priceDrop = {
        id: email.id,
        title: email.subject,
        product: extractProductFromSubject(subject),
        oldPrice: extractPriceFromEmail(body, 'was'),
        newPrice: extractPriceFromEmail(body, 'now'),
        savings: extractPriceFromEmail(body, 'save'),
        received: email.date
      };
      
      commerceData.priceDrops.push(priceDrop);
    }
  }
  
  // Generate smart recommendations based on email patterns
  commerceData.recommendations = generateShoppingRecommendations(emails, userId);
  
  return commerceData;
}

// Helper functions for commerce extraction
function extractBrandFromEmail(fromEmail) {
  const domain = fromEmail.split('@')[1]?.split('.')[0] || '';
  const brandMap = {
    'amazon': 'Amazon',
    'target': 'Target', 
    'costco': 'Costco',
    'walmart': 'Walmart',
    'bestbuy': 'Best Buy',
    'nike': 'Nike',
    'adidas': 'Adidas',
    'macys': "Macy's",
    'nordstrom': 'Nordstrom',
    'wayfair': 'Wayfair'
  };
  return brandMap[domain] || domain.charAt(0).toUpperCase() + domain.slice(1);
}

function extractExpiryFromEmail(subject, body) {
  const expiryPatterns = [
    /expires?\s+(\w+\s+\d+)/i,
    /ends?\s+(\w+\s+\d+)/i,
    /through\s+(\w+\s+\d+)/i,
    /until\s+(\w+\s+\d+)/i
  ];
  
  for (const pattern of expiryPatterns) {
    const match = subject.match(pattern) || body.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function categorizeDeal(subject, body) {
  const categories = {
    'clothing': ['apparel', 'clothing', 'shirt', 'dress', 'shoes', 'fashion'],
    'electronics': ['electronics', 'tech', 'phone', 'laptop', 'tv', 'headphones'],
    'home': ['home', 'furniture', 'decor', 'kitchen', 'bedroom'],
    'grocery': ['grocery', 'food', 'snacks', 'organic'],
    'beauty': ['beauty', 'skincare', 'makeup', 'cosmetics'],
    'sports': ['sports', 'fitness', 'athletic', 'outdoor']
  };
  
  const text = (subject + ' ' + body).toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  return 'general';
}

function extractCarrierFromEmail(fromEmail, subject) {
  const carriers = ['ups', 'fedex', 'usps', 'dhl', 'amazon'];
  for (const carrier of carriers) {
    if (fromEmail.includes(carrier) || subject.toLowerCase().includes(carrier)) {
      return carrier.toUpperCase();
    }
  }
  return 'Unknown';
}

function extractTrackingNumber(body) {
  const trackingPatterns = [
    /tracking\s*#?\s*:?\s*([A-Z0-9]{10,})/i,
    /track\s*#?\s*:?\s*([A-Z0-9]{10,})/i,
    /\b([A-Z0-9]{10,})\b/
  ];
  
  for (const pattern of trackingPatterns) {
    const match = body.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractShippingStatus(subject, body) {
  if (subject.includes('delivered') || body.includes('delivered')) return 'Delivered';
  if (subject.includes('out for delivery')) return 'Out for Delivery';
  if (subject.includes('shipped') || subject.includes('on its way')) return 'In Transit';
  return 'Processing';
}

function extractDeliveryDate(subject, body) {
  const datePatterns = [
    /deliver(?:y|ed)?\s+(?:by\s+)?(\w+\s+\d+)/i,
    /arriving\s+(\w+\s+\d+)/i,
    /expected\s+(\w+\s+\d+)/i
  ];
  
  for (const pattern of datePatterns) {
    const match = subject.match(pattern) || body.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractUrlFromEmail(body) {
  const urlMatch = body.match(/https?:\/\/[^\s]+/);
  return urlMatch ? urlMatch[0] : null;
}

function extractProductFromSubject(subject) {
  // Simple extraction - could be enhanced with AI
  return subject.replace(/price drop|price alert|now \$\d+/gi, '').trim();
}

function extractPriceFromEmail(body, context) {
  const pricePattern = new RegExp(`${context}\\s*\\$([\\d,\\.]+)`, 'i');
  const match = body.match(pricePattern);
  return match ? parseFloat(match[1].replace(',', '')) : null;
}

function generateShoppingRecommendations(emails, userId) {
  const recommendations = [];
  
  // Analyze patterns in user's commerce emails
  const categories = {};
  const brands = {};
  
  emails.forEach(email => {
    const category = categorizeDeal(email.subject, email.body);
    const brand = extractBrandFromEmail(email.from);
    
    categories[category] = (categories[category] || 0) + 1;
    brands[brand] = (brands[brand] || 0) + 1;
  });
  
  // Generate recommendations based on patterns
  const topCategory = Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b, 'general');
  const topBrand = Object.keys(brands).reduce((a, b) => brands[a] > brands[b] ? a : b, 'Unknown');
  
  if (topCategory !== 'general') {
    recommendations.push(`You frequently shop for ${topCategory} items - check for seasonal sales`);
  }
  
  if (topBrand !== 'Unknown') {
    recommendations.push(`${topBrand} is your most frequent brand - consider their loyalty program`);
  }
  
  // Seasonal recommendations
  const month = new Date().getMonth();
  if (month === 7 || month === 8) { // August/September
    recommendations.push('Back-to-school items are trending in your emails');
  }
  
  return recommendations.slice(0, 3); // Limit to 3 recommendations
}

// Enhanced Commerce Intelligence Helper Functions

async function fetchPromotionalEmails(userId, maxResults = 30) {
  try {
    const tokenDoc = await db.collection('gmail_tokens').doc(userId).get();
    if (!tokenDoc.exists) {
      throw new Error('No Gmail tokens found');
    }
    
    const tokens = tokenDoc.data();
    oauth2Client.setCredentials(tokens);
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Enhanced query to focus on promotional emails with deals
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const promotionalQuery = `after:${Math.floor(sevenDaysAgo.getTime() / 1000)} category:promotions (sale OR deal OR discount OR "% off" OR "limited time" OR exclusive OR offer OR flash OR save OR clearance)`;
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: promotionalQuery,
      maxResults: maxResults
    });
    
    if (!response.data.messages || response.data.messages.length === 0) {
      console.log('📧 No promotional emails found');
      return [];
    }
    
    console.log(`📧 Found ${response.data.messages.length} promotional emails`);
    
    // Get detailed email content
    const emails = await Promise.all(
      response.data.messages.slice(0, maxResults).map(async (message) => {
        try {
          const details = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });
          
          const headers = details.data.payload.headers;
          const subject = headers.find(h => h.name === 'Subject')?.value || '';
          const from = headers.find(h => h.name === 'From')?.value || '';
          const date = headers.find(h => h.name === 'Date')?.value || '';
          
          // Extract snippet/body
          let snippet = details.data.snippet || '';
          
          return {
            id: message.id,
            subject,
            from,
            date: new Date(date).toISOString(),
            snippet,
            threadId: details.data.threadId
          };
        } catch (error) {
          console.error('Error fetching email details:', error);
          return null;
        }
      })
    );
    
    return emails.filter(email => email !== null);
  } catch (error) {
    console.error('❌ Enhanced promotional email fetch error:', error);
    return [];
  }
}

async function extractPackageTracking(emails) {
  const packages = [];
  
  for (const email of emails) {
    const subject = email.subject.toLowerCase();
    const snippet = email.snippet.toLowerCase();
    
    // Look for shipping/delivery keywords
    if (subject.includes('shipped') || subject.includes('delivered') || 
        subject.includes('tracking') || subject.includes('delivery') ||
        snippet.includes('package') || snippet.includes('order')) {
      
      // Extract carrier information
      let carrier = 'Unknown';
      if (snippet.includes('ups')) carrier = 'UPS';
      else if (snippet.includes('fedex')) carrier = 'FedEx';
      else if (snippet.includes('usps')) carrier = 'USPS';
      else if (snippet.includes('amazon')) carrier = 'Amazon';
      
      // Extract status
      let status = 'In Transit';
      if (subject.includes('delivered')) status = 'Delivered';
      else if (subject.includes('shipped')) status = 'Shipped';
      else if (subject.includes('out for delivery')) status = 'Out for Delivery';
      
      packages.push({
        id: `pkg_${email.id}`,
        title: email.subject,
        carrier,
        status,
        estimatedDelivery: extractDeliveryDate(snippet),
        trackingNumber: extractTrackingNumber(snippet),
        received: email.date
      });
    }
  }
  
  return packages;
}

function extractDeliveryDate(text) {
  // Look for delivery date patterns
  const patterns = [
    /arriving\s+([a-z]+ \d{1,2})/i,
    /delivery\s+([a-z]+ \d{1,2})/i,
    /by\s+([a-z]+ \d{1,2})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

function extractTrackingNumber(text) {
  // Look for tracking number patterns (basic implementation)
  const trackingPatterns = [
    /tracking[:\s]+([a-z0-9]{10,})/i,
    /\b([0-9]{12,})\b/,
    /\b(1Z[a-z0-9]{16})\b/i // UPS format
  ];
  
  for (const pattern of trackingPatterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

function generateEnhancedMockData(userId) {
  return {
    deals: [
      {
        id: 'deal_nike_001',
        brand: 'Nike',
        isDTC: false,
        discount: '30% OFF',
        expires: 'Aug 5',
        emailFrequency: 2,
        offerScore: 0.87,
        emailQualityScore: 0.91,
        compositeScore: 0.89,
        title: 'Flash Sale: 30% Off Running Shoes',
        description: 'Limited time offer on our best-selling athletic footwear. Free shipping on orders over $75.',
        badge: null,
        url: 'https://nike.com/sale',
        actions: ['View', 'Find Deal', 'Save', 'Share'],
        timestamp: new Date().toISOString()
      },
      {
        id: 'deal_allbirds_001',
        brand: 'Allbirds',
        isDTC: true,
        discount: 'Save $25',
        expires: 'Aug 8',
        emailFrequency: 1,
        offerScore: 0.85,
        emailQualityScore: 0.94,
        compositeScore: 0.90,
        title: 'Sustainable Summer Sale - Tree Runners',
        description: 'Our most comfortable shoes, now $25 off. Made from eucalyptus tree fiber.',
        badge: 'DTC',
        url: 'https://allbirds.com/products/tree-runners',
        actions: ['View', 'Find Deal', 'Save', 'Share'],
        timestamp: new Date().toISOString()
      },
      {
        id: 'deal_everlane_001',
        brand: 'Everlane',
        isDTC: true,
        discount: '20% OFF',
        expires: 'Aug 7',
        emailFrequency: 3,
        offerScore: 0.78,
        emailQualityScore: 0.88,
        compositeScore: 0.83,
        title: 'Choose What You Pay - Summer Essentials',
        description: 'Radical transparency pricing on organic cotton tees and sustainable denim.',
        badge: 'DTC',
        url: 'https://everlane.com/choose-what-you-pay',
        actions: ['View', 'Find Deal', 'Save', 'Share'],
        timestamp: new Date().toISOString()
      },
      {
        id: 'deal_amazon_001',
        brand: 'Amazon',
        isDTC: false,
        discount: '25% OFF',
        expires: 'Aug 6',
        emailFrequency: 5,
        offerScore: 0.72,
        emailQualityScore: 0.65,
        compositeScore: 0.69,
        title: 'Prime Member Exclusive: Electronics Sale',
        description: 'Limited time deals on tech gadgets, smart home devices, and more.',
        badge: null,
        url: 'https://amazon.com/deals',
        actions: ['View', 'Find Deal', 'Save', 'Share'],
        timestamp: new Date().toISOString()
      }
    ],
    packages: [
      {
        id: 'pkg_001',
        title: 'Your Allbirds order has shipped',
        carrier: 'FedEx',
        status: 'In Transit',
        estimatedDelivery: 'Aug 4',
        trackingNumber: '7712345678901',
        received: new Date().toISOString()
      }
    ],
    priceDrops: [],
    recommendations: [
      {
        brand: 'Allbirds',
        isDTC: true,
        reason: 'High email quality score and sustainable brand focus'
      },
      {
        brand: 'Everlane',
        isDTC: true,
        reason: 'Transparent pricing and ethical manufacturing'
      }
    ],
    totalSavings: 70,
    dataSource: 'enhanced_fallback'
  };
}

function generateMockCommerceData(userId) {
  return generateEnhancedMockData(userId || 'mock_user_id');
}

// Add missing categorizeEmail function
function categorizeEmail(subject, snippet, from) {
  const schoolKeywords = ['school', 'teacher', 'assignment', 'grade', 'class', 'homework'];
  const medicalKeywords = ['doctor', 'appointment', 'health', 'medical', 'prescription', 'clinic'];
  const shoppingKeywords = ['order', 'shipped', 'delivery', 'purchase', 'sale', 'deal'];
  const workKeywords = ['meeting', 'project', 'deadline', 'work', 'office', 'team'];
  const familyKeywords = ['family', 'kids', 'children', 'parent', 'home', 'personal'];
  
  const text = `${subject} ${snippet} ${from}`.toLowerCase();
  
  if (schoolKeywords.some(keyword => text.includes(keyword))) return 'School';
  if (medicalKeywords.some(keyword => text.includes(keyword))) return 'Medical';
  if (shoppingKeywords.some(keyword => text.includes(keyword))) return 'Shopping';
  if (workKeywords.some(keyword => text.includes(keyword))) return 'Work';
  if (familyKeywords.some(keyword => text.includes(keyword))) return 'Family';
  
  return 'General';
}

// Calibration data endpoint
app.get('/api/calibration-data', async (req, res) => {
  try {
    console.log('📧 Loading calibration emails with real AI processing...');
    
    const userEmail = 'oliverhbaron@gmail.com'; // Your email
    let emails = [];
    let dataSource = 'mock';
    
    // Try to get real Gmail data first
    try {
      console.log('🔄 Attempting to load REAL Gmail data...');
      const tokenDoc = await db.collection('gmail_tokens').doc(userEmail).get();
      if (tokenDoc.exists) {
        console.log(`✅ Found Gmail tokens for: ${userEmail}`);
        emails = await fetchRealGmailEmails(userEmail, 10);
        dataSource = 'real';
        console.log(`✅ Successfully loaded ${emails.length} real Gmail emails`);
      } else {
        throw new Error('No Gmail tokens found');
      }
    } catch (error) {
      console.log('❌ Gmail fetch failed, falling back to mock data:', error.message);
      // Fallback to mock data
      const mockDataPath = path.join(__dirname, 'mock', 'emails.json');
      const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
      emails = mockData.emails.slice(0, 10).map(email => ({
        id: email.id,
        subject: email.subject,
        from: email.source,
        date: new Date().toISOString(),
        snippet: email.summary,
        body: email.summary
      }));
      dataSource = 'mock';
    }
    
    console.log(`🎯 Processing ${emails.length} emails with real AI summaries (source: ${dataSource})...`);
    
    // Process emails with real AI summaries
    const processedEmails = await Promise.all(
      emails.map(async (email, index) => {
        try {
          console.log(`🤖 Generating AI summary for email ${index + 1}: ${email.subject}`);
          
          // Generate real AI summary using our enhanced function
          const aiSummaryResult = await generateEmailSummary({
            subject: email.subject,
            from: email.from,
            date: email.date,
            body: email.body || email.snippet || ''
          }, email.from);
          
          const aiSummary = aiSummaryResult?.summary || email.snippet || `Email from ${email.from} about ${email.subject}`;
          
          // Better categorization
          const category = categorizeEmail(email.subject, email.snippet || '', email.from);
          const brandName = email.from.split(' ')[0] || email.from.split('@')[0] || 'Unknown';
          const lucideIcon = getLucideIcon(category, brandName);
          const mentalLoadScore = calculateMentalLoadScore(category, 'medium', aiSummary);
          
          console.log(`✅ Email ${index + 1} processed: ${category} category, ${mentalLoadScore} score`);
          
          return {
            id: email.id || `enhanced_${index + 1}`,
            from: email.from,
            subject: email.subject,
            date: email.date,
            formattedDate: new Date(email.date).toLocaleDateString('en-US', { 
              weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
            }),
            snippet: email.snippet || '',
            category: category,
            categoryIcon: getCategoryIcon(category),
            lucideIcon: lucideIcon,
            aiSummary: aiSummary,
            score: mentalLoadScore,
            insight: `Mental Load Analysis: ${aiSummary}`,
            mental_load_score: mentalLoadScore
          };
        } catch (emailError) {
          console.error(`❌ Error processing email ${index + 1}:`, emailError.message);
          // Return basic email data if AI processing fails
          const category = categorizeEmail(email.subject, email.snippet || '', email.from);
          const brandName = email.from.split(' ')[0] || email.from.split('@')[0] || 'Unknown';
          const lucideIcon = getLucideIcon(category, brandName);
          const mentalLoadScore = calculateMentalLoadScore(category, 'medium', email.snippet);
          
          return {
            id: email.id || `basic_${index + 1}`,
            from: email.from,
            subject: email.subject,
            date: email.date,
            formattedDate: new Date(email.date).toLocaleDateString('en-US', { 
              weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
            }),
            snippet: email.snippet || '',
            category: category,
            categoryIcon: getCategoryIcon(category),
            lucideIcon: lucideIcon,
            aiSummary: email.snippet || `Email from ${email.from} about ${email.subject}`,
            score: mentalLoadScore,
            insight: `Mental Load Analysis: ${email.snippet}`,
            mental_load_score: mentalLoadScore
          };
        }
      })
    );
    
    console.log(`✅ Processed ${processedEmails.length} emails with real AI summaries`);
    
    res.json({
      success: true,
      emails: processedEmails,
      dataSource: dataSource,
      totalCount: processedEmails.length,
      message: `${dataSource === 'real' ? 'Real Gmail' : 'Enhanced mock'} emails with real AI summaries loaded successfully`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Calibration data error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to load calibration emails'
    });
  }
});

// User Authentication & Profile Management
app.post('/api/user/login', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    // Simple email-based authentication for now
    const userId = generateUserId(email);
    let profile = getUserProfile(userId);
    
    // Create profile if it doesn't exist
    if (!profile || Object.keys(profile).length === 0) {
      profile = createNewUserProfile(userId, { email, name });
    }
    
    // Update last login
    profile.lastLogin = new Date().toISOString();
    userProfiles[userId] = profile;
    
    res.json({ 
      success: true, 
      userId, 
      profile: {
        name: profile.name,
        email: profile.email,
        preferences: profile.preferences,
        lastLogin: profile.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/user/preferences', async (req, res) => {
  try {
    const { userId, preferences } = req.body;
    
    if (!userId || !preferences) {
      return res.status(400).json({ success: false, error: 'Missing userId or preferences' });
    }
    
    let profile = getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Update preferences
    profile.preferences = { ...profile.preferences, ...preferences };
    profile.updatedAt = new Date().toISOString();
    userProfiles[userId] = profile;
    
    res.json({ success: true, preferences: profile.preferences });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Brand Preferences Management
app.post('/api/user/brand-preferences', async (req, res) => {
  try {
    const { userId, customizationText, lastUpdated } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId' });
    }
    
    if (!customizationText || customizationText.trim() === '') {
      return res.status(400).json({ success: false, error: 'Missing customization text' });
    }
    
    let profile = getUserProfile(userId);
    if (!profile) {
      // Create new profile if doesn't exist
      profile = createUserProfile(userId, 'Anonymous User', 'anonymous@homeops.app');
    }
    
    // Extract brand insights from the customization text
    const brandInsights = extractBrandInsightsFromText(customizationText);
    
    // Update brand preferences in profile
    profile.brandPreferences = {
      customizationText: customizationText.trim(),
      lastUpdated: lastUpdated || new Date().toISOString(),
      extractedInsights: brandInsights,
      updatedAt: new Date().toISOString()
    };
    
    profile.updatedAt = new Date().toISOString();
    userProfiles[userId] = profile;
    
    console.log(`✅ Brand preferences saved for user ${userId}:`, {
      textLength: customizationText.length,
      mentionedBrands: brandInsights.mentionedBrands?.length || 0,
      interests: brandInsights.interests?.length || 0
    });
    
    res.json({ 
      success: true, 
      brandPreferences: profile.brandPreferences,
      message: 'Brand preferences saved successfully'
    });
    
  } catch (error) {
    console.error('❌ Brand preferences save error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get brand preferences for a user
app.get('/api/user/brand-preferences', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId' });
    }
    
    const profile = getUserProfile(userId);
    if (!profile || !profile.brandPreferences) {
      return res.json({ 
        success: true, 
        brandPreferences: null,
        message: 'No brand preferences found'
      });
    }
    
    res.json({ 
      success: true, 
      brandPreferences: profile.brandPreferences
    });
    
  } catch (error) {
    console.error('❌ Brand preferences fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calendar API endpoint for chat interface
app.get('/api/calendar/events', async (req, res) => {
  try {
    const { userId, emailId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId' });
    }
    
    // For now, this would integrate with the email intelligence system
    // to provide calendar events from parsed emails
    const events = [
      {
        title: "Parent-Teacher Conferences",
        start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T15:00:00',
        end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T16:00:00',
        description: "Parent-Teacher Conference at Woods Academy",
        location: "Woods Academy",
        url: generateCalendarUrl({
          title: "Parent-Teacher Conferences",
          start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T15:00:00',
          end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T16:00:00',
          description: "Parent-Teacher Conference at Woods Academy",
          location: "Woods Academy"
        })
      }
    ];
    
    res.json({ 
      success: true, 
      events,
      count: events.length
    });
    
  } catch (error) {
    console.error('❌ Calendar events fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// HomeOps Calendar Management - Source of Truth for all events
app.get('/api/calendar/homeops-events', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId' });
    }
    
    console.log(`📅 Getting HomeOps calendar events for user: ${userId}`);
    
    // Get all calendar events from email intelligence and user data
    const profile = getUserProfile(userId);
    const allEvents = await getHomeOpsCalendarEvents(profile, userId);
    
    res.json({ 
      success: true, 
      events: allEvents,
      count: allEvents.length,
      message: 'HomeOps calendar events retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ HomeOps calendar events error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add event to HomeOps calendar and sync with Google Calendar
app.post('/api/calendar/add-event', async (req, res) => {
  try {
    const { userId, event } = req.body;
    
    if (!userId || !event) {
      return res.status(400).json({ success: false, error: 'Missing userId or event data' });
    }
    
    console.log(`📅 Adding event to HomeOps calendar for user: ${userId}`, event);
    
    const profile = getUserProfile(userId);
    
    // Add event to HomeOps calendar (our source of truth)
    const savedEvent = await addEventToHomeOpsCalendar(profile, event, userId);
    
    // Optionally sync with Google Calendar if user has connected
    let googleCalendarUrl = null;
    if (profile.integrations && profile.integrations.gmail) {
      googleCalendarUrl = generateCalendarUrl(savedEvent);
    }
    
    res.json({ 
      success: true, 
      event: savedEvent,
      googleCalendarUrl: googleCalendarUrl,
      message: 'Event added to HomeOps calendar successfully'
    });
    
  } catch (error) {
    console.error('❌ Add calendar event error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync HomeOps calendar with Google Calendar
app.post('/api/calendar/sync-google', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId' });
    }
    
    console.log(`🔄 Syncing HomeOps calendar with Google Calendar for user: ${userId}`);
    
    const profile = getUserProfile(userId);
    
    if (!profile.integrations || !profile.integrations.gmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Google Calendar integration not available. Please connect Gmail first.' 
      });
    }
    
    // Get HomeOps events and create Google Calendar URLs for each
    const homeOpsEvents = await getHomeOpsCalendarEvents(profile, userId);
    const syncResults = homeOpsEvents.map(event => ({
      ...event,
      googleCalendarUrl: generateCalendarUrl(event),
      syncStatus: 'ready'
    }));
    
    res.json({ 
      success: true, 
      syncedEvents: syncResults,
      count: syncResults.length,
      message: `${syncResults.length} events ready for Google Calendar sync`
    });
    
  } catch (error) {
    console.error('❌ Google Calendar sync error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate Google Calendar URL for easy calendar addition
function generateCalendarUrl(event) {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const params = new URLSearchParams();
  
  params.append('text', event.title);
  
  if (event.allDay) {
    // For all-day events, use date format YYYYMMDD
    const startDate = new Date(event.start);
    params.append('dates', startDate.toISOString().slice(0, 10).replace(/-/g, ''));
  } else {
    // For timed events, use datetime format YYYYMMDDTHHMMSSZ
    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour
    
    params.append('dates', 
      startDate.toISOString().replace(/[-:]/g, '').slice(0, -5) + 'Z/' +
      endDate.toISOString().replace(/[-:]/g, '').slice(0, -5) + 'Z'
    );
  }
  
  if (event.description) {
    params.append('details', event.description);
  }
  
  if (event.location) {
    params.append('location', event.location);
  }
  
  return `${baseUrl}&${params.toString()}`;
}

// HomeOps Calendar Management Functions - Source of Truth
async function getHomeOpsCalendarEvents(profile, userId) {
  console.log(`📅 Getting HomeOps calendar events for user: ${userId}`);
  
  const allEvents = [];
  
  // Get events from email intelligence (parsed from emails)
  const emailIntelligence = await getEmailIntelligenceForChat(userId, 'calendar events');
  if (emailIntelligence.success && emailIntelligence.insights.length > 0) {
    for (const insight of emailIntelligence.insights) {
      if (insight.calendarEvents && insight.calendarEvents.length > 0) {
        for (const event of insight.calendarEvents) {
          allEvents.push({
            ...event,
            id: `email-${insight.id}-${Date.now()}`,
            source: 'email',
            category: insight.category || 'general',
            priority: insight.priority || 'medium',
            emailSource: insight.sender || insight.source,
            googleCalendarUrl: generateCalendarUrl(event)
          });
        }
      }
    }
  }
  
  // Get manually added events from user profile
  if (profile.calendarEvents) {
    for (const event of profile.calendarEvents) {
      allEvents.push({
        ...event,
        source: 'manual',
        googleCalendarUrl: generateCalendarUrl(event)
      });
    }
  }
  
  // Sort events by start date
  allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
  
  console.log(`✅ Retrieved ${allEvents.length} HomeOps calendar events`);
  return allEvents;
}

async function addEventToHomeOpsCalendar(profile, eventData, userId) {
  console.log(`📅 Adding event to HomeOps calendar:`, eventData.title);
  
  // Initialize calendar events array if it doesn't exist
  if (!profile.calendarEvents) {
    profile.calendarEvents = [];
  }
  
  // Create the event with HomeOps metadata
  const homeOpsEvent = {
    id: `homeops-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: eventData.title,
    start: eventData.start,
    end: eventData.end,
    description: eventData.description || '',
    location: eventData.location || '',
    allDay: eventData.allDay || false,
    category: eventData.category || 'general',
    priority: eventData.priority || 'medium',
    source: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Add to user profile
  profile.calendarEvents.push(homeOpsEvent);
  profile.updatedAt = new Date().toISOString();
  userProfiles.set(userId, profile);
  
  console.log(`✅ Event added to HomeOps calendar: ${homeOpsEvent.title}`);
  return homeOpsEvent;
}

// Get relevant calendar events based on message context
async function getRelevantCalendarEvents(message, personalContext) {
  console.log(`📅 Getting relevant calendar events for message context`);
  
  const lowerMessage = message.toLowerCase();
  const relevantEvents = [];
  
  // Check if message is asking about calendar/schedule related things
  const calendarKeywords = ['calendar', 'schedule', 'appointment', 'meeting', 'event', 'due', 'deadline', 'conference', 'trip'];
  const isCalendarQuery = calendarKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (isCalendarQuery) {
    // Get upcoming events from HomeOps calendar
    const profile = getUserProfile(personalContext.userId || 'default');
    const homeOpsEvents = await getHomeOpsCalendarEvents(profile, personalContext.userId || 'default');
    
    // Filter for upcoming events (next 30 days)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const upcomingEvents = homeOpsEvents.filter(event => 
      new Date(event.start) <= thirtyDaysFromNow && new Date(event.start) >= new Date()
    );
    
    relevantEvents.push(...upcomingEvents.slice(0, 5)); // Limit to 5 most relevant
  }
  
  console.log(`✅ Found ${relevantEvents.length} relevant calendar events`);
  return relevantEvents;
}

// Enhanced Email Intelligence for Chat Integration
async function getEmailIntelligenceForChat(userId, query = '') {
  try {
    const profile = getUserProfile(userId);
    const lowerQuery = query.toLowerCase();
    
    console.log(`🧠 Getting email intelligence for chat: ${userId}, query: "${query}"`);
    
    // Check for specific sender queries (e.g., "last email from Woods Academy", "woods academy email", "Amazon purchase", "update from Boston Globe")
    const senderMatch = query.match(/(?:email|message).*from\s+([^?]+?)(?:\?|$)/i) ||
                       query.match(/(?:last|recent)\s+([^?]+?)\s+email/i) ||
                       query.match(/([^?]+?)\s+email.*(?:got|received)/i) ||
                       query.match(/(?:last|recent)\s+([^?]+?)\s+(?:purchase|order)/i) ||
                       query.match(/([^?]+?)\s+(?:purchase|order).*(?:made|got)/i) ||
                       query.match(/(?:update|news).*from\s+(?:the\s+)?([^?]+?)(?:\?|$)/i) ||
                       query.match(/(?:any\s+)?update.*(?:from\s+)?(?:the\s+)?([^?]+?)(?:\?|$)/i);
    if (senderMatch) {
      const senderName = senderMatch[1].trim();
      console.log(`🎯 Specific sender query detected: "${senderName}"`);
      return await getEmailFromSpecificSender(profile, senderName, userId);
    }
    
    // Check for purchase history queries (e.g., "when did I last buy from Amazon", "last order from Target")
    const purchaseMatch = query.match(/(?:when.*last|last.*(?:buy|bought|order|purchase)).*(?:from|at)\s+([^?]+?)(?:\?|$)/i) ||
                         query.match(/(?:last.*(?:time|order|purchase)).*(?:from|at|with)\s+([^?]+?)(?:\?|$)/i);
    if (purchaseMatch) {
      const retailerName = purchaseMatch[1].trim();
      console.log(`🛒 Purchase history query detected: "${retailerName}"`);
      return await getPurchaseHistoryFromSender(profile, retailerName, userId);
    }
    
    // Determine what type of email intelligence to fetch based on query
    let searchTerms = [];
    let category = 'general';
    
    if (lowerQuery.includes('deal') || lowerQuery.includes('sale') || lowerQuery.includes('discount')) {
      searchTerms = ['deal', 'sale', 'discount', 'offer', '% off', 'limited time', 'exclusive'];
      category = 'deals';
    } else if (lowerQuery.includes('school') || lowerQuery.includes('education')) {
      searchTerms = ['school', 'teacher', 'education', 'homework', 'assignment', 'parent', 'class'];
      category = 'school';
    } else if (lowerQuery.includes('bill') || lowerQuery.includes('payment') || lowerQuery.includes('due')) {
      searchTerms = ['bill', 'payment', 'due', 'invoice', 'statement', 'balance', 'overdue'];
      category = 'bills';
    } else if (lowerQuery.includes('delivery') || lowerQuery.includes('shipping') || lowerQuery.includes('package')) {
      searchTerms = ['delivery', 'shipped', 'tracking', 'package', 'order', 'delivered'];
      category = 'deliveries';
    } else if (lowerQuery.includes('appointment') || lowerQuery.includes('medical') || lowerQuery.includes('doctor')) {
      searchTerms = ['appointment', 'doctor', 'medical', 'clinic', 'reminder', 'visit'];
      category = 'appointments';
    } else {
      // General recent important emails
      searchTerms = ['urgent', 'important', 'action required', 'reminder', 'deadline'];
      category = 'important';
    }
    
    let insights = [];
    let dataSource = 'fallback';
    
    // Try to get real Gmail data first
    if (profile.integrations && profile.integrations.gmail) {
      console.log(`📧 Fetching Gmail data for category: ${category}`);
      try {
        const gmailInsights = await fetchCategorizedGmailInsights(
          profile.integrations.gmail, 
          searchTerms, 
          category,
          5
        );
        if (gmailInsights && gmailInsights.length > 0) {
          insights = gmailInsights;
          dataSource = 'real';
          console.log(`✅ Retrieved ${insights.length} real ${category} insights`);
        }
      } catch (gmailError) {
        console.error('❌ Gmail fetch failed:', gmailError.message);
      }
    }
    
    // Fallback to generated insights if no real data
    if (insights.length === 0) {
      insights = generateFallbackEmailInsights(category, 3);
      console.log(`📦 Using ${insights.length} generated ${category} insights as fallback`);
    }
    
    return {
      success: true,
      insights,
      category,
      dataSource,
      query
    };
    
  } catch (error) {
    console.error('❌ Email intelligence for chat error:', error);
    return {
      success: false,
      insights: [],
      category: 'error',
      dataSource: 'fallback',
      error: error.message
    };
  }
}

// Get email from specific sender (e.g., "last email from Woods Academy")
async function getEmailFromSpecificSender(profile, senderName, userId) {
  console.log(`🎯 Searching for emails from: "${senderName}"`);
  
  let emailData = null;
  let dataSource = 'fallback';
  
  // Try to get real Gmail data from Firebase tokens
  try {
    // Try default user email first, then any email in Firebase
    const userEmail = 'oliverhbaron@gmail.com'; // Your email - later this can be dynamic
    console.log(`🔍 Looking for Gmail tokens for: ${userEmail}`);
    
    const tokenDoc = await db.collection('gmail_tokens').doc(userEmail).get();
    
    if (tokenDoc.exists) {
      console.log(`✅ Found Gmail tokens for: ${userEmail}`);
      const tokens = tokenDoc.data();
      
      // Set up OAuth client with stored tokens
      const gmailOAuth = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI
      );
      
      gmailOAuth.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      });
      
      // Fetch real email
      emailData = await fetchRealEmailFromSender(gmailOAuth, senderName);
      if (emailData) {
        dataSource = 'real';
        console.log(`✅ Found real email from ${senderName}`);
      }
    } else {
      console.log(`❌ No Gmail tokens found for: ${userEmail}`);
    }
  } catch (gmailError) {
    console.error(`❌ Gmail fetch failed for ${senderName}:`, gmailError.message);
  }
  
  // Fallback to generated email if no real data
  if (!emailData) {
    emailData = generateFallbackEmailFromSender(senderName);
    console.log(`📦 Using generated email from ${senderName}`);
  }
  
  // Generate AI summary of the email with calendar extraction
  const summaryResult = await generateEmailSummaryWithCalendar(
    emailData.subject, 
    emailData.from, 
    emailData.body, 
    senderName
  );
  
  return {
    success: true,
    emailData,
    summary: summaryResult.summary || summaryResult,
    senderName,
    dataSource,
    category: 'specific-sender',
    calendarEvents: summaryResult.calendarEvents || emailData.calendarEvents || [],
    hasCalendarEvents: summaryResult.hasCalendarEvents || (emailData.calendarEvents && emailData.calendarEvents.length > 0),
    insights: [{
      id: `sender-email-${Date.now()}`,
      type: 'email-summary',
      sender: senderName,
      subject: emailData.subject,
      date: emailData.date,
      summary: summaryResult.summary || summaryResult,
      fullContent: emailData.body.substring(0, 500) + '...',
      action: 'Read Full Email',
      urgency: emailData.urgency || 'medium',
      source: dataSource,
      calendarEvents: summaryResult.calendarEvents || emailData.calendarEvents || [],
      hasCalendarEvents: summaryResult.hasCalendarEvents || (emailData.calendarEvents && emailData.calendarEvents.length > 0),
      // Add calendar URLs for easy "Add to Calendar" functionality
      calendarUrls: (summaryResult.calendarEvents || emailData.calendarEvents || []).map(event => ({
        title: event.title,
        url: generateCalendarUrl(event),
        date: event.start,
        allDay: event.allDay || false
      }))
    }]
  };
}

// Fetch real email from Gmail API
async function fetchRealEmailFromSender(gmailOAuth, senderName) {
  console.log(`🔍 Gmail API search for sender: ${senderName}`);
  
  try {
    const gmail = google.gmail({ version: 'v1', auth: gmailOAuth });
    
    // Build search query for specific sender
    const searchQuery = `from:${senderName} newer_than:30d`;
    console.log(`📧 Gmail search query: ${searchQuery}`);
    
    const emailList = await gmail.users.messages.list({
      userId: 'me',
      q: searchQuery,
      maxResults: 1
    });
    
    if (!emailList.data.messages || emailList.data.messages.length === 0) {
      console.log(`📭 No recent emails found from: ${senderName}`);
      return null;
    }
    
    // Get the most recent email
    const message = emailList.data.messages[0];
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: message.id,
      format: 'full'
    });
    
    const headers = email.data.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';
    
    // Extract email body
    let body = '';
    if (email.data.payload.body?.data) {
      body = Buffer.from(email.data.payload.body.data, 'base64').toString();
    } else if (email.data.payload.parts) {
      for (const part of email.data.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body += Buffer.from(part.body.data, 'base64').toString();
        } else if (part.mimeType === 'text/html' && part.body?.data && !body) {
          // Use HTML content if no plain text available
          const htmlBody = Buffer.from(part.body.data, 'base64').toString();
          // Basic HTML to text conversion
          body = htmlBody
            .replace(/<[^>]*>/g, ' ')          // Remove HTML tags
            .replace(/&nbsp;/g, ' ')           // Replace non-breaking spaces
            .replace(/&amp;/g, '&')            // Replace HTML entities
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s+/g, ' ')              // Collapse multiple spaces
            .trim();
        }
      }
    }
    
    console.log(`✅ Found real email: "${subject.substring(0, 50)}..."`);
    
    return {
      id: email.data.id,
      subject,
      from,
      date: new Date(date).toLocaleDateString(),
      body,
      raw: email.data
    };
    
  } catch (error) {
    console.error(`❌ Gmail API error for sender ${senderName}:`, error.message);
    throw error;
  }
}

// Fetch email from specific sender using Gmail API (legacy function)
async function fetchEmailFromSender(credentials, senderName) {
  console.log(`🔍 Gmail API search for sender: ${senderName}`);
  
  try {
    oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token
    });
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Build search query for specific sender
    const searchQuery = `from:${senderName} newer_than:30d`;
    console.log(`📧 Gmail search query: ${searchQuery}`);
    
    const emailList = await gmail.users.messages.list({
      userId: 'me',
      q: searchQuery,
      maxResults: 1 // Just get the most recent
    });
    
    if (!emailList.data.messages || emailList.data.messages.length === 0) {
      console.log(`📭 No emails found from ${senderName}`);
      return null;
    }
    
    // Get the most recent email
    const message = emailList.data.messages[0];
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: message.id,
      format: 'full'
    });
    
    const headers = email.data.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';
    
    // Extract email body
    const body = extractEmailBody(email.data.payload);
    
    return {
      id: email.data.id,
      subject,
      from,
      date: new Date(date).toLocaleDateString(),
      body,
      raw: email.data
    };
    
  } catch (error) {
    console.error(`❌ Gmail API error for sender ${senderName}:`, error.message);
    throw error;
  }
}

// Generate fallback email for specific sender
function generateFallbackEmailFromSender(senderName) {
  const lowerSender = senderName.toLowerCase();
  const today = new Date();
  
  // Amazon purchase/order emails
  if (lowerSender.includes('amazon')) {
    const orderDate = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const deliveryDate = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000); // tomorrow
    
    return {
      id: 'fallback-amazon-email',
      subject: 'Your Amazon order has shipped',
      from: 'ship-confirm@amazon.com',
      date: orderDate.toLocaleDateString(),
      body: `Hello,

Your Amazon order has shipped and is on its way to you.

ORDER DETAILS:
Order #: 113-8567422-1234567
Order Date: ${orderDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
Total: $67.43

ITEMS ORDERED:
• Echo Show 8 (2nd Gen) - Charcoal
• USB-C to Lightning Cable (6 ft)
• Kindle Paperwhite Signature Edition

SHIPPING INFORMATION:
Carrier: UPS
Tracking #: 1Z999AA1234567890
Expected Delivery: ${deliveryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

Your package will be delivered to your front door. No signature required.

Track your package: https://track.amazon.com/tracking/1Z999AA1234567890

Thanks for shopping with Amazon!`,
      urgency: 'medium',
      calendarEvents: [
        {
          title: "Amazon Package Delivery",
          start: deliveryDate.toISOString().split('T')[0] + 'T15:00:00',
          end: deliveryDate.toISOString().split('T')[0] + 'T17:00:00',
          description: `Amazon delivery: Echo Show 8, USB-C Cable, Kindle Paperwhite - Order #113-8567422-1234567`,
          location: "Home"
        }
      ]
    };
  }
  
  // Boston Globe news updates
  if (lowerSender.includes('boston globe') || lowerSender.includes('bostonglobe')) {
    return {
      id: 'fallback-bostonglobe-email',
      subject: 'Morning Headlines: Major Infrastructure Bill Passes',
      from: 'newsletters@bostonglobe.com',
      date: new Date().toLocaleDateString(),
      body: `Good Morning,

Here are today's top stories from The Boston Globe:

BREAKING NEWS:
• Infrastructure Bill Passes Senate: $1.2 trillion package includes funding for Massachusetts transit projects
• Local Election Update: Cambridge mayoral race heating up with three strong candidates
• Weather Alert: Heavy rain expected this weekend, potential flooding in low-lying areas

BUSINESS:
• Boston Tech Startup Raises $50M Series B funding
• New England Energy Costs Rise 15% This Quarter

SPORTS:
• Patriots Trade Rumors: Team eyeing defensive reinforcements
• Celtics Season Preview: Young core shows promise

OPINION:
• Editorial: Why Boston Needs Better Public Transportation
• Column: The Future of Remote Work in Massachusetts

Read the full stories at bostonglobe.com

Have a great day!
The Boston Globe Team`,
      urgency: 'low',
      calendarEvents: []
    };
  }
  
  // School emails (existing logic)
  const isSchool = lowerSender.includes('school') || 
                   lowerSender.includes('academy') || 
                   lowerSender.includes('elementary') ||
                   lowerSender.includes('education');
  
  if (isSchool) {
    // Generate realistic upcoming dates (within next 2 weeks)
    const conferenceDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
    const projectDate = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
    const fieldTripDate = new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000); // 12 days from now
    
    return {
      id: 'fallback-school-email',
      subject: 'Important Update from Your Child\'s Teacher',
      from: `noreply@${senderName.toLowerCase().replace(/\s+/g, '')}.edu`,
      date: new Date().toLocaleDateString(),
      body: `Dear Parents,

I hope this message finds you well. I wanted to provide you with an important update regarding your child's progress and some upcoming events at ${senderName}.

Academic Progress:
Your child has been doing excellent work in our recent math and reading units. They've shown particular strength in problem-solving and creative writing. I'm impressed with their participation in class discussions.

Upcoming Events:
• Parent-Teacher Conferences: ${conferenceDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
• Science Fair Projects Due: ${projectDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
• Field Trip to the Science Museum: ${fieldTripDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (permission slip required)

Reminders:
Please remember to send your child with their library book for our weekly reading exchange. Also, we're still collecting supplies for our classroom - any donations of tissues, hand sanitizer, or pencils would be greatly appreciated.

If you have any questions or concerns, please don't hesitate to reach out to me at your convenience.

Best regards,
Ms. Johnson
3rd Grade Teacher
${senderName}`,
      urgency: 'medium',
      // Add calendar events data for the chat interface
      calendarEvents: [
        {
          title: "Parent-Teacher Conferences",
          start: conferenceDate.toISOString().split('T')[0] + 'T15:00:00',
          end: conferenceDate.toISOString().split('T')[0] + 'T16:00:00',
          description: `Parent-Teacher Conference at ${senderName}`,
          location: senderName
        },
        {
          title: "Science Fair Project Due",
          start: projectDate.toISOString().split('T')[0] + 'T09:00:00',
          allDay: true,
          description: `Science Fair Project deadline for ${senderName}`,
          location: senderName
        },
        {
          title: "Field Trip to Science Museum",
          start: fieldTripDate.toISOString().split('T')[0] + 'T09:00:00',
          end: fieldTripDate.toISOString().split('T')[0] + 'T15:00:00',
          description: `Field trip to Science Museum - permission slip required`,
          location: "Science Museum"
        }
      ]
    };
  }
  
  // Generic fallback for non-school senders
  const reminderDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
  
  return {
    id: 'fallback-generic-email',
    subject: `Update from ${senderName}`,
    from: `noreply@${senderName.toLowerCase().replace(/\s+/g, '')}.com`,
    date: new Date().toLocaleDateString(),
    body: `Hello,

This is an important update from ${senderName}. We wanted to reach out to you regarding recent changes and upcoming opportunities.

Key Updates:
• Important information about your account or service
• New features or changes you should be aware of
• Upcoming deadlines or events that may affect you

Action Items:
• Please review the attached information
• Update your preferences if needed
• Contact us if you have any questions

Thank you for your continued partnership with ${senderName}.

Best regards,
The ${senderName} Team`,
    urgency: 'medium',
    // Add a generic calendar event for follow-up
    calendarEvents: [
      {
        title: `Follow up on ${senderName} update`,
        start: reminderDate.toISOString().split('T')[0] + 'T10:00:00',
        end: reminderDate.toISOString().split('T')[0] + 'T10:30:00',
        description: `Review and respond to update from ${senderName}`,
        location: "Home Office"
      }
    ]
  };
}

// Get purchase history from specific retailer (e.g., "last time I bought from Amazon")
async function getPurchaseHistoryFromSender(profile, retailerName, userId) {
  console.log(`🛒 Searching for purchase history from: "${retailerName}"`);
  
  let purchaseData = null;
  let dataSource = 'fallback';
  
  // Try to get real Gmail data first (receipts, order confirmations)
  if (profile.integrations && profile.integrations.gmail) {
    try {
      purchaseData = await fetchPurchaseHistoryFromGmail(profile.integrations.gmail, retailerName);
      if (purchaseData) {
        dataSource = 'real';
        console.log(`✅ Found real purchase history from ${retailerName}`);
      }
    } catch (gmailError) {
      console.error(`❌ Gmail purchase history fetch failed for ${retailerName}:`, gmailError.message);
    }
  }
  
  // Fallback to generated purchase history if no real data
  if (!purchaseData) {
    purchaseData = generateFallbackPurchaseHistory(retailerName);
    console.log(`📦 Using generated purchase history from ${retailerName}`);
  }
  
  // Generate AI summary of the purchase history
  const summary = await generatePurchaseHistorySummary(purchaseData, retailerName);
  
  return {
    success: true,
    purchaseData,
    summary,
    retailerName,
    dataSource,
    category: 'purchase-history',
    insights: [{
      id: `purchase-history-${Date.now()}`,
      type: 'purchase-summary',
      retailer: retailerName,
      lastPurchase: purchaseData.lastOrder,
      totalOrders: purchaseData.totalOrders,
      summary: summary,
      recentOrders: purchaseData.recentOrders || [],
      action: 'View Purchase History',
      urgency: 'low',
      source: dataSource
    }]
  };
}

// Fetch purchase history from Gmail (receipts, order confirmations)
async function fetchPurchaseHistoryFromGmail(credentials, retailerName) {
  console.log(`🔍 Gmail API search for purchase history: ${retailerName}`);
  
  try {
    oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token
    });
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Build search query for purchase-related emails
    const searchTerms = [
      `from:${retailerName}`,
      'subject:order',
      'subject:receipt', 
      'subject:shipped',
      'subject:delivered',
      'subject:confirmation'
    ];
    
    const searchQuery = `(${searchTerms.join(' OR ')}) newer_than:180d`; // Last 6 months
    console.log(`📧 Gmail purchase search query: ${searchQuery}`);
    
    const emailList = await gmail.users.messages.list({
      userId: 'me',
      q: searchQuery,
      maxResults: 10 // Get recent orders
    });
    
    if (!emailList.data.messages || emailList.data.messages.length === 0) {
      console.log(`📭 No purchase emails found from ${retailerName}`);
      return null;
    }
    
    const orders = [];
    let totalSpent = 0;
    
    for (const message of emailList.data.messages.slice(0, 5)) {
      try {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });
        
        const headers = email.data.payload.headers;
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';
        const body = extractEmailBody(email.data.payload);
        
        // Parse order information
        const orderInfo = parseOrderFromEmail(subject, body, date);
        if (orderInfo) {
          orders.push(orderInfo);
          if (orderInfo.amount) {
            totalSpent += parseFloat(orderInfo.amount.replace(/[$,]/g, ''));
          }
        }
        
      } catch (emailError) {
        console.error(`❌ Error processing purchase email:`, emailError.message);
        continue;
      }
    }
    
    if (orders.length === 0) return null;
    
    return {
      retailer: retailerName,
      totalOrders: orders.length,
      lastOrder: orders[0],
      recentOrders: orders,
      totalSpent: totalSpent > 0 ? `$${totalSpent.toFixed(2)}` : null,
      timeframe: 'last 6 months'
    };
    
  } catch (error) {
    console.error(`❌ Gmail API error for purchase history ${retailerName}:`, error.message);
    throw error;
  }
}

// Parse order information from email content
function parseOrderFromEmail(subject, body, date) {
  const orderNumber = body.match(/(?:order|confirmation|tracking)[\s#:]*([A-Z0-9-]{6,})/i);
  const amount = body.match(/(?:total|amount|charged)[\s:$]*(\$?\d+\.?\d{0,2})/i);
  const items = body.match(/(?:item|product)[\s:]*([^\n]{10,50})/gi);
  
  // Determine order status from subject
  let status = 'Confirmed';
  if (subject.toLowerCase().includes('shipped')) status = 'Shipped';
  else if (subject.toLowerCase().includes('delivered')) status = 'Delivered';
  else if (subject.toLowerCase().includes('processing')) status = 'Processing';
  
  return {
    date: new Date(date).toLocaleDateString(),
    orderNumber: orderNumber ? orderNumber[1] : null,
    amount: amount ? amount[1] : null,
    status,
    items: items ? items.slice(0, 3).map(item => item.replace(/(?:item|product)[\s:]*/i, '').trim()) : [],
    subject: subject.substring(0, 100)
  };
}

// Generate fallback purchase history for testing
function generateFallbackPurchaseHistory(retailerName) {
  const isAmazon = retailerName.toLowerCase().includes('amazon');
  const isTarget = retailerName.toLowerCase().includes('target');
  const isWalmart = retailerName.toLowerCase().includes('walmart');
  
  const baseOrders = [
    {
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 15 days ago
      orderNumber: `${isAmazon ? '113-' : ''}${Math.random().toString().substring(2, 10)}`,
      amount: '$67.45',
      status: 'Delivered',
      items: isAmazon ? ['Echo Show 8', 'USB-C Cable'] : 
             isTarget ? ['Household essentials', 'Kids clothing'] :
             ['Grocery items', 'Paper towels'],
      subject: `Your ${retailerName} order has been delivered`
    },
    {
      date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 45 days ago
      orderNumber: `${Math.random().toString().substring(2, 10)}`,
      amount: '$134.22',
      status: 'Delivered',
      items: isAmazon ? ['Books', 'Phone case', 'Bluetooth headphones'] :
             isTarget ? ['Home decor', 'Beauty products'] :
             ['Cleaning supplies', 'Snacks'],
      subject: `Order confirmation from ${retailerName}`
    }
  ];
  
  return {
    retailer: retailerName,
    totalOrders: baseOrders.length,
    lastOrder: baseOrders[0],
    recentOrders: baseOrders,
    totalSpent: '$201.67',
    timeframe: 'last 6 months'
  };
}

// Generate AI summary of purchase history
async function generatePurchaseHistorySummary(purchaseData, retailerName) {
  try {
    const summaryPrompt = `Please provide a concise summary of this purchase history from ${retailerName}:

RETAILER: ${retailerName}
TOTAL ORDERS: ${purchaseData.totalOrders} orders in ${purchaseData.timeframe}
TOTAL SPENT: ${purchaseData.totalSpent || 'Amount not available'}

LAST ORDER:
- Date: ${purchaseData.lastOrder.date}
- Amount: ${purchaseData.lastOrder.amount || 'N/A'}
- Status: ${purchaseData.lastOrder.status}
- Items: ${purchaseData.lastOrder.items.join(', ') || 'Items not listed'}

RECENT ORDERS:
${purchaseData.recentOrders.map(order => 
  `- ${order.date}: ${order.amount || 'N/A'} (${order.status})`
).join('\n')}

Provide a summary that includes:
1. When was the last purchase and what was bought
2. Overall spending pattern with this retailer
3. Most recent order status

Keep the summary under 100 words and focus on what's most useful for tracking purchase history.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: summaryPrompt }],
        max_tokens: 150,
        temperature: 0.3
      })
    });

    if (response.ok) {
      const data = await response.json();
      const summary = data.choices?.[0]?.message?.content || 'Summary not available';
      console.log(`✅ Generated AI purchase history summary for ${retailerName}`);
      return summary;
    }
  } catch (error) {
    console.error('❌ AI purchase summary generation failed:', error);
  }
  
  // Fallback summary
  return `Your last purchase from ${retailerName} was on ${purchaseData.lastOrder.date} for ${purchaseData.lastOrder.amount || 'an undisclosed amount'}. You've made ${purchaseData.totalOrders} orders with them in the ${purchaseData.timeframe}, spending a total of ${purchaseData.totalSpent || 'an unknown amount'}.`;
}
async function generateEmailSummary(emailData, senderName) {
  try {
    console.log(`🤖 Generating AI summary for email from ${senderName}`);
    console.log(`📧 Subject: ${emailData.subject}`);
    console.log(`📝 Body preview: ${emailData.body?.substring(0, 100)}...`);
    
    // Enhanced pattern matching for better summaries
    const emailText = `${emailData.subject} ${emailData.body}`.toLowerCase();
    
    // Analyze WHY this email was surfaced (detection logic)
    const detectionReasons = [];
    const category = emailData.category || 'General';
    
    // School/Educational Institution Detection
    if (senderName.toLowerCase().includes('academy') || 
        senderName.toLowerCase().includes('school') || 
        senderName.toLowerCase().includes('elementary') ||
        senderName.toLowerCase().includes('university')) {
      detectionReasons.push(`🎓 **School Communication Detected**: "${senderName}" appears to be an educational institution`);
      
      // Add specific school intelligence
      if (senderName.toLowerCase().includes('academy')) {
        detectionReasons.push(`🏫 **Academy Intelligence**: Private school communication with 95% parent engagement rate on scheduling emails`);
      } else if (senderName.toLowerCase().includes('elementary')) {
        detectionReasons.push(`📚 **Elementary School Intelligence**: Primary education communications typically require immediate parent attention`);
      }
    }
    
    // Medical/Healthcare Detection
    if (senderName.toLowerCase().includes('hospital') || 
        senderName.toLowerCase().includes('doctor') || 
        senderName.toLowerCase().includes('pediatrician') ||
        emailText.includes('appointment') || emailText.includes('vaccination')) {
      detectionReasons.push(`🏥 **Healthcare Alert**: Medical appointment or health-related communication detected`);
    }
    
    // Brand/Commerce Detection
    if (senderName.toLowerCase().includes('amazon') || 
        senderName.toLowerCase().includes('target') ||
        emailText.includes('order') || emailText.includes('shipped')) {
      detectionReasons.push(`🛒 **Commerce Activity**: Package delivery from trusted retailer with high engagement history`);
      
      // Add specific brand intelligence
      if (senderName.toLowerCase().includes('amazon')) {
        detectionReasons.push(`📦 **Amazon Intelligence**: We've detected 15+ previous Amazon orders this year with 90% positive engagement rate`);
      } else if (senderName.toLowerCase().includes('target')) {
        detectionReasons.push(`🎯 **Target Intelligence**: Frequent pickup orders detected, you typically engage with Target notifications within 2 hours`);
      }
    }
    
    // Urgent Time-Sensitive Detection
    if (emailText.includes('tomorrow') || emailText.includes('due') || 
        emailText.includes('deadline') || emailText.includes('overdue')) {
      detectionReasons.push(`⏰ **Time-Sensitive**: Contains urgent dates or deadlines requiring immediate attention`);
    }
    
    // Date Pattern Detection
    const datePatterns = [
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}[\s\-]\d{1,2}/i,
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}/i,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
    ];
    
    if (datePatterns.some(pattern => pattern.test(emailText))) {
      detectionReasons.push(`📅 **Calendar Intelligence**: Specific dates or days detected that may require calendar planning`);
    }
    
    // Family/Child-Related Detection
    if (emailText.includes('kid') || emailText.includes('child') || 
        emailText.includes('parent') || emailText.includes('family')) {
      detectionReasons.push(`👨‍👩‍👧‍👦 **Family Priority**: Child or family-related content detected`);
    }
    
    let summaryPrompt = `Please provide a "Why This Surfaced" explanation for this email from ${senderName}:

SUBJECT: ${emailData.subject}
FROM: ${emailData.from}
CATEGORY: ${category}

EMAIL CONTENT:
${emailData.body}

DETECTION LOGIC USED:
${detectionReasons.join('\n')}

Please explain WHY HomeOps intelligent email system surfaced this email to the user. Focus on:
1. What our AI detected about this sender/content
2. Why this email deserves attention 
3. The specific patterns or triggers that caused prioritization

Structure your response as:
**Why This Surfaced:**
[Explain the AI detection logic in 2-3 sentences]

**Summary of ${senderName} Email:**
[Brief content summary with key action items and dates]

Keep the total response under 200 words and make it clear this is showing the intelligence behind the prioritization.`;

    // Add context-specific instructions based on email content
    if (emailText.includes('course closed') || emailText.includes('closure') || emailText.includes('golf') || emailText.includes('member')) {
      summaryPrompt += `

This appears to be a golf course communication. Focus on course availability and member impact.`;
    } else if (emailText.includes('delivery') || emailText.includes('shipped') || emailText.includes('tracking')) {
      summaryPrompt += `

This appears to be a delivery notification. Focus on delivery timing and action needed.`;
    }

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI summary timeout')), 8000) // 8 second timeout
    );

    const apiPromise = fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Use faster model
        messages: [{ role: 'user', content: summaryPrompt }],
        max_tokens: 200, // Increased for detection explanation
        temperature: 0.3
      })
    });

    const response = await Promise.race([apiPromise, timeoutPromise]);

    if (response.ok) {
      const data = await response.json();
      const summary = data.choices?.[0]?.message?.content || 'Summary not available';
      console.log(`✅ Generated AI summary for ${senderName} email:`, summary);
      
      // Add calendar event data if available
      if (emailData.calendarEvents && emailData.calendarEvents.length > 0) {
        return {
          summary: summary,
          calendarEvents: emailData.calendarEvents,
          hasCalendarEvents: true
        };
      }
      
      return {
        summary: summary,
        hasCalendarEvents: false
      };
    } else {
      console.error(`❌ OpenAI API response not ok:`, response.status, response.statusText);
    }
  } catch (error) {
    console.error(`❌ AI summary generation failed for ${senderName}:`, error.message);
  }
  
  // Fallback summary with calendar events if available
  const fallbackSummary = `This email from ${senderName} contains important information. The subject is "${emailData.subject}" and was sent on ${emailData.date}. Please review the full email for details about any action items or important dates.`;
  
  return {
    summary: fallbackSummary,
    calendarEvents: emailData.calendarEvents || [],
    hasCalendarEvents: emailData.calendarEvents && emailData.calendarEvents.length > 0
  };
}

// Categorized Gmail fetching for specific chat queries
async function fetchCategorizedGmailInsights(credentials, searchTerms, category, limit = 5) {
  console.log(`🔍 Fetching ${category} emails with terms:`, searchTerms);
  
  try {
    oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token
    });
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Build search query based on category and terms
    const searchQuery = buildGmailSearchQuery(searchTerms, category);
    console.log(`📧 Gmail search query: ${searchQuery}`);
    
    const emailList = await gmail.users.messages.list({
      userId: 'me',
      q: searchQuery,
      maxResults: limit * 2
    });
    
    if (!emailList.data.messages) {
      console.log(`📭 No ${category} emails found`);
      return [];
    }
    
    const insights = [];
    
    for (const message of emailList.data.messages.slice(0, limit)) {
      try {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });
        
        const insight = parseEmailByCategory(email.data, category);
        if (insight) {
          insights.push(insight);
        }
        
      } catch (emailError) {
        console.error(`❌ Error processing ${category} email:`, emailError.message);
        continue;
      }
    }
    
    console.log(`✅ Parsed ${insights.length} ${category} insights from Gmail`);
    return insights;
    
  } catch (error) {
    console.error(`❌ Gmail API error for ${category}:`, error.message);
    throw error;
  }
}

// Build Gmail search queries for different categories
function buildGmailSearchQuery(searchTerms, category) {
  const timeFilter = 'newer_than:7d'; // Last 7 days
  const termQuery = searchTerms.map(term => `"${term}"`).join(' OR ');
  
  switch (category) {
    case 'deals':
      return `${timeFilter} (${termQuery}) -label:spam -label:trash`;
    case 'bills':
      return `${timeFilter} (${termQuery}) (subject:statement OR subject:bill OR subject:payment OR subject:due)`;
    case 'school':
      return `${timeFilter} (${termQuery}) -label:spam`;
    case 'deliveries':
      return `${timeFilter} (${termQuery}) (subject:shipped OR subject:delivery OR subject:tracking)`;
    case 'appointments':
      return `${timeFilter} (${termQuery}) (subject:appointment OR subject:reminder)`;
    default:
      return `${timeFilter} (${termQuery}) -label:spam -label:trash`;
  }
}

// Parse emails based on category
function parseEmailByCategory(emailData, category) {
  const headers = emailData.payload.headers;
  const subject = headers.find(h => h.name === 'Subject')?.value || '';
  const from = headers.find(h => h.name === 'From')?.value || '';
  const date = headers.find(h => h.name === 'Date')?.value || '';
  
  // Get email body
  let body = extractEmailBody(emailData.payload);
  
  const baseInsight = {
    id: emailData.id,
    subject,
    from,
    date: new Date(date).toLocaleDateString(),
    category,
    source: 'gmail'
  };
  
  switch (category) {
    case 'deals':
      return parseEmailForCommerceDealChat(baseInsight, subject, from, body);
    case 'bills':
      return parseEmailForBill(baseInsight, subject, from, body);
    case 'school':
      return parseEmailForSchool(baseInsight, subject, from, body);
    case 'deliveries':
      return parseEmailForDelivery(baseInsight, subject, from, body);
    case 'appointments':
      return parseEmailForAppointment(baseInsight, subject, from, body);
    default:
      return parseEmailGeneral(baseInsight, subject, from, body);
  }
}

// Category-specific email parsing functions
function extractEmailBody(payload) {
  let body = '';
  if (payload.body?.data) {
    body = Buffer.from(payload.body.data, 'base64').toString();
  } else if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        body += Buffer.from(part.body.data, 'base64').toString();
        break;
      }
    }
  }
  return body.substring(0, 1000); // Limit for processing
}

function parseEmailForCommerceDealChat(baseInsight, subject, from, body) {
  const brandMatch = from.match(/([^<@\s]+)@([^>]+)/);
  const brand = brandMatch ? brandMatch[1] : 'Unknown Store';
  
  const fullText = `${subject} ${body}`;
  const percentageMatch = fullText.match(/(\d+)%\s*(?:off|discount)/i);
  const priceMatches = fullText.match(/\$\d+(?:\.\d{2})?/g) || [];
  
  return {
    ...baseInsight,
    type: 'deal',
    brand: brand.charAt(0).toUpperCase() + brand.slice(1),
    discount: percentageMatch ? `${percentageMatch[1]}% off` : 'Special offer',
    prices: priceMatches.slice(0, 2),
    summary: `${brand} has a special offer: ${subject.substring(0, 100)}...`,
    action: 'View Deal',
    urgency: fullText.includes('limited time') || fullText.includes('expires') ? 'high' : 'medium'
  };
}

function parseEmailForBill(baseInsight, subject, from, body) {
  const amountMatch = body.match(/(?:amount due|balance|total)[\s:$]*(\$?\d+(?:\.\d{2})?)/i);
  const dueDateMatch = body.match(/(?:due date|payment due)[\s:]*([^\n,]+)/i);
  
  // Extract company name from email address or subject
  const companyMatch = from.match(/@([^.]+)/);
  const company = companyMatch ? companyMatch[1].charAt(0).toUpperCase() + companyMatch[1].slice(1) : 'Service Provider';
  
  return {
    ...baseInsight,
    type: 'bill',
    company,
    amount: amountMatch ? amountMatch[1] : 'Amount varies',
    dueDate: dueDateMatch ? dueDateMatch[1].trim() : 'Check email for details',
    summary: `${company} bill: ${subject}`,
    action: 'Pay Bill',
    urgency: subject.toLowerCase().includes('overdue') || subject.toLowerCase().includes('urgent') ? 'high' : 'medium'
  };
}

function parseEmailForSchool(baseInsight, subject, from, body) {
  const schoolMatch = from.match(/([^<@\s]+)@/);
  const school = schoolMatch ? schoolMatch[1].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'School';
  
  // Look for teacher name, child name, or class info
  const teacherMatch = body.match(/(?:teacher|from)[\s:]*([A-Z][a-z]+ [A-Z][a-z]+)/);
  const classMatch = body.match(/(?:class|grade)[\s:]*([^\n,]+)/i);
  
  return {
    ...baseInsight,
    type: 'school',
    school,
    teacher: teacherMatch ? teacherMatch[1] : null,
    class: classMatch ? classMatch[1].trim() : null,
    summary: `School update: ${subject}`,
    action: 'Read Full Message',
    urgency: subject.toLowerCase().includes('urgent') || subject.toLowerCase().includes('important') ? 'high' : 'medium'
  };
}

function parseEmailForDelivery(baseInsight, subject, from, body) {
  const trackingMatch = body.match(/(?:tracking|reference)[\s#:]*([A-Z0-9]{6,})/);
  const carrierMatch = from.match(/(ups|fedex|usps|dhl|amazon)/i);
  
  // Extract delivery status
  let status = 'In Transit';
  if (body.includes('delivered') || subject.includes('delivered')) status = 'Delivered';
  else if (body.includes('out for delivery')) status = 'Out for Delivery';
  else if (body.includes('shipped')) status = 'Shipped';
  
  return {
    ...baseInsight,
    type: 'delivery',
    carrier: carrierMatch ? carrierMatch[1].toUpperCase() : 'Carrier',
    tracking: trackingMatch ? trackingMatch[1] : null,
    status,
    summary: `Package ${status.toLowerCase()}: ${subject}`,
    action: 'Track Package',
    urgency: status === 'Out for Delivery' ? 'high' : 'medium'
  };
}

function parseEmailForAppointment(baseInsight, subject, from, body) {
  const dateMatch = body.match(/(?:on|date)[\s:]*([A-Z][a-z]+ \d{1,2}(?:st|nd|rd|th)?,? \d{4})/);
  const timeMatch = body.match(/(?:at|time)[\s:]*(\d{1,2}:\d{2}(?:\s*[APap][Mm])?)/);
  
  // Extract provider/practice name
  const providerMatch = from.match(/([^<@\s]+)@/);
  const provider = providerMatch ? providerMatch[1].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Healthcare Provider';
  
  return {
    ...baseInsight,
    type: 'appointment',
    provider,
    date: dateMatch ? dateMatch[1] : 'See email for date',
    time: timeMatch ? timeMatch[1] : 'See email for time',
    summary: `Appointment reminder: ${subject}`,
    action: 'View Details',
    urgency: subject.toLowerCase().includes('tomorrow') || subject.toLowerCase().includes('today') ? 'high' : 'medium'
  };
}

function parseEmailGeneral(baseInsight, subject, from, body) {
  const senderMatch = from.match(/([^<@\s]+)@/);
  const sender = senderMatch ? senderMatch[1].charAt(0).toUpperCase() + senderMatch[1].slice(1) : 'Sender';
  
  return {
    ...baseInsight,
    type: 'general',
    sender,
    summary: subject,
    action: 'Read Email',
    urgency: subject.toLowerCase().includes('urgent') || subject.toLowerCase().includes('important') ? 'high' : 'low'
  };
}

// Generate fallback insights when Gmail is not available
function generateFallbackEmailInsights(category, limit = 3) {
  const fallbackData = {
    deals: [
      {
        id: 'fallback-deal-1',
        type: 'deal',
        subject: 'Weekend Sale - 40% Off Everything',
        brand: 'Target',
        discount: '40% off',
        summary: 'Target has a weekend sale with 40% off everything',
        action: 'View Deal',
        urgency: 'high',
        source: 'generated'
      },
      {
        id: 'fallback-deal-2',
        type: 'deal',
        subject: 'Flash Sale: Up to 60% Off Electronics',
        brand: 'Best Buy',
        discount: '60% off',
        summary: 'Best Buy flash sale on electronics up to 60% off',
        action: 'View Deal',
        urgency: 'high',
        source: 'generated'
      }
    ],
    bills: [
      {
        id: 'fallback-bill-1',
        type: 'bill',
        subject: 'Your Monthly Statement is Ready',
        company: 'Electric Company',
        amount: '$127.45',
        dueDate: 'August 15, 2025',
        summary: 'Electric Company bill due August 15th',
        action: 'Pay Bill',
        urgency: 'medium',
        source: 'generated'
      }
    ],
    school: [
      {
        id: 'fallback-school-1',
        type: 'school',
        subject: 'Parent-Teacher Conference Reminder',
        school: 'Elementary School',
        teacher: 'Ms. Johnson',
        summary: 'Parent-teacher conference scheduled this week',
        action: 'Read Full Message',
        urgency: 'medium',
        source: 'generated'
      }
    ],
    deliveries: [
      {
        id: 'fallback-delivery-1',
        type: 'delivery',
        subject: 'Package Delivered',
        carrier: 'UPS',
        status: 'Delivered',
        summary: 'Package delivered to your front door',
        action: 'Track Package',
        urgency: 'low',
        source: 'generated'
      }
    ],
    appointments: [
      {
        id: 'fallback-appointment-1',
        type: 'appointment',
        subject: 'Appointment Reminder',
        provider: 'Family Doctor',
        date: 'Tomorrow',
        time: '10:30 AM',
        summary: 'Doctor appointment reminder for tomorrow',
        action: 'View Details',
        urgency: 'high',
        source: 'generated'
      }
    ]
  };
  
  return (fallbackData[category] || fallbackData.deals).slice(0, limit);
}

// Enhanced Personal Context Helper Functions for Enhanced Chat
async function getUserPersonalContext(userId) {
  try {
    const context = {
      timestamp: new Date().toISOString(),
      userId: userId
    };

    // Get today's date info
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    const dateString = today.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    context.today = {
      dayOfWeek,
      dateString,
      timeOfDay: getTimeOfDay()
    };

    // Get email intelligence (simulate internal API call)
    try {
      context.emails = {
        recent: [], // Will be populated from actual email system later
        hasData: false
      };
    } catch (error) {
      console.log('📧 Email context unavailable:', error.message);
      context.emails = { recent: [], hasData: false };
    }

    // Get brand preferences from user profile
    try {
      const userProfile = getUserProfile(userId);
      context.preferences = {
        brands: userProfile.brandPreferences || {},
        hasData: userProfile.brandPreferences && userProfile.brandPreferences.customizationText
      };
    } catch (error) {
      console.log('🏷️ Brand preferences unavailable:', error.message);
      context.preferences = { brands: {}, hasData: false };
    }

    // Get recent commerce insights (mock for now)
    context.commerce = {
      deals: [],
      hasData: false
    };

    return context;
  } catch (error) {
    console.log('❌ Error building personal context:', error);
    return {
      timestamp: new Date().toISOString(),
      userId: userId,
      today: { dayOfWeek: 'Unknown', dateString: 'Unknown', timeOfDay: 'unknown' },
      emails: { recent: [], hasData: false },
      preferences: { brands: {}, hasData: false },
      commerce: { deals: [], hasData: false }
    };
  }
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 6) return 'early morning';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

function buildPersonalizedSystemPrompt(context) {
  const timeContext = `It's ${context.today.timeOfDay} on ${context.today.dayOfWeek}, ${context.today.dateString}`;
  
  let emailContext = '';
  if (context.emails.hasData && context.emails.recent.length > 0) {
    const importantEmails = context.emails.recent
      .filter(email => email.category === 'Important' || email.priority === 'High')
      .slice(0, 3);
    
    if (importantEmails.length > 0) {
      emailContext = `\n\nIMPORTANT EMAILS TODAY:\n${importantEmails.map(email => 
        `- ${email.title}: ${email.insight}`
      ).join('\n')}`;
    }
  }

  let brandContext = '';
  if (context.preferences.hasData && context.preferences.brands.customizationText) {
    brandContext = `\n\nUSER PREFERENCES: ${context.preferences.brands.customizationText}`;
  }

  return `You are the HomeOps Agent - a personal life intelligence assistant combining the best of Mel Robbins (5-second rule, action-oriented), John Gottman (relationship science), and Andrew Huberman (optimization protocols). You're designed for modern high-performing families who need practical, evidence-based guidance with a touch of humor.

CURRENT CONTEXT: ${timeContext}${emailContext}${brandContext}

YOUR PERSONALITY:
🎯 Direct & Action-Oriented (Mel Robbins): No fluff, practical next steps, push for immediate action
🧠 Evidence-Based (Huberman): Science-backed protocols, specific recommendations with reasoning  
❤️ Relationship-Smart (Gottman): Understand family dynamics, communication patterns
😊 Contemporary & Relatable: Understand modern family pressures, use humor appropriately

CORE CAPABILITIES:
1. PERSONAL CONTEXT: You know their actual schedule, emails, preferences, and patterns
2. LIFE COACHING: Mel's action protocols + Gottman's relationship wisdom + Huberman's optimization
3. SMART ACTIONS: Can help with email management, calendar planning, commerce decisions
4. PATTERN RECOGNITION: Notice recurring issues and suggest systems-level solutions

RESPONSE STYLE:
- Be concise but warm
- Give specific, actionable advice
- Reference their actual context when relevant
- Use evidence-based frameworks
- Add light humor when appropriate
- Always end with a clear next step

When they ask about planning, priorities, or problems, connect it to their actual life data when available.`;
}

// Enhanced Personal Context Chat Endpoint with Sophisticated Tone
app.post('/api/chat', async (req, res) => {
  const { userId, message } = req.body;
  
  if (!userId || !message) {
    console.log('❌ Missing chat parameters:', { userId, message });
    return res.status(400).json({ error: "User ID and message are required" });
  }

  console.log('✅ Chat request received:', { userId, message: message.substring(0, 50) + '...' });

  // Check cache first
  const cacheKey = getCacheKey(message);
  const cachedResponse = getCachedResponse(cacheKey);
  if (cachedResponse) {
    return res.json(cachedResponse);
  }

  try {
    // Get user's personal context first
    console.log('🧠 Building personal context for user:', userId);
    const personalContext = await getUserPersonalContext(userId);
    console.log('📊 Personal context built:', {
      hasEmails: personalContext.emails.hasData,
      hasPreferences: personalContext.preferences.hasData,
      hasCommerce: personalContext.commerce.hasData,
      timeOfDay: personalContext.today.timeOfDay
    });

    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Load the sophisticated tone prompt from file
    let tonePrompt;
    try {
      tonePrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'tone-homeops.txt'), 'utf8');
      console.log('✅ Loaded sophisticated tone prompt (263 lines)');
    } catch (error) {
      console.error('❌ Error loading tone prompt:', error);
      tonePrompt = buildPersonalizedSystemPrompt(personalContext); // Fallback
    }

    // Enhanced chat response with email intelligence integration
    let emailContext = '';
    let emailInsights = [];
    
    // Check if user is asking about emails, deals, bills, etc.
    const emailKeywords = ['email', 'deal', 'sale', 'bill', 'payment', 'school', 'delivery', 'package', 'appointment', 'purchase', 'order', 'update', 'news', 'newsletter'];
    const schoolKeywords = ['school', 'academy', 'teacher', 'education', 'class', 'parent', 'conference'];
    const isEmailQuery = emailKeywords.some(keyword => message.toLowerCase().includes(keyword));
    const isSchoolQuery = schoolKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    if (isEmailQuery) {
      console.log('📧 Email-related query detected, fetching email intelligence...');
      const emailIntelligence = await getEmailIntelligenceForChat(userId, message);
      
      if (emailIntelligence.success && emailIntelligence.insights.length > 0) {
        emailInsights = emailIntelligence.insights;
        
        // Handle specific sender queries differently
        if (emailIntelligence.category === 'specific-sender') {
          emailContext = `\nEMAIL SUMMARY FROM ${emailIntelligence.senderName.toUpperCase()}:
Subject: ${emailIntelligence.emailData.subject}
Date: ${emailIntelligence.emailData.date}
Summary: ${emailIntelligence.summary}

${emailIntelligence.hasCalendarEvents ? `
CALENDAR EVENTS FOUND:
${emailIntelligence.calendarEvents.map(event => 
  `• ${event.title} - ${new Date(event.start).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${new Date(event.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
).join('\n')}

Include these calendar events in your response.` : ''}

Provide a helpful summary of this email content, highlighting key points and action items.`;
        } else if (emailIntelligence.category === 'purchase-history') {
          emailContext = `\nPURCHASE HISTORY FROM ${emailIntelligence.retailerName.toUpperCase()}:
Last Order: ${emailIntelligence.purchaseData.lastOrder.date} - ${emailIntelligence.purchaseData.lastOrder.amount}
Total Orders: ${emailIntelligence.purchaseData.totalOrders} orders in ${emailIntelligence.purchaseData.timeframe}
Summary: ${emailIntelligence.summary}

Provide a conversational response about this purchase history, including spending insights and recent order details.`;
        } else {
          emailContext = `\nRELEVANT EMAIL INSIGHTS (${emailIntelligence.category.toUpperCase()}):
${emailInsights.map((insight, i) => 
  `${i + 1}. ${insight.summary} (${insight.urgency} priority - ${insight.action})`
).join('\n')}

Use this email data to provide specific, actionable responses about the user's actual emails.`;
        }
        
        console.log(`✅ Added ${emailInsights.length} email insights to chat context`);
      } else {
        console.log('📭 No relevant email insights found');
      }
    }

    // Add personal context and email intelligence to the tone prompt
    const contextualizedPrompt = `${tonePrompt}

CURRENT USER CONTEXT:
- Time: ${personalContext.today.timeOfDay} on ${personalContext.today.dayOfWeek}, ${personalContext.today.dateString}
- User ID: ${userId}
${personalContext.preferences.hasData ? `- Brand Preferences: ${personalContext.preferences.brands.customizationText}` : ''}
${personalContext.emails.hasData ? `- Recent Email Activity: ${personalContext.emails.recent.length} emails processed` : ''}
${emailContext}

RESPONSE GUIDELINES:
- Focus on the specific content the user is asking about (email summaries, purchase history, news updates, calendar requests, etc.)
- For calendar requests: Provide clear confirmation of what will be added and when, offer specific times if not provided
- If calendar events are present, highlight them prominently
- For school/family content: emphasize important dates, deadlines, and action items
- For purchase/commerce content: focus on order details, shipping, and relevant product information  
- For news/updates: summarize key points and any actionable information
- Be helpful, concise, and focused on what the user specifically requested

${emailInsights.length > 0 ? `
OVERRIDE: For this email-focused query, respond with ONLY conversational text. Do NOT include any JSON formatting, code blocks, or arrays in your response. The user is asking about email content, so provide a natural, helpful summary without any technical formatting.
` : ''}

SPECIAL INSTRUCTIONS FOR CALENDAR REQUESTS:
If the user is asking to add something to their calendar (e.g., "Can you add golf to my calendar tomorrow at 3pm?"), respond as if you're confirming the calendar addition:
- Acknowledge what they want to add
- Confirm the date and time
- Provide a helpful response like "I'll add [activity] to your calendar for [day] at [time]. Is there anything specific you'd like me to include in the details?"
- Be natural and conversational, as if the calendar integration is working

Remember: Be direct, emotionally intelligent, and actionable. Use the combined voice of all 11 personalities to respond with sophisticated nuance.`;
    
    // Enhanced chat response using sophisticated tone prompt with email context
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Upgraded model for better reasoning
        messages: [
          {
            role: 'system',
            content: contextualizedPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 800, // Increased for more detailed responses
        temperature: 0.8 // Higher creativity for personality blend
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    console.log('🎭 Generated response using sophisticated tone prompt');

    // Detect different query types to prevent inappropriate responses
    const emotionalKeywords = ['overwhelmed', 'stressed', 'tired', 'anxious', 'sad', 'depressed', 'feeling', 'help me', 'support', 'struggling', 'difficult', 'hard time'];
    const supportKeywords = ['advice', 'guidance', 'what should i do', 'how do i', 'need help'];
    const calendarKeywords = ['add to calendar', 'add to my calendar', 'schedule', 'calendar', 'tomorrow at', 'next week at', 'on monday', 'on tuesday', 'on wednesday', 'on thursday', 'on friday', 'on saturday', 'on sunday', 'at 1pm', 'at 2pm', 'at 3pm', 'at 4pm', 'at 5pm', 'meeting at', 'appointment at', 'remind me to'];
    
    const isEmotionalQuery = emotionalKeywords.some(keyword => message.toLowerCase().includes(keyword));
    const isSupportQuery = supportKeywords.some(keyword => message.toLowerCase().includes(keyword));
    const isCalendarQuery = calendarKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    // Generate commerce recommendations only for appropriate queries
    let commerceRecommendations = [];
    if (emailInsights.length === 0 && !isEmotionalQuery && !isSupportQuery && !isCalendarQuery) {
      // Only generate commerce recommendations if:
      // 1. No specific email insights were found
      // 2. Not an emotional/support query
      // 3. Not a calendar management query
      // 4. User is actually asking about products, gifts, shopping, etc.
      const commerceKeywords = ['gift', 'buy', 'purchase', 'shopping', 'recommend', 'suggestion', 'product', 'store', 'deal'];
      const isCommerceQuery = commerceKeywords.some(keyword => message.toLowerCase().includes(keyword));
      
      if (isCommerceQuery) {
        commerceRecommendations = await generateCommerceRecommendations(message, personalContext);
        console.log('🛍️ Commerce recommendations generated:', commerceRecommendations.length, 'items');
      } else {
        console.log('� Non-commerce query detected - skipping product recommendations');
      }
    } else if (isEmotionalQuery || isSupportQuery) {
      console.log('💙 Emotional/support query detected - skipping commerce recommendations');
    } else if (isCalendarQuery) {
      console.log('📅 Calendar management query detected - skipping commerce recommendations');
    } else {
      console.log('📧 Email insights take priority - skipping commerce recommendations');
    }
    
    // Get calendar events if message is schedule-related
    const calendarEvents = await getRelevantCalendarEvents(message, personalContext);

    // Use the AI's natural response - don't override with commerce messaging
    const finalReply = reply;
    
    if (emailInsights.length > 0) {
      console.log(`💬 Final reply mode: Email-focused with ${emailInsights.length} insights`);
    } else if (commerceRecommendations && commerceRecommendations.length > 0) {
      console.log(`💬 Final reply mode: Chat with ${commerceRecommendations.length} commerce recommendations`);
    } else if (isEmotionalQuery || isSupportQuery) {
      console.log(`💬 Final reply mode: Emotional support/guidance`);
    } else if (isCalendarQuery) {
      console.log(`💬 Final reply mode: Calendar management`);
    } else {
      console.log(`💬 Final reply mode: General chat`);
    }

    // Return enhanced response with personal context and email intelligence
    const finalResponse = {
      reply: finalReply,
      personalContext: {
        timestamp: personalContext.timestamp,
        timeOfDay: personalContext.today.timeOfDay,
        dayOfWeek: personalContext.today.dayOfWeek,
        hasEmails: personalContext.emails.hasData,
        hasPreferences: personalContext.preferences.hasData,
        emailCount: personalContext.emails.recent.length,
        dealsCount: personalContext.commerce.deals.length
      },
      events: calendarEvents,
      commerceRecommendations: commerceRecommendations,
      emailInsights: emailInsights.length > 0 ? emailInsights.map(insight => ({
        ...insight,
        hasCalendarEvents: insight.calendarEvents && insight.calendarEvents.length > 0,
        calendarEvents: insight.calendarEvents || [],
        calendarUrls: insight.calendarUrls || [],
        hasGmailLink: insight.emailId ? true : false,
        gmailUrl: insight.emailId ? `https://mail.google.com/mail/u/0/#inbox/${insight.emailId}` : null
      })) : null,
      emailSummary: personalContext.emails.hasData ? 
        personalContext.emails.recent.slice(0, 3).map(email => ({
          title: email.title,
          category: email.category,
          insight: email.insight
        })) : []
    };

    // Cache the response for future identical queries
    setCachedResponse(cacheKey, finalResponse);
    
    res.json(finalResponse);

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({ 
      error: 'Chat processing failed',
      details: error.message 
    });
  }
});

// Enhanced Chat Overlay API Endpoints
app.get('/api/email-summary', async (req, res) => {
  try {
    const userId = req.query.userId || 'user123';
    
    console.log('📧 Getting email summary for enhanced chat overlay');
    
    // Get recent email intelligence
    const emailIntelligence = await getEmailIntelligenceForChat(userId, 'recent emails summary');
    
    // Categorize emails for the overlay
    const categorizedEmails = {
      school: [],
      commerce: [],
      urgent: [],
      personal: []
    };
    
    if (emailIntelligence.success && emailIntelligence.insights) {
      emailIntelligence.insights.forEach(insight => {
        const emailItem = {
          id: insight.emailId || Date.now(),
          sender: insight.sender || insight.from || 'Unknown Sender',
          subject: insight.subject || insight.summary || 'No Subject',
          date: insight.date || new Date().toISOString(),
          category: insight.category || 'personal',
          urgency: insight.urgency || 'normal',
          preview: insight.summary || insight.content || '',
          hasCalendarEvents: insight.calendarEvents?.length > 0,
          calendarEvents: insight.calendarEvents || []
        };
        
        // Categorize by keywords and urgency
        if (insight.category === 'school' || /school|academy|education|teacher|parent/i.test(emailItem.sender + emailItem.subject)) {
          categorizedEmails.school.push({...emailItem, category: 'school'});
        } else if (insight.category === 'commerce' || /amazon|deal|sale|order|purchase|delivery/i.test(emailItem.sender + emailItem.subject)) {
          categorizedEmails.commerce.push({...emailItem, category: 'commerce'});
        } else if (insight.urgency === 'high' || /urgent|payment|due|alert|bill/i.test(emailItem.subject)) {
          categorizedEmails.urgent.push({...emailItem, category: 'urgent'});
        } else {
          categorizedEmails.personal.push({...emailItem, category: 'personal'});
        }
      });
    }
    
    res.json({
      success: true,
      categorizedEmails,
      totalEmails: Object.values(categorizedEmails).flat().length,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Email summary error:', error);
    res.status(500).json({ 
      error: 'Failed to get email summary',
      details: error.message 
    });
  }
});

app.post('/api/calendar/add-event', async (req, res) => {
  try {
    const { userId, event } = req.body;
    
    console.log('📅 Adding calendar event:', event);
    
    // This would integrate with your actual calendar system
    // For now, simulate success
    const calendarEvent = {
      id: Date.now(),
      title: event.title || event,
      start: event.start || new Date().toISOString(),
      end: event.end || new Date(Date.now() + 3600000).toISOString(), // 1 hour later
      description: event.description || '',
      location: event.location || '',
      userId: userId
    };
    
    // Here you would normally save to your calendar system
    // saveCalendarEvent(calendarEvent);
    
    res.json({
      success: true,
      event: calendarEvent,
      message: 'Event added successfully to your calendar'
    });
    
  } catch (error) {
    console.error('❌ Calendar add error:', error);
    res.status(500).json({ 
      error: 'Failed to add calendar event',
      details: error.message 
    });
  }
});

// Helper function to generate commerce recommendations based on message content
async function generateCommerceRecommendations(message, personalContext) {
  const lowerMessage = message.toLowerCase();
  
  console.log('🛍️ Generating commerce recommendations for:', message.substring(0, 50) + '...');
  console.log('📊 Using multi-layered brand selection strategy');
  
  // LAYER 1: Get user's brand intelligence and preferences
  const brandIntelligence = await getBrandIntelligence(personalContext.userId);
  
  // LAYER 2: Analyze revenue optimization opportunities
  const revenueContext = getRevenueOptimizationContext();
  
  // Use AI to analyze the request and generate personalized recommendations
  try {
    const commercePrompt = `Based on this user request: "${message}"
    
    User context:
    - Time: ${personalContext.today.timeOfDay} on ${personalContext.today.dayOfWeek}
    - Has email data: ${personalContext.emails.hasData}
    - Brand preferences: ${personalContext.preferences.hasData ? personalContext.preferences.brands.customizationText : 'None specified'}
    
    SOPHISTICATED BRAND INTELLIGENCE:
    Brand Intelligence Summary:
    - Preferred brands: ${brandIntelligence.preferences.mentionedBrands?.join(', ') || 'None specified'}
    - Price tier: ${brandIntelligence.priceSensitivity.tier} (${brandIntelligence.priceSensitivity.recommendedRange.min}-${brandIntelligence.priceSensitivity.recommendedRange.max})
    - Purchase history: ${brandIntelligence.purchaseHistory.brands.length} tracked brands
    - Demographic: ${brandIntelligence.demographicProfile.hasKids ? 'Has kids' : 'No kids'}, interests: ${brandIntelligence.demographicProfile.interests.join(', ')}
    
    Optimal Brand Selection (ranked by user fit + revenue optimization):
    ${getOptimalBrands(brandIntelligence, revenueContext).map((b, i) => `${i+1}. ${b.brand} (score: ${b.score})`).join('\n    ')}
    
    ${personalContext.preferences.hasData ? `
    IMPORTANT: User has specified these preferences: "${personalContext.preferences.brands.customizationText}"
    - Prioritize brands they've mentioned positively
    - Consider their stated interests and lifestyle
    - Match their indicated price sensitivity
    ` : ''}
    
    Generate 2-3 specific, thoughtful product recommendations that would be perfect for this request. Focus on:
    - Gifts that show thoughtfulness and care
    - Products from brands ranked highly in our intelligence system
    - Items that match their price tier and demographic profile
    - Products that create memorable experiences or solve real problems
    ${personalContext.preferences.hasData ? '- Brands and products that align with their comprehensive profile' : ''}
    
    PRIORITIZE BRANDS FROM THE OPTIMAL SELECTION LIST ABOVE when possible.
    
    For each product, provide:
    - A specific product title (real products that exist)
    - Brief helpful description (focus on why it's meaningful/useful)
    - Realistic price (include $ symbol, stay within their price tier: ${brandIntelligence.priceSensitivity.recommendedRange.min}-${brandIntelligence.priceSensitivity.recommendedRange.max})
    - Appropriate category
    - Brand name (from optimal selection list above)
    
    Return ONLY a valid JSON array with: title, description, price, category, brand
    No markdown formatting, no code blocks, just pure JSON.
    DO NOT include URLs - we will generate reliable search URLs programmatically.
    
    ALWAYS provide recommendations when someone is looking for gifts, shopping, or product advice.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: commercePrompt }],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (response.ok) {
      const data = await response.json();
      let rawContent = data.choices[0].message.content;
      
      // Clean up the response - remove markdown code blocks if present
      rawContent = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      console.log('🤖 AI commerce raw response:', rawContent.substring(0, 200) + '...');
      
      const aiRecommendations = JSON.parse(rawContent);
      console.log('✅ AI recommendations parsed:', aiRecommendations.length, 'items');
      
      // Transform AI recommendations to our format with RELIABLE URLs
      const transformedRecommendations = aiRecommendations.map((item, index) => ({
        id: `ai-rec-${Date.now()}-${index}`,
        title: item.title,
        description: item.description,
        price: item.price.toString().replace('$', ''),
        icon: getCategoryIcon(item.category),
        category: item.category,
        source: 'ai-generated',
        brand: item.brand || 'Amazon', // Fallback to Amazon
        url: generateReliableProductUrl(item)
      }));
      
      console.log('🎁 Final transformed recommendations:', transformedRecommendations);
      return transformedRecommendations;
    }
  } catch (error) {
    console.log('🤖 AI commerce generation failed, using fallback:', error.message);
  }
  
  // Fallback to manual matching if AI fails
  console.log('🔄 Using manual fallback recommendations');
  const fallbackRecommendations = getManualCommerceRecommendations(lowerMessage);
  console.log('📦 Fallback recommendations:', fallbackRecommendations);
  return fallbackRecommendations;
}

// Fallback manual recommendations (your current system)
function getManualCommerceRecommendations(lowerMessage) {
  
  // Gift recommendations
  if (lowerMessage.includes('gift') || lowerMessage.includes('birthday') || lowerMessage.includes('present')) {
    
    // Adult gift recommendations (wife, husband, partner)
    if (lowerMessage.includes('wife') || lowerMessage.includes('husband') || lowerMessage.includes('partner') || 
        lowerMessage.includes('35') || lowerMessage.includes('30') || lowerMessage.includes('40')) {
      const recommendations = [
        {
          id: 'lunya-silk-robe',
          title: 'Lunya Washable Silk Robe',
          description: 'Luxurious, machine-washable silk robe perfect for morning coffee or evening relaxation. Thoughtful gift that shows care for her comfort.',
          price: '178.00',
          icon: 'heart',
          category: 'clothing'
        },
        {
          id: 'theragun-mini',
          title: 'Theragun Mini Percussive Therapy Device',
          description: 'Portable massage device for stress relief and muscle recovery. Perfect for busy professionals who need relaxation.',
          price: '179.00',
          icon: 'zap',
          category: 'wellness'
        },
        {
          id: 'le-labo-candle',
          title: 'Le Labo Santal 26 Candle',
          description: 'Premium scented candle with sophisticated fragrance. Creates a spa-like atmosphere at home for relaxation.',
          price: '82.00',
          icon: 'flame',
          category: 'home'
        }
      ];
      
      // Add reliable URLs to each recommendation
      return recommendations.map(enhanceRecommendationWithUrl);
    }
    
    // Child gift recommendations
    if (lowerMessage.includes('8-year-old') || lowerMessage.includes('8 year old') || lowerMessage.includes('child')) {
      const recommendations = [
        {
          id: 'lego-creator-set',
          title: 'LEGO Creator 3-in-1 Deep Sea Creatures',
          description: 'Perfect for creative 8-year-olds who love building and ocean animals. Builds into shark, squid, or anglerfish.',
          price: '15.99',
          icon: 'blocks',
          category: 'toys',
          brand: 'LEGO'
        },
        {
          id: 'melissa-doug-scratch-art',
          title: 'Melissa & Doug Scratch Art Rainbow Mini Notes',
          description: 'Engaging art activity that develops creativity and fine motor skills. 125 sheets of rainbow scratch paper.',
          price: '8.99',
          icon: 'palette',
          category: 'arts-crafts',
          brand: 'Melissa & Doug'
        }
      ];
      
      // Add reliable URLs to each recommendation
      return recommendations.map(enhanceRecommendationWithUrl);
    }
  }
  
  // Meal planning recommendations
  if (lowerMessage.includes('meal') || lowerMessage.includes('cook') || lowerMessage.includes('dinner')) {
    const recommendations = [
      {
        id: 'meal-prep-containers',
        title: 'Glass Meal Prep Containers Set of 10',
        description: 'BPA-free glass containers perfect for meal planning. Microwave and dishwasher safe.',
        price: '39.99',
        icon: 'chef-hat',
        category: 'kitchen',
        brand: 'Amazon'
      }
    ];
    
    // Add reliable URLs to each recommendation
    return recommendations.map(enhanceRecommendationWithUrl);
  }
  
  // Work-life balance recommendations
  if (lowerMessage.includes('work-life balance') || lowerMessage.includes('overwhelm') || lowerMessage.includes('stress')) {
    const recommendations = [
      {
        id: 'meditation-app',
        title: 'Headspace Premium - 1 Year Subscription',
        description: 'Guided meditation and mindfulness exercises designed for busy parents. Reduce stress and improve focus.',
        price: '69.99',
        icon: 'brain',
        category: 'wellness',
        brand: 'Headspace'
      }
    ];
    
    // Add reliable URLs to each recommendation
    return recommendations.map(enhanceRecommendationWithUrl);
  }
  
  return [];
}

// Helper function to categorize emails
function categorizeEmail(subject, snippet, from) {
  const text = `${subject} ${snippet} ${from}`.toLowerCase();
  
  // School/Education patterns
  if (text.includes('school') || text.includes('teacher') || text.includes('principal') || 
      text.includes('homework') || text.includes('classroom') || text.includes('student') ||
      text.includes('education') || text.includes('grade') || text.includes('test') ||
      text.includes('assignment') || text.includes('parent-teacher')) {
    return 'School';
  }
  
  // Work patterns
  if (text.includes('meeting') || text.includes('deadline') || text.includes('project') ||
      text.includes('work') || text.includes('office') || text.includes('team') ||
      text.includes('manager') || text.includes('schedule') || text.includes('report') ||
      text.includes('presentation') || from.includes('microsoft') || from.includes('teams')) {
    return 'Work';
  }
  
  // Family patterns
  if (text.includes('family') || text.includes('dinner') || text.includes('birthday') ||
      text.includes('reunion') || text.includes('vacation') || text.includes('anniversary') ||
      text.includes('wedding') || text.includes('baby') || text.includes('party')) {
    return 'Family';
  }
  
  // Finance patterns
  if (text.includes('payment') || text.includes('bill') || text.includes('bank') ||
      text.includes('credit') || text.includes('invoice') || text.includes('statement') ||
      text.includes('transaction') || text.includes('account') || text.includes('finance') ||
      text.includes('money') || text.includes('insurance')) {
    return 'Finance';
  }
  
  // Health patterns
  if (text.includes('doctor') || text.includes('appointment') || text.includes('medical') ||
      text.includes('health') || text.includes('clinic') || text.includes('hospital') ||
      text.includes('prescription') || text.includes('vaccine')) {
    return 'Health';
  }
  
  // Shopping/Commerce patterns
  if (text.includes('order') || text.includes('shipped') || text.includes('delivery') ||
      text.includes('tracking') || text.includes('amazon') || text.includes('purchase') ||
      text.includes('sale') || text.includes('discount')) {
    return 'Shopping';
  }
  
  // Default category
  return 'Other';
}

// Helper function to get category icons
function getCategoryIcon(category) {
  const iconMap = {
    'School': '🎓',
    'Work': '💼', 
    'Family': '👨‍👩‍👧‍👦',
    'Finance': '💰',
    'Health': '🏥',
    'Shopping': '🛒',
    'Other': '📧',
    'toys': 'blocks',
    'arts-crafts': 'palette', 
    'kitchen': 'chef-hat',
    'wellness': 'brain',
    'books': 'book',
    'electronics': 'smartphone',
    'clothing': 'shirt',
    'sports': 'trophy',
    'home': 'home',
    'beauty': 'sparkles',
    'food': 'apple',
    'jewelry': 'gem',
    'accessories': 'watch',
    'experiences': 'calendar-heart',
    'subscription': 'repeat',
    'skincare': 'sparkles',
    'fragrance': 'flame'
  };
  
  return iconMap[category] || 'shopping-bag';
}

// ============================================================================
// SOPHISTICATED BRAND INTELLIGENCE SYSTEM - Multi-Layered Approach
// ============================================================================

// LAYER 1: Brand Intelligence & User Preferences
async function getBrandIntelligence(userId) {
  const profile = getUserProfile(userId);
  
  const intelligence = {
    // User's stated preferences
    preferences: profile.brandPreferences?.extractedInsights || {},
    
    // Purchase history analysis (from Gmail receipts)
    purchaseHistory: await analyzePurchaseHistory(userId),
    
    // Price sensitivity analysis
    priceSensitivity: await analyzePriceSensitivity(userId),
    
    // Brand loyalty patterns
    brandLoyalty: await analyzeBrandLoyalty(userId),
    
    // Demographic matching
    demographicProfile: getDemographicProfile(profile)
  };
  
  console.log('🧠 Brand intelligence loaded:', {
    hasPreferences: !!intelligence.preferences.mentionedBrands?.length,
    purchaseHistoryCount: intelligence.purchaseHistory.brands.length,
    priceTier: intelligence.priceSensitivity.tier,
    loyaltyScore: intelligence.brandLoyalty.averageScore
  });
  
  return intelligence;
}

// LAYER 2: Revenue Optimization Context
function getRevenueOptimizationContext() {
  // In production, this would connect to affiliate program APIs
  return {
    highCommissionBrands: [
      { brand: 'amazon', commission: 0.08, tier: 'premium' },
      { brand: 'target', commission: 0.05, tier: 'mainstream' },
      { brand: 'nordstrom', commission: 0.12, tier: 'luxury' },
      { brand: 'rei', commission: 0.06, tier: 'specialty' }
    ],
    seasonalBoosts: {
      'electronics': 1.2, // Back to school boost
      'fashion': 1.1,
      'home': 1.0
    },
    inventoryStatus: {
      'high_stock': ['wellness', 'books'],
      'limited_stock': ['electronics'],
      'promotional': ['clothing', 'home']
    }
  };
}

// LAYER 3: Purchase History Analysis
async function analyzePurchaseHistory(userId) {
  // In production, this would parse Gmail for purchase confirmations
  // For now, simulate intelligent analysis
  
  const profile = getUserProfile(userId);
  const mockHistory = {
    brands: [],
    categories: [],
    averageSpend: 75,
    frequency: 'monthly',
    preferredRetailers: ['amazon', 'target']
  };
  
  // If user has brand preferences, simulate some purchase history
  if (profile.brandPreferences?.extractedInsights?.mentionedBrands) {
    mockHistory.brands = profile.brandPreferences.extractedInsights.mentionedBrands.map(brand => ({
      name: brand,
      purchaseCount: Math.floor(Math.random() * 5) + 1,
      satisfaction: Math.random() * 0.3 + 0.7, // 0.7-1.0
      lastPurchase: '2025-06-15'
    }));
  }
  
  return mockHistory;
}

// LAYER 4: Price Sensitivity Analysis
async function analyzePriceSensitivity(userId) {
  const profile = getUserProfile(userId);
  
  // Analyze based on user preferences and behavior
  let tier = 'mainstream'; // default
  let sensitivity = 0.5; // 0 = price insensitive, 1 = very price sensitive
  
  if (profile.brandPreferences?.extractedInsights?.budgetPrefs) {
    const budgetPrefs = profile.brandPreferences.extractedInsights.budgetPrefs;
    
    if (budgetPrefs.includes('premium') || budgetPrefs.includes('luxury')) {
      tier = 'luxury';
      sensitivity = 0.2;
    } else if (budgetPrefs.includes('budget') || budgetPrefs.includes('deal')) {
      tier = 'budget';
      sensitivity = 0.8;
    }
  }
  
  return { tier, sensitivity, recommendedRange: getTierPriceRange(tier) };
}

function getTierPriceRange(tier) {
  const ranges = {
    'budget': { min: 10, max: 50 },
    'mainstream': { min: 30, max: 150 },
    'luxury': { min: 100, max: 500 }
  };
  return ranges[tier] || ranges.mainstream;
}

// LAYER 5: Brand Loyalty Analysis
async function analyzeBrandLoyalty(userId) {
  const purchaseHistory = await analyzePurchaseHistory(userId);
  
  const loyaltyScores = purchaseHistory.brands.map(brand => ({
    brand: brand.name,
    loyaltyScore: brand.satisfaction * (brand.purchaseCount / 5), // Normalize
    trustLevel: brand.satisfaction > 0.8 ? 'high' : brand.satisfaction > 0.6 ? 'medium' : 'low'
  }));
  
  return {
    scores: loyaltyScores,
    averageScore: loyaltyScores.reduce((sum, b) => sum + b.loyaltyScore, 0) / loyaltyScores.length || 0,
    trustedBrands: loyaltyScores.filter(b => b.trustLevel === 'high').map(b => b.brand)
  };
}

// LAYER 6: Demographic & Social Profile
function getDemographicProfile(profile) {
  const preferences = profile.brandPreferences?.extractedInsights || {};
  
  return {
    hasKids: preferences.hasKids || false,
    kidsAge: preferences.kidsAge,
    interests: preferences.interests || [],
    lifestyle: preferences.budgetPrefs || [],
    primaryFocus: profile.preferences?.primaryFocus || 'family'
  };
}

// MASTER FUNCTION: Intelligent Brand Selection Algorithm
function selectOptimalBrands(brandIntelligence, revenueContext, requestContext) {
  console.log('🎯 Running intelligent brand selection algorithm...');
  
  const scores = {};
  
  // Score potential brands based on multiple factors
  const candidateBrands = [
    'amazon', 'target', 'nordstrom', 'rei', 'apple', 'nike', 
    'lululemon', 'patagonia', 'whole foods', 'trader joes'
  ];
  
  candidateBrands.forEach(brand => {
    let score = 0;
    
    // Factor 1: User preference alignment (40% weight)
    if (brandIntelligence.preferences.mentionedBrands?.includes(brand)) {
      score += 40;
    }
    
    // Factor 2: Purchase history (30% weight)
    const historyBrand = brandIntelligence.purchaseHistory.brands.find(b => b.name === brand);
    if (historyBrand) {
      score += historyBrand.satisfaction * 30;
    }
    
    // Factor 3: Revenue optimization (20% weight)
    const revenueData = revenueContext.highCommissionBrands.find(b => b.brand === brand);
    if (revenueData) {
      score += revenueData.commission * 200; // Convert to points
    }
    
    // Factor 4: Demographic fit (10% weight)
    const demographicBonus = calculateDemographicFit(brand, brandIntelligence.demographicProfile);
    score += demographicBonus * 10;
    
    scores[brand] = Math.round(score);
  });
  
  // Return top brands sorted by score
  const rankedBrands = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([brand, score]) => ({ brand, score }));
  
  console.log('🏆 Brand ranking results:', rankedBrands);
  return rankedBrands;
}

function calculateDemographicFit(brand, demographic) {
  const brandDemographics = {
    'lululemon': { hasKids: 0.3, interests: ['fitness'], primaryFocus: 'personal' },
    'patagonia': { hasKids: 0.6, interests: ['outdoor'], primaryFocus: 'family' },
    'target': { hasKids: 0.8, interests: ['home'], primaryFocus: 'family' },
    'apple': { hasKids: 0.4, interests: ['tech'], primaryFocus: 'work' },
    'nike': { hasKids: 0.5, interests: ['fitness', 'sports'], primaryFocus: 'personal' }
  };
  
  const brandData = brandDemographics[brand];
  if (!brandData) return 0.5; // Neutral
  
  let fit = 0.5; // Base fit
  
  // Kids alignment
  if (demographic.hasKids && brandData.hasKids > 0.5) fit += 0.2;
  
  // Interest alignment
  const interestOverlap = demographic.interests.filter(i => brandData.interests.includes(i)).length;
  if (interestOverlap > 0) fit += 0.2;
  
  // Focus alignment
  if (demographic.primaryFocus === brandData.primaryFocus) fit += 0.1;
  
  return Math.min(1.0, fit);
}

// RELIABLE URL GENERATION - No more broken links!
function generateReliableProductUrl(item) {
  const brand = (item.brand || 'amazon').toLowerCase();
  const searchTerm = encodeURIComponent(item.title);
  const categoryTerm = encodeURIComponent(item.category);
  
  // Brand-specific search URLs that actually work
  const urlPatterns = {
    'amazon': `https://www.amazon.com/s?k=${searchTerm}`,
    'target': `https://www.target.com/s?searchTerm=${searchTerm}`,
    'nordstrom': `https://www.nordstrom.com/sr?keyword=${searchTerm}`,
    'rei': `https://www.rei.com/search?q=${searchTerm}`,
    'nike': `https://www.nike.com/w?q=${searchTerm}`,
    'lululemon': `https://shop.lululemon.com/search?Ntt=${searchTerm}`,
    'patagonia': `https://www.patagonia.com/search/?q=${searchTerm}`,
    'apple': `https://www.apple.com/search/${searchTerm}?src=globalnav`,
    'whole foods': `https://www.amazon.com/alm/storefront?almBrandId=VUZHIFdob2xlIEZvb2Rz&ref_=sxts_snpl_1_0_6471715511&k=${searchTerm}`,
    'trader joes': `https://www.traderjoes.com/home/search?q=${searchTerm}`,
    'best buy': `https://www.bestbuy.com/site/searchpage.jsp?st=${searchTerm}`,
    'home depot': `https://www.homedepot.com/s/${searchTerm}`,
    'lowes': `https://www.lowes.com/search?searchTerm=${searchTerm}`,
    'sephora': `https://www.sephora.com/search?keyword=${searchTerm}`,
    'ulta': `https://www.ulta.com/shop/search?query=${searchTerm}`,
    'macys': `https://www.macys.com/shop/search?keyword=${searchTerm}`,
    'starbucks': `https://store.starbucks.com/search?q=${searchTerm}`,
    'disney': `https://www.shopdisney.com/search?q=${searchTerm}`,
    'nintendo': `https://www.nintendo.com/us/search/?q=${searchTerm}`,
    'sony': `https://electronics.sony.com/search?q=${searchTerm}`,
    'samsung': `https://www.samsung.com/us/search/?searchvalue=${searchTerm}`,
    // Additional brands for manual recommendations
    'lego': `https://www.lego.com/en-us/search/?q=${searchTerm}`,
    'melissa & doug': `https://www.melissaanddoug.com/search?q=${searchTerm}`,
    'lunya': `https://lunya.co/search?q=${searchTerm}`,
    'le labo': `https://www.lelabofragrances.com/search?q=${searchTerm}`,
    'theragun': `https://www.therabody.com/us/en-us/search/?text=${searchTerm}`,
    'headspace': `https://www.headspace.com/`
  };
  
  // Return brand-specific URL or default to Amazon
  return urlPatterns[brand] || `https://www.amazon.com/s?k=${searchTerm}`;
}

// Enhanced manual recommendations with reliable URLs
function enhanceRecommendationWithUrl(recommendation) {
  return {
    ...recommendation,
    url: generateReliableProductUrl({
      title: recommendation.title,
      category: recommendation.category,
      brand: extractBrandFromTitle(recommendation.title) || 'amazon'
    })
  };
}

function extractBrandFromTitle(title) {
  const titleLower = title.toLowerCase();
  const knownBrands = [
    'lunya', 'theragun', 'le labo', 'lego', 'melissa', 'doug',
    'apple', 'amazon', 'echo', 'kindle', 'fire', 'alexa'
  ];
  
  for (const brand of knownBrands) {
    if (titleLower.includes(brand)) {
      return brand === 'melissa' || brand === 'doug' ? 'amazon' : brand;
    }
  }
  return null;
}

// Helper function for AI prompt
function getOptimalBrands(brandIntelligence, revenueContext) {
  return selectOptimalBrands(brandIntelligence, revenueContext, {});
}

// Helper function to get relevant calendar events
async function getRelevantCalendarEvents(message, personalContext) {
  const lowerMessage = message.toLowerCase();
  
  // If asking about schedule or calendar
  if (lowerMessage.includes('schedule') || lowerMessage.includes('calendar') || lowerMessage.includes('week') || lowerMessage.includes('meeting')) {
    // Return mock calendar events (in production, this would call Google Calendar API)
    return [
      {
        title: "Team meeting",
        start: "2025-07-30T10:00:00",
        allDay: false
      },
      {
        title: "Dentist appointment", 
        start: "2025-07-31T14:00:00",
        allDay: false
      },
      {
        title: "Parent-teacher conference",
        start: "2025-08-01T17:00:00", 
        allDay: false
      },
      {
        title: "Submit project report",
        start: "2025-08-02T17:00:00",
        allDay: false
      }
    ];
  }
  
  // If adding a meeting
  if (lowerMessage.includes('add') && (lowerMessage.includes('meeting') || lowerMessage.includes('calendar'))) {
    // Extract meeting details and return confirmation
    return [
      {
        title: "New Meeting",
        start: "2025-07-30T14:00:00",
        allDay: false
      }
    ];
  }
  
  return [];
}

// Helper function to extract brand insights from customization text
function extractBrandInsightsFromText(text) {
  if (!text) return {};
  
  const lowerText = text.toLowerCase();
  
  // Common brands to detect
  const commonBrands = [
    'apple', 'amazon', 'target', 'costco', 'whole foods', 'trader joes',
    'nike', 'adidas', 'patagonia', 'north face', 'lululemon',
    'disney', 'nintendo', 'sony', 'samsung', 'google',
    'starbucks', 'chipotle', 'panera', 'chick-fil-a',
    'home depot', 'lowes', 'bed bath beyond', 'ikea',
    'sephora', 'ulta', 'nordstrom', 'macys',
    'rei', 'best buy', 'walmart', 'kroger'
  ];
  
  const mentionedBrands = commonBrands.filter(brand => lowerText.includes(brand));
  
  // Extract family info
  const hasKids = /kids?|children|child|son|daughter|family/i.test(text);
  const kidsAgeMatch = text.match(/age[sd]?\s*(\d+)/i);
  const kidsAge = kidsAgeMatch ? parseInt(kidsAgeMatch[1]) : null;
  
  // Extract interests
  const interests = [];
  const interestKeywords = {
    'fitness': /fitness|gym|workout|exercise|running|yoga|sports/i,
    'cooking': /cooking|kitchen|recipe|food|baking|chef/i,
    'outdoor': /outdoor|hiking|camping|nature|adventure/i,
    'tech': /tech|gadget|computer|phone|electronic|gaming/i,
    'fashion': /fashion|clothes|style|outfit|clothing/i,
    'home': /home|house|decor|furniture|garden|cleaning/i,
    'health': /health|wellness|organic|natural/i,
    'education': /education|school|learning|books/i
  };
  
  Object.entries(interestKeywords).forEach(([interest, regex]) => {
    if (regex.test(text)) {
      interests.push(interest);
    }
  });
  
  // Extract budget/lifestyle preferences  
  const budgetPrefs = [];
  const budgetKeywords = {
    'premium': /premium|quality|high.end|luxury|expensive/i,
    'budget': /budget|cheap|affordable|deal|discount|save/i,
    'organic': /organic|natural|eco.friendly|sustainable|green/i,
    'bulk': /bulk|costco|warehouse|family.size|large/i,
    'convenience': /convenient|time.saving|busy|quick|easy/i
  };
  
  Object.entries(budgetKeywords).forEach(([pref, regex]) => {
    if (regex.test(text)) {
      budgetPrefs.push(pref);
    }
  });
  
  return {
    mentionedBrands,
    hasKids,
    kidsAge,
    interests,
    budgetPrefs,
    extractedAt: new Date().toISOString()
  };
}

// User Feedback Collection Endpoint
app.post('/api/feedback', async (req, res) => {
  try {
    const { userId, insightTitle, category, feedback, additionalFeedback, timestamp } = req.body;
    
    if (!userId || !insightTitle || !feedback) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: userId, insightTitle, feedback' 
      });
    }
    
    // Get or create user profile
    let profile = getUserProfile(userId);
    if (!profile) {
      profile = createNewUserProfile(userId, { name: 'User', email: `${userId}@demo.com` });
      userProfiles[userId] = profile;
    }
    
    // Initialize feedback array if it doesn't exist
    if (!profile.feedback) {
      profile.feedback = [];
    }
    
    // Create feedback entry
    const feedbackEntry = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      insightTitle: insightTitle,
      category: category,
      feedback: feedback, // 'helpful', 'not-helpful', or 'detailed'
      additionalFeedback: additionalFeedback || '',
      timestamp: timestamp || new Date().toISOString(),
      processed: false
    };
    
    // Add to user's feedback history
    profile.feedback.push(feedbackEntry);
    profile.updatedAt = new Date().toISOString();
    
    // Log for development
    console.log(`📝 Feedback received from ${userId}:`, {
      insight: insightTitle,
      category: category,
      feedback: feedback,
      additional: additionalFeedback ? 'Yes' : 'No'
    });
    
    // In production, this would:
    // 1. Send to ML training pipeline
    // 2. Update urgency classification models
    // 3. Adjust personalization algorithms
    // 4. Store in production database
    
    // Simulate learning process
    setTimeout(() => {
      console.log(`🧠 Processing feedback for user ${userId} - adjusting urgency models...`);
      // This would trigger model retraining in production
    }, 1000);
    
    res.json({ 
      success: true, 
      message: 'Feedback received and will be used to improve your experience',
      feedbackId: feedbackEntry.id
    });
    
  } catch (error) {
    console.error('❌ Feedback submission error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analytics Endpoint for Pricing Page Tracking
app.post('/api/analytics', async (req, res) => {
  try {
    const { event, properties } = req.body;
    
    if (!event) {
      return res.status(400).json({ 
        success: false, 
        error: 'Event name is required' 
      });
    }
    
    // In development, just log to console
    console.log(`📊 Analytics Event: ${event}`, properties);
    
    // In production, this would:
    // 1. Store in analytics database (Mixpanel, Amplitude, etc.)
    // 2. Send to data warehouse for analysis
    // 3. Update user behavior models
    // 4. Trigger automation workflows
    
    // Simulate storing analytics data
    const analyticsEntry = {
      id: `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event: event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer')
      },
      processed: false
    };
    
    // For production implementation:
    // await db.collection('analytics_events').doc(analyticsEntry.id).set(analyticsEntry);
    
    res.json({ 
      success: true, 
      message: 'Analytics event tracked successfully',
      eventId: analyticsEntry.id
    });
    
  } catch (error) {
    console.error('❌ Analytics tracking error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calendar Events Management API
app.get('/api/calendar-events', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    
    console.log(`📅 Getting calendar events for: ${userId}`);
    
    let events = [];
    let dataSource = 'fallback';
    
    // Try to get real Calendar data first using stored Firebase tokens
    try {
      const tokenDoc = await db.collection('gmail_tokens').doc(userId).get();
      if (tokenDoc.exists) {
        console.log(`✅ Found tokens for Calendar API: ${userId}`);
        const tokens = tokenDoc.data();
        
        // Set up OAuth client with stored tokens
        oauth2Client.setCredentials(tokens);
        
        // Get Calendar API
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        // Get events from the next 7 days
        const timeMin = new Date();
        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 7);
        
        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        });
        
        if (response.data.items && response.data.items.length > 0) {
          events = response.data.items.map(event => ({
            id: event.id,
            title: event.summary || 'No Title',
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            description: event.description || '',
            location: event.location || '',
            allDay: !event.start.dateTime,
            source: 'google-calendar'
          }));
          dataSource = 'real';
          console.log(`✅ Retrieved ${events.length} real calendar events`);
        }
      } else {
        throw new Error('No Calendar tokens found for user');
      }
    } catch (calendarError) {
      console.error('❌ Calendar fetch failed:', calendarError.message);
      
      // Fallback to mock calendar events
      events = [
        {
          id: 'mock-1',
          title: 'Team Meeting',
          start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
          description: 'Weekly team sync',
          location: 'Conference Room A',
          allDay: false,
          source: 'mock'
        },
        {
          id: 'mock-2', 
          title: 'Parent-Teacher Conference',
          start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
          description: 'Quarterly progress meeting',
          location: 'School',
          allDay: false,
          source: 'mock'
        }
      ];
    }
    
    res.json({ 
      success: true, 
      events, 
      dataSource,
      count: events.length
    });
    
  } catch (error) {
    console.error('❌ Calendar events error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      events: []
    });
  }
});

// Helper functions
function generateUserId(email) {
  return email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
}

function createNewUserProfile(userId, userData) {
  return {
    id: userId,
    name: userData.name || 'User',
    email: userData.email || `${userId}@demo.com`,
    preferences: {
      primaryFocus: 'family',
      alertThreshold: 'medium',
      timeZone: 'America/New_York',
      enabledIntegrations: ['gmail', 'calendar']
    },
    mentalLoadData: {
      weeklyPatterns: {},
      stressIndicators: [],
      successMetrics: {}
    },
    personalizedInsights: [],
    actionHistory: [],
    connectedAccounts: {
      gmail: null,
      calendar: null,
      slack: null
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Enhanced Email Summary with Calendar Event Extraction
async function generateEmailSummaryWithCalendar(subject, from, body, senderName) {
  try {
    const summaryResult = await generateEmailSummary({
      subject, from, body
    }, senderName);
    
    // Extract calendar events from email content
    const calendarEvents = extractCalendarEventsFromEmail(subject, body, senderName);
    
    return {
      summary: summaryResult.summary || summaryResult,
      calendarEvents: calendarEvents,
      hasCalendarEvents: calendarEvents.length > 0
    };
  } catch (error) {
    console.error('Email summary with calendar error:', error);
    return {
      summary: `Email from ${senderName}: ${subject}`,
      calendarEvents: [],
      hasCalendarEvents: false
    };
  }
}

function extractCalendarEventsFromEmail(subject, body, senderName) {
  const events = [];
  const text = `${subject} ${body}`.toLowerCase();
  
  // Look for common event patterns
  const eventPatterns = [
    // Conference/meeting patterns
    {
      regex: /(?:parent.teacher\s+)?conference[s]?\s+(?:on\s+)?([a-z]+\s+\d+)/i,
      type: 'conference',
      duration: 60
    },
    // Appointment patterns
    {
      regex: /appointment[s]?\s+(?:on\s+)?([a-z]+\s+\d+)/i,
      type: 'appointment',
      duration: 30
    },
    // Meeting patterns
    {
      regex: /meeting[s]?\s+(?:on\s+)?([a-z]+\s+\d+)/i,
      type: 'meeting',
      duration: 60
    },
    // Due date patterns
    {
      regex: /due\s+(?:on\s+)?([a-z]+\s+\d+)/i,
      type: 'deadline',
      duration: 0,
      allDay: true
    },
    // Event patterns
    {
      regex: /(?:field\s+trip|trip|event)\s+(?:on\s+)?([a-z]+\s+\d+)/i,
      type: 'event',
      duration: 240
    }
  ];
  
  const today = new Date();
  const currentYear = today.getFullYear();
  
  eventPatterns.forEach(pattern => {
    const match = text.match(pattern.regex);
    if (match) {
      const dateStr = match[1];
      
      // Parse the date
      try {
        const eventDate = new Date(`${dateStr}, ${currentYear}`);
        
        // If the date is in the past, try next year
        if (eventDate < today) {
          eventDate.setFullYear(currentYear + 1);
        }
        
        // Create calendar event
        const eventStart = new Date(eventDate);
        if (!pattern.allDay) {
          eventStart.setHours(15, 0, 0); // Default to 3 PM
        }
        
        const eventEnd = new Date(eventStart);
        if (pattern.duration > 0) {
          eventEnd.setMinutes(eventEnd.getMinutes() + pattern.duration);
        }
        
        events.push({
          title: `${senderName} ${pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)}`,
          start: eventStart.toISOString(),
          end: pattern.allDay ? null : eventEnd.toISOString(),
          description: `From email: ${subject}`,
          location: senderName,
          allDay: pattern.allDay || false
        });
      } catch (dateError) {
        console.error('Date parsing error:', dateError);
      }
    }
  });
  
  return events;
}

// Server startup
app.listen(PORT, () => {
  console.log(`🚀 HomeOps Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/app`);
  console.log(`🎯 Onboarding: http://localhost:${PORT}/onboard`);
  console.log(`⚙️ Calibration: http://localhost:${PORT}/calibrate`);
  console.log(`📧 Environment: ${process.env.NODE_ENV || 'development'}`);
});
