import { registerUser, loginUser } from './api.js';

// Profile module (US-01): account creation, sign in, and sign out.
// The signed-in user is remembered in localStorage so a refresh keeps the session.
const STORAGE_KEY = 'rw_user';

const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const userMenu = document.getElementById('user-menu');

const tabs = document.querySelectorAll('.auth-tab');
const signinForm = document.getElementById('signin-form');
const registerForm = document.getElementById('register-form');
const messageEl = document.getElementById('auth-message');

const signinUsername = document.getElementById('signin-username');
const signinPassword = document.getElementById('signin-password');
const registerDisplayName = document.getElementById('register-displayname');
const registerUsername = document.getElementById('register-username');
const registerPassword = document.getElementById('register-password');

const userName = document.getElementById('user-name');
const userHandle = document.getElementById('user-handle');
const userAvatar = document.getElementById('user-avatar');
const signoutBtn = document.getElementById('signout-btn');

function initials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase();
}

export function initProfile({ onSignIn, onSignOut }) {
  function showSignedIn(user) {
    userName.textContent = user.displayName;
    userHandle.textContent = '@' + user.username;
    userAvatar.textContent = initials(user.displayName);
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    userMenu.classList.remove('hidden');
    messageEl.textContent = '';
    onSignIn(user);
  }

  function showSignedOut() {
    appSection.classList.add('hidden');
    userMenu.classList.add('hidden');
    authSection.classList.remove('hidden');
    onSignOut();
  }

  // Reveal/hide the password as plain text.
  document.querySelectorAll('.password-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const input = document.getElementById(toggle.dataset.target);
      const revealed = input.type === 'text';
      input.type = revealed ? 'password' : 'text';
      toggle.textContent = revealed ? 'Show' : 'Hide';
      toggle.setAttribute(
        'aria-label',
        revealed ? 'Show password' : 'Hide password'
      );
    });
  });

  // Switch between the Sign In and Create Account tabs.
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.toggle('is-active', t === tab));
      const isSignin = tab.dataset.tab === 'signin';
      signinForm.classList.toggle('hidden', !isSignin);
      registerForm.classList.toggle('hidden', isSignin);
      messageEl.textContent = '';
    });
  });

  async function handle(action) {
    try {
      const user = await action();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      signinForm.reset();
      registerForm.reset();
      showSignedIn(user);
    } catch (err) {
      messageEl.textContent = err.message;
    }
  }

  signinForm.addEventListener('submit', (event) => {
    event.preventDefault();
    handle(() => loginUser(signinUsername.value, signinPassword.value));
  });

  registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    handle(() =>
      registerUser(
        registerDisplayName.value,
        registerUsername.value,
        registerPassword.value
      )
    );
  });

  signoutBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    showSignedOut();
  });

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    showSignedIn(JSON.parse(stored));
  }
}
