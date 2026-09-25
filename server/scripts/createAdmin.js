const path = require('path');
require(path.join(__dirname, '..', 'config', 'env'));
const bcrypt = require('bcryptjs');
const readline = require('readline');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ['admin', 'teacher'];
const MIN_PASSWORD_LENGTH = 12;
const SALT_ROUNDS = 10; // Matches authController.register.

function validateAdminInput({ email, firstName, lastName, password, role = 'admin' } = {}) {
  const errors = [];
  if (!email || !EMAIL_PATTERN.test(email)) errors.push('Ongeldig e-mailadres.');
  if (!firstName) errors.push('Voornaam is verplicht.');
  if (!lastName) errors.push('Achternaam is verplicht.');
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} tekens zijn.`);
  }
  if (!VALID_ROLES.includes(role)) {
    errors.push(`Rol moet admin of teacher zijn, kreeg: ${role}`);
  }
  return errors;
}

async function buildAdminUser(input) {
  const errors = validateAdminInput(input);
  if (errors.length) {
    throw new Error(`Ongeldige invoer:\n- ${errors.join('\n- ')}`);
  }

  const { email, firstName, lastName, role = 'admin', password, username } = input;
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const passwordHash = await bcrypt.hash(password, salt);

  return {
    username: username || email.split('@')[0],
    email,
    firstName,
    lastName,
    role,
    passwordHash,
  };
}

function createAdminService({ query, insertAndGetId }) {
  async function findByEmail(email) {
    const [rows] = await query('SELECT id, role FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  async function createOrPromote(input) {
    const existing = await findByEmail(input.email);

    if (existing) {
      if (!input.promote) {
        throw new Error(`Gebruiker met e-mail ${input.email} bestaat al. Gebruik --promote om de rol te wijzigen.`);
      }
      const role = input.role || 'admin';
      if (!VALID_ROLES.includes(role)) {
        throw new Error(`Rol moet admin of teacher zijn, kreeg: ${role}`);
      }
      await query('UPDATE users SET role = ? WHERE id = ?', [role, existing.id]);
      return { id: existing.id, email: input.email, role, promoted: true };
    }

    const admin = await buildAdminUser(input);
    const id = await insertAndGetId(
      `INSERT INTO users (username, email, password, first_name, last_name, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [admin.username, admin.email, admin.passwordHash, admin.firstName, admin.lastName, admin.role]
    );
    return { id, email: admin.email, role: admin.role, promoted: false };
  }

  return { createOrPromote, findByEmail };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    if (key === 'promote') {
      args.promote = true;
      continue;
    }
    args[key] = argv[i + 1];
    i += 1;
  }

  return {
    email: args.email,
    firstName: args['first-name'],
    lastName: args['last-name'],
    username: args.username,
    role: args.role || 'admin',
    promote: Boolean(args.promote),
  };
}

function promptHiddenPassword() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Suppress echo so the password is not shown while typing.
    rl._writeToOutput = () => {};
    rl.question('Wachtwoord: ', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function main() {
  const cliInput = parseArgs(process.argv.slice(2));
  const password = process.env.ADMIN_PASSWORD || (await promptHiddenPassword());
  const input = { ...cliInput, password };

  const { query, insertAndGetId, pool } = require('../config/db-universal');
  const service = createAdminService({ query, insertAndGetId });

  try {
    const result = await service.createOrPromote(input);
    console.log(
      result.promoted
        ? `Rol van ${result.email} bijgewerkt naar ${result.role}.`
        : `Beheerder ${result.email} aangemaakt met rol ${result.role} (id ${result.id}).`
    );
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { validateAdminInput, buildAdminUser, createAdminService, parseArgs };
