/**
 * PostgreSQL Database Setup Script
 * Creates the database and runs the schema
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config/config.env' });

async function setupDatabase() {
  // First, connect to postgres database to create our database
  const setupClient = new Client({
    host: process.env.PG_HOST || 'localhost',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD,
    database: 'postgres', // Connect to default postgres database
    port: process.env.PG_PORT || 5432,
  });

  try {
    await setupClient.connect();
    console.log('✓ Connected to PostgreSQL server');

    // Check if database exists
    const dbCheckResult = await setupClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [process.env.PG_NAME || 'ai_literacy_db']
    );

    if (dbCheckResult.rows.length === 0) {
      // Create database
      await setupClient.query(`CREATE DATABASE ${process.env.PG_NAME || 'ai_literacy_db'}`);
      console.log(`✓ Created database: ${process.env.PG_NAME || 'ai_literacy_db'}`);
    } else {
      console.log(`✓ Database already exists: ${process.env.PG_NAME || 'ai_literacy_db'}`);
    }

    await setupClient.end();

    // Now connect to our new database and run schema
    const dbClient = new Client({
      host: process.env.PG_HOST || 'localhost',
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD,
      database: process.env.PG_NAME || 'ai_literacy_db',
      port: process.env.PG_PORT || 5432,
    });

    await dbClient.connect();
    console.log(`✓ Connected to database: ${process.env.PG_NAME || 'ai_literacy_db'}`);

    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'config', 'database-postgres.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('✓ Executing schema...');
    await dbClient.query(schema);
    console.log('✓ Schema created successfully!');

    await dbClient.end();

    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║                                                    ║');
    console.log('║   PostgreSQL Database Setup Complete! ✓           ║');
    console.log('║                                                    ║');
    console.log('║   Next steps:                                      ║');
    console.log('║   1. Run: node export-mysql-data.js               ║');
    console.log('║      (to export your MySQL data)                   ║');
    console.log('║   2. Run: node import-to-postgres.js              ║');
    console.log('║      (to import data into PostgreSQL)              ║');
    console.log('║   3. Update config.env: DB_TYPE=postgres           ║');
    console.log('║   4. Start server: npm start                       ║');
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
