require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");



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

Extract any calendar-based events from the user message below.
Use ISO 8601 format for the start date. Ensure the date reflects the current year: ${today}.
Only return a raw JSON array like this:

[
  {
    "title": "string",
    "start": "ISO 8601 datetime string",
    "allDay": boolean
  }
]

No extra text. No markdown. No explanations.

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
    const raw = data.choices?.[0]?.message?.content || "[]";

    const match = raw.match(/\[\s*{[\s\S]*?}\s*\]/); // safely extract JSON array
    if (match) {
      return JSON.parse(match[0]);
    } else {
      console.log("📭 No calendar event found in GPT response.");
      return [];
    }
  } catch (err) {
    console.error("❌ extractCalendarEvents failed:", err.message);
    return [];
  }
}


const SYSTEM_PROMPT = `
You are HomeOps — a personal chief of staff for busy families.

When a user shares a message, your job is to:
1. Write a short, emotionally intelligent reply — 1 or 2 lines. No filler, no backticks.
2. Extract any calendar-based events and return them in a JSON array (not shown to the user)

Your reply should feel human. The JSON should be structured like:

[
  {
    "title": "string",
    "start": "ISO 8601 datetime string",
    "allDay": boolean
  }
]

Respond like this:

✅ I’ve added Colette’s doctor appointment to your calendar.

<then output just the JSON block below that — no extra explanation>
`;


app.post("/chat", async (req, res) => {
  const { user_id = "user_123", message } = req.body;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await openaiRes.json();
    const gptReply = data.choices?.[0]?.message?.content || "Sorry, I blanked.";

    const events = await extractCalendarEvents(message);
    console.log("📤 Extracted events:", events);


    await db.collection("messages").add({
      user_id,
      message,
      reply: gptReply,
      timestamp: new Date(),
    });

    res.json({ reply: gptReply, events });
  } catch (err) {
    console.error("❌ /chat route error:", err.message);
    res.status(500).json({ error: "Internal server error" });
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

  const systemPrompt = `You are HomeOps — a smart, emotionally fluent household assistant.

Extract the user’s weekly appointments clearly.
Then reply with 2–3 sentences of commentary using wit and validation.

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
          { role: "user", content: messages.join("\n") }
        ]
      })
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "Couldn’t summarize this week.";
    res.json({ summary: text });
  } catch (err) {
    console.error("❌ /api/this-week failed:", err.message);
    res.status(500).json({ error: "Weekly summary failed" });
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

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
});
