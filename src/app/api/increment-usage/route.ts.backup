import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

// Force dynamic rendering to prevent build-time issues
export const dynamic = 'force-dynamic';

// Remove getSupabase and use supabase directly

export async function POST(req: NextRequest) {
  try {
    const { userId, type } = await req.json();
    if (!userId || !type) {
      return NextResponse.json({ error: 'Missing userId or type' }, { status: 400 });
    }

    let column = '';
    if (type === 'lookup') column = 'lookup_count';
    else if (type === 'pay') column = 'pay_count';
    else return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    // Increment the count atomically
    const { data, error } = await supabase.rpc('increment_profile_count', {
      user_id: userId,
      column_name: column
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ new_count: data });
  } catch (error: any) {
    console.error('Error in increment-usage:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
} 