import { NextRequest } from 'next/server';
import { supabase } from '../supabaseClient';
import { userManager, UserProfile } from './userManager';

export async function getCurrentUser(request: NextRequest): Promise<UserProfile | null> {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    if (!supabase || supabase.supabaseUrl.includes('placeholder')) {
      // Fallback for development/mock mode
      return null;
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Get user profile
    const profile = await userManager.getUserProfile(user.id);
    return profile;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getCurrentUserFromSession(): Promise<UserProfile | null> {
  try {
    if (!supabase || supabase.supabaseUrl.includes('placeholder')) {
      return null;
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    const profile = await userManager.getUserProfile(user.id);
    return profile;
  } catch (error) {
    console.error('Error getting current user from session:', error);
    return null;
  }
}
