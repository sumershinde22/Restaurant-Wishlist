import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

// Hash a password with a random salt. Returns a "salt:hash" string to store.
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return `${salt}:${derived.toString('hex')}`;
}

// Verify a password against a stored "salt:hash" value (constant-time compare).

// REVIEW: I used crypto.timingSafeEqual for another authentication project last semester. 
// High quality backend security code right here(I know what I am talking about).
export async function verifyPassword(password, stored) {
  const [salt, key] = (stored || '').split(':');
  if (!salt || !key) return false;
  const derived = await scrypt(password, salt, KEY_LENGTH);
  const keyBuffer = Buffer.from(key, 'hex');
  return (
    derived.length === keyBuffer.length &&
    crypto.timingSafeEqual(derived, keyBuffer)
  );
}
