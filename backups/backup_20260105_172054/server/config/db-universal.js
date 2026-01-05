/**
 * Universal Database Interface
 * Provides a consistent API that works with both MySQL and PostgreSQL
 */

const { pool, testConnection, dbType } = require('./db-factory');

/**
 * Execute a query with automatic parameter conversion
 * Handles differences between MySQL and PostgreSQL result formats
 */
async function query(sql, params = []) {
  // Convert ? to $1, $2, $3 for PostgreSQL
  let convertedSql = sql;
  if (dbType === 'postgres') {
    let paramCount = 1;
    convertedSql = sql.replace(/\?/g, () => `$${paramCount++}`);
  }

  const result = await pool.query(convertedSql, params);

  // Normalize result format
  if (dbType === 'postgres') {
    // PostgreSQL format: { rows: [...], rowCount: n, ... }
    return [result.rows, result];
  } else {
    // MySQL format: [rows, fields]
    return result;
  }
}

/**
 * Get the last inserted ID
 * Works differently in MySQL vs PostgreSQL
 */
function getInsertId(result, returnedRow = null) {
  if (dbType === 'postgres') {
    // PostgreSQL requires RETURNING clause
    return returnedRow ? returnedRow.id : null;
  } else {
    // MySQL has insertId property
    return result.insertId;
  }
}

/**
 * Add RETURNING clause for PostgreSQL INSERT/UPDATE
 * Returns query unchanged for MySQL
 */
function withReturning(sql, columns = 'id') {
  if (dbType !== 'postgres') {
    return sql;
  }

  // Add RETURNING clause if not present
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
 * Automatically handles RETURNING for PostgreSQL
 */
async function insertAndGetId(sql, params = []) {
  const insertSql = withReturning(sql, 'id');
  const [rows, result] = await query(insertSql, params);

  if (dbType === 'postgres') {
    return rows[0]?.id || null;
  } else {
    return result.insertId;
  }
}

/**
 * Get affected rows count
 */
function getAffectedRows(result) {
  if (dbType === 'postgres') {
    return result.rowCount || 0;
  } else {
    return result.affectedRows || 0;
  }
}

module.exports = {
  pool,
  query,
  insertAndGetId,
  getInsertId,
  withReturning,
  getAffectedRows,
  testConnection,
  dbType
};
