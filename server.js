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

app.use(express.json());
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
