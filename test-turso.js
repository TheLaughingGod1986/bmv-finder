const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

async function testConnection() {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.error('Error: DATABASE_URL is not set in .env file');
      return;
    }

    console.log('Attempting to connect to database...');
    console.log('URL:', url);

    const db = createClient({
      url: url,
      // authToken is required for remote connections
      authToken: process.env.TURSO_AUTH_TOKEN
    });

    // Test the connection
    const result = await db.execute('SELECT 1 as test');
    console.log('✅ Connection successful!');
    console.log('Test query result:', result);
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error.message);
    
    if (error.message.includes('AUTH_REQUIRED')) {
      console.log('\nNote: Authentication token is required. Please set TURSO_AUTH_TOKEN in your .env file.');
      console.log('You can find your auth token in the Turso dashboard under Database > Access > Auth Tokens');
    }
  }
}

testConnection();
