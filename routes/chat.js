const express = require('express');
const router = express.Router();

// Helper function to get user's personal context
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

    // Get email intelligence
    try {
      const emailResponse = await fetch(`http://localhost:3000/api/email-intelligence?userId=${userId}&limit=10`);
      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        context.emails = {
          recent: emailData.insights || [],
          hasData: emailData.success && Array.isArray(emailData.insights) && emailData.insights.length > 0
        };
      }
    } catch (error) {
      console.log('📧 Email context unavailable:', error.message);
      context.emails = { recent: [], hasData: false };
    }

    // Get brand preferences
    try {
      const brandResponse = await fetch(`http://localhost:3000/api/user/brand-preferences?userId=${userId}`);
      if (brandResponse.ok) {
        const brandData = await brandResponse.json();
        context.preferences = {
          brands: brandData.brandPreferences || {},
          hasData: brandData.success
        };
      }
    } catch (error) {
      console.log('🏷️ Brand preferences unavailable:', error.message);
      context.preferences = { brands: {}, hasData: false };
    }

    // Get recent commerce insights
    try {
      const commerceResponse = await fetch(`http://localhost:3000/api/commerce-intelligence?userId=${userId}`);
      if (commerceResponse.ok) {
        const commerceData = await commerceResponse.json();
        context.commerce = {
          deals: commerceData.deals || [],
          hasData: commerceData.success
        };
      }
    } catch (error) {
      console.log('🛒 Commerce context unavailable:', error.message);
      context.commerce = { deals: [], hasData: false };
    }

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

// Chat endpoint
router.post('/', async (req, res) => {
  const { userId, message } = req.body;
  
  if (!userId || !message) {
    console.log('❌ Missing parameters:', { userId, message });
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

    // Build personalized system prompt
    const systemPrompt = buildPersonalizedSystemPrompt(personalContext);

    // Enhanced chat response using personal context
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 800, // Increased for more detailed responses
        temperature: 0.7 // Balanced creativity and consistency
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

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

module.exports = router;
