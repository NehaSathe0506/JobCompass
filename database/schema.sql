-- JobCompass database schema (6 tables)
-- WARNING: this drops and recreates the jobcompass database (fresh start).
DROP DATABASE IF EXISTS jobcompass;
CREATE DATABASE jobcompass;
USE jobcompass;

-- User Module: one row per student account
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  college VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company Module: companies the student is tracking
CREATE TABLE companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  website VARCHAR(255),
  location VARCHAR(150),
  contact_person VARCHAR(150),
  contact_email VARCHAR(150),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Application Module: one application = one role at one company
CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  company_id INT NOT NULL,
  role VARCHAR(150) NOT NULL,
  type ENUM('Internship','Job') DEFAULT 'Internship',
  status ENUM('Applied','Interview','Selected','Rejected') DEFAULT 'Applied',
  applied_date DATE,
  job_link VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Deadline tracking (part of Application Module)
CREATE TABLE deadlines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  due_date DATE NOT NULL,
  is_done BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Follow-up tracking (Interview Module)
CREATE TABLE follow_ups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  follow_up_date DATE NOT NULL,
  method ENUM('Email','Call','LinkedIn','Other') DEFAULT 'Email',
  note TEXT,
  is_done BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Interview schedule + result (Interview Module)
CREATE TABLE interviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  round_name VARCHAR(100) NOT NULL,
  interview_date DATETIME NOT NULL,
  mode ENUM('Online','Offline') DEFAULT 'Online',
  result ENUM('Pending','Cleared','Rejected') DEFAULT 'Pending',
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);
