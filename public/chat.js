document.getElementById("chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const message = input.value.trim();
  if (!message) return;

  const userMsg = document.createElement("div");
  userMsg.className = "user message";
  userMsg.innerHTML = `<span class="sender">You:</span> ${message}`;
  chatBox.appendChild(userMsg);
  input.value = "";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, user_id: "user_123" })
    });

    const data = await res.json();
    const reply = data.reply || "🤖 No reply received.";

    const botMsg = document.createElement("div");
    botMsg.className = "agent message";
    botMsg.innerHTML = `<span class="sender">HomeOps:</span> ${reply}`;
    chatBox.appendChild(botMsg);
  } catch (error) {
    const errorMsg = document.createElement("div");
    errorMsg.className = "agent message";
    errorMsg.innerHTML = `<span class="sender">Error:</span> Something went wrong.`;
    chatBox.appendChild(errorMsg);
    console.error("❌ Chat error:", error);
  }

  chatBox.scrollTop = chatBox.scrollHeight;
});