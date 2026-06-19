// Seed script: wipes the three collections and inserts exactly 1000 documents
// total (100 users + 450 restaurants + 450 wishlist entries), keeping the
// references between them valid. Run with `npm run seed`.
import { connect, collections } from '../db/connection.js';
import { hashPassword } from '../utils/password.js';

const USERS = 100;
const RESTAURANTS = 450;
const WISHLISTS = 450; // one per restaurant (1:1), like a real "add"

const FIRST = [
  'Ava',
  'Liam',
  'Mia',
  'Noah',
  'Zoe',
  'Ethan',
  'Aria',
  'Leo',
  'Maya',
  'Kai',
  'Nora',
  'Owen',
  'Lucy',
  'Ezra',
  'Ivy',
  'Jude',
  'Ada',
  'Finn',
  'Remy',
  'Cleo',
];
const LAST = [
  'Park',
  'Nguyen',
  'Patel',
  'Kim',
  'Garcia',
  'Cohen',
  'Rossi',
  'Khan',
  'Silva',
  'Walsh',
  'Mori',
  'Diaz',
  'Okafor',
  'Reyes',
  'Haddad',
  'Lund',
  'Bauer',
  'Costa',
];
const NAME_A = [
  'The Golden',
  'Blue',
  'Little',
  'Old',
  'Urban',
  'Rustic',
  'Crimson',
  'Copper',
  'Garden',
  'Harbor',
  'Maple',
  'Smoky',
  'Velvet',
  'Wild',
  'Corner',
  'Lantern',
  'Saffron',
  'Ember',
  'Olive',
  'North',
];
const NAME_B = [
  'Spoon',
  'Table',
  'Kitchen',
  'Fork',
  'Grill',
  'Bistro',
  'Tavern',
  'Pantry',
  'Noodle',
  'Oven',
  'Plate',
  'Cellar',
  'Hearth',
  'Garden',
  'House',
  'Counter',
  'Larder',
  'Den',
  'Room',
  'Co.',
];
const CUISINES = [
  'Italian',
  'Japanese',
  'Mexican',
  'Thai',
  'Indian',
  'Chinese',
  'French',
  'Greek',
  'Korean',
  'Vietnamese',
  'American',
  'Mediterranean',
  'Spanish',
  'Ethiopian',
  'Lebanese',
  'Pizza',
  'BBQ',
  'Seafood',
  'Vegan',
  'Ramen',
];
const CATEGORIES = ['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'bakery'];
const STREETS = [
  'Main St',
  'Hampshire St',
  'Oak Ave',
  'Market St',
  'Elm St',
  'Highland Ave',
  '5th Ave',
  'Mission St',
  'Beacon St',
  'Pearl St',
  'Grand Ave',
  'Union St',
];
const CITIES = [
  { city: 'Boston', state: 'MA', lat: 42.3601, lon: -71.0589 },
  { city: 'Cambridge', state: 'MA', lat: 42.3736, lon: -71.1097 },
  { city: 'New York', state: 'NY', lat: 40.7128, lon: -74.006 },
  { city: 'Brooklyn', state: 'NY', lat: 40.6782, lon: -73.9442 },
  { city: 'San Francisco', state: 'CA', lat: 37.7749, lon: -122.4194 },
  { city: 'Chicago', state: 'IL', lat: 41.8781, lon: -87.6298 },
  { city: 'Los Angeles', state: 'CA', lat: 34.0522, lon: -118.2437 },
  { city: 'Seattle', state: 'WA', lat: 47.6062, lon: -122.3321 },
  { city: 'Austin', state: 'TX', lat: 30.2672, lon: -97.7431 },
  { city: 'Portland', state: 'OR', lat: 45.5152, lon: -122.6784 },
  { city: 'Philadelphia', state: 'PA', lat: 39.9526, lon: -75.1652 },
  { city: 'Miami', state: 'FL', lat: 25.7617, lon: -80.1918 },
  { city: 'Denver', state: 'CO', lat: 39.7392, lon: -104.9903 },
  { city: 'New Orleans', state: 'LA', lat: 29.9511, lon: -90.0715 },
];
const NOTES = [
  'Heard the tasting menu is incredible.',
  'Go early — no reservations.',
  'Recommended by a coworker.',
  'Great for date night.',
  'Try the chef special.',
  'Patio seating in summer.',
  '',
  '',
];
const REVIEWS = [
  'Absolutely worth the hype.',
  'Solid, would go again.',
  'A little overrated but tasty.',
  'Best meal I have had in months.',
  'Service was slow but the food delivered.',
  'Cozy spot, great cocktails.',
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (n) => Math.floor(Math.random() * n);
const jitter = () => (Math.random() - 0.5) * 0.04;
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function seed() {
  await connect();

  // 1. Wipe existing data.
  const before = {};
  for (const c of ['users', 'restaurants', 'wishlists']) {
    before[c] = await collections[c]().countDocuments();
    await collections[c]().deleteMany({});
  }
  console.log('Cleared existing documents:', before);

  // 2. Users (share one password hash so any seeded account logs in).
  const passwordHash = await hashPassword('wishlist123');
  const users = Array.from({ length: USERS }, (_, i) => {
    const first = pick(FIRST);
    const last = pick(LAST);
    return {
      username: `${first}${last}${i}`.toLowerCase(),
      displayName: `${first} ${last}`,
      passwordHash,
      createdAt: daysAgo(randInt(365)),
    };
  });
  const userIds = Object.values(
    (await collections.users().insertMany(users)).insertedIds
  );

  // 3. Restaurants.
  const restaurants = Array.from({ length: RESTAURANTS }, () => {
    const place = pick(CITIES);
    return {
      name: `${pick(NAME_A)} ${pick(NAME_B)}`,
      cuisine: pick(CUISINES),
      location: `${1 + randInt(400)} ${pick(STREETS)}, ${place.city}, ${place.state}`,
      lat: +(place.lat + jitter()).toFixed(6),
      lon: +(place.lon + jitter()).toFixed(6),
      category: pick(CATEGORIES),
      createdAt: daysAgo(randInt(365)),
    };
  });
  const restaurantIds = Object.values(
    (await collections.restaurants().insertMany(restaurants)).insertedIds
  );

  // 4. Wishlists — one per restaurant, owned by a random user.
  const wishlists = Array.from({ length: WISHLISTS }, (_, i) => {
    const visited = Math.random() < 0.4;
    return {
      userId: pick(userIds),
      restaurantId: restaurantIds[i],
      notes: pick(NOTES),
      visited,
      review: visited && Math.random() < 0.7 ? pick(REVIEWS) : '',
      createdAt: daysAgo(randInt(180)),
    };
  });
  await collections.wishlists().insertMany(wishlists);

  // 5. Report.
  const counts = {};
  let total = 0;
  for (const c of ['users', 'restaurants', 'wishlists']) {
    counts[c] = await collections[c]().countDocuments();
    total += counts[c];
  }
  console.log('Inserted:', counts, '=> total', total);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
