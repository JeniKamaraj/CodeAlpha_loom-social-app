const HEART_OUTLINE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.6-10-9.3C.5 8 2 4.5 5.5 4c2.2-.3 4 .9 6.5 3.3C14.5 4.9 16.3 3.7 18.5 4 22 4.5 23.5 8 22 11.7 19.5 16.4 12 21 12 21z"/></svg>`;
const HEART_FILLED = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-10-9.3C.5 8 2 4.5 5.5 4c2.2-.3 4 .9 6.5 3.3C14.5 4.9 16.3 3.7 18.5 4 22 4.5 23.5 8 22 11.7 19.5 16.4 12 21 12 21z"/></svg>`;
const COMMENT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`;
const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/></svg>`;

function postCardHTML(post) {
  const me = getUser();
  const isOwn = me && post.author && (post.author._id === me.id || post.author.id === me.id);

  return `
  <div class="post-card" data-post-id="${post.id}">
    <div class="post-header">
      <div class="avatar" style="background:${post.author.avatarColor || '#E8A33D'}">${initials(post.author.displayName || post.author.username)}</div>
      <div>
        <a class="post-author-name" href="profile.html?u=${post.author.username}">${escapeHTML(post.author.displayName || post.author.username)}</a><br/>
        <span class="post-author-handle">@${escapeHTML(post.author.username)}</span>
      </div>
      <span class="post-time mono">${timeAgo(post.createdAt)}</span>
    </div>
    <div class="post-content">${escapeHTML(post.content)}</div>
    <div class="post-actions">
      <button class="action-btn like-btn ${post.likedByMe ? 'liked' : ''}" data-id="${post.id}">
        ${post.likedByMe ? HEART_FILLED : HEART_OUTLINE} <span class="like-count">${post.likeCount}</span>
      </button>
      <button class="action-btn comment-toggle-btn" data-id="${post.id}">
        ${COMMENT_ICON} <span class="comment-count">${post.commentCount}</span>
      </button>
      ${isOwn ? `<button class="action-btn delete-btn" data-id="${post.id}">${TRASH_ICON}</button>` : ''}
    </div>
    <div class="comments-section" id="comments-${post.id}" style="display:none">
      <div class="comment-list"></div>
      <form class="comment-form">
        <input type="text" placeholder="Write a comment…" maxlength="300" />
        <button type="submit">Reply</button>
      </form>
    </div>
  </div>`;
}

function renderPosts(containerEl, posts, emptyMessage) {
  if (!posts.length) {
    containerEl.innerHTML = `<div class="empty-state"><h3>Nothing here yet</h3><p>${escapeHTML(emptyMessage)}</p></div>`;
    return;
  }
  containerEl.innerHTML = posts.map(postCardHTML).join('');
}

function commentRowHTML(c) {
  return `
    <div class="comment-row">
      <div class="avatar" style="background:${c.author.avatarColor || '#E8A33D'}">${initials(c.author.displayName || c.author.username)}</div>
      <div class="comment-bubble">
        <strong>${escapeHTML(c.author.displayName || c.author.username)}</strong>
        <div>${escapeHTML(c.content)}</div>
      </div>
    </div>`;
}

// Delegate clicks for like / comment-toggle / delete / comment submission.
function attachPostInteractions(containerEl) {
  containerEl.addEventListener('click', async (e) => {
    const likeBtn = e.target.closest('.like-btn');
    const commentToggle = e.target.closest('.comment-toggle-btn');
    const deleteBtn = e.target.closest('.delete-btn');

    if (likeBtn) {
      const id = likeBtn.dataset.id;
      try {
        const data = await api(`/posts/${id}/like`, { method: 'POST' });
        likeBtn.classList.toggle('liked', data.liked);
        likeBtn.innerHTML = `${data.liked ? HEART_FILLED : HEART_OUTLINE} <span class="like-count">${data.likeCount}</span>`;
      } catch (err) {
        alert(err.message);
      }
      return;
    }

    if (commentToggle) {
      const id = commentToggle.dataset.id;
      const section = document.getElementById(`comments-${id}`);
      const isHidden = section.style.display === 'none';
      section.style.display = isHidden ? 'block' : 'none';
      if (isHidden && !section.dataset.loaded) {
        try {
          const data = await api(`/posts/${id}/comments`);
          section.querySelector('.comment-list').innerHTML = data.comments.map(commentRowHTML).join('') || '<p class="mono">No replies yet.</p>';
          section.dataset.loaded = '1';
        } catch (err) {
          section.querySelector('.comment-list').innerHTML = `<p class="mono">Could not load replies.</p>`;
        }
      }
      return;
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (!confirm('Delete this post? This cannot be undone.')) return;
      try {
        await api(`/posts/${id}`, { method: 'DELETE' });
        document.querySelector(`.post-card[data-post-id="${id}"]`).remove();
      } catch (err) {
        alert(err.message);
      }
    }
  });

  containerEl.addEventListener('submit', async (e) => {
    const form = e.target.closest('.comment-form');
    if (!form) return;
    e.preventDefault();

    const postCard = form.closest('.post-card');
    const postId = postCard.dataset.postId;
    const input = form.querySelector('input');
    const content = input.value.trim();
    if (!content) return;

    try {
      const data = await api(`/posts/${postId}/comments`, { method: 'POST', body: { content } });
      const list = form.previousElementSibling;
      const noReplies = list.querySelector('p.mono');
      if (noReplies) noReplies.remove();
      list.insertAdjacentHTML('beforeend', commentRowHTML(data.comment));
      input.value = '';

      const countEl = postCard.querySelector('.comment-count');
      countEl.textContent = String(Number(countEl.textContent) + 1);
    } catch (err) {
      alert(err.message);
    }
  });
}
