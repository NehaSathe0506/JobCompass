-- Migration 001: add indexes and applications.updated_at to an EXISTING database.
-- Safe to run on a database that already has data (it does not drop anything).
-- Fresh installs do not need this file: database/schema.sql already includes these changes.
-- Run once:  mysql -u root -p jobcompass < database/migrations/001_add_indexes.sql
USE jobcompass;

ALTER TABLE applications ADD INDEX idx_applications_user_status (user_id, status);
ALTER TABLE applications ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE deadlines    ADD INDEX idx_deadlines_due (due_date);
ALTER TABLE follow_ups   ADD INDEX idx_followups_date (follow_up_date);
ALTER TABLE interviews   ADD INDEX idx_interviews_date (interview_date);