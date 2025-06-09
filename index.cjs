const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const admin = require("firebase-admin");
const path = require("path");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("public"));

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ✅ Chat route
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
          {
            role: "system",
            content: `
You are HomeOps: an emotionally intelligent household assistant. 
Respond with empathy, humor, and insight. Always suggest scripts to help reduce mental load.
            `,
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    const data = await openaiRes.json();
    console.log("🔍 OpenAI raw response:", JSON.stringify(data, null, 2));

    let reply = "Sorry, I had a brain freeze.";
    if (data && Array.isArray(data.choices) && data.choices[0]?.message?.content) {
      reply = data.choices[0].message.content;
    } else {
      console.error("❌ Invalid OpenAI response:", data);
    }

    const tags = ["mental load", "resentment"]; // Placeholder

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

// ✅ Messages fetch route
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
    console.error("🔥 Failed to fetch messages:", error.message, error.stack);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// ✅ Dashboard data route
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

    // Analyze messages
    const themeCounts = {};
    const taskList = [];

    messages.forEach(({ message, reply }) => {
      const text = `${message} ${reply}`.toLowerCase();

      // Simple keyword detection
      ["laundry", "school", "camp", "appointment", "groceries", "pickup"].forEach((keyword) => {
        if (text.includes(keyword)) {
          themeCounts[keyword] = (themeCounts[keyword] || 0) + 1;
        }
      });

      // "This week" heuristics
      if (/monday|tuesday|wednesday|thursday|friday/i.test(text)) {
        taskList.push(text);
      }
    });

    // Sort top recurring themes
    const topThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word, count]) => `${word} (${count}x)`);

    res.json({
      tasksThisWeek: taskList.slice(0, 3),
      topThemes,
      totalTasks: messages.length,
    });
  } catch (error) {
    console.error("🔥 Failed to generate dashboard:", error.message);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

// ✅ Serve index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
});
