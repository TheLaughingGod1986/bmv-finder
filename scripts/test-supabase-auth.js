#!/usr/bin/env node

// Test script to verify Supabase authentication setup
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

console.log('🔐 Testing Supabase Authentication Setup...\n');

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('📋 Environment Variables:');
console.log(`   URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`   Key: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n❌ Missing Supabase environment variables!');
  console.log('   Please update your .env.local file with actual Supabase credentials.');
  console.log('   See SUPABASE_SETUP_GUIDE.md for instructions.');
  process.exit(1);
}

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('\n🔗 Testing Supabase Connection...');
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log(`   Session: ${data.session ? 'Active' : 'None'}`);
    
    // Test database access (if schema is set up)
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (profileError && profileError.code === 'PGRST116') {
        console.log('⚠️  Database schema not set up yet');
        console.log('   Run the SQL from scripts/setup-supabase-schema.sql in your Supabase dashboard');
      } else if (profileError) {
        console.log('⚠️  Database access issue:', profileError.message);
      } else {
        console.log('✅ Database schema is working!');
      }
    } catch (dbError) {
      console.log('⚠️  Database test skipped (schema may not be set up)');
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    return false;
  }
}

// Run the test
testSupabaseConnection().then((success) => {
  if (success) {
    console.log('\n🎉 Supabase authentication is properly configured!');
    console.log('   You can now test user registration and login.');
  } else {
    console.log('\n💡 Next steps:');
    console.log('   1. Create a Supabase project at https://supabase.com');
    console.log('   2. Update .env.local with your project credentials');
    console.log('   3. Run the database schema setup');
    console.log('   4. Test authentication in the browser');
  }
}); 