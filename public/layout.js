const views = document.querySelectorAll(".view");
const navButtons = document.querySelectorAll(".nav-icon");

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    const target = button.getAttribute("data-view");

    // Toggle active class on nav
    navButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    // Toggle visible view
    views.forEach(view => {
      view.classList.remove("active");
      if (view.id === `view-${target}`) {
        view.classList.add("active");
      }
    });
  });
});
