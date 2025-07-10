// Manual script to update billing_metadata for a user in Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const userId = '15396000-6c27-4253-a402-c92450e13bd9'; // Your test user ID
  
  // Updated billing_metadata structure to match frontend expectations
  const billing_metadata = {
    plan: {
      name: 'Elite',
      interval: 'year'
    },
    price_id: 'price_1Rim4iQul6soqa6l5CaBhkYd',
    subscription_id: 'sub_1RimW7Qul6soqa6lJC5KZs8s',
    current_period_end: 1783526400, // Example timestamp (1 year from now)
    cancel_at_period_end: false,
    canceled_at: null
  };

  console.log('Updating billing_metadata for user:', userId);
  console.log('New billing_metadata:', JSON.stringify(billing_metadata, null, 2));

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ billing_metadata })
    .eq('id', userId)
    .select();

  if (error) {
    console.error('Failed to update billing_metadata:', error);
    process.exit(1);
  } else {
    console.log('Successfully updated billing_metadata for user:', userId);
    console.log('Updated row:', data);
  }
}

main().catch(console.error); 