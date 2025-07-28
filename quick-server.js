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

// Email Intelligence API - Now with REAL insights
app.get('/api/email-intelligence', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const profile = getUserProfile(userId);
    const limit = parseInt(req.query.limit) || 5;
    
    console.log(`🧠 Getting REAL email intelligence for: ${userId}`);
    
    // Set user credentials if available
    if (profile.integrations && profile.integrations.gmail) {
      dataManager.setUserCredentials(userId, profile.integrations.gmail);
    }
    
    // Get real-time insights based on actual data
    const insights = await dataManager.generateRealTimeInsights(userId, profile, limit);
    
    res.json({ 
      success: true, 
      insights, 
      userId,
      dataSource: profile.integrations?.gmail ? 'real' : 'fallback'
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
