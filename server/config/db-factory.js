const path = require('path');
const fs = require('fs');

// Only load from config.env if it exists (for local development)
const configPath = path.join(__dirname, 'config.env');
if (fs.existsSync(configPath)) {
  require('dotenv').config({ path: configPath });
}

const dbType = process.env.DB_TYPE || 'mysql';

console.log('DB_TYPE environment variable:', process.env.DB_TYPE);
console.log('Selected database type:', dbType);

let pool, testConnection;

if (dbType === 'postgres') {
  const pgDb = require('./db-postgres');
  pool = pgDb.pool;
  testConnection = pgDb.testConnection;
  console.log('Using PostgreSQL database');
} else {
  const mysqlDb = require('./db');
  pool = mysqlDb.pool;
  testConnection = mysqlDb.testConnection;
  console.log('Using MySQL database');
}

module.exports = { pool, testConnection, dbType };
