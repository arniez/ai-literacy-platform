const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config', 'config.env') });

const MIGRATIONS = {
  postgres: 'add-student-tips.postgres.sql',
  mysql: 'add-student-tips.mysql.sql'
};

function getMigrationFilename(dbType) {
  const filename = MIGRATIONS[String(dbType || '').toLowerCase()];
  if (!filename) {
    throw new Error(`Unsupported database type: ${dbType}`);
  }
  return filename;
}

async function runMigration({ dbType, pool, migrationsDirectory } = {}) {
  const database = pool ? null : require('./config/db-factory');
  const selectedDbType = dbType || database?.dbType || process.env.DB_TYPE || 'mysql';
  const filename = getMigrationFilename(selectedDbType);
  const migrationPath = path.join(
    migrationsDirectory || path.join(__dirname, 'migrations'),
    filename
  );
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');
  const statements = migrationSql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
  const migrationPool = pool || database.pool;

  for (const statement of statements) {
    await migrationPool.query(statement);
  }

  return filename;
}

if (require.main === module) {
  runMigration()
    .then((filename) => {
      console.log(`Student tips migration completed: ${filename}`);
    })
    .catch((error) => {
      console.error('Student tips migration failed:', error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      try {
        const database = require('./config/db-factory');
        await database.pool.end();
      } catch (error) {
        if (!process.exitCode) {
          console.error('Could not close the database pool:', error.message);
          process.exitCode = 1;
        }
      }
    });
}

module.exports = { getMigrationFilename, runMigration };
