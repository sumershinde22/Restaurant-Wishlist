// Thin wrapper around fetch that parses JSON and surfaces server errors.
async function request(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }
  return data;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

export function registerUser(displayName, username, password) {
  return request('/api/users', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ displayName, username, password }),
  });
}

export function loginUser(username, password) {
  return request('/api/users/login', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ username, password }),
  });
}

export function getWishlist(userId) {
  return request('/api/wishlist?userId=' + encodeURIComponent(userId));
}

export function addEntry(payload) {
  return request('/api/wishlist', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export function updateEntry(id, payload) {
  return request('/api/wishlist/' + id, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export function setVisited(id, visited, review) {
  return request('/api/wishlist/' + id + '/visited', {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify({ visited, review }),
  });
}

export function deleteEntry(id) {
  return request('/api/wishlist/' + id, { method: 'DELETE' });
}

export function getBrowseUsers() {
  return request('/api/browse');
}
