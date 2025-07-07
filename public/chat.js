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
    <div class="conversation-container">
      <div class="chat-messages" id="chatMessages"></div>
      <div class="chat-input-container">
        <form class="chat-input-form" onsubmit="return false;">
          <textarea class="chat-input" placeholder="Ask HomeOps anything..." autocomplete="off" maxlength="1000" rows="1" style="resize: none;"></textarea>
          <span class="char-count" id="charCount">0/1000</span>
          <button type="submit" class="send-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
      <button class="scroll-to-bottom" id="scrollToBottomBtn">↓ Scroll to bottom</button>
    </div>
  `;

  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.querySelector('.chat-input');
  const chatForm = document.querySelector('.chat-input-form');
  const newChatBtn = document.getElementById('newChatBtn');
  const charCount = document.getElementById('charCount');
  const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');

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
  
  // Draft saving
  chatInput.value = localStorage.getItem('homeops_chat_draft') || '';
  chatInput.addEventListener('input', () => {
    charCount.textContent = `${chatInput.value.length}/1000`;
    localStorage.setItem('homeops_chat_draft', chatInput.value);
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 72) + 'px';
  });

  // Scroll-to-bottom CTA
  function checkScrollToBottom() {
    if (chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight > 80) {
      scrollToBottomBtn.classList.add('visible');
    } else {
      scrollToBottomBtn.classList.remove('visible');
    }
  }
  chatMessages.addEventListener('scroll', checkScrollToBottom);
  scrollToBottomBtn.addEventListener('click', () => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  // Markdown rendering (basic)
  function renderMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>')
      .replace(/\- (.*?)(?=\n|$)/g, '<li>$1</li>')
      .replace(/<li>(.*?)<\/li>/g, '<ul><li>$1</li></ul>');
  }

  // Render all messages with grouping and animation
  function renderMessages() {
    chatMessages.innerHTML = '';
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
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = renderMarkdown(msg.text);
        row.appendChild(bubble);
      } else {
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = msg.text;
        row.appendChild(bubble);
      }
      group.appendChild(row);
      // Timestamp below, faded
      const ts = document.createElement('div');
      ts.className = 'message-timestamp';
      ts.textContent = msg.time;
      group.appendChild(ts);
      chatMessages.appendChild(group);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
    checkScrollToBottom();
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
  
  // Replace getAgentReply with real backend call and direct calendar injection
  async function getAgentReply(userText) {
    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          user_id: user && user.uid ? user.uid : 'test_user',
          context: {} // Add more context if needed (tone, calendar, etc)
        })
      });
      if (!res.ok) throw new Error('Agent API error');
      const data = await res.json();
      // If events are present, add the first event directly to the calendar
      if (data.events && Array.isArray(data.events) && data.events.length > 0) {
        const event = data.events[0];
        // Prepare event data for API
        const eventData = {
          user_id: user && user.uid ? user.uid : 'test_user',
          title: event.title || '',
          start: event.start || '',
          allDay: !!event.allDay,
          location: event.location || '',
          description: event.description || ''
        };
        // Add end time if available
        if (event.end) eventData.end = event.end;
        // POST to /api/add-event
        fetch('/api/add-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            showToast('Event added to your calendar!');
            // Refresh calendar if open
            if (window.calendar && typeof window.calendar.refetchEvents === 'function') {
              window.calendar.refetchEvents();
            }
          } else if (result.duplicate) {
            showToast('Event already exists in your calendar!');
          } else {
            showToast('Failed to add event to calendar');
          }
        })
        .catch(() => showToast('Error adding event to calendar'));
      }
      return data.reply || data.message || JSON.stringify(data);
    } catch (err) {
      console.error('Agent error:', err);
      return "Sorry, I'm having trouble connecting to HomeOps right now.";
    }
  }
  
  // Simple toast/snackbar
  function showToast(msg) {
    let toast = document.getElementById('homeops-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'homeops-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '32px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.background = 'linear-gradient(90deg,#7E5EFF,#B8A3FF)';
      toast.style.color = '#fff';
      toast.style.padding = '14px 32px';
      toast.style.borderRadius = '999px';
      toast.style.fontSize = '16px';
      toast.style.fontWeight = '600';
      toast.style.boxShadow = '0 4px 24px rgba(126,94,255,0.13)';
      toast.style.zIndex = '9999';
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2600);
  }
  
  // Handle form submit
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    addMessage('user', text);
    chatInput.value = '';
    charCount.textContent = '0/1000';
    localStorage.removeItem('homeops_chat_draft');
    // Typing indicator
    const typing = showTyping();
    try {
      const reply = await getAgentReply(text);
      removeTyping(typing);
      addMessage('agent', reply);
    } catch (err) {
      removeTyping(typing);
      addMessage('agent', "Sorry, I'm having trouble connecting to HomeOps right now.");
    }
  });
  
  // Handle new chat
  newChatBtn.addEventListener('click', () => {
    messages = [];
    saveChatHistory();
    renderWelcome();
  });
  
  // Render welcome/onboarding state
  function renderWelcome() {
    chatMessages.innerHTML = '';
    // Container for onboarding
    const container = document.createElement('div');
    container.className = 'onboarding-welcome-container';
    // Logo avatar
    const avatar = document.createElement('div');
    avatar.className = 'onboarding-logo-avatar';
    avatar.innerHTML = `<img src="img/homeops-logo.svg" alt="HomeOps" />`;
    container.appendChild(avatar);
    // Greeting with typewriter effect
    const greeting = document.createElement('div');
    greeting.className = 'onboarding-greeting';
    greeting.textContent = '';
    container.appendChild(greeting);
    // Typewriter effect for greeting
    const greetingText = "👋 Hi, I'm HomeOps — your Mental Load Operating System. Let's clear your head.";
    let i = 0;
    function typeWriter() {
      if (i < greetingText.length) {
        greeting.textContent += greetingText.charAt(i);
        i++;
        setTimeout(typeWriter, 18);
      }
    }
    typeWriter();
    // Suggestion chips (inline, not buttons)
    const suggestions = [
      { text: "🧠 What's on my calendar today?" },
      { text: "Remind me to buy diapers 🍼" },
      { text: "Help me unblock a problem" },
      { text: "📩 Review recent emails" }
    ];
    const chipsRow = document.createElement('div');
    chipsRow.className = 'onboarding-chips-row';
    suggestions.forEach((s, idx) => {
      const chip = document.createElement('span');
      chip.className = 'suggestion-chip';
      chip.textContent = s.text;
      chip.style.opacity = '0';
      chip.style.transform = 'translateY(12px)';
      setTimeout(() => {
        chip.style.transition = 'opacity 0.4s, transform 0.4s';
        chip.style.opacity = '1';
        chip.style.transform = 'translateY(0)';
      }, 400 + idx * 200);
      chip.addEventListener('click', () => {
        chatInput.value = s.text;
        chatInput.focus();
        charCount.textContent = `${chatInput.value.length}/1000`;
      });
      chipsRow.appendChild(chip);
    });
    container.appendChild(chipsRow);
    chatMessages.appendChild(container);
    chatMessages.scrollTop = 0;
  }
  
  // Initialize the appropriate view
  loadChatHistory();
  if (messages.length === 0) {
    renderWelcome();
  } else {
    renderMessages();
  }
};
