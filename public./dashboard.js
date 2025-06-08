const userId = "user_123"; // 🔐 Replace with dynamic logic later

async function fetchMessages() {
  const res = await fetch(`/api/messages?user_id=${userId}`);
  const messages = await res.json();
  renderWidgets(messages);
}

function renderWidgets(messages) {
  const flagged = messages.filter(msg => msg.tags.includes("mental load") || msg.tags.includes("resentment"));
  const loadScore = Math.min(100, flagged.length * 10); // basic logic
  const recent = messages.slice(0, 3);

  document.querySelector("#mental-load").innerHTML = `
    ${flagged.length} flagged items<br>
    ${recent.length} unresolved scripts<br>
    ${loadScore > 70 ? "⚠️ High Load Today" : "✅ Under Control"}
  `;

  document.querySelector("#weekly-score").innerHTML = `
    Your score this week: <span class="load-score ${loadScore > 70 ? "high" : loadScore > 30 ? "medium" : "good"}">${loadScore} / 100</span><br>
    ${loadScore > 70 ? "⚠️ You're running hot. Consider a reset." : "✅ You’re pacing well."}
  `;

  document.querySelector("#emotional-themes").innerHTML = messages
    .flatMap(msg => msg.tags.map(tag => `• ${tag}`))
    .slice(0, 5)
    .join("<br>");

  document.querySelector("#timeline").innerHTML = messages
    .slice(0, 5)
    .map(msg => `<strong>${new Date(msg.timestamp._seconds * 1000).toLocaleDateString()}:</strong> ${msg.message}`)
    .join("<br>");
}

fetchMessages();

