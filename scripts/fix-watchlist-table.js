const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function fixWatchlistTable() {
  console.log('Fixing watchlist table...');
  
  try {
    // Disable RLS on the watchlist table
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE watchlist DISABLE ROW LEVEL SECURITY;'
    });

    if (error) {
      console.log('Could not use exec_sql, trying alternative approach...');
      
      // Try to insert a test record to see if RLS is the issue
      const { data, error: insertError } = await supabase
        .from('watchlist')
        .insert({
          title: 'Test Property',
          price: 100000,
          address: 'Test Address',
          description: 'Test Description'
        })
        .select();

      if (insertError) {
        console.log('Insert error:', insertError);
        console.log('❌ The table has RLS enabled and requires user_id.');
        console.log('You need to manually disable RLS in your Supabase dashboard:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to Authentication > Policies');
        console.log('3. Find the watchlist table');
        console.log('4. Click "Disable RLS" or add a policy that allows all operations');
      } else {
        console.log('✅ Test insert successful!');
        console.log('Data:', data);
      }
    } else {
      console.log('✅ RLS disabled successfully!');
    }

  } catch (error) {
    console.error('Fix failed:', error);
  }
}

fixWatchlistTable(); 