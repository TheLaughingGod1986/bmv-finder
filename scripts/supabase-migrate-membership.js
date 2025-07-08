// This script uses the Supabase admin API to run SQL for membership migration
// Usage: node scripts/supabase-migrate-membership.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Needs service role key for admin

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrationSQL = `
  alter table auth.users
    add column if not exists tier text default 'free' check (tier in ('free', 'pro', 'elite'));
  alter table auth.users
    add column if not exists billing_metadata jsonb;
  alter table auth.users
    add column if not exists lookup_count integer default 0;
  alter table auth.users
    add column if not exists last_lookup_reset timestamptz;
`;

async function runMigration() {
  try {
    const { error } = await supabase.rpc('execute_sql', { sql: migrationSQL });
    if (error) {
      throw error;
    }
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
  }
}

runMigration(); 