async function fetchReliefProtocol() {
  try {
    const eventsRes = await fetch("/api/events?user_id=user_123");
    const events = await eventsRes.json();

    if (events.error || !events.tasks?.length) {
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

    if (reframeText && reframeText.trim()) {
      document.getElementById("relief-reframe").innerText = reframeText;
      reframeBlock.style.display = "block";
    } else {
      reframeBlock.style.display = "none";
    }

  } catch (error) {
    console.error("❌ Relief Protocol Error:", error);
  }
}

// Trigger fetch each time dashboard is activated
document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach(button => {
    button.addEventListener("click", () => {
      const view = button.getAttribute("data-view");
      if (view === "dashboard") {
        setTimeout(fetchReliefProtocol, 200); // slight delay to let DOM settle
      }
    });
  });
});
