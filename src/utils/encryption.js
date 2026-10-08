// SYMMETRIC ENCRYPTION (same key for encrypt + decrypt) using AES-256-CBC.
// Used for message content (reversible data), NOT for passwords.
// Passwords use one-way HASHING (Argon2), never encryption.
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

function getKey() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) throw new Error('ENCRYPTION_KEY is missing in config/.env');
  return Buffer.from(hex, 'hex'); // must be 32 bytes
}

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted; // store iv with data
}

function decrypt(data) {
  const [ivHex, encrypted] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  let out = decipher.update(encrypted, 'hex', 'utf8');
  out += decipher.final('utf8');
  return out;
}

module.exports = { encrypt, decrypt };
