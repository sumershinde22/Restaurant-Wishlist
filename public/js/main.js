import { initProfile } from './profile.js';
import { initWishlist } from './wishlist.js';
import { initBrowse } from './browse.js';

// Wire the profile module to the wishlist/browse modules: signing in/out swaps the
// active user, which loads (or clears) the associated wishlist/browse modules.
const wishlist = initWishlist();
const browse = initBrowse(wishlist);
initProfile({
  onSignIn: (user) => {
    wishlist.setUser(user);
    browse.setUser(user);
  },
  onSignOut: () => {
    wishlist.setUser(null);
    browse.setUser(null);
  },
});
