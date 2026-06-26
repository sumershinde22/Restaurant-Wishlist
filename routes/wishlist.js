import express from 'express';
import { ObjectId } from 'mongodb';
import { collections } from '../db/connection.js';

const router = express.Router();

// Turn a string id into an ObjectId, or null if it is malformed.
function toObjectId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

function readText(value, maxLength, label) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length > maxLength) {
    return { error: `${label} must be ${maxLength} characters or less.` };
  }
  return { value: text };
}

function readRestaurantInput(body) {
  const name = readText(body.name, 80, 'Restaurant name');
  const cuisine = readText(body.cuisine, 40, 'Cuisine');
  const location = readText(body.location, 120, 'Location');
  const notes = readText(body.notes, 300, 'Notes');

  const error = name.error || cuisine.error || location.error || notes.error;
  if (error) return { error };

  return {
    name: name.value,
    cuisine: cuisine.value,
    location: location.value,
    notes: notes.value,
  };
}

function readReview(body) {
  const review = readText(body.review, 500, 'Review');
  if (review.error) return review;
  return { value: review.value };
}

// Pull optional map data from the OpenStreetMap search.
function geoFields(body) {
  const lat = Number(body.lat);
  const lon = Number(body.lon);
  const hasCoords =
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180;

  return {
    lat: hasCoords ? lat : null,
    lon: hasCoords ? lon : null,
    category: (body.category || '').trim().slice(0, 60),
  };
}

// US-01: List a user's wishlist.
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

// US-01: Add a restaurant to the wishlist.
router.post('/', async (req, res) => {
  const userId = toObjectId(req.body.userId);
  const fields = readRestaurantInput(req.body);

  if (!userId || fields.error || !fields.name) {
    return res.status(400).json({
      error:
        fields.error || 'A valid userId and a restaurant name are required.',
    });
  }

  const restaurant = {
    name: fields.name,
    cuisine: fields.cuisine,
    location: fields.location,
    ...geoFields(req.body),
    createdAt: new Date(),
  };

  const { insertedId: restaurantId } = await collections
    .restaurants()
    .insertOne(restaurant);

  const entry = {
    userId,
    restaurantId,
    notes: fields.notes,
    visited: false,
    review: '',
    createdAt: new Date(),
  };

  const { insertedId } = await collections.wishlists().insertOne(entry);

  res.status(201).json({ _id: insertedId, ...entry, restaurant });
});

// US-01: Edit a wishlist entry.
router.put('/:id', async (req, res) => {
  const id = toObjectId(req.params.id);
  const userId = toObjectId(req.body.userId);

  if (!id || !userId) {
    return res
      .status(400)
      .json({ error: 'A valid entry id and userId are required.' });
  }

  // Only allow the owner of the wishlist entry to edit it.
  const entry = await collections.wishlists().findOne({ _id: id, userId });
  if (!entry) {
    return res.status(404).json({ error: 'Wishlist entry not found.' });
  }

  const fields = readRestaurantInput(req.body);
  if (fields.error || !fields.name) {
    return res
      .status(400)
      .json({ error: fields.error || 'A restaurant name is required.' });
  }

  await collections.restaurants().updateOne(
    { _id: entry.restaurantId },
    {
      $set: {
        name: fields.name,
        cuisine: fields.cuisine,
        location: fields.location,
        ...geoFields(req.body),
      },
    }
  );

  await collections
    .wishlists()
    .updateOne({ _id: id, userId }, { $set: { notes: fields.notes } });

  res.json({ ok: true });
});

// US-02: Mark an entry as visited or not visited.
router.patch('/:id/visited', async (req, res) => {
  const id = toObjectId(req.params.id);
  const userId = toObjectId(req.body.userId);

  if (!id || !userId) {
    return res
      .status(400)
      .json({ error: 'A valid entry id and userId are required.' });
  }

  const visited = Boolean(req.body.visited);
  const review = visited ? readReview(req.body) : { value: '' };

  if (review.error) {
    return res.status(400).json({ error: review.error });
  }

  // Only allow the owner to update visited/review status.
  const result = await collections
    .wishlists()
    .updateOne({ _id: id, userId }, { $set: { visited, review: review.value } });

  if (result.matchedCount === 0) {
    return res.status(404).json({ error: 'Wishlist entry not found.' });
  }

  res.json({ ok: true });
});

// US-01: Remove a wishlist entry.
router.delete('/:id', async (req, res) => {
  const id = toObjectId(req.params.id);
  const userId = toObjectId(req.body.userId);

  if (!id || !userId) {
    return res
      .status(400)
      .json({ error: 'A valid entry id and userId are required.' });
  }

  // Only allow the owner of the wishlist entry to delete it.
  const entry = await collections.wishlists().findOne({ _id: id, userId });
  if (!entry) {
    return res.status(404).json({ error: 'Wishlist entry not found.' });
  }

  await collections.restaurants().deleteOne({ _id: entry.restaurantId });
  await collections.wishlists().deleteOne({ _id: id, userId });

  res.json({ ok: true });
});

// US-04: Save a wishlist entry from another person's wishlist to my wishlist.
router.post('/save', async (req, res) => {
  const userId = toObjectId(req.body.userId);
  const restaurantId = toObjectId(req.body.restaurantId);

  if (!userId || !restaurantId) {
    return res
      .status(400)
      .json({ error: 'A valid userId and restaurantId are required.' });
  }

  const source = await collections.restaurants().findOne({ _id: restaurantId });
  if (!source) {
    return res.status(404).json({ error: 'Restaurant not found.' });
  }

  const existing = await collections
    .wishlists()
    .findOne({ userId, savedFrom: restaurantId });

  if (existing) {
    return res
      .status(409)
      .json({ error: 'This restaurant is already on your wishlist.' });
  }

  const restaurant = {
    name: source.name,
    cuisine: source.cuisine,
    location: source.location,
    lat: source.lat ?? null,
    lon: source.lon ?? null,
    category: source.category || '',
    createdAt: new Date(),
  };

  const { insertedId: newRestaurantId } = await collections
    .restaurants()
    .insertOne(restaurant);

  const entry = {
    userId,
    restaurantId: newRestaurantId,
    savedFrom: restaurantId,
    notes: '',
    visited: false,
    review: '',
    createdAt: new Date(),
  };

  const { insertedId } = await collections.wishlists().insertOne(entry);

  res.status(201).json({
    _id: insertedId,
    ...entry,
    restaurant: { _id: newRestaurantId, ...restaurant },
  });
});

export default router;
