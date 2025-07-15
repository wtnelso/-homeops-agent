const express = require('express');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// Commerce search endpoint
app.post('/api/commerce-search', async (req, res) => {
  try {
    const { query, occasion, recipient, budget } = req.body;
    
    // Mock intelligent commerce search results
    const mockProducts = [
      {
        title: "LEGO Creator 3-in-1 Deep Sea Creatures (31088)",
        price: "$15.99",
        image: "https://m.media-amazon.com/images/I/81Pjl6x8PML._AC_SL1500_.jpg",
        link: "https://www.amazon.com/dp/B07FNT2N8V",
        rating: "4.8",
        why: "Perfect for creative 7-year-olds who love building and sea life"
      },
      {
        title: "Melissa & Doug Scratch Art Rainbow Mini Notes",
        price: "$9.99",
        image: "https://m.media-amazon.com/images/I/81qJGLKQvPL._AC_SL1500_.jpg",
        link: "https://www.amazon.com/dp/B00BL2YDII",
        rating: "4.7",
        why: "Encourages creativity and makes beautiful keepsakes"
      },
      {
        title: "National Geographic Break Open 10 Geodes Kit",
        price: "$24.95",
        image: "https://m.media-amazon.com/images/I/81kqd6QOlbL._AC_SL1500_.jpg",
        link: "https://www.amazon.com/dp/B01M2UBDL9",
        rating: "4.6",
        why: "Educational and exciting - perfect for curious minds"
      },
      {
        title: "Klutz LEGO Chain Reactions Activity Kit",
        price: "$19.99",
        image: "https://m.media-amazon.com/images/I/81V6ONVLL5L._AC_SL1500_.jpg",
        link: "https://www.amazon.com/dp/B01M7O8K7H",
        rating: "4.5",
        why: "STEM learning disguised as pure fun"
      }
    ];

    const recommendations = [
      "Consider her current interests - does she love art, science, building, or outdoor activities?",
      "7-year-olds often enjoy gifts that let them create something they can keep or show off",
      "Interactive kits work great at this age - they can follow instructions but also improvise",
      "Books with engaging visuals and simple chapter books are perfect for developing readers"
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json({
      success: true,
      products: mockProducts,
      recommendations: recommendations,
      searchQuery: query,
      filterApplied: { occasion, recipient, budget }
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

// Add more mock endpoints here as needed

// Fallback: serve index.html for any other route (for SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`HomeOps server running at http://localhost:${PORT}`);
});
