// Memory optimization settings
process.env.NODE_OPTIONS = '--max-old-space-size=512 --expose-gc';
process.setMaxListeners(20);

// Increase memory limits for better performance
if (global.gc) {
  // Force initial garbage collection
  global.gc();
}

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
  // Log memory usage before potential crash
  const memUsage = process.memoryUsage();
  console.error('Memory usage before crash:', {
    rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
    external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Log memory usage before potential crash
  const memUsage = process.memoryUsage();
  console.error('Memory usage before rejection:', {
    rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
    external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
  });
});

// Add lightweight development mode for local testing
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.DEV_MODE === 'true';

// Add more aggressive memory monitoring and process protection
setInterval(() => {
  const memUsage = process.memoryUsage();
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  // Only log memory usage in development mode to reduce noise
  if (isDevelopment) {
    console.log('🔍 Memory Usage:', {
      rss: rssMB + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: heapUsedMB + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
    });
  }
  
  // Optimized garbage collection for Render environment
  const gcThreshold = 150; // Higher threshold for Render (512MB limit)
  if (heapUsedMB > gcThreshold) {
    console.log(`🧹 High memory usage detected (${heapUsedMB}MB), forcing garbage collection...`);
    if (global.gc) {
      global.gc();
    }
  }
  
  // Log warning if memory usage is very high (but Render can handle more)
  const warningThreshold = 300; // Higher warning threshold for Render
  if (rssMB > warningThreshold) {
    console.warn(`⚠️ Very high memory usage detected: ${rssMB}MB`);
  }
  
  // Critical memory warning (approaching Render's limit)
  const criticalThreshold = 450; // Close to 512MB limit
  if (rssMB > criticalThreshold) {
    console.error(`🚨 CRITICAL: Memory usage very high: ${rssMB}MB - approaching Render limit`);
    if (global.gc) {
      global.gc();
    }
  }
}, 30000); // Check every 30 seconds to reduce noise

// Add process monitoring to prevent kills
let lastActivity = Date.now();
setInterval(() => {
  const now = Date.now();
  const timeSinceLastActivity = now - lastActivity;
  
  // If no activity for 2 minutes, log to show the process is alive
  if (timeSinceLastActivity > 120000) {
    console.log('💓 Process heartbeat - server is alive and monitoring');
    lastActivity = now;
  }
}, 120000); // Every 2 minutes

// Knowledge chunks cache to prevent memory leaks
let knowledgeChunksCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for memory-constrained systems

async function getCachedKnowledgeChunks() {
  const now = Date.now();
  
  // Return cached chunks if they're still valid
  if (knowledgeChunksCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('📦 Using cached knowledge chunks');
    return knowledgeChunksCache;
  }
  
  // Clear old cache to free memory
  if (knowledgeChunksCache) {
    console.log('🧹 Clearing old knowledge chunks cache');
    knowledgeChunksCache = null;
    if (global.gc) {
      global.gc();
    }
  }
  
  // Fetch fresh chunks with optimized limit for Render
  const chunkLimit = 5; // Even smaller limit for Render
  console.log(`🔄 Fetching fresh knowledge chunks (limit: ${chunkLimit})...`);
  const snapshot = await db.collection('knowledge_chunks')
    .limit(chunkLimit)
    .get();
  
  knowledgeChunksCache = snapshot.docs.map(doc => doc.data());
  cacheTimestamp = now;
  
  console.log(`✅ Cached ${knowledgeChunksCache.length} knowledge chunks`);
  
  // Force garbage collection after loading
  if (global.gc) {
    global.gc();
  }
  
  return knowledgeChunksCache;
}

console.log("🚀 DEPLOYMENT VERSION 8 - LUXON REMOVED - " + new Date().toISOString());
console.log("🟦 CUSTOM DEBUG: This is the CURRENT index.cjs file - Commerce Intelligence should work!");
require("dotenv").config();
console.log("🔑 OPENAI_API_KEY loaded:", process.env.OPENAI_API_KEY ? "✅ YES" : "❌ NO");
console.log("🔧 Environment keys:", Object.keys(process.env).filter(k => k.includes('OPENAI')));
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const fsSync = require("fs"); // For synchronous file operations
const path = require("path");
// Use a more reliable fetch approach
let fetch;
try {
  // Try to use global fetch first (Node 18+)
  if (global.fetch) {
    fetch = global.fetch;
  } else {
    // Fallback to node-fetch v2
    fetch = require("node-fetch");
  }
} catch (err) {
  console.error("❌ Failed to initialize fetch:", err.message);
  // Last resort: try dynamic import
  fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
}
const admin = require("firebase-admin");
// const { DateTime } = require("luxon"); // Temporarily removed for deployment
const chrono = require("chrono-node");
const { google } = require("googleapis");

// Add CORS support
const cors = require("cors");

// Force deployment update - v7 - Remove luxon dependency temporarily

// Simple date function to replace luxon
function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}

// Improved Firebase initialization with proper error handling
let firebaseInitialized = false;

// Try to initialize with service account file first
try {
  const serviceAccountPath = path.join(__dirname, "homeops-sa-key.json");
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fsSync.readFileSync(serviceAccountPath, "utf8"));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
      firebaseInitialized = true;
    console.log("✅ Firebase initialized successfully via service account file.");
    }
  } else {
    console.log("ℹ️ Service account file not found, trying environment variables...");
  }
} catch (err) {
  console.log("ℹ️ Service account file error, trying environment variables...");
}

// Fallback to environment variables if service account file failed
if (!firebaseInitialized) {
  try {
    const base64 = process.env.FIREBASE_CREDENTIALS;
    if (!base64) {
      throw new Error("FIREBASE_CREDENTIALS env var not set.");
    }
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    const firebaseCredentials = JSON.parse(decoded);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseCredentials),
      });
      firebaseInitialized = true;
      console.log("✅ Firebase initialized successfully via environment variable.");
    }
  } catch (fallbackErr) {
    console.error("❌ Firebase initialization failed:", fallbackErr.message);
    console.error("❌ No valid credential source found. Please check your configuration.");
    process.exit(1); // Exit if no valid credential source found
  }
}

const db = admin.firestore();
const app = express();
const port = process.env.PORT || 3000;

// Add activity tracking middleware
app.use((req, res, next) => {
  lastActivity = Date.now();
  next();
});

// Enable CORS for all routes at the very top
app.use(cors({
  origin: [
    'https://homeops-web.web.app',
    'https://homeops-web.firebaseapp.com',
    'https://homeops-backend.onrender.com',
    'https://homeops-agent.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true
}));

// Handle CORS preflight requests
app.options('*', cors({
  origin: [
    'https://homeops-web.web.app',
    'https://homeops-web.firebaseapp.com',
    'https://homeops-backend.onrender.com',
    'https://homeops-agent.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true
}));

// Load the persona file content at startup
let tonePromptContent = "";
try {
  tonePromptContent = fsSync.readFileSync(path.join(__dirname, "prompts", "tone-homeops.txt"), "utf-8");
  console.log("✅ Persona file loaded successfully.");
} catch (err) {
  console.error("❌ Failed to load persona file:", err.message);
  // Continue without it, but log the error
}

app.use(bodyParser.json());

// Gmail OAuth setup (BEFORE static middleware to avoid conflicts)
const gmail = google.gmail('v1');
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/auth/gmail/callback'
);

console.log("🔍 Gmail OAuth Config Debug:");
console.log("Client ID:", process.env.GMAIL_CLIENT_ID ? "SET" : "NOT SET");
console.log("Client Secret:", process.env.GMAIL_CLIENT_SECRET ? "SET" : "NOT SET");
console.log("Redirect URI:", process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/auth/gmail/callback');

// Test route to verify routing works
app.get('/test-route', (req, res) => {
  console.log("🧪 Test route hit!");
  res.json({ message: "Test route works!", timestamp: new Date().toISOString() });
});

// Gmail OAuth authentication routes (BEFORE static middleware)
app.get('/auth/gmail', (req, res) => {
  console.log("🔍 Gmail OAuth initiated - ROUTE HIT!");
  console.log("🔍 Request URL:", req.url);
  console.log("🔍 Request method:", req.method);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
  });
  console.log("🔗 Redirecting to:", authUrl);
  res.redirect(authUrl);
});

app.get('/auth/gmail/callback', async (req, res) => {
  const { code } = req.query;
  console.log("🔍 Gmail OAuth callback received with code:", code ? "✅" : "❌");
  try {
    const { tokens } = await oauth2Client.getAccessToken(code);
    oauth2Client.setCredentials(tokens);
    console.log("✅ Gmail OAuth tokens obtained successfully");
    
    // In production, store tokens securely per user
    // For now, store in memory (will reset on server restart)
    
    res.redirect('/?gmail=connected');
  } catch (error) {
    console.error("❌ Gmail OAuth error:", error.message);
    res.redirect('/?gmail=error');
  }
});

// Serve static files from public directory (AFTER OAuth routes)
app.use(express.static("public"));
app.use("/mock", express.static("mock"));

console.log("🔧 About to register routes...");

// Root route - serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Simple test POST route
console.log("🔧 Registering test POST route...");
app.post("/api/test", (req, res) => {
  console.log("✅ Test POST route called!");
  res.json({ message: "Test POST endpoint works!" });
});
console.log("✅ Test POST route registered");

// Firebase config endpoint
app.get("/api/firebase-config", (req, res) => {
  // Provide a basic Firebase config for the homeops-web project
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBxGxGxGxGxGxGxGxGxGxGxGxGxGxGxGx",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "homeops-web.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "homeops-web",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "homeops-web.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
  };
  
  res.json(firebaseConfig);
});

// Flight API Proxy Endpoints to handle CORS
// Airport lookup with enhanced fallback mapping
app.get("/api/airports", async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ error: "Airport name or city required" });
    }

    console.log(`🔍 Airport lookup for: "${name}"`);

    // Enhanced city to airport code mapping for common destinations
    const cityToIATA = {
      'new york': 'JFK',
      'nyc': 'JFK', 
      'los angeles': 'LAX',
      'la': 'LAX',
      'lax': 'LAX', // Direct IATA code lookup
      'chicago': 'ORD',
      'miami': 'MIA',
      'seattle': 'SEA',
      'san francisco': 'SFO',
      'sfo': 'SFO',
      'boston': 'BOS',
      'denver': 'DEN',
      'atlanta': 'ATL',
      'dallas': 'DFW',
      'houston': 'IAH',
      'phoenix': 'PHX',
      'las vegas': 'LAS',
      'orlando': 'MCO',
      'washington': 'DCA',
      'dc': 'DCA',
      'london': 'LHR',
      'paris': 'CDG',
      'tokyo': 'NRT',
      'amsterdam': 'AMS',
      'rome': 'FCO',
      'madrid': 'MAD',
      // Additional common airports
      'jfk': 'JFK',
      'ord': 'ORD',
      'dfw': 'DFW',
      'mia': 'MIA',
      'sea': 'SEA'
    };

    // Enhanced airport details for fallback
    const airportDetails = {
      'JFK': { name: 'John F. Kennedy International Airport', city: 'New York', country: 'US' },
      'LAX': { name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'US' },
      'ORD': { name: "O'Hare International Airport", city: 'Chicago', country: 'US' },
      'MIA': { name: 'Miami International Airport', city: 'Miami', country: 'US' },
      'SEA': { name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'US' },
      'SFO': { name: 'San Francisco International Airport', city: 'San Francisco', country: 'US' },
      'BOS': { name: 'Logan International Airport', city: 'Boston', country: 'US' },
      'DEN': { name: 'Denver International Airport', city: 'Denver', country: 'US' },
      'ATL': { name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'US' },
      'DFW': { name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'US' },
      'LHR': { name: 'Heathrow Airport', city: 'London', country: 'GB' },
      'CDG': { name: 'Charles de Gaulle Airport', city: 'Paris', country: 'FR' }
    };

    const cityLower = name.toLowerCase().trim();
    let iataCode = cityToIATA[cityLower];

    console.log(`📍 Mapped "${cityLower}" → ${iataCode || 'NOT_FOUND'}`);

    // If we found a mapping, try API Ninjas first
    if (iataCode) {
      try {
        const response = await fetch(`https://api.api-ninjas.com/v1/airports?iata=${iataCode}`, {
          headers: {
            'X-Api-Key': process.env.API_NINJAS_KEY
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            console.log(`✅ API Ninjas success for ${iataCode}`);
            return res.json(data);
          }
        }
        console.log(`⚠️ API Ninjas failed for ${iataCode}, using fallback`);
      } catch (apiError) {
        console.log(`❌ API Ninjas error for ${iataCode}:`, apiError.message);
      }
    }

    // Enhanced fallback: return detailed airport data if we have the IATA code
    if (iataCode && airportDetails[iataCode]) {
      const airport = airportDetails[iataCode];
      const fallbackData = [{
        iata: iataCode,
        name: airport.name,
        city: airport.city,
        country: airport.country
      }];
      console.log(`✅ Using fallback data for ${iataCode}`);
      return res.json(fallbackData);
    }

    // Last resort fallback for basic IATA codes
    if (iataCode) {
      const basicData = [{
        iata: iataCode,
        name: `${name} Airport`,
        city: name,
        country: 'Unknown'
      }];
      console.log(`✅ Using basic fallback for ${iataCode}`);
      return res.json(basicData);
    }

    console.log(`❌ No airport code found for: ${name}`);
    res.status(404).json({ error: `Airport code not found for: ${name}` });
  } catch (error) {
    console.error("Airport lookup error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Amadeus access token
app.post("/api/amadeus/token", async (req, res) => {
  try {
    const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=client_credentials&client_id=${process.env.AMADEUS_API_KEY}&client_secret=${process.env.AMADEUS_API_SECRET}`
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Amadeus auth error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Amadeus token error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Amadeus flight search
app.get("/api/amadeus/flights", async (req, res) => {
  try {
    const { origin, destination, date, adults, token, nonStop } = req.query;
    
    console.log('🔍 Flight search request:', { origin, destination, date, adults, nonStop });
    
    if (!origin || !destination || !date || !token) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const adultCount = adults || '1'; // Default to 1 if not provided
    
    // Build the URL with optional nonStop parameter
    let apiUrl = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${date}&adults=${adultCount}&currencyCode=USD`;
    
    if (nonStop === 'true') {
      apiUrl += '&nonStop=true';
    }
    
    console.log('🛫 API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Amadeus flight search error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✈️ Found ${data.data?.length || 0} flights for ${adultCount} passengers`);
    res.json(data);
  } catch (error) {
    console.error("Amadeus flight search error:", error);
    res.status(500).json({ error: error.message });
  }
});

const amazonPaapi = require('amazon-paapi');

// Amazon PA-API configuration
const amazonConfig = {
  AccessKey: process.env.AMAZON_ACCESS_KEY,
  SecretKey: process.env.AMAZON_SECRET_KEY,
  PartnerTag: process.env.AMAZON_PARTNER_TAG, // Your Amazon Associate tag
  PartnerType: "Associates",
  Marketplace: "www.amazon.com"
};

// Search for products on Amazon and get buy links
async function searchAmazonProducts(searchQuery, maxResults = 3) {
  try {
    if (!amazonConfig.AccessKey || !amazonConfig.SecretKey || !amazonConfig.PartnerTag) {
      console.log('⚠️ Amazon API credentials not configured, using fallback links');
      return null;
    }

    const requestParameters = {
      Keywords: searchQuery,
      SearchIndex: 'All',
      ItemCount: maxResults,
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'ItemInfo.Features',
        'Offers.Listings.Price',
        'Offers.Listings.DeliveryInfo.IsPrimeEligible'
      ]
    };

    const data = await amazonPaapi.SearchItems(amazonConfig, requestParameters);
    
    if (data && data.SearchResult && data.SearchResult.Items) {
      return data.SearchResult.Items.map(item => ({
        title: item.ItemInfo?.Title?.DisplayValue || 'Product',
        price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount || 'Price varies',
        image: item.Images?.Primary?.Large?.URL || '',
        buyLink: item.DetailPageURL || '',
        isPrime: item.Offers?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible || false,
        asin: item.ASIN
      }));
    }
    
    return null;
  } catch (error) {
    console.error('❌ Amazon API error:', error);
    return null;
  }
};

// ================================
// ✈️ FLIGHT SEARCH API
// ================================

app.post('/api/flight-search', async (req, res) => {
  try {
    const { origin, destination, date, returnDate, adults = 2, directOnly = true } = req.body;
    
    console.log('🛫 Flight search request:', { origin, destination, date, returnDate, adults, directOnly });
    
    // Get Amadeus token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.AMADEUS_API_KEY,
        client_secret: process.env.AMADEUS_API_SECRET
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Failed to get Amadeus token: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;
    
    // Use directOnly parameter to set nonStop filter
    const nonStop = directOnly ? 'true' : 'false';
    
    // Build URL for one-way or round-trip
    let url = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${date}&adults=${adults || 1}&nonStop=${nonStop}&max=3`;
    
    // Add return date for round-trip flights
    if (returnDate) {
      url += `&returnDate=${returnDate}`;
    }
    
    console.log('🔗 Amadeus API URL:', url);
    
    const flightResponse = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!flightResponse.ok) {
      throw new Error(`Amadeus API error: ${flightResponse.status}`);
    }
    
    const data = await flightResponse.json();
    console.log('📊 Amadeus API Response received');
    
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
          
          const totalPrice = offer.price?.grandTotal || offer.price?.total || 'N/A';
          let currency = offer.price?.currency || 'USD';
          
          // Convert EUR to USD for US domestic routes
          const isUSDomestic = ['JFK', 'LAX', 'BOS', 'DCA', 'ORD', 'SFO', 'SEA', 'DEN', 'ATL', 'MIA'].includes(outboundDeparture.iataCode) && 
                              ['JFK', 'LAX', 'BOS', 'DCA', 'ORD', 'SFO', 'SEA', 'DEN', 'ATL', 'MIA'].includes(outboundArrival.iataCode);
          
          if (isUSDomestic && currency === 'EUR') {
            currency = 'USD';
            const convertedPrice = totalPrice !== 'N/A' ? (parseFloat(totalPrice) * 1.1).toFixed(2) : 'N/A';
            return {
              isRoundTrip: true,
              airline: airlineName,
              outbound: {
                departure: `${outboundDeparture.iataCode || ''} ${outboundDeparture.at ? outboundDeparture.at.split('T')[1].slice(0,5) : ''}`,
                arrival: `${outboundArrival.iataCode || ''} ${outboundArrival.at ? outboundArrival.at.split('T')[1].slice(0,5) : ''}`,
                date: outboundDeparture.at ? outboundDeparture.at.split('T')[0] : '',
                duration: outboundItinerary?.duration || '',
                stops: outboundItinerary?.segments?.length ? outboundItinerary.segments.length - 1 : 0
              },
              return: {
                departure: `${returnDeparture.iataCode || ''} ${returnDeparture.at ? returnDeparture.at.split('T')[1].slice(0,5) : ''}`,
                arrival: `${returnArrival.iataCode || ''} ${returnArrival.at ? returnArrival.at.split('T')[1].slice(0,5) : ''}`,
                date: returnDeparture.at ? returnDeparture.at.split('T')[0] : '',
                duration: returnItinerary?.duration || '',
                stops: returnItinerary?.segments?.length ? returnItinerary.segments.length - 1 : 0
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
              duration: outboundItinerary?.duration || '',
              stops: outboundItinerary?.segments?.length ? outboundItinerary.segments.length - 1 : 0
            },
            return: {
              departure: `${returnDeparture.iataCode || ''} ${returnDeparture.at ? returnDeparture.at.split('T')[1].slice(0,5) : ''}`,
              arrival: `${returnArrival.iataCode || ''} ${returnArrival.at ? returnArrival.at.split('T')[1].slice(0,5) : ''}`,
              date: returnDeparture.at ? returnDeparture.at.split('T')[0] : '',
              duration: returnItinerary?.duration || '',
              stops: returnItinerary?.segments?.length ? returnItinerary.segments.length - 1 : 0
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
    
    console.log('✅ Processed flights:', flights.length);
    res.json({ flights });
    
  } catch (error) {
    console.error('❌ Flight search error:', error);
    res.status(500).json({ success: false, message: 'Flight search error', error: error.message });
  }
});

// ================================
// 🛍️ COMMERCE INTELLIGENCE API  
// ================================

console.log("🔧 EXECUTION REACHED COMMERCE INTELLIGENCE SECTION!");
console.log("🔧 DEBUG: About to register commerce intelligence route...");
console.log("🔧 Registering commerce intelligence route...");
app.post('/api/commerce-intelligence', async (req, res) => {
  console.log("✅ NEW COMMERCE INTELLIGENCE ROUTE called with:", req.body?.query);
  try {
    const CommerceIntelligence = require('./services/commerce-intelligence');
    const commerce = new CommerceIntelligence();
    
    const query = req.body?.query || '';
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }
    
    const result = await commerce.process(query);
    console.log("🛍️ Commerce Intelligence result:", JSON.stringify(result, null, 2));
    
    res.json(result);
  } catch (error) {
    console.error("❌ Commerce Intelligence error:", error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process commerce query',
      details: error.message 
    });
  }
});

console.log("✅ Commerce Intelligence route registered successfully!");

// ================================
// 🛍️ COMMERCE PROFILE API  
// ================================

console.log("🔧 Registering commerce profile recommendations route...");
app.post('/api/commerce-profile/recommendations', async (req, res) => {
  console.log("✅ Commerce profile route called!");
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ success: false, message: 'OpenAI API key not set.' });
    }
    const userMessage = req.body?.context || 'Suggest a luxury birthday gift.';
    
    // Enhanced prompt for better demographic and contextual awareness
    const systemPrompt = `You are a personalized shopping assistant that gives contextually appropriate gift recommendations.

CRITICAL: Pay close attention to:
- AGE: A 5-year-old needs very different gifts than a 25-year-old
- GENDER: Consider traditional and modern preferences for boys, girls, men, women
- OCCASION: Birthday, anniversary, graduation, holiday, etc.
- BUDGET: Match suggestions to the stated or implied price range
- INTERESTS: Look for clues about hobbies, personality, lifestyle

For children:
- 2-4 years: Educational toys, sensory play, simple puzzles
- 5-8 years: LEGO sets, art supplies, books, dress-up for girls, action figures for boys
- 9-12 years: Board games, craft kits, sports equipment, age-appropriate tech
- 13+ teens: Tech accessories, trendy items, hobby-related gifts

For adults:
- Consider lifestyle, career stage, relationship status
- Quality over quantity for higher budgets
- Experiences often trump physical items

Always suggest gifts that are:
1. Age-appropriate and safe
2. Aligned with gender preferences (when specified)
3. Within the stated budget
4. Thoughtful and personal to the context given`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: 600,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Based on this specific request, suggest 3 perfectly targeted gift recommendations: ${userMessage}

Format each as:
1. Product Name
Price Range: $X-Y  
Description: Brief description
Why Perfect: Specific reason this matches the recipient's age, interests, and occasion

2. Product Name
Price Range: $X-Y
Description: Brief description  
Why Perfect: Specific reason this matches the recipient's age, interests, and occasion

3. Product Name
Price Range: $X-Y
Description: Brief description
Why Perfect: Specific reason this matches the recipient's age, interests, and occasion` }
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

// ================================
// 🤖 HOMEOPS CHAT API
// ================================

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log('💬 HomeOps chat request:', message);
    
    // Read the HomeOps tone prompt
    const homeOpsTonePrompt = await fs.readFile(path.join(__dirname, 'prompts', 'tone-homeops.txt'), 'utf-8');
    
    const fullTonePrompt = `${homeOpsTonePrompt}

User message: "${message}"

Respond as HomeOps with the personality blend above. Keep responses conversational, helpful, and engaging. If it's about travel, shopping, calendar, or other services, guide them appropriately.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content: fullTonePrompt
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const botResponse = data.choices?.[0]?.message?.content || "I'm having trouble responding right now. Please try again!";

    res.json({
      success: true,
      response: botResponse
    });

  } catch (error) {
    console.error('❌ Chat API error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      response: "I'm experiencing some technical difficulties. Please try again in a moment!"
    });
  }
});

// ================================
// 📅 CALENDAR EVENTS API
// ================================

// In-memory calendar storage (replace with database in production)
let calendarEvents = [];

// Get calendar events for a user
app.get('/api/calendar-events/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userEvents = calendarEvents.filter(event => event.userId === userId);
    
    res.json({
      success: true,
      events: userEvents
    });
  } catch (error) {
    console.error('📅 Error fetching calendar events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar events',
      error: error.message
    });
  }
});

// Create a new calendar event
app.post('/api/calendar-events', (req, res) => {
  try {
    const { userId, title, date, time, type, description } = req.body;
    
    const newEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title,
      date,
      time,
      type: type || 'general',
      description: description || '',
      created: new Date().toISOString()
    };
    
    calendarEvents.push(newEvent);
    
    console.log('📅 Created new calendar event:', newEvent);
    
    res.json({
      success: true,
      event: newEvent,
      message: 'Event created successfully'
    });
  } catch (error) {
    console.error('📅 Error creating calendar event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create calendar event',
      error: error.message
    });
  }
});

// Update a calendar event
app.put('/api/calendar-events/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;
    
    const eventIndex = calendarEvents.findIndex(event => event.id === eventId);
    
    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    calendarEvents[eventIndex] = {
      ...calendarEvents[eventIndex],
      ...updates,
      updated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      event: calendarEvents[eventIndex],
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('📅 Error updating calendar event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update calendar event',
      error: error.message
    });
  }
});

// Delete a calendar event
app.delete('/api/calendar-events/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;
    
    const eventIndex = calendarEvents.findIndex(event => event.id === eventId);
    
    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    calendarEvents.splice(eventIndex, 1);
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('📅 Error deleting calendar event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete calendar event',
      error: error.message
    });
  }
});

// ================================
// 📧 EMAIL INTELLIGENCE API
// ================================

// Import email intelligence service
const EmailIntelligence = require('./services/email-intelligence');

app.post('/api/email-intelligence', async (req, res) => {
  try {
    const { emails, options = {} } = req.body;

    if (!emails || (!Array.isArray(emails) && typeof emails !== 'string')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input. Please provide emails array or email text.',
        hint: 'Send { "emails": [...] } or { "emails": "email text" }'
      });
    }

    // Process emails with enhanced anti-overwhelm intelligence
    const analysis = await EmailIntelligence.process(emails, options);

    res.json({
      success: true,
      ...analysis,
      timestamp: new Date().toISOString(),
      version: '2.0',
      features: ['signal_vs_noise', 'anti_overwhelm', 'manipulation_detection', 'choice_reduction']
    });

  } catch (error) {
    console.error('📧 Email Intelligence API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze emails',
      message: error.message,
      fallback: 'Please try again or use a simpler email format'
    });
  }
});

// Enhanced sample email testing endpoint
app.get('/api/email-intelligence/sample', async (req, res) => {
  try {
    const sampleEmails = [
      {
        subject: "URGENT: ACT NOW! Limited Time Offer - 70% OFF Everything!",
        body: "Dear Valued Customer, This is your FINAL CHANCE to save big! Only 24 hours left! Everyone is buying these exclusive deals. Don't miss out! Limited stock available. Click now or regret forever! Unsubscribe if you don't want amazing deals.",
        sender: "deals@marketingco.com"
      },
      {
        subject: "Parent-Teacher Conference Reminder - Emma's Math Class",
        body: "Dear Mr. Baron, This is a reminder that your scheduled parent-teacher conference for Emma is tomorrow at 3:30 PM. Please confirm your attendance. We will discuss her recent math progress and upcoming projects.",
        sender: "teacher@lincolnelementary.edu"
      },
      {
        subject: "Credit Card Payment Due - Action Required",
        body: "Your credit card payment of $1,247.82 is due today. Please pay immediately to avoid late fees. You can pay online or call customer service. Your account security is important to us.",
        sender: "alerts@bankofamerica.com"
      }
    ];

    const analysis = await EmailIntelligence.process(sampleEmails);

    res.json({
      success: true,
      sample: true,
      ...analysis,
      demonstration: 'Enhanced Email Intelligence with Anti-Overwhelm Processing'
    });

  } catch (error) {
    console.error('📧 Sample Email Intelligence error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process sample emails',
      message: error.message
    });
  }
});

// ================================
// �🚀 SERVER STARTUP
// ================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 HomeOps server running on port ${PORT}`);
  console.log(`📱 Access at: http://localhost:${PORT}`);
  console.log(`🌟 Commerce Intelligence: Ready`);
  console.log(`✈️ Flight Search: Ready`);
  console.log(`📧 Email Intelligence: Ready`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Server interrupted, shutting down gracefully');
  process.exit(0);
});
