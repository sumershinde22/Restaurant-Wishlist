// Reusable modal dialog module - a styled replacement for the browser's
// native confirm() and prompt() so dialogs match the rest of the design.
const overlay = document.getElementById('modal-overlay');
const panel = document.getElementById('modal-panel');

let resolveActive = null;

function settle(value) {
  overlay.classList.add('hidden');
  panel.innerHTML = '';
  const resolve = resolveActive;
  resolveActive = null;
  if (resolve) resolve(value);
}

overlay.addEventListener('click', (event) => {
  if (event.target === overlay) settle(null);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !overlay.classList.contains('hidden')) {
    settle(null);
  }
});

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  for (const child of children) {
    node.append(child);
  }
  return node;
}

function open() {
  overlay.classList.remove('hidden');
}

// Confirmation dialog -> resolves true when confirmed, false otherwise.
export function confirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
}) {
  return new Promise((resolve) => {
    resolveActive = (value) => resolve(value === true);

    const cancel = el('button', {
      className: 'btn btn-outline-secondary',
      textContent: 'Cancel',
      onclick: () => settle(false),
    });
    const confirm = el('button', {
      className: danger ? 'btn btn-outline-danger' : 'btn btn-primary',
      textContent: confirmLabel,
      onclick: () => settle(true),
    });

    panel.append(
      el('h3', { className: 'h5 mb-2', textContent: title }),
      el('p', { className: 'text-secondary mb-3', textContent: message }),
      el('div', { className: 'd-flex justify-content-end gap-2' }, [
        cancel,
        confirm,
      ])
    );
    open();
    confirm.focus();
  });
}

// Review dialog -> resolves the review text (possibly empty), or null if cancelled.
export function reviewDialog(current = '') {
  return new Promise((resolve) => {
    resolveActive = (value) => resolve(value);

    const textarea = el('textarea', {
      className: 'form-control mb-3',
      rows: 3,
      value: current,
      placeholder: 'How was it? (optional)',
    });
    const cancel = el('button', {
      className: 'btn btn-outline-secondary',
      textContent: 'Cancel',
      onclick: () => settle(null),
    });
    const save = el('button', {
      className: 'btn btn-primary',
      textContent: 'Save',
      onclick: () => settle(textarea.value),
    });

    panel.append(
      el('h3', { className: 'h5 mb-2', textContent: 'Mark as visited' }),
      el('p', {
        className: 'text-secondary mb-3',
        textContent: 'Add a short review, or leave it blank.',
      }),
      textarea,
      el('div', { className: 'd-flex justify-content-end gap-2' }, [
        cancel,
        save,
      ])
    );
    open();
    textarea.focus();
  });
}
