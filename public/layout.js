document.addEventListener("DOMContentLoaded", () => {
  const views = document.querySelectorAll(".view");
  const navButtons = document.querySelectorAll(".nav-item");

  // Set default view to chat
  const defaultView = "chat";

  // Apply default active state on page load
  views.forEach(view => {
    view.classList.toggle("active", view.id === `${defaultView}-view`);
  });

  navButtons.forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-view") === defaultView);
  });

  // Handle sidebar button clicks
  navButtons.forEach(button => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-view");

      // Toggle nav buttons
      navButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      // Toggle views
      views.forEach(view => {
        view.classList.toggle("active", view.id === `${target}-view`);
      });
    });
  });

  // Theme toggle
  const toggleTheme = document.getElementById("toggleTheme");
  if (toggleTheme) {
    toggleTheme.addEventListener("click", () => {
      document.body.classList.toggle("dark");
    });
  }
});
