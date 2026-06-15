import { getBrowseUsers, getWishlist, saveEntry } from './api.js';

// Browse module: show other users and preview their wishlists in a modal (US-03).
// Also, provides a feature to save an entry from another user's wishlist. (US-04)
// current user's wishlist, and wishlists with 0 entries, will not show up.
const browseSection = document.getElementById('browse-section');
const browseBody = document.getElementById('browse-body');
const browseEmpty = document.getElementById('browse-empty');

const overlay = document.getElementById('modal-overlay');
const panel = document.getElementById('modal-panel');

export function initBrowse(wishlist) {
  let currentUser = null;

  async function refresh() {
    const users = await getBrowseUsers();
    const otherUsers = users.filter((user) => user._id !== currentUser._id);
    renderUsers(otherUsers);
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
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-sm btn-outline-secondary';
    button.textContent = 'View wishlist';
    button.addEventListener('click', () => openWishlistModal(user));
    action.appendChild(button);

    row.append(username, count, action);
    return row;
  }

  async function openWishlistModal(user) {
    const entries = await getWishlist(user._id);
    const unvisited = entries.filter((entry) => !entry.visited);
    const visited = entries.filter((entry) => entry.visited);

    panel.classList.add('browse-modal-panel');
    panel.innerHTML = '';

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn btn-outline-secondary';
    close.textContent = 'Close';
    close.addEventListener('click', closeModal);

    panel.append(
      makeModalHeader(user),
      makeStats(unvisited.length, visited.length),
      makeSection('Want to Try', unvisited, 'Nothing here yet.'),
      makeSection('Visited', visited, "They haven't visited anything yet."),
      makeFooter(close)
    );

    overlay.classList.remove('hidden');
  }

  function makeModalHeader(user) {
    const header = document.createElement('div');
    header.className = 'mb-4';

    const title = document.createElement('h2');
    title.className = 'mb-1';
    title.textContent = `Browsing ${user.displayName}'s wishlist`;

    const subtitle = document.createElement('p');
    subtitle.className = 'text-secondary mb-0';
    subtitle.textContent = `@${user.username}`;

    header.append(title, subtitle);
    return header;
  }

  function makeStats(unvisitedCount, visitedCount) {
    const row = document.createElement('div');
    row.className = 'row g-3 mb-4';

    row.append(
      makeStatCard(unvisitedCount, 'Want to try'),
      makeStatCard(visitedCount, 'Visited')
    );

    return row;
  }

  function makeStatCard(number, label) {
    const col = document.createElement('div');
    col.className = 'col';

    col.innerHTML = `
      <div class="card text-center shadow-sm">
        <div class="card-body">
          <span class="stat-number d-block">${number}</span>
          <span class="stat-label">${label}</span>
        </div>
      </div>
    `;

    return col;
  }

  function makeSection(titleText, entries, emptyText) {
    const section = document.createElement('div');
    section.className = 'mb-4';

    const title = document.createElement('h3');
    title.className = 'border-bottom pb-2 mb-3';
    title.textContent = titleText;

    const list = document.createElement('ul');
    list.className = 'list-unstyled mb-0';

    if (entries.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'entry-empty';
      empty.textContent = emptyText;
      list.appendChild(empty);
    } else {
      for (const entry of entries) {
        list.appendChild(renderEntry(entry));
      }
    }

    section.append(title, list);
    return section;
  }

  function renderEntry(entry) {
    const li = document.createElement('li');
    li.className = entry.visited ? 'entry visited mb-3' : 'entry mb-3';

    const head = document.createElement('div');
    head.className = 'entry-head';

    const title = document.createElement('h4');
    title.className = 'entry-title';
    title.textContent = entry.restaurant.name;
    head.appendChild(title);

    if (entry.visited) {
      head.appendChild(makeBadge('Visited', 'badge-visited'));
    } else if (entry.restaurant.cuisine) {
      head.appendChild(makeBadge(entry.restaurant.cuisine, 'badge-cuisine'));
    }
    li.appendChild(head);

    if (entry.restaurant.location) {
      const meta = document.createElement('p');
      meta.className = 'entry-meta';
      meta.textContent = entry.restaurant.location;
      li.appendChild(meta);
    }

    if (entry.notes) {
      const notes = document.createElement('p');
      notes.className = 'entry-notes mt-2 mb-0';
      notes.textContent = entry.notes;
      li.appendChild(notes);
    }

    if (entry.visited && entry.review) {
      const review = document.createElement('p');
      review.className = 'entry-review';
      review.textContent = entry.review;
      li.appendChild(review);
    }

    const actions = document.createElement('div');
    actions.className = 'd-flex flex-wrap gap-2 mt-3';

    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'btn btn-sm btn-primary';
    save.textContent = 'Save to my wishlist';
    save.addEventListener('click', async () => {
      try {
        await saveEntry(currentUser._id, entry.restaurant._id);
        save.textContent = 'Succcess: Saved!';
        save.disabled = true;
        await wishlist.refresh();
      } catch (err) {
        save.textContent = err.message;
        save.disabled = true;
      }
    });
    actions.appendChild(save);
    li.appendChild(actions);

    return li;
  }

  function makeBadge(text, className) {
    const badge = document.createElement('span');
    badge.className = 'badge rounded-pill text-uppercase ' + className;
    badge.textContent = text;
    return badge;
  }

  function makeFooter(closeButton) {
    const footer = document.createElement('div');
    footer.className = 'd-flex justify-content-end';
    footer.appendChild(closeButton);
    return footer;
  }

  function closeModal() {
    overlay.classList.add('hidden');
    panel.classList.remove('browse-modal-panel');
    panel.innerHTML = '';
  }

  return {
    setUser(user) {
      currentUser = user;
      browseSection.classList.toggle('hidden', !user);
      if (user) {
        refresh();
      } else {
        browseBody.innerHTML = '';
      }
    },
  };
}
