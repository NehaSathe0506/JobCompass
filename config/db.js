// Creates a MySQL connection pool. A pool reuses connections, which is faster
// than opening a new connection for every request.
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // return DATE/DATETIME as plain strings (no timezone shifts)
});

module.exports = pool;
