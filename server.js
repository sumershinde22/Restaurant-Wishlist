import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connect } from './db/connection.js';
import usersRouter from './routes/users.js';
import wishlistRouter from './routes/wishlist.js';
import browseRouter from './routes/browse.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();

// Hide Express implementation details and add basic browser protections.
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; frame-src https://www.openstreetmap.org; connect-src 'self' https://api.open-meteo.com https://nominatim.openstreetmap.org; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; script-src 'self' https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net"
  );
  next();
});

// Limit JSON request size.
app.use(express.json({ limit: '20kb' }));
app.use(express.static(join(__dirname, 'public')));

app.use('/api/users', usersRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/browse', browseRouter);

// Connect to MongoDB first, then start accepting requests.
connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
