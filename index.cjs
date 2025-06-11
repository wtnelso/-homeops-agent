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
  const base64 = `{
  "type": "service_account",
  "project_id": "homeops-web",
  "private_key_id": "b4121bbc80f5385db6658de770b29cb94acab217",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDBXFPotrMcQuxC\nrOjhz8OxGJ1p/Mp5kKulU5HAd+8fSVKcsWCF6sNoh0Gf+PpRuGfUL66VTveMGHPx\nGjxG/YORHh1TnyW9hTx2ZN52pDPtSbjmuUsAGWfgVkUs9M3svyYYpLapzDmg7YjM\nm+9Ip+xXeNkDhnMnOFyoCS2dpY5xocfbsPvUtd7mylOEi41Gb5BnxNpA0finrHeH\neJp4ywahrcW54slIB9I854oGtmoRNRP0qz9InOBasy0sD8ctgJ8N/xzTH8rqPdIp\navilETv2FE4EWtV6JSW325lDRp/9SdowU+flTKkEquiAIXIQGq4WVNsZmgF3oMzV\nTcOMOiZHAgMBAAECggEATF9o3xKGpUODqQQ9ya8z9renuUy5NpHfUiIzgAd/Iebm\no/BllQ94lklSMNr5GB0TmZopxVyW5zVjWhhINav9cuynnbdPA0/kZUkLG2ZZAkDr\nsOoABy6BuniowwyAZ6HKbNJmOaPqITehIFv5A8Qb1CLt6HgK9LNM2awiYdGZ9SRG\n6w5aqE2hV0qD5UfAspNzbT0Y4hXmniweR73GYOJR4Ypzvhqyd0ShNwvV+23vbsVr\nbp5mKysL1GRRW9bXnpZLVIRKRt2DnSAD7fqrNS6VoNHuFZU4lPYBHMHdRTyBo5VE\nyMxsT9lV9i/evYSPskrLQlEvkR55929J40D59+dMRQKBgQDosfatpN2CsvqaI+tX\nld07TL9qlCaaIZ1xcjIrluwP9JFjzV9Xol3D55v+RX9hlwz4GH0x+Iw0x8F/KGMV\nnuYJ8HApbR/r3qQHNcl3sDkbftDmLp7gxVyMbVMd4SfODVwFIttd0tXS/QcCAsjG\nfZZvDPMGwobIjsbyMx0boPa5TQKBgQDUud9a50ve2eQEFhh0NY6ZW4RHyFVDMptk\nzt/s1gasTpd2SUZJCQ9RHdub5upUdS8BQF6GB+IKTuBvP25fvsH20BOIwtngDsEZ\nUBV1bS8rAl3MF3fS9fDp2FyUzwhyIn761eiPF+l27iGjiFDmVBpNYCjwqAMTljH7\no9kSC++z4wKBgQDT71LHMMN3iN/qiBCPQzWuDubAgZLvCvLFIsdDIEB8/7lz9teB\nj6ZrCYXwfwfXsKXlSRit7Lx2TgGUeQpV5NWL8+uUL4nFYJBw6LJISr6YplZJb+jQ\nu7DhTalIK4v/hfdrziWSPLb3ZfF+CV8oObZMCrVGUOJFxJS6f4dhZKeSeQKBgDnq\nnUAPpx12b1kZdvD0v+1K+Fne1i/kcGBi3p6JqulwwFYJHyS1XcE1AtyQYw45lWGe\n191f+g/aZ8qCF5fjxMVg42ChxFX3TmWI4z7ESkpIa6csYIhEQ6I3MQWm1GLWt4Gt\niZKj7QFfVjNC4tvC3CJi4uKaq7PCebtMYcZDD7EHAoGAJ1eQReqZBVshKVd++2OB\nYB3IMjVHXSnymqUc2Pp7eRB8xebs/w47jTqZIdK29grm4UAEdWuPk+LwpOSZge5Z\nxEj+m5ikcv71tgKkjhPJ2yu+1gjt8idOKYpUFchD4zFgw81m9SNpczEhVc0WGgh8\nJwjfbqNkUv5lZxczHbY03+U=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@homeops-web.iam.gserviceaccount.com",
  "client_id": "110525048299150068511",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40homeops-web.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
`;

  console.log("🧪 FIREBASE_CREDENTIALS_BASE64 present:", !!base64); // true or false
  console.log("🔍 FIREBASE_CREDENTIALS_BASE64 (raw):", base64); // actual string

  const decoded = Buffer.from(base64, "base64").toString("utf-8");
  firebaseCredentials = JSON.parse(decoded);
  console.log("🧪 Firebase credentials loaded:", !!firebaseCredentials);
} catch (err) {
  console.error("❌ Failed to decode Firebase credentials from base64:", err.message);
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
