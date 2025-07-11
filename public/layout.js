console.log("🧠 layout.js is loading");
async function initializeFirebase() {
  try {
    const response = await fetch('/api/firebase-config');
    const firebaseConfig = await response.json();
    firebase.initializeApp(firebaseConfig);
    return firebase.auth();
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("🧠 layout.js is loading");

  try {
    window.calendar = null;
    window.calendarRendered = false;
    window.userId = null;
    window.userIdReady = false;

    // Initialize Lucide icons with error handling
    try {
    lucide.createIcons();
      console.log("✅ Lucide icons initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Lucide icons:", error);
      // Fallback: ensure nav items are visible even without icons
      document.querySelectorAll('.nav-item i[data-lucide]').forEach(icon => {
        icon.style.display = 'block';
        icon.style.width = '1.5rem';
        icon.style.height = '1.5rem';
      });
    }

    const views = document.querySelectorAll(".view");
    const navButtons = document.querySelectorAll(".nav-item");
    const bottomNavButtons = document.querySelectorAll(".bottom-nav button");
    const toggleTheme = document.getElementById("toggleTheme");

    function activateView(viewId) {
      // Hide all views
      document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
      });
      // Show the selected view
      const activeView = document.getElementById(`${viewId}-view`);
      if (activeView) {
        activeView.classList.add('active');
      }
      
      // Handle HomeBase component initialization when home view is activated
      if (viewId === 'home') {
        setTimeout(() => {
          const homebaseContainer = document.getElementById('homebase-container');
          if (homebaseContainer && window.HomeBaseComponent) {
            window.HomeBaseComponent.init(homebaseContainer);
            console.log("🏠 HomeBase Component initialized on view activation");
          }
        }, 100);
      }
      
      // Handle chat initialization when chat view is activated
      if (viewId === 'chat') {
        setTimeout(() => {
          // Always inject a fresh #chat-root for the chat UI
          const chatView = document.getElementById('chat-view');
          if (chatView) {
            chatView.innerHTML = '<div id="chat-root"></div>';
            console.log("💬 chat-root injected into chat-view");
            const mockUser = {
              uid: window.userId || "test_user"
            };
            if (window.initializeChat) {
              window.initializeChat(null, mockUser);
            }
          } else {
            console.error("💬 chat-view element not found");
          }
        }, 100);
      }
      
      // Handle calendar rendering when calendar view is activated
      if (viewId === 'calendar') {
        // Use setTimeout to ensure the view is active before rendering
        setTimeout(() => {
          if (!window.calendarRendered) {
            renderCalendar();
          } else if (window.calendar) {
            // If already rendered, just update the size
            window.calendar.updateSize();
          }
        }, 100);
      }
      
      // Handle Email Decoder initialization when dashboard view is activated
      if (viewId === 'dashboard') {
        setTimeout(() => {
          console.log('🧠 Dashboard view activated, initializing Email Decoder');
          if (window.initializeDashboardDecoder) {
            window.initializeDashboardDecoder();
          } else if (window.initializeDecoder) {
            window.initializeDecoder();
          }
        }, 100);
      }
      
      // Update nav active state
      document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
      });
      // Update bottom nav active state
      document.querySelectorAll('.bottom-nav button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
      });
    }

    window.activateView = activateView;

    function handleNavClick(button) {
      const viewId = button.getAttribute("data-view");
      if (viewId) {
        activateView(viewId);
      }
    }

    navButtons.forEach(button => {
      button.addEventListener("click", () => handleNavClick(button));
    });

    bottomNavButtons.forEach(button => {
      button.addEventListener("click", () => {
        const viewId = button.getAttribute("data-view");
        if (viewId) {
          activateView(viewId);
        }
      });
    });

    // Only run Firebase Auth logic after Firebase is initialized
    initializeFirebase().then(authInstance => {
      const auth = authInstance;
      console.log("🔥 Firebase auth available, setting up auth state listener");
      // Check authentication state
      auth.onAuthStateChanged((user) => {
        if (!user) {
          // User is not signed in, redirect to auth page
          if (window.location.pathname === '/dashboard.html' || window.location.pathname === '/dashboard.html') {
            console.log("❌ User not authenticated, redirecting to auth page");
            window.location.href = '/auth.html';
            return;
          }
          // For other pages, redirect to auth
          if (window.location.pathname !== '/auth' && window.location.pathname !== '/auth.html' && window.location.pathname !== '/') {
            window.location.href = '/auth.html';
          }
        } else {
          // User is signed in, display email
          const userEmailElement = document.getElementById('userEmail');
          if (userEmailElement) {
            userEmailElement.textContent = user.email;
          }
          window.userId = user.uid;
          window.userIdReady = true;
          // Store user info for later use, but don't auto-initialize chat
          // Chat will be initialized when the chat view is activated
        }
      });

      // Handle logout
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            if (typeof auth !== 'undefined' && auth.signOut) {
              await auth.signOut();
            }
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/auth.html';
          } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/auth.html';
          }
        });
      }

      // On load, check for Gmail connection parameter and set appropriate view
      const urlParams = new URLSearchParams(window.location.search);
      const gmailConnected = urlParams.get('gmail_connected');
      const step = urlParams.get('step');
      const view = urlParams.get('view');
      
      if (gmailConnected === 'true') {
        // Gmail was just connected, show the Email Decoder dashboard
        activateView(view || 'dashboard');
        
        // If there's a step parameter, pass it to the dashboard
        if (step) {
          // Store the step in sessionStorage for dashboard to use
          sessionStorage.setItem('gmail_step', step);
        }
        
        // Clean up the URL parameters properly
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Initialize the dashboard decoder after a short delay
        setTimeout(() => {
          if (window.initializeDashboardDecoder) {
            window.initializeDashboardDecoder();
          }
        }, 100);
      } else {
        // Default to chat view
        activateView('chat');
      }

    }).catch(error => {
      console.error('Firebase initialization failed:', error);
      document.body.innerHTML = '<div style="text-align: center; padding: 50px;"><h2>Service Unavailable</h2><p>Unable to initialize authentication service.</p></div>';
    });

    if (toggleTheme) {
      toggleTheme.addEventListener("click", () => {
        document.body.classList.toggle("dark");
      });
    }

    const reframeBtn = document.querySelector('.reframe-btn');
    const reframeInput = document.querySelector('.reframe-input');
    const reframeOutput = document.querySelector('.reframe-output');

    if (reframeBtn) {
      reframeBtn.addEventListener('click', async () => {
        const challenge = reframeInput.value;
        if (!challenge.trim()) {
          reframeOutput.innerHTML = `<p style="color: #c0392b;">Please enter a challenge first.</p>`;
          return;
        }

        reframeOutput.innerHTML = '<p>Getting your re-frame...</p>';
        reframeBtn.disabled = true;

        try {
          const response = await fetch('/api/reframe-protocol', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ challenge })
          });

          if (!response.ok) {
            throw new Error('Failed to get a response from the server.');
          }

          const data = await response.json();
          
          reframeOutput.innerHTML = `
            <div class="reframe-result">
              <h4>${data.title}</h4>
              <p class="reframe-core">"${data.reframe}"</p>
              <h5>${data.action.header}</h5>
              <ul>
                ${data.action.steps.map(step => `<li>${step}</li>`).join('')}
              </ul>
              <h6>The Science Behind It</h6>
              <p class="reframe-science">${data.science}</p>
            </div>
          `;

        } catch (error) {
          reframeOutput.innerHTML = `<p style="color: #c0392b;">Sorry, something went wrong. Please try again.</p>`;
          console.error('Re-frame Error:', error);
        } finally {
          reframeBtn.disabled = false;
        }
      });
    }

    // Register FullCalendar List plugin if available
    // (No need to push to globalPlugins for global build)

    function getInitialCalendarView() {
      if (window.innerWidth <= 768) {
        return 'list';
      }
      return 'dayGridMonth';
    }

    function renderCalendar() {
      console.log("🔄 renderCalendar called");
      
      // Check if calendar view is actually active
      const calendarView = document.getElementById('calendar-view');
      const isCalendarViewActive = calendarView && calendarView.classList.contains('active');
      console.log("🔄 Calendar view active:", isCalendarViewActive);
      
      if (!isCalendarViewActive) {
        console.log("❌ Calendar view is not active, skipping renderCalendar");
        return;
      }
      
      console.log("🔄 window.userId:", window.userId);
      console.log("🔄 window.userIdReady:", window.userIdReady);
      console.log("🔄 window.calendarRendered:", window.calendarRendered);
      console.log("🔄 FullCalendar available:", typeof FullCalendar !== 'undefined');
      
      const calendarEl = document.getElementById("calendar");
      console.log("🔄 Calendar element found:", !!calendarEl);
      
      if (!calendarEl) {
        console.error("❌ Calendar element not found");
        return;
      }

      // Ensure calendar element is visible and properly sized
      calendarEl.style.display = "block";
      calendarEl.style.height = "600px";
      calendarEl.style.minHeight = "600px";
      calendarEl.style.width = "100%";
      calendarEl.style.visibility = "visible";
      
      // Check calendar element dimensions
      const rect = calendarEl.getBoundingClientRect();
      console.log("🔄 Calendar element dimensions:", rect.width, "x", rect.height);
      console.log("🔄 Calendar element display:", window.getComputedStyle(calendarEl).display);
      console.log("🔄 Calendar element visibility:", window.getComputedStyle(calendarEl).visibility);

      if (typeof FullCalendar === "undefined") {
        console.error("❌ FullCalendar library not found");
        return;
      }

      if (window.calendarRendered) {
        console.log("🔄 Calendar already rendered, updating size");
        if (window.calendar) {
          window.calendar.updateSize();
        }
        return;
      }

      console.log("🔄 Proceeding with calendar initialization");

      // Create calendar with proper event fetching
      window.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: getInitialCalendarView(),
        plugins: [
          ...(typeof FullCalendar !== 'undefined' && FullCalendar.List ? [FullCalendar.List] : []),
          ...(typeof FullCalendar !== 'undefined' && FullCalendar.DayGrid ? [FullCalendar.DayGrid] : [])
        ],
        height: "auto",
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: window.innerWidth <= 768 ? '' : "dayGridMonth,timeGridWeek,timeGridDay,list"
        },
        events: function(fetchInfo, successCallback, failureCallback) {
          const userId = window.userId || "test_user";
          const url = `/api/get-events?user_id=${userId}`;
          console.log("🟢 FullCalendar fetching events from:", url);
          console.log("🟢 Current window.userId:", window.userId);
          
          fetch(url)
            .then(response => {
              console.log("🟢 Response status:", response.status);
              console.log("🟢 Response ok:", response.ok);
              return response.json();
            })
            .then(data => {
              console.log("🟢 Events fetched for calendar:", data);
              console.log("🟢 Events type:", typeof data);
              console.log("🟢 Events length:", data.length);
              
              if (Array.isArray(data)) {
                console.log("✅ Calling successCallback with events");
                successCallback(data);
              } else {
                console.warn("⚠️ Events data is not an array:", data);
                successCallback([]);
              }
            })
            .catch(error => {
              console.error("❌ Error fetching events:", error);
              failureCallback(error);
            });
        },
        eventDisplay: "block",
        eventClick: function(info) {
          // Show event modal with details and reframe
          showEventModal(info.event);
          info.jsEvent.preventDefault();
        },
        dateClick: function(info) {
          const title = prompt("Add an event:");
          if (title) {
            const userId = window.userId || "test_user";
            fetch("/api/add-event", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: userId,
                title: title,
                start: info.dateStr,
                allDay: true
              })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                window.calendar.refetchEvents();
              }
            })
            .catch(error => console.error("Error adding event:", error));
          }
        }
      });

      window.calendar.render();
      window.calendarRendered = true;
      console.log("✅ Calendar initialized and rendered");
      
      // Handle any pending events from chat
      if (window.pendingCalendarEvents && window.pendingCalendarEvents.length > 0) {
        console.log("📅 Processing pending calendar events:", window.pendingCalendarEvents);
        window.pendingCalendarEvents.forEach((event) => {
          if (window.calendar) {
            window.calendar.addEvent(event);
          }
        });
        window.pendingCalendarEvents = [];
        console.log("📅 Pending events processed and cleared");
      }
      
      // Force calendar to update its size after a short delay
      setTimeout(() => {
        console.log("🔄 Forcing calendar updateSize after initialization");
        if (window.calendar) {
          window.calendar.updateSize();
        }
        const newRect = calendarEl.getBoundingClientRect();
        console.log("🔄 Calendar dimensions after updateSize:", newRect.width, "x", newRect.height);
      }, 200);

      // Force list view on mobile after render
      if (window.innerWidth <= 768) {
        window.calendar.changeView('list');
      }
    }

    // Make renderCalendar available globally
    window.renderCalendar = renderCalendar;

    // Modern Calendar Features
    function updateCalendarStats() {
      if (!window.calendar) return;
      
      const allEvents = window.calendar.getEvents();
      const now = new Date();
      const upcomingEvents = allEvents.filter(event => event.start > now);
      
      // Update stats
      const totalEventsEl = document.getElementById('total-events');
      const upcomingEventsEl = document.getElementById('upcoming-events');
      
      if (totalEventsEl) totalEventsEl.textContent = allEvents.length;
      if (upcomingEventsEl) upcomingEventsEl.textContent = upcomingEvents.length;
      
      // Update upcoming events list
      updateUpcomingEventsList(upcomingEvents.slice(0, 5));
    }

    function updateUpcomingEventsList(events) {
      const container = document.getElementById('upcoming-events-list');
      if (!container) return;
      
      if (events.length === 0) {
        container.innerHTML = '<p style="color: #64748b; font-size: 0.9rem; text-align: center; padding: 1rem;">No upcoming events</p>';
        return;
      }
      
      container.innerHTML = events.map(event => `
        <div class="upcoming-event-item" onclick="showEventModal(${JSON.stringify(event).replace(/"/g, '&quot;')})">
          <div class="upcoming-event-title">${event.title}</div>
          <div class="upcoming-event-time">${formatEventTime(event.start, event.end)}</div>
        </div>
      `).join('');
    }

    function setupCalendarFilters() {
      const filterInputs = document.querySelectorAll('.filter-item input[type="checkbox"]');
      
      filterInputs.forEach(input => {
        input.addEventListener('change', function() {
          const filterType = this.dataset.filter;
          const isChecked = this.checked;
          
          if (filterType === 'all') {
            // Handle "All Events" checkbox
            if (isChecked) {
              // Check all other filters
              filterInputs.forEach(otherInput => {
                if (otherInput !== this) {
                  otherInput.checked = true;
                }
              });
            } else {
              // Uncheck all other filters
              filterInputs.forEach(otherInput => {
                if (otherInput !== this) {
                  otherInput.checked = false;
                }
              });
            }
          } else {
            // Handle individual filter checkboxes
            const allFilter = document.querySelector('input[data-filter="all"]');
            if (allFilter) {
              const otherFilters = Array.from(filterInputs).filter(input => input.dataset.filter !== 'all');
              const checkedFilters = otherFilters.filter(input => input.checked);
              
              if (checkedFilters.length === 0) {
                // If no filters are checked, uncheck "All Events"
                allFilter.checked = false;
              } else if (checkedFilters.length === otherFilters.length) {
                // If all filters are checked, check "All Events"
                allFilter.checked = true;
              }
            }
          }
          
          applyCalendarFilters();
        });
      });
    }

    function applyCalendarFilters() {
      if (!window.calendar) return;
      
      const allEvents = window.calendar.getEvents();
      const activeFilters = Array.from(document.querySelectorAll('.filter-item input[type="checkbox"]:checked'))
        .map(input => input.dataset.filter)
        .filter(filter => filter !== 'all');
      
      allEvents.forEach(event => {
        const eventType = getEventType(event);
        const shouldShow = activeFilters.includes('all') || activeFilters.includes(eventType);
        
        if (shouldShow) {
          event.setProp('display', 'auto');
        } else {
          event.setProp('display', 'none');
        }
      });
    }

    function getEventType(event) {
      // Determine event type based on title, description, or other properties
      const title = event.title.toLowerCase();
      const description = (event.extendedProps?.description || '').toLowerCase();
      
      if (title.includes('appointment') || title.includes('doctor') || title.includes('dentist') || 
          description.includes('appointment') || description.includes('medical')) {
        return 'appointment';
      } else if (title.includes('meeting') || title.includes('call') || title.includes('conference') ||
                 description.includes('meeting') || description.includes('work')) {
        return 'meeting';
      } else if (title.includes('birthday') || title.includes('party') || title.includes('dinner') ||
                 description.includes('personal') || description.includes('family')) {
        return 'personal';
      }
      
      return 'personal'; // Default
    }

    function setupAddEventButton() {
      const addEventBtn = document.getElementById('add-event-btn');
      if (addEventBtn) {
        addEventBtn.addEventListener('click', function() {
          showAddEventModal();
        });
      }
    }

    function showAddEventModal() {
      const modalHTML = `
        <div id="add-event-modal" class="calendar-injection-overlay">
          <div class="calendar-injection-modal">
            <div class="calendar-injection-header">
              <h2><i data-lucide="plus"></i> Add New Event</h2>
              <button class="calendar-injection-close" onclick="closeAddEventModal()">×</button>
            </div>
            <div class="calendar-injection-content">
              <form id="add-event-form">
                <div class="form-group">
                  <label for="new-event-title">Event Title</label>
                  <input type="text" id="new-event-title" required>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="new-event-date">Date</label>
                    <input type="date" id="new-event-date" required>
                  </div>
                  <div class="form-group">
                    <label for="new-event-time">Time</label>
                    <input type="time" id="new-event-time">
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="new-event-location">Location</label>
                  <input type="text" id="new-event-location" placeholder="Optional">
                </div>
                
                <div class="form-group">
                  <label for="new-event-description">Description</label>
                  <textarea id="new-event-description" rows="3" placeholder="Optional"></textarea>
                </div>
                
                <div class="form-group checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="new-event-all-day">
                    <span class="checkmark"></span>
                    All day event
                  </label>
                </div>
                
                <div class="calendar-injection-actions">
                  <button type="button" class="btn-secondary" onclick="closeAddEventModal()">Cancel</button>
                  <button type="submit" class="btn-primary">
                    <i data-lucide="calendar-plus"></i>
                    Add Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;
      
      // Add modal to body
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('new-event-date').value = today;
      
      // Add event listeners
      document.getElementById('add-event-modal').addEventListener('click', function(e) {
        if (e.target.id === 'add-event-modal') {
          closeAddEventModal();
        }
      });
      
      // Handle form submission
      document.getElementById('add-event-form').addEventListener('submit', function(e) {
        e.preventDefault();
        submitNewEvent();
      });
      
      // Add escape key listener
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          closeAddEventModal();
        }
      });
      
      // Initialize Lucide icons
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }

    function closeAddEventModal() {
      const modal = document.getElementById('add-event-modal');
      if (modal) {
        modal.remove();
      }
    }

    async function submitNewEvent() {
      const title = document.getElementById('new-event-title').value;
      const date = document.getElementById('new-event-date').value;
      const time = document.getElementById('new-event-time').value;
      const location = document.getElementById('new-event-location').value;
      const description = document.getElementById('new-event-description').value;
      const allDay = document.getElementById('new-event-all-day').checked;
      
      // Combine date and time
      let startDateTime = date;
      if (!allDay && time) {
        startDateTime = `${date}T${time}`;
      }
      
      // Create event data
      const eventData = {
        user_id: window.userId || "test_user",
        title: title,
        start: startDateTime,
        allDay: allDay,
        location: location || null,
        description: description || null
      };
      
      // Add end time if not all day
      if (!allDay && time) {
        const startDate = new Date(startDateTime);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later
        eventData.end = endDate.toISOString();
      }
      
      try {
        const response = await fetch('/api/add-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          closeAddEventModal();
          
          // Refresh calendar
          if (window.calendar && typeof window.calendar.refetchEvents === 'function') {
            window.calendar.refetchEvents();
          }
          
          // Show success message
          if (typeof showSuccess === 'function') {
            showSuccess('Event added to your calendar!');
          }
        } else {
          if (typeof showError === 'function') {
            showError('Failed to add event to calendar');
          }
        }
      } catch (error) {
        console.error('Error adding event:', error);
        if (typeof showError === 'function') {
          showError('Error adding event to calendar');
        }
      }
    }

    // Make functions globally available
    window.closeAddEventModal = closeAddEventModal;
    window.showAddEventModal = showAddEventModal;

    // Initialize modern calendar features when calendar is rendered
    const originalRenderCalendar = window.renderCalendar;
    window.renderCalendar = function() {
      originalRenderCalendar();
      
      // Setup modern features after calendar is rendered
      setTimeout(() => {
        updateCalendarStats();
        setupCalendarFilters();
        setupAddEventButton();
        
        // Update stats when events change
        if (window.calendar) {
          window.calendar.on('eventAdd', updateCalendarStats);
          window.calendar.on('eventRemove', updateCalendarStats);
          window.calendar.on('eventChange', updateCalendarStats);
        }
      }, 500);
    };

    // Event Modal System
    function showEventModal(event) {
      // Create modal HTML
      const modalHTML = `
        <div id="event-modal" class="event-modal-overlay">
          <div class="event-modal">
            <div class="event-modal-header">
              <h2>${event.title}</h2>
              <button class="event-modal-close" onclick="closeEventModal()">×</button>
            </div>
            <div class="event-modal-content">
              <div class="event-details">
                <div class="event-detail-item">
                  <i class="lucide-calendar"></i>
                  <span>${formatEventDate(event.start)}</span>
                </div>
                <div class="event-detail-item">
                  <i class="lucide-clock"></i>
                  <span>${formatEventTime(event.start, event.end)}</span>
                </div>
                ${event.extendedProps.location ? `
                  <div class="event-detail-item">
                    <i class="lucide-map-pin"></i>
                    <span>${event.extendedProps.location}</span>
                  </div>
                ` : ''}
                ${event.extendedProps.description ? `
                  <div class="event-detail-item">
                    <i class="lucide-file-text"></i>
                    <span>${event.extendedProps.description}</span>
                  </div>
                ` : ''}
              </div>
              
              <div class="event-reframe-section">
                <h3>🤔 Need a reframe?</h3>
                <p>Get a fresh perspective on this event with AI-powered reframing.</p>
                <button class="reframe-event-btn" onclick="reframeEvent('${event.title}')">
                  <i class="lucide-sparkles"></i>
                  Get Reframe
                </button>
                <div id="event-reframe-output" class="event-reframe-output"></div>
              </div>
              
              <div class="event-actions">
                <button class="event-action-btn edit-btn" onclick="editEvent('${event.id}')">
                  <i class="lucide-edit"></i>
                  Edit
                </button>
                <button class="event-action-btn delete-btn" onclick="deleteEvent('${event.id}')">
                  <i class="lucide-trash-2"></i>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Add modal to body
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      // Add event listeners for modal interactions
      document.getElementById('event-modal').addEventListener('click', function(e) {
        if (e.target.id === 'event-modal') {
          closeEventModal();
        }
      });
      
      // Add escape key listener
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          closeEventModal();
        }
      });
    }

    function closeEventModal() {
      const modal = document.getElementById('event-modal');
      if (modal) {
        modal.remove();
      }
    }

    function formatEventDate(date) {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    function formatEventTime(start, end) {
      const startTime = new Date(start);
      const endTime = end ? new Date(end) : null;
      
      if (endTime) {
        return `${startTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        })} - ${endTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        })}`;
      } else {
        return startTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        });
      }
    }

    async function reframeEvent(eventTitle) {
      const reframeOutput = document.getElementById('event-reframe-output');
      const reframeBtn = document.querySelector('.reframe-event-btn');
      
      reframeOutput.innerHTML = '<div class="reframe-loading"><i class="lucide-loader-2"></i> Getting your reframe...</div>';
      reframeBtn.disabled = true;
      
      try {
        const response = await fetch('/api/reframe-protocol', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            challenge: `I have an event coming up: "${eventTitle}". I'm feeling a bit anxious about it and could use a fresh perspective.` 
          })
        });

        if (!response.ok) {
          throw new Error('Failed to get a response from the server.');
        }

        const data = await response.json();
        
        reframeOutput.innerHTML = `
          <div class="event-reframe-result">
            <h4>${data.title}</h4>
            <p class="reframe-core">"${data.reframe}"</p>
            <h5>${data.action.header}</h5>
            <ul>
              ${data.action.steps.map(step => `<li>${step}</li>`).join('')}
            </ul>
            <h6>The Science Behind It</h6>
            <p class="reframe-science">${data.science}</p>
          </div>
        `;

      } catch (error) {
        reframeOutput.innerHTML = `<div class="reframe-error">Sorry, something went wrong. Please try again.</div>`;
        console.error('Event Reframe Error:', error);
      } finally {
        reframeBtn.disabled = false;
      }
    }

    async function editEvent(eventId) {
      // TODO: Implement event editing
      alert('Event editing coming soon!');
    }

    async function deleteEvent(eventId) {
      if (confirm('Are you sure you want to delete this event?')) {
        try {
          const userId = window.userId || "test_user";
          const response = await fetch('/api/delete-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              user_id: userId,
              event_id: eventId 
            })
          });
          
          if (response.ok) {
            window.calendar.refetchEvents();
            closeEventModal();
          } else {
            alert('Failed to delete event');
          }
        } catch (error) {
          console.error('Error deleting event:', error);
          alert('Error deleting event');
        }
      }
    }

    // Make functions globally available
    window.closeEventModal = closeEventModal;
    window.reframeEvent = reframeEvent;
    window.editEvent = editEvent;
    window.deleteEvent = deleteEvent;

    // Add clear events functionality
    const clearEventsBtn = document.getElementById('clear-events-btn');
    if (clearEventsBtn) {
      clearEventsBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all calendar events? This cannot be undone.')) {
          try {
            const userId = window.userId || "test_user";
            const response = await fetch('/api/events/clear', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId })
            });
            
            if (response.ok) {
              // Clear the calendar display
              if (window.calendar) {
                window.calendar.removeAllEvents();
              }
              // Reset calendar state
              window.calendarRendered = false;
              console.log('✅ All calendar events cleared');
            } else {
              console.error('❌ Failed to clear events');
            }
          } catch (error) {
            console.error('❌ Error clearing events:', error);
          }
        }
      });
    }

    // Account dropdown menu logic
    const accountMenu = document.getElementById('accountMenu');
    const accountBtn = document.getElementById('accountBtn');
    const accountDropdown = document.getElementById('accountDropdown');

    if (accountBtn && accountMenu && accountDropdown) {
      accountBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        accountMenu.classList.toggle('open');
        accountBtn.setAttribute('aria-expanded', accountMenu.classList.contains('open'));
        if (accountMenu.classList.contains('open')) {
          accountDropdown.focus();
        }
      });

      document.addEventListener('click', function(e) {
        if (!accountMenu.contains(e.target)) {
          accountMenu.classList.remove('open');
          accountBtn.setAttribute('aria-expanded', 'false');
        }
      });

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          accountMenu.classList.remove('open');
          accountBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Sidebar mobile toggle logic
    const sidebar = document.getElementById('sidebar');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    let sidebarBackdrop = null;

    if (sidebar && hamburgerBtn) {
      function openSidebar() {
        console.log("🔄 Opening sidebar");
        sidebar.classList.add('open');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        
        // Debug: check if nav items are visible
        const navItems = sidebar.querySelectorAll('.nav-item');
        console.log("🔄 Nav items found:", navItems.length);
        navItems.forEach((item, index) => {
          console.log(`🔄 Nav item ${index}:`, item.textContent.trim(), item.style.display, item.offsetHeight);
        });
        
        // Add backdrop
        sidebarBackdrop = document.createElement('div');
        sidebarBackdrop.className = 'sidebar-backdrop';
        document.body.appendChild(sidebarBackdrop);
        sidebarBackdrop.addEventListener('click', closeSidebar);
      }
      function closeSidebar() {
        sidebar.classList.remove('open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        if (sidebarBackdrop) {
          sidebarBackdrop.remove();
          sidebarBackdrop = null;
        }
      }
      hamburgerBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (sidebar.classList.contains('open')) {
          closeSidebar();
        } else {
          openSidebar();
        }
      });
      // Close sidebar on nav click (mobile)
      document.querySelectorAll('.sidebar .nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
          if (window.innerWidth <= 900) closeSidebar();
        });
      });
      // Close sidebar on outside click (mobile)
      document.addEventListener('click', function(e) {
        if (window.innerWidth > 900) return;
        if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== hamburgerBtn) {
          closeSidebar();
        }
      });
    }

    // Nuke any rogue nav, nav-item, or icon outside sidebar/bottom-nav
    function nukeRogueNavs() {
      document.querySelectorAll('.nav, .nav-item, i').forEach(el => {
        if (!el.closest('.sidebar') && !el.closest('.bottom-nav')) {
          el.remove();
        }
      });
    }
    document.addEventListener('DOMContentLoaded', nukeRogueNavs);

    // Find the HomeOps logo element and remove any click or link behavior
    window.addEventListener('DOMContentLoaded', function() {
      const logo = document.querySelector('.homeops-logo, #homeops-logo, .header-logo, .logo');
      if (logo) {
        // Remove anchor tag if present
        if (logo.tagName === 'A') {
          const parent = logo.parentNode;
          const img = logo.querySelector('img, svg');
          if (img) {
            parent.insertBefore(img, logo);
          }
          parent.removeChild(logo);
        } else {
          // Remove any click handlers
          logo.onclick = null;
          logo.style.pointerEvents = 'none';
          logo.style.cursor = 'default';
        }
      }
    });

    // Responsive view switcher for FullCalendar
    function handleCalendarResize() {
      if (!window.calendar) return;
      const isMobile = window.innerWidth <= 768;
      const currentView = window.calendar.view.type;
      if (isMobile && currentView !== 'list') {
        window.calendar.changeView('list');
      } else if (!isMobile && currentView !== 'dayGridMonth') {
        window.calendar.changeView('dayGridMonth');
      }
    }
    window.addEventListener('resize', handleCalendarResize);
    // Also call once after render
    setTimeout(handleCalendarResize, 1000);

    // Diagnostic logging for FullCalendar List plugin
    window.addEventListener('DOMContentLoaded', function() {
      if (typeof FullCalendar === 'undefined') {
        console.error('❌ FullCalendar global object is not defined!');
      } else {
        console.log('✅ FullCalendar global object found.');
        if (typeof FullCalendar.List === 'undefined') {
          console.error('❌ FullCalendar.List is not defined! The list plugin may not be loaded.');
        } else {
          console.log('✅ FullCalendar.List is available.');
        }
      }
    });

    window.updateMentalLoadScore = function(score) {
      const el = document.getElementById('mental-load-score');
      if (el) el.textContent = score;
    };

    function enforceMobileCalendarView() {
      if (!window.calendar) return;
      const isMobile = window.innerWidth <= 768;
      if (isMobile && window.calendar.view.type !== 'list') {
        window.calendar.changeView('list');
      } else if (!isMobile && window.calendar.view.type !== 'dayGridMonth') {
        window.calendar.changeView('dayGridMonth');
      }
    }
    window.addEventListener('resize', enforceMobileCalendarView);
    setTimeout(enforceMobileCalendarView, 1000);

    setupAddEventButton();

    // On DOMContentLoaded, animate logo
    window.addEventListener('DOMContentLoaded', function() {
      const logo = document.querySelector('.homeops-logo-icon');
      if (logo) {
        logo.style.animation = 'logoPulse 1.2s cubic-bezier(.4,0,.2,1) 1';
      }
    });

  } catch (err) {
    console.error("💥 layout.js crash:", err);
  }
});

