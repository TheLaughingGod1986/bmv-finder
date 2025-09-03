import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

// Force dynamic rendering to prevent build-time issues
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Check if Supabase is properly configured
    if (!supabase || supabase.supabaseUrl.includes('placeholder')) {
      return NextResponse.json({ 
        error: 'Database not configured',
        pay_count: 0,
        lookup_count: 0
      }, { status: 503 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Return default values instead of error for development
      return NextResponse.json({ 
        pay_count: 0,
        lookup_count: 0,
        tier: 'free'
      });
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