import express from 'express';
import { collections } from '../db/connection.js';

const router = express.Router();

// Strip each browsable user down to public info + wishlist count.
function publicBrowseUser(user) {
  return {
    _id: user._id,
    username: user.username,
    displayName: user.displayName,
    wishlistCount: user.wishlistCount || 0,
    wishlistUrl: `/${user._id}`,
  };
}

// Browse all users and their basic wishlist info (US-03).
// note: wishlists with 0 items will not appear.
router.get('/', async (req, res) => {
  const users = await collections
    .users()
    .aggregate([
      {
        $lookup: {
          from: 'wishlists',
          localField: '_id',
          foreignField: 'userId',
          as: 'wishlistItems',
        },
      },
      {
        $addFields: {
          wishlistCount: { $size: '$wishlistItems' },
        },
      },
      {
        $match: {
          wishlistCount: { $gt: 0 },
        },
      },
      {
        $project: {
          username: 1,
          displayName: 1,
          createdAt: 1,
          wishlistCount: 1,
        },
      },
      { $sort: { username: 1 } },
    ])
    .toArray();

  res.json(users.map(publicBrowseUser));
});

export default router;
