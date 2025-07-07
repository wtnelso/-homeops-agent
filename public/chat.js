// HomeOps Modern Chat UI - ChatGPT-Inspired
// Built with HomeOps Design System from Figma Mockup

window.initializeChat = function(auth, user, retryCount = 0) {
  let messages = [];
  let isTyping = false;

  console.log("💬 Initializing modern HomeOps chat for user:", user ? user.uid : "test_user");
  
  const chatRoot = document.getElementById("chat-root");
  if (!chatRoot) {
    if (retryCount < 10) {
      console.log(`💬 chat-root element not found, retrying in 100ms... (attempt ${retryCount + 1}/10)`);
      setTimeout(() => window.initializeChat(auth, user, retryCount + 1), 100);
    } else {
      console.error("💬 chat-root element not found after 10 retries, giving up");
    }
    return;
  }
  
  // Render header
  chatRoot.innerHTML = `
    <div class="homeops-header">
      <div class="homeops-header-left">
        <img src="img/homeops-logo.svg" class="homeops-logo" alt="HomeOps logo" />
        <span class="homeops-title">HomeOps</span>
      </div>
      <button class="new-chat-btn" id="newChatBtn">New Chat</button>
    </div>
    <div class="chat-area">
      <div class="chat-messages" id="chatMessages"></div>
      <div class="chat-input-container">
        <form class="chat-input-form" onsubmit="return false;">
          <input type="text" class="chat-input" placeholder="Ask HomeOps anything..." autocomplete="off" />
          <button type="submit" class="send-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    </div>
  `;

  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.querySelector('.chat-input');
  const chatForm = document.querySelector('.chat-input-form');
  const newChatBtn = document.getElementById('newChatBtn');

  // Smart chip suggestions for first-time users
  const suggestions = [
    "Remind me about something",
    "Check my calendar",
    "Review recent emails",
    "Help me unblock a problem"
  ];

  // Load existing messages
  function loadChatHistory() {
    const saved = localStorage.getItem('homeops_chat_history');
    if (saved) {
      messages = JSON.parse(saved);
    }
  }
  
  // Save messages to localStorage
  function saveChatHistory() {
    localStorage.setItem('homeops_chat_history', JSON.stringify(messages));
  }
  
  // Render all messages with grouping and rhythm
  function renderMessages() {
    chatMessages.innerHTML = '';
    let lastSender = null;
    messages.forEach((msg, idx) => {
      const group = document.createElement('div');
      group.className = 'message-group';
      const row = document.createElement('div');
      row.className = 'message-row ' + msg.sender;
      if (msg.sender === 'agent') {
        const avatar = document.createElement('span');
        avatar.className = 'agent-avatar';
        avatar.innerHTML = "<img src='img/homeops-logo.svg' alt='HomeOps' />";
        row.appendChild(avatar);
      }
      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      bubble.textContent = msg.text;
      row.appendChild(bubble);
      if (msg.sender === 'user') {
        row.appendChild(document.createElement('span')); // spacing for alignment
      }
      const ts = document.createElement('div');
      ts.className = 'message-timestamp';
      ts.textContent = msg.time;
      row.appendChild(ts);
      group.appendChild(row);
      chatMessages.appendChild(group);
      lastSender = msg.sender;
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Typing indicator
  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'typing-dot';
      typing.appendChild(dot);
    }
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typing;
  }
  function removeTyping(typing) {
    if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
  }
  
  // Add a message
  function addMessage(sender, text) {
    const now = new Date();
    messages.push({ sender, text, time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
    saveChatHistory();
    renderMessages();
  }
  
  // Handle form submit
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    addMessage('user', text);
    chatInput.value = '';
    // Typing indicator
    const typing = showTyping();
    setTimeout(() => {
      removeTyping(typing);
      addMessage('agent', getAgentReply(text));
    }, 1000);
  });
  
  // Handle new chat
  newChatBtn.addEventListener('click', () => {
    messages = [];
    saveChatHistory();
    renderWelcome();
  });
  
  // Render smart chip suggestions and greeting for first-time users
  function renderWelcome() {
    chatMessages.innerHTML = '';
    // Greeting
    const group = document.createElement('div');
    group.className = 'message-group';
    const row = document.createElement('div');
    row.className = 'message-row agent';
    const avatar = document.createElement('span');
    avatar.className = 'agent-avatar';
    avatar.innerHTML = "<img src='img/homeops-logo.svg' alt='HomeOps' />";
    row.appendChild(avatar);
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = "Hi, I'm HomeOps — your Mental Load Operating System. Let's lighten your load.";
    row.appendChild(bubble);
    group.appendChild(row);
    chatMessages.appendChild(group);
    // Suggestion chips
    const chips = document.createElement('div');
    chips.className = 'suggestion-chips';
    suggestions.forEach(s => {
      const chip = document.createElement('button');
      chip.className = 'suggestion-chip';
      chip.textContent = s;
      chip.onclick = () => {
        addMessage('user', s);
        // Typing indicator
        const typing = showTyping();
        setTimeout(() => {
          removeTyping(typing);
          addMessage('agent', getAgentReply(s));
        }, 1000);
      };
      chips.appendChild(chip);
    });
    chatMessages.appendChild(chips);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Simulate agent reply (replace with real backend call)
  function getAgentReply(userText) {
    if (userText.toLowerCase().includes('calendar')) return "Here's what's on your calendar: Meeting at 2pm, Doctor at 4pm.";
    if (userText.toLowerCase().includes('remind')) return "Sure! What should I remind you about?";
    if (userText.toLowerCase().includes('email')) return "You have 3 new emails. Want a summary?";
    if (userText.toLowerCase().includes('unblock')) return "Tell me what's blocking you and I'll help you get unstuck.";
    return "I'm here to help!";
  }
  
  // Initialize the appropriate view
  loadChatHistory();
  if (messages.length === 0) {
    renderWelcome();
  } else {
    renderMessages();
  }
};
