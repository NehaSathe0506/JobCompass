// Creates a MySQL connection pool. A pool reuses connections, which is faster
// than opening a new connection for every request.
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10, // use 2-3 on Vercel (serverless)
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined, // set DB_SSL=true for cloud MySQL
  dateStrings: true, // return DATE/DATETIME as plain strings (no timezone shifts)
});

module.exports = pool;