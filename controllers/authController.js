// User Module: register, login, profile
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Creates a signed token valid for 7 days
const makeToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, college } = req.body;

    // Server-side validation
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required.' });
    if (!/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ message: 'Enter a valid email.' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ message: 'Email already registered.' });

    // Never store plain passwords: bcrypt hashes with a salt
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, college) VALUES (?, ?, ?, ?)',
      [name, email, hash, college || null]
    );

    const user = { id: result.insertId, name, email, college: college || null };
    res.status(201).json({ token: makeToken(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ message: 'Invalid email or password.' });

    res.json({
      token: makeToken(user),
      user: { id: user.id, name: user.name, email: user.email, college: user.college },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/auth/profile
exports.getProfile = async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, name, email, college, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'User not found.' });
  res.json(rows[0]);
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  const { name, college } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required.' });
  await db.query('UPDATE users SET name = ?, college = ? WHERE id = ?', [
    name,
    college || null,
    req.user.id,
  ]);
  res.json({ message: 'Profile updated.' });
};
