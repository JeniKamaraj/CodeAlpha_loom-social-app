const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('loom_token');
}

function getUser() {
  const raw = localStorage.getItem('loom_user');
  return raw ? JSON.parse(raw) : null;
}

function setSession(token, user) {
  localStorage.setItem('loom_token', token);
  localStorage.setItem('loom_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('loom_token');
  localStorage.removeItem('loom_user');
}

function requireLogin() {
  if (!getToken()) {
    window.location.href = 'index.html';
  }
}

async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const isAuthRoute = path === '/auth/login' || path === '/auth/register';
    if (res.status === 401 && !isAuthRoute) {
      clearSession();
      window.location.href = 'index.html';
    }
    throw new Error(data.error || 'Something went wrong.');
  }

  return data;
}

function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString();
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderTopbar(activePage) {
  const user = getUser();
  const el = document.getElementById('topbar');
  if (!el) return;

  el.innerHTML = `
    <div class="wordmark"><span class="thread-dot">•</span>Loom</div>
    <nav>
      <a href="feed.html" class="${activePage === 'feed' ? 'active' : ''}">Feed</a>
      <a href="feed.html?tab=explore" class="${activePage === 'explore' ? 'active' : ''}">Explore</a>
      <a href="profile.html?u=${user ? user.username : ''}" class="${activePage === 'profile' ? 'active' : ''}">Profile</a>
      <button class="signout" id="signout-btn">Sign out</button>
    </nav>
  `;

  document.getElementById('signout-btn').addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });
}
