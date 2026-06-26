import { getBrowseUsers, getWishlist, saveEntry } from './api.js';

// Browse module: show other users and preview their wishlists in a modal (US-03).
// Also, provides a feature to save an entry from another user's wishlist. (US-04)
// current user's wishlist, and wishlists with 0 entries, will not show up.
const browseSection = document.getElementById('browse-section');
const browseBody = document.getElementById('browse-body');
const browseEmpty = document.getElementById('browse-empty');
const userSearch = document.getElementById('user-search');

const overlay = document.getElementById('modal-overlay');
const panel = document.getElementById('modal-panel');

const browsePagination = document.getElementById('browse-pagination');
const browsePrev = document.getElementById('browse-prev');
const browseNext = document.getElementById('browse-next');
const browsePageText = document.getElementById('browse-page-text');

const PAGE_SIZE = 10;

export function initBrowse(wishlist) {
  let currentUser = null;
  let allUsers = [];
  let currentPage = 1;

  // I think for the scope of this project, fetching all users and filtering/paginating them on the client side works perfectly. 
  // However if this app were to scale to thousands of users, I'd want to move this search logic to the backend API to save bandwidth and browser memory. 
  // Just a thought for future scaling!
  async function refresh() {
    const users = await getBrowseUsers();
    allUsers = users.filter((user) => user._id !== currentUser._id);
    renderFiltered();
  }

  // Filter the browsable users by the search box (name or @username).
  function renderFiltered() {
    const q = userSearch.value.trim().toLowerCase();

    const filtered = q
      ? allUsers.filter(
          (u) =>
            u.displayName.toLowerCase().includes(q) ||
            u.username.toLowerCase().includes(q)
        )
      : allUsers;

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    renderUsers(filtered, totalPages);
  }

  userSearch.addEventListener('input', () => {
    currentPage = 1;
    renderFiltered();
  });

  function renderUsers(users, totalPages) {
    browseBody.innerHTML = '';

    const hasUsers = users.length !== 0;
    browseEmpty.classList.toggle('hidden', hasUsers);
    browsePagination.classList.toggle('hidden', !hasUsers);

    const startUserIndex = (currentPage - 1) * PAGE_SIZE;
    const usersOnCurrentPage = users.slice(
      startUserIndex,
      startUserIndex + PAGE_SIZE
    );

    for (const user of usersOnCurrentPage) {
      browseBody.appendChild(renderUserRow(user));
    }

    browsePageText.textContent = `Page ${currentPage} of ${totalPages}`;
    browsePrev.disabled = currentPage === 1;
    browseNext.disabled = currentPage === totalPages;
  }

  function renderUserRow(user) {
    const row = document.createElement('tr');

    const username = document.createElement('td');
    const name = document.createElement('strong');
    name.textContent = user.displayName;
    const handle = document.createElement('span');
    handle.className = 'browse-handle d-block';
    handle.textContent = '@' + user.username;
    username.append(name, handle);

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

    const body = document.createElement('div');
    body.className = 'browse-modal-body';
    body.append(
      makeStats(unvisited.length, visited.length),
      makeSection('Want to Try', unvisited, 'Nothing here yet.'),
      makeSection('Visited', visited, "They haven't visited anything yet.")
    );

    panel.append(makeModalHeader(user), body);
    overlay.classList.remove('hidden');
  }

  function makeModalHeader(user) {
    const header = document.createElement('div');
    header.className = 'browse-modal-header';

    const text = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'mb-1';
    title.textContent = `${user.displayName}'s wishlist`;
    const subtitle = document.createElement('p');
    subtitle.className = 'text-secondary mb-0';
    subtitle.textContent = `@${user.username}`;
    text.append(title, subtitle);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'browse-modal-close';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';
    close.addEventListener('click', closeModal);

    header.append(text, close);
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
    list.className = 'browse-entry-list';

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
    li.className = entry.visited ? 'entry visited' : 'entry';

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

    // Good job catching the error, but displaying "err.message" directly inside the button text might lead to UI overflow if the backend error string is long. 
    // You might want to use a toast notification or a dedicated error span nearby instead (I found this while doing my project).
    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'btn btn-sm btn-primary';
    save.textContent = 'Save to my wishlist';
    save.addEventListener('click', async () => {
      try {
        await saveEntry(currentUser._id, entry.restaurant._id);
        save.textContent = 'Success: Saved!';
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

  function closeModal() {
    overlay.classList.add('hidden');
    panel.classList.remove('browse-modal-panel');
    panel.innerHTML = '';
  }

  browsePrev.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage -= 1;
      renderFiltered();
    }
  });

  browseNext.addEventListener('click', () => {
    currentPage += 1;
    renderFiltered();
  });

  return {
    setUser(user) {
      currentUser = user;
      browseSection.classList.toggle('hidden', !user);
      userSearch.value = '';
      currentPage = 1;

      if (user) {
        refresh();
      } else {
        allUsers = [];
        browseBody.innerHTML = '';
        browsePagination.classList.add('hidden');
      }
    },
  };
}
