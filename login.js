// Simple login logic using localStorage (no backend)

const loginForm = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');
const signupLink = document.getElementById('signupLink');

// Check if a default user exists, if not create one (demo purpose)
if (!localStorage.getItem('ssai_user')) {
  localStorage.setItem('ssai_user', JSON.stringify({
    username: 'demo',
    password: '1234'
  }));
}

loginForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  const savedUser = JSON.parse(localStorage.getItem('ssai_user'));

  if (username === savedUser.username && password === savedUser.password) {
    errorMsg.textContent = '';
    localStorage.setItem('ssai_loggedIn', 'true');
    window.location.href = 'index.html';
  } else {
    errorMsg.textContent = 'Invalid username or password. Try again.';
  }
});

