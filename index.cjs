require("dotenv").config();
console.log("✅ FIREBASE_CREDENTIALS loaded:", !!process.env.FIREBASE_CREDENTIALS);

const express = require("express");
const bodyParser = require("body-parser");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

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
    const reply = data?.choices?.[0]?.message?.content || "Sorry, I had a brain freeze.";

    await db.collection("messages").add({
      user_id,
      message,
      reply,
      tags: ["mental load", "resentment"],
      timestamp: new Date(),
    });

    res.json({ reply });
  } catch (err) {
    console.error("❌ Error in /chat route:", err.message);
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
  } catch (error) {
    console.error("🔥 Failed to load dashboard:", error.message);
    res.status(500).json({ error: "Dashboard failed" });
  }
});

// Event extraction
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
    const combinedText = chatHistory.map(({ message, reply }) => `User: ${message}\nHomeOps: ${reply}`).join("\n\n");

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

// Weekly summary
app.post("/api/summary-this-week", async (req, res) => {
  const { user_id = "user_123" } = req.body;

  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const snapshot = await db
      .collection("messages")
      .where("user_id", "==", user_id)
      .where("timestamp", ">=", oneWeekAgo)
      .orderBy("timestamp", "desc")
      .get();

    const history = snapshot.docs.map(doc => doc.data());
    const combinedText = history.map(({ message, reply }) => `User: ${message}\nHomeOps: ${reply}`).join("\n\n");

const prompt = `You are HomeOps, an emotionally intelligent household assistant for overloaded families.

Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.

Your task is to summarize what this household is managing this week based on their recent chat messages.

✅ Output format:
🗓 Events:
• Thursday — Colette pediatrician @ 9 AM
• Tuesday — Ellie swim @ 6 PM

🛒 Errands:
• Grocery run
• Laundry

📌 Reminders:
• RSVP to Lucy’s birthday by Friday

📣 Guidelines:
- ONLY return a clean, scannable list using the format above
- Use emoji headers: Events, Errands, Reminders
- Do NOT write a paragraph or commentary
- Do NOT echo the user’s message
- Do NOT include intros, jokes, or additional explanations
- This is going directly into a dashboard — be brief and useful`;




    const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: combinedText }
        ]
      })
    });

    const data = await gptRes.json();
    const summary = data?.choices?.[0]?.message?.content?.trim();
    res.json({ summary });
  } catch (err) {
    console.error("❌ /api/summary-this-week failed:", err.message);
    res.status(500).json({ error: "Failed to generate summary." });
  }
});

// Relief protocol
app.post("/api/relief-protocol", async (req, res) => {
  try {
    const { tasks, emotional_flags } = req.body;

    const prompt = `You are HomeOps, a smart and emotionally intelligent household assistant.

Your job is to generate a Relief Protocol based on the user's tracked tasks and emotional patterns.

Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.

You specialize in helping high-functioning families manage stress, logistics, and emotional labor.
You blend the wit of Amy Schumer with the insight of Adam Grant and the clarity of Mel Robbins.

Return output as JSON with:
{
  "summary": "...",
  "offload": { "text": "...", "coach": "Mel Robbins" },
  "reclaim": { "text": "...", "coach": "Andrew Huberman" },
  "reconnect": { "text": "...", "coach": "John Gottman" },
  "pattern_interrupt": "...",
  "reframe": { "text": "...", "coach": "Adam Grant" }
}`; // ✅ backtick ends here

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content: `Tasks: ${JSON.stringify(tasks)}\nEmotional flags: ${JSON.stringify(emotional_flags)}`
          }
        ]
      })
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

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


// Static fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
});
