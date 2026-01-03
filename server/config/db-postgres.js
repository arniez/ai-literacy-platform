const { Pool } = require('pg');
require('dotenv').config({ path: './config/config.env' });

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD,
  database: process.env.PG_NAME || 'ai_literacy_db',
  port: process.env.PG_PORT || 5432,
  max: 10, // maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL Database Connected Successfully');
    client.release();
  } catch (error) {
    console.error('Database Connection Error:', error.message);
    process.exit(1);
  }
};

// Helper function to execute queries with consistent error handling
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

module.exports = { pool, query, testConnection };
