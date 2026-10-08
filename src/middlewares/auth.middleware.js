// AUTHENTICATION middleware: verifies JWT Bearer access token.
// 1. Read Authorization header. 2. Must be "Bearer <token>".
// 3. Verify JWT. 4. Attach user id to req.user. 401 if invalid/expired.
const { verifyAccessToken } = require('../utils/tokens');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header. Use Bearer <token>.' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.id }; // authentication: "who are you?"
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = authMiddleware;
