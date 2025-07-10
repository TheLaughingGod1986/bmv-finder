import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Profile not found' }, { status: 404 });
    }

    // For extensibility: support different usage types
    if (type === 'pay') {
      return NextResponse.json({ pay_count: data.pay_count ?? 0 });
    }
    if (type === 'lookup') {
      return NextResponse.json({ lookup_count: data.lookup_count ?? 0 });
    }

    // Default: return the full profile object
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in profile-usage:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
} 