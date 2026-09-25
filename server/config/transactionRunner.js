function convertPlaceholders(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

function withReturningId(sql) {
  const statement = sql.trim().replace(/;$/, '');
  return /\breturning\b/i.test(statement) ? statement : `${statement} RETURNING id`;
}

function createTransactionRunner({ pool } = {}) {
  if (!pool) throw new Error('A database pool is required.');

  return async function withTransaction(work) {
    if (typeof work !== 'function') throw new TypeError('Transaction work must be a function.');

    const connection = await pool.connect();
    let transactionStarted = false;

    try {
      await connection.query('BEGIN');
      transactionStarted = true;

      const query = async (sql, params = []) => {
        const result = await connection.query(convertPlaceholders(sql), params);
        return [result.rows, result];
      };

      const insertAndGetId = async (sql, params = []) => {
        const [rows] = await query(withReturningId(sql), params);
        return rows[0]?.id ?? null;
      };

      const result = await work({ query, insertAndGetId });
      await connection.query('COMMIT');
      transactionStarted = false;
      return result;
    } catch (error) {
      if (transactionStarted) {
        try {
          await connection.query('ROLLBACK');
        } catch {
          // Preserve the original transaction error.
        }
      }
      throw error;
    } finally {
      connection.release();
    }
  };
}

module.exports = { createTransactionRunner };
