console.log("✅ relief.js loaded");

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
    const res = await fetch("/api/this-week"); // GET route now pulls chat history automatically
    const data = await res.json();
    console.log("🧠 This Week View:", data);

    const list = document.getElementById("this-week-list");
    list.innerHTML = "";

    // Handle event list
    if (Array.isArray(data.events) && data.events.length > 0) {
      data.events.forEach(event => {
        const li = document.createElement("li");
        li.textContent = `📅 ${event}`;
        list.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.textContent = "No events found for this week.";
      list.appendChild(li);
    }

    // Handle emotional flags
    if (Array.isArray(data.emotional_flags) && data.emotional_flags.length > 0) {
      const emo = document.createElement("li");
      emo.textContent = `🧠 Emotional flags: ${data.emotional_flags.join(", ")}`;
      list.appendChild(emo);
    }

    // Handle notes
    if (Array.isArray(data.notes) && data.notes.length > 0) {
      const note = document.createElement("li");
      note.textContent = `💬 Note: ${data.notes[0]}`;
      list.appendChild(note);
    }

  } catch (err) {
    console.error("❌ This Week View Error:", err);
    const list = document.getElementById("this-week-list");
    list.innerHTML = "";
    const li = document.createElement("li");
    li.textContent = "Error loading This Week view.";
    list.appendChild(li);
  }
}
