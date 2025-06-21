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
        events: "/api/events",
      });

      window.calendar.render();
      window.calendarRendered = true;
      console.log("✅ Calendar initialized");
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
