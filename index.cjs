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
console.log("🔥 Code reached just before try block");
try {
  const base64 = `ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiaG9tZW9wcy13ZWIiLAogICJwcml2YXRlX2tleV9pZCI6ICJjNzIyMTg0M2JiOTU1ZjVmNGNhYTNmNTgzZjE1NmVlMWRkNDQwYzdjIiwKICAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdkFJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLWXdnZ1NpQWdFQUFvSUJBUUNsaE5rZE9XOVNMMUJqXG55N0ZNamR1d212YjJ2VjY3Y2RxYmhndDFzVytubXdaZ0FrbHFTbWxDTnV0L1RMaXRjSGlieVVXZEswb1JYcE0vXG5FaVNvSlluSTFwbDNxYkp3c2JmQkVmRG9oa2ZyT1NMdWlIelEvcHA2aDlTckFQZVA3b1JPbWRnWE1NK2NkUXptXG4vZkJFYVV0R0pTcmJCRUVVTTM0Z1ptajd2YVNVYWNYR3BsVTF1WmxkMmJUc0FKR1dZT2k0eGY5NWdvQ3pqRGZOXG5XUUIyNDJ0bzNOT2ZUanhmbmhJNERSL2tvZlVKWWVUZCtadDlOc2xMSjBISmFxazZpNmVwRFF0aXluL2xSR0xqXG5RN0Z5Y3BVYmNHMTRBdFRaU1YzOUU2d2l1WWRRYk5EalIvMzBGL1VNNS9iNU1KSUFjYjVzbWV5N1JudjZERlFaXG5JODc5WFBSTEFnTUJBQUVDZ2dFQUJ3eVUyOEdxdllsbUhaSHVJdEJwMCtnbk8yMkJiRzg4bGE3WkVrdG52cUxxXG5EeGROQ29hRWowb1BTYlJUcXlteHg2c2RwVjNUdEoxNEExRzdaQ0NxdmR4eDNDdCtGMzVpSGIxZ0txNzhpN202XG42d1dMcW42THgzNVcxVGt0QlNFaERtRWI4U3RNdERyT3ZWem5kaXBvb0pWeWNVdWpMK2FQZ3Fud1NVUmdkWDM3XG5YbE5XTHc1RXIzNDR0UTU0aGNyN3RHSmVPNms0cVRNTjlidEJnUzV3azZIR2tRY3V6blhXMWdpNUFjZEhGcFJ2XG5tSVVBSks5U2Z4b25HdFdNS0VDQ0JiNXNsc2hqaTR1VFE3S2h0YUd3SzdFRjV6ZHpVYU5pVkJ1SGUyVlBMTVdyXG5TOE5wVWIzRm0wWkR0dlBKRk5WZytRT2F3TmJkZ3JGZU5nUXlWbnlZelFLQmdRRFcyREQxNXF2QjNhQWNCVzRlXG5aQ3Q4YS9Md3hsZFRmSnZRSkVJSnNsbHpUZFZBUlFtWWlDZ1F0KzBrVVd2aUJBT2wvRFZSZWtyT2FFK24xc0FZXG5mUUljYUNFZjN5TjhVdTdhN1E3cTRRQTlITVRuRTRvZlVIOUtjTWRCYmEvbUVNZTNML3VLNUFCMzlrZHFjcnZnXG5naEFJeTdSMTVrblBHNG8zNjdvd0NxTjk3UUtCZ1FERk9jVDNWZWp5dkhLZytWdTlxR2hwRlcyUlNjNEdEckRkXG5iaStEbkJZWUJJSHIwMU14WEtBTStpVGJ4RE5LQUh5R1VVN1RtaUo5c2ZFU1J0ZVp5dzlkcnF0cEE2WmNOUEZjXG4yTHBJWkdUWiszOUFqWnBpcjBHcUFhaURrZmxNRnBQcU8zVGFrRzFtQWVINVVCbzhZam90YzhwZEo4NytmRTQwXG5qdHIyc0dxMEZ3S0JnQUdyS2k0dXZYVERBT1JXMG5VZitBcCtXQ093bHFzS1U3ZDVJSjRzcVc4dzBwQXVPUlhiXG5NTng0WVRvZis4T0VubmFpajlOekxMT1BzZGF1MzAwUlkzdk8venJkSTh4cVpIcUV6dEhhTDROSi91bUFpRmtYXG42ZlV0RFE4Z0IvYTBlS2lla2NpUlhzT1B3Unc5aWVJRGdKWmc1cVRueGZqNjBNY0FhTERJMUY0OUFvR0FKT2ozXG4xTFlPUDRkSENKdENNUTlZWXZvd3BEVWt5bnRyWERWbnpRQ2tIZUNTRS9sYm8yeExROEo0cld4ZGtPYmdaeDdHXG5XdEdJek85RlIzOWNrQnF4aUgzTTlIMUxZQXhFYzNUWC8vNVI1WDJzeGY3Nk9xZkQ2VFlnUEdkUU9ZNHNKblQwXG5ISWRWQWZjdVBFTmlkWlNJZ01NZnh5bFJFczFlc1hWZXd6WW04Z2NDZ1lCK1NuTU9aR0tUblp4eGQ5UmdCdXV4XG5Reldmd2dzWXFkc2lpOWp4QmhNRzVHd0d4U0FyQnA5VXczSjFVM3ZQR0hPN0N3OUxXRVEySGQwdjFTRmNiTHhIXG5WWEpGVlNyRmh0dnRTZGVuNUszenU3VkNnNmY4d1l3OUVqQ1d5UFVsN0k0dG05d0tVSEM4TTlQMVZQSE1LbDJLXG41VGUzeld6ZDd5bWxad1g3UWpDTTB3PT1cbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsCiAgImNsaWVudF9lbWFpbCI6ICJmaXJlYmFzZS1hZG1pbnNkay1mYnN2Y0Bob21lb3BzLXdlYi5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMTA1MjUwNDgyOTkxNTAwNjg1MTEiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L2ZpcmViYXNlLWFkbWluc2RrLWZic3ZjJTQwaG9tZW9wcy13ZWIuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K`;

  // ✅ Only one base64 declaration
  console.log("🧪 base64 value is:", base64);
  console.log("🧪 typeof base64:", typeof base64);
  const decoded = Buffer.from(base64, "base64").toString("utf-8");
  console.log("🔍 Firebase key ID:", JSON.parse(decoded)?.private_key_id);
  console.log("🧪 Decoded base64:", decoded);
  firebaseCredentials = JSON.parse(decoded);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseCredentials)
    });
  }
} catch (err) {
  console.error("❌ CRASHED:", err.message);
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
  console.log("🔑 OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);
console.log("🔑 OPENAI_API_KEY (start):", process.env.OPENAI_API_KEY?.slice(0, 6));
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

// DASHBOARD ROUTE
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

// THIS WEEK ROUTE (AI Extracted from Chat)
app.get("/api/this-week", async (req, res) => {
  const { user_id = "user_123" } = req.query;

  try {
    const snapshot = await db
      .collection("messages")
      .where("user_id", "==", user_id)
      .orderBy("timestamp", "desc")
      .limit(25)
      .get();

    const messages = snapshot.docs.map(doc => doc.data().message).reverse();

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a backend AI system. Your job is to extract structured, machine-readable data from chat logs — not to write prose. You must output ONLY strict JSON, and nothing else. Do not explain. Do not comment. Do not include markdown.

Format:
{
  "events": ["Event description – Day and time"],
  "emotional_flags": ["short emotion or pattern"],
  "notes": ["optional coaching note"]
}

EXAMPLE:
{
  "events": ["Lucy swim practice – Tuesday 4:30 PM", "RSVP Ellie birthday – by Friday", "Colette doctor appointment – Thursday morning"],
  "emotional_flags": ["exhausted", "partner tension"],
  "notes": ["Consider a gesture to reconnect with Maddie"]
}

Use double quotes for all strings. Return valid JSON only. Do not add any surrounding text. The result will be parsed by code.`

          },
          {
            role: "user",
            content: messages.join("\n")
          }
        ]
      })
    });

    const raw = await openaiRes.json();
    const content = raw?.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(content.replace(/```json|```/g, "").trim());
    } catch (e) {
      console.error("❌ GPT returned bad JSON:", content);
      return res.status(500).json({ error: "Invalid JSON from OpenAI", raw: content });
    }

    res.json(parsed);
  } catch (err) {
    console.error("❌ Error in GET /api/this-week:", err.message);
    res.status(500).json({ error: "Failed to extract weekly tasks" });
  }
});



// RELIEF PROTOCOL
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
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Tasks: ${JSON.stringify(tasks)}\nEmotional flags: ${JSON.stringify(emotional_flags)}` }
        ]
      })
    });

    const data = await response.json();
    const clean = data?.choices?.[0]?.message?.content?.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);
  } catch (err) {
    console.error("❌ Relief Protocol Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// STATIC FALLBACK
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
});
