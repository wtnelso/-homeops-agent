document.addEventListener("DOMContentLoaded", () => {
  window.calendar = null;
  window.calendarRendered = false;

  lucide.createIcons();

  const views = document.querySelectorAll(".view");
  const navButtons = document.querySelectorAll(".nav-item");
  const toggleTheme = document.getElementById("toggleTheme");
function activateView(viewId) {
  console.log("🔄 Switching to view:", viewId);

  document.querySelectorAll(".view").forEach((view) => {
    view.classList.add("hidden");
  });

  const active = document.getElementById(`${viewId}-view`);
  if (active) {
    active.classList.remove("hidden");
    console.log("✅ Activated view:", viewId);
  } else {
    console.warn("🚫 View not found:", viewId);
  }
}

// ✅ Expose it globally for inline onclick to work
window.activateView = activateView;


// Set up navigation + highlight active nav button
navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const viewId = button.getAttribute("data-view");
    activateView(viewId);

    // Highlight the active button
    navButtons.forEach((btn) => {
      const isActive = btn.getAttribute("data-view") === viewId;
      btn.classList.toggle("active", isActive);
    });
  });
});


    // Highlight the active button
    navButtons.forEach((btn) => {
      const isActive = btn.getAttribute("data-view") === viewId;
      btn.classList.toggle("active", isActive);
    });
  });
});



    // Load dashboard if needed
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
          document.querySelector(".dashboard-card:nth-child(3) .reframe-list").innerHTML = themeHTML;
        })
        .catch((err) => {
          console.error("Dashboard fetch error:", err);
        });
    }

    // Load calendar if not already rendered
    if (targetView === "calendar" && !window.calendarRendered) {
      const calendarEl = document.getElementById("calendar");
      if (!calendarEl) {
        console.warn("⚠️ #calendar element not found.");
        return;
      }

      if (typeof FullCalendar === "undefined" || typeof FullCalendar.Calendar !== "function") {
        console.error("❌ FullCalendar not loaded.");
        return;
      }

   window.calendar = new FullCalendar.Calendar(calendarEl, {
  initialView: "dayGridMonth",
  height: 600,
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,timeGridDay"
  },
  events: [],
  eventDisplay: "block",
  dateClick: function (info) {
    const title = prompt("Add an event:");
    if (title) {
      window.calendar.addEvent({
        title,
        start: info.dateStr,
        allDay: true
      });
    }
  },
eventDidMount: function(info) {
  const card = document.createElement("div");
  card.className = "hover-card";
  card.innerHTML = `
    <div class="hover-card-title">${info.event.title || "Untitled Event"}</div>
    <div class="hover-card-time">${info.event.start?.toLocaleString() || "Time not available"}</div>
  `;

  document.body.appendChild(card);

  function moveCard(e) {
    card.style.top = `${e.pageY + 12}px`;
    card.style.left = `${e.pageX + 12}px`;
  }

  info.el.addEventListener("mouseenter", (e) => {
    card.style.display = "block";
    card.style.opacity = "1";
    moveCard(e);
  });

  info.el.addEventListener("mousemove", moveCard);

  info.el.addEventListener("mouseleave", () => {
    card.style.opacity = "0";
    card.style.display = "none";
  });
}



      window.calendar.render();
      window.calendarRendered = true;
      console.log("✅ Calendar initialized");

      // ✅ Inject any queued events now that calendar is ready
      if (window.pendingCalendarEvents?.length) {
        window.pendingCalendarEvents.forEach((event) => {
          const injected = window.calendar.addEvent(event);
          highlightCalendarEvent?.(injected);
          console.log("🗓️ Event added from queue:", event);
        });
        window.pendingCalendarEvents = [];
      }
    }
  }

 

  // Default to chat view
  activateView("chat");

  // Dark mode toggle
  if (toggleTheme) {
    toggleTheme.addEventListener("click", () => {
      document.body.classList.toggle("dark");
    });
  }
});
