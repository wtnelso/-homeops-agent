require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");
const { DateTime } = require("luxon");
const chrono = require("chrono-node");




let firebaseCredentials;
try {
  const base64 = process.env.FIREBASE_CREDENTIALS;
  const decoded = Buffer.from(base64, "base64").toString("utf-8");
  firebaseCredentials = JSON.parse(decoded);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseCredentials),
    });
  }
} catch (err) {
  console.error("❌ Firebase init failed:", err.message);
  process.exit(1);
}

const db = admin.firestore();
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("public"));

async function extractCalendarEvents(message) {
  const today = new Date().toISOString().split("T")[0];

  const prompt = `Today’s date is ${today}.
  
⚠️ Do not use any Markdown formatting like \`\`\`json or \`\`\`.
Only return a raw JSON array like this:

[
  {
    "title": "string",
    "start": "ISO 8601 datetime string",
    "allDay": boolean
  }
]

Now extract any events from this message:
"""${message}"""`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: message }
        ]
      })
    });

    const data = await res.json();
    let raw = data.choices?.[0]?.message?.content || "[]";
    raw = raw.replace(/```json|```/g, "").trim();

    const match = raw.match(/\[\s*{[\s\S]*?}\s*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      console.log("📤 Parsed events from GPT:", parsed);
      return parsed;
    } else {
      console.warn("📭 No calendar events found.");
      return [];
    }

  } catch (err) {
    console.error("❌ extractCalendarEvents failed:", err.message);
    return [];
  }
}


const todayEastern = DateTime.now().setZone("America/New_York").toISODate();

const todayEastern = DateTime.now().setZone("America/New_York").toISODate();

const todayEastern = DateTime.now().setZone("America/New_York").toISODate();

const systemPrompt = `You are HomeOps — a personal chief of staff for busy families.

Today is ${todayEastern}, and you operate in the America/New_York timezone.

You are NOT responsible for converting relative time phrases like "tomorrow" or "next Friday" into specific dates. Just extract event details as written by the user.

When a user shares a message, your job is to:
1. Write a short, emotionally intelligent reply — 1–2 lines. Be warm, brief, and clear. No filler or backticks.
2. Extract all time-based phrases *exactly as spoken* (e.g., "tomorrow at 9am", "next Friday at noon") and return them in a JSON array.

The backend will convert relative phrases to exact dates.

Respond like this:

✅ Got it. Haircut tomorrow at 10 and swim lesson Friday afternoon — both noted.

[
  {
    "title": "Haircut",
    "when": "tomorrow at 10am"
  },
  {
    "title": "Swim lesson",
    "when": "Friday afternoon"
  }
]`;


app.post("/chat", async (req, res) => {
  const { user_id = "user_123", message } = req.body;

  try {
    // 🧠 1. Get warm human reply
    const friendlyPrompt = `You are HomeOps — a personal chief of staff for busy families.

Write a short, emotionally intelligent reply (1–2 lines) based on this message. Be warm, direct, and a little witty.`;

    const friendlyRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: friendlyPrompt },
          { role: "user", content: message }
        ]
      })
    });

    const friendlyData = await friendlyRes.json();
    const gptReply = friendlyData.choices?.[0]?.message?.content || "Got it.";

    // 🔎 2. Use GPT to return just bullet-point lines for events
    const extractionPrompt = `From the following message, extract every calendar-related event as a bullet point in this format:

"when" — title

Examples:
"tomorrow at 9am" — Doctor appointment
"Friday at 2pm" — Wedding

Only include real time-based events. No JSON. Just a clean list.`;

    const extractionRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: extractionPrompt },
          { role: "user", content: message }
        ]
      })
    });

    const extractionData = await extractionRes.json();
    const lines = extractionData.choices?.[0]?.message?.content?.split("\n") || [];

    // 🧠 3. Parse lines into structured events
    const events = lines
      .map((line) => {
        const match = line.match(/"(.+?)"\s*—\s*(.+)/);
        if (!match) return null;

        const when = match[1].trim();
        const title = match[2].trim();
        const parsed = chrono.parseDate(when, {
          timezone: "America/New_York"
        });

        return {
          title,
          start: DateTime.fromJSDate(parsed).setZone("America/New_York").toISO(),
          allDay: false
        };
      })
      .filter(Boolean);

    console.log("📅 Parsed events:", events);

    await db.collection("messages").add({
      user_id,
      message,
      reply: gptReply,
      timestamp: new Date()
    });

    res.json({ reply: gptReply, events });
  } catch (err) {
    console.error("❌ /chat route failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ✅ Save event to Firestore
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
      event.start = DateTime.fromJSDate(parsedStart).setZone("America/New_York").toISO();
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
  try {
    const snapshot = await db.collection("events").orderBy("start").get();
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

app.post("/api/this-week", async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "No messages provided." });
  }

  const todayEastern = DateTime.now().setZone("America/New_York").toISODate();

  const systemPrompt = `You are HomeOps — a smart, emotionally fluent household assistant.

Today is ${todayEastern}, and you operate in the America/New_York timezone.

Your job is to extract all upcoming appointments or time-sensitive obligations from the user's messages for the current week.
Group them by day, format with emoji and clarity, and then reply with a 2–3 sentence commentary using wit and validation.

Format:

🛂 Tuesday @ 11 AM — Passport appointment  
🎾 Wednesday — Lucy’s tennis match  

Commentary here.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: messages.map(m => `• ${m}`).join("\n") }
        ]
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("🛑 GPT response missing content:", data);
      return res.status(500).json({ error: "Invalid GPT response format" });
    }

    const text = data.choices[0].message.content;
    res.json({ summary: text });
  } catch (err) {
    console.error("❌ /api/this-week failed:", err.message);
    res.status(500).json({ error: "Weekly summary failed" });
  }
});


  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "Couldn’t summarize this week.";
  res.json({ summary: text });
} catch (err) {
  console.error("❌ /api/this-week failed:", err.message);
  res.status(500).json({ error: "Weekly summary failed" });
}


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

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
});
