// CONTROLLER: handles req/res + validation middleware + calls services + status codes.
//
// VALIDATION (simple):
// - What: check incoming data shape before business logic.
// - Why: bad data causes bugs/security issues; fail fast with 400.
// - Why middleware: runs BEFORE controller logic, keeps code clean.
const services = require('./user services');

function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// --- Validation middlewares (400 on bad input) ---
function validateSignup(req, res, next) {
  const { username, email, password } = req.body || {};
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ message: 'username is required (min 3 chars).' });
  }
  if (!isEmail(email)) {
    return res.status(400).json({ message: 'Valid email is required.' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'password is required (min 6 chars).' });
  }
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  if (!isEmail(email)) {
    return res.status(400).json({ message: 'Valid email is required.' });
  }
  if (!password || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ message: 'password is required.' });
  }
  next();
}

function validateMessage(req, res, next) {
  const { receiverId, content } = req.body || {};
  if (!receiverId || typeof receiverId !== 'string') {
    return res.status(400).json({ message: 'receiverId is required.' });
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ message: 'content is required.' });
  }
  next();
}

function handleError(res, err) {
  // Optimistic concurrency conflict: stale document version.
  if (err && err.name === 'VersionError') {
    return res.status(409).json({ message: 'Version conflict. Data was updated by someone else. Please retry.' });
  }
  const status = err.status || 500;
  return res.status(status).json({ message: err.message || 'Server error.' });
}

// --- Controllers ---
async function signup(req, res) {
  try {
    const user = await services.signup(req.body);
    return res.status(201).json({ message: 'User registered.', user }); // password removed by toJSON
  } catch (err) {
    return handleError(res, err);
  }
}

async function login(req, res) {
  try {
    const { user, accessToken, refreshToken } = await services.login(req.body);
    return res.status(200).json({ message: 'Login successful.', user, accessToken, refreshToken });
  } catch (err) {
    return handleError(res, err);
  }
}

async function refresh(req, res) {
  try {
    const { accessToken } = await services.refresh(req.body);
    return res.status(200).json({ accessToken });
  } catch (err) {
    return handleError(res, err);
  }
}

async function getUser(req, res) {
  try {
    // AUTHORIZATION: logged-in user can only view their OWN profile.
    // Authentication (who are you?) passed, but accessing another id -> 403.
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden. You can only access your own data.' });
    }
    const user = await services.getUserById(req.params.id);
    return res.status(200).json({ user });
  } catch (err) {
    return handleError(res, err);
  }
}

async function updateMe(req, res) {
  try {
    // Simple profile update to demonstrate optimistic concurrency (409 on conflict).
    const user = await services.updateMyProfile(req.user.id, req.body);
    return res.status(200).json({ message: 'Profile updated.', user });
  } catch (err) {
    return handleError(res, err);
  }
}

async function sendMessage(req, res) {
  try {
    const result = await services.sendMessage(req.body);
    return res.status(201).json({ message: 'Message sent anonymously.', ...result });
  } catch (err) {
    return handleError(res, err);
  }
}

async function getMyMessages(req, res) {
  try {
    const messages = await services.getMyMessages(req.user.id);
    return res.status(200).json({ messages });
  } catch (err) {
    return handleError(res, err);
  }
}

module.exports = {
  validateSignup,
  validateLogin,
  validateMessage,
  signup,
  login,
  refresh,
  getUser,
  updateMe,
  sendMessage,
  getMyMessages,
};
