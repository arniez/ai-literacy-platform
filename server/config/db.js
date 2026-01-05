const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config/config.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Database Connected Successfully');
    connection.release();
  } catch (error) {
    console.error('Database Connection Error:', error);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
