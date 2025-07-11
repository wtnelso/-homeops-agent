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
        return 'listMonth'; // List view for mobile
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
        console.log("🔄 Calendar already rendered, skipping re-initialization");
        if (window.calendar) {
          window.calendar.updateSize();
        }
        return;
      }

      console.log("🔄 Proceeding with calendar initialization");

      // Clean FullCalendar setup - FIXED: Ensure proper height
      window.calendar = new FullCalendar.Calendar(calendarEl, {
        // MOBILE-RESPONSIVE VIEW SELECTION
        initialView: window.innerWidth <= 768 ? 'listMonth' : 'dayGridMonth',
        height: 600, // Fixed height to ensure calendar renders
        contentHeight: 550, // Ensure content area has proper height
        headerToolbar: window.innerWidth <= 768 ? {
          left: 'prev,next',
          center: 'title',
          right: 'today'
        } : {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: [
          // FUTURE OF CALENDARS: Intelligent sample events
          {
            title: "Emma's 7th Birthday Party",
            start: '2025-07-15',
            allDay: true,
            backgroundColor: '#f59e0b',
            borderColor: '#f59e0b',
            extendedProps: {
              description: "Birthday party for Emma turning 7 at Riverside Park",
              type: 'birthday'
            }
          },
          {
            title: 'Lacrosse Game vs Eagles',
            start: '2025-07-12T10:00:00',
            end: '2025-07-12T12:00:00',
            backgroundColor: '#10b981',
            borderColor: '#10b981',
            extendedProps: {
              description: "Saturday morning lacrosse game at Memorial Field",
              type: 'sports'
            }
          },
          {
            title: 'Dr. Peterson Checkup',
            start: '2025-07-18T14:30:00',
            end: '2025-07-18T15:30:00',
            backgroundColor: '#3b82f6',
            borderColor: '#3b82f6',
            extendedProps: {
              description: "Annual physical exam with pediatrician",
              type: 'medical'
            }
          },
          {
            title: 'PTA Meeting',
            start: '2025-07-20T19:00:00',
            end: '2025-07-20T20:30:00',
            backgroundColor: '#8b5cf6',
            borderColor: '#8b5cf6',
            extendedProps: {
              description: "Monthly parent-teacher association meeting",
              type: 'school'
            }
          },
          {
            title: 'Client Strategy Call',
            start: '2025-07-16T08:00:00',
            end: '2025-07-16T09:00:00',
            backgroundColor: '#dc2626',
            borderColor: '#dc2626',
            extendedProps: {
              description: "Early morning strategy session with key client",
              type: 'work'
            }
          }
        ],
        eventClick: function(info) {
          console.log('🎯 Event clicked:', info.event.title);
          // Prevent any other click handlers from firing
          info.jsEvent.stopPropagation();
          info.jsEvent.preventDefault();
          showEventModal(info.event);
          return false;
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
      
      // Auto-load Google Calendar events after calendar is initialized
      setTimeout(async () => {
        try {
          console.log('📅 Auto-loading Google Calendar events...');
          await window.loadGoogleCalendarEvents();
          console.log('✅ Google Calendar events auto-loaded successfully');
          
          // Also get intelligence insights
          await window.getCalendarIntelligence();
          console.log('✅ Calendar intelligence loaded successfully');
        } catch (error) {
          console.log('📅 Google Calendar not yet connected or authorized');
          console.log('💡 Click "Sync Google Calendar" to connect your calendar');
        }
      }, 1500); // Give calendar time to fully render first
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

    // FUTURE OF CALENDARS: Intelligent Event Analysis & Reframing
    function analyzeEventContext(event) {
      const title = event.title.toLowerCase();
      const description = (event.extendedProps?.description || '').toLowerCase();
      const timeOfDay = new Date(event.start).getHours();
      const dayOfWeek = new Date(event.start).getDay();
      
      // SMART CONTEXT DETECTION
      const contexts = {
        birthday: /birthday|bday|b-day|party.*birthday|turning \d+/i.test(title + ' ' + description),
        sports: /soccer|football|basketball|lacrosse|tennis|baseball|game|practice|tournament/i.test(title + ' ' + description),
        medical: /doctor|dentist|appointment|checkup|physical|vaccine|medical/i.test(title + ' ' + description),
        school: /school|pta|teacher|conference|pickup|dropoff|field trip/i.test(title + ' ' + description),
        work: /meeting|call|conference|presentation|deadline|client/i.test(title + ' ' + description),
        social: /dinner|lunch|coffee|drinks|date|hangout|gathering/i.test(title + ' ' + description),
        travel: /flight|airport|trip|vacation|hotel|travel/i.test(title + ' ' + description),
        maintenance: /repair|service|maintenance|cleaning|installation/i.test(title + ' ' + description)
      };
      
      return { contexts, timeOfDay, dayOfWeek, title, description };
    }

    // FUTURE OF CALENDARS: Proactive AI Insights with Mel Robbins + Malcolm Gladwell Reframing
    function generateIntelligentReframe(event) {
      const analysis = analyzeEventContext(event);
      const { contexts, timeOfDay, dayOfWeek } = analysis;
      
      // BIRTHDAY PARTY INTELLIGENCE
      if (contexts.birthday) {
        const ageMatch = event.title.match(/(\d+)/);
        const age = ageMatch ? parseInt(ageMatch[1]) : null;
        
        if (age && age <= 12) {
          return {
            reframe: "Kids' birthday parties are networking events for parents. The gift matters less than showing up consistently. Your presence teaches your child how to honor friendships.",
            actions: [
              { text: "🎁 Gift Ideas for Age " + age, type: "gift_suggestions", priority: "high" },
              { text: "📸 Bring camera/phone charger", type: "reminder", priority: "medium" },
              { text: "💝 RSVP deadline check", type: "deadline", priority: "high" }
            ],
            insight: "Malcolm Gladwell would say: Small gestures compound into social capital. This isn't just a party—it's investing in your child's community."
          };
        } else if (age && age >= 13) {
          return {
            reframe: "Teen birthdays are about belonging, not gifts. Your job: facilitate connection, step back from control. They're learning to host their own life.",
            actions: [
              { text: "💬 Ask what they actually want", type: "communication", priority: "high" },
              { text: "🚗 Transportation plan", type: "logistics", priority: "medium" }
            ],
            insight: "Mel Robbins truth: You can't engineer their social life. You can just show up when it matters."
          };
        }
      }
      
      // SPORTS EVENT INTELLIGENCE  
      if (contexts.sports) {
        return {
          reframe: "Sports events are disguised lessons in resilience. Win or lose, your kid is learning how effort translates to outcome. Your energy sets their relationship with competition.",
          actions: [
            { text: "🚗 Carpool coordination check", type: "logistics", priority: "high" },
            { text: "⚽ Equipment check (cleats, water, snacks)", type: "preparation", priority: "medium" },
            { text: "📱 Other parents contact info", type: "networking", priority: "low" },
            { text: "🌧️ Weather backup plan", type: "contingency", priority: "medium" }
          ],
          insight: "Andrew Huberman science: Physical challenges rewire the brain for stress tolerance. This game is building their nervous system for life."
        };
      }
      
      // MEDICAL APPOINTMENT INTELLIGENCE
      if (contexts.medical) {
        return {
          reframe: "Medical appointments are data collection, not judgment day. You're the CEO of your family's health—gather intel, ask questions, advocate without apology.",
          actions: [
            { text: "📋 List current symptoms/questions", type: "preparation", priority: "high" },
            { text: "💊 Bring current medications list", type: "documentation", priority: "high" },
            { text: "📱 Insurance card & ID ready", type: "logistics", priority: "medium" },
            { text: "⏰ Plan for wait time (book/activity)", type: "self_care", priority: "low" }
          ],
          insight: "Cheryl Strayed wisdom: You don't have to be the perfect patient. You just have to be the persistent advocate."
        };
      }
      
      // SCHOOL EVENT INTELLIGENCE
      if (contexts.school) {
        return {
          reframe: "School events are intelligence gathering missions. You're not just supporting your kid—you're building relationships that make the whole system work better for everyone.",
          actions: [
            { text: "📝 Questions for teacher prepared", type: "preparation", priority: "medium" },
            { text: "📧 Follow-up email drafted", type: "communication", priority: "low" },
            { text: "👥 Connect with other parents", type: "networking", priority: "medium" }
          ],
          insight: "Malcolm Gladwell insight: Schools are complex adaptive systems. Your engagement creates ripple effects beyond your child."
        };
      }
      
      // WORK MEETING INTELLIGENCE
      if (contexts.work) {
        const isEarlyMorning = timeOfDay < 9;
        const isLateDay = timeOfDay > 17;
        
        return {
          reframe: isEarlyMorning 
            ? "Early meetings are power moves—you're buying focus before the world wakes up. Your brain is sharpest now. Use it."
            : isLateDay 
            ? "Late meetings test boundaries. Either this is urgent or someone's poor planning became your problem. Know the difference."
            : "Mid-day meetings interrupt deep work. Make them count by being the most prepared person in the room.",
          actions: [
            { text: "📊 Key points prepared", type: "preparation", priority: "high" },
            { text: "⏰ Calendar block post-meeting", type: "time_management", priority: "medium" },
            { text: "🎯 Desired outcome defined", type: "strategy", priority: "high" }
          ],
          insight: "Cal Newport principle: Meetings are expensive. Make sure the return on attention is worth the cognitive cost."
        };
      }
      
      // DEFAULT INTELLIGENT REFRAME
      return {
        reframe: "Every commitment is a choice about who you're becoming. This event matters because you decided it matters. Own that decision fully.",
        actions: [
          { text: "⚡ Energy check: Are you showing up fully?", type: "mindset", priority: "medium" },
          { text: "🎯 Intention setting: What's your why?", type: "reflection", priority: "low" }
        ],
        insight: "Mel Robbins truth: You don't have to love it. You just have to show up like the person you want to become would show up."
      };
    }

    // Event Modal Functions - Updated for slide-over style
    function showEventModal(event) {
      console.log('📅 Opening intelligent slide-over for:', event.title);
      
      const modal = document.getElementById('eventModal');
      const titleEl = document.getElementById('modalEventTitle');
      const timeEl = document.getElementById('modalEventTime');
      const reframeEl = document.getElementById('modalEventReframe');
      const actionsEl = document.getElementById('modalEventActions');
      const insightEl = document.getElementById('modalEventInsight');
      
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
      
      // FUTURE OF CALENDARS: Generate intelligent reframe and actions
      const intelligence = generateIntelligentReframe(event);
      
      // Set reframe content
      reframeEl.textContent = intelligence.reframe;
      
      // Add actionable intelligence if actions container exists
      if (actionsEl && intelligence.actions) {
        actionsEl.innerHTML = intelligence.actions.map(action => `
          <div class="action-item" style="
            display: flex; 
            align-items: center; 
            gap: 0.75rem; 
            padding: 0.75rem; 
            background: ${action.priority === 'high' ? 'rgba(220, 38, 38, 0.05)' : action.priority === 'medium' ? 'rgba(139, 92, 246, 0.05)' : 'rgba(107, 114, 128, 0.05)'}; 
            border-radius: 0.5rem; 
            border-left: 3px solid ${action.priority === 'high' ? '#dc2626' : action.priority === 'medium' ? '#8b5cf6' : '#6b7280'};
            cursor: pointer;
            transition: all 0.2s;
          " onclick="handleActionClick('${action.type}', '${action.text}')">
            <span style="flex: 1; font-size: 0.875rem; font-weight: 500;">${action.text}</span>
            <div style="
              width: 0.5rem; 
              height: 0.5rem; 
              border-radius: 50%; 
              background: ${action.priority === 'high' ? '#dc2626' : action.priority === 'medium' ? '#8b5cf6' : '#6b7280'};
            "></div>
          </div>
        `).join('');
      }
      
      // Add insight if insight container exists
      if (insightEl && intelligence.insight) {
        insightEl.innerHTML = `
          <div style="
            font-style: italic; 
            color: #6b7280; 
            font-size: 0.875rem; 
            line-height: 1.5;
            padding: 1rem;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 0.75rem;
            border: 1px solid #e2e8f0;
          ">
            💡 ${intelligence.insight}
          </div>
        `;
      }
      
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
      
      console.log('✅ Intelligent slide-over opened successfully');
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

    // FUTURE OF CALENDARS: Handle intelligent action clicks
    function handleActionClick(actionType, actionText) {
      console.log('🎯 Action clicked:', actionType, actionText);
      
      switch(actionType) {
        case 'gift_suggestions':
          // Future: Open gift suggestion modal or redirect to curated gift ideas
          alert('🎁 Gift Suggestions: Opening personalized recommendations...\n\n(Future: AI-curated gift ideas based on age, interests, and budget)');
          break;
        case 'logistics':
          // Future: Open logistics helper (carpool coordination, weather check, etc.)
          alert('🚗 Logistics Helper: Coordinating details...\n\n(Future: Auto-check carpool groups, weather, and send coordination texts)');
          break;
        case 'preparation':
          // Future: Create preparation checklist
          alert('📋 Preparation Mode: Creating your checklist...\n\n(Future: Smart checklists based on event type and your history)');
          break;
        case 'communication':
          // Future: Draft suggested messages or emails
          alert('💬 Communication Assistant: Drafting message...\n\n(Future: AI-generated context-appropriate messages)');
          break;
        case 'self_care':
          // Future: Self-care recommendations
          alert('🧘 Self-Care Mode: Preparing you for success...\n\n(Future: Personalized energy management and prep suggestions)');
          break;
        default:
          alert('🚀 Smart Action: ' + actionText + '\n\n(Future: Context-aware assistance for every life situation)');
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
        addEventListener('click', handleAddEvent);
        console.log('✅ Add Event button listener attached');
      }
      
      // Clear All button functionality
      const clearAllBtn = document.getElementById('clearAllBtn');
      if (clearAllBtn) {
        clearAllBtn.removeEventListener('click', handleClearAll);
        clearAllBtn.addEventListener('click', handleClearAll);
        console.log('✅ Clear All button listener attached');
      }
      
      // Google Calendar Sync button functionality
      const syncGoogleCalendarBtn = document.getElementById('syncGoogleCalendarBtn');
      if (syncGoogleCalendarBtn) {
        syncGoogleCalendarBtn.removeEventListener('click', handleGoogleCalendarSync);
        syncGoogleCalendarBtn.addEventListener('click', handleGoogleCalendarSync);
        console.log('✅ Google Calendar Sync button listener attached');
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

    async function handleGoogleCalendarSync() {
      const syncBtn = document.getElementById('syncGoogleCalendarBtn');
      
      if (!syncBtn) return;
      
      // Show loading state
      const originalText = syncBtn.innerHTML;
      syncBtn.innerHTML = '<i data-lucide="loader-2" style="width: 1rem; height: 1rem; animation: spin 1s linear infinite;"></i> Syncing...';
      syncBtn.disabled = true;
      
      try {
        // First, try to sync with Google Calendar
        await window.syncGoogleCalendar();
        
        // Then load the events into the calendar
        await window.loadGoogleCalendarEvents();
        
        // Get intelligence insights
        await window.getCalendarIntelligence();
        
        // Show success state
        syncBtn.innerHTML = '<i data-lucide="check" style="width: 1rem; height: 1rem;"></i> Synced!';
        syncBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        
        // Reset button after 3 seconds
        setTimeout(() => {
          syncBtn.innerHTML = originalText;
          syncBtn.style.background = 'linear-gradient(135deg, #4285f4 0%, #1a73e8 100%)';
          syncBtn.disabled = false;
          
          // Re-initialize Lucide icons
          if (window.lucide) {
            window.lucide.createIcons();
          }
        }, 3000);
        
      } catch (error) {
        console.error('❌ Calendar sync failed:', error);
        
        // Show error state
        syncBtn.innerHTML = '<i data-lucide="alert-circle" style="width: 1rem; height: 1rem;"></i> Failed';
        syncBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        
        // If not authenticated, show connect option
        if (error.message.includes('authentication') || error.message.includes('authorization')) {
          setTimeout(() => {
            syncBtn.innerHTML = '<i data-lucide="link" style="width: 1rem; height: 1rem;"></i> Connect Google';
            syncBtn.style.background = 'linear-gradient(135deg, #4285f4 0%, #1a73e8 100%)';
            syncBtn.disabled = false;
            
            // Change click handler to connect instead of sync
            syncBtn.onclick = () => {
              window.location.href = '/auth/google';
            };
            
            if (window.lucide) {
              window.lucide.createIcons();
            }
          }, 2000);
        } else {
          // Reset button after 3 seconds for other errors
          setTimeout(() => {
            syncBtn.innerHTML = originalText;
            syncBtn.style.background = 'linear-gradient(135deg, #4285f4 0%, #1a73e8 100%)';
            syncBtn.disabled = false;
            
            if (window.lucide) {
              window.lucide.createIcons();
            }
          }, 3000);
        }
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
      if (isMobile && currentView !== 'listMonth') {
        window.calendar.changeView('listMonth');
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
      if (isMobile && window.calendar.view.type !== 'listMonth') {
        window.calendar.changeView('listMonth');
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

// ================================
// 📅 GOOGLE CALENDAR INTEGRATION
// ================================

// Global calendar integration functions
window.syncGoogleCalendar = async function() {
  console.log('🔄 Starting Google Calendar sync...');
  
  const userId = localStorage.getItem('user_email') || 'test_user';
  
  try {
    const response = await fetch('/api/calendar/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        syncDays: 30
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Calendar sync successful:', result);
      
      // Show success notification
      showNotification(`📅 Synced ${result.syncedEvents} calendar events for AI intelligence!`, 'success');
      
      // Reload calendar to show synced events
      if (window.loadGoogleCalendarEvents) {
        await window.loadGoogleCalendarEvents();
      }
      
      // Refresh the calendar view
      if (window.calendar && window.calendar.refetchEvents) {
        window.calendar.refetchEvents();
      }
      
      return result;
    } else {
      throw new Error(result.error || 'Calendar sync failed');
    }
  } catch (error) {
    console.error('❌ Calendar sync error:', error);
    showNotification('❌ Calendar sync failed. Please reconnect your Google account.', 'error');
    throw error;
  }
};

// Load Google Calendar events for the intelligent calendar
window.loadGoogleCalendarEvents = async function() {
  console.log('📅 Loading Google Calendar events...');
  
  const userId = localStorage.getItem('user_email') || 'test_user';
  
  try {
    // Get upcoming events for the next 30 days
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const response = await fetch(`/api/calendar/events?user_id=${encodeURIComponent(userId)}&timeMin=${new Date().toISOString()}&timeMax=${thirtyDaysFromNow}&maxResults=100`);
    
    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.needsReauth) {
        console.log('🔄 Calendar authorization expired, showing reauth option');
        showCalendarReauthPrompt();
        return [];
      }
      throw new Error(errorData.error || 'Failed to load calendar events');
    }

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Loaded ${result.events.length} Google Calendar events`);
      
      // Transform events for FullCalendar
      const calendarEvents = result.events.map(event => ({
        id: event.googleEventId,
        title: event.title,
        start: event.start,
        end: event.end,
        description: event.description,
        location: event.location,
        allDay: event.isAllDay,
        backgroundColor: '#4285f4', // Google blue
        borderColor: '#4285f4',
        textColor: '#ffffff',
        extendedProps: {
          source: 'google_calendar',
          organizer: event.organizer,
          attendees: event.attendees,
          htmlLink: event.htmlLink,
          status: event.status
        }
      }));
      
      // Store events globally for calendar access
      window.googleCalendarEvents = calendarEvents;
      
      // Merge with existing sample events if calendar exists
      if (window.calendar) {
        // Remove existing Google Calendar events
        const existingEvents = window.calendar.getEvents();
        existingEvents.forEach(event => {
          if (event.extendedProps?.source === 'google_calendar') {
            event.remove();
          }
        });
        
        // Add new Google Calendar events
        calendarEvents.forEach(event => {
          window.calendar.addEvent(event);
        });
        
        console.log('✅ Calendar updated with Google events');
      }
      
      return calendarEvents;
    } else {
      throw new Error(result.error || 'Failed to load calendar events');
    }
  } catch (error) {
    console.error('❌ Error loading Google Calendar events:', error);
    showNotification('❌ Failed to load Google Calendar events', 'error');
    return [];
  }
};

// Get calendar intelligence and insights
window.getCalendarIntelligence = async function() {
  console.log('🧠 Analyzing calendar intelligence...');
  
  const userId = localStorage.getItem('user_email') || 'test_user';
  
  try {
    const response = await fetch(`/api/calendar/intelligence?user_id=${encodeURIComponent(userId)}&days=90`);
    
    if (!response.ok) {
      throw new Error('Failed to get calendar intelligence');
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('🧠 Calendar intelligence loaded:', result.intelligence);
      
      // Store intelligence globally
      window.calendarIntelligence = result.intelligence;
      
      // Update calendar insights bar if it exists
      updateCalendarInsights(result.intelligence);
      
      return result.intelligence;
    } else {
      throw new Error(result.error || 'Failed to analyze calendar intelligence');
    }
  } catch (error) {
    console.error('❌ Error getting calendar intelligence:', error);
    return null;
  }
};

// Show calendar reauth prompt
function showCalendarReauthPrompt() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-md mx-4">
      <h3 class="text-xl font-semibold mb-4">📅 Calendar Access Expired</h3>
      <p class="text-gray-600 mb-6">Your Google Calendar access has expired. Please reconnect to continue syncing your calendar events for AI intelligence.</p>
      <div class="flex space-x-3">
        <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
          Later
        </button>
        <button onclick="reconnectGoogleAccount()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Reconnect Google
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Update calendar insights bar with intelligence data
function updateCalendarInsights(intelligence) {
  const insightsBar = document.querySelector('.calendar-insights-bar');
  if (!insightsBar) return;
  
  const insights = intelligence.insights || [];
  const totalEvents = intelligence.averageEventsPerWeek || 0;
  
  let insightsHTML = `
    <div class="intelligence-summary">
      <div class="stat">
        <span class="stat-number">${totalEvents}</span>
        <span class="stat-label">Events/Week</span>
      </div>
  `;
  
  // Add event type breakdown
  const eventTypes = intelligence.eventTypes || {};
  const topEventType = Object.keys(eventTypes).reduce((a, b) => eventTypes[a] > eventTypes[b] ? a : b, 'mixed');
  
  if (topEventType !== 'mixed') {
    insightsHTML += `
      <div class="stat">
        <span class="stat-number">${eventTypes[topEventType]}</span>
        <span class="stat-label">${topEventType} events</span>
      </div>
    `;
  }
  
  insightsHTML += '</div>';
  
  // Add insights
  if (insights.length > 0) {
    insightsHTML += `
      <div class="intelligence-insights">
        <h4>🧠 AI Insights</h4>
        <ul>
          ${insights.slice(0, 2).map(insight => `<li>${insight}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  insightsBar.innerHTML = insightsHTML;
}

// Initialize calendar integration when page loads
function initializeCalendarIntegration() {
  console.log('📅 Initializing Google Calendar integration...');
  
  // Auto-sync calendar when calendar view is activated
  if (window.location.hash === '#calendar' || window.location.pathname.includes('calendar')) {
    setTimeout(async () => {
      try {
        await window.loadGoogleCalendarEvents();
        await window.getCalendarIntelligence();
      } catch (error) {
        console.log('📅 Calendar integration not yet authorized');
      }
    }, 1000);
  }
}

// Enhanced notification system
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelector('.calendar-notification');
  if (existing) {
    existing.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `calendar-notification fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 max-w-md`;
  
  const colors = {
    success: 'bg-green-100 border border-green-400 text-green-700',
    error: 'bg-red-100 border border-red-400 text-red-700',
    info: 'bg-blue-100 border border-blue-400 text-blue-700'
  };
  
  notification.className += ` ${colors[type] || colors.info}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCalendarIntegration);
} else {
  initializeCalendarIntegration();
}

// MOBILE CALENDAR FIX: Force calendar to render on mobile
function forceMobileCalendarRender() {
  if (window.innerWidth <= 768 && window.calendar) {
    console.log("🔧 Forcing mobile calendar render...");
    
    // Force calendar to be visible
    const calendarEl = document.getElementById('calendar');
    if (calendarEl) {
      calendarEl.style.display = 'block';
      calendarEl.style.visibility = 'visible';
      calendarEl.style.opacity = '1';
    }
    
    // Force list view
    if (window.calendar.view.type !== 'listMonth') {
      window.calendar.changeView('listMonth');
    }
    
    // Force render
    window.calendar.render();
    window.calendar.updateSize();
    
    console.log("✅ Mobile calendar render complete");
  }
}

// SAFARI MOBILE FIX: Additional checks for Safari
function safariMobileCalendarFix() {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isMobile = window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isSafari && isMobile) {
    console.log("🍎 Safari mobile detected, applying fixes...");
    
    // Ensure calendar view is active and visible
    const calendarView = document.getElementById('calendar-view');
    const calendarEl = document.getElementById('calendar');
    
    if (calendarView && calendarView.classList.contains('active')) {
      if (calendarEl) {
        // Force display and layout
        calendarEl.style.display = 'block !important';
        calendarEl.style.visibility = 'visible !important';
        calendarEl.style.opacity = '1 !important';
        calendarEl.style.height = 'auto !important';
        calendarEl.style.minHeight = '400px !important';
        calendarEl.style.width = '100% !important';
        calendarEl.style.maxWidth = '100% !important';
        
        // Force FullCalendar to initialize if it hasn't
        if (!window.calendar && !window.calendarRendered && typeof FullCalendar !== 'undefined') {
          console.log("🔧 Initializing calendar for Safari mobile...");
          renderCalendar();
        }
        
        // Force list view for mobile
        if (window.calendar) {
          setTimeout(() => {
            if (window.calendar.view.type !== 'listMonth') {
              window.calendar.changeView('listMonth');
            }
            window.calendar.render();
            window.calendar.updateSize();
          }, 500);
        }
      }
    }
  }
}

// Run mobile fix on load and resize
setTimeout(forceMobileCalendarRender, 1000);
setTimeout(safariMobileCalendarFix, 1500);
window.addEventListener('resize', forceMobileCalendarRender);
window.addEventListener('resize', safariMobileCalendarFix);

// Also run when calendar view is activated
const originalActivateView = window.activateView;
if (originalActivateView) {
  window.activateView = function(viewId) {
    originalActivateView(viewId);
    if (viewId === 'calendar') {
      setTimeout(safariMobileCalendarFix, 300);
    }
  };
}

