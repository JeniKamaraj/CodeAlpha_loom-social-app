requireLogin();
renderTopbar('profile');

const profileRoot = document.getElementById('profile-root');
const postList = document.getElementById('post-list');
attachPostInteractions(postList);

const params = new URLSearchParams(window.location.search);
const username = params.get('u') || getUser().username;

function profileHeaderHTML(data) {
  const { profile, isFollowing, isSelf } = data;
  let followBtn = '';

  if (isSelf) {
    followBtn = `<button class="btn-follow self" id="edit-btn">Edit profile</button>`;
  } else {
    followBtn = `<button class="btn-follow ${isFollowing ? 'following' : ''}" id="follow-btn">${isFollowing ? 'Following' : 'Follow'}</button>`;
  }

  return `
    <div class="profile-header">
      <div class="avatar" style="background:${profile.avatarColor}">${initials(profile.displayName)}</div>
      <div style="flex:1">
        <div class="profile-name-row">
          <h2>${escapeHTML(profile.displayName)}</h2>
          ${followBtn}
        </div>
        <span class="post-author-handle">@${escapeHTML(profile.username)}</span>
        <div class="profile-stats">
          <span><strong id="follower-count">${profile.followerCount}</strong> followers</span>
          <span><strong>${profile.followingCount}</strong> following</span>
        </div>
        ${profile.bio ? `<p class="bio-text">${escapeHTML(profile.bio)}</p>` : ''}
      </div>
    </div>
    <div id="edit-form-slot"></div>
  `;
}

function editFormHTML(profile) {
  return `
    <div class="edit-profile-form">
      <div class="field">
        <label for="edit-displayname">display name</label>
        <input id="edit-displayname" value="${escapeHTML(profile.displayName)}" maxlength="40" />
      </div>
      <div class="field">
        <label for="edit-bio">bio</label>
        <textarea id="edit-bio" maxlength="240" rows="3">${escapeHTML(profile.bio)}</textarea>
      </div>
      <button class="btn-primary" id="save-profile-btn">Save changes</button>
    </div>
  `;
}

async function loadProfile() {
  try {
    const data = await api(`/users/${username}`);
    profileRoot.innerHTML = profileHeaderHTML(data);

    if (data.isSelf) {
      document.getElementById('edit-btn').addEventListener('click', () => {
        const slot = document.getElementById('edit-form-slot');
        slot.innerHTML = slot.innerHTML ? '' : editFormHTML(data.profile);
        if (slot.innerHTML) {
          document.getElementById('save-profile-btn').addEventListener('click', async () => {
            try {
              await api('/users/me/edit', {
                method: 'PATCH',
                body: {
                  displayName: document.getElementById('edit-displayname').value.trim(),
                  bio: document.getElementById('edit-bio').value.trim(),
                },
              });
              loadProfile();
            } catch (err) {
              alert(err.message);
            }
          });
        }
      });
    } else {
      document.getElementById('follow-btn').addEventListener('click', async (e) => {
        try {
          const res = await api(`/users/${username}/follow`, { method: 'POST' });
          e.target.classList.toggle('following', res.following);
          e.target.textContent = res.following ? 'Following' : 'Follow';
          document.getElementById('follower-count').textContent = res.followerCount;
        } catch (err) {
          alert(err.message);
        }
      });
    }

    const emptyMessage = data.isSelf
      ? "You haven't posted anything yet. Say something on the Feed page."
      : `@${username} hasn't posted anything yet.`;
    renderPosts(postList, data.posts, emptyMessage);
  } catch (err) {
    profileRoot.innerHTML = `<div class="empty-state"><h3>Profile not found</h3><p>${escapeHTML(err.message)}</p></div>`;
  }
}

loadProfile();
