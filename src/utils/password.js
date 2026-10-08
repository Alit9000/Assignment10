// HASHING (one-way) for passwords. Used with Argon2.
// Hash = one-way, cannot be reversed. Used for password storage.
// Encryption = reversible with a key. NEVER used for passwords.
const argon2 = require('argon2');

async function hashPassword(plainPassword) {
  return argon2.hash(plainPassword);
}

// Compare entered password with stored hash. Never decrypt (hashes can't be decrypted).
async function comparePassword(plainPassword, passwordHash) {
  return argon2.verify(passwordHash, plainPassword);
}

module.exports = { hashPassword, comparePassword };
