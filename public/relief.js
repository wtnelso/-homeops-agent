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

async function fetchReliefProtocol() {
  try {
    const res = await fetch('/api/relief-protocol', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: [
          { task: "Pack lunches every day" },
          { task: "Doctor appointment Monday" },
          { task: "Grocery run Saturday" }
        ],
        emotional_flags: ["resentment", "burnout"]
      })
    });

    const data = await res.json();

    document.getElementById('relief-summary').innerText = data.summary;
    document.getElementById('relief-offload').innerText = data.offload.text;
    document.getElementById('relief-reclaim').innerText = data.reclaim.text;
    document.getElementById('relief-reconnect').innerText = data.reconnect.text;
    document.getElementById('relief-interrupt').innerText = data.pattern_interrupt;

    if (data.reframe) {
      document.getElementById('relief-reframe').innerText = data.reframe.text;
      document.getElementById('reframe-block').style.display = "block";
    }
  } catch (error) {
    console.error("❌ Failed to load Relief Protocol:", error);
  }
}

waitForDashboardAndLoad();
