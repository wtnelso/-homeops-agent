// HomeOps Modern Chat UI - ChatGPT-Inspired
// Built with HomeOps Design System from Figma Mockup

window.initializeChat = function(auth, user, retryCount = 0) {
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
  
  // Clear and create fresh chat interface
  chatRoot.innerHTML = '';
  
  // Check if user has existing conversations
  const hasExistingChats = localStorage.getItem('homeops_chat_history') && 
                          JSON.parse(localStorage.getItem('homeops_chat_history')).length > 0;
  
  if (hasExistingChats) {
    renderExistingChat();
  } else {
    renderWelcomeScreen();
  }
  
  // Chat state management
  let messages = [];
  let isTyping = false;
  
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
  
  // Render welcome screen for first-time users
  function renderWelcomeScreen() {
    chatRoot.innerHTML = `
      <div class="chat-container">
        <div class="chat-header">
          <div class="brand-section">
            <div class="logo-container">
              <svg class="homeops-logo" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="12" fill="url(#gradient)"/>
                <path d="M12 16h24M12 24h24M12 32h16" stroke="white" stroke-width="2" stroke-linecap="round"/>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#667eea"/>
                    <stop offset="100%" style="stop-color:#764ba2"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 class="brand-title">HomeOps</h1>
          </div>
          <p class="brand-subtitle">I'm HomeOps — your Mental Load Operating System.</p>
        </div>
        
        <div class="welcome-content">
          <h2 class="welcome-title">Let's lighten your load.</h2>
          
          <div class="quick-start-grid">
            <button class="quick-start-card" onclick="sendQuickMessage('Remind me about something')">
              <div class="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <span>Remind me about something</span>
            </button>
            
            <button class="quick-start-card" onclick="sendQuickMessage('Check my calendar')">
              <div class="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
              </div>
              <span>Check my calendar</span>
            </button>
            
            <button class="quick-start-card" onclick="sendQuickMessage('Review recent emails')">
              <div class="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="5" width="18" height="14" rx="2"/>
                  <path d="M3 7l9 6 9-6"/>
                </svg>
              </div>
              <span>Review recent emails</span>
            </button>
            
            <button class="quick-start-card" onclick="sendQuickMessage('Help me unblock a problem')">
              <div class="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                </svg>
              </div>
              <span>Help me unblock a problem</span>
            </button>
          </div>
        </div>
        
        <div class="chat-input-container">
          <form class="chat-input-form" onsubmit="handleSubmit(event)">
            <div class="input-wrapper">
              <input 
                type="text" 
                class="chat-input" 
                placeholder="Ask HomeOps anything..."
                autocomplete="off"
              />
              <button type="submit" class="send-button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }
  
  // Render existing chat for returning users
  function renderExistingChat() {
    loadChatHistory();
    
    chatRoot.innerHTML = `
      <div class="chat-container">
        <div class="chat-header">
          <div class="brand-section">
            <div class="logo-container">
              <svg class="homeops-logo" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="12" fill="url(#gradient)"/>
                <path d="M12 16h24M12 24h24M12 32h16" stroke="white" stroke-width="2" stroke-linecap="round"/>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#667eea"/>
                    <stop offset="100%" style="stop-color:#764ba2"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 class="brand-title">HomeOps</h1>
          </div>
          <button class="new-chat-button" onclick="startNewChat()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Chat
          </button>
        </div>
        
        <div class="chat-messages" id="chatMessages">
          ${renderMessages()}
        </div>
        
        <div class="chat-input-container">
          <form class="chat-input-form" onsubmit="handleSubmit(event)">
            <div class="input-wrapper">
              <input 
                type="text" 
                class="chat-input" 
                placeholder="Ask HomeOps anything..."
                autocomplete="off"
              />
              <button type="submit" class="send-button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    scrollToBottom();
  }
  
  // Render all messages
  function renderMessages() {
    return messages.map(msg => `
      <div class="message-row ${msg.sender}">
        <div class="message-avatar">
          ${msg.sender === 'assistant' ? getAssistantAvatar() : getUserAvatar()}
        </div>
        <div class="message-bubble">
          <div class="message-content">${msg.content}</div>
          <div class="message-time">${formatTime(msg.timestamp)}</div>
        </div>
      </div>
    `).join('');
  }
  
  // Get assistant avatar
  function getAssistantAvatar() {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    `;
  }
  
  // Get user avatar
  function getUserAvatar() {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    `;
  }
  
  // Format timestamp
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Show typing indicator
  function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message-row assistant typing';
    typingDiv.innerHTML = `
      <div class="message-avatar">
        ${getAssistantAvatar()}
      </div>
      <div class="message-bubble typing">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
    return typingDiv;
  }
  
  // Remove typing indicator
  function removeTypingIndicator(typingDiv) {
    if (typingDiv && typingDiv.parentNode) {
      typingDiv.parentNode.removeChild(typingDiv);
    }
  }
  
  // Add message to chat
  function addMessage(sender, content) {
    const message = {
      sender,
      content,
      timestamp: new Date().toISOString()
    };
    
    messages.push(message);
    saveChatHistory();
    
    // If we're in existing chat mode, update the messages
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message-row ' + sender;
      messageDiv.innerHTML = `
        <div class="message-avatar">
          ${sender === 'assistant' ? getAssistantAvatar() : getUserAvatar()}
        </div>
        <div class="message-bubble">
          <div class="message-content">${content}</div>
          <div class="message-time">${formatTime(message.timestamp)}</div>
        </div>
      `;
      
      messagesContainer.appendChild(messageDiv);
      scrollToBottom();
    }
  }
  
  // Scroll to bottom of chat
  function scrollToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    }
  }
  
  // Handle form submission
  window.handleSubmit = function(event) {
    event.preventDefault();
    const input = event.target.querySelector('.chat-input');
    const message = input.value.trim();
    
    if (!message || isTyping) return;
    
    // Clear input
    input.value = '';
    
    // Add user message
    addMessage('user', message);
    
    // Show typing indicator
    const typingDiv = showTypingIndicator();
    isTyping = true;
    
    // Simulate assistant response
    setTimeout(() => {
      removeTypingIndicator(typingDiv);
      isTyping = false;
      
      const response = getAssistantResponse(message);
      addMessage('assistant', response);
    }, 1500);
  };
  
  // Handle quick start button clicks
  window.sendQuickMessage = function(message) {
    // Switch to chat mode if we're in welcome mode
    if (!document.getElementById('chatMessages')) {
      renderExistingChat();
    }
    
    // Add user message
    addMessage('user', message);
    
    // Show typing indicator
    const typingDiv = showTypingIndicator();
    isTyping = true;
    
    // Simulate assistant response
    setTimeout(() => {
      removeTypingIndicator(typingDiv);
      isTyping = false;
      
      const response = getAssistantResponse(message);
      addMessage('assistant', response);
    }, 1500);
  };
  
  // Start new chat
  window.startNewChat = function() {
    messages = [];
    saveChatHistory();
    renderWelcomeScreen();
  };
  
  // Get assistant response (simulated for now)
  function getAssistantResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('calendar')) {
      return "Here's what's on your calendar today:\n\n• 2:00 PM - Team meeting\n• 4:30 PM - Doctor appointment\n• 7:00 PM - Kids' soccer practice\n\nWould you like me to help you schedule something else or reschedule any of these?";
    }
    
    if (lowerMessage.includes('remind')) {
      return "I'd be happy to set a reminder for you! What would you like me to remind you about, and when? For example:\n\n• \"Remind me to call the dentist tomorrow at 2pm\"\n• \"Remind me to pick up groceries on Friday\"\n• \"Remind me about the school meeting next week\"";
    }
    
    if (lowerMessage.includes('email')) {
      return "I found 3 new emails that need your attention:\n\n📧 **Urgent**: School permission slip due tomorrow\n📧 **Schedule**: Dentist appointment confirmation\n📧 **Family**: Soccer team photo order\n\nWould you like me to summarize any of these in detail or help you respond to them?";
    }
    
    if (lowerMessage.includes('unblock') || lowerMessage.includes('problem')) {
      return "I'm here to help you get unstuck! Tell me more about what's blocking you. Are you:\n\n• Feeling overwhelmed with too many tasks?\n• Stuck on a decision?\n• Having trouble prioritizing?\n• Dealing with a conflict or difficult situation?\n\nI can help break it down and find a path forward.";
    }
    
    // Default responses
    const responses = [
      "I'm here to help lighten your mental load! What's on your mind today?",
      "That's a great question. Let me help you with that.",
      "I can definitely assist with that. Tell me more about what you need.",
      "Perfect! I'm designed to help with exactly these kinds of things."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Initialize the appropriate view
  if (hasExistingChats) {
    renderExistingChat();
  } else {
    renderWelcomeScreen();
  }
};
