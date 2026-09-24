function convertPlaceholders(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

function withReturningId(sql) {
  const statement = sql.trim().replace(/;$/, '');
  return /\breturning\b/i.test(statement) ? statement : `${statement} RETURNING id`;
}

function createTransactionRunner({ dbType, pool } = {}) {
  if (!['mysql', 'postgres'].includes(dbType)) {
    throw new Error(`Unsupported database type: ${dbType}`);
  }
  if (!pool) throw new Error('A database pool is required.');

  return async function withTransaction(work) {
    if (typeof work !== 'function') throw new TypeError('Transaction work must be a function.');

    const connection = dbType === 'postgres'
      ? await pool.connect()
      : await pool.getConnection();
    let transactionStarted = false;

    try {
      if (dbType === 'postgres') {
        await connection.query('BEGIN');
      } else {
        await connection.beginTransaction();
      }
      transactionStarted = true;

      const query = async (sql, params = []) => {
        const statement = dbType === 'postgres' ? convertPlaceholders(sql) : sql;
        const result = await connection.query(statement, params);
        return dbType === 'postgres' ? [result.rows, result] : result;
      };

      const insertAndGetId = async (sql, params = []) => {
        if (dbType === 'postgres') {
          const [rows] = await query(withReturningId(sql), params);
          return rows[0]?.id ?? null;
        }
        const [result] = await query(sql, params);
        return result?.insertId ?? null;
      };

      const result = await work({ query, insertAndGetId });
      if (dbType === 'postgres') {
        await connection.query('COMMIT');
      } else {
        await connection.commit();
      }
      transactionStarted = false;
      return result;
    } catch (error) {
      if (transactionStarted) {
        try {
          if (dbType === 'postgres') {
            await connection.query('ROLLBACK');
          } else {
            await connection.rollback();
          }
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
