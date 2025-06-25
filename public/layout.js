console.log("🧠 layout.js is loading");
document.addEventListener("DOMContentLoaded", () => {
  console.log("🧠 layout.js is loading");

  try {
    window.calendar = null;
    window.calendarRendered = false;

    lucide.createIcons();

    const views = document.querySelectorAll(".view");
    const navButtons = document.querySelectorAll(".nav-item");
    const bottomNavButtons = document.querySelectorAll(".bottom-nav button");
    const toggleTheme = document.getElementById("toggleTheme");

    function activateView(viewId) {
      console.log("🔄 Switching to view:", viewId);

      // Hide all views
      document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
      });
      // Show the selected view
      const activeView = document.getElementById(`${viewId}-view`);
      if (activeView) {
        activeView.classList.add('active');
      }
      // Update nav active state
      document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
      });

      // Handle calendar rendering
      if (viewId === "calendar" && !window.calendarRendered) {
        renderCalendar();
      }
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

    function renderCalendar() {
      const calendarEl = document.getElementById("calendar");
      if (!calendarEl || typeof FullCalendar === "undefined") {
        console.error("Calendar element or FullCalendar library not found.");
        return;
      }

      window.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        height: "auto",
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay"
        },
        events: "/api/events?user_id=user_123",
      });

      window.calendar.render();
      window.calendarRendered = true;
      console.log("✅ Calendar initialized");

      // Add any events that were created before the calendar was ready
      if (window.pendingCalendarEvents && window.pendingCalendarEvents.length > 0) {
        window.pendingCalendarEvents.forEach(event => {
          window.calendar.addEvent(event);
        });
        window.pendingCalendarEvents = []; // Clear the queue
        console.log("✅ Added pending events to calendar.");
      }
    }

    const clearEventsBtn = document.getElementById("clear-events-btn");
    if (clearEventsBtn) {
      clearEventsBtn.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to delete ALL your calendar events? This cannot be undone.")) {
          return;
        }
        try {
          const res = await fetch("/api/events/clear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: "user_123" }),
          });
          const result = await res.json();
          if (result.success) {
            alert("All events have been cleared.");
            if (window.calendar) {
              window.calendar.refetchEvents();
            }
          } else {
            alert("Error clearing events: " + result.error);
          }
        } catch (err) {
          alert("An error occurred while clearing events.");
          console.error("Clear events error:", err);
        }
      });
    }

    // On load, set chat view as active
    activateView('chat');

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

  } catch (err) {
    console.error("💥 layout.js crash:", err);
  }
});
