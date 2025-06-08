const userId = "user_123";

async function fetchMessages() {
  const res = await fetch(`/api/messages?user_id=${userId}`);
  const messages = await res.json();
  renderDashboard(messages);
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

  const themeList = document.getElementById("emotional-themes");
  themeList.innerHTML = "";
  Array.from(themes).slice(0, 5).forEach(tag => {
    const li = document.createElement("li");
    li.textContent = tag;
    themeList.appendChild(li);
  });

  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";
  recent.forEach(msg => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>${new Date(msg.timestamp._seconds * 1000).toLocaleDateString()}:</strong> ${msg.message}`;
    timeline.appendChild(div);
  });

  const scripts = document.getElementById("suggested-scripts");
  scripts.innerHTML = "";
  flagged.slice(0, 3).forEach(msg => {
    const div = document.createElement("div");
    div.textContent = msg.reply;
    scripts.appendChild(div);
  });
}

fetchMessages();
