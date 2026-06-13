import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const { MONGO_USER, MONGO_PASSWORD, MONGO_CLUSTER, MONGO_DB } = process.env;

const uri = `mongodb+srv://${MONGO_USER}:${encodeURIComponent(
  MONGO_PASSWORD
)}@${MONGO_CLUSTER}/?retryWrites=true&w=majority`;

const client = new MongoClient(uri);

let db = null;

// Connect once at startup and reuse the same database handle everywhere.
export async function connect() {
  if (db) return db;
  await client.connect();
  db = client.db(MONGO_DB);
  console.log(`Connected to MongoDB database "${MONGO_DB}".`);
  return db;
}

// Convenience accessors for the three collections used by the app.
export const collections = {
  users: () => db.collection('users'),
  restaurants: () => db.collection('restaurants'),
  wishlists: () => db.collection('wishlists'),
};
