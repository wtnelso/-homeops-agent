document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons(); // render sidebar icons

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

    // Load dashboard data if viewing dashboard
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

    // Load calendar if viewing calendar tab
    if (targetView === "calendar" && !window.calendarRendered) {
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
              title: 'Test Event',
              start: new Date().toISOString().split('T')[0]
            }
          ],
          dateClick: function(info) {
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
      }
    }
  }

  // Default view on load
  activateView("chat");

  // Sidebar navigation clicks
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-view");
      activateView(target);
    });
  });

  // Dark/light theme toggle
  if (toggleTheme) {
    toggleTheme.addEventListener("click", () => {
      document.body.classList.toggle("dark");
    });
  }
});
