const mysql = require('mysql2/promise');

async function verifySetup() {
  console.log('\n🔍 Verifying AI Literacy Platform Setup...\n');

  try {
    // Test database connection
    console.log('📊 Testing database connection...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'ai_literacy_db'
    });

    console.log('✅ Database connection successful!\n');

    // Check tables
    console.log('📋 Checking database tables...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✅ Found ${tables.length} tables:\n`);

    const tableNames = tables.map(t => Object.values(t)[0]);
    tableNames.forEach(name => console.log(`   - ${name}`));

    // Check data
    console.log('\n📊 Checking demo data...');

    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Users: ${users[0].count}`);

    const [content] = await connection.query('SELECT COUNT(*) as count FROM content');
    console.log(`✅ Content: ${content[0].count}`);

    const [badges] = await connection.query('SELECT COUNT(*) as count FROM badges');
    console.log(`✅ Badges: ${badges[0].count}`);

    const [challenges] = await connection.query('SELECT COUNT(*) as count FROM challenges');
    console.log(`✅ Challenges: ${challenges[0].count}`);

    // Get demo user info
    console.log('\n👤 Demo Users:');
    const [demoUsers] = await connection.query(
      'SELECT username, email, role, total_points, level FROM users LIMIT 4'
    );

    demoUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - Level ${user.level} - ${user.total_points} points`);
    });

    console.log('\n🎉 Setup verification complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start backend:  cd server && npm run dev');
    console.log('   2. Start frontend: cd client && npm start');
    console.log('   3. Login with: student@student.nl / password123\n');

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Database not found! Please create it first:');
      console.log('   Option 1: mysql -u root -proot < server/config/database.sql');
      console.log('   Option 2: Use MySQL Workbench to run server/config/database.sql\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Access denied! Check your MySQL credentials in server/config/config.env\n');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Cannot connect to MySQL! Is MySQL server running?\n');
    }

    process.exit(1);
  }
}

verifySetup();
