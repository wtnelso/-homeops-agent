document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input");
  const chat = document.getElementById("chat");
  const form = document.getElementById("chatForm");

  // Show welcome message on load
  appendMessage("HomeOps", "Hi. I'm your personal chief of staff. I specialize in mental clutter, invisible labor, and things you didn’t ask to be responsible for. What’s on deck?", "agent");

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
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, user_id: "user_123" })
      });

      const data = await res.json();

      document.getElementById("typing")?.remove(); // Remove typing indicator
      appendMessage("HomeOps", data.reply || "🤖 No reply received.", "agent");
    } catch (error) {
      document.getElementById("typing")?.remove(); // Remove typing indicator
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
    bubble.textContent = text;

    msg.appendChild(senderTag);
    msg.appendChild(bubble);
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
  }
});
