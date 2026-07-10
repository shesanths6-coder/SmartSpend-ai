// Signup logic using localStorage (no backend)

const signupForm = document.getElementById('signupForm');
const signupError = document.getElementById('signupError');

signupForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const username = document.getElementById('newUsername').value.trim();
  const password = document.getElementById('newPassword').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();

  if (username.length < 3) {
    signupError.textContent = 'Username must be at least 3 characters.';
    return;
  }

  if (password.length < 4) {
    signupError.textContent = 'Password must be at least 4 characters.';
    return;
  }

  if (password !== confirmPassword) {
    signupError.textContent = 'Passwords do not match.';
    return;
  }

  // Save new user (overwrites demo user - single-user local storage demo)
  localStorage.setItem('ssai_user', JSON.stringify({
    username: username,
    password: password
  }));

  signupError.style.color = '#2ecfb2';
  signupError.textContent = 'Account created! Redirecting to login...';

  setTimeout(function () {
    window.location.href = 'login.html';
  }, 1500);
});