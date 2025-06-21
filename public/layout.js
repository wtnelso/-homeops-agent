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

      views.forEach((view) => {
        view.style.display = "none";
      });

      const activeView = document.getElementById(`${viewId}-view`);
      if (activeView) {
        activeView.style.display = "block";
        console.log("✅ Activated view:", viewId);
      } else {
        console.warn("🚫 View not found:", viewId);
      }

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

        // Update active class for sidebar nav
        navButtons.forEach((btn) => {
          btn.classList.toggle("active", btn.getAttribute("data-view") === viewId);
        });
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

    // Default to chat view on load
    activateView("chat");
    document.querySelector('.nav-item[data-view="chat"]').classList.add("active");

    if (toggleTheme) {
      toggleTheme.addEventListener("click", () => {
        document.body.classList.toggle("dark");
      });
    }

  } catch (err) {
    console.error("💥 layout.js crash:", err);
  }
});
