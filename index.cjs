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
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
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

// Use service account key from file for reliable initialization
try {
  const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, "homeops-sa-key.json"), "utf8"));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase initialized successfully via service account file.");
  }
} catch (err) {
  console.error("❌ Firebase init failed:", err.message);
  // Attempt to use environment variable as a fallback (for Render, etc.)
  try {
    const base64 = process.env.FIREBASE_CREDENTIALS;
    if (!base64) throw new Error("FIREBASE_CREDENTIALS env var not set.");
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    const firebaseCredentials = JSON.parse(decoded);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseCredentials),
      });
      console.log("✅ Firebase initialized successfully via environment variable.");
    }
  } catch (fallbackErr) {
    console.error("❌ Firebase fallback init also failed:", fallbackErr.message);
    process.exit(1); // Exit if no valid credential source found
  }
}

const db = admin.firestore();
const app = express();
const port = process.env.PORT || 3000;

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

// Enable CORS for all routes
app.use(cors({
  origin: [
    'https://homeops-web.web.app',
    'https://homeops-web.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true
}));

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
          // Parse the natural language "when" string
          const parsedStart = chrono.parseDate(event.when, referenceDate, { forwardDate: true });

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

// Secure endpoint to provide Firebase config
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
  
  console.log("🔧 Providing Firebase config:", firebaseConfig);
  res.json(firebaseConfig);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "HomeOps Backend is running" });
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
