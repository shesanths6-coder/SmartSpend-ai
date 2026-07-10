// ---------- Dark/Light Theme Toggle ----------
const themeToggle = document.getElementById('themeToggle');

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.textContent = '☀️';
  } else {
    document.body.classList.remove('light-mode');
    themeToggle.textContent = '🌙';
  }
}

const savedTheme = localStorage.getItem('ssai_theme') || 'dark';
applyTheme(savedTheme);

themeToggle.addEventListener('click', function () {
  const current = localStorage.getItem('ssai_theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('ssai_theme', next);
  applyTheme(next);
});