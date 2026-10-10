// Application Module: records applications and their status.
const db = require('../config/db');

const STATUSES = ['Applied', 'Interview', 'Selected', 'Rejected'];
const TYPES = ['Internship', 'Job'];

// Does this company belong to the logged-in user?
const ownsCompany = async (companyId, userId) => {
  const [rows] = await db.query('SELECT id FROM companies WHERE id = ? AND user_id = ?', [
    companyId,
    userId,
  ]);
  return rows.length > 0;
};

// GET /api/applications?status=Applied
exports.list = async (req, res) => {
  const { status } = req.query;
  let sql = `SELECT a.*, c.name AS company
             FROM applications a JOIN companies c ON a.company_id = c.id
             WHERE a.user_id = ?`;
  const params = [req.user.id];
  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY a.created_at DESC';
  const [rows] = await db.query(sql, params);
  res.json(rows);
};

// GET /api/applications/:id  (application + its deadlines, follow-ups, interviews)
exports.getOne = async (req, res) => {
  const [apps] = await db.query(
    `SELECT a.*, c.name AS company
     FROM applications a JOIN companies c ON a.company_id = c.id
     WHERE a.id = ? AND a.user_id = ?`,
    [req.params.id, req.user.id]
  );
  if (!apps.length) return res.status(404).json({ message: 'Application not found.' });

  const id = req.params.id;
  const [deadlines] = await db.query('SELECT * FROM deadlines WHERE application_id = ? ORDER BY due_date', [id]);
  const [followUps] = await db.query('SELECT * FROM follow_ups WHERE application_id = ? ORDER BY follow_up_date', [id]);
  const [interviews] = await db.query('SELECT * FROM interviews WHERE application_id = ? ORDER BY interview_date', [id]);

  res.json({ ...apps[0], deadlines, followUps, interviews });
};

// POST /api/applications
exports.create = async (req, res) => {
  const { company_id, role, type, status, applied_date, job_link, notes } = req.body;
  if (!company_id || !role) return res.status(400).json({ message: 'Company and role are required.' });
  if (type && !TYPES.includes(type)) return res.status(400).json({ message: 'Invalid type.' });
  if (status && !STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status.' });
  if (!(await ownsCompany(company_id, req.user.id)))
    return res.status(404).json({ message: 'Company not found.' });

  const [result] = await db.query(
    `INSERT INTO applications (user_id, company_id, role, type, status, applied_date, job_link, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, company_id, role, type || 'Internship', status || 'Applied', applied_date || null, job_link || null, notes || null]
  );
  res.status(201).json({ id: result.insertId, message: 'Application added.' });
};

// PUT /api/applications/:id
exports.update = async (req, res) => {
  const { company_id, role, type, status, applied_date, job_link, notes } = req.body;
  if (!company_id || !role) return res.status(400).json({ message: 'Company and role are required.' });
  if (type && !TYPES.includes(type)) return res.status(400).json({ message: 'Invalid type.' });
  if (status && !STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status.' });
  if (!(await ownsCompany(company_id, req.user.id)))
    return res.status(404).json({ message: 'Company not found.' });

  const [result] = await db.query(
    `UPDATE applications
     SET company_id = ?, role = ?, type = ?, status = ?, applied_date = ?, job_link = ?, notes = ?
     WHERE id = ? AND user_id = ?`,
    [company_id, role, type || 'Internship', status || 'Applied', applied_date || null, job_link || null, notes || null, req.params.id, req.user.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Application not found.' });
  res.json({ message: 'Application updated.' });
};

// DELETE /api/applications/:id  (child rows are removed by ON DELETE CASCADE)
exports.remove = async (req, res) => {
  const [result] = await db.query('DELETE FROM applications WHERE id = ? AND user_id = ?', [
    req.params.id,
    req.user.id,
  ]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Application not found.' });
  res.json({ message: 'Application deleted.' });
};
