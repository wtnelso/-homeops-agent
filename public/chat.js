document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input");
  const chat = document.getElementById("chat");
  const form = document.getElementById("chatForm");

  // Welcome message on load
  appendMessage("HomeOps", "Hi. I'm your personal chief of staff. I specialize in mental clutter, invisible labor, and things you didn’t ask to be responsible for. What’s on deck?", "agent");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    appendMessage("You", message, "user");
    input.value = "";

    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, user_id: "user_123" })
      });

      const data = await res.json();
      appendMessage("HomeOps", data.reply || "🤖 No reply received.", "agent");
    } catch (error) {
      appendMessage("Error", "Something went wrong talking to the assistant.", "agent");
      console.error("❌ Chat error:", error);
    }
  });

  function appendMessage(sender, text, type) {
    const msg = document.createElement("div");
    msg.className = `message ${type}`;
    msg.innerHTML = `<span class="sender">${sender}:</span> ${text}`;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
  }
});
