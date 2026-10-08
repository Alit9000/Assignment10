const mongoose = require('mongoose');

// User Model
// Fields: username, email, password (Argon2 hash only), receivedMessages.
// receivedMessages stores ANONYMOUS messages. Each message keeps only
// encrypted content + date. No sender info is stored, so receiver
// can never see who sent it.
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // NEVER plain text. Only an Argon2 hash is stored here.
    // NEVER encrypt passwords (encryption is reversible, hashing is one-way).
    password: {
      type: String,
      required: true,
    },
    // Anonymous inbox. Content is stored ENCRYPTED (symmetric AES).
    // It is decrypted only when the owner reads their messages.
    receivedMessages: [
      {
        content: { type: String, required: true }, // encrypted text "iv:encrypted"
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true, // adds createdAt + updatedAt
    optimisticConcurrency: true, // enables optimistic concurrency via __v version key
  }
);

// toJSON transform: runs when a document is converted with JSON.stringify()
// or res.json(user). We remove password so API responses never leak it.
//
// toJSON vs toObject (simple):
// - toJSON: used when converting to JSON (API responses).
// - toObject: used when converting to a plain JS object (plain JS logic).
// We only need toJSON here because our goal is clean API responses.
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password; // never expose password hash
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
