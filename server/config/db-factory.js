require('dotenv').config({ path: './config/config.env' });

const dbType = process.env.DB_TYPE || 'mysql';

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
