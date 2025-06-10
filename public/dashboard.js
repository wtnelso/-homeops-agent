const userId = "user_123"; // 🔐 Replace with dynamic logic later

async function fetchMessages() {
  const res = await fetch(`/api/messages?user_id=${userId}`);
  const messages = await res.json();
  renderWidgets(messages);
}

function renderWidgets(messages) {
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
  const recent = cleaned.slice(0, 3);

  document.querySelector("#mental-load").innerHTML = `
    ${flagged.length} flagged items<br>
    ${recent.length} unresolved scripts<br>
    ${loadScore > 70 ? "⚠️ High Load Today" : "✅ Under Control"}
  `;

  document.querySelector("#weekly-score").innerHTML = `
    Your score this week: <span class="load-score ${loadScore > 70 ? "high" : loadScore > 30 ? "medium" : "good"}">${loadScore} / 100</span><br>
    ${loadScore > 70 ? "⚠️ You're running hot. Consider a reset." : "✅ You’re pacing well."}
  `;

  document.querySelector("#emotional-themes").innerHTML = cleaned
    .flatMap(msg => (Array.isArray(msg.tags) ? msg.tags.map(tag => `• ${tag}`) : []))
    .slice(0, 5)
    .join("<br>");

  document.querySelector("#timeline").innerHTML = cleaned
    .slice(0, 5)
    .map(msg => `<strong>${new Date(msg.timestamp._seconds * 1000).toLocaleDateString()}:</strong> ${msg.message}`)
    .join("<br>");
}

async function loadCommandCenter() {
  try {
    const res = await fetch(`/api/events?user_id=${userId}`);
    const data = await res.json();

    const container = document.getElementById("command-center");
    if (!container) return;

    let html = "";

    if (data.appointments?.length) {
      html += `<h4>🧠 Coming Up</h4><ul>`;
      data.appointments.slice(0, 3).forEach(item => {
        html += `<li>${item}</li>`;
      });
      html += `</ul>`;
    }

    if (data.reminders?.length) {
      html += `<h4>🎯 Needs Attention</h4><ul>`;
      data.reminders.slice(0, 2).forEach(item => {
        html += `<li>${item}</li>`;
      });
      html += `</ul>`;
    }

    html += `<h4>❗ Potential Drops</h4><p><em>Coming soon…</em></p>`;
    html += `<h4>👥 Partner Load</h4><p><em>Shared load tracking in next phase</em></p>`;

    container.innerHTML = html;
  } catch (err) {
    console.error("❌ Failed to load Command Center:", err);
  }
}

async function fetchWeeklySummary() {
  try {
    const res = await fetch("/api/summary-this-week", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id })
    });

    const data = await res.json();
    const summaryBlock = document.querySelector(".dashboard-card:nth-child(1) ul");

    if (summaryBlock && data.summary) {
      summaryBlock.innerHTML = data.summary
        .split("\n")
        .map(line => `<li>📝 ${line.trim()}</li>`)
        .join("");
    }
  } catch (err) {
    console.error("❌ Failed to load weekly summary:", err.message);
  }
}

// Load everything on DOM ready
window.addEventListener("DOMContentLoaded", () => {
  fetchMessages();
  loadCommandCenter();
  fetchWeeklySummary();
});
