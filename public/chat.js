document.addEventListener("DOMContentLoaded", () => {
  window.pendingCalendarEvents = [];

  // 🗓️ Initialize the FullCalendar instance
  const calendarEl = document.getElementById("calendar");

  if (calendarEl) {
    window.calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      initialDate: new Date(),
      contentHeight: "auto",
      aspectRatio: 0.75,
      handleWindowResize: true,
      events: []
    });

    window.calendar.render();
  } else {
    console.warn("⚠️ Calendar element not found.");
  }

  const chatBox = document.getElementById("chat");
  const chatForm = document.getElementById("chatForm");
  const input = document.getElementById("input");

  // Function to add a message to the chat box
  function addMessage(sender, message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;

    const senderDiv = document.createElement("div");
    senderDiv.className = "sender";
    senderDiv.textContent = sender === "user" ? "You" : "HomeOps";

    const bubbleDiv = document.createElement("div");
    bubbleDiv.className = "message-bubble";
    bubbleDiv.textContent = message;

    messageDiv.appendChild(senderDiv);
    messageDiv.appendChild(bubbleDiv);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
  }

  // Handle form submission
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    addMessage("user", message);
    input.value = "";

    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      
      if (data.reply) {
        addMessage("agent", data.reply);
      }

      // If new events were created, add them directly to the calendar
      if (data.events && data.events.length > 0) {
        if (window.calendar) {
          data.events.forEach(event => {
            window.calendar.addEvent(event);
          });
          console.log(`✅ Added ${data.events.length} new events to the calendar.`);
        } else {
          // Fallback if calendar isn't rendered yet
          window.pendingCalendarEvents = window.pendingCalendarEvents || [];
          window.pendingCalendarEvents.push(...data.events);
        }
      }

    } catch (err) {
      console.error("Chat error:", err);
      addMessage("agent", "Sorry, I'm having trouble connecting. Please try again later.");
    }
  });

  // Initial greeting
  addMessage("agent", "Hi. I'm your personal chief of staff. What can I help you with today?");

  function highlightCalendarEvent(eventObj) {
    if (!eventObj) return;
    const el = eventObj.el;
    if (el) {
      el.classList.add("highlight");
      setTimeout(() => el.classList.remove("highlight"), 1500);
    }
  }
});
