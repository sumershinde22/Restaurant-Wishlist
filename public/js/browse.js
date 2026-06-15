import { getBrowseUsers } from './api.js';

// Browse module: show all users and basic wishlist info (US-03).
const browseSection = document.getElementById('browse-section');
const browseBody = document.getElementById('browse-body');
const browseEmpty = document.getElementById('browse-empty');

export function initBrowse() {
  async function refresh() {
    const users = await getBrowseUsers();
    renderUsers(users);
  }

  function renderUsers(users) {
    browseBody.innerHTML = '';
    browseEmpty.classList.toggle('hidden', users.length !== 0);

    for (const user of users) {
      browseBody.appendChild(renderUserRow(user));
    }
  }

  function renderUserRow(user) {
    const row = document.createElement('tr');

    const username = document.createElement('td');
    username.innerHTML = `
      <strong>${user.displayName}</strong>
      <span class="browse-handle d-block">@${user.username}</span>
    `;

    const count = document.createElement('td');
    count.textContent = user.wishlistCount;

    const action = document.createElement('td');
    const link = document.createElement('a');
    link.className = 'btn btn-sm btn-outline-secondary';
    link.href = user.wishlistUrl;
    link.textContent = 'View wishlist';
    action.appendChild(link);

    row.append(username, count, action);
    return row;
  }

  return {
    setUser(user) {
      browseSection.classList.toggle('hidden', !user);
      if (user) refresh();
    },
  };
}
