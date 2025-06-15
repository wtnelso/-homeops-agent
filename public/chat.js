document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input");
  const chat = document.getElementById("chat");
  const form = document.getElementById("chatForm");

  // Show welcome message on load
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

    // Add typing indicator
    const typing = document.createElement("div");
    typing.className = "typing-indicator";
    typing.id = "typing";
    typing.textContent = "HomeOps is thinking...";
    chat.appendChild(typing);
    chat.scrollTop = chat.scrollHeight;

    try {
      // Optional: delay for user experience
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, user_id: "user_123" }),
      });

      const data = await res.json();
      document.getElementById("typing")?.remove(); // remove typing

      // Append agent reply to chat
      appendMessage("HomeOps", data.reply || "🤖 No reply received.", "agent");

      // Inject calendar events if provided
      if (data.events?.length && window.calendar) {
        data.events.forEach((event) => {
          try {
            window.calendar.addEvent(event);
            console.log("🗓️ Event added:", event);
          } catch (err) {
            console.warn("⚠️ Failed to add event:", event, err.message);
          }
        });
      }

    } catch (error) {
      document.getElementById("typing")?.remove(); // remove typing
      console.error("❌ Chat error:", error);
      appendMessage("Error", "Something went wrong talking to the assistant.", "agent");
    }
  });

  // Helper: display a message in the chat
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
});
