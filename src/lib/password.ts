// lib/password.ts
import crypto from 'crypto';

const SALT_ROUNDS = 10;

/**
 * Hash password dengan bcrypt (manual implementation)
 * Atau bisa pakai library: npm install bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  // Jika pakai bcryptjs:
  // const bcrypt = require('bcryptjs');
  // return bcrypt.hash(password, SALT_ROUNDS);

  // Manual dengan crypto (simple):
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return `${salt}$${hash}`;
}

/**
 * Verify password
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // Jika pakai bcryptjs:
  // const bcrypt = require('bcryptjs');
  // return bcrypt.compare(password, hashedPassword);

  // Manual dengan crypto (simple):
  const [salt, hash] = hashedPassword.split('$');
  const testHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return testHash === hash;
}