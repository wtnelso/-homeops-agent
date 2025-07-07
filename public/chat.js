// Chat initialization is now handled by layout.js calling window.initializeChat
// This prevents race conditions with Firebase initialization

// Refactored chat.js to export initializeChat
window.initializeChat = function(auth, user, retryCount = 0) {
  console.log("💬 Initializing chat for user:", user ? user.uid : "test_user");
  
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
  chatRoot.innerHTML = '';

  // Wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'homeops-chat-wrapper';
  chatRoot.appendChild(wrapper);

  // Branding (horizontal, fallback to wordmark if SVG missing)
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
  // Brand name (wordmark)
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
    { icon: '<svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" fill="#B8A3FF" viewBox="0 0 24 24" stroke="#A78BFA" stroke-width="2"><rect x="3" y="11" width="18" height="7" rx="2"/><rect x="7" y="7" width="10" height="4" rx="2"/></svg>', text: 'Remind me' },
    { icon: '<svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" fill="#B8A3FF" viewBox="0 0 24 24" stroke="#A78BFA" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>', text: 'Check calendar' },
    { icon: '<svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" fill="#B8A3FF" viewBox="0 0 24 24" stroke="#A78BFA" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>', text: 'Emails' },
    { icon: '<svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" fill="#B8A3FF" viewBox="0 0 24 24" stroke="#A78BFA" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>', text: 'Unblock a problem' }
  ];

  // Render chat area
  function renderChat() {
    chatArea.innerHTML = '';
    messages.forEach((msg, idx) => {
      const row = document.createElement('div');
      row.className = 'message-row ' + msg.sender;
      // Avatar
      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      avatar.innerHTML = msg.sender === 'agent' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5V21h6v-5h6v5h6V9.5L12 3z"/><path d="M9 21V12h6v9"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7E5EFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>';
      row.appendChild(avatar);
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
          chip.innerHTML = `${q.icon}<span>${q.text}</span>`;
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
