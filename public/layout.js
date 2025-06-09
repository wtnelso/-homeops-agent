document.addEventListener("DOMContentLoaded", () => {
  const views = document.querySelectorAll(".view");
  const navButtons = document.querySelectorAll(".nav-item");
  const toggleTheme = document.getElementById("toggleTheme");

  // Set default view
  const defaultView = "chat";

  // Show only default view on load
  views.forEach((view) => {
    const isActive = view.id === `${defaultView}-view`;
    view.classList.toggle("active", isActive);
  });

  navButtons.forEach((btn) => {
    const isActive = btn.getAttribute("data-view") === defaultView;
    btn.classList.toggle("active", isActive);
  });

  // Handle view switching
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-view");

      // Highlight active nav item
      navButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Show correct view
      views.forEach((view) => {
        const match = view.id === `${target}-view`;
        view.classList.toggle("active", match);
      });
    });
  });

  // Dark mode toggle
  if (toggleTheme) {
    toggleTheme.addEventListener("click", () => {
      document.body.classList.toggle("dark");
    });
  }
});
