const { Pool } = require('pg');
require('./env');
const { buildPoolConfig } = require('./dbConfig');

const pool = new Pool(buildPoolConfig(process.env));

// Test connection
const testConnection = async () => {
  const client = await pool.connect();
  console.log('PostgreSQL Database Connected Successfully');
  client.release();
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
