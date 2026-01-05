require('dotenv').config({ path: './config/config.env' });
const { pool } = require('./config/db-postgres');
const fs = require('fs');

const tables = [
  'users',
  'modules',
  'content',
  'user_progress',
  'user_badges',
  'badges',
  'challenges',
  'user_challenges',
  'comments',
  'content_ratings',
  'notifications'
];

async function exportData() {
  console.log('🔍 Exporting seed data from PostgreSQL...\n');

  let seedSQL = `-- PostgreSQL Seed Data
-- Generated: ${new Date().toISOString()}
-- Database: ai_literacy_db

`;

  try {
    for (const table of tables) {
      console.log(`📦 Exporting ${table}...`);

      // Get all data from table
      const result = await pool.query(`SELECT * FROM ${table} ORDER BY id`);
      const rows = result.rows;

      if (rows.length === 0) {
        console.log(`   ⚠️  No data in ${table}`);
        continue;
      }

      console.log(`   ✓ Found ${rows.length} rows`);

      seedSQL += `\n-- ${table} (${rows.length} rows)\n`;

      // Get column names from first row
      const columns = Object.keys(rows[0]);

      for (const row of rows) {
        const values = columns.map(col => {
          const val = row[col];

          if (val === null) return 'NULL';
          if (typeof val === 'boolean') return val;
          if (typeof val === 'number') return val;
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;

          // String - escape single quotes
          return `'${String(val).replace(/'/g, "''")}'`;
        });

        seedSQL += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
      }
    }

    // Add sequence updates
    seedSQL += `\n-- Update sequences\n`;
    for (const table of tables) {
      seedSQL += `SELECT setval('${table}_id_seq', (SELECT MAX(id) FROM ${table}), true);\n`;
    }

    // Write to file
    const outputPath = './config/seed-data.sql';
    fs.writeFileSync(outputPath, seedSQL);

    console.log(`\n✅ Seed data exported to ${outputPath}`);
    console.log(`📊 Total tables: ${tables.length}`);

    await pool.end();
  } catch (error) {
    console.error('❌ Export error:', error);
    process.exit(1);
  }
}

exportData();
