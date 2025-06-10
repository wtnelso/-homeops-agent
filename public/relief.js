async function fetchReliefProtocol() {
  try {
    // Step 1: Pull task + emotional data from recent messages
    const eventsRes = await fetch("/api/events?user_id=user_123");
    const events = await eventsRes.json();

    if (events.error) {
      console.error("❌ Events extraction failed:", events.error);
      return;
    }

    const tasks = (events.tasks || []).map(task => ({ task }));
    const emotional_flags = events.emotional_flags || [];

    // Step 2: Generate Relief Protocol from real inputs
    const res = await fetch('/api/relief-protocol', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks, emotional_flags })
    });

    const data = await res.json();

    // Step 3: Populate the dashboard UI
    document.getElementById('relief-summary').innerText = data.summary || "—";
    document.getElementById('relief-offload').innerText = data.offload?.text || "—";
    document.getElementById('relief-reclaim').innerText = data.reclaim?.text || "—";
    document.getElementById('relief-reconnect').innerText = data.reconnect?.text || "—";
    document.getElementById('relief-interrupt').innerText = data.pattern_interrupt || "—";

    // Optional reframe module
    const reframeBlock = document.getElementById('reframe-block');
    const reframeText = data.reframe?.text;

    if (reframeText && reframeText.trim() !== "") {
      document.getElementById('relief-reframe').innerText = reframeText;
      reframeBlock.style.display = "block";
    } else {
      reframeBlock.style.display = "none";
    }

  } catch (error) {
    console.error("❌ Failed to load Relief Protocol:", error);
  }
}

// Wait for dashboard view to become visible, then load
function waitForDashboardAndLoad() {
  const dashboard = document.getElementById("dashboard-view");

  const observer = new MutationObserver(() => {
    const isVisible = window.getComputedStyle(dashboard).display !== "none";
    if (isVisible) {
      observer.disconnect();
      fetchReliefProtocol();
    }
  });

  observer.observe(dashboard, { attributes: true, attributeFilter: ["style"] });
}

// Run on page load
document.addEventListener("DOMContentLoaded", waitForDashboardAndLoad);
