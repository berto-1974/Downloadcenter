document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;

  function updateIcon() {
    const theme = document.documentElement.getAttribute('data-bs-theme');
    btn.innerHTML = theme === 'dark'
      ? '<i class="bi bi-sun-fill"></i>'
      : '<i class="bi bi-moon-stars-fill"></i>';
    btn.title = theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren';
  }

  updateIcon();

  btn.addEventListener('click', function () {
    const next = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-bs-theme', next);
    localStorage.setItem('theme', next);
    updateIcon();
  });
});
