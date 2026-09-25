require('./config/env');
const fs = require('fs');
const path = require('path');

function parseSeedArgs(argv, env = process.env) {
  const catalog = argv.includes('--catalog') || argv.includes('--all');
  const demo = argv.includes('--demo') || argv.includes('--all');

  if (!catalog && !demo) {
    throw new Error('Specificeer --catalog, --demo of --all.');
  }
  if (demo && env.NODE_ENV === 'production') {
    throw new Error('Demo-data mag niet naar productie: NODE_ENV=production.');
  }

  return { catalog, demo };
}

async function seedDatabase({ catalog, demo }, { pool }) {
  if (catalog) {
    console.log('📦 Catalogus seeden (modules, content, badges, challenges)...');
    const sql = fs.readFileSync(path.join(__dirname, 'config', 'seed-catalog.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Catalogus klaar.');
  }

  if (demo) {
    console.log('🌱 Demo-data seeden (users, voortgang, badges, comments, ratings, notificaties)...');
    const sql = fs.readFileSync(path.join(__dirname, 'config', 'seed-demo.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Demo-data klaar.');
  }
}

if (require.main === module) {
  let options;
  try {
    options = parseSeedArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`❌ ${error.message}`);
    console.log('💡 Gebruik: node seed-database.js --catalog | --demo | --all');
    console.log('💡 Draai eerst "npm run migrate" als het schema nog niet up-to-date is.');
    process.exit(1);
  }

  const { pool } = require('./config/db-postgres');

  seedDatabase(options, { pool })
    .catch((error) => {
      console.error('❌ Seeding error:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await pool.end();
    });
}

module.exports = { parseSeedArgs, seedDatabase };
