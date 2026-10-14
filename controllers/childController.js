// Builds list/create/update/remove handlers for any table linked to applications
// (deadlines, follow_ups, interviews). One factory = no repeated code.
//   table    - table name (hard-coded in routes/resources.js, never from user input)
//   fields   - columns the user may set
//   required - columns that must be present on create
//   orderBy  - column to sort the list by
const db = require('../config/db');

const ENUMS = {
  method: ['Email', 'Call', 'LinkedIn', 'Other'],
  mode: ['Online', 'Offline'],
  result: ['Pending', 'Cleared', 'Rejected'],
};
const DATE_RE = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/;

// Returns an error message, or null if the sent fields are valid
function validate(body, cols, required) {
  for (const c of cols) {
    const v = body[c];
    if (required.includes(c) && (v === null || v === '')) return `${c} is required.`;
    if (ENUMS[c] && !ENUMS[c].includes(v)) return `Invalid ${c}.`;
    if (c.endsWith('_date') && v !== null && !DATE_RE.test(v)) return `Invalid ${c}.`;
  }
  return null;
}

module.exports = function makeController({ table, fields, required, orderBy }) {
  // Ownership check: does this application belong to the logged-in user?
  const ownsApplication = async (applicationId, userId) => {
    const [rows] = await db.query('SELECT id FROM applications WHERE id = ? AND user_id = ?', [
      applicationId,
      userId,
    ]);
    return rows.length > 0;
  };

  return {
    // GET /api/<resource> -> all rows for this user, with company and role names
    list: async (req, res) => {
      const [rows] = await db.query(
        `SELECT t.*, c.name AS company, a.role
         FROM ${table} t
         JOIN applications a ON t.application_id = a.id
         JOIN companies c ON a.company_id = c.id
         WHERE a.user_id = ? ORDER BY t.${orderBy}`,
        [req.user.id]
      );
      res.json(rows);
    },

    // POST /api/<resource>
    create: async (req, res) => {
      const { application_id } = req.body;
      if (!application_id) return res.status(400).json({ message: 'application_id is required.' });
      for (const f of required) {
        if (!req.body[f]) return res.status(400).json({ message: `${f} is required.` });
      }
      if (!(await ownsApplication(application_id, req.user.id)))
        return res.status(404).json({ message: 'Application not found.' });

      const sent = fields.filter((f) => req.body[f] !== undefined);
      const bad = validate(req.body, sent, required);
      if (bad) return res.status(400).json({ message: bad });

      const cols = ['application_id', ...sent];
      const values = cols.map((c) => req.body[c]);
      const [result] = await db.query(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
        values
      );
      res.status(201).json({ id: result.insertId, message: 'Created.' });
    },

    // PUT /api/<resource>/:id -> updates only the fields that were sent
    update: async (req, res) => {
      const cols = fields.filter((f) => req.body[f] !== undefined);
      if (!cols.length) return res.status(400).json({ message: 'Nothing to update.' });
      const bad = validate(req.body, cols, required);
      if (bad) return res.status(400).json({ message: bad });

      const [result] = await db.query(
        `UPDATE ${table} t JOIN applications a ON t.application_id = a.id
         SET ${cols.map((c) => `t.${c} = ?`).join(', ')}
         WHERE t.id = ? AND a.user_id = ?`,
        [...cols.map((c) => req.body[c]), req.params.id, req.user.id]
      );
      if (!result.affectedRows) return res.status(404).json({ message: 'Not found.' });
      res.json({ message: 'Updated.' });
    },

    // DELETE /api/<resource>/:id
    remove: async (req, res) => {
      const [result] = await db.query(
        `DELETE t FROM ${table} t JOIN applications a ON t.application_id = a.id
         WHERE t.id = ? AND a.user_id = ?`,
        [req.params.id, req.user.id]
      );
      if (!result.affectedRows) return res.status(404).json({ message: 'Not found.' });
      res.json({ message: 'Deleted.' });
    },
  };
};
