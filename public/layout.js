document.addEventListener("DOMContentLoaded", () => {
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
          // Panel 1 — This Week
          const taskHTML = data.tasksThisWeek.map(item => `<li>📌 ${item}</li>`).join("");
          document.querySelector(".dashboard-card:nth-child(1) ul").innerHTML = taskHTML;

          // Panel 2 — Mental Load
          document.querySelector(".dashboard-card:nth-child(2) ul").innerHTML = `
            <li>You're tracking ${data.totalTasks} tasks</li>
            <li>(Data from recent messages)</li>
          `;

          // Panel 3 — Recurring Threads
          const themeHTML = data.topThemes.map(t => `<li>🔁 ${t}</li>`).join("");
          document.querySelector(".dashboard-card:nth-child(3) ul").innerHTML = themeHTML;

          // Panel 4 — Reframes
          const reframes = data.reframes || [];
          const reframeContainer = document.querySelector(".dashboard-card:nth-child(4) .reframe-list");
          if (reframeContainer) {
            reframeContainer.innerHTML = reframes.map(r => `
              <div class="reframe">
                <h4>${r.title}</h4>
                <p><em>${r.subtitle}</em></p>
                <p>${r.body}</p>
              </div>
            `).join("");
          }
        })
        .catch((err) => {
          console.error("Dashboard fetch error:", err);
        });
    }
  }

  // Set default view
  activateView("chat");

  // Handle sidebar clicks
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-view");
      activateView(target);
    });
  });

  // Theme toggle
  if (toggleTheme) {
    toggleTheme.addEventListener("click", () => {
      document.body.classList.toggle("dark");
    });
  }
});
