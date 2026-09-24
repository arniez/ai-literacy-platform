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
    dbType: 'postgres',
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
    dbType: 'postgres',
    pool: { connect: async () => client }
  });

  await assert.rejects(withTransaction(async () => { throw new Error('stop'); }), /stop/);
  assert.deepEqual(events, ['BEGIN', 'ROLLBACK', 'release']);
});

test('commits MySQL work and returns insertId without changing placeholders', async () => {
  const events = [];
  const connection = {
    beginTransaction: async () => events.push('beginTransaction'),
    query: async (sql, params) => {
      events.push([sql, params]);
      if (sql.startsWith('INSERT')) return [{ insertId: 23 }, []];
      return [[{ value: 7 }], []];
    },
    commit: async () => events.push('commit'),
    rollback: async () => events.push('rollback'),
    release: () => events.push('release')
  };
  const withTransaction = createTransactionRunner({
    dbType: 'mysql',
    pool: { getConnection: async () => connection }
  });

  const result = await withTransaction(async ({ query, insertAndGetId }) => {
    const [rows] = await query('SELECT ? AS value', [7]);
    const id = await insertAndGetId('INSERT INTO content (title) VALUES (?)', ['Tip']);
    return { rows, id };
  });

  assert.deepEqual(result, { rows: [{ value: 7 }], id: 23 });
  assert.deepEqual(events, [
    'beginTransaction',
    ['SELECT ? AS value', [7]],
    ['INSERT INTO content (title) VALUES (?)', ['Tip']],
    'commit',
    'release'
  ]);
});

test('rolls back and releases a MySQL connection when work fails', async () => {
  const events = [];
  const connection = {
    beginTransaction: async () => events.push('beginTransaction'),
    query: async () => [[], []],
    commit: async () => events.push('commit'),
    rollback: async () => events.push('rollback'),
    release: () => events.push('release')
  };
  const withTransaction = createTransactionRunner({
    dbType: 'mysql',
    pool: { getConnection: async () => connection }
  });

  await assert.rejects(withTransaction(async () => { throw new Error('stop'); }), /stop/);
  assert.deepEqual(events, ['beginTransaction', 'rollback', 'release']);
});
