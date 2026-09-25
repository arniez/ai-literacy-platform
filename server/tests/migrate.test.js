const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { listMigrations, runMigrations, baseline } = require('../db/migrate');

function makeTempDir(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'migrate-test-'));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content);
  }
  return dir;
}

function makeFakePool({ existingIds = [] } = {}) {
  const events = [];
  const rowsById = existingIds.map((id) => ({ id }));
  const client = {
    query: async (sql, params) => {
      events.push([sql.trim().split('\n')[0], params]);
      if (/^SELECT id FROM schema_migrations$/.test(sql.trim())) {
        return { rows: rowsById.slice() };
      }
      if (/^INSERT INTO schema_migrations/.test(sql.trim())) {
        rowsById.push({ id: params[0] });
        return { rows: [] };
      }
      return { rows: [] };
    },
    release: () => events.push(['release'])
  };
  const pool = { connect: async () => client };
  return { pool, events, client };
}

test('lists migrations sorted by filename and validates the naming pattern', () => {
  const dir = makeTempDir({
    '001_first.sql': 'SELECT 1;',
    '000_base.sql': 'SELECT 1;',
  });
  const migrations = listMigrations(dir);
  assert.deepEqual(migrations.map((m) => m.id), ['000_base', '001_first']);
});

test('rejects a migration file that does not match NNN_name.sql', () => {
  const dir = makeTempDir({
    '000_base.sql': 'SELECT 1;',
    'add-quiz.sql': 'SELECT 1;',
  });
  assert.throws(() => listMigrations(dir), /add-quiz\.sql/);
});

test('only runs migrations that are not yet applied', async () => {
  const dir = makeTempDir({
    '000_base.sql': 'CREATE TABLE a();',
    '001_second.sql': 'CREATE TABLE b();',
  });
  const { pool, events } = makeFakePool({ existingIds: ['000_base'] });

  const applied = await runMigrations({ pool, dir });

  assert.deepEqual(applied, ['001_second']);
  const bodyQueries = events.map((e) => e[0]);
  assert.ok(!bodyQueries.includes('CREATE TABLE a();'));
  assert.ok(bodyQueries.includes('CREATE TABLE b();'));
});

test('a failing migration rolls back and stops before the next migration', async () => {
  const dir = makeTempDir({
    '000_base.sql': 'CREATE TABLE a();',
    '001_broken.sql': 'BOOM',
    '002_third.sql': 'CREATE TABLE c();',
  });
  const { pool, events } = makeFakePool();
  const client = await pool.connect();
  const originalQuery = client.query;
  client.query = async (sql, params) => {
    if (sql.trim() === 'BOOM') throw new Error('syntax error');
    return originalQuery(sql, params);
  };
  const brokenPool = { connect: async () => client };

  await assert.rejects(runMigrations({ pool: brokenPool, dir }), /syntax error/);

  const bodyQueries = events.map((e) => e[0]);
  assert.ok(!bodyQueries.includes('CREATE TABLE c();'), 'the migration after the failure must not run');
  assert.ok(bodyQueries.includes('ROLLBACK'));
});

test('always releases the connection, even after a failure', async () => {
  const dir = makeTempDir({ '000_broken.sql': 'BOOM' });
  const { pool, events } = makeFakePool();
  const client = await pool.connect();
  client.query = async (sql) => {
    if (sql.trim() === 'BOOM') throw new Error('syntax error');
    return { rows: [] };
  };
  const brokenPool = { connect: async () => client };

  await assert.rejects(runMigrations({ pool: brokenPool, dir }));
  assert.ok(events.some((e) => e[0] === 'release'));
});

test('a file containing a $$ function body is executed as a single statement', async () => {
  const dir = makeTempDir({
    '000_function.sql': [
      'CREATE OR REPLACE FUNCTION f() RETURNS TRIGGER AS $$',
      'BEGIN',
      '  RETURN NEW;',
      'END;',
      '$$ language \'plpgsql\';'
    ].join('\n'),
  });
  const { pool, events } = makeFakePool();

  await runMigrations({ pool, dir });

  const fullBodies = events.map((e) => e[0]);
  assert.ok(fullBodies.some((line) => line.includes('CREATE OR REPLACE FUNCTION')));
});

test('baseline marks migrations as applied without running them', async () => {
  const dir = makeTempDir({
    '000_base.sql': 'CREATE TABLE a();',
    '001_second.sql': 'CREATE TABLE b();',
  });
  const { pool, events } = makeFakePool();

  const ids = await baseline({ pool, dir });

  assert.deepEqual(ids, ['000_base', '001_second']);
  const bodyQueries = events.map((e) => e[0]);
  assert.ok(!bodyQueries.includes('CREATE TABLE a();'));
  assert.ok(!bodyQueries.includes('CREATE TABLE b();'));
});

test('baseline refuses when schema_migrations already has rows', async () => {
  const dir = makeTempDir({ '000_base.sql': 'CREATE TABLE a();' });
  const { pool } = makeFakePool({ existingIds: ['000_base'] });

  await assert.rejects(baseline({ pool, dir }), /already|niet-lege|bevat al/i);
});

test('baseline --up-to only marks migrations up to and including the given id', async () => {
  const dir = makeTempDir({
    '000_base.sql': 'CREATE TABLE a();',
    '001_second.sql': 'CREATE TABLE b();',
    '002_third.sql': 'CREATE TABLE c();',
  });
  const { pool } = makeFakePool();

  const ids = await baseline({ pool, dir, upTo: '001' });

  assert.deepEqual(ids, ['000_base', '001_second']);
});
