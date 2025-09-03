import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { token, email, name, picture } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { success: false, error: 'Google token and email are required' },
        { status: 400 }
      );
    }

    // Verify the Google token by getting user info
    const googleResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`);
    
    if (!googleResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Invalid Google token' },
        { status: 401 }
      );
    }

    const googleUser = await googleResponse.json();

    if (googleUser.email !== email) {
      return NextResponse.json(
        { success: false, error: 'Email mismatch' },
        { status: 401 }
      );
    }

    // Check if user exists in Supabase
    const { data: existingUser, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    let userId: string;
    let userProfile: any;

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create new user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          name: name || googleUser.name,
          picture: picture || googleUser.picture,
          provider: 'google'
        }
      });

      if (authError) {
        console.error('Error creating user:', authError);
        return NextResponse.json(
          { success: false, error: 'Failed to create user account' },
          { status: 500 }
        );
      }

      userId = authUser.user.id;

      // Create profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          name: name || googleUser.name,
          avatar_url: picture || googleUser.picture,
          subscription: 'free',
          capture_limit: 5,
          captured_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return NextResponse.json(
          { success: false, error: 'Failed to create user profile' },
          { status: 500 }
        );
      }

      userProfile = newProfile;
    } else if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    } else {
      // User exists, update last sign in
      userId = existingUser.id;
      userProfile = existingUser;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          last_sign_in: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user:', updateError);
      }
    }

    // Create a session token for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (sessionError) {
      console.error('Error generating session:', sessionError);
      return NextResponse.json(
        { success: false, error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Return user data and session token
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: userProfile.email,
        name: userProfile.name || name || googleUser.name,
        subscription: userProfile.subscription || 'free',
        captureLimit: userProfile.capture_limit || 5,
        capturedCount: userProfile.captured_count || 0,
      },
      token: sessionData.properties?.access_token || 'temp-token',
    });

  } catch (error) {
    console.error('Google auth API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
