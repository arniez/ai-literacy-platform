/**
 * PostgreSQL Database Setup Script
 * Creates the database and runs the schema
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config/config.env' });

async function setupDatabase() {
  // Connect directly to the database (for Neon, database already exists)
  const dbClient = new Client({
    host: process.env.PG_HOST || 'localhost',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD,
    database: process.env.PG_NAME || 'ai_literacy_db',
    port: process.env.PG_PORT || 5432,
    ssl: process.env.PG_HOST && process.env.PG_HOST.includes('neon.tech') ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('Connecting to database:', process.env.PG_NAME || 'ai_literacy_db');
    console.log('Host:', process.env.PG_HOST);

    await dbClient.connect();
    console.log(`✓ Connected to database: ${process.env.PG_NAME || 'ai_literacy_db'}`);

    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'config', 'database-postgres.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('✓ Executing schema...');
    await dbClient.query(schema);
    console.log('✓ Schema created successfully!');

    // Verify tables were created
    const tables = await dbClient.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`✓ Created ${tables.rows.length} tables:`);
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));

    await dbClient.end();

    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║                                                    ║');
    console.log('║   PostgreSQL Database Setup Complete! ✓           ║');
    console.log('║                                                    ║');
    console.log('║   Next steps:                                      ║');
    console.log('║   1. Run: npm run seed                             ║');
    console.log('║      (to populate database with initial data)      ║');
    console.log('║   2. Start server: npm start                       ║');
    console.log('║                                                    ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('✗ Error setting up database:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Check your credentials in config.env');
    console.error('3. Verify PostgreSQL is installed and accessible');
    process.exit(1);
  }
}

setupDatabase();
