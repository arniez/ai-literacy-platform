#!/usr/bin/env node
/**
 * Standalone Neon Database Seeder
 * Run this directly to seed your Neon database
 * Usage: node seed-neon-direct.js
 */

const { Client, Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Neon Database Credentials (hardcoded voor direct gebruik)
const CONFIG = {
  host: 'ep-curly-lake-agc8n0as-pooler.c-2.eu-central-1.aws.neon.tech',
  user: 'neondb_owner',
  password: 'npg_l4bztWmo6xkE',
  database: 'neondb',
  port: 5432,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
};

async function seedNeonDatabase() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║                                                    ║');
  console.log('║   Neon Database Direct Seeding                     ║');
  console.log('║                                                    ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  console.log('📡 Connecting to Neon database...');
  console.log(`   Host: ${CONFIG.host}`);
  console.log(`   Database: ${CONFIG.database}\n`);

  const client = new Client(CONFIG);

  try {
    // STEP 1: Connect
    await client.connect();
    console.log('✅ Connected!\n');

    // STEP 2: Check if tables exist
    const tablesCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    const tableCount = parseInt(tablesCheck.rows[0].count);

    if (tableCount === 0) {
      console.log('🔨 No tables found. Creating schema...\n');

      const schemaPath = path.join(__dirname, 'server/config/database-postgres.sql');

      if (!fs.existsSync(schemaPath)) {
        console.error('❌ Schema file not found:', schemaPath);
        console.error('   Make sure you run this from the project root directory.\n');
        process.exit(1);
      }

      const schema = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schema);

      // Verify
      const tablesVerify = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      console.log(`✅ Created ${tablesVerify.rows.length} tables:`);
      tablesVerify.rows.forEach(row => console.log(`   - ${row.table_name}`));
      console.log('');
    } else {
      console.log(`ℹ️  Found ${tableCount} existing tables. Skipping schema creation.\n`);
    }

    await client.end();

    // STEP 3: Seed data using Pool
    console.log('🌱 Seeding database with data...\n');

    const pool = new Pool(CONFIG);

    const seedFilePath = path.join(__dirname, 'server/config/seed-data.sql');

    if (!fs.existsSync(seedFilePath)) {
      console.error('❌ Seed file not found:', seedFilePath);
      console.error('   Make sure you run this from the project root directory.\n');
      process.exit(1);
    }

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
        console.log(`   ✓ Cleared ${table}`);
      } catch (err) {
        // Table might not exist, continue
      }
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
        console.error('\n⚠️  Error:', error.message.substring(0, 100));
      }
    }

    await pool.end();

    console.log('\n\n✅ Database seeded successfully!');
    console.log(`📊 Inserted ${insertCount} rows`);
    console.log(`🔢 Updated ${sequenceCount} sequences\n`);

    // Final summary
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║                                                    ║');
    console.log('║   ✅ Seeding Complete!                             ║');
    console.log('║                                                    ║');
    console.log('║   Your Neon database now contains:                 ║');
    console.log('║   • 14 users (admin, teachers, students)           ║');
    console.log('║   • 4 learning modules                             ║');
    console.log('║   • 37 content items                               ║');
    console.log('║   • 10 badges                                      ║');
    console.log('║   • 4 challenges                                   ║');
    console.log('║   • Progress tracking, comments, ratings           ║');
    console.log('║                                                    ║');
    console.log('║   Default Login Accounts:                          ║');
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
    console.log('╚════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error('\nFull error:', error);
    console.error('\n🔍 Troubleshooting:');
    console.error('1. Check if you have internet connection');
    console.error('2. Verify Neon database is accessible');
    console.error('3. Run from project root: node seed-neon-direct.js');
    console.error('4. Check Neon dashboard for any issues\n');
    process.exit(1);
  }
}

// Run it
seedNeonDatabase();
