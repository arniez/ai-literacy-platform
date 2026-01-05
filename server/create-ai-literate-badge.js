require('dotenv').config({ path: './config/config.env' });
const { pool } = require('./config/db-postgres');

async function createBadge() {
  console.log('🏆 Creating AI-literate Badge...\n');

  try {
    // Check if badge already exists
    const existing = await pool.query(`
      SELECT * FROM badges WHERE name = 'AI-literate'
    `);

    if (existing.rows.length > 0) {
      console.log('ℹ️  AI-literate badge already exists\n');
      console.log(existing.rows[0]);
      await pool.end();
      return;
    }

    // Create the badge
    const result = await pool.query(`
      INSERT INTO badges (name, description, icon, badge_type, requirement_type, requirement_value, points_reward, rarity)
      VALUES (
        'AI-literate',
        'Voltooid alle basis AI lessen en quizzes met succes. Je beheerst nu de fundamenten van kunstmatige intelligentie!',
        '🎓',
        'completion',
        'quiz_completion',
        8,
        100,
        'epic'
      )
      RETURNING *
    `);

    console.log('✅ AI-literate badge created successfully!\n');
    console.log('📊 Badge Details:');
    console.log(`   - ID: ${result.rows[0].id}`);
    console.log(`   - Name: ${result.rows[0].name}`);
    console.log(`   - Icon: ${result.rows[0].icon}`);
    console.log(`   - Points: ${result.rows[0].points_reward}`);
    console.log(`   - Description: ${result.rows[0].description}\n`);

    await pool.end();
  } catch (error) {
    console.error('❌ Error creating badge:', error);
    process.exit(1);
  }
}

createBadge();
