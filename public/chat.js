function appendMessage(sender, text, type) {
  const chatBox = document.getElementById("chat-box");
  if (!chatBox) return;

  const msg = document.createElement("div");
  msg.className = `${type} message`;
  msg.innerHTML = `<span class="sender">${sender}:</span> ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showWelcomeMessage() {
  const alreadyExists = document.querySelector(".agent.message.intro");
  if (alreadyExists) return;

  appendMessage(
    "HomeOps",
    `Hi. I'm HomeOps, your personal chief of staff. I specialize in mental clutter, invisible labor, and things you didn’t ask to be responsible for. What’s on deck?`,
    "agent"
  );

  document.querySelector(".agent.message:last-child").classList.add("intro");
}

document.addEventListener("DOMContentLoaded", () => {
  const chatButton = document.querySelector('[data-view="chat"]');
  if (chatButton) {
    chatButton.addEventListener("click", () => {
      setTimeout(() => {
        showWelcomeMessage();
      }, 150);
    });
  }

  const chatView = document.getElementById("view-chat");
  if (chatView && chatView.classList.contains("active")) {
    showWelcomeMessage();
  }
});

document.getElementById("chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const input = document.getElementById("user-input");
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
    appendMessage("Error", "Something went wrong.", "agent");
    console.error("❌ Chat error:", error);
  }
});
