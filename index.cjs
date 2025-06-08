const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const fetch = require("node-fetch"); // ✅ CommonJS compatible version

dotenv.config();

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static("public"));

console.log("✅ API key present:", !!process.env.OPENAI_API_KEY);

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    console.log("🟡 Received:", userMessage);
    console.log("📡 Sending request to OpenAI...");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are HomeOps — a hyper-intelligent, emotionally fluent household assistant designed to help modern families run their lives more efficiently, reduce mental load, and resolve real-life tension with humor and grace."
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices.length) {
      console.error("❌ Invalid OpenAI response:", data);
      return res.status(500).json({ reply: "OpenAI did not respond correctly." });
    }

    const reply = data.choices[0].message.content;
    console.log("🟢 Replying with:", reply);
    res.json({ reply });

  } catch (error) {
    console.error("❌ Server error:", error.message);
    res.status(500).json({ reply: "Server failed to reach OpenAI." });
  }
});

app.listen(port, () => {
  console.log(`✅ HomeOps agent is running at http://localhost:${port}`);
});
