const { test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const {
  validateAdminInput,
  buildAdminUser,
  createAdminService,
} = require('../scripts/createAdmin');

const VALID_INPUT = {
  email: 'nieuwe.docent@school.nl',
  firstName: 'Nieuwe',
  lastName: 'Docent',
  password: 'een-heel-lang-wachtwoord',
};

test('validateAdminInput rejects a malformed email', () => {
  const errors = validateAdminInput({ ...VALID_INPUT, email: 'not-an-email' });
  assert.ok(errors.some((e) => /e-mail/i.test(e)));
});

test('validateAdminInput rejects a password shorter than 12 characters', () => {
  const errors = validateAdminInput({ ...VALID_INPUT, password: 'kort12345' });
  assert.ok(errors.some((e) => /wachtwoord/i.test(e)));
});

test('validateAdminInput rejects a role other than admin or teacher', () => {
  const errors = validateAdminInput({ ...VALID_INPUT, role: 'student' });
  assert.ok(errors.some((e) => /rol/i.test(e)));
});

test('validateAdminInput accepts complete, valid input', () => {
  assert.deepEqual(validateAdminInput(VALID_INPUT), []);
});

test('buildAdminUser defaults to the admin role', async () => {
  const admin = await buildAdminUser(VALID_INPUT);
  assert.equal(admin.role, 'admin');
});

test('buildAdminUser hashes the password and never returns the plaintext', async () => {
  const admin = await buildAdminUser(VALID_INPUT);
  assert.equal(admin.password, undefined);
  assert.notEqual(admin.passwordHash, VALID_INPUT.password);
  assert.ok(await bcrypt.compare(VALID_INPUT.password, admin.passwordHash));
});

test('buildAdminUser rejects invalid input', async () => {
  await assert.rejects(buildAdminUser({ ...VALID_INPUT, password: 'short' }));
});

function makeFakeDb({ existingUser = null } = {}) {
  const events = [];
  const query = async (sql, params) => {
    events.push([sql.trim(), params]);
    if (sql.includes('SELECT id, role FROM users')) {
      return [existingUser ? [existingUser] : []];
    }
    if (sql.trim().startsWith('UPDATE')) {
      return [[]];
    }
    return [[]];
  };
  const insertAndGetId = async (sql, params) => {
    events.push([sql.trim(), params]);
    return 99;
  };
  return { query, insertAndGetId, events };
}

test('createOrPromote creates a new admin when the email is unused', async () => {
  const { query, insertAndGetId, events } = makeFakeDb();
  const service = createAdminService({ query, insertAndGetId });

  const result = await service.createOrPromote(VALID_INPUT);

  assert.deepEqual(result, { id: 99, email: VALID_INPUT.email, role: 'admin', promoted: false });
  assert.ok(events.some(([sql]) => sql.startsWith('INSERT INTO users')));
});

test('createOrPromote refuses an existing email without --promote', async () => {
  const { query, insertAndGetId } = makeFakeDb({ existingUser: { id: 5, role: 'student' } });
  const service = createAdminService({ query, insertAndGetId });

  await assert.rejects(service.createOrPromote(VALID_INPUT), /bestaat al/);
});

test('--promote only changes the role and leaves the password untouched', async () => {
  const { query, insertAndGetId, events } = makeFakeDb({ existingUser: { id: 5, role: 'student' } });
  const service = createAdminService({ query, insertAndGetId });

  const result = await service.createOrPromote({ ...VALID_INPUT, role: 'teacher', promote: true });

  assert.deepEqual(result, { id: 5, email: VALID_INPUT.email, role: 'teacher', promoted: true });
  assert.ok(!events.some(([sql]) => sql.startsWith('INSERT INTO users')));
  const updateCall = events.find(([sql]) => sql.startsWith('UPDATE'));
  assert.ok(updateCall, 'expected an UPDATE query');
  assert.deepEqual(updateCall[1], ['teacher', 5]);
});
