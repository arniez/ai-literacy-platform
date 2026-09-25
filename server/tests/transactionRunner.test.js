const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createTransactionRunner } = require('../config/transactionRunner');

test('commits PostgreSQL work, converts placeholders, and returns inserted IDs', async () => {
  const events = [];
  const client = {
    query: async (sql, params) => {
      events.push([sql, params]);
      if (sql.startsWith('INSERT')) return { rows: [{ id: 42 }], rowCount: 1 };
      return { rows: [{ value: 7 }], rowCount: 1 };
    },
    release: () => events.push('release')
  };
  const withTransaction = createTransactionRunner({
    pool: { connect: async () => client }
  });

  const result = await withTransaction(async ({ query, insertAndGetId }) => {
    const [rows] = await query('SELECT ? AS value', [7]);
    const id = await insertAndGetId('INSERT INTO content (title) VALUES (?)', ['Tip']);
    return { rows, id };
  });

  assert.deepEqual(result, { rows: [{ value: 7 }], id: 42 });
  assert.deepEqual(events, [
    ['BEGIN', undefined],
    ['SELECT $1 AS value', [7]],
    ['INSERT INTO content (title) VALUES ($1) RETURNING id', ['Tip']],
    ['COMMIT', undefined],
    'release'
  ]);
});

test('rolls back and releases a PostgreSQL client when work fails', async () => {
  const events = [];
  const client = {
    query: async (sql) => { events.push(sql); return { rows: [], rowCount: 0 }; },
    release: () => events.push('release')
  };
  const withTransaction = createTransactionRunner({
    pool: { connect: async () => client }
  });

  await assert.rejects(withTransaction(async () => { throw new Error('stop'); }), /stop/);
  assert.deepEqual(events, ['BEGIN', 'ROLLBACK', 'release']);
});

test('requires a database pool', () => {
  assert.throws(() => createTransactionRunner({}), /pool is required/);
});
