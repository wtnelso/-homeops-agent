console.log("✅ chat.js is executing");

function waitForChatBoxAndShowWelcome() {
  const chatBox = document.getElementById("chat-box");
  const chatView = document.getElementById("view-chat");

  // Wait until both are available and visible
  if (chatBox && chatView && chatView.classList.contains("active")) {
    const alreadyExists = document.querySelector(".agent.message.intro");
    if (!alreadyExists) {
      const intro = document.createElement("div");
      intro.className = "agent message intro";
      intro.innerHTML = `<span class="sender">HomeOps:</span> Hi. I'm HomeOps, your personal chief of staff. I specialize in mental clutter, invisible labor, and things you didn’t ask to be responsible for. What’s on deck?`;
      chatBox.appendChild(intro);
    }
    return true;
  }
  return false;
}

document.addEventListener("DOMContentLoaded", () => {
  const tryWelcome = setInterval(() => {
    if (waitForChatBoxAndShowWelcome()) {
      clearInterval(tryWelcome);
    }
  }, 100);
});

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
