const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseSeedArgs } = require('../seed-database');

test('requires at least one of --catalog, --demo or --all', () => {
  assert.throws(() => parseSeedArgs([], {}), /Specificeer/);
});

test('--catalog seeds the catalog only', () => {
  assert.deepEqual(parseSeedArgs(['--catalog'], {}), { catalog: true, demo: false });
});

test('--all seeds both catalog and demo', () => {
  assert.deepEqual(parseSeedArgs(['--all'], {}), { catalog: true, demo: true });
});

test('--demo is refused under NODE_ENV=production', () => {
  assert.throws(() => parseSeedArgs(['--demo'], { NODE_ENV: 'production' }), /productie/);
});

test('--all is refused under NODE_ENV=production because it includes demo data', () => {
  assert.throws(() => parseSeedArgs(['--all'], { NODE_ENV: 'production' }), /productie/);
});

test('--catalog alone is allowed under NODE_ENV=production', () => {
  assert.deepEqual(parseSeedArgs(['--catalog'], { NODE_ENV: 'production' }), { catalog: true, demo: false });
});
