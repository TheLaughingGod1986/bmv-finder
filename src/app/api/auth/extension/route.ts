import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user || !data.session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const userData = {
      id: data.user.id,
      email: data.user.email,
      name: profile?.name || data.user.user_metadata?.name || data.user.email,
      membership: profile?.subscription || 'Free Plan',
      captureLimit: profile?.capture_limit || 5,
      capturedCount: profile?.captured_count || 0,
      avatar: profile?.avatar_url || data.user.user_metadata?.avatar_url
    };

    return NextResponse.json({
      success: true,
      user: userData,
      token: data.session.access_token
    });

  } catch (error) {
    console.error('Extension auth error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
}
