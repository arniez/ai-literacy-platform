require('dotenv').config({ path: './config/config.env' });
const { pool } = require('./config/db-postgres');
const fs = require('fs');
const path = require('path');

async function seedDatabase() {
  console.log('🌱 Seeding database with initial data...\n');

  try {
    // Read seed data file
    const seedFilePath = path.join(__dirname, 'config', 'seed-data.sql');

    if (!fs.existsSync(seedFilePath)) {
      console.error('❌ Seed file not found:', seedFilePath);
      console.log('💡 Run "node export-seed-data.js" first to generate seed data');
      process.exit(1);
    }

    const seedSQL = fs.readFileSync(seedFilePath, 'utf8');

    console.log('📖 Reading seed data file...');
    console.log('🗑️  Clearing existing data...\n');

    // Disable foreign key checks temporarily
    await pool.query('SET session_replication_role = replica;');

    // Clear all tables in reverse order (to handle foreign keys)
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
      await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`);
      console.log(`   ✓ Cleared ${table}`);
    }

    // Re-enable foreign key checks
    await pool.query('SET session_replication_role = DEFAULT;');

    console.log('\n💾 Inserting seed data...\n');

    // Split the SQL into individual statements
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
        } else if (trimmed.toLowerCase().includes('setval')) {
          sequenceCount++;
        }
      } catch (error) {
        console.error('❌ Error executing statement:', trimmed.substring(0, 100) + '...');
        console.error('   Error:', error.message);
      }
    }

    console.log(`✅ Database seeded successfully!`);
    console.log(`📊 Inserted ${insertCount} rows`);
    console.log(`🔢 Updated ${sequenceCount} sequences\n`);

    await pool.end();
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
