require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const SYSTEM_PROMPT = fs.readFileSync("./prompts/tone-homeops.txt", "utf-8");
console.log("🟢 SYSTEM_PROMPT loaded:", SYSTEM_PROMPT.slice(0, 120) + "...");

{
  let firebaseCredentials;
  try {
    const base64 = process.env.FIREBASE_CREDENTIALS;
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    firebaseCredentials = JSON.parse(decoded);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseCredentials)
      });
    }
  } catch (err) {
    console.error("❌ Firebase init failed:", err.message);
    process.exit(1);
  }
}

const db = admin.firestore();
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("public"));

async function extractCalendarEvents(message) {
  const extractionPrompt = `
From the following message, extract any time-based calendar events in this exact JSON format:

[
  {
    "title": "Vasectomy",
    "start": "2025-06-20T10:00:00",
    "allDay": false
  }
]

Only return the array. No text. No markdown. No backticks.

Message:
"""${message}"""
`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "Extract structured calendar events only." },
          { role: "user", content: extractionPrompt }
        ]
      })
    });

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "[]";
    console.log("🧪 Raw GPT event text:", raw);
    return JSON.parse(raw);
  } catch (err) {
    console.error("❌ Failed to extract events:", err.message);
    return [];
  }
}

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
    const gptReply = data.choices?.[0]?.message?.content || "Sorry, I had a brain freeze.";

    const events = await extractCalendarEvents(message);
    console.log("📤 Events returned to frontend:", events);

    await db.collection("messages").add({
      user_id,
      message,
      reply: gptReply,
      tags: ["mental load", "resentment"],
      timestamp: new Date(),
    });

    res.json({
      reply: gptReply,
      events: events || [],
    });
  } catch (err) {
    console.error("❌ Error in /chat route:", err.message);
    res.status(500).json({ error: "Something went wrong." });
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
  } catch (err) {
    console.error("❌ /api/dashboard failed:", err.message);
    res.status(500).json({ error: "Dashboard failed" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
});
