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
      
      // Dispatch custom event for view activation
      window.dispatchEvent(new CustomEvent('viewActivated', { detail: { viewId } }));
      
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
          // Ensure modal listeners are set up for calendar view
          setupModalEventListeners();
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

    function getInitialCalendarView() {
      if (window.innerWidth <= 768) {
        return 'dayGridMonth'; // Simplified for mobile
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
      calendarEl.style.height = "auto";
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

      // Clean FullCalendar setup - FIXED: Ensure proper height
      window.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        height: 600, // Fixed height to ensure calendar renders
        contentHeight: 550, // Ensure content area has proper height
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: [
          {
            title: 'Test Event',
            start: '2025-07-15',
            backgroundColor: '#8b5cf6',
            borderColor: '#8b5cf6',
            extendedProps: {
              reframe: 'This is a test event to verify calendar functionality. Consider reviewing your schedule and preparing for upcoming activities.'
            }
          },
          {
            title: 'Another Event',
            start: '2025-07-20',
            backgroundColor: '#10b981',
            borderColor: '#10b981',
            extendedProps: {
              reframe: 'This event represents another sample activity. Make sure to set reminders and gather materials needed in advance.'
            }
          },
          {
            title: 'Team Meeting',
            start: '2025-07-12T10:00:00',
            end: '2025-07-12T11:00:00',
            backgroundColor: '#f59e0b',
            borderColor: '#f59e0b',
            extendedProps: {
              reframe: 'Weekly team meeting to discuss project progress and upcoming deliverables.'
            }
          }
        ],
        eventClick: function(info) {
          console.log('🎯 Event clicked:', info.event.title);
          showEventModal(info.event);
          info.jsEvent.preventDefault();
        },
        dateClick: function(info) {
          const title = prompt("Add an event:");
          if (title) {
            window.calendar.addEvent({
              title: title,
              start: info.dateStr,
              allDay: true,
              backgroundColor: '#8b5cf6',
              borderColor: '#8b5cf6',
              extendedProps: {
                reframe: `User-created event: ${title}. Consider preparing necessary materials and setting reminders.`
              }
            });
          }
        },
        // Ensure proper sizing and responsiveness
        aspectRatio: 1.35,
        expandRows: true,
        dayMaxEvents: 3,
        moreLinkClick: 'popover'
      });

      console.log("🔄 Rendering calendar...");
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
        if (window.calendar) {
          window.calendar.updateSize();
          console.log("🔄 Calendar size updated");
        }
      }, 100);

      // Wire up view buttons
      const monthBtn = document.getElementById('monthViewBtn');
      const weekBtn = document.getElementById('weekViewBtn');
      const dayBtn = document.getElementById('dayViewBtn');
      const listBtn = document.getElementById('listViewBtn');

      if (monthBtn) {
        monthBtn.addEventListener('click', () => {
          if (window.calendar) {
            window.calendar.changeView('dayGridMonth');
            updateActiveViewButton('monthViewBtn');
          }
        });
      }

      if (weekBtn) {
        weekBtn.addEventListener('click', () => {
          if (window.calendar) {
            window.calendar.changeView('timeGridWeek');
            updateActiveViewButton('weekViewBtn');
          }
        });
      }

      if (dayBtn) {
        dayBtn.addEventListener('click', () => {
          if (window.calendar) {
            window.calendar.changeView('timeGridDay');
            updateActiveViewButton('dayViewBtn');
          }
        });
      }

      if (listBtn) {
        listBtn.addEventListener('click', () => {
          if (window.calendar) {
            window.calendar.changeView('listWeek');
            updateActiveViewButton('listViewBtn');
          }
        });
      }
    }

    function updateActiveViewButton(activeId) {
      const buttons = ['monthViewBtn', 'weekViewBtn', 'dayViewBtn', 'listViewBtn'];
      buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
          if (id === activeId) {
            btn.classList.add('active', 'bg-gray-100', 'text-gray-700');
            btn.classList.remove('bg-white', 'text-gray-600');
          } else {
            btn.classList.remove('active', 'bg-gray-100', 'text-gray-700');
            btn.classList.add('bg-white', 'text-gray-600');
          }
        }
      });
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

    // Event Modal Functions - Updated for slide-over style
    function showEventModal(event) {
      console.log('📅 Opening slide-over for:', event.title);
      
      const modal = document.getElementById('eventModal');
      const titleEl = document.getElementById('modalEventTitle');
      const timeEl = document.getElementById('modalEventTime');
      const reframeEl = document.getElementById('modalEventReframe');
      
      if (!modal || !titleEl || !timeEl || !reframeEl) {
        console.error('❌ Modal elements not found');
        return;
      }
      
      // Populate modal content
      titleEl.textContent = event.title;
      
      // Format date/time
      const startDate = new Date(event.start);
      let timeString = startDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (!event.allDay) {
        timeString += ' at ' + startDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        });
      }
      
      timeEl.textContent = timeString;
      
      // Set reframe content
      const reframe = event.extendedProps?.reframe || 'No AI summary available for this event.';
      reframeEl.textContent = reframe;
      
      // Show modal with slide-over animation
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      
      // Add slide-in animation
      const panel = modal.querySelector('div[style*="background: white"]');
      if (panel) {
        panel.style.transform = 'translateX(100%)';
        panel.style.transition = '';
        setTimeout(() => {
          panel.style.transition = 'transform 0.3s ease-out';
          panel.style.transform = 'translateX(0)';
        }, 10);
      }
      
      // Ensure modal listeners are set up
      setTimeout(setupModalEventListeners, 50);
      
      console.log('✅ Slide-over opened successfully');
    }

    function hideEventModal() {
      console.log('🚫 Hiding event modal');
      const modal = document.getElementById('eventModal');
      if (modal) {
        const panel = modal.querySelector('.bg-white, div[style*="background: white"]');
        if (panel) {
          panel.style.transition = 'transform 0.3s ease-out';
          panel.style.transform = 'translateX(100%)';
          setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.add('hidden');
            panel.style.transition = '';
            panel.style.transform = '';
            console.log('✅ Modal hidden with animation');
          }, 300);
        } else {
          modal.style.display = 'none';
          modal.classList.add('hidden');
          console.log('✅ Modal hidden (no animation)');
        }
      } else {
        console.warn('⚠️ Modal element not found');
      }
    }

    // Make showEventModal globally accessible
    window.showEventModal = showEventModal;
    window.hideEventModal = hideEventModal;

    // Set up modal event listeners - FIXED: Proper event handlers
    function setupModalEventListeners() {
      const closeBtn = document.getElementById('closeModalBtn');
      const modal = document.getElementById('eventModal');
      
      if (closeBtn) {
        // Remove any existing listeners first
        closeBtn.removeEventListener('click', hideEventModal);
        closeBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          console.log('❌ Close button clicked');
          hideEventModal();
        });
        console.log('✅ Close button listener attached');
      }
      
      if (modal) {
        // Remove any existing listeners first
        modal.removeEventListener('click', modalBackdropClick);
        modal.addEventListener('click', modalBackdropClick);
        console.log('✅ Modal backdrop listener attached');
      }
      
      // Add Event button functionality - FIXED
      const addEventBtn = document.getElementById('addEventBtn');
      if (addEventBtn) {
        addEventBtn.removeEventListener('click', handleAddEvent);
        addEventBtn.addEventListener('click', handleAddEvent);
        console.log('✅ Add Event button listener attached');
      }
      
      // Clear All button functionality
      const clearAllBtn = document.getElementById('clearAllBtn');
      if (clearAllBtn) {
        clearAllBtn.removeEventListener('click', handleClearAll);
        clearAllBtn.addEventListener('click', handleClearAll);
        console.log('✅ Clear All button listener attached');
      }
      
      // Edit and Delete button handlers
      const editEventBtn = document.getElementById('editEventBtn');
      const deleteEventBtn = document.getElementById('deleteEventBtn');
      
      if (editEventBtn) {
        editEventBtn.removeEventListener('click', handleEditEvent);
        editEventBtn.addEventListener('click', handleEditEvent);
      }
      
      if (deleteEventBtn) {
        deleteEventBtn.removeEventListener('click', handleDeleteEvent);
        deleteEventBtn.addEventListener('click', handleDeleteEvent);
      }
    }

    // Modal backdrop click handler
    function modalBackdropClick(e) {
      if (e.target === e.currentTarget) {
        console.log('📱 Backdrop clicked, closing modal');
        hideEventModal();
      }
    }

    // Event handlers for calendar actions
    function handleAddEvent() {
      console.log('➕ Add Event clicked');
      const title = prompt('Event title:');
      if (!title) return;
      
      const date = prompt('Date (YYYY-MM-DD):') || new Date().toISOString().split('T')[0];
      
      if (window.calendar) {
        const newEvent = {
          title: title,
          start: date,
          allDay: true,
          backgroundColor: '#8b5cf6',
          borderColor: '#8b5cf6',
          extendedProps: {
            reframe: `User-created event: ${title}. Consider preparing any necessary materials and setting reminders as needed.`
          }
        };
        window.calendar.addEvent(newEvent);
        console.log('✅ Event added:', title);
      }
    }

    function handleClearAll() {
      if (window.calendar && confirm('Are you sure you want to clear all events?')) {
        window.calendar.removeAllEvents();
        console.log('✅ All events cleared');
      }
    }

    function handleEditEvent() {
      hideEventModal();
      alert('Edit functionality coming soon!');
    }

    function handleDeleteEvent() {
      if (confirm('Are you sure you want to delete this event?')) {
        hideEventModal();
        alert('Delete functionality coming soon!');
      }
    }

    // Initialize modal listeners when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
      setupModalEventListeners();
    });

    // Also set up listeners when calendar view is activated
    window.addEventListener('viewActivated', function(e) {
      if (e.detail.viewId === 'calendar') {
        setTimeout(setupModalEventListeners, 100);
      }
    });

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
      if (isMobile && currentView !== 'listWeek') {
        window.calendar.changeView('listWeek');
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
        if (typeof FullCalendar.ListWeek === 'undefined') {
          console.error('❌ FullCalendar.ListWeek is not defined! The list plugin may not be loaded.');
        } else {
          console.log('✅ FullCalendar.ListWeek is available.');
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
      if (isMobile && window.calendar.view.type !== 'listWeek') {
        window.calendar.changeView('listWeek');
      } else if (!isMobile && window.calendar.view.type !== 'dayGridMonth') {
        window.calendar.changeView('dayGridMonth');
      }
    }
    window.addEventListener('resize', enforceMobileCalendarView);
    setTimeout(enforceMobileCalendarView, 1000);

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

