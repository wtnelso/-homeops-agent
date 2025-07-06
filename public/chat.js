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

  // Subtitle
  const subtitle = document.createElement('div');
  subtitle.className = 'homeops-subtitle';
  subtitle.textContent = 'Your intelligent family concierge';
  wrapper.appendChild(subtitle);

  // Main prompt (random warm phrase)
  const prompts = [
    "What's on your mind today?",
    "What can I take off your plate?",
    "Let's lighten your load."
  ];
  const prompt = document.createElement('div');
  prompt.className = 'homeops-chat-prompt';
  prompt.textContent = prompts[Math.floor(Math.random() * prompts.length)];
  wrapper.appendChild(prompt);

  // Suggestions (pill-style chips, lavender icons)
  const suggestions = [
    { icon: '<svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" fill="#B8A3FF" viewBox="0 0 24 24" stroke="#A78BFA" stroke-width="2"><rect x="3" y="11" width="18" height="7" rx="2"/><rect x="7" y="7" width="10" height="4" rx="2"/></svg>', text: 'Remind me about something' },
    { icon: '<svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" fill="#B8A3FF" viewBox="0 0 24 24" stroke="#A78BFA" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>', text: 'Check my calendar' },
    { icon: '<svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" fill="#B8A3FF" viewBox="0 0 24 24" stroke="#A78BFA" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>', text: 'Review recent emails' },
    { icon: '<svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" fill="#B8A3FF" viewBox="0 0 24 24" stroke="#A78BFA" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>', text: 'Help me unblock a problem' }
  ];
  const suggestionList = document.createElement('div');
  suggestionList.className = 'suggestion-list';
  suggestions.forEach(s => {
    const chip = document.createElement('div');
    chip.className = 'suggestion-chip';
    chip.innerHTML = `${s.icon}<span>${s.text}</span>`;
    chip.onclick = () => {
      sendMessage(s.text);
    };
    suggestionList.appendChild(chip);
  });
  wrapper.appendChild(suggestionList);

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
  sendBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
  chatForm.appendChild(sendBtn);
  wrapper.appendChild(chatForm);

  // Message state
  let messages = [];

  // Render chat area
  function renderChat() {
    chatArea.innerHTML = '';
    messages.forEach(msg => {
      const row = document.createElement('div');
      row.className = 'message-row ' + msg.sender;
      // Avatar
      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      avatar.innerHTML = msg.sender === 'agent' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5V21h6v-5h6v5h6V9.5L12 3z"/><path d="M9 21V12h6v9"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7E5EFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>';
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

  // Helper function to convert natural language dates to ISO format
  function parseNaturalDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
      console.warn("📅 parseNaturalDate called with invalid input:", dateString);
      return '';
    }
    console.log("📅 Parsing date:", dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Handle "Tomorrow at Xpm" format
    if (dateString.toLowerCase().includes('tomorrow')) {
      const timeMatch = dateString.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const period = timeMatch[3].toLowerCase();
        
        if (period === 'pm' && hours !== 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        
        tomorrow.setHours(hours, minutes, 0, 0);
        const iso = tomorrow.toISOString();
        console.log("📅 Parsed ISO date:", iso);
        return iso;
      }
    }
    
    // Handle "Today at Xpm" format
    if (dateString.toLowerCase().includes('today')) {
      const timeMatch = dateString.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const period = timeMatch[3].toLowerCase();
        
        if (period === 'pm' && hours !== 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        
        now.setHours(hours, minutes, 0, 0);
        const result = now.toISOString();
        console.log("📅 Parsed today date:", result);
        return result;
      }
    }
    
    // If we can't parse it, return the original string
    console.warn("📅 Could not parse date:", dateString);
    return '';
  }
  
  // --- World-Class HomeOps Chat UI Fixes ---

  const assistantIntros = [
    "👋 Hi there — I'm HomeOps, your intelligent family concierge. What's top of mind today?",
    "Welcome! I'm HomeOps — here to lighten your mental load. How can I help?",
    "Let's make life feel lighter. What do you need cleared off your plate?",
    "Inbox chaos? Calendar overload? I've got it."
  ];
  const userHasKids = false; // TODO: Replace with real user context
  const parentIntro = "Juggling school drop-offs and birthday invites? I got you.";
  const workIntro = "Work stress or errands piling up? I can handle the admin.";
  function getPersonalizedIntro() {
    const base = assistantIntros[Math.floor(Math.random() * assistantIntros.length)];
    const context = userHasKids ? parentIntro : workIntro;
    return `${base}\n${context}`;
  }

  function getAgentAvatar(pulse) {
    return `<span class=\"agent-avatar${pulse ? ' pulse' : ''}\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"26\" height=\"26\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#7E5EFF\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 9.5V21h6v-5h6v5h6V9.5L12 3z\"/><path d=\"M9 21V12h6v9\"/></svg></span>`;
  }
  function getSendButtonIcon() {
    return `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"26\" height=\"26\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#7E5EFF\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"22\" y1=\"2\" x2=\"11\" y2=\"13\"/><polygon points=\"22 2 15 22 11 13 2 9 22 2\"/></svg>`;
  }

  function showTypingIndicator() {
    const chatBox = document.getElementById("chat");
    const typing = document.createElement("div");
    typing.className = "typing-indicator";
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("div");
      dot.className = "typing-indicator-dot";
      typing.appendChild(dot);
    }
    chatBox.appendChild(typing);
    chatBox.scrollTop = chatBox.scrollHeight;
    return typing;
  }
  function removeTypingIndicator(typing) {
    if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
  }

  function addMessage(sender, message, opts = {}) {
    const chatBox = document.getElementById("chat");
    const messageRow = document.createElement("div");
    messageRow.className = `message ${sender}`;
    // Avatar
    if (sender === "agent") {
      messageRow.innerHTML += getAgentAvatar(true);
    } else {
      messageRow.innerHTML += '<span class="agent-avatar" style="background:transparent;"></span>';
    }
    // Bubble
    const bubble = document.createElement("div");
    bubble.className = `message-bubble${sender === "agent" ? " agent" : ""}`;
    bubble.textContent = message;
    messageRow.appendChild(bubble);
    // Quick-start chips (only for first agent message)
    if (sender === "agent" && opts.quickStart) {
      const chipsContainer = document.createElement("div");
      chipsContainer.className = "quick-start-chips";
      opts.quickStart.forEach((chip, i) => {
        const chipElement = document.createElement("button");
        chipElement.className = "quick-start-chip";
        chipElement.type = "button";
        chipElement.textContent = chip;
        chipElement.style.opacity = 0;
        chipElement.style.transform = 'translateY(32px)';
        chipElement.onclick = () => sendMessage(chip);
        chipsContainer.appendChild(chipElement);
        setTimeout(() => {
          chipElement.classList.add('animated');
        }, 500 + i * 140);
      });
      messageRow.appendChild(chipsContainer);
    }
    chatBox.appendChild(messageRow);
    chatBox.scrollTop = chatBox.scrollHeight;
    checkScrollButton();
  }

  // Show typing indicator, then welcome message and chips
  setTimeout(() => {
    const typing = showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator(typing);
      addMessage("agent", getPersonalizedIntro(), {
        quickStart: [
          "Remind me about something",
          "🗓️ Check my calendar",
          "📩 Review recent emails",
          "🧠 Help me unblock a problem"
        ],
        isFirst: true
      });
    }, 1100);
  }, 250);

  // Scroll-to-bottom button logic (show only if overflow)
  function checkScrollButton() {
    let btn = document.querySelector('.scroll-to-bottom');
    if (chatBox.scrollHeight > chatBox.clientHeight + 40) {
      if (!btn) {
        btn = document.createElement('button');
        btn.className = 'scroll-to-bottom';
        btn.onclick = () => {
          chatBox.scrollTop = chatBox.scrollHeight;
        };
        chatRoot.appendChild(btn);
      }
      btn.classList.add('visible');
    } else if (btn) {
      btn.classList.remove('visible');
    }
  }

  // Listen for scroll events
  chatBox.addEventListener('scroll', checkScrollButton);

  // Handle form submission
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    
    // Add user message
    addMessage("user", message);
    input.value = "";
    
    // Show typing indicator
    const typing = showTypingIndicator();
    
    try {
      // Use the user ID from window.userId (set by Firebase auth) or fallback to test_user
      const userId = window.userId || (user ? user.uid : "test_user");
      
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, user_id: userId })
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Remove typing indicator
      removeTypingIndicator(typing);
      
      // Add agent message (use data.reply, not data.response)
      if (data.reply && data.reply.trim()) {
        addMessage("agent", data.reply);
      } else {
        addMessage("agent", "Sorry, I didn't get a response. Please try again.");
      }
      
      // Inject events into calendar if present (moved outside try-catch)
      console.log("📅 Checking for events in response:", data);
      if (data.events && data.events.length > 0) {
        console.log("📅 Chat returned events:", data.events);
        console.log("📅 Events array length:", data.events.length);
        
        // For each event, POST to backend
        data.events.forEach((event, index) => {
          console.log(`📅 Processing event ${index + 1}:`, event);
          console.log(`📅 Event keys:`, Object.keys(event));
          console.log(`📅 Event when field:`, event.when);
          console.log(`📅 Event start field:`, event.start);
          console.log(`📅 Event title field:`, event.title);
          console.log(`📅 Event allDay field:`, event.allDay);
          console.log(`📅 All event fields:`, JSON.stringify(event, null, 2));
          
          // Check if event already exists in calendar by content (title and start time)
          // Since AI-generated IDs are not real database IDs, we check by content instead
          if (event.title && event.start) {
            console.log(`📅 Checking for duplicate event with title: "${event.title}" and start: "${event.start}"`);
            
            // Get all events from the calendar
            const allEvents = window.calendar.getEvents();
            const duplicateEvent = allEvents.find(existingEvent => {
              return existingEvent.title === event.title && 
                     existingEvent.start.toISOString() === event.start;
            });
            
            if (duplicateEvent) {
              console.log(`📅 Duplicate event found with ID: ${duplicateEvent.id} - skipping creation`);
              addMessage("agent", `✅ Event "${event.title}" already exists in your calendar.`);
              return; // Skip this event
            } else {
              console.log(`📅 No duplicate found - will create new event`);
            }
          }
          
          // Parse the date if it's in natural language format
          let startDate = event.start;
          if (event.when && !event.start) {
            startDate = parseNaturalDate(event.when);
          }
          
          // Prepare event data for backend
          const eventData = {
            user_id: userId,
            title: event.title,
            start: startDate,
            allDay: event.allDay || false
          };
          
          console.log(`📅 Sending event to backend:`, eventData);
          
          // Send to backend
          fetch('/api/add-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
          })
          .then(response => {
            console.log(`📅 Backend response status:`, response.status);
            return response.json();
          })
          .then(result => {
            console.log(`📅 Backend response result:`, result);
            if (result.success) {
              addMessage("agent", `✅ Event "${event.title}" added to your calendar.`);
              // Refresh calendar events
              console.log(`📅 Refreshing calendar events`);
              if (window.calendar) {
                window.calendar.refetchEvents();
              }
            } else if (result.duplicate) {
              addMessage("agent", `✅ Event "${event.title}" already exists in your calendar.`);
              if (window.calendar) {
                window.calendar.refetchEvents();
              }
            } else {
              addMessage("agent", `❌ Failed to add event "${event.title}". ${result.message ? result.message : ''}`);
            }
          })
          .catch(error => {
            console.error('Error adding event:', error);
            addMessage("agent", `❌ Error adding event "${event.title}".`);
          });
        });
      } else {
        console.log("📅 No events found in response or events array is empty");
      }
    } catch (error) {
      console.error("💬 Chat error:", error);
      // Remove typing indicator
      removeTypingIndicator(typing);
      // Add error message
      addMessage("agent", "Sorry, I'm having trouble connecting right now. Please try again.");
    }
  });
};
