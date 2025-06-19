const { createClient } = require('@libsql/client');

// Use environment variables or prompt for them
const url = process.env.DATABASE_URL || 'libsql://sold-property-prices-thelaughinggod1986.aws-eu-west-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN || 'your-auth-token-here';

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    const db = createClient({
      url,
      authToken
    });

    // Test the connection with a simple query
    const result = await db.execute('SELECT name FROM sqlite_master WHERE type="table"');
    
    console.log('✅ Connection successful!');
    console.log('\n📋 Found tables:');
    console.log(result.rows.map(row => `- ${row.name}`).join('\n') || 'No tables found');
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error.message);
    
    if (error.message.includes('AUTH_REQUIRED')) {
      console.log('\n🔑 Authentication failed. Please check your TURSO_AUTH_TOKEN');
    }
  }
}

testConnection();
