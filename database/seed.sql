-- JobCompass demo data. Run AFTER schema.sql:
--   mysql -u root -p < database/seed.sql
--
-- Demo login:  demo@jobcompass.com  /  Demo@123
-- Dates are relative to today, so the dashboard and calendar always have data.
USE jobcompass;

INSERT INTO users (id, name, email, password_hash, college) VALUES
  (1, 'Demo Student', 'demo@jobcompass.com',
   '$2b$10$bU5Us/PjXC2hMbGnVNVdDOIr2GDqyMMPUl.z.HatIKicvuOKhZPP2',
   'Demo College of Engineering');

INSERT INTO companies (id, user_id, name, website, location, contact_person, contact_email, notes) VALUES
  (1, 1, 'Google',  'https://careers.google.com', 'Bengaluru', 'Priya Sharma', 'recruiter@example.com', 'Referred by a senior'),
  (2, 1, 'Infosys', 'https://www.infosys.com',    'Pune',      NULL,           NULL,                    NULL),
  (3, 1, 'Zoho',    'https://www.zoho.com',       'Chennai',   'Arun Kumar',   'hr@example.com',        'Campus drive'),
  (4, 1, 'TCS',     'https://www.tcs.com',        'Mumbai',    NULL,           NULL,                    NULL);

INSERT INTO applications (id, user_id, company_id, role, type, status, applied_date, job_link, notes) VALUES
  (1, 1, 1, 'Software Engineer Intern', 'Internship', 'Interview', DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'https://careers.google.com/jobs/1', 'Cleared online test'),
  (2, 1, 1, 'Data Analyst',             'Job',        'Applied',   DATE_SUB(CURDATE(), INTERVAL 5 DAY),  NULL, NULL),
  (3, 1, 2, 'Systems Engineer',         'Job',        'Interview', DATE_SUB(CURDATE(), INTERVAL 30 DAY), NULL, 'HR round pending'),
  (4, 1, 3, 'Frontend Developer',       'Job',        'Selected',  DATE_SUB(CURDATE(), INTERVAL 45 DAY), NULL, 'Offer received'),
  (5, 1, 3, 'QA Intern',                'Internship', 'Applied',   DATE_SUB(CURDATE(), INTERVAL 2 DAY),  NULL, NULL),
  (6, 1, 4, 'Digital Intern',           'Internship', 'Rejected',  DATE_SUB(CURDATE(), INTERVAL 40 DAY), NULL, 'No response after test');

INSERT INTO deadlines (application_id, title, due_date, is_done) VALUES
  (2, 'Submit resume',            DATE_ADD(CURDATE(), INTERVAL 2 DAY),  FALSE),
  (5, 'Complete aptitude test',   DATE_ADD(CURDATE(), INTERVAL 5 DAY),  FALSE),
  (1, 'Upload ID proof',          DATE_ADD(CURDATE(), INTERVAL 12 DAY), FALSE),
  (4, 'Accept offer letter',      DATE_SUB(CURDATE(), INTERVAL 3 DAY),  TRUE);

INSERT INTO follow_ups (application_id, follow_up_date, method, note, is_done) VALUES
  (3, CURDATE(),                          'Email',    'Ask about HR round date', FALSE),
  (6, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'LinkedIn', 'Message the recruiter',   FALSE),
  (1, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Call',     'Check interview feedback', FALSE);

INSERT INTO interviews (application_id, round_name, interview_date, mode, result) VALUES
  (1, 'Technical Round 1', DATE_ADD(NOW(), INTERVAL 3 DAY), 'Online',  'Pending'),
  (3, 'HR Round',          DATE_ADD(NOW(), INTERVAL 6 DAY), 'Offline', 'Pending'),
  (1, 'Online Assessment', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Online', 'Cleared'),
  (4, 'Final Interview',   DATE_SUB(NOW(), INTERVAL 20 DAY), 'Offline','Cleared');