process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});

console.log("🚀 DEPLOYMENT VERSION 8 - LUXON REMOVED - " + new Date().toISOString());
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
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
const path = require("path");
const fs = require("fs");
// const { DateTime } = require("luxon"); // Temporarily removed for deployment
const chrono = require("chrono-node");

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
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

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

// Enable CORS for all routes at the very top
app.use(cors({
  origin: [
    'https://homeops-web.web.app',
    'https://homeops-web.firebaseapp.com',
    'https://homeops-backend.onrender.com'
  ],
  credentials: true
}));

// Handle CORS preflight requests
app.options('*', cors({
  origin: [
    'https://homeops-web.web.app',
    'https://homeops-web.firebaseapp.com',
    'https://homeops-backend.onrender.com'
  ],
  credentials: true
}));

// Load the persona file content at startup
let tonePromptContent = "";
try {
  tonePromptContent = fs.readFileSync(path.join(__dirname, "prompts", "tone-homeops.txt"), "utf-8");
  console.log("✅ Persona file loaded successfully.");
} catch (err) {
  console.error("❌ Failed to load persona file:", err.message);
  // Continue without it, but log the error
}

app.use(bodyParser.json());
app.use(express.static("public"));
app.use("/mock", express.static("mock"));

// All API routes should be defined above the SPA catch-all
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

// Test endpoint to check environment variables
app.get("/api/test-env", (req, res) => {
  res.json({
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasFirebase: !!process.env.FIREBASE_CREDENTIALS,
    hasFirebaseAPI: !!process.env.FIREBASE_API_KEY,
    envVars: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "SET" : "NOT SET",
      FIREBASE_CREDENTIALS: process.env.FIREBASE_CREDENTIALS ? "SET" : "NOT SET",
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? "SET" : "NOT SET"
    }
  });
});

// Test endpoint to check Gmail OAuth configuration
app.get("/api/gmail/test-config", (req, res) => {
  res.json({
    gmailConfig: {
      clientId: GMAIL_OAUTH_CONFIG.clientId ? "SET" : "NOT SET",
      clientSecret: GMAIL_OAUTH_CONFIG.clientSecret ? "SET" : "NOT SET",
      redirectUri: GMAIL_OAUTH_CONFIG.redirectUri
    },
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    authUrl: `/auth/google`
  });
});

// Test endpoint to check token status for a user
app.get("/api/gmail/test-tokens", async (req, res) => {
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id parameter required' });
  }
  
  try {
    const tokenDoc = await db.collection('gmail_tokens').doc(user_id).get();
    
    if (!tokenDoc.exists) {
      return res.json({
        hasTokens: false,
        message: 'No tokens found for this user'
      });
    }
    
    const tokens = tokenDoc.data();
    return res.json({
      hasTokens: true,
      tokenInfo: {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        createdAt: tokens.created_at,
        scopes: tokens.scopes || 'unknown'
      }
    });
  } catch (error) {
    console.error('❌ Error checking tokens:', error);
    res.status(500).json({ error: 'Failed to check tokens' });
  }
});

// --- RAG Helper Functions ---
async function createEmbedding(text) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text
    })
  });
  const data = await response.json();
  if (!data.data || !data.data[0] || !data.data[0].embedding) {
    throw new Error("Invalid embedding response");
  }
  return data.data[0].embedding;
}

function cosineSimilarity(a, b) {
  let dot = 0.0, normA = 0.0, normB = 0.0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getTopKRelevantChunks(userEmbedding, k = 5) {
  // Fetch all knowledge chunks (for small KB; for large KB, use a vector DB)
  const snapshot = await db.collection('knowledge_chunks').get();
  const chunks = snapshot.docs.map(doc => doc.data());
  // Compute similarity
  for (const chunk of chunks) {
    chunk.sim = cosineSimilarity(userEmbedding, chunk.embedding);
  }
  // Sort by similarity, descending
  chunks.sort((a, b) => b.sim - a.sim);
  return chunks.slice(0, k);
}

function anonymizeText(text) {
  return text
    .replace(/Mel Robbins/gi, "the coach")
    .replace(/Jerry Seinfeld/gi, "the comedian")
    .replace(/Andrew Huberman/gi, "the scientist")
    .replace(/Amy Schumer/gi, "the comedian")
    .replace(/Martha Beck/gi, "the author");
}
// --- END RAG Helper Functions ---

app.post("/chat", async (req, res) => {
  const { user_id, message } = req.body;
  if (!user_id || !message) {
    return res.status(400).json({ error: "User ID and message are required" });
  }

  try {
    // 1. Fetch the last 10 messages for context
    const messagesSnapshot = await db.collection("messages")
      .where("user_id", "==", user_id)
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    const history = messagesSnapshot.docs.map(doc => doc.data()).reverse();

    // 2. Construct the messages array for OpenAI
    const messagesForApi = [];

    // System prompt combining the persona and the core instructions
    let ragContext = "";
    try {
      const userEmbedding = await createEmbedding(message);
      const topChunks = await getTopKRelevantChunks(userEmbedding, 5);
      ragContext = topChunks.map(c => anonymizeText(c.content)).join("\n---\n");
    } catch (e) {
      console.error("RAG context fetch failed:", e.message);
    }
    const systemPrompt = `
Your one and only job is to act as a persona synthesizer. You will be given a block of text under "Relevant context". You MUST adopt the tone, style, and personality of the author of that text to answer the user's message.

---
Relevant context from the knowledge base:
${ragContext}
---

Your task is to synthesize a response that is 100% in-character with the context provided.
It is a hard failure if you provide a generic, list-based answer. For example, DO NOT output a response like:
"- **Open Dialogue:** Create a safe space..."
"- **Acknowledge and Apologize:** If there's something..."

Your response must be a conversational paragraph that captures the unique tone and style of the context.

**Final check:** Does my response sound like a generic AI assistant? If it does, you have failed. Rewrite it to be in-character.

Never mention the names of any real people, authors, or public figures.
Today's date is: ${getCurrentDate()}.

After crafting your in-character reply, extract any new calendar events found ONLY in the user's most recent message.

Respond with ONLY a single, valid JSON object in this format.

{
  "reply": "Your in-character, conversational reply synthesized from the knowledge base goes here.",
  "events": [
    { "title": "Event Title", "when": "A descriptive, natural language time like 'This coming Tuesday at 2pm' or 'August 15th at 10am'", "allDay": false }
  ]
}
    `.trim();

    messagesForApi.push({ role: "system", content: systemPrompt });

    // Add conversation history
    history.forEach(msg => {
      messagesForApi.push({ role: "user", content: msg.message });
      if (msg.assistant_response) {
        messagesForApi.push({ role: "assistant", content: msg.assistant_response });
      }
    });

    // Add the current user message
    messagesForApi.push({ role: "user", content: message });


    // 3. Call OpenAI API
    const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.7,
        top_p: 1,
        response_format: { type: "json_object" },
        messages: messagesForApi
      })
    });

    const gptData = await gptRes.json();
    console.log("OpenAI Response Body:", JSON.stringify(gptData, null, 2));
    const content = gptData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content from GPT response.");
    }

    const parsedResponse = JSON.parse(content);
    const { reply, events = [] } = parsedResponse;

    // 4. Save new message and reply to history
    await db.collection("messages").add({
      user_id,
      message,
      assistant_response: content,
      timestamp: new Date()
    });

    // 5. Save events to Firestore
    if (events.length > 0) {
      const savedEvents = [];
      const batch = db.batch();
      
      // Get the current time in the target timezone to use as a reference for parsing
      const referenceDate = new Date();

      events.forEach(event => {
        if (event.title && event.when) {
          // Parse the natural language "when" string in America/New_York timezone
          const parsedStart = chrono.parseDate(event.when, referenceDate, { forwardDate: true, timezone: "America/New_York" });

          if (parsedStart) {
            // Convert to the required ISO 8601 format with timezone
            const startISO = parsedStart.toISOString();

            const eventRef = db.collection("events").doc();
            const eventWithId = { 
              ...event, 
              start: startISO, // Add the parsed start time
              id: eventRef.id, 
              user_id, 
              created_at: new Date() 
            };
            delete eventWithId.when; // Clean up the original 'when' field
            
            batch.set(eventRef, eventWithId);
            savedEvents.push(eventWithId);
          }
        }
      });
      await batch.commit();
      res.json({ reply, events: savedEvents });
    } else {
      res.json({ reply, events: [] });
    }

  } catch (err) {
    console.error("❌ /chat endpoint failed:", err.message, err.stack);
    res.status(500).json({ error: "Failed to process your request." });
  }
});

// ✅ Save event to Firestore (this can be used for manual additions if needed)
app.post("/api/events", async (req, res) => {
  const { event } = req.body;

  if (!event || !event.title || (!event.start && !event.when)) {
    return res.status(400).json({ error: "Missing event title or time." });
  }

  try {
    // If "when" is provided, parse it into ISO using chrono + luxon
    if (!event.start && event.when) {
      const parsedStart = chrono.parseDate(event.when, { timezone: "America/New_York" });
      if (!parsedStart) {
        return res.status(400).json({ error: "Could not parse 'when' into a date." });
      }
      event.start = parsedStart.toISOString();
    }

    const docRef = await db.collection("events").add({
      ...event,
      created_at: new Date(),
    });

    res.json({ success: true, id: docRef.id });
  } catch (err) {
    console.error("❌ Failed to save event:", err.message);
    res.status(500).json({ error: "Failed to save event" });
  }
});

// 🔄 Update an existing event by ID
app.put("/api/events/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  if (!id || !updatedData || typeof updatedData !== "object") {
    return res.status(400).json({ error: "Invalid request format" });
  }

  try {
    const eventRef = db.collection("events").doc(id);
    await eventRef.update({
      ...updatedData,
      updated_at: new Date(),
    });
    res.json({ success: true, message: `Event ${id} updated.` });
  } catch (err) {
    console.error(`❌ Failed to update event ${id}:`, err.message);
    res.status(500).json({ error: "Failed to update event" });
  }
});

// ✅ Fetch all saved events
app.get("/api/events", async (req, res) => {
  const { user_id = "user_123" } = req.query;
  try {
    const snapshot = await db
      .collection("events")
      .where("user_id", "==", user_id)
      .orderBy("start")
      .get();
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(events);
  } catch (err) {
    console.error("❌ Failed to fetch events:", err.message);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// ✅ Get events for calendar (FullCalendar format)
app.get("/api/get-events", async (req, res) => {
  const { user_id = "user_123" } = req.query;
  try {
    const snapshot = await db
      .collection("events")
      .where("user_id", "==", user_id)
      .orderBy("start")
      .get();
    
    const events = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        start: data.start,
        end: data.end || null,
        allDay: data.allDay || false,
        user_id: data.user_id,
        location: data.location || null,
        description: data.description || null,
        extendedProps: {
          location: data.location || null,
          description: data.description || null
        }
      };
    });
    
    res.json(events);
  } catch (err) {
    console.error("❌ Failed to fetch events for calendar:", err.message);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// ✅ Add event from calendar (FullCalendar dateClick)
app.post("/api/add-event", async (req, res) => {
  const { user_id, title, start, end, allDay = false, location, description } = req.body;
  
  if (!user_id || !title || !start) {
    return res.status(400).json({ error: "Missing required fields: user_id, title, or start" });
  }

  try {
    const eventData = {
      user_id,
      title,
      start,
      allDay,
      created_at: new Date()
    };

    // Add optional fields if provided
    if (end) eventData.end = end;
    if (location) eventData.location = location;
    if (description) eventData.description = description;

    const docRef = await db.collection("events").add(eventData);

    res.json({ 
      success: true, 
      id: docRef.id,
      event: { 
        id: docRef.id, 
        title, 
        start, 
        end: end || null,
        allDay, 
        user_id,
        location: location || null,
        description: description || null
      }
    });
  } catch (err) {
    console.error("❌ Failed to add event:", err.message);
    res.status(500).json({ error: "Failed to add event" });
  }
});

// ✅ Delete event
app.post("/api/delete-event", async (req, res) => {
  const { user_id, event_id } = req.body;
  
  if (!user_id || !event_id) {
    return res.status(400).json({ error: "Missing required fields: user_id or event_id" });
  }

  try {
    // Verify the event belongs to the user before deleting
    const eventDoc = await db.collection("events").doc(event_id).get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    const eventData = eventDoc.data();
    if (eventData.user_id !== user_id) {
      return res.status(403).json({ error: "Unauthorized to delete this event" });
    }
    
    await db.collection("events").doc(event_id).delete();
    
    res.json({ 
      success: true, 
      message: "Event deleted successfully" 
    });
  } catch (err) {
    console.error("❌ Failed to delete event:", err.message);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

app.get("/api/dashboard", async (req, res) => {
  const { user_id = "user_123" } = req.query;

  try {
    const snapshot = await db
      .collection("messages")
      .where("user_id", "==", user_id)
      .orderBy("timestamp", "desc")
      .limit(25)
      .get();

    const messages = snapshot.docs.map(doc => doc.data());
    const themeCounts = {};
    const taskList = [];

    messages.forEach(({ message, reply }) => {
      const text = `${message} ${reply}`.toLowerCase();
      ["laundry", "school", "camp", "appointment", "groceries", "pickup"].forEach(keyword => {
        if (text.includes(keyword)) {
          themeCounts[keyword] = (themeCounts[keyword] || 0) + 1;
        }
      });
      if (/monday|tuesday|wednesday|thursday|friday/i.test(text)) {
        taskList.push(text);
      }
    });

    const topThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word, count]) => `${word} (${count}x)`);

    res.json({
      tasksThisWeek: taskList.slice(0, 3),
      topThemes,
      totalTasks: messages.length,
    });
  } catch (err) {
    console.error("❌ /api/dashboard failed:", err.message);
    res.status(500).json({ error: "Dashboard failed" });
  }
});

app.post("/api/relief-protocol", async (req, res) => {
  const { tasks = [], emotional_flags = [] } = req.body;

  const prompt = `You are HomeOps. Create a JSON Relief Protocol using wit and insight.

Input:
Tasks: ${JSON.stringify(tasks)}
Emotional Flags: ${JSON.stringify(emotional_flags)}

Output format:
{
  "summary": "...",
  "offload": { "text": "...", "coach": "Mel Robbins" },
  "reclaim": { "text": "...", "coach": "Andrew Huberman" },
  "reconnect": { "text": "...", "coach": "John Gottman" },
  "pattern_interrupt": "...",
  "reframe": { "text": "...", "coach": "Adam Grant" }
}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.2,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: "Generate protocol" }
        ]
      })
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json(parsed);
  } catch (err) {
    console.error("❌ Relief Protocol Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/reframe-protocol", async (req, res) => {
  const { challenge } = req.body;

  if (!challenge) {
    return res.status(400).json({ error: "No challenge provided." });
  }

  const systemPrompt = `
You are a world-class Chief of Staff, a unique blend of three personalities:
- **Mel Robbins:** You provide actionable, no-nonsense advice with a framework (like the 5-second rule). You're about high-fives and taking action.
- **Jerry Seinfeld:** You find the observational humor and absurdity in the situation, making it feel less heavy. What's the *deal* with this blocker?
- **Andrew Huberman:** You ground the advice in neuroscience and tangible protocols. How can we leverage dopamine, focus, or rest to overcome this?

The user is feeling stuck. Your task is to provide a "Re-frame" that helps them see their challenge from a new perspective.

**Format your response as a single, valid JSON object:**
{
  "title": "A witty, Seinfeld-esque observation about the problem.",
  "reframe": "The core insight. A one-sentence re-framing of the problem into an opportunity.",
  "action": {
    "header": "A Mel Robbins-style call to action (e.g., 'The 5-Minute Reset').",
    "steps": [
      "Step 1: A concrete, immediate action.",
      "Step 2: Another small, tangible step.",
      "Step 3: A third, simple action."
    ]
  },
  "science": "A Huberman-esque explanation of the neuroscience behind why the action plan works (e.g., 'This leverages neuroplasticity by...')."
}
Do not include any text outside of this JSON object.
  `.trim();

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: challenge }
        ]
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("🛑 Re-frame GPT response missing content:", data);
      return res.status(500).json({ error: "Invalid GPT response format" });
    }

    const parsedResponse = JSON.parse(data.choices[0].message.content);
    res.json(parsedResponse);
  } catch (err) {
    console.error("❌ /api/reframe-protocol failed:", err.message);
    res.status(500).json({ error: "Re-frame Protocol failed" });
  }
});

app.post("/api/events/clear", async (req, res) => {
  const { user_id = "user_123" } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: "User ID is required." });
  }
  try {
    const snapshot = await db.collection("events").where("user_id", "==", user_id).get();
    if (snapshot.empty) {
      return res.json({ success: true, message: "No events to clear for this user." });
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    res.json({ success: true, message: `Deleted ${snapshot.size} events.` });
  } catch (err) {
    console.error("❌ Failed to clear events:", err.message);
    res.status(500).json({ error: "Failed to clear events." });
  }
});

app.get("/events", async (req, res) => {
  const { user_id } = req.query; // Or from session, etc.
  if (!user_id) {
    return res.status(400).json({ error: "User ID is required" });
  }
  try {
    const eventsSnapshot = await db.collection("events")
      .where("user_id", "==", user_id)
      .orderBy("start", "asc")
      .get();
    const events = eventsSnapshot.docs.map(doc => doc.data());
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Gmail OAuth and Email Decoder Engine
const { google } = require('googleapis');

// Helper function to call OpenAI API
async function callOpenAI(prompt, model = 'gpt-4o-mini') {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: "You are an email analysis assistant. Analyze emails and extract structured information. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid OpenAI response");
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('❌ OpenAI API call failed:', error);
    throw error;
  }
}

// Gmail OAuth configuration
const GMAIL_OAUTH_CONFIG = {
  clientId: process.env.GMAIL_CLIENT_ID,
  clientSecret: process.env.GMAIL_CLIENT_SECRET,
  redirectUri: process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
};

// Debug OAuth configuration
console.log('🔍 Gmail OAuth Config Debug:');
console.log('Client ID:', GMAIL_OAUTH_CONFIG.clientId ? 'SET' : 'NOT SET');
console.log('Client Secret:', GMAIL_OAUTH_CONFIG.clientSecret ? 'SET' : 'NOT SET');
console.log('Redirect URI:', GMAIL_OAUTH_CONFIG.redirectUri);

// Gmail OAuth endpoints
app.get('/auth/google', (req, res) => {
  console.log('🔍 Starting Gmail OAuth flow...');
  
  const oauth2Client = new google.auth.OAuth2(
    GMAIL_OAUTH_CONFIG.clientId,
    GMAIL_OAUTH_CONFIG.clientSecret,
    GMAIL_OAUTH_CONFIG.redirectUri
  );

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly'
  ];

  console.log('🔍 Using scopes:', scopes);

  // Add a unique state parameter to force re-authorization
  const state = `force_reauth_${Date.now()}`;

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    include_granted_scopes: true,
    state: state
  });

  console.log('🔍 Generated auth URL:', authUrl);
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  const state = req.query.state || 'default_user';

  console.log('🔍 OAuth callback received');
  console.log('Code present:', !!code);
  console.log('State:', state);

  try {
    const oauth2Client = new google.auth.OAuth2(
      GMAIL_OAUTH_CONFIG.clientId,
      GMAIL_OAUTH_CONFIG.clientSecret,
      GMAIL_OAUTH_CONFIG.redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('🔍 Tokens received:');
    console.log('Access token present:', !!tokens.access_token);
    console.log('Refresh token present:', !!tokens.refresh_token);
    console.log('Expiry date:', tokens.expiry_date);
    
    // Use consistent user ID for development
    const userId = 'test_user';
    
    // Store tokens in Firestore
    await db.collection('gmail_tokens').doc(userId).set({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      created_at: new Date(),
      scopes: tokens.scope || 'https://www.googleapis.com/auth/gmail.readonly' // Store the actual scopes
    });

    console.log('✅ Tokens stored successfully for user:', userId);

    // Redirect to Dashboard with processing step after successful Gmail connection
    res.redirect('/dashboard?gmail_connected=true&step=processing');
  } catch (error) {
    console.error('❌ Gmail OAuth error:', error);
    console.error('❌ Error details:', error.message);
    res.redirect('/dashboard?gmail_error=true');
  }
});

// Endpoint to check Gmail connection status for a user
app.get('/api/gmail/status', async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return res.json({ connected: false });
  try {
    const tokenDoc = await db.collection('gmail_tokens').doc(userId).get();
    res.json({ connected: tokenDoc.exists });
  } catch (err) {
    res.json({ connected: false });
  }
});

// Endpoint to get Gmail OAuth URL for frontend
app.post('/api/gmail/auth', async (req, res) => {
  const { user_id } = req.body;
  
  try {
    console.log('🔍 Gmail OAuth requested for user:', user_id);
    
    // Generate OAuth URL
    const oauth2Client = new google.auth.OAuth2(
      GMAIL_OAUTH_CONFIG.clientId,
      GMAIL_OAUTH_CONFIG.clientSecret,
      GMAIL_OAUTH_CONFIG.redirectUri
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly'
    ];

    const state = `force_reauth_${Date.now()}_${user_id}`;

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      include_granted_scopes: true,
      state: state
    });

    console.log('✅ Generated OAuth URL for frontend');
    
    res.json({ 
      success: true, 
      authUrl: authUrl
    });
  } catch (error) {
    console.error('❌ Error generating OAuth URL:', error);
    res.status(500).json({ error: 'Failed to generate OAuth URL' });
  }
});

// Endpoint to clear Gmail tokens and force re-authorization
app.post('/api/gmail/clear-tokens', async (req, res) => {
  const { user_id } = req.body;
  
  try {
    // Delete existing tokens
    await db.collection('gmail_tokens').doc(user_id).delete();
    
    // Also clear any decoded emails for this user
    const decodedEmailsSnapshot = await db.collection('decoded_emails')
      .where('user_id', '==', user_id)
      .get();
    
    const batch = db.batch();
    decodedEmailsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    res.json({ success: true, message: 'Gmail tokens cleared. Please reconnect.' });
  } catch (error) {
    console.error('❌ Error clearing Gmail tokens:', error);
    res.status(500).json({ error: 'Failed to clear tokens' });
  }
});

// Force re-authorization endpoint with scope fix
app.post('/api/gmail/force-reauth', async (req, res) => {
  const { user_id } = req.body;
  
  try {
    console.log('🔍 Force re-authorization requested for user:', user_id);
    
    // Delete existing tokens
    await db.collection('gmail_tokens').doc(user_id).delete();
    console.log('✅ Cleared existing tokens');
    
    // Also clear any decoded emails for this user
    const decodedEmailsSnapshot = await db.collection('decoded_emails')
      .where('user_id', '==', user_id)
      .get();
    
    const batch = db.batch();
    decodedEmailsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('✅ Cleared decoded emails');
    
    // Generate OAuth URL with correct scope
    const oauth2Client = new google.auth.OAuth2(
      GMAIL_OAUTH_CONFIG.clientId,
      GMAIL_OAUTH_CONFIG.clientSecret,
      GMAIL_OAUTH_CONFIG.redirectUri
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly'
    ];

    const state = `force_reauth_${Date.now()}_${user_id}`;

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      include_granted_scopes: true,
      state: state
    });

    console.log('✅ Generated re-authorization URL with correct scope');
    
    res.json({ 
      success: true, 
      message: 'Tokens cleared. Redirecting to OAuth with correct scope.',
      authUrl: authUrl
    });
  } catch (error) {
    console.error('❌ Error in force re-authorization:', error);
    res.status(500).json({ error: 'Failed to force re-authorization' });
  }
});

// Email Decoder Engine - Process emails
app.post('/api/email-decoder/process', async (req, res) => {
  const { user_id } = req.body;
  
  console.log('🔍 Starting email processing for user:', user_id);
  
  try {
    // Get Gmail tokens
    const tokenDoc = await db.collection('gmail_tokens').doc(user_id).get();
    if (!tokenDoc.exists) {
      console.log('❌ No Gmail tokens found for user:', user_id);
      return res.status(401).json({ error: 'Gmail not connected' });
    }

    const tokens = tokenDoc.data();
    console.log('🔍 Retrieved tokens for user:', user_id);
    console.log('🔍 Token scopes:', tokens.scopes);
    console.log('🔍 Token expiry:', tokens.expiry_date);
    
    const oauth2Client = new google.auth.OAuth2(
      GMAIL_OAUTH_CONFIG.clientId,
      GMAIL_OAUTH_CONFIG.clientSecret,
      GMAIL_OAUTH_CONFIG.redirectUri
    );

    oauth2Client.setCredentials(tokens);

    // Check if tokens are expired and refresh if needed
    if (tokens.expiry_date && Date.now() > tokens.expiry_date) {
      console.log('🔍 Tokens expired, attempting to refresh...');
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
        
        // Update tokens in database
        await db.collection('gmail_tokens').doc(user_id).update({
          access_token: credentials.access_token,
          expiry_date: credentials.expiry_date
        });
        
        console.log('✅ Tokens refreshed successfully');
      } catch (refreshError) {
        console.error('❌ Failed to refresh tokens:', refreshError);
        return res.status(401).json({ error: 'Gmail tokens expired. Please reconnect.' });
      }
    }

    // Fetch recent emails
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    console.log('🔍 Attempting to fetch emails...');
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10
    });

    console.log('✅ Successfully fetched email list');
    const messages = response.data.messages || [];
    console.log('🔍 Found', messages.length, 'messages');

    if (messages.length === 0) {
      console.log('🔍 No messages found, returning empty result');
      return res.json({ 
        success: true, 
        emails: [],
        summary: { total: 0, byType: {}, byCategory: {}, byPriority: {}, highPriority: 0 }
      });
    }

    const decodedEmails = [];

    // Process each email through the decoder
    for (const message of messages.slice(0, 10)) { // Process first 10 for now
      console.log('🔍 Processing message:', message.id);
      
      try {
        const emailData = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });

        const decoded = await processEmailThroughDecoder(emailData.data, user_id);
        if (decoded) {
          decodedEmails.push(decoded);
          console.log('✅ Successfully decoded email:', message.id);
        }
      } catch (emailError) {
        console.error('❌ Error processing individual email:', emailError.message);
        console.error('❌ Email error details:', emailError);
      }
    }

    console.log('✅ Email processing complete. Processed', decodedEmails.length, 'emails');

    res.json({ 
      success: true, 
      emails: decodedEmails,
      summary: generateEmailSummary(decodedEmails)
    });

  } catch (error) {
    console.error('❌ Email decoder error:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error status:', error.status);
    
    // Check if it's a scope error
    if (error.message && error.message.includes('Metadata scope')) {
      console.error('❌ DETECTED SCOPE ERROR - Tokens have wrong scope!');
      console.error('❌ Need to clear tokens and re-authorize with correct scope');
    }
    
    res.status(500).json({ error: 'Failed to process emails: ' + error.message });
  }
});

// Process individual email through AI decoder
async function processEmailThroughDecoder(emailData, userId) {
  try {
    console.log('🔍 Processing email:', emailData.id);
    
    const headers = emailData.payload?.headers || [];
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';

    console.log('🔍 Email headers - Subject:', subject.substring(0, 50) + '...');
    console.log('🔍 Email headers - From:', from);

    // Extract email body
    let body = '';
    if (emailData.payload?.body?.data) {
      body = Buffer.from(emailData.payload.body.data, 'base64').toString();
    } else if (emailData.payload?.parts) {
      // Try to find text/plain first, then text/html
      const textPart = emailData.payload.parts.find(part => 
        part.mimeType === 'text/plain'
      ) || emailData.payload.parts.find(part => 
        part.mimeType === 'text/html'
      );
      
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString();
      }
    }

    console.log('🔍 Email body length:', body.length);

    // Use AI to decode the email
    const prompt = `
    Analyze this email and extract structured information:

    SUBJECT: ${subject}
    FROM: ${from}
    DATE: ${date}
    BODY: ${body.substring(0, 1000)}...

    Return JSON with:
    {
      "type": "family_signal|smart_deal|other",
      "category": "school|healthcare|logistics|rsvp|deadline|purchase|promotion|brand_opportunity|reorder_nudge",
      "priority": "high|medium|low",
      "summary": "1-2 sentence summary",
      "action_required": "What action is needed",
      "extracted_data": {
        "date": "extracted date if any",
        "time": "extracted time if any", 
        "location": "extracted location if any",
        "amount": "extracted amount if any",
        "deadline": "extracted deadline if any"
      },
      "brand_loyalty_score": 0-10 if applicable
    }
    `;

    console.log('🔍 Calling OpenAI for email analysis...');
    const aiResponse = await callOpenAI(prompt, 'gpt-4o-mini');
    console.log('🔍 OpenAI response received');
    
    const decoded = JSON.parse(aiResponse);
    console.log('🔍 Decoded email data:', decoded.type, decoded.category, decoded.priority);

    // Store decoded email
    await db.collection('decoded_emails').add({
      user_id: userId,
      gmail_id: emailData.id,
      subject,
      from,
      date,
      decoded_data: decoded,
      created_at: new Date()
    });

    console.log('✅ Email stored in database');

    return {
      id: emailData.id,
      subject,
      from,
      date,
      decoded: decoded
    };

  } catch (error) {
    console.error('❌ Email processing error:', error);
    console.error('❌ Error details:', error.message);
    return null;
  }
}

// Generate summary of decoded emails
function generateEmailSummary(decodedEmails) {
  const summary = {
    total: decodedEmails.length,
    byType: {},
    byCategory: {},
    byPriority: {},
    highPriority: 0
  };

  decodedEmails.forEach(email => {
    const decoded = email.decoded;
    
    // Count by type
    summary.byType[decoded.type] = (summary.byType[decoded.type] || 0) + 1;
    
    // Count by category
    summary.byCategory[decoded.category] = (summary.byCategory[decoded.category] || 0) + 1;
    
    // Count by priority
    summary.byPriority[decoded.priority] = (summary.byPriority[decoded.priority] || 0) + 1;
    
    // Count high priority
    if (decoded.priority === 'high') {
      summary.highPriority++;
    }
  });

  return summary;
}

// Email Decoder Engine - Get decoded emails for a user
app.get('/api/email-decoder/emails', async (req, res) => {
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id parameter required' });
  }
  
  try {
    console.log('🔍 Fetching decoded emails for user:', user_id);
    
    const decodedEmailsSnapshot = await db.collection('decoded_emails')
      .where('user_id', '==', user_id)
      .orderBy('created_at', 'desc')
      .limit(50)
      .get();
    
    const emails = [];
    decodedEmailsSnapshot.forEach(doc => {
      const data = doc.data();
      emails.push({
        id: data.gmail_id,
        subject: data.subject,
        from: data.from,
        date: data.date,
        decoded: data.decoded_data
      });
    });
    
    console.log('✅ Found', emails.length, 'decoded emails');
    
    res.json({
      success: true,
      emails: emails
    });
    
  } catch (error) {
    console.error('❌ Error fetching decoded emails:', error);
    res.status(500).json({ error: 'Failed to fetch decoded emails' });
  }
});

// Manual token revocation endpoint
app.post('/api/gmail/revoke-all', async (req, res) => {
  try {
    // Delete all Gmail tokens from Firestore
    const tokensSnapshot = await db.collection('gmail_tokens').get();
    const deletePromises = tokensSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    
    // Delete all decoded emails
    const emailsSnapshot = await db.collection('decoded_emails').get();
    const deleteEmailPromises = emailsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deleteEmailPromises);
    
    console.log('✅ All Gmail tokens and emails cleared');
    res.json({ success: true, message: 'All Gmail tokens revoked' });
  } catch (error) {
    console.error('❌ Error revoking tokens:', error);
    res.status(500).json({ error: 'Failed to revoke tokens' });
  }
});

// Email feedback endpoint
app.post('/api/email-decoder/feedback', async (req, res) => {
  const { user_id, email_id, feedback } = req.body;
  if (!user_id || !email_id || !['up', 'down'].includes(feedback)) {
    return res.status(400).json({ error: 'Invalid feedback data' });
  }
  try {
    await db.collection('email_feedback').add({
      user_id,
      email_id,
      feedback,
      timestamp: new Date()
    });
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Failed to store email feedback:', error);
    res.status(500).json({ error: 'Failed to store feedback' });
  }
});

// SPA catch-all route should be last
app.get('*', (req, res) => {
  // Serve index.html for the root path (landing page)
  if (req.path === '/' || req.path === '/index.html') {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  // Serve auth.html for authentication
  else if (req.path === '/auth' || req.path === '/auth.html') {
    res.sendFile(path.join(__dirname, 'public', 'auth.html'));
  }
  // Serve dashboard.html for all other non-API routes (authenticated app)
  else if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  }
});

async function startServer() {
  try {
    app.listen(port, () => {
      console.log(`✅ Server listening on port ${port}`);
    });
  } catch (err) {
    console.error("❌ Server failed to start:", err);
    process.exit(1);
  }
}

startServer();

console.log('End of index.cjs reached');
