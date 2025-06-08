document.addEventListener("DOMContentLoaded", () => {
  const views = document.querySelectorAll(".view");
  const navButtons = document.querySelectorAll(".nav-item");

  navButtons.forEach(button => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-view");

      // Toggle active class on nav
      navButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      // Toggle visible view
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
