(async () => {
  if (location.pathname.endsWith("/login.html")) return;

  try {
    const response = await fetch("/api/session", { cache: "no-store" });
    const data = await response.json();

    if (!data.authenticated) {
      location.replace(`/login.html?next=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }

    document.body.classList.remove("auth-loading");
  } catch {
    location.replace(`/login.html?next=${encodeURIComponent(location.pathname + location.search)}`);
  }
})();

window.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#logoutApp")?.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    location.replace("/login.html");
  });
});
