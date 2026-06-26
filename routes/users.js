import express from 'express';
import { collections } from '../db/connection.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

const router = express.Router();

// Strip the password hash before sending a user back to the client.
function publicUser(user) {
  return {
    _id: user._id,
    username: user.username,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
}

// Register a new account.
router.post('/', async (req, res) => {
  const username = (req.body.username || '').trim().toLowerCase();
  const displayName = (req.body.displayName || '').trim();
  const password = req.body.password || '';

  if (!username || !displayName) {
    return res
      .status(400)
      .json({ error: 'Username and display name are required.' });
  }

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({
      error:
        'Username must be 3-20 lowercase letters, numbers, or underscores.',
    });
  }

  if (displayName.length > 50) {
    return res
      .status(400)
      .json({ error: 'Display name must be 50 characters or less.' });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: 'Password must be at least 8 characters.' });
  }

  const existing = await collections.users().findOne({ username });
  if (existing) {
    return res.status(409).json({ error: 'That username is already taken.' });
  }

  const user = {
    username,
    displayName,
    passwordHash: await hashPassword(password),
    createdAt: new Date(),
  };

  const result = await collections.users().insertOne(user);
  res.status(201).json(publicUser({ _id: result.insertedId, ...user }));
});

// Sign in to an existing account.
router.post('/login', async (req, res) => {
  const username = (req.body.username || '').trim().toLowerCase();
  const password = req.body.password || '';

  const user = await collections.users().findOne({ username });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }

  res.json(publicUser(user));
});

export default router;
