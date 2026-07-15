// If already logged in, skip straight to the feed.
if (getToken()) {
  window.location.href = 'feed.html';
}

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const errorBox = document.getElementById('error-box');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const showLoginWrap = document.getElementById('show-login-wrap');
const loginSwitchP = document.querySelector('.auth-switch');

function showError(message) {
  errorBox.innerHTML = `<div class="error-banner">${escapeHTML(message)}</div>`;
}

function clearError() {
  errorBox.innerHTML = '';
}

showRegisterLink.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.style.display = 'none';
  loginSwitchP.style.display = 'none';
  registerForm.style.display = 'block';
  showLoginWrap.style.display = 'block';
  clearError();
});

showLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  registerForm.style.display = 'none';
  showLoginWrap.style.display = 'none';
  loginForm.style.display = 'block';
  loginSwitchP.style.display = 'block';
  clearError();
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const data = await api('/auth/login', { method: 'POST', body: { username, password } });
    setSession(data.token, data.user);
    window.location.href = 'feed.html';
  } catch (err) {
    showError(err.message);
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const username = document.getElementById('reg-username').value.trim();
  const displayName = document.getElementById('reg-displayname').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: { username, displayName, email, password },
    });
    setSession(data.token, data.user);
    window.location.href = 'feed.html';
  } catch (err) {
    showError(err.message);
  }
});
