// Chat initialization is now handled by layout.js calling window.initializeChat
// This prevents race conditions with Firebase initialization

// Refactored chat.js to export initializeChat
window.initializeChat = function(auth, user) {
  console.log("💬 Initializing chat for user:", user ? user.uid : "test_user");
  const chatBox = document.getElementById("chat");
  const chatForm = document.getElementById("chatForm");
  const input = document.getElementById("input");
  if (!chatBox || !chatForm || !input) {
    console.error("💬 Chat elements not found", { chatBox, chatForm, input });
    return;
  }
  
  // Clear any existing content
  chatBox.innerHTML = '';
  
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
  
  // Fun, brand-aligned opening lines
  const openingLines = [
    "Hi, I'm HomeOps — your mental load operating system. What's on your plate today?",
    "Hey there! HomeOps here. What can I help you clear off your list?",
    "Welcome to HomeOps — your family's chief of staff. What's top of mind?",
    "Hi! I'm HomeOps. Ready to help you decode, plan, and conquer your day.",
    "Hello! HomeOps at your service. What's the first thing you want to tackle?"
  ];
  function getOpeningLine() {
    return openingLines[Math.floor(Math.random() * openingLines.length)];
  }
  
  function addMessage(sender, message, opts = {}) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;
    
    // Agent avatar with HomeOps logo
    if (sender === "agent") {
      const avatar = document.createElement("div");
      avatar.className = "agent-avatar";
      const logoImg = document.createElement("img");
      logoImg.src = "img/homeops-logo.svg";
      logoImg.alt = "HomeOps";
      avatar.appendChild(logoImg);
      messageDiv.appendChild(avatar);
    }
    
    // Bubble and chips wrapper
    let bubbleAndChips = null;
    if (sender === "agent") {
      bubbleAndChips = document.createElement("div");
      bubbleAndChips.className = "bubble-and-chips";
    }
    
    const messageBubble = document.createElement("div");
    messageBubble.className = "message-bubble";
    messageBubble.textContent = message;
    
    if (bubbleAndChips) {
      bubbleAndChips.appendChild(messageBubble);
    } else {
      messageDiv.appendChild(messageBubble);
    }
    
    // Quick-start chips under first agent message
    if (sender === "agent" && opts.showChips) {
      const chips = document.createElement("div");
      chips.className = "quick-start-chips";
      [
        "Remind me about something",
        "Check what's on my calendar",
        "Review recent emails"
      ].forEach(text => {
        const chip = document.createElement("button");
        chip.className = "quick-start-chip";
        chip.type = "button";
        chip.textContent = text;
        chip.onclick = () => {
          input.value = text;
          input.focus();
        };
        chips.appendChild(chip);
      });
      if (bubbleAndChips) {
        bubbleAndChips.appendChild(chips);
      } else {
        messageDiv.appendChild(chips);
      }
    }
    
    if (bubbleAndChips) {
      messageDiv.appendChild(bubbleAndChips);
    }
    
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // Show scroll-to-bottom button if needed
    checkScrollButton();
  }

  // Add welcome message with brand label
  function addWelcomeMessage() {
    const welcomeDiv = document.createElement("div");
    welcomeDiv.className = "welcome-message";
    
    const brandLabel = document.createElement("div");
    brandLabel.className = "brand-label";
    brandLabel.textContent = "HomeOps";
    welcomeDiv.appendChild(brandLabel);
    
    chatBox.appendChild(welcomeDiv);
  }

  // Scroll-to-bottom button functionality
  function checkScrollButton() {
    const isScrolledToBottom = chatBox.scrollTop + chatBox.clientHeight >= chatBox.scrollHeight - 10;
    const scrollBtn = document.querySelector('.scroll-to-bottom');
    
    if (!isScrolledToBottom) {
      if (!scrollBtn) {
        const btn = document.createElement("button");
        btn.className = "scroll-to-bottom visible";
        btn.onclick = () => {
          chatBox.scrollTop = chatBox.scrollHeight;
        };
        chatBox.appendChild(btn);
      }
    } else if (scrollBtn) {
      scrollBtn.remove();
    }
  }

  // Listen for scroll events
  chatBox.addEventListener('scroll', checkScrollButton);

  // Add welcome message first
  addWelcomeMessage();
  
  // Add initial greeting (with chips)
  addMessage("agent", getOpeningLine(), { showChips: true });
  
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
      if (typingDiv.parentNode) {
        chatBox.removeChild(typingDiv);
      }
      
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
      if (typingDiv.parentNode) {
        chatBox.removeChild(typingDiv);
      }
      // Add error message
      addMessage("agent", "Sorry, I'm having trouble connecting right now. Please try again.");
    }
  });
};
