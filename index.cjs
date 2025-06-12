require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const SYSTEM_PROMPT = fs.readFileSync("./prompts/tone-homeops.txt", "utf-8");
console.log("🟢 SYSTEM_PROMPT loaded:", SYSTEM_PROMPT.slice(0, 120) + "...");

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

const db = admin.firestore();
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("public"));

// CHAT ROUTE
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

// /api/extract-this-week — FUNCTION-CALLING ONLY VERSION
app.get("/api/extract-this-week", async (req, res) => {
  const { user_id = "user_123" } = req.query;

  try {
    const snapshot = await db
      .collection("messages")
      .where("user_id", "==", user_id)
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    const messages = snapshot.docs.map(doc => doc.data().message).reverse();

    const functions = [
      {
        name: "extract_schedule_and_reminders",
        description: "Extract structured schedule and reminders",
        parameters: {
          type: "object",
          properties: {
            schedule: {
              type: "object",
              additionalProperties: { type: "array", items: { type: "string" } }
            },
            reminders: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["schedule", "reminders"]
        }
      }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4-0613",
        messages: [
          {
            role: "system",
            content: "You are a backend assistant that extracts structured weekly schedules and reminders from user chat."
          },
          {
            role: "user",
            content: messages.join("\n")
          }
        ],
        functions,
        function_call: { name: "extract_schedule_and_reminders" }
      })
    });

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.function_call?.arguments;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("❌ JSON parsing failed:", raw);
      return res.status(500).json({ error: "Invalid JSON", raw });
    }

    await db.collection("this_week").add({
      user_id,
      timestamp: new Date(),
      ...parsed
    });

    res.json(parsed);
  } catch (err) {
    console.error("❌ Error in /api/extract-this-week:", err.message);
    res.status(500).json({ error: "Extraction failed" });
  }
});

// STATIC FALLBACK
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
});
