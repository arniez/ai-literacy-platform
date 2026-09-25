const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildPoolConfig } = require('../config/dbConfig');

test('DATABASE_URL wins over the PG_* fields', () => {
  const config = buildPoolConfig({
    DATABASE_URL: 'postgres://user:pass@host:5432/db',
    PG_HOST: 'ignored-host',
    PG_NAME: 'ignored-db',
  });

  assert.deepEqual(config.connectionString, 'postgres://user:pass@host:5432/db');
  assert.equal(config.host, undefined);
  assert.equal(config.database, undefined);
});

test('DB_SSL=true enables ssl with rejectUnauthorized true by default', () => {
  const config = buildPoolConfig({ DB_SSL: 'true' });
  assert.deepEqual(config.ssl, { rejectUnauthorized: true });
});

test('DB_SSL=true with DB_SSL_REJECT_UNAUTHORIZED=false disables certificate checking', () => {
  const config = buildPoolConfig({ DB_SSL: 'true', DB_SSL_REJECT_UNAUTHORIZED: 'false' });
  assert.deepEqual(config.ssl, { rejectUnauthorized: false });
});

test('without DB_SSL there is no ssl key', () => {
  const config = buildPoolConfig({});
  assert.equal('ssl' in config, false);
});

test('defaults without env variables match current behaviour', () => {
  const config = buildPoolConfig({});
  assert.equal(config.host, 'localhost');
  assert.equal(config.user, 'postgres');
  assert.equal(config.database, 'ai_literacy_db');
  assert.equal(config.port, 5432);
  assert.equal(config.max, 10);
});
