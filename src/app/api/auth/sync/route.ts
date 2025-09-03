import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false,
        error: 'No authorization token provided' 
      });
    }

    const token = authHeader.substring(7);
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid token' 
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
      success: true,
      user: userData,
      token: token
    });

  } catch (error) {
    console.error('Auth sync error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Sync failed' 
    });
  }
}
