const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool for optimal performance and connection reuse
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rental_management',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true // Returns numeric values as Javascript numbers rather than strings
});

// Test connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected successfully to MySQL Database: ' + (process.env.DB_NAME || 'rental_management'));
    connection.release();
  } catch (error) {
    console.warn('⚠️ MySQL connection notice:', error.message);
    console.log('ℹ️ Ensure MySQL is running on port 3306 with schema imported from database/schema.sql');
  }
})();

module.exports = pool;
