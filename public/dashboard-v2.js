const userId = "user_123";

// 🔄 Primary load from Firebase messages
async function fetchMessages() {
  const res = await fetch(`/api/messages?user_id=${userId}`);
  const messages = await res.json();
  renderDashboard(messages);
  loadHiddenLoad();
  loadOpsIntelligence();
}

function renderDashboard(messages) {
  const cleaned = messages.map(msg => {
    let tags = msg.tags;
    if (typeof tags === "string") {
      try {
        tags = JSON.parse(tags);
      } catch {
        tags = [];
      }
    }
    if (!Array.isArray(tags)) tags = [];
    return { ...msg, tags };
  });

  const flagged = cleaned.filter(msg =>
    msg.tags.includes("mental load") || msg.tags.includes("resentment")
  );
  const loadScore = Math.min(100, flagged.length * 10);
  const recent = cleaned.slice(0, 5);

  document.getElementById("load-score").textContent = `${loadScore} / 100`;

  const themes = new Set();
  cleaned.forEach(msg => msg.tags.forEach(tag => themes.add(tag)));

  const themeList = document.getElementById("behavioral-themes");
  themeList.innerHTML = "";
  Array.from(themes).slice(0, 5).forEach(tag => {
    const li = document.createElement("li");
    li.textContent = tag;
    themeList.appendChild(li);
  });

  const timeline = document.getElementById("context-thread");
  timeline.innerHTML = "";
  recent.forEach(msg => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>${new Date(msg.timestamp._seconds * 1000).toLocaleDateString()}:</strong> ${msg.message}`;
    timeline.appendChild(div);
  });

  const scripts = document.getElementById("smart-replies");
  scripts.innerHTML = "";
  flagged.slice(0, 3).forEach(msg => {
    const div = document.createElement("div");
    div.textContent = msg.reply;
    scripts.appendChild(div);
  });
}

// 🕳️ Hidden Load (Invisible Labor)
async function loadHiddenLoad() {
  try {
    const res = await fetch(`/api/events?user_id=${userId}`);
    const data = await res.json();

    const container = document.getElementById("hidden-load");
    if (!container) return;

    let html = "";

    if (data.tasks?.length) {
      html += `<h4>Untracked Tasks</h4><ul>`;
      data.tasks.slice(0, 4).forEach(task => {
        html += `<li>${task}</li>`;
      });
      html += `</ul>`;
    }

    if (data.emotional_flags?.length) {
      html += `<h4>Emotional Load Signals</h4><ul>`;
      data.emotional_flags.slice(0, 3).forEach(flag => {
        html += `<li>${flag}</li>`;
      });
      html += `</ul>`;
    }

    if (!html) {
      html = `<p>No hidden load detected yet.</p>`;
    }

    container.innerHTML = html;
  } catch (err) {
    console.error("❌ Failed to load Hidden Load:", err);
  }
}

// 🔍 Ops Intelligence (Secure GPT via /api/insights)
async function loadOpsIntelligence() {
  try {
    const res = await fetch(`/api/events?user_id=${userId}`);
    const data = await res.json();

    const container = document.getElementById("ops-intelligence");
    if (!container) return;

    const summary = `
      Tasks: ${data.tasks?.length || 0}
      Appointments: ${data.appointments?.length || 0}
      Reminders: ${data.reminders?.length || 0}
      Flags: ${(data.emotional_flags || []).join(", ")}
    `;

    const insightRes = await fetch("/api/insights", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ summary })
    });

    const result = await insightRes.json();
    container.innerHTML = `<p>${result.insight}</p>`;
  } catch (err) {
    console.error("❌ Failed to load Ops Intelligence:", err);
    const container = document.getElementById("ops-intelligence");
    if (container) container.innerHTML = `<p>Unable to generate insights right now.</p>`;
  }
}

fetchMessages();
