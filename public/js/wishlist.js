import {
  getWishlist,
  addEntry,
  updateEntry,
  setVisited,
  deleteEntry,
} from './api.js';
import { confirmDialog, reviewDialog } from './modal.js';

// Wishlist module: add/edit/delete entries (US-01) and mark them visited (US-02).
const form = document.getElementById('wishlist-form');
const formHeading = document.getElementById('form-heading');
const idInput = document.getElementById('entry-id');
const nameInput = document.getElementById('entry-name');
const cuisineInput = document.getElementById('entry-cuisine');
const locationInput = document.getElementById('entry-location');
const notesInput = document.getElementById('entry-notes');
const submitBtn = document.getElementById('entry-submit');
const cancelBtn = document.getElementById('entry-cancel');
const unvisitedList = document.getElementById('unvisited-list');
const visitedList = document.getElementById('visited-list');
const statUnvisited = document.getElementById('stat-unvisited');
const statVisited = document.getElementById('stat-visited');

export function initWishlist() {
  let currentUser = null;

  async function refresh() {
    if (!currentUser) return;
    const entries = await getWishlist(currentUser._id);
    const unvisited = entries.filter((e) => !e.visited);
    const visited = entries.filter((e) => e.visited);

    statUnvisited.textContent = unvisited.length;
    statVisited.textContent = visited.length;
    renderList(
      unvisitedList,
      unvisited,
      'Nothing here yet - add a place above.'
    );
    renderList(visitedList, visited, "You haven't visited anything yet.");
  }

  function renderList(listEl, entries, emptyText) {
    listEl.innerHTML = '';
    if (entries.length === 0) {
      const li = document.createElement('li');
      li.className = 'entry-empty';
      li.textContent = emptyText;
      listEl.appendChild(li);
      return;
    }
    for (const entry of entries) {
      listEl.appendChild(renderEntry(entry));
    }
  }

  function renderEntry(entry) {
    const li = document.createElement('li');
    li.className = entry.visited ? 'entry visited mb-3' : 'entry mb-3';

    const head = document.createElement('div');
    head.className = 'entry-head';

    const title = document.createElement('h3');
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
    actions.appendChild(
      makeButton(
        entry.visited ? 'Mark as not visited' : 'Mark visited',
        'btn btn-sm btn-outline-secondary',
        () => toggleVisited(entry)
      )
    );
    actions.appendChild(
      makeButton('Edit', 'btn btn-sm btn-outline-secondary', () =>
        startEdit(entry)
      )
    );
    actions.appendChild(
      makeButton('Delete', 'btn btn-sm btn-outline-danger', () => remove(entry))
    );
    li.appendChild(actions);

    return li;
  }

  function makeBadge(text, className) {
    const badge = document.createElement('span');
    badge.className = 'badge rounded-pill text-uppercase ' + className;
    badge.textContent = text;
    return badge;
  }

  function makeButton(label, className, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  async function toggleVisited(entry) {
    if (entry.visited) {
      await setVisited(entry._id, false, '');
      await refresh();
      return;
    }
    const review = await reviewDialog(entry.review || '');
    if (review === null) return; // cancelled
    await setVisited(entry._id, true, review);
    await refresh();
  }

  function startEdit(entry) {
    idInput.value = entry._id;
    nameInput.value = entry.restaurant.name;
    cuisineInput.value = entry.restaurant.cuisine || '';
    locationInput.value = entry.restaurant.location || '';
    notesInput.value = entry.notes || '';
    formHeading.textContent = 'Edit Restaurant';
    submitBtn.textContent = 'Save changes';
    cancelBtn.classList.remove('hidden');
    nameInput.focus();
  }

  function resetForm() {
    form.reset();
    idInput.value = '';
    formHeading.textContent = 'Add a Restaurant';
    submitBtn.textContent = 'Add to wishlist';
    cancelBtn.classList.add('hidden');
  }

  async function remove(entry) {
    const confirmed = await confirmDialog({
      title: 'Remove restaurant',
      message: `Remove “${entry.restaurant.name}” from your wishlist?`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!confirmed) return;
    await deleteEntry(entry._id);
    await refresh();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      name: nameInput.value,
      cuisine: cuisineInput.value,
      location: locationInput.value,
      notes: notesInput.value,
    };
    if (idInput.value) {
      await updateEntry(idInput.value, payload);
    } else {
      await addEntry({ userId: currentUser._id, ...payload });
    }
    resetForm();
    await refresh();
  });

  cancelBtn.addEventListener('click', resetForm);

  return {
    setUser(user) {
      currentUser = user;
      resetForm();
      if (user) {
        refresh();
      } else {
        unvisitedList.innerHTML = '';
        visitedList.innerHTML = '';
        statUnvisited.textContent = '0';
        statVisited.textContent = '0';
      }
    },
    refresh() {
      return refresh();
    },
  };
}
