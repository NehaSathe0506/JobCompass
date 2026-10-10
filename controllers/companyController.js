// Company Module: store and manage company details.
// Every query filters by user_id so a user only ever sees their own companies.
const db = require('../config/db');

// GET /api/companies
exports.list = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM companies WHERE user_id = ? ORDER BY name', [
    req.user.id,
  ]);
  res.json(rows);
};

// POST /api/companies
exports.create = async (req, res) => {
  const { name, website, location, contact_person, contact_email, notes } = req.body;
  if (!name) return res.status(400).json({ message: 'Company name is required.' });

  const [result] = await db.query(
    `INSERT INTO companies (user_id, name, website, location, contact_person, contact_email, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, name, website || null, location || null, contact_person || null, contact_email || null, notes || null]
  );
  res.status(201).json({ id: result.insertId, message: 'Company added.' });
};

// PUT /api/companies/:id
exports.update = async (req, res) => {
  const { name, website, location, contact_person, contact_email, notes } = req.body;
  if (!name) return res.status(400).json({ message: 'Company name is required.' });

  const [result] = await db.query(
    `UPDATE companies SET name = ?, website = ?, location = ?, contact_person = ?, contact_email = ?, notes = ?
     WHERE id = ? AND user_id = ?`,
    [name, website || null, location || null, contact_person || null, contact_email || null, notes || null, req.params.id, req.user.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Company not found.' });
  res.json({ message: 'Company updated.' });
};

// DELETE /api/companies/:id  (its applications are removed too by ON DELETE CASCADE)
exports.remove = async (req, res) => {
  const [result] = await db.query('DELETE FROM companies WHERE id = ? AND user_id = ?', [
    req.params.id,
    req.user.id,
  ]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Company not found.' });
  res.json({ message: 'Company deleted.' });
};
