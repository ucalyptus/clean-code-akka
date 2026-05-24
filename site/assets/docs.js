const menuButton = document.querySelector("[data-menu-button]");
const navLinks = [...document.querySelectorAll("[data-nav-link]")];
const searchInput = document.querySelector("[data-search]");
const copyButtons = [...document.querySelectorAll("[data-copy]")];

menuButton?.addEventListener("click", () => {
  document.body.classList.toggle("nav-open");
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
  });
});

searchInput?.addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  let visibleCount = 0;

  navLinks.forEach((link) => {
    const text = link.textContent.toLowerCase();
    const visible = query.length === 0 || text.includes(query);
    link.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  document.body.classList.toggle("searching", query.length > 0 && visibleCount === 0);
});

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const code = button.parentElement?.querySelector("code")?.innerText ?? "";
    await navigator.clipboard.writeText(code);
    const original = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = original;
    }, 1100);
  });
});
