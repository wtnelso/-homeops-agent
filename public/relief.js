async function fetchReliefProtocol() {
  try {
    const eventsRes = await fetch("/api/events?user_id=user_123");
    const events = await eventsRes.json();

    if (events.error || !events.tasks?.length || !events.emotional_flags?.length) {
      console.warn("🟡 No tasks or emotional flags to work with.");
      return;
    }

    const tasks = events.tasks.map(task => ({ task }));
    const emotional_flags = events.emotional_flags || [];

    const res = await fetch("/api/relief-protocol", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks, emotional_flags })
    });

    const data = await res.json();

    document.getElementById("relief-summary").innerText = data.summary || "—";
    document.getElementById("relief-offload").innerText = data.offload?.text || "—";
    document.getElementById("relief-reclaim").innerText = data.reclaim?.text || "—";
    document.getElementById("relief-reconnect").innerText = data.reconnect?.text || "—";
    document.getElementById("relief-interrupt").innerText = data.pattern_interrupt || "—";

    const reframeText = data.reframe?.text;
    const reframeBlock = document.getElementById("reframe-block");
    const reframeContent = document.getElementById("relief-reframe");

    if (reframeText && reframeText.trim()) {
      reframeContent.innerText = reframeText;
      reframeBlock.style.display = "block";
    } else {
      reframeBlock.style.display = "none";
    }

  } catch (error) {
    console.error("❌ Relief Protocol Error:", error);
  }
}

async function fetchThisWeekView() {
  try {
    const res = await fetch("/api/messages?user_id=user_123");
    const raw = await res.json();
    const messages = raw.map(entry => entry.message).slice(0, 20);

    const summaryRes = await fetch("/api/this-week", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });

    const events = await summaryRes.json();
    const list = document.getElementById("this-week-list");
    list.innerHTML = "";

    if (!Array.isArray(events) || events.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No scheduled events this week.";
      list.appendChild(li);
      return;
    }

    events.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.icon || "📅"} ${item.label}`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("❌ This Week View Error:", err);
  }
}

// Trigger fetch each time dashboard is activated
document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach(button => {
    button.addEventListener("click", () => {
      const view = button.getAttribute("data-view");
      if (view === "dashboard") {
        setTimeout(() => {
          fetchReliefProtocol();
          fetchThisWeekView();
        }, 200); // slight delay to let DOM settle
      }
    });
  });
});
