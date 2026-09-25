const fs = require('fs');
const path = require('path');

const MIGRATION_FILENAME_PATTERN = /^\d{3}_[a-z0-9_]+\.sql$/;
// Fixed advisory lock key for this app's migrations, so two deploys never migrate at once.
const ADVISORY_LOCK_KEY = 725918;

function listMigrations(dir) {
  const files = fs.readdirSync(dir).filter((name) => name.endsWith('.sql')).sort();
  return files.map((file) => {
    if (!MIGRATION_FILENAME_PATTERN.test(file)) {
      throw new Error(`Invalid migration filename (expected NNN_name.sql): ${file}`);
    }
    return { id: file.replace(/\.sql$/, ''), file: path.join(dir, file) };
  });
}

async function ensureMigrationsTable(client) {
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
}

async function getAppliedIds(client) {
  await ensureMigrationsTable(client);
  const { rows } = await client.query('SELECT id FROM schema_migrations');
  return new Set(rows.map((row) => row.id));
}

async function runMigrations({ pool, dir, log = () => {} }) {
  const client = await pool.connect();
  const applied = [];
  try {
    await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_KEY]);
    try {
      const appliedIds = await getAppliedIds(client);
      const migrations = listMigrations(dir);

      for (const migration of migrations) {
        if (appliedIds.has(migration.id)) continue;

        const sql = fs.readFileSync(migration.file, 'utf8');
        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [migration.id]);
          await client.query('COMMIT');
          applied.push(migration.id);
          log(`Applied ${migration.id}`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      }
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]);
    }
  } finally {
    client.release();
  }
  return applied;
}

async function baseline({ pool, dir, upTo }) {
  const client = await pool.connect();
  try {
    const appliedIds = await getAppliedIds(client);
    if (appliedIds.size > 0) {
      throw new Error('baseline weigert: schema_migrations bevat al rijen.');
    }

    let migrations = listMigrations(dir);
    if (upTo) {
      const index = migrations.findIndex((m) => m.id === upTo || m.id.startsWith(upTo));
      if (index === -1) throw new Error(`Onbekende migratie voor --up-to: ${upTo}`);
      migrations = migrations.slice(0, index + 1);
    }

    for (const migration of migrations) {
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [migration.id]);
    }

    return migrations.map((m) => m.id);
  } finally {
    client.release();
  }
}

async function status({ pool, dir }) {
  const client = await pool.connect();
  try {
    const appliedIds = await getAppliedIds(client);
    return listMigrations(dir).map((migration) => ({
      id: migration.id,
      applied: appliedIds.has(migration.id),
    }));
  } finally {
    client.release();
  }
}

if (require.main === module) {
  const { pool } = require('../config/db-universal');
  const dir = path.join(__dirname, '..', 'migrations', 'postgres');
  const args = process.argv.slice(2);

  async function main() {
    if (args.includes('--status')) {
      const rows = await status({ pool, dir });
      for (const row of rows) {
        console.log(`${row.applied ? '[x]' : '[ ]'} ${row.id}`);
      }
      return;
    }

    if (args.includes('--baseline')) {
      const upToIndex = args.indexOf('--up-to');
      const upTo = upToIndex !== -1 ? args[upToIndex + 1] : undefined;
      const ids = await baseline({ pool, dir, upTo });
      console.log(`Baseline: ${ids.length} migratie(s) gemarkeerd als toegepast.`);
      return;
    }

    const applied = await runMigrations({ pool, dir, log: console.log });
    console.log(applied.length ? `${applied.length} migratie(s) toegepast.` : 'Niets te doen.');
  }

  main()
    .catch((error) => {
      console.error('Migratie mislukt:', error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      try {
        await pool.end();
      } catch {
        // Pool may already be closed.
      }
    });
}

module.exports = { listMigrations, runMigrations, baseline, status };
