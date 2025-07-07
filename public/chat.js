// Chat initialization is now handled by layout.js calling window.initializeChat
// This prevents race conditions with Firebase initialization

// Refactored chat.js to export initializeChat
window.initializeChat = function(auth, user, retryCount = 0) {
  const chatRoot = document.getElementById("chat-root");
  if (!chatRoot) return;
  chatRoot.innerHTML = '';

  // Wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'homeops-chat-wrapper';
  chatRoot.appendChild(wrapper);

  // Branding (Notion-style, subtle)
  const branding = document.createElement('div');
  branding.className = 'homeops-branding';
  let logoImg = document.createElement('img');
  logoImg.src = 'img/homeops-logo.svg';
  logoImg.className = 'homeops-logo';
  logoImg.alt = 'HomeOps logo';
  logoImg.onerror = function() {
    logoImg.replaceWith(Object.assign(document.createElement('span'), {className: 'homeops-wordmark', textContent: 'HomeOps'}));
  };
  branding.appendChild(logoImg);
  const wordmark = document.createElement('span');
  wordmark.className = 'homeops-wordmark';
  wordmark.textContent = 'HomeOps';
  branding.appendChild(wordmark);
  wrapper.appendChild(branding);

  // Chat area
  const chatArea = document.createElement('div');
  chatArea.className = 'homeops-chat-area';
  wrapper.appendChild(chatArea);

  // Input form
  const chatForm = document.createElement('form');
  chatForm.className = 'homeops-chat-form';
  chatForm.id = 'chatForm';
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'input';
  input.placeholder = 'Ask HomeOps anything...';
  chatForm.appendChild(input);
  const sendBtn = document.createElement('button');
  sendBtn.type = 'submit';
  sendBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
  chatForm.appendChild(sendBtn);
  wrapper.appendChild(chatForm);

  // Message state
  let messages = [
    { sender: 'agent', text: "Hi, I'm HomeOps. How can I help you today?", time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
  ];
  let quickReplies = [
    { text: 'Remind me' },
    { text: 'Check calendar' },
    { text: 'Emails' },
    { text: 'Unblock a problem' }
  ];

  // Render chat area
  function renderChat() {
    chatArea.innerHTML = '';
    messages.forEach((msg, idx) => {
      const row = document.createElement('div');
      row.className = 'message-row ' + msg.sender;
      // Bubble
      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      bubble.textContent = msg.text;
      row.appendChild(bubble);
      // Timestamp
      const ts = document.createElement('div');
      ts.className = 'message-timestamp';
      ts.textContent = msg.time;
      row.appendChild(ts);
      chatArea.appendChild(row);
      // After the first agent message, show quick replies
      if (idx === 0 && quickReplies.length > 0) {
        const qr = document.createElement('div');
        qr.className = 'quick-replies';
        quickReplies.forEach(q => {
          const chip = document.createElement('div');
          chip.className = 'quick-reply';
          chip.textContent = q.text;
          chip.onclick = () => {
            sendMessage(q.text);
          };
          qr.appendChild(chip);
        });
        chatArea.appendChild(qr);
      }
    });
  }

  // Typing indicator
  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'typing-indicator-dot';
      typing.appendChild(dot);
    }
    chatArea.appendChild(typing);
    chatArea.scrollTop = chatArea.scrollHeight;
    return typing;
  }
  function removeTyping(typing) {
    if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
  }

  // Send message
  function sendMessage(text) {
    if (!text.trim()) return;
    const now = new Date();
    messages.push({ sender: 'user', text, time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
    renderChat();
    chatArea.scrollTop = chatArea.scrollHeight;
    input.value = '';
    // Remove quick replies after first user message
    quickReplies = [];
    // Typing indicator
    const typing = showTyping();
    setTimeout(() => {
      removeTyping(typing);
      // Simulate agent reply
      const reply = getAgentReply(text);
      messages.push({ sender: 'agent', text: reply, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
      renderChat();
      chatArea.scrollTop = chatArea.scrollHeight;
    }, 1200);
  }

  // Simulate agent reply
  function getAgentReply(userText) {
    // TODO: Replace with real backend call
    if (userText.toLowerCase().includes('calendar')) return "Here's what's on your calendar: Meeting at 2pm, Doctor at 4pm.";
    if (userText.toLowerCase().includes('remind')) return "Sure! What should I remind you about?";
    if (userText.toLowerCase().includes('email')) return "You have 3 new emails. Want a summary?";
    if (userText.toLowerCase().includes('unblock')) return "Tell me what's blocking you and I'll help you get unstuck.";
    return "I'm here to help!";
  }

  // Form submit
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage(input.value);
  });

  // Scroll chat area to bottom on input focus (prevents overlap with autocomplete)
  input.addEventListener('focus', () => {
    setTimeout(() => { chatArea.scrollTop = chatArea.scrollHeight; }, 100);
  });

  // Initial render
  renderChat();
};
