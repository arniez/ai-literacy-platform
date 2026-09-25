const fs = require('fs');
const path = require('path');
require('./config/env');

const MIGRATIONS = {
  postgres: 'add-ai-student-lessons.postgres.sql',
};

function getMigrationFilename(dbType) {
  const filename = MIGRATIONS[String(dbType || '').toLowerCase()];
  if (!filename) throw new Error(`Unsupported database type: ${dbType}`);
  return filename;
}

async function runMigration({ dbType, pool, migrationsDirectory } = {}) {
  const database = pool ? null : require('./config/db-universal');
  const selectedDbType = dbType || database?.dbType || process.env.DB_TYPE || 'postgres';
  const filename = getMigrationFilename(selectedDbType);
  const migrationPath = path.join(migrationsDirectory || path.join(__dirname, 'migrations'), filename);
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');
  const statements = migrationSql.split(';').map((statement) => statement.trim()).filter(Boolean);
  const migrationPool = pool || database.pool;
  for (const statement of statements) await migrationPool.query(statement);
  return filename;
}

if (require.main === module) {
  runMigration()
    .then((filename) => console.log(`AI student lessons migration completed: ${filename}`))
    .catch((error) => { console.error('AI student lessons migration failed:', error.message); process.exitCode = 1; })
    .finally(async () => {
      try { await require('./config/db-universal').pool.end(); } catch (error) {
        if (!process.exitCode) { console.error('Could not close the database pool:', error.message); process.exitCode = 1; }
      }
    });
}

module.exports = { getMigrationFilename, runMigration };
