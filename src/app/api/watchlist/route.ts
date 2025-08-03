import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_KEY! // Use service role key to bypass RLS
);

export async function GET(request: NextRequest) {
  try {
    // Get current user from authorization header if available
    const authHeader = request.headers.get('authorization');
    let userId = '00000000-0000-0000-0000-000000000000'; // Default user ID
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (!error && user) {
          userId = user.id;
        }
      } catch (authError) {
        console.log('Auth error, using default user ID:', authError);
      }
    }

    // Fetch properties for the user (or default user if not authenticated)
    const { data: properties, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching watchlist:', error);
      return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: properties?.length || 0,
      properties: properties || []
    });

  } catch (error) {
    console.error('Watchlist API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 