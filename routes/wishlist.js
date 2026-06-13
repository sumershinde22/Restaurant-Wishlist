import express from 'express';
import { ObjectId } from 'mongodb';
import { collections } from '../db/connection.js';

const router = express.Router();

// Turn a string id into an ObjectId, or null if it is malformed.
function toObjectId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

// US-01: List a user's wishlist, joining each entry with its restaurant.
router.get('/', async (req, res) => {
  const userId = toObjectId(req.query.userId);
  if (!userId) {
    return res.status(400).json({ error: 'A valid userId is required.' });
  }

  const entries = await collections
    .wishlists()
    .aggregate([
      { $match: { userId } },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurantId',
          foreignField: '_id',
          as: 'restaurant',
        },
      },
      { $unwind: '$restaurant' },
      { $sort: { createdAt: -1 } },
    ])
    .toArray();

  res.json(entries);
});

// US-01: Add a restaurant to the wishlist (creates a restaurant + a wishlist entry).
router.post('/', async (req, res) => {
  const userId = toObjectId(req.body.userId);
  const name = (req.body.name || '').trim();
  const cuisine = (req.body.cuisine || '').trim();
  const location = (req.body.location || '').trim();
  const notes = (req.body.notes || '').trim();

  if (!userId || !name) {
    return res
      .status(400)
      .json({ error: 'A valid userId and a restaurant name are required.' });
  }

  const restaurant = { name, cuisine, location, createdAt: new Date() };
  const { insertedId: restaurantId } = await collections
    .restaurants()
    .insertOne(restaurant);

  const entry = {
    userId,
    restaurantId,
    notes,
    visited: false,
    review: '',
    createdAt: new Date(),
  };
  const { insertedId } = await collections.wishlists().insertOne(entry);

  res.status(201).json({ _id: insertedId, ...entry, restaurant });
});

// US-01: Edit a wishlist entry's notes and its restaurant details.
router.put('/:id', async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'A valid entry id is required.' });
  }

  const entry = await collections.wishlists().findOne({ _id: id });
  if (!entry) {
    return res.status(404).json({ error: 'Wishlist entry not found.' });
  }

  const name = (req.body.name || '').trim();
  if (!name) {
    return res.status(400).json({ error: 'A restaurant name is required.' });
  }

  await collections.restaurants().updateOne(
    { _id: entry.restaurantId },
    {
      $set: {
        name,
        cuisine: (req.body.cuisine || '').trim(),
        location: (req.body.location || '').trim(),
      },
    }
  );
  await collections
    .wishlists()
    .updateOne({ _id: id }, { $set: { notes: (req.body.notes || '').trim() } });

  res.json({ ok: true });
});

// US-02: Mark an entry as visited (or not) and optionally add a review.
router.patch('/:id/visited', async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'A valid entry id is required.' });
  }

  const visited = Boolean(req.body.visited);
  const review = visited ? (req.body.review || '').trim() : '';

  const result = await collections
    .wishlists()
    .updateOne({ _id: id }, { $set: { visited, review } });

  if (result.matchedCount === 0) {
    return res.status(404).json({ error: 'Wishlist entry not found.' });
  }
  res.json({ ok: true });
});

// US-01: Remove a wishlist entry and the restaurant it points to.
router.delete('/:id', async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'A valid entry id is required.' });
  }

  const entry = await collections.wishlists().findOne({ _id: id });
  if (!entry) {
    return res.status(404).json({ error: 'Wishlist entry not found.' });
  }

  await collections.restaurants().deleteOne({ _id: entry.restaurantId });
  await collections.wishlists().deleteOne({ _id: id });

  res.json({ ok: true });
});

export default router;
