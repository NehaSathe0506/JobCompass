// Checks the JWT sent in the "Authorization: Bearer <token>" header.
// If valid, it attaches the user's id to req.user so controllers know who is calling.
const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: 'Access denied. Please log in.' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, email }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};
