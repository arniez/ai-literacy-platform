#!/usr/bin/env node
/**
 * Complete Database Setup and Seeding Script
 * Runs schema setup and seeding in one command
 */

const { Client } = require('pg');
const { pool } = require('./config/db-postgres');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config/config.env' });

async function setupAndSeed() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║                                                    ║');
  console.log('║   AI Literacy Platform - Database Setup           ║');
  console.log('║                                                    ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const dbClient = new Client({
    host: process.env.PG_HOST || 'localhost',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD,
    database: process.env.PG_NAME || 'ai_literacy_db',
    port: process.env.PG_PORT || 5432,
    ssl: process.env.PG_HOST && process.env.PG_HOST.includes('neon.tech') ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 15000,
  });

  try {
    // STEP 1: Connect to database
    console.log('📡 Step 1/3: Connecting to Neon database...');
    console.log(`   Host: ${process.env.PG_HOST}`);
    console.log(`   Database: ${process.env.PG_NAME}\n`);

    await dbClient.connect();
    console.log('✅ Connected successfully!\n');

    // STEP 2: Set up schema
    console.log('🔨 Step 2/3: Setting up database schema...');
    const schemaPath = path.join(__dirname, 'config', 'database-postgres.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    await dbClient.query(schema);

    // Verify tables
    const tables = await dbClient.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`✅ Created ${tables.rows.length} tables:`);
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
    console.log('');

    await dbClient.end();

    // STEP 3: Seed database
    console.log('🌱 Step 3/3: Seeding database with initial data...\n');

    const seedFilePath = path.join(__dirname, 'config', 'seed-data.sql');

    if (!fs.existsSync(seedFilePath)) {
      console.error('❌ Seed file not found:', seedFilePath);
      console.log('💡 The seed data file is missing. Please check the config directory.');
      process.exit(1);
    }

    const seedSQL = fs.readFileSync(seedFilePath, 'utf8');

    // Use pool for seeding
    console.log('🗑️  Clearing existing data...');
    await pool.query('SET session_replication_role = replica;');

    const tables_to_clear = [
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

    for (const table of tables_to_clear) {
      await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`);
      console.log(`   ✓ Cleared ${table}`);
    }

    await pool.query('SET session_replication_role = DEFAULT;');

    console.log('\n💾 Inserting seed data...\n');

    const statements = seedSQL
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .filter(stmt => stmt.trim());

    let insertCount = 0;
    let sequenceCount = 0;

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed) continue;

      try {
        await pool.query(trimmed);

        if (trimmed.toLowerCase().startsWith('insert')) {
          insertCount++;
          if (insertCount % 10 === 0) {
            process.stdout.write('.');
          }
        } else if (trimmed.toLowerCase().includes('setval')) {
          sequenceCount++;
        }
      } catch (error) {
        console.error('\n❌ Error executing statement:', trimmed.substring(0, 100) + '...');
        console.error('   Error:', error.message);
      }
    }

    await pool.end();

    console.log('\n\n✅ Database seeded successfully!');
    console.log(`📊 Inserted ${insertCount} rows`);
    console.log(`🔢 Updated ${sequenceCount} sequences\n`);

    // Final summary
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║                                                    ║');
    console.log('║   ✅ Database Setup Complete!                      ║');
    console.log('║                                                    ║');
    console.log('║   Default Accounts:                                ║');
    console.log('║   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║');
    console.log('║                                                    ║');
    console.log('║   👤 Admin:                                        ║');
    console.log('║      Email: admin@ailiteracy.nl                    ║');
    console.log('║      Password: password123                         ║');
    console.log('║                                                    ║');
    console.log('║   👨‍🎓 Student:                                      ║');
    console.log('║      Email: student@student.nl                     ║');
    console.log('║      Password: password123                         ║');
    console.log('║                                                    ║');
    console.log('║   👨‍🏫 Teacher:                                      ║');
    console.log('║      Email: teacher@teacher.nl                     ║');
    console.log('║      Password: password123                         ║');
    console.log('║                                                    ║');
    console.log('║   Next: npm start (or npm run dev)                 ║');
    console.log('║                                                    ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nFull error:', error);
    console.error('\n🔍 Troubleshooting:');
    console.error('1. Check your credentials in config/config.env');
    console.error('2. Verify your IP is allowed in Neon dashboard');
    console.error('3. Ensure SSL is enabled for Neon connections');
    console.error('4. Check if Neon database is accessible\n');
    process.exit(1);
  }
}

setupAndSeed();
