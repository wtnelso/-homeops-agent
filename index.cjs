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
const base64 = `eyAgInR5cGUiOiAic2VydmljZV9hY2NvdW50IiwgICJwcm9qZWN0X2lkIjogImhvbWVvcHMtd2ViIiwgICJwcml2YXRlX2tleV9pZCI6ICJiNDEyMWJiYzgwZjUzODVkYjY2NThkZTc3MGIyOWNiOTRhY2FiMjE3IiwgICJwcml2YXRlX2tleSI6ICItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRREJYRlBvdHJNY1F1eENcbnJPamh6OE94R0oxcC9NcDVrS3VsVTVIQWQrOGZTVktjc1dDRjZzTm9oMEdmK1BwUnVHZlVMNjZWVHZlTUdIUHhcbkdqeEcvWU9SSGgxVG55VzloVHgyWk41MnBEUHRTYmptdVVzQUdXZmdWa1VzOU0zc3Z5WVlwTGFwekRtZzdZak1cbm0rOUlwK3hYZU5rRGhuTW5PRnlvQ1MyZHBZNXhvY2Zic1B2VXRkN215bE9FaTQxR2I1Qm54TnBBMGZpbnJIZUhcbmVKcDR5d2FocmNXNTRzbElCOUk4NTRvR3Rtb1JOUlAwcXo5SW5PQmFzeTBzRDhjdGdKOE4veHpUSDhycVBkSXBcbmF2aWxFVHYyRkU0RVd0VjZKU1czMjVsRFJwLzlTZG93VStmbFRLa0VxdWlBSVhJUUdxNFdWTnNabWdGM29NelZcblRjT01PaVpIQWdNQkFBRUNnZ0VBVEY5bzN4S0dwVU9EcVFROXlhOHo5cmVudVV5NU5wSGZVaUl6Z0FkL0llYm1cbm8vQmxsUTk0bGtsU01OcjVHQjBUbVpvcHhWeVc1elZqV2hoSU5hdjljdXlubmJkUEEwL2taVWtMRzJaWkFrRHJcbnNPb0FCeTZCdW5pb3d3eUFaNkhLYk5KbU9hUHFJVGVoSUZ2NUE4UWIxQ0x0NkhnSzlMTk0yYXdpWWRHWjlTUkdcbjZ3NWFxRTJoVjBxRDVVZkFzcE56YlQwWTRoWG1uaXdlUjczR1lPSlI0WXB6dmhxeWQwU2hOd3ZWKzIzdmJzVnJcbmJwNW1LeXNMMUdSUlc5YlhucFpMVklSS1J0MkRuU0FEN2Zxck5TNlZvTkh1RlpVNGxQWUJITUhkUlR5Qm81VkVcbnlNeHNUOWxWOWkvZXZZU1Bza3JMUWxFdmtSNTU5MjlKNDBENTkrZE1SUUtCZ1FEb3NmYXRwTjJDc3ZxYUkrdFhcbmxkMDdUTDlxbENhYUlaMXhjaklybHV3UDlKRmp6VjlYb2wzRDU1ditSWDlobHd6NEdIMHgrSXcweDhGL0tHTVZcbm51WUo4SEFwYlIvcjNxUUhOY2wzc0RrYmZ0RG1McDdneFZ5TWJWTWQ0U2ZPRFZ3Rkl0dGQwdFhTL1FjQ0FzakdcbmZaWnZEUE1Hd29iSWpzYnlNeDBib1BhNVRRS0JnUURVdWQ5YTUwdmUyZVFFRmhoME5ZNlpXNFJIeUZWRE1wdGtcbnp0L3MxZ2FzVHBkMlNVWkpDUTlSSGR1YjV1cFVkUzhCUUY2R0IrSUtUdUJ2UDI1ZnZzSDIwQk9Jd3RuZ0RzRVpcblVCVjFiUzhyQWwzTUYzZlM5ZkRwMkZ5VXp3aHlJbjc2MWVpUEYrbDI3aUdqaUZEbVZCcE5ZQ2p3cUFNVGxqSDdcbm85a1NDKyt6NHdLQmdRRFQ3MUxITU1OM2lOL3FpQkNQUXpXdUR1YkFnWkx2Q3ZMRklzZERJRUI4Lzdsejl0ZUJcbmo2WnJDWVh3ZndmWHNLWGxTUml0N0x4MlRnR1VlUXBWNU5XTDgrdVVMNG5GWUpCdzZMSklTcjZZcGxaSmIralFcbnU3RGhUYWxJSzR2L2hmZHJ6aVdTUExiM1pmRitDVjhvT2JaTUNyVkdVT0pGeEpTNmY0ZGhaS2VTZVFLQmdEbnFcbm5VQVBweDEyYjFrWmR2RDB2KzFLK0ZuZTFpL2tjR0JpM3A2SnF1bHd3RllKSHlTMVhjRTFBdHlRWXc0NWxXR2VcbjE5MWYrZy9hWjhxQ0Y1Zmp4TVZnNDJDaHhGWDNUbVdJNHo3RVNrcElhNmNzWUloRVE2STNNUVdtMUdMV3Q0R3RcbmlaS2o3UUZmVmpOQzR0dkMzQ0ppNHVLYXE3UENlYnRNWWNaREQ3RUhBb0dBSjFlUVJlcVpCVnNoS1ZkKysyT0JcbllCM0lNalZIWFNueW1xVWMyUHA3ZVJCOHhlYnMvdzQ3alRxWklkSzI5Z3JtNFVBRWRXdVBrK0x3cE9TWmdlNVpcbnhFaittNWlrY3Y3MXRnS2tqaFBKMnl1KzFnanQ4aWRPS1lwVUZjaEQ0ekZndzgxbTlTTnBjekVoVmMwV0dnaDhcbkp3amZicU5rVXY1bFp4Y3pIYlkwMytVPVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwgICJjbGllbnRfZW1haWwiOiAiZmlyZWJhc2UtYWRtaW5zZGstZmJzdmNAaG9tZW9wcy13ZWIuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCAgImNsaWVudF9pZCI6ICIxMTA1MjUwNDgyOTkxNTAwNjg1MTEiLCAgImF1dGhfdXJpIjogImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwgICJ0b2tlbl91cmkiOiAiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLCAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLCAgImNsaWVudF94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvZmlyZWJhc2UtYWRtaW5zZGstZmJzdmMlNDBob21lb3BzLXdlYi5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsICAidW5pdmVyc2VfZG9tYWluIjogImdvb2dsZWFwaXMuY29tIn0=
`;

  console.log("🧪 base64 value is:", base64);
  console.log("🧪 typeof base64:", typeof base64);
  const decoded = Buffer.from(base64, "base64").toString("utf-8");
  console.log("🧪 Decoded base64:", decoded);
  firebaseCredentials = JSON.parse(decoded);
} catch (err) {
  console.error("❌ CRASHED:", err.message);
  process.exit(1);
}


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseCredentials)
  });
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

// /api/this-week ROUTE
app.post("/api/this-week", async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "No messages provided." });
  }

  const systemPrompt = `You are HomeOps — a smart, emotionally fluent household assistant for high-performing families.

Your tone blends:
- the raw wit of Amy Schumer  
- the tactical clarity of Mel Robbins  
- the observational humor of Jerry Seinfeld  
- the emotional insight of Adam Grant  
- and the pattern-framing curiosity of Malcolm Gladwell

Your job: extract the user’s weekly appointments, obligations, and tasks. Structure them clearly. Then respond with a short validating paragraph in your tone.

✅ Format:

🛂 Tuesday @ 11 AM — Passport appointment  
🏊 Tuesday @ 6 PM — Ellie swim practice  
🎾 Wednesday evening — Lucy’s tennis match  

📣 Then add 2–3 sentences of commentary. It should:
- Acknowledge the emotional + logistical weight  
- Use wit and real-life energy (not corporate fluff)  
- Encourage prioritization and self-kindness  

No markdown. No long paragraphs. Emojis are welcome. List first, commentary second.`;


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
    const raw = data?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json(parsed);
  } catch (err) {
    console.error("❌ /api/this-week failed:", err.message);
    res.status(500).json({ error: "Failed to generate weekly summary" });
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
