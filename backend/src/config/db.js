const mysql = require('mysql2/promise');
require('dotenv').config();

// SSL configuration for Cloud MySQL (TiDB Cloud, Aiven, Railway, etc.)
const isRemoteHost = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1';
const sslConfig = (process.env.DB_SSL === 'true' || isRemoteHost) 
  ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } 
  : undefined;

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
  decimalNumbers: true, // Returns numeric values as Javascript numbers rather than strings
  ssl: sslConfig
});

// Test connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected successfully to MySQL Database: ' + (process.env.DB_NAME || 'rental_management') + ' on ' + (process.env.DB_HOST || 'localhost'));
    connection.release();
  } catch (error) {
    console.warn('⚠️ MySQL connection notice:', error.message);
    console.log('💡 Ensure MySQL is running on ' + (process.env.DB_HOST || 'localhost') + ':' + (process.env.DB_PORT || 3306) + ' with schema imported from database/schema.sql');
  }
})();

module.exports = pool;
