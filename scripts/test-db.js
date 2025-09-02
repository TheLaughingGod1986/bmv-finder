const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bmv_finder',
  user: process.env.DB_USER || 'benjaminoats',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

async function testDatabase() {
  const pool = new Pool(config);
  
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Existing tables:');
    if (result.rows.length === 0) {
      console.log('   No tables found');
    } else {
      result.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    // Check if portfolio tables exist
    const portfolioTables = ['users', 'portfolios', 'properties', 'portfolio_properties', 'portfolio_performance'];
    const missingTables = portfolioTables.filter(table => 
      !result.rows.some(row => row.table_name === table)
    );
    
    if (missingTables.length > 0) {
      console.log('\n❌ Missing portfolio tables:');
      missingTables.forEach(table => console.log(`   - ${table}`));
      
      console.log('\n📝 Creating portfolio tables...');
      const migrationPath = path.join(__dirname, '../src/lib/database/migrations/001_create_portfolio_tables.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      await client.query(migrationSQL);
      console.log('✅ Portfolio tables created successfully');
    } else {
      console.log('\n✅ All portfolio tables exist');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure PostgreSQL is running and accessible');
      console.log('   You can start it with: brew services start postgresql');
    } else if (error.code === '28P01') {
      console.log('\n💡 Check your database credentials in the config');
    } else if (error.code === '3D000') {
      console.log('\n💡 Database does not exist. Create it with:');
      console.log(`   createdb ${config.database}`);
    }
  } finally {
    await pool.end();
  }
}

testDatabase();
