// JobCompass - main server file
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const resources = require('./routes/resources');

// Fail fast if the app is misconfigured (better than a confusing crash later)
for (const key of ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME']) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();
app.set('trust proxy', 1); // correct client IPs behind Render/Railway/Nginx

// Frontend is served from this same server, so cross-origin access is off unless CORS_ORIGIN is set
if (process.env.CORS_ORIGIN) app.use(cors({ origin: process.env.CORS_ORIGIN.split(',') }));
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Slow down password guessing on login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Try again in a few minutes.' },
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// API routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/deadlines', resources.deadlines);
app.use('/api/follow-ups', resources.followUps);
app.use('/api/interviews', resources.interviews);
app.use('/api/dashboard', require('./routes/dashboard'));

// Unknown API routes
app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found.' }));

// Any uncaught error becomes clean JSON (Express 5 forwards async errors here)
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON.' });
  res.status(500).json({ message: 'Server error.' });
});

// Locally (npm start) we listen on a port. On Vercel the platform calls the exported app instead.
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`JobCompass running at http://localhost:${PORT}`));
}

module.exports = app;