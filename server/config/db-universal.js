/**
 * PostgreSQL database interface
 */

const { pool, testConnection } = require('./db-postgres');
const { createTransactionRunner } = require('./transactionRunner');

const dbType = 'postgres';

/**
 * Execute a query with automatic parameter conversion
 */
async function query(sql, params = []) {
  // Convert ? to $1, $2, $3 for PostgreSQL
  let paramCount = 1;
  const convertedSql = sql.replace(/\?/g, () => `$${paramCount++}`);

  const result = await pool.query(convertedSql, params);

  // Normalize result format: { rows: [...], rowCount: n, ... } -> [rows, result]
  return [result.rows, result];
}

/**
 * Get the last inserted ID from a RETURNING row
 */
function getInsertId(result, returnedRow = null) {
  return returnedRow ? returnedRow.id : null;
}

/**
 * Add RETURNING clause for INSERT/UPDATE
 */
function withReturning(sql, columns = 'id') {
  if (!sql.toLowerCase().includes('returning')) {
    const trimmed = sql.trim();
    if (trimmed.toLowerCase().startsWith('insert') ||
        trimmed.toLowerCase().startsWith('update')) {
      return `${sql} RETURNING ${columns}`;
    }
  }

  return sql;
}

/**
 * Execute INSERT and return the new ID
 */
async function insertAndGetId(sql, params = []) {
  const insertSql = withReturning(sql, 'id');
  const [rows] = await query(insertSql, params);
  return rows[0]?.id || null;
}

/**
 * Get affected rows count
 */
function getAffectedRows(result) {
  return result.rowCount || 0;
}

const withTransaction = createTransactionRunner({ pool });

module.exports = {
  pool,
  query,
  insertAndGetId,
  withTransaction,
  getInsertId,
  withReturning,
  getAffectedRows,
  testConnection,
  dbType
};
