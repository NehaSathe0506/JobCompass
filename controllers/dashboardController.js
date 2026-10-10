// Dashboard Module: numbers that show placement progress at a glance.
const db = require('../config/db');

// GET /api/dashboard
exports.stats = async (req, res) => {
  const uid = req.user.id;

  // Count of applications per status (for the pie/bar chart)
  const [byStatus] = await db.query(
    'SELECT status, COUNT(*) AS count FROM applications WHERE user_id = ? GROUP BY status',
    [uid]
  );

  // Count per type: Internship vs Job
  const [byType] = await db.query(
    'SELECT type, COUNT(*) AS count FROM applications WHERE user_id = ? GROUP BY type',
    [uid]
  );

  // Deadlines in the next 7 days that are not done yet
  const [upcomingDeadlines] = await db.query(
    `SELECT d.*, c.name AS company, a.role FROM deadlines d
     JOIN applications a ON d.application_id = a.id
     JOIN companies c ON a.company_id = c.id
     WHERE a.user_id = ? AND d.is_done = FALSE
       AND d.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
     ORDER BY d.due_date`,
    [uid]
  );

  // Follow-ups due today or overdue
  const [dueFollowUps] = await db.query(
    `SELECT f.*, c.name AS company, a.role FROM follow_ups f
     JOIN applications a ON f.application_id = a.id
     JOIN companies c ON a.company_id = c.id
     WHERE a.user_id = ? AND f.is_done = FALSE AND f.follow_up_date <= CURDATE()
     ORDER BY f.follow_up_date`,
    [uid]
  );

  // Next 5 interviews from now onwards
  const [upcomingInterviews] = await db.query(
    `SELECT i.*, c.name AS company, a.role FROM interviews i
     JOIN applications a ON i.application_id = a.id
     JOIN companies c ON a.company_id = c.id
     WHERE a.user_id = ? AND i.interview_date >= NOW()
     ORDER BY i.interview_date LIMIT 5`,
    [uid]
  );

  const total = byStatus.reduce((sum, r) => sum + r.count, 0);
  res.json({ total, byStatus, byType, upcomingDeadlines, dueFollowUps, upcomingInterviews });
};
