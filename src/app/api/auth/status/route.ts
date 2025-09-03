import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        isAuthenticated: false,
        user: null 
      });
    }

    const token = authHeader.substring(7);
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json({ 
        isAuthenticated: false,
        user: null 
      });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const userData = {
      id: user.id,
      email: user.email,
      name: profile?.name || user.user_metadata?.name || user.email,
      membership: profile?.subscription || 'Free Plan',
      captureLimit: profile?.capture_limit || 5,
      capturedCount: profile?.captured_count || 0,
      avatar: profile?.avatar_url || user.user_metadata?.avatar_url
    };

    return NextResponse.json({
      isAuthenticated: true,
      user: userData
    });

  } catch (error) {
    console.error('Auth status error:', error);
    return NextResponse.json({ 
      isAuthenticated: false,
      user: null 
    });
  }
}
