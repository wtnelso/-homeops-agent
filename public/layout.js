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

    lucide.createIcons();

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
          const chatBox = document.getElementById('chat');
          const chatForm = document.getElementById('chatForm');
          const input = document.getElementById('input');
          
          // Check if chat is already initialized (has event listeners)
          if (chatBox && chatForm && input && !chatForm.hasAttribute('data-initialized')) {
            console.log("💬 Initializing chat on view activation");
            // Create a mock user object for development mode
            const mockUser = {
              uid: window.userId || "test_user"
            };
            // Initialize chat
            if (window.initializeChat) {
              window.initializeChat(null, mockUser);
              chatForm.setAttribute('data-initialized', 'true');
            }
          } else if (chatBox && chatForm && input) {
            console.log("💬 Chat already initialized");
          } else {
            console.error("💬 Chat elements not found for initialization");
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
          if (window.initializeEmailDecoder) {
            window.initializeEmailDecoder();
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
          if (window.location.pathname === '/dashboard' || window.location.pathname === '/dashboard.html') {
            console.log("❌ User not authenticated, redirecting to auth page");
            window.location.href = '/auth';
            return;
          }
          // For other pages, redirect to auth
          if (window.location.pathname !== '/auth' && window.location.pathname !== '/auth.html' && window.location.pathname !== '/') {
            window.location.href = '/auth';
          }
        } else {
          // User is signed in, display email
          const userEmailElement = document.getElementById('userEmail');
          if (userEmailElement) {
            userEmailElement.textContent = user.email;
          }
          window.userId = user.uid;
          window.userIdReady = true;
          // Initialize chat after Firebase is ready and user is authenticated
          if (window.initializeChat) {
            window.initializeChat(auth, user);
          }
        }
      });

      // Handle logout
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          try {
            await auth.signOut();
            window.location.href = '/auth';
          } catch (error) {
            console.error('Logout error:', error);
          }
        });
      }

      // On load, check for Gmail connection parameter and set appropriate view
      const urlParams = new URLSearchParams(window.location.search);
      const gmailConnected = urlParams.get('gmail_connected');
      
      if (gmailConnected === 'true') {
        // Gmail was just connected, show the Email Decoder dashboard
        activateView('dashboard');
        // Clean up the URL parameter
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]gmail_connected=true/, '');
        window.history.replaceState({}, document.title, newUrl);
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

    // --- Calendar logic remains outside, but only uses window.userIdReady/window.userId
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
        initialView: "dayGridMonth",
        height: "auto",
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay"
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
    }

    // Make renderCalendar available globally
    window.renderCalendar = renderCalendar;

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

    // Logout logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        // Add your logout logic here
        window.location.href = '/';
      });
    }

    // Sidebar mobile toggle logic
    const sidebar = document.getElementById('sidebar');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    let sidebarBackdrop = null;

    if (sidebar && hamburgerBtn) {
      function openSidebar() {
        sidebar.classList.add('open');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
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

  } catch (err) {
    console.error("💥 layout.js crash:", err);
  }
});

