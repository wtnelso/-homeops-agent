// Load environment variables
require("dotenv").config();
console.log("✅ FIREBASE_CREDENTIALS loaded:", !!process.env.FIREBASE_CREDENTIALS);

const express = require("express");
const bodyParser = require("body-parser");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Load system prompt
const SYSTEM_PROMPT = fs.readFileSync("./prompts/tone-homeops.txt", "utf-8");
console.log("🟢 SYSTEM_PROMPT loaded:", SYSTEM_PROMPT.slice(0, 120) + "...");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS))
  });
}

const db = admin.firestore();
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("public"));

// Chat endpoint
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
        model: "gpt-4",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await openaiRes.json();
    let reply = "Sorry, I had a brain freeze.";
    if (data?.choices?.[0]?.message?.content) {
      reply = data.choices[0].message.content;
    }

    const tags = ["mental load", "resentment"];

    await db.collection("messages").add({
      user_id,
      message,
      reply,
      tags,
      timestamp: new Date(),
    });

    res.json({ reply });
  } catch (err) {
    console.error("❌ Error in /chat route:", err.message, err.stack);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Messages route
app.get("/api/messages", async (req, res) => {
  const { user_id } = req.query;

  try {
    const snapshot = await db
      .collection("messages")
      .where("user_id", "==", user_id)
      .orderBy("timestamp", "desc")
      .limit(25)
      .get();

    const data = snapshot.docs.map(doc => doc.data());
    res.json(data);
  } catch (error) {
    console.error("🔥 Failed to fetch messages:", error.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Dashboard route
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

      ["laundry", "school", "camp", "appointment", "groceries", "pickup"].forEach((keyword) => {
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
      reframes: [
        {
          title: "You're holding a lot right now.",
          subtitle: "Just naming it is power.",
          body: "Laundry, school, camp, and scheduling? That’s not light work — it’s logistics load bearing. Give yourself 5 minutes of stillness today."
        },
        {
          title: "This isn’t just task management — it’s emotional labor.",
          subtitle: "And you’re doing it.",
          body: "Most of what you're tracking isn't even visible to others. You don’t need to do it all alone."
        },
        {
          title: "Consider letting one thing slide.",
          subtitle: "You get to choose what matters.",
          body: "Skipping one grocery run or showing up imperfectly is still showing up. Your kids won’t remember the missed apple slices."
        }
      ]
    });
  } catch (error) {
    console.error("🔥 Failed to load dashboard:", error.message);
    res.status(500).json({ error: "Dashboard failed" });
  }
});

// Event extraction route
app.get("/api/events", async (req, res) => {
  const { user_id = "user_123" } = req.query;

  try {
    const snapshot = await db
      .collection("messages")
      .where("user_id", "==", user_id)
      .orderBy("timestamp", "desc")
      .limit(30)
      .get();

    const chatHistory = snapshot.docs.map(doc => doc.data());
    const combinedText = chatHistory
      .map(({ message, reply }) => `User: ${message}\nHomeOps: ${reply}`)
      .join("\n\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant helping extract structured household tasks, reminders, and appointments from user conversations. Return a JSON object like this:
{
  "appointments": [],
  "tasks": [],
  "reminders": [],
  "notes": [],
  "emotional_flags": []
}`
          },
          {
            role: "user",
            content: combinedText
          }
        ],
      }),
    });

    const data = await response.json();
    const parsed = data?.choices?.[0]?.message?.content;

    let output;
    try {
      output = JSON.parse(parsed);
    } catch {
      output = { error: "Could not parse GPT response", raw: parsed };
    }

    res.json(output);
  } catch (err) {
    console.error("❌ /api/events failed:", err.message);
    res.status(500).json({ error: "Failed to extract events" });
  }
});

// Relief Protocol Engine route
app.post("/api/relief-protocol", async (req, res) => {
  try {
    const { tasks, emotional_flags } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are HomeOps — a life operations coach for high-performing families. You specialize in helping overloaded parents reduce mental load, invisible labor, burnout, and chronic misalignment between identity and effort.

Your voice blends:
- Mel Robbins’ emotional grit and tactical empowerment
- Andrew Huberman’s systems thinking and neuroscience-backed guidance
- John & Julie Gottman’s relational intelligence
- Amy Schumer’s dry humor, emotional honesty, and unfiltered truth
- Adam Grant’s cognitive reframing, motivation science, and insight-driven mindset shifts

Your job is to generate a Relief Protocol based on the user's tracked tasks and emotional patterns.

Every protocol must include — without exception:
1. A validating summary of what the user carried this week
2. One Offload suggestion
3. One Reclaim suggestion
4. One Reconnect suggestion
5. One Pattern Interrupt
6. One Reframe (Adam Grant-style mindset shift)

Return your output as structured JSON only:
{
  "summary": "...",
  "offload": { "text": "...", "coach": "Mel Robbins" },
  "reclaim": { "text": "...", "coach": "Andrew Huberman" },
  "reconnect": { "text": "...", "coach": "John Gottman" },
  "pattern_interrupt": "...",
  "reframe": { "text": "...", "coach": "Adam Grant" }
}`
          },
          {
            role: "user",
            content: `Tasks: ${JSON.stringify(tasks)}\nEmotional flags: ${JSON.stringify(emotional_flags)}`
          }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    let parsed;
    try {
      const clean = reply.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse GPT response", raw: reply });
    }

    res.json(parsed);
  } catch (err) {
    console.error("❌ Relief Protocol Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
});
