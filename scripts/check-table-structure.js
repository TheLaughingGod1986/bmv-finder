const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function checkTableStructure() {
  console.log('Checking watchlist table structure...');
  
  try {
    // Try to get table info by attempting to select with limit 0
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .limit(0);

    if (error) {
      console.log('Error checking table:', error);
    } else {
      console.log('✅ Table exists and is accessible');
    }

    // Try to insert with user_id
    const { data: insertData, error: insertError } = await supabase
      .from('watchlist')
      .insert({
        title: 'Test Property',
        price: 100000,
        address: 'Test Address',
        description: 'Test Description',
        user_id: '00000000-0000-0000-0000-000000000000' // Try with a default UUID
      })
      .select();

    if (insertError) {
      console.log('Insert error:', insertError);
    } else {
      console.log('✅ Insert successful with user_id!');
      console.log('Data:', insertData);
    }

  } catch (error) {
    console.error('Check failed:', error);
  }
}

checkTableStructure(); 