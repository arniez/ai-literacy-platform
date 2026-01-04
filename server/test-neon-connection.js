require('dotenv').config({ path: './config/config.env' });
const { Pool } = require('pg');

async function testConnection() {
  console.log('Testing Neon database connection...\n');

  const pool = new Pool({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_NAME,
    port: process.env.PG_PORT || 5432,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    console.log('Attempting to connect to:', process.env.PG_HOST);
    const client = await pool.connect();
    console.log('✅ Successfully connected to Neon database!\n');

    // Test a simple query
    const result = await client.query('SELECT NOW()');
    console.log('✅ Query test successful. Server time:', result.rows[0].now);

    // Check tables
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📋 Existing tables in database:');
    if (tables.rows.length === 0) {
      console.log('   No tables found. Database needs to be initialized.');
    } else {
      tables.rows.forEach(row => console.log('  -', row.table_name));
    }

    client.release();
    await pool.end();

    console.log('\n✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
