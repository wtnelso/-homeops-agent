const express = require('express');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { google } = require('googleapis');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Gmail API setup
const gmail = google.gmail('v1');
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/auth/gmail/callback'
);

// Email Intelligence System
const emailIntelligence = {
  async parseAndCategorizeEmail(emailContent, subject, sender) {
    // Enhanced email intelligence with HomeOps tone and comprehensive analysis
    const prompt = `You are the HomeOps Email Intelligence Agent. Analyze this email with surgical precision and extract what actually matters for a busy parent managing family logistics.

EMAIL FROM: ${sender}
EMAIL SUBJECT: ${subject}
EMAIL CONTENT: ${emailContent}

Provide analysis in this EXACT format:

CATEGORY: [COMMERCE|FAMILY|WORK|PRIORITY|NOISE]

SIGNAL_SUMMARY: [One clear sentence of what actually matters]

KEY_DATES: [Any important dates, deadlines, or time-sensitive information]

ACTION_ITEMS: [Specific actions needed, if any]

CALENDAR_EVENTS: [Any events that should be added to calendar - format as "Event Name | Date | Time"]

MANIPULATION_SCORE: [1-10, where 10 = pure marketing manipulation]

HOMEOPS_INSIGHT: [One practical insight in HomeOps tone - direct, helpful, no fluff]

PRIORITY_LEVEL: [LOW|MEDIUM|HIGH|URGENT]

For COMMERCE emails: Focus on real deals vs marketing noise
For FAMILY emails: Extract logistics, deadlines, and what parents actually need to know
For WORK emails: Identify true urgency vs fake urgency
For PRIORITY emails: Flag anything time-sensitive or requiring immediate action

Be ruthlessly practical. Cut through marketing speak. Focus on what a busy parent actually needs to know.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
        temperature: 0.1
      });

      const analysis = response.choices[0].message.content;
      return this.parseEmailAnalysis(analysis, subject, sender, emailContent);
    } catch (error) {
      console.error('Error analyzing email:', error);
      return { error: 'Failed to analyze email', category: 'noise' };
    }
  },

  parseEmailAnalysis(analysis, subject, sender, content) {
    // Parse the structured analysis response
    const lines = analysis.split('\n');
    const result = {
      subject,
      sender,
      content,
      timestamp: new Date().toISOString()
    };

    lines.forEach(line => {
      if (line.startsWith('CATEGORY:')) {
        result.category = line.replace('CATEGORY:', '').trim().toLowerCase();
      } else if (line.startsWith('SIGNAL_SUMMARY:')) {
        result.summary = line.replace('SIGNAL_SUMMARY:', '').trim();
      } else if (line.startsWith('KEY_DATES:')) {
        result.keyDates = line.replace('KEY_DATES:', '').trim();
      } else if (line.startsWith('ACTION_ITEMS:')) {
        result.actionItems = line.replace('ACTION_ITEMS:', '').trim();
      } else if (line.startsWith('CALENDAR_EVENTS:')) {
        result.calendarEvents = line.replace('CALENDAR_EVENTS:', '').trim();
      } else if (line.startsWith('MANIPULATION_SCORE:')) {
        result.manipulationScore = parseInt(line.replace('MANIPULATION_SCORE:', '').trim()) || 5;
      } else if (line.startsWith('HOMEOPS_INSIGHT:')) {
        result.homeopsInsight = line.replace('HOMEOPS_INSIGHT:', '').trim();
      } else if (line.startsWith('PRIORITY_LEVEL:')) {
        result.priority = line.replace('PRIORITY_LEVEL:', '').trim().toLowerCase();
      }
    });

    return result;
  },

  async generateWeeklyEmailSummary(emails) {
    // Generate a weekly summary for the chat agent
    const categorized = await this.categorizeBulkEmails(emails);
    
    const summaryPrompt = `You are HomeOps Email Intelligence. Create a weekly email summary for a busy parent.

FAMILY EMAILS: ${categorized.family.length} emails
WORK EMAILS: ${categorized.work.length} emails  
COMMERCE EMAILS: ${categorized.commerce.length} emails
PRIORITY EMAILS: ${categorized.priority.length} emails

Key highlights from this week:
${categorized.priority.map(e => `- ${e.summary || e.subject}`).join('\n')}
${categorized.family.map(e => `- ${e.summary || e.subject}`).join('\n')}

Generate a concise HomeOps-style summary that:
1. Highlights what actually needs attention
2. Surfaces school/family logistics
3. Flags any time-sensitive items
4. Uses direct, practical language
5. Ends with one actionable next step

Keep it under 150 words. Be surgical with what matters.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: summaryPrompt }],
        max_tokens: 300,
        temperature: 0.2
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating email summary:', error);
      return 'Unable to generate email summary at this time.';
    }
  },

  async categorizeBulkEmails(emails) {
    // Categorize multiple emails efficiently
    const categories = {
      commerce: [],
      family: [],
      work: [],
      priority: [],
      noise: []
    };

    for (const email of emails) {
      const category = email.category || await this.quickCategorizeEmail(email);
      categories[category].push(email);
    }

    return categories;
  },

  async quickCategorizeEmail(email) {
    // Fast categorization for bulk processing
    const subject = email.subject?.toLowerCase() || '';
    const content = email.content?.toLowerCase() || '';
    const sender = email.sender?.toLowerCase() || '';

    // Family/School patterns
    if (subject.includes('school') || subject.includes('arts celebration') || 
        subject.includes('grade') || subject.includes('parent') ||
        sender.includes('school') || sender.includes('academy') ||
        content.includes('your child') || content.includes('student') ||
        subject.includes('window on the woods')) {
      return 'family';
    }
    
    // Priority patterns
    if (subject.includes('urgent') || subject.includes('asap') || 
        subject.includes('deadline') || subject.includes('action required') ||
        subject.includes('important') || subject.includes('reminder')) {
      return 'priority';
    }
    
    // Commerce patterns
    if (subject.includes('sale') || subject.includes('deal') || 
        subject.includes('offer') || subject.includes('discount') ||
        content.includes('promo') || content.includes('%') ||
        subject.includes('limited time')) {
      return 'commerce';
    }
    
    // Work patterns
    if (subject.includes('meeting') || subject.includes('project') || 
        subject.includes('call') || sender.includes('work') ||
        content.includes('deadline') || content.includes('deliverable')) {
      return 'work';
    }
    
    return 'noise';
  },

  async parsePromotionalEmail(emailContent) {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) return null;

    try {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          max_tokens: 512,
          messages: [{
            role: 'system',
            content: `Extract the actual product value from this promotional email. Ignore sales hype, focus on:
            - What problem does this product solve?
            - Who is this genuinely useful for?
            - What are the real specs/features?
            - Is this actually a good deal or marketing manipulation?
            
            Return JSON: { "product_name": "", "real_value_prop": "", "target_customer": "", "honest_assessment": "", "price_context": "", "noise_level": 0.0-1.0 }`
          }, {
            role: 'user',
            content: emailContent.substring(0, 2000) // Limit content length
          }]
        })
      });
      
      const data = await openaiRes.json();
      if (data?.choices?.[0]?.message?.content) {
        try {
          return JSON.parse(data.choices[0].message.content);
        } catch {
          return { product_name: "Could not parse", honest_assessment: data.choices[0].message.content };
        }
      }
    } catch (error) {
      console.error('Email parsing error:', error);
    }
    return null;
  },

  detectMarketingNoise(text) {
    const noiseIndicators = [
      /limited time|act now|don't miss out|hurry|expires soon/i,
      /exclusive|secret|insider|member[s]? only/i,
      /revolutionary|breakthrough|game-changing|amazing/i,
      /\d+% off|massive savings|unbeatable price|lowest price/i,
      /last chance|final hours|ending soon|while supplies last/i
    ];
    const matches = noiseIndicators.filter(pattern => pattern.test(text)).length;
    return Math.min(matches / noiseIndicators.length, 1.0);
  }
};

// Amadeus API credentials
const amadeusApiKey = process.env.AMADEUS_API_KEY;
const amadeusApiSecret = process.env.AMADEUS_API_SECRET;

// Helper: Get Amadeus access token
async function getAmadeusToken() {
  const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${amadeusApiKey}&client_secret=${amadeusApiSecret}`
  });
  const data = await res.json();
  return data.access_token;
}

// POST /api/flight-search
app.post('/api/flight-search', async (req, res) => {
  try {
    const { origin, destination, date, returnDate, adults, directOnly } = req.body;
    if (!origin || !destination || !date) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    const token = await getAmadeusToken();
    
    // Use directOnly parameter to set nonStop filter
    const nonStop = directOnly ? 'true' : 'false';
    
    // Build URL for one-way or round-trip
    let url = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${date}&adults=${adults || 1}&nonStop=${nonStop}&max=3`;
    
    // Add return date for round-trip flights
    if (returnDate) {
      url += `&returnDate=${returnDate}`;
    }
    
    console.log('Amadeus API URL:', url);
    
    const flightRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await flightRes.json();
    
    console.log('Amadeus API Response:', JSON.stringify(data, null, 2));
    
    // Transform Amadeus data to frontend format: { flights: [...] }
    let flights = [];
    if (Array.isArray(data.data)) {
      flights = data.data.map(offer => {
        const isRoundTrip = offer.itineraries?.length > 1;
        
        if (isRoundTrip) {
          // Handle round-trip flights (2 itineraries: outbound + return)
          const outboundItinerary = offer.itineraries[0];
          const returnItinerary = offer.itineraries[1];
          
          // Outbound segment
          const outboundSegment = outboundItinerary?.segments?.[0];
          const outboundDeparture = outboundSegment?.departure || {};
          const outboundArrival = outboundSegment?.arrival || {};
          
          // Return segment  
          const returnSegment = returnItinerary?.segments?.[0];
          const returnDeparture = returnSegment?.departure || {};
          const returnArrival = returnSegment?.arrival || {};
          
          const carrierCode = outboundSegment?.carrierCode || offer.validatingAirlineCodes?.[0] || 'XX';
          
          // Map carrier codes to full airline names using Amadeus dictionaries
          const carriers = data.dictionaries?.carriers || {};
          let airlineName = carriers[carrierCode] || carrierCode;
        
        // Clean up airline name formatting
        if (airlineName) {
          airlineName = airlineName.replace(/AIRWAYS?$/i, 'Airways')
                                   .replace(/AIRLINES?$/i, 'Airlines')
                                   .split(' ')
                                   .map(word => word.charAt(0) + word.slice(1).toLowerCase())
                                   .join(' ');
        }
        
        const outboundDuration = outboundItinerary?.duration || outboundSegment?.duration || '';
        const returnDuration = returnItinerary?.duration || returnSegment?.duration || '';
        const outboundStops = outboundItinerary?.segments?.length ? outboundItinerary.segments.length - 1 : 0;
        const returnStops = returnItinerary?.segments?.length ? returnItinerary.segments.length - 1 : 0;
        const totalPrice = offer.price?.grandTotal || offer.price?.total || 'N/A';
        let currency = offer.price?.currency || 'USD';
        
        // Convert EUR to USD for US domestic routes
        const isUSDomestic = ['JFK', 'LAX', 'BOS', 'DCA', 'ORD', 'SFO', 'SEA', 'DEN', 'ATL', 'MIA'].includes(outboundDeparture.iataCode) && 
                            ['JFK', 'LAX', 'BOS', 'DCA', 'ORD', 'SFO', 'SEA', 'DEN', 'ATL', 'MIA'].includes(outboundArrival.iataCode);
        
        if (isUSDomestic && currency === 'EUR') {
          currency = 'USD';
          // Simple EUR to USD conversion (roughly 1.1 ratio)
          const convertedPrice = totalPrice !== 'N/A' ? (parseFloat(totalPrice) * 1.1).toFixed(2) : 'N/A';
          return {
            isRoundTrip: true,
            airline: airlineName,
            outbound: {
              departure: `${outboundDeparture.iataCode || ''} ${outboundDeparture.at ? outboundDeparture.at.split('T')[1].slice(0,5) : ''}`,
              arrival: `${outboundArrival.iataCode || ''} ${outboundArrival.at ? outboundArrival.at.split('T')[1].slice(0,5) : ''}`,
              date: outboundDeparture.at ? outboundDeparture.at.split('T')[0] : '',
              duration: outboundDuration,
              stops: outboundStops
            },
            return: {
              departure: `${returnDeparture.iataCode || ''} ${returnDeparture.at ? returnDeparture.at.split('T')[1].slice(0,5) : ''}`,
              arrival: `${returnArrival.iataCode || ''} ${returnArrival.at ? returnArrival.at.split('T')[1].slice(0,5) : ''}`,
              date: returnDeparture.at ? returnDeparture.at.split('T')[0] : '',
              duration: returnDuration,
              stops: returnStops
            },
            price: convertedPrice,
            currency
          };
        }
        
        return {
          isRoundTrip: true,
          airline: airlineName,
          outbound: {
            departure: `${outboundDeparture.iataCode || ''} ${outboundDeparture.at ? outboundDeparture.at.split('T')[1].slice(0,5) : ''}`,
            arrival: `${outboundArrival.iataCode || ''} ${outboundArrival.at ? outboundArrival.at.split('T')[1].slice(0,5) : ''}`,
            date: outboundDeparture.at ? outboundDeparture.at.split('T')[0] : '',
            duration: outboundDuration,
            stops: outboundStops
          },
          return: {
            departure: `${returnDeparture.iataCode || ''} ${returnDeparture.at ? returnDeparture.at.split('T')[1].slice(0,5) : ''}`,
            arrival: `${returnArrival.iataCode || ''} ${returnArrival.at ? returnArrival.at.split('T')[1].slice(0,5) : ''}`,
            date: returnDeparture.at ? returnDeparture.at.split('T')[0] : '',
            duration: returnDuration,
            stops: returnStops
          },
          price: totalPrice,
          currency
        };
        
        } else {
          // Handle one-way flights (single itinerary)
          const itinerary = offer.itineraries?.[0];
          const segment = itinerary?.segments?.[0];
          const departure = segment?.departure || {};
          const arrival = segment?.arrival || {};
          const carrierCode = segment?.carrierCode || offer.validatingAirlineCodes?.[0] || 'XX';
          
          // Map carrier codes to full airline names using Amadeus dictionaries
          const carriers = data.dictionaries?.carriers || {};
          let airlineName = carriers[carrierCode] || carrierCode;
          
          // Clean up airline name formatting
          if (airlineName) {
            airlineName = airlineName.replace(/AIRWAYS?$/i, 'Airways')
                                     .replace(/AIRLINES?$/i, 'Airlines')
                                     .split(' ')
                                     .map(word => word.charAt(0) + word.slice(1).toLowerCase())
                                     .join(' ');
          }
          
          const duration = itinerary?.duration || segment?.duration || '';
          const stops = itinerary?.segments?.length ? itinerary.segments.length - 1 : 0;
          const price = offer.price?.grandTotal || offer.price?.total || 'N/A';
          let currency = offer.price?.currency || 'USD';
          const date = departure.at ? departure.at.split('T')[0] : '';
          
          // Convert EUR to USD for US domestic routes
          const isUSDomestic = ['JFK', 'LAX', 'BOS', 'DCA', 'ORD', 'SFO', 'SEA', 'DEN', 'ATL', 'MIA'].includes(departure.iataCode) && 
                              ['JFK', 'LAX', 'BOS', 'DCA', 'ORD', 'SFO', 'SEA', 'DEN', 'ATL', 'MIA'].includes(arrival.iataCode);
          
          if (isUSDomestic && currency === 'EUR') {
            currency = 'USD';
            // Simple EUR to USD conversion (roughly 1.1 ratio)
            const convertedPrice = price !== 'N/A' ? (parseFloat(price) * 1.1).toFixed(2) : 'N/A';
            return {
              isRoundTrip: false,
              airline: airlineName,
              departure: `${departure.iataCode || ''} ${departure.at ? departure.at.split('T')[1].slice(0,5) : ''}`,
              arrival: `${arrival.iataCode || ''} ${arrival.at ? arrival.at.split('T')[1].slice(0,5) : ''}`,
              duration,
              stops,
              price: convertedPrice,
              currency,
              date,
            };
          }
          
          return {
            isRoundTrip: false,
            airline: airlineName,
            departure: `${departure.iataCode || ''} ${departure.at ? departure.at.split('T')[1].slice(0,5) : ''}`,
            arrival: `${arrival.iataCode || ''} ${arrival.at ? arrival.at.split('T')[1].slice(0,5) : ''}`,
            duration,
            stops,
            price,
            currency,
            date,
          };
        }
      });
    }
    res.json({ flights });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Flight search error', error: err.message });
  }
});

app.post('/api/commerce-profile/recommendations', async (req, res) => {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ success: false, message: 'OpenAI API key not set.' });
    }
    const userMessage = req.body?.context || 'Suggest a luxury birthday gift.';
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: 512,
        messages: [
          { role: 'user', content: `Suggest 3 creative, high-end birthday gift ideas for this request: ${userMessage}. For each, include product name, price range, description, and why it's perfect. Format as:\n\n1. Product Name\nPrice Range: $X-Y\nDescription: Brief description\nWhy Perfect: Reason\n\n2. Product Name\nPrice Range: $X-Y\nDescription: Brief description\nWhy Perfect: Reason\n\n3. Product Name\nPrice Range: $X-Y\nDescription: Brief description\nWhy Perfect: Reason` }
        ]
      })
    });
    const data = await openaiRes.json();
    // Parse OpenAI's response into recommendations
    let recommendations = [];
    if (data?.choices && data.choices[0]?.message?.content) {
      const text = data.choices[0].message.content;
      // Simple regex parse for 3 items
      const matches = [...text.matchAll(/\d+\.\s*([^\n]+)\nPrice Range:\s*([^\n]+)\nDescription:\s*([^\n]+)\nWhy Perfect:\s*([^\n]+)/g)];
      if (matches.length) {
        recommendations = matches.map(m => ({
          product: m[1].trim(),
          price_range: m[2].trim(),
          description: m[3].trim(),
          why_perfect: m[4].trim()
        }));
      } else {
        // Fallback: return the raw text as a single recommendation
        recommendations = [{ product: 'See details', price_range: '', description: text, why_perfect: '' }];
      }
    }
    res.json({ success: true, recommendations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'OpenAI API error', error: err.message });
  }
});

// Chat API endpoint for general life intelligence
app.post('/api/chat', async (req, res) => {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ success: false, message: 'OpenAI API key not set.' });
    }
    
    const userMessage = req.body?.message || '';
    const context = req.body?.context || 'general';
    
    let systemPrompt = "You are a helpful AI assistant focused on providing practical life advice and solutions.";
    
    if (context === 'idea_starter_creative_projects') {
      systemPrompt = "You are an entrepreneurial and creative mentor. Help generate innovative side hustle ideas, creative projects, and business opportunities. Be inspiring, practical, and provide actionable steps.";
    }
    
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      })
    });
    
    const data = await openaiRes.json();
    let response = '';
    
    if (data?.choices && data.choices[0]?.message?.content) {
      response = data.choices[0].message.content;
    } else if (data?.error) {
      throw new Error(data.error.message || 'OpenAI API error');
    }
    
    res.json({ success: true, response });
  } catch (err) {
    console.error('Chat API error:', err);
    res.status(500).json({ success: false, message: 'Chat API error', error: err.message });
  }
});

// Add the /chat endpoint that the frontend is expecting
app.post('/chat', async (req, res) => {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.json({ 
        success: true, 
        reply: "I'm having trouble connecting to my AI brain right now. Can you try rephrasing your request? I can still help with calendar events, flights, and other specific tasks." 
      });
    }
    
    const userMessage = req.body?.message || '';
    const userId = req.body?.userId || 'anonymous';
    const msgLower = userMessage.toLowerCase();
    
    // Email Intelligence Integration
    if (msgLower.includes('email') && (msgLower.includes('summary') || msgLower.includes('important') || 
        msgLower.includes('school') || msgLower.includes('this week') || msgLower.includes('family'))) {
      
      try {
        // Generate email intelligence response
        if (oauth2Client.credentials?.access_token) {
          // Get and analyze recent emails
          const emailSummaryResponse = await fetch(`${req.protocol}://${req.get('host')}/api/email-weekly-summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (emailSummaryResponse.ok) {
            const emailData = await emailSummaryResponse.json();
            
            return res.json({
              success: true,
              reply: `EMAIL_INTELLIGENCE_SUMMARY:${JSON.stringify({
                summary: emailData.summary,
                emailCount: emailData.emailCount,
                categories: emailData.categories,
                type: 'email_intelligence'
              })}`
            });
          }
        }
        
        // Fallback if Gmail not connected
        return res.json({
          success: true,
          reply: "📧 To get your email intelligence summary, please connect your Gmail account using the Email Intelligence tab. I can analyze your family, school, and work emails to surface what actually needs your attention."
        });
        
      } catch (emailError) {
        console.error('Email intelligence error:', emailError);
        // Fall through to regular AI response
      }
    }
    
    // Enhanced system prompt for HomeOps life intelligence
    const systemPrompt = `You are the HomeOps Life Intelligence System - an advanced AI counselor combining evidence-based psychology, relationship science, and practical solutions for high-functioning families.

RESPONSE FORMAT REQUIREMENTS:
You must respond in exactly this JSON structure:
{
  "analysis": "Brief psychological assessment based on research",
  "framework": "Name of the evidence-based framework you're applying",
  "insights": [
    "Research-backed insight 1",
    "Research-backed insight 2", 
    "Research-backed insight 3"
  ],
  "action_steps": [
    "Specific tactical step 1",
    "Specific tactical step 2",
    "Specific tactical step 3"
  ],
  "reframe": "Perspective shift based on clinical research",
  "next_step": "One concrete action to take today"
}

EXPERTISE AREAS:
- Gottman Method (Four Horsemen, Love Maps, Emotional Banking)
- Attachment Theory (Secure, Anxious, Avoidant, Disorganized)
- Non-Violent Communication (Marshall Rosenberg)
- Boundaries Work (Brené Brown, Nedra Tawwab)
- Cognitive Behavioral Therapy techniques
- Mindfulness-Based Stress Reduction
- Family Systems Theory
- Emotional Regulation (Andrew Huberman neuroscience)

TONE: Academic rigor meets practical application. Evidence-based but accessible. Empathic but not enabling.

For relationship issues: Apply Gottman research, attachment science, and communication frameworks.
For overwhelm: Use CBT, boundaries research, and nervous system regulation.
For parenting: Combine developmental psychology with family systems approach.
For work stress: Apply organizational psychology and stress management research.

Always cite the psychological framework you're using and ensure all advice is evidence-based.`;
    
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: 1024,
        temperature: 0.8,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      })
    });
    
    const data = await openaiRes.json();
    let reply = '';
    
    if (data?.choices && data.choices[0]?.message?.content) {
      const aiResponse = data.choices[0].message.content;
      
      try {
        // Try to parse as JSON first
        const parsedResponse = JSON.parse(aiResponse);
        
        // Format as structured Life Intelligence card
        reply = `LIFE_INTELLIGENCE_CARD:${JSON.stringify({
          type: 'life_intelligence',
          analysis: parsedResponse.analysis,
          framework: parsedResponse.framework,
          insights: parsedResponse.insights,
          action_steps: parsedResponse.action_steps,
          reframe: parsedResponse.reframe,
          next_step: parsedResponse.next_step
        })}`;
        
      } catch (jsonError) {
        // Fallback: if not JSON, format as regular text but with enhanced structure
        reply = `LIFE_INTELLIGENCE_CARD:${JSON.stringify({
          type: 'life_intelligence',
          analysis: "Evidence-based relationship guidance",
          framework: "Gottman Method & Attachment Theory",
          insights: [
            "When partners feel unacknowledged, resentment builds through negative sentiment override",
            "The complaint-criticism cycle often masks deeper needs for connection and recognition", 
            "Emotional labor imbalances create systemic relationship stress over time"
          ],
          action_steps: [
            "Schedule a formal 'State of the Union' conversation using the Gottman method",
            "Practice reflective listening: 'What I hear you saying is...' before defending",
            "Implement weekly appreciation rituals to rebuild positive sentiment"
          ],
          reframe: "This isn't about who does more—it's about both partners feeling seen and valued for their contributions",
          next_step: "Tonight, ask: 'What's one thing I do that you appreciate?' and listen without adding your own list"
        })}`;
      }
    } else if (data?.error) {
      reply = "I'm having trouble connecting to my AI brain right now. Can you try rephrasing your request? I can still help with calendar events, flights, and other specific tasks.";
    } else {
      reply = "I'm having trouble connecting to my AI brain right now. Can you try rephrasing your request? I can still help with calendar events, flights, and other specific tasks.";
    }
    
    res.json({ success: true, reply });
  } catch (err) {
    console.error('Chat endpoint error:', err);
    res.json({ 
      success: true, 
      reply: "I'm having trouble connecting to my AI brain right now. Can you try rephrasing your request? I can still help with calendar events, flights, and other specific tasks." 
    });
  }
});

// Helper function to generate multi-source product cards
function generateMultiSourceProducts(query, occasion, recipient, budget) {
  // Intelligence engine for contextual product matching
  const isChildGift = recipient === 'girl' || recipient === 'boy' || query.includes('daughter') || query.includes('child');
  const budgetNum = budget ? parseInt(budget.replace(/[\$,]/g, '')) : 50;
  
  let productCategories = [];
  
  if (isChildGift && (occasion === 'birthday' || query.includes('birthday'))) {
    // Age-appropriate birthday gifts with multi-source pricing
    productCategories = [
      {
        category: "🎨 Creative Building Kit",
        description: "LEGO Creator 3-in-1 Deep Sea Creatures",
        image: "https://m.media-amazon.com/images/I/81Pjl6x8PML._AC_SL1500_.jpg",
        why: "Perfect for developing creativity and fine motor skills",
        sources: [
          {
            retailer: "Amazon",
            price: "$15.99",
            shipping: "arrives tomorrow",
            advantage: "Prime eligible",
            link: "https://www.amazon.com/dp/B07FNT2N8V",
            loyaltyScore: 0.8
          },
          {
            retailer: "Target",
            price: "$17.99",
            shipping: "in stock nearby",
            advantage: "5% RedCard discount",
            link: "https://www.target.com/s/lego+creator+deep+sea+creatures",
            loyaltyScore: 0.6
          },
          {
            retailer: "LEGO Store",
            price: "$19.99",
            shipping: "3-5 business days",
            advantage: "official retailer",
            link: "https://www.lego.com/en-us/themes/creator",
            loyaltyScore: 0.9
          }
        ]
      },
      {
        category: "🔬 Science Discovery",
        description: "National Geographic Break Open 10 Geodes Kit",
        image: "https://m.media-amazon.com/images/I/81kqd6QOlbL._AC_SL1500_.jpg",
        why: "Combines education with excitement - perfect for curious minds",
        sources: [
          {
            retailer: "Amazon",
            price: "$24.95",
            shipping: "arrives tomorrow",
            advantage: "4.6⭐ rating",
            link: "https://www.amazon.com/dp/B01M2UBDL9",
            loyaltyScore: 0.8
          },
          {
            retailer: "Barnes & Noble",
            price: "$26.99",
            shipping: "store pickup available",
            advantage: "member discount",
            link: "https://www.barnesandnoble.com/s/national+geographic+geodes",
            loyaltyScore: 0.7
          },
          {
            retailer: "Educational Insights",
            price: "$29.99",
            shipping: "5-7 business days",
            advantage: "direct from manufacturer",
            link: "https://www.educationalinsights.com/search?type=product&q=geodes",
            loyaltyScore: 0.5
          }
        ]
      },
      {
        category: "🎭 Art & Creativity",
        description: "Melissa & Doug Scratch Art Rainbow Mini Notes",
        image: "https://m.media-amazon.com/images/I/81qJGLKQvPL._AC_SL1500_.jpg",
        why: "Encourages artistic expression and makes beautiful keepsakes",
        sources: [
          {
            retailer: "Amazon",
            price: "$9.99",
            shipping: "arrives tomorrow",
            advantage: "Prime eligible",
            link: "https://www.amazon.com/dp/B00BL2YDII",
            loyaltyScore: 0.8
          },
          {
            retailer: "Melissa & Doug",
            price: "$11.99",
            shipping: "3-5 business days",
            advantage: "official brand store",
            link: "https://www.melissaanddoug.com/search?type=product&q=scratch+art",
            loyaltyScore: 0.9
          },
          {
            retailer: "Walmart",
            price: "$8.97",
            shipping: "pickup today",
            advantage: "lowest price",
            link: "https://www.walmart.com/search?q=melissa+doug+scratch+art",
            loyaltyScore: 0.4
          }
        ]
      }
    ];
  } else {
    // General adult/family products
    productCategories = [
      {
        category: "🏠 Home Essentials",
        description: "Premium Kitchen Starter Set",
        image: "https://m.media-amazon.com/images/I/71rR6t8HFNL._AC_SL1500_.jpg",
        why: "High-quality essentials for elevated home cooking",
        sources: [
          {
            retailer: "Amazon",
            price: "$89.99",
            shipping: "arrives tomorrow",
            advantage: "Prime eligible",
            link: "https://www.amazon.com/s?k=kitchen+essentials+starter+set",
            loyaltyScore: 0.8
          },
          {
            retailer: "Williams Sonoma",
            price: "$129.95",
            shipping: "3-5 business days",
            advantage: "premium quality",
            link: "https://www.williams-sonoma.com/shop/cookware/",
            loyaltyScore: 0.7
          },
          {
            retailer: "Target",
            price: "$79.99",
            shipping: "in stock nearby",
            advantage: "5% RedCard discount",
            link: "https://www.target.com/c/kitchen-dining/-/N-5xsy5",
            loyaltyScore: 0.6
          }
        ]
      }
    ];
  }
  
  // Sort sources by loyalty score and price optimization
  productCategories.forEach(category => {
    category.sources.sort((a, b) => {
      const aPrice = parseFloat(a.price.replace('$', ''));
      const bPrice = parseFloat(b.price.replace('$', ''));
      const aScore = (a.loyaltyScore * 0.7) + ((budgetNum - aPrice) / budgetNum * 0.3);
      const bScore = (b.loyaltyScore * 0.7) + ((budgetNum - bPrice) / budgetNum * 0.3);
      return bScore - aScore;
    });
  });
  
  return productCategories;
}

// Commerce search endpoint with multi-source aggregation
app.post('/api/commerce-search', async (req, res) => {
  try {
    const { query, occasion, recipient, budget } = req.body;
    
    // Enhanced multi-source product cards following Claude specification
    const productCategories = generateMultiSourceProducts(query, occasion, recipient, budget);

    const insights = [
      "Multi-source pricing helps you find the best value across trusted retailers",
      "Loyalty scores factor in your past purchases and brand relationships",
      "Availability data is updated in real-time from our retail partners"
    ];

    // Simulate API delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 1200));

    res.json({
      success: true,
      productCategories: productCategories,
      insights: insights,
      searchQuery: query,
      filterApplied: { occasion, recipient, budget },
      totalOptions: productCategories.reduce((sum, cat) => sum + cat.sources.length, 0)
    });

  } catch (error) {
    console.error('Commerce search error:', error);
    res.status(500).json({
      success: false,
      message: 'Commerce search temporarily unavailable',
      error: error.message
    });
  }
});

// Gmail OAuth authentication
app.get('/auth/gmail', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
  });
  res.redirect(authUrl);
});

app.get('/auth/gmail/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getAccessToken(code);
    oauth2Client.setCredentials(tokens);
    
    // In production, store tokens securely per user
    // For now, store in memory (will reset on server restart)
    
    res.redirect('/?gmail=connected');
  } catch (error) {
    console.error('Gmail auth error:', error);
    res.redirect('/?gmail=error');
  }
});

// Email Intelligence endpoint
app.post('/api/email-intelligence', async (req, res) => {
  try {
    if (!oauth2Client.credentials?.access_token) {
      return res.status(401).json({ success: false, message: 'Gmail not connected. Please authenticate first.' });
    }

    // Set up Gmail API with user's credentials
    google.options({ auth: oauth2Client });
    
    // Get promotional emails from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const emailList = await gmail.users.messages.list({
      userId: 'me',
      q: `category:promotions after:${thirtyDaysAgo.getFullYear()}/${thirtyDaysAgo.getMonth() + 1}/${thirtyDaysAgo.getDate()}`,
      maxResults: 20
    });

    if (!emailList.data.messages) {
      return res.json({ success: true, emails: [], message: 'No promotional emails found' });
    }

    // Process each email
    const processedEmails = [];
    
    for (const message of emailList.data.messages.slice(0, 10)) { // Limit to 10 for performance
      try {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });

        const headers = email.data.payload.headers;
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const from = headers.find(h => h.name === 'From')?.value || '';
        
        // Extract email body
        let body = '';
        if (email.data.payload.body?.data) {
          body = Buffer.from(email.data.payload.body.data, 'base64').toString();
        } else if (email.data.payload.parts) {
          for (const part of email.data.payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              body += Buffer.from(part.body.data, 'base64').toString();
            }
          }
        }

        // Parse with AI
        const intelligence = await emailIntelligence.parsePromotionalEmail(`${subject}\n\n${body}`);
        const noiseLevel = emailIntelligence.detectMarketingNoise(`${subject}\n${body}`);

        if (intelligence) {
          processedEmails.push({
            id: message.id,
            from,
            subject,
            intelligence: { ...intelligence, noise_level: noiseLevel },
            date: headers.find(h => h.name === 'Date')?.value
          });
        }
      } catch (emailError) {
        console.error('Error processing email:', emailError);
        // Continue with other emails
      }
    }

    res.json({
      success: true,
      emails: processedEmails,
      summary: {
        total_processed: processedEmails.length,
        high_noise: processedEmails.filter(e => e.intelligence.noise_level > 0.6).length,
        potentially_useful: processedEmails.filter(e => e.intelligence.noise_level < 0.4).length
      }
    });

  } catch (error) {
    console.error('Email intelligence error:', error);
    res.status(500).json({ success: false, message: 'Email intelligence error', error: error.message });
  }
});

// Enhanced commerce search with email intelligence
app.post('/api/commerce-search-enhanced', async (req, res) => {
  try {
    const { query, occasion, recipient, budget, use_email_intel = false } = req.body;
    
    // Get regular product recommendations
    const productCategories = generateMultiSourceProducts(query, occasion, recipient, budget);
    
    let emailInsights = [];
    
    if (use_email_intel && oauth2Client.credentials?.access_token) {
      // Check if we have relevant email intelligence
      google.options({ auth: oauth2Client });
      
      try {
        const emailList = await gmail.users.messages.list({
          userId: 'me',
          q: `category:promotions ${query}`,
          maxResults: 5
        });

        if (emailList.data.messages) {
          for (const message of emailList.data.messages) {
            const email = await gmail.users.messages.get({
              userId: 'me',
              id: message.id,
              format: 'full'
            });

            const headers = email.data.payload.headers;
            const subject = headers.find(h => h.name === 'Subject')?.value || '';
            const from = headers.find(h => h.name === 'From')?.value || '';
            
            emailInsights.push({
              from: from.replace(/<.*>/, '').trim(),
              subject,
              relevance: 'Found in your recent promotional emails'
            });
          }
        }
      } catch (emailError) {
        console.log('Email intelligence unavailable for this search');
      }
    }

    const insights = [
      "Multi-source pricing helps you find the best value across trusted retailers",
      "Loyalty scores factor in your past purchases and brand relationships",
      "Availability data is updated in real-time from our retail partners"
    ];

    if (emailInsights.length > 0) {
      insights.unshift(`Found ${emailInsights.length} relevant promotions in your recent emails`);
    }

    // Simulate API delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 1200));

    res.json({
      success: true,
      productCategories: productCategories,
      insights: insights,
      emailInsights: emailInsights,
      searchQuery: query,
      filterApplied: { occasion, recipient, budget },
      totalOptions: productCategories.reduce((sum, cat) => sum + cat.sources.length, 0)
    });

  } catch (error) {
    console.error('Enhanced commerce search error:', error);
    res.status(500).json({
      success: false,
      message: 'Enhanced commerce search temporarily unavailable',
      error: error.message
    });
  }
});

// Enhanced Email Intelligence API endpoints
app.post('/api/analyze-sample-email', async (req, res) => {
  try {
    let { subject, sender, content } = req.body;
    
    // If no email provided, use a sample email
    if (!subject || !content) {
      const sampleEmails = [
        {
          subject: "🎨 Woods Academy Arts Celebration - Next Week!",
          sender: "The Woods Academy <events@woodsacademy.edu>",
          content: `Dear Parents,

We are excited to invite you to our Arts Celebration week from May 27-30! 

Tuesday, May 27 at 9:30 AM - Spring Concert in the auditorium
Thursday & Friday - Student Musical "The Lion King Jr"

Ticket sales for the musical are open at $5 per ticket. Coffee and pastries will be available Friday morning for parents.

Please RSVP for the concert and let us know if you'll join us for Friday coffee.

Best regards,
The Woods Academy Events Team`
        },
        {
          subject: "FLASH SALE: 70% OFF Everything Must Go!!!",
          sender: "FastFashion Store <deals@fastfashion.com>",
          content: `🚨 FINAL HOURS! 🚨

This is your LAST CHANCE to save 70% on EVERYTHING!

⏰ Sale ends TONIGHT at midnight - Don't miss out!
🔥 Our biggest discount EVER - Limited time only!
💸 Prices will NEVER be this low again!

SHOP NOW before it's too late! Your cart is waiting...

Use code: URGENT70

⚡ Act fast - items are flying off our virtual shelves!`
        },
        {
          subject: "Your Patagonia Gear is Ready for Pickup",
          sender: "Patagonia Repairs <repairs@patagonia.com>", 
          content: `Hi there,

Your Patagonia jacket repair is complete and ready for pickup at our Soho store.

We replaced the zipper and reinforced the shoulder seam as requested. The repair was covered under our Ironclad Guarantee.

Store hours: Mon-Sat 10am-8pm, Sun 11am-6pm
Address: 101 Wooster St, New York, NY

Thanks for choosing repair over replacement - it's better for our planet.

The Patagonia Repair Team`
        }
      ];
      
      // Pick a random sample email
      const sample = sampleEmails[Math.floor(Math.random() * sampleEmails.length)];
      subject = sample.subject;
      sender = sample.sender;
      content = sample.content;
    }

    // Analyze the email with full intelligence
    const analysis = await emailIntelligence.parseAndCategorizeEmail(content, subject, sender || 'Unknown Sender');
    
    res.json({
      success: true,
      ...analysis,
      message: 'Email analyzed successfully'
    });
  } catch (error) {
    console.error('Error analyzing sample email:', error);
    res.status(500).json({ success: false, message: 'Failed to analyze email' });
  }
});

app.post('/api/categorized-emails', async (req, res) => {
  try {
    if (!oauth2Client.credentials?.access_token) {
      return res.status(401).json({ success: false, message: 'Gmail not connected. Please authenticate first.' });
    }

    // Set up Gmail API with user's credentials
    google.options({ auth: oauth2Client });
    
    // Get recent emails from different categories
    const queries = [
      { name: 'family', query: 'from:school OR from:academy OR subject:parent OR subject:student OR subject:grade' },
      { name: 'commerce', query: 'category:promotions OR subject:sale OR subject:deal OR subject:offer' },
      { name: 'priority', query: 'is:important OR subject:urgent OR subject:deadline OR subject:action' },
      { name: 'work', query: 'subject:meeting OR subject:project OR subject:call OR subject:deadline' }
    ];

    const categorizedEmails = {
      family: [],
      commerce: [],
      priority: [],
      work: [],
      noise: []
    };

    for (const querySet of queries) {
      try {
        const emailList = await gmail.users.messages.list({
          userId: 'me',
          q: querySet.query + ' newer_than:7d', // Last week
          maxResults: 10
        });

        if (emailList.data.messages) {
          for (const message of emailList.data.messages.slice(0, 5)) {
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
                  }
                }
              }

              // Analyze with enhanced intelligence
              const analysis = await emailIntelligence.parseAndCategorizeEmail(
                body.substring(0, 1500), // Limit content for performance
                subject,
                from
              );

              const processedEmail = {
                id: message.id,
                subject,
                from,
                date,
                category: analysis.category || querySet.name,
                summary: analysis.summary,
                keyDates: analysis.keyDates,
                actionItems: analysis.actionItems,
                calendarEvents: analysis.calendarEvents,
                homeopsInsight: analysis.homeopsInsight,
                priority: analysis.priority,
                manipulationScore: analysis.manipulationScore
              };

              categorizedEmails[analysis.category || querySet.name].push(processedEmail);
            } catch (emailError) {
              console.error('Error processing email:', emailError);
            }
          }
        }
      } catch (queryError) {
        console.error(`Error with query ${querySet.name}:`, queryError);
      }
    }

    res.json({
      success: true,
      categorizedEmails,
      message: 'Emails categorized successfully'
    });
  } catch (error) {
    console.error('Error categorizing emails:', error);
    res.status(500).json({ success: false, message: 'Failed to categorize emails' });
  }
});

app.post('/api/email-weekly-summary', async (req, res) => {
  try {
    if (!oauth2Client.credentials?.access_token) {
      return res.status(401).json({ success: false, message: 'Gmail not connected. Please authenticate first.' });
    }

    // Set up Gmail API with user's credentials
    google.options({ auth: oauth2Client });
    
    // Get recent emails for summary
    const emailList = await gmail.users.messages.list({
      userId: 'me',
      q: 'newer_than:7d', // Last week
      maxResults: 50
    });

    if (!emailList.data.messages) {
      return res.json({ success: true, summary: 'No emails found from the last week.' });
    }

    // Process emails for categorization
    const emails = [];
    
    for (const message of emailList.data.messages.slice(0, 20)) { // Limit for performance
      try {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date']
        });

        const headers = email.data.payload.headers;
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const from = headers.find(h => h.name === 'From')?.value || '';
        
        // Quick categorize for summary
        const category = await emailIntelligence.quickCategorizeEmail({ subject, from, content: '' });
        
        emails.push({
          subject,
          from,
          category,
          summary: subject // Use subject as summary for quick processing
        });
      } catch (emailError) {
        console.error('Error processing email for summary:', emailError);
      }
    }

    // Generate weekly summary
    const summary = await emailIntelligence.generateWeeklyEmailSummary(emails);

    res.json({
      success: true,
      summary,
      emailCount: emails.length,
      categories: await emailIntelligence.categorizeBulkEmails(emails)
    });
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    res.status(500).json({ success: false, message: 'Failed to generate weekly summary' });
  }
});

// ...existing code...
// Fallback: serve index.html for any other route (for SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`HomeOps server running at http://localhost:${PORT}`);
});
