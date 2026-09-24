const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getMigrationFilename } = require('../run-student-tips-migration');

test('selects the PostgreSQL student tips migration', () => {
  assert.equal(getMigrationFilename('postgres'), 'add-student-tips.postgres.sql');
});

test('selects the MySQL student tips migration', () => {
  assert.equal(getMigrationFilename('mysql'), 'add-student-tips.mysql.sql');
});

test('rejects unsupported database engines', () => {
  assert.throws(() => getMigrationFilename('sqlite'), /Unsupported database type/);
});
