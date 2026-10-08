// BUSINESS LOGIC + DATABASE operations (no req/res here).
const User = require('../../db/models/User');
const { hashPassword, comparePassword } = require('../../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/tokens');
const { encrypt, decrypt } = require('../../utils/encryption');

async function signup({ username, email, password }) {
  const exists = await User.findOne({ email });
  if (exists) {
    const err = new Error('Email already exists.');
    err.status = 409;
    throw err;
  }
  const hashed = await hashPassword(password); // Argon2 one-way hash
  const user = await User.create({ username, email, password: hashed });
  return user; // toJSON removes password automatically
}

async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }
  // Compare (never decrypt — hashes are one-way).
  const ok = await comparePassword(password, user.password);
  if (!ok) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }
  const accessToken = signAccessToken(user._id.toString());
  const refreshToken = signRefreshToken(user._id.toString());
  return { user, accessToken, refreshToken };
}

async function refresh({ refreshToken }) {
  if (!refreshToken) {
    const err = new Error('Refresh token is required.');
    err.status = 401;
    throw err;
  }
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (e) {
    const err = new Error('Invalid or expired refresh token.');
    err.status = 401;
    throw err;
  }
  const user = await User.findById(decoded.id);
  if (!user) {
    const err = new Error('User no longer exists.');
    err.status = 401;
    throw err;
  }
  const accessToken = signAccessToken(user._id.toString());
  return { accessToken };
}

async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }
  return user;
}

// OPTIMISTIC CONCURRENCY demo: load -> modify -> save().
// Schema has optimisticConcurrency: true, so if two saves are based
// on the same stale __v version, the second throws VersionError -> 409.
async function updateMyProfile(userId, { username }) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }
  if (username) user.username = username;
  await user.save(); // throws VersionError on version conflict
  return user;
}

// ANONYMOUS message: anyone can send (no sender stored).
// Content is ENCRYPTED before saving (symmetric AES).
async function sendMessage({ receiverId, content }) {
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    const err = new Error('Receiver not found.');
    err.status = 404;
    throw err;
  }
  receiver.receivedMessages.push({ content: encrypt(content) });
  await receiver.save();
  return { receiverId };
}

// Owner reads inbox: DECRYPT each message before returning.
async function getMyMessages(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }
  return user.receivedMessages.map((m) => ({
    id: m._id,
    content: decrypt(m.content),
    createdAt: m.createdAt,
  }));
}

module.exports = {
  signup,
  login,
  refresh,
  getUserById,
  updateMyProfile,
  sendMessage,
  getMyMessages,
};
