// Chat initialization is now handled by layout.js calling window.initializeChat
// This prevents race conditions with Firebase initialization

// Refactored chat.js to export initializeChat
window.initializeChat = function(auth, user) {
  console.log("💬 Initializing chat for user:", user.uid);
  const chatBox = document.getElementById("chat");
  const chatForm = document.getElementById("chatForm");
  const input = document.getElementById("input");
  if (!chatBox || !chatForm || !input) {
    console.error("💬 Chat elements not found", { chatBox, chatForm, input });
    return;
  }
  function addMessage(sender, message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;
    const senderDiv = document.createElement("div");
    senderDiv.className = "sender";
    senderDiv.textContent = sender === "agent" ? "HomeOps" : "You";
    const messageBubble = document.createElement("div");
    messageBubble.className = "message-bubble";
    messageBubble.textContent = message;
    messageDiv.appendChild(senderDiv);
    messageDiv.appendChild(messageBubble);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  // Add initial greeting
  addMessage("agent", "Hi. I'm your personal chief of staff. What can I help you with today?");
  // Handle form submission
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    // Add user message
    addMessage("user", message);
    input.value = "";
    // Show typing indicator
    const typingDiv = document.createElement("div");
    typingDiv.className = "typing-indicator";
    typingDiv.innerHTML = '<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDNDMTMuODY2IDMgMTcgNi4xMzQwMSAxNyAxMEMxNyAxMy44NjYgMTMuODY2IDE3IDEwIDE3QzYuMTM0MDEgMTcgMyAxMy44NjYgMyAxMEMzIDYuMTM0MDEgNi4xMzQwMSAzIDEwIDNaTTEwIDVjLTIuNzYxNDIgMC01IDIuMjM4NTgtNSA1czIuMjM4NTggNSA1IDVjMi43NjE0MiAwIDUtMi4yMzg1OCA1LTVTMTIuNzYxNCA1IDEwIDVaIiBmaWxsPSIjOTk5Ii8+CjxwYXRoIGQ9Ik04IDhDOC44Mjg0MyA4IDkuNSA4LjY3MTU3IDkuNSA5LjVDOS41IDEwLjMyODQgOC44Mjg0MyAxMSA4IDExQzcuMTcxNTcgMTEgNi41IDEwLjMyODQgNi41IDkuNUM2LjUgOC42NzE1NyA3LjE3MTU3IDggOCA4WiIgZmlsbD0iIzk5OSIvPgo8cGF0aCBkPSJNMTIgOEMxMi44Mjg0IDggMTMuNSA4LjY3MTU3IDEzLjUgOS41QzEzLjUgMTAuMzI4NCAxMi44Mjg0IDExIDEyIDExQzExLjE3MTYgMTEgMTAuNSAxMC4zMjg0IDEwLjUgOS41QzEwLjUgOC42NzE1NyAxMS4xNzE2IDggMTIgOFoiIGZpbGw9IiM5OTkiLz4KPC9zdmc+Cg==" alt="Typing" /><span>HomeOps is thinking...</span>';
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, user_id: user.uid })
      });
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      const data = await response.json();
      // Remove typing indicator
      chatBox.removeChild(typingDiv);
      // Add agent message (use data.reply, not data.response)
      if (data.reply && data.reply.trim()) {
        addMessage("agent", data.reply);
      } else {
        addMessage("agent", "Sorry, I didn't get a response. Please try again.");
      }
      
      // Inject events into calendar if present
      if (data.events && data.events.length > 0) {
        console.log("📅 Injecting events into calendar:", data.events);
        // Refresh the calendar to show the newly added events
        if (window.calendar) {
          console.log("📅 Refreshing calendar to show new events");
          window.calendar.refetchEvents();
        } else if (window.renderCalendar) {
          console.log("📅 Calendar not initialized, calling renderCalendar");
          window.renderCalendar();
        } else {
          console.warn("📅 renderCalendar function not available");
        }
      }
    } catch (error) {
      console.error("💬 Chat error:", error);
      // Remove typing indicator
      chatBox.removeChild(typingDiv);
      // Add error message
      addMessage("agent", "Sorry, I'm having trouble connecting right now. Please try again.");
    }
  });
};
