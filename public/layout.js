document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons(); // Render sidebar icons

  const views = document.querySelectorAll(".view");
  const navButtons = document.querySelectorAll(".nav-item");
  const toggleTheme = document.getElementById("toggleTheme");

  function activateView(targetView) {
    // Show only the selected view
    views.forEach((view) => {
      const viewName = view.id.replace("-view", "");
      view.classList.toggle("active", viewName === targetView);
    });

    // Highlight the active nav button
    navButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-view") === targetView);
    });

    // Load dashboard data
    if (targetView === "dashboard") {
      fetch("/api/dashboard?user_id=user_123")
        .then(res => res.json())
        .then(data => {
          // Panel 2 — Mental Load
          document.querySelector(".dashboard-card:nth-child(2) ul").innerHTML = `
            <li>You're tracking ${data.totalTasks} tasks</li>
            <li>(Data from recent messages)</li>
          `;

          // Panel 3 — Recurring Threads
          const themeHTML = data.topThemes.map(t => `<li>🔁 ${t}</li>`).join("");
          document.querySelector(".dashboard-card:nth-child(3) ul").innerHTML = themeHTML;
        })
        .catch((err) => {
          console.error("Dashboard fetch error:", err);
        });
    }

    // Load calendar only once when calendar view is shown
    if (targetView === "calendar" && !window.calendarRendered) {
      console.log("📅 Rendering calendar...");

      const calendarEl = document.getElementById("calendar");
      if (calendarEl) {
        const calendar = new FullCalendar.Calendar(calendarEl, {
          initialView: "dayGridMonth",
          height: 600,
          headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay"
          },
          events: [
            {
              title: "✅ Calendar Loaded!",
              start: new Date().toISOString().split("T")[0]
            }
          ],
          dateClick: function (info) {
            const title = prompt("Add an event:");
            if (title) {
              calendar.addEvent({
                title,
                start: info.dateStr,
                allDay: true
              });
            }
          }
        });

        calendar.render();
        window.calendarRendered = true;
      } else {
        console.warn("⚠️ #calendar element not found.");
      }
    }
  }

  // Set default view to chat
  activateView("chat");

  // Hook up sidebar buttons
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-view");
      activateView(target);
    });
  });

  // Dark mode toggle
  if (toggleTheme) {
    toggleTheme.addEventListener("click", () => {
      document.body.classList.toggle("dark");
    });
  }
});
