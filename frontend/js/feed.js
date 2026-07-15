requireLogin();
renderTopbar('feed');

const postList = document.getElementById('post-list');
const composerInput = document.getElementById('composer-input');
const charCount = document.getElementById('char-count');
const postBtn = document.getElementById('post-btn');
const tabFollowing = document.getElementById('tab-following');
const tabExplore = document.getElementById('tab-explore');

attachPostInteractions(postList);

let currentTab = new URLSearchParams(window.location.search).get('tab') === 'explore' ? 'explore' : 'following';

function setActiveTab(tab) {
  currentTab = tab;
  tabFollowing.classList.toggle('active', tab === 'following');
  tabExplore.classList.toggle('active', tab === 'explore');
  loadFeed();
}

tabFollowing.addEventListener('click', () => setActiveTab('following'));
tabExplore.addEventListener('click', () => setActiveTab('explore'));

composerInput.addEventListener('input', () => {
  const len = composerInput.value.length;
  charCount.textContent = String(len);
  postBtn.disabled = len === 0 || len > 500;
});

postBtn.addEventListener('click', async () => {
  const content = composerInput.value.trim();
  if (!content) return;

  postBtn.disabled = true;
  try {
    await api('/posts', { method: 'POST', body: { content } });
    composerInput.value = '';
    charCount.textContent = '0';
    setActiveTab(currentTab);
  } catch (err) {
    alert(err.message);
    postBtn.disabled = false;
  }
});

async function loadFeed() {
  postList.innerHTML = '<div class="loading-state">loading thread…</div>';
  try {
    const endpoint = currentTab === 'explore' ? '/posts/explore' : '/posts/feed';
    const data = await api(endpoint);
    const emptyMessage = currentTab === 'explore'
      ? 'No one has posted yet — be the first.'
      : 'Follow people or post something to fill your feed. Try Explore to find others.';
    renderPosts(postList, data.posts, emptyMessage);
  } catch (err) {
    postList.innerHTML = `<div class="empty-state"><h3>Couldn't load posts</h3><p>${escapeHTML(err.message)}</p></div>`;
  }
}

setActiveTab(currentTab);
