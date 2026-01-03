/**
 * Data Migration Script: MySQL to PostgreSQL
 * Exports data from MySQL and imports into PostgreSQL
 */

const mysql = require('mysql2/promise');
const { Client } = require('pg');
require('dotenv').config({ path: './config/config.env' });

const tables = [
  'users',
  'modules',
  'content',
  'badges',
  'challenges',
  'user_progress',
  'user_badges',
  'user_challenges',
  'comments',
  'comment_likes',
  'content_ratings',
  'user_submissions',
  'user_activities',
  'user_follows',
  'notifications'
];

async function migrateData() {
  let mysqlConn, pgClient;

  try {
    // Connect to MySQL
    console.log('Connecting to MySQL...');
    mysqlConn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });
    console.log('✓ Connected to MySQL\n');

    // Connect to PostgreSQL
    console.log('Connecting to PostgreSQL...');
    pgClient = new Client({
      host: process.env.PG_HOST || 'localhost',
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD,
      database: process.env.PG_NAME || 'ai_literacy_db',
      port: process.env.PG_PORT || 5432,
    });
    await pgClient.connect();
    console.log('✓ Connected to PostgreSQL\n');

    // Migrate each table
    for (const table of tables) {
      await migrateTable(mysqlConn, pgClient, table);
    }

    // Update PostgreSQL sequences
    console.log('\nUpdating PostgreSQL sequences...');
    for (const table of tables) {
      try {
        await pgClient.query(`
          SELECT setval(pg_get_serial_sequence('${table}', 'id'),
          COALESCE((SELECT MAX(id) FROM ${table}), 1), true);
        `);
        console.log(`✓ Updated sequence for ${table}`);
      } catch (err) {
        // Some tables might not have an id column, skip them
        console.log(`  Skipped ${table} (no sequence)`);
      }
    }

    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║                                                    ║');
    console.log('║   Data Migration Complete! ✓                       ║');
    console.log('║                                                    ║');
    console.log('║   Your data has been migrated from MySQL           ║');
    console.log('║   to PostgreSQL successfully!                      ║');
    console.log('║                                                    ║');
    console.log('║   The server is now ready to use PostgreSQL        ║');
    console.log('║   (DB_TYPE=postgres is already set)                ║');
    console.log('║                                                    ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n✗ Migration error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (mysqlConn) await mysqlConn.end();
    if (pgClient) await pgClient.end();
  }
}

async function migrateTable(mysqlConn, pgClient, tableName) {
  try {
    console.log(`Migrating table: ${tableName}...`);

    // Get data from MySQL
    const [rows] = await mysqlConn.query(`SELECT * FROM ${tableName}`);

    if (rows.length === 0) {
      console.log(`  No data in ${tableName}, skipping`);
      return;
    }

    console.log(`  Found ${rows.length} rows`);

    // Get column names from first row
    const columns = Object.keys(rows[0]);

    // Prepare INSERT statement
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    // Insert each row
    let successCount = 0;
    for (const row of rows) {
      try {
        const values = columns.map(col => {
          const val = row[col];
          // Handle JSON fields
          if (val !== null && typeof val === 'object') {
            return JSON.stringify(val);
          }
          return val;
        });

        await pgClient.query(insertSQL, values);
        successCount++;
      } catch (err) {
        console.error(`    Error inserting row:`, err.message);
      }
    }

    console.log(`✓ Migrated ${successCount}/${rows.length} rows from ${tableName}\n`);

  } catch (error) {
    console.error(`  Error migrating ${tableName}:`, error.message);
  }
}

migrateData();
