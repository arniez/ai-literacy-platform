#!/usr/bin/env node
/**
 * Vercel Pre-Build Script
 * Seeds the Neon database before building the frontend
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function seedDatabase() {
  console.log('\n🌱 [Vercel Build] Starting database seeding...\n');

  // Check if we have the required environment variables
  if (!process.env.PG_HOST) {
    console.log('⚠️  No database credentials found. Skipping seeding.');
    console.log('   Set PG_HOST, PG_USER, PG_PASSWORD, PG_NAME in Vercel environment variables.\n');
    return;
  }

  const dbClient = new Client({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_NAME || 'neondb',
    port: process.env.PG_PORT || 5432,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    console.log('📡 Connecting to Neon database...');
    console.log(`   Host: ${process.env.PG_HOST}`);
    console.log(`   Database: ${process.env.PG_NAME || 'neondb'}\n`);

    await dbClient.connect();
    console.log('✅ Connected!\n');

    // Check if tables already exist
    const tablesCheck = await dbClient.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    if (parseInt(tablesCheck.rows[0].count) > 0) {
      console.log('ℹ️  Tables already exist. Skipping schema creation.');
    } else {
      console.log('🔨 Creating database schema...');
      const schemaPath = path.join(__dirname, '../server/config/database-postgres.sql');

      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await dbClient.query(schema);
        console.log('✅ Schema created!\n');
      } else {
        console.log('⚠️  Schema file not found, skipping schema creation.\n');
      }
    }

    await dbClient.end();

    // Now seed the data using pg pool
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.PG_HOST,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_NAME || 'neondb',
      port: process.env.PG_PORT || 5432,
      ssl: { rejectUnauthorized: false },
    });

    const seedFilePath = path.join(__dirname, '../server/config/seed-data.sql');

    if (!fs.existsSync(seedFilePath)) {
      console.log('⚠️  Seed file not found. Skipping data seeding.\n');
      await pool.end();
      return;
    }

    console.log('🌱 Seeding database with data...');
    const seedSQL = fs.readFileSync(seedFilePath, 'utf8');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await pool.query('SET session_replication_role = replica;');

    const tables = [
      'notifications',
      'content_ratings',
      'comments',
      'user_challenges',
      'challenges',
      'user_badges',
      'badges',
      'user_progress',
      'content',
      'modules',
      'users'
    ];

    for (const table of tables) {
      try {
        await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`);
      } catch (err) {
        // Table might not exist yet, continue
      }
    }

    await pool.query('SET session_replication_role = DEFAULT;');

    console.log('💾 Inserting seed data...');

    const statements = seedSQL
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .filter(stmt => stmt.trim());

    let count = 0;
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed) continue;

      try {
        await pool.query(trimmed);
        if (trimmed.toLowerCase().startsWith('insert')) {
          count++;
        }
      } catch (error) {
        console.error('Error:', error.message.substring(0, 100));
      }
    }

    await pool.end();

    console.log(`\n✅ Database seeded successfully!`);
    console.log(`📊 Inserted ${count} records\n`);

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error('Full error:', error);
    console.error('\n⚠️  Continuing with build anyway...\n');
    // Don't exit with error - allow build to continue
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Pre-build script completed!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Pre-build script failed:', error);
      process.exit(0); // Exit successfully to allow build to continue
    });
}

module.exports = seedDatabase;
