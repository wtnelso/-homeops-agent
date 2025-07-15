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

// Add more mock endpoints here as needed

// Fallback: serve index.html for any other route (for SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`HomeOps server running at http://localhost:${PORT}`);
});
