document.addEventListener("DOMContentLoaded", () => {
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

    // Typing indicator
    const typing = document.createElement("div");
    typing.className = "typing-indicator";
    typing.id = "typing";
    typing.textContent = "HomeOps is thinking...";
    chat.appendChild(typing);
    chat.scrollTop = chat.scrollHeight;

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // optional UX delay

      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, user_id: "user_123" }),
      });

      const data = await res.json();
      console.log("📥 Full response from backend:", data);

      document.getElementById("typing")?.remove();
      appendMessage("HomeOps", data.reply || "🤖 No reply received.", "agent");

      // Inject events into FullCalendar
      if (Array.isArray(data.events) && window.calendar) {
        const added = new Set();
        data.events.forEach((event) => {
          const key = `${event.title}|${event.start}`;
          if (!added.has(key)) {
            const newEvent = window.calendar.addEvent(event);
            highlightCalendarEvent(newEvent);
            added.add(key);
            console.log("🗓️ Event added:", event);
          }
        });
      } else if (!window.calendar) {
        console.warn("⚠️ window.calendar not found.");
      } else {
        console.log("📭 No events to add.");
      }

    } catch (error) {
      document.getElementById("typing")?.remove();
      console.error("❌ Chat error:", error);
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
    bubble.textContent = text; // safe fallback

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
