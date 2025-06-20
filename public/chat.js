document.addEventListener("DOMContentLoaded", () => {
  window.pendingCalendarEvents = [];

  const input = document.getElementById("input");
  const chat = document.getElementById("chat");
  const form = document.getElementById("chatForm");

  appendMessage(
    "HomeOps",
    "Hi. I'm your personal chief of staff. I specialize in mental clutter, invisible labor, and things you didn’t ask to be responsible for. What’s on deck?",
    "agent"
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    appendMessage("You", message, "user");
    input.value = "";

    const typing = document.createElement("div");
    typing.className = "typing-indicator";
    typing.id = "typing";
    typing.textContent = "HomeOps is thinking...";
    chat.appendChild(typing);
    chat.scrollTop = chat.scrollHeight;

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, user_id: "user_123" }),
      });

      const data = await res.json();

      console.log("📥 Full response from backend:", data);
      document.getElementById("typing")?.remove();

      const cleanReply = data.reply?.trim() || "🤖 No reply received.";
      appendMessage("HomeOps", cleanReply, "agent");
console.log("📦 Received events array:", data.events);

if (Array.isArray(data.events)) {
  if (window.calendar) {
    for (const event of data.events) {
      console.log("📅 Attempting to inject event:", event);

      // Sanity checks
      if (!event || typeof event !== "object") {
        console.warn("❗ Skipping non-object event:", event);
        continue;
      }

      if (!event.start || isNaN(new Date(event.start))) {
        console.warn("⚠️ Invalid or missing 'start' field:", event);
        continue;
      }

      const cleanTitle = typeof event.title === "string" && event.title.trim() !== ""
  ? event.title.trim()
  : `📅 Untitled (${event.start?.slice(11, 16) || "??:??"})`;


      const parsedDate = new Date(event.start);
      const localDate = new Date(parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000);

      const safeEvent = {
        title: cleanTitle,
        start: localDate.toISOString(),
        allDay: event.allDay ?? false,
      };

      try {
        const injected = window.calendar.addEvent(safeEvent);
        highlightCalendarEvent?.(injected);

        const saveRes = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: safeEvent }),
        });

        const result = await saveRes.json();
        if (!result.success) throw new Error(result.error);
        console.log("✅ Event saved to Firestore:", result.id);
      } catch (err) {
        console.error("❌ Failed to inject/save event:", err.message);
      }
    }
  } else {
    console.warn("⚠️ Calendar not ready, queuing events");
    window.pendingCalendarEvents.push(...data.events);
  }
}


    } catch (error) {
      document.getElementById("typing")?.remove();
      console.error("❌ Chat processing error:", error);
      appendMessage("Error", "Something went wrong talking to the assistant.", "agent");
    }
  });

  function appendMessage(sender, text, type) {
    const msg = document.createElement("div");
    msg.className = `message ${type}`;

    const senderTag = document.createElement("span");
    senderTag.className = "sender";
    senderTag.textContent = sender;

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = text;

    msg.appendChild(senderTag);
    msg.appendChild(bubble);
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
  }

  function highlightCalendarEvent(eventObj) {
    if (!eventObj) return;
    const el = eventObj.el;
    if (el) {
      el.classList.add("highlight");
      setTimeout(() => el.classList.remove("highlight"), 1500);
    }
  }
});
