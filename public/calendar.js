document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) return; // ✅ Prevent crash if calendar div is not rendered yet

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    height: 600,
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay"
    },
    events: [],
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
});
