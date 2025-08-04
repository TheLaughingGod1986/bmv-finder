import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

// Only create admin client if we have valid credentials
export const supabaseAdmin = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseServiceKey !== 'placeholder-service-key'
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null; 