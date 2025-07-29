require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const HomeOpsDataManager = require('./services/data-manager');

const app = express();
const PORT = 3000;

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
  console.log('🏠 Serving root route -> redirecting to onboard');
  res.redirect('/onboard');
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
    const profile = getUserProfile(userId);
    const limit = parseInt(req.query.limit) || 5;
    
    console.log(`🧠 Getting REAL email intelligence for: ${userId}`);
    
    // Try to get real Gmail data first
    let insights = [];
    let dataSource = 'fallback';
    
    if (profile.integrations && profile.integrations.gmail) {
      console.log('📧 Attempting Gmail API connection...');
      try {
        const gmailInsights = await fetchGmailInsights(profile.integrations.gmail, limit);
        if (gmailInsights && gmailInsights.length > 0) {
          insights = gmailInsights;
          dataSource = 'real';
          console.log(`✅ Retrieved ${insights.length} real Gmail insights`);
        }
      } catch (gmailError) {
        console.error('❌ Gmail fetch failed:', gmailError.message);
      }
    }
    
    // Fallback to generated insights if no real data
    if (insights.length === 0) {
      insights = dataManager.generateRealTimeInsights(userId, profile, limit);
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
    emailSubject: subject
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

// Calibrate route - serve the mobile-optimized calibrate file
app.get('/calibrate', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'calibrate-mobile-fixed.html'));
});

// Onboarding flow routes
app.get('/onboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'onboard.html'));
});

app.get('/landing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.get('/scan', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scan.html'));
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
    
    // Store tokens
    oauth2Client.setCredentials(tokens);
    
    // Redirect based on state
    if (state === 'onboarding') {
      console.log('🎯 Redirecting to scan (onboarding flow)');
      res.redirect('/scan');
    } else {
      console.log('🎯 Redirecting to calibrate (normal flow)');
      res.redirect('/calibrate');
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

// Calibration data endpoint
app.get('/api/calibration-data', (req, res) => {
  try {
    console.log('📧 Loading calibration data...');
    
    // Load mock emails
    const mockDataPath = path.join(__dirname, 'mock', 'emails.json');
    const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
    
    // Process first 17 emails for enhanced calibration experience
    const emails = mockData.emails.slice(0, 17).map((email, index) => {
      // Better brand name extraction
      const brandName = email.source.split(' ')[0] || email.source.split('@')[0] || 'Unknown';
      const lucideIcon = getLucideIcon(email.category, brandName);
      const mentalLoadScore = calculateMentalLoadScore(email.category, email.priority, email.summary);
      
      console.log(`📧 Email ${index + 1}: ${email.category} -> ${lucideIcon} icon, score: ${mentalLoadScore}`);
      
      return {
        id: email.id || `mock_${index + 1}`,
        brandName: brandName,
        brandIcon: lucideIcon,
        emailType: email.category,
        subject: email.subject,
        snippet: email.summary,
        insight: `Mental load assessment for ${email.category} priority email`,
        aiSummary: email.summary,
        score: mentalLoadScore,
        category: email.category.toLowerCase(),
        originalCategory: email.category,
        from: email.source,
        date: new Date().toLocaleDateString(),
        priority: email.priority
      };
    });
    
    console.log(`✅ Returning ${emails.length} processed emails`);
    
    res.json({
      success: true,
      emails: emails,
      totalEmails: emails.length
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
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

// Personal Context Helper Functions for Enhanced Chat
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

    // Add personal context to the tone prompt
    const contextualizedPrompt = `${tonePrompt}

CURRENT USER CONTEXT:
- Time: ${personalContext.today.timeOfDay} on ${personalContext.today.dayOfWeek}, ${personalContext.today.dateString}
- User ID: ${userId}
${personalContext.preferences.hasData ? `- Brand Preferences: ${personalContext.preferences.brands.customizationText}` : ''}
${personalContext.emails.hasData ? `- Recent Email Activity: ${personalContext.emails.recent.length} emails processed` : ''}

Remember: Be direct, emotionally intelligent, and actionable. Use the combined voice of all 11 personalities to respond with sophisticated nuance.`;

    // Enhanced chat response using sophisticated tone prompt
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

    // Return enhanced response with personal context
    res.json({
      reply: reply,
      personalContext: {
        timestamp: personalContext.timestamp,
        timeOfDay: personalContext.today.timeOfDay,
        dayOfWeek: personalContext.today.dayOfWeek,
        hasEmails: personalContext.emails.hasData,
        hasPreferences: personalContext.preferences.hasData,
        emailCount: personalContext.emails.recent.length,
        dealsCount: personalContext.commerce.deals.length
      },
      events: [], // Future: calendar integration
      emailSummary: personalContext.emails.hasData ? 
        personalContext.emails.recent.slice(0, 3).map(email => ({
          title: email.title,
          category: email.category,
          insight: email.insight
        })) : []
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({ 
      error: 'Chat processing failed',
      details: error.message 
    });
  }
});

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

// Calendar Events Management API
app.get('/api/calendar-events', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    
    // Get user profile
    const profile = getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        error: 'User profile not found' 
      });
    }
    
    // Get calendar data from HomeOpsDataManager
    const dataManager = new HomeOpsDataManager(userId, null);
    const calendarData = await dataManager.getCalendarInsights();
    
    // Return formatted calendar events
    res.json({
      success: true,
      events: calendarData.upcomingEvents || [],
      weeklyLoad: calendarData.weeklyLoad || 65,
      upcomingCount: calendarData.upcomingCount || 0,
      message: 'Calendar events retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Calendar events fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/calendar-events', async (req, res) => {
  try {
    const { userId, title, action, source } = req.body;
    
    if (!userId || !title || !action) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: userId, title, action' 
      });
    }
    
    // Get user profile
    let profile = getUserProfile(userId);
    if (!profile) {
      profile = createNewUserProfile(userId, { name: 'User' });
      userProfiles[userId] = profile;
    }
    
    // Initialize calendar events array if it doesn't exist
    if (!profile.calendarEvents) {
      profile.calendarEvents = [];
    }
    
    // Create new calendar event entry
    const eventEntry = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title,
      action: action, // 'add', 'prep_complete', 'reschedule'
      source: source || 'manual',
      timestamp: new Date().toISOString(),
      status: 'active'
    };
    
    // Add to user's calendar events
    profile.calendarEvents.push(eventEntry);
    profile.updatedAt = new Date().toISOString();
    
    console.log(`📅 Calendar action processed for ${userId}:`, {
      title: title,
      action: action,
      source: source
    });
    
    // In production, this would:
    // 1. Integrate with Google Calendar API
    // 2. Create actual calendar events
    // 3. Set up notifications and reminders
    // 4. Sync with other connected calendars
    
    res.json({ 
      success: true, 
      message: `Event "${title}" ${action} successfully`,
      eventId: eventEntry.id
    });
    
  } catch (error) {
    console.error('❌ Calendar event creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/calendar-events', async (req, res) => {
  try {
    const { userId, eventTitle, action, newDateTime, displayTime, eventData } = req.body;
    
    if (!userId || !eventTitle || !action) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: userId, eventTitle, action' 
      });
    }
    
    // Get user profile
    let profile = getUserProfile(userId);
    if (!profile) {
      profile = createNewUserProfile(userId, { name: 'User' });
      userProfiles[userId] = profile;
    }
    
    // Initialize calendar actions array if it doesn't exist
    if (!profile.calendarActions) {
      profile.calendarActions = [];
    }
    
    let actionMessage = '';
    let success = true;
    
    switch(action) {
      case 'prep_complete':
        // Mark preparation as complete
        const prepAction = {
          id: `prep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          eventTitle: eventTitle,
          action: 'prep_complete',
          timestamp: new Date().toISOString(),
          eventData: eventData
        };
        profile.calendarActions.push(prepAction);
        actionMessage = `Preparation marked complete for "${eventTitle}"`;
        break;
        
      case 'reschedule':
        // Process rescheduling
        if (!newDateTime || !displayTime) {
          return res.status(400).json({ 
            success: false, 
            error: 'Missing reschedule data: newDateTime, displayTime' 
          });
        }
        
        const rescheduleAction = {
          id: `reschedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          eventTitle: eventTitle,
          action: 'reschedule',
          originalTime: eventData?.time || 'Unknown',
          newDateTime: newDateTime,
          displayTime: displayTime,
          timestamp: new Date().toISOString(),
          eventData: eventData
        };
        profile.calendarActions.push(rescheduleAction);
        actionMessage = `Event "${eventTitle}" rescheduled to ${displayTime}`;
        break;
        
      default:
        return res.status(400).json({ 
          success: false, 
          error: `Unknown action: ${action}` 
        });
    }
    
    profile.updatedAt = new Date().toISOString();
    
    console.log(`📅 Calendar update processed for ${userId}:`, {
      event: eventTitle,
      action: action,
      newTime: displayTime || 'N/A'
    });
    
    // In production, this would:
    // 1. Update Google Calendar events via API
    // 2. Send confirmation notifications
    // 3. Update related reminders and prep tasks
    // 4. Sync changes across all connected platforms
    
    res.json({ 
      success: success, 
      message: actionMessage,
      action: action,
      eventTitle: eventTitle
    });
    
  } catch (error) {
    console.error('❌ Calendar event update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

function generateUserId(email) {
  // Simple user ID generation based on email
  return Buffer.from(email.toLowerCase()).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
}

function createNewUserProfile(userId, userData) {
  return {
    id: userId,
    name: userData.name || 'User',
    email: userData.email,
    preferences: {
      primaryFocus: 'family', // Default
      emailBatching: true,
      notifications: {
        urgent: true,
        daily: true,
        weekly: false
      },
      insights: {
        aiGenerated: true,
        contextual: true,
        predictive: false
      }
    },
    mentalLoad: {
      currentScore: 65,
      trend: 'stable',
      history: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };
}

app.listen(PORT, () => {
  console.log(`🚀 HomeOps server running at http://localhost:${PORT}`);
  console.log(`🔍 Test API: http://localhost:${PORT}/api/test`);
  console.log(`📧 Calibration: http://localhost:${PORT}/api/calibration-data`);
  console.log(`🎯 Direct test: http://localhost:${PORT}/api-test-direct.html`);
});
