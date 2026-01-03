/**
 * Query Converter Utility
 * Converts MySQL-style parameterized queries to PostgreSQL-style
 * MySQL uses ? placeholders, PostgreSQL uses $1, $2, $3, etc.
 */

const { dbType } = require('../config/db-factory');

/**
 * Convert MySQL query placeholders (?) to PostgreSQL placeholders ($1, $2, etc.)
 * @param {string} query - SQL query with ? placeholders
 * @returns {string} - Converted query with $1, $2, $3 placeholders (if using PostgreSQL)
 */
function convertQuery(query) {
  if (dbType !== 'postgres') {
    return query; // Return unchanged for MySQL
  }

  let paramCount = 1;
  return query.replace(/\?/g, () => `$${paramCount++}`);
}

/**
 * Execute a database query with automatic conversion
 * @param {object} pool - Database connection pool
 * @param {string} query - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise} - Query result
 */
async function executeQuery(pool, query, params = []) {
  const convertedQuery = convertQuery(query);

  if (dbType === 'postgres') {
    // PostgreSQL returns result directly
    const result = await pool.query(convertedQuery, params);
    return result;
  } else {
    // MySQL returns [rows, fields]
    const [rows, fields] = await pool.query(convertedQuery, params);
    return { rows, fields };
  }
}

/**
 * Get inserted ID from result
 * MySQL: result.insertId
 * PostgreSQL: result.rows[0].id (requires RETURNING id clause)
 */
function getInsertId(result) {
  if (dbType === 'postgres') {
    return result.rows && result.rows[0] ? result.rows[0].id : null;
  } else {
    return result.insertId;
  }
}

/**
 * Get rows from result
 * MySQL: first element of array
 * PostgreSQL: result.rows
 */
function getRows(result) {
  if (dbType === 'postgres') {
    return result.rows || [];
  } else {
    // MySQL pool.query returns [rows, fields]
    return Array.isArray(result) ? result[0] : result;
  }
}

/**
 * Get row count
 */
function getRowCount(result) {
  if (dbType === 'postgres') {
    return result.rowCount || 0;
  } else {
    const rows = getRows(result);
    return rows.length || 0;
  }
}

/**
 * Add RETURNING clause for INSERT/UPDATE queries in PostgreSQL
 * @param {string} query - SQL INSERT or UPDATE query
 * @param {string} returning - Columns to return (default: 'id')
 * @returns {string} - Modified query
 */
function addReturning(query, returning = 'id') {
  if (dbType !== 'postgres') {
    return query;
  }

  // Only add if not already present and it's an INSERT or UPDATE
  if (!query.toLowerCase().includes('returning') &&
      (query.trim().toLowerCase().startsWith('insert') ||
       query.trim().toLowerCase().startsWith('update'))) {
    return `${query} RETURNING ${returning}`;
  }

  return query;
}

module.exports = {
  convertQuery,
  executeQuery,
  getInsertId,
  getRows,
  getRowCount,
  addReturning,
  dbType
};
