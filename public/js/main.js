import { initProfile } from './profile.js';
import { initWishlist } from './wishlist.js';

// Wire the profile module to the wishlist module: signing in/out swaps the
// active user, which loads (or clears) the wishlist below.
const wishlist = initWishlist();

initProfile({
  onSignIn: (user) => wishlist.setUser(user),
  onSignOut: () => wishlist.setUser(null),
});
