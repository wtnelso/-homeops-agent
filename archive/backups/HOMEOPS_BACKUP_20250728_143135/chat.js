const express = require('express');
const router = express.Router();

// Chat endpoint
router.post('/', async (req, res) => {
  const { userId, message } = req.body;
  
  if (!userId || !message) {
    console.log('❌ Missing parameters:', { userId, message });
    return res.status(400).json({ error: "User ID and message are required" });
  }

  console.log('✅ Chat request received:', { userId, message: message.substring(0, 50) + '...' });

  try {
    // Hardcode API key temporarily to bypass environment issues (same as commerce)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Simple chat response using OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful HomeOps assistant. Be concise and friendly. Help with life management, travel, and commerce questions.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    res.json({
      reply: reply,
      events: [],
      emailSummary: []
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
