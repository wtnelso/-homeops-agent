// Chat initialization is now handled by layout.js calling window.initializeChat
// This prevents race conditions with Firebase initialization

// Refactored chat.js to export initializeChat
window.initializeChat = function(auth, user, retryCount = 0) {
  console.log("💬 Initializing chat for user:", user ? user.uid : "test_user");
  
  // Always use #chat-root as the target
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

  // Create chat card container
  const chatCard = document.createElement("div");
  chatCard.className = "homeops-chat-card";

  // Chat box
  const chatBox = document.createElement("div");
  chatBox.className = "homeops-chat-box";
  chatBox.id = "chat";
  chatCard.appendChild(chatBox);

  // Chat form
  const chatForm = document.createElement("form");
  chatForm.className = "homeops-chat-form";
  chatForm.id = "chatForm";
  const input = document.createElement("input");
  input.type = "text";
  input.id = "input";
  input.placeholder = "Ask HomeOps anything...";
  chatForm.appendChild(input);
  const sendBtn = document.createElement("button");
  sendBtn.type = "submit";
  sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
  chatForm.appendChild(sendBtn);
  chatCard.appendChild(chatForm);

  chatRoot.appendChild(chatCard);
  
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
  
  // 1. Assistant intro rotation and personalization
  const assistantIntros = [
    "👋 Hi there. I'm HomeOps — here to manage the invisible work of your life. What's top of mind today?",
    "What do you need cleared off your plate today?",
    "Inbox chaos? Calendar overload? I've got it.",
    "Let's make life feel lighter — what's on your mind?"
  ];
  // Simulate user context (replace with real user data if available)
  const userHasKids = false; // Set to true to test parent intro
  const parentIntro = "Juggling school drop-offs and birthday invites? I got you.";
  const workIntro = "Work stress or errands piling up? I can handle the admin.";

  function getPersonalizedIntro() {
    const base = assistantIntros[Math.floor(Math.random() * assistantIntros.length)];
    const context = userHasKids ? parentIntro : workIntro;
    return `${base}\n${context}`;
  }

  // 2. Typing indicator before first agent message
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
    return typing;
  }

  function removeTypingIndicator(typing) {
    if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
  }

  // 3. On page load, show typing indicator, then agent intro
  window.addEventListener("DOMContentLoaded", () => {
    const chatBox = document.getElementById("chat");
    if (chatBox && chatBox.children.length === 0) {
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
      }, 1000);
    }
  });

  // 4. Ensure quick-start chips use only 1 emoji per chip and new style
  // (Handled in addMessage options above)

  // 5. Use Lucide icon for agent avatar
  function getAgentAvatar() {
    // Lucide house SVG (inline)
    return `<span class="agent-avatar"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7E5EFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5V21h6v-5h6v5h6V9.5L12 3z"/><path d="M9 21V12h6v9"/></svg></span>`;
  }

  function addMessage(sender, message, opts = {}) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;
    if (sender === "agent") {
      messageDiv.style.marginTop = opts.isFirst ? "32px" : "20px";
      messageDiv.style.marginBottom = opts.isFirst ? "12px" : "8px";
      // Agent avatar
      const avatar = document.createElement("div");
      avatar.className = "agent-avatar";
      avatar.innerHTML = getAgentAvatar();
      messageDiv.appendChild(avatar);
    }
    // Message bubble
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = message;
    messageDiv.appendChild(bubble);
    // Quick start chips for first agent message
    if (sender === "agent" && opts.quickStart) {
      const chipsContainer = document.createElement("div");
      chipsContainer.className = "quick-start-chips";
      opts.quickStart.forEach(chip => {
        const chipElement = document.createElement("button");
        chipElement.className = "quick-start-chip";
        chipElement.textContent = chip;
        chipElement.onclick = () => sendMessage(chip);
        chipsContainer.appendChild(chipElement);
      });
      messageDiv.appendChild(chipsContainer);
    }
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    checkScrollButton();
    maybeShowEmptyPlaceholder();
  }

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

  // Show empty state placeholder if no messages
  function maybeShowEmptyPlaceholder() {
    const chatBox = document.getElementById("chat");
    if (chatBox && chatBox.children.length === 0) {
      let placeholder = document.querySelector('.chat-empty-placeholder');
      if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.className = 'chat-empty-placeholder';
        placeholder.textContent = "Try something like: 'Add pediatrician appointment next week' or 'Remind me to order diapers'";
        chatBox.parentNode.insertBefore(placeholder, chatBox.nextSibling);
      }
    } else {
      const placeholder = document.querySelector('.chat-empty-placeholder');
      if (placeholder) placeholder.remove();
    }
  }

  // Call maybeShowEmptyPlaceholder on load and after each message
  maybeShowEmptyPlaceholder();

  // Handle form submission
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    
    // Add user message
    addMessage("user", message);
    input.value = "";
    
    // Show typing indicator
    showTypingIndicator();
    
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
      removeTypingIndicator(document.querySelector('.typing-indicator'));
      
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
      removeTypingIndicator(document.querySelector('.typing-indicator'));
      // Add error message
      addMessage("agent", "Sorry, I'm having trouble connecting right now. Please try again.");
    }
  });
};
