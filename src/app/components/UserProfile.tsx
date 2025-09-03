"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from '../../lib/supabaseClient';
import AuthForm from "./AuthForm";
import { useUserTier } from '@/hooks/useUserTier';
import dayjs from 'dayjs';

export default function UserProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [billingMetadata, setBillingMetadata] = useState<any>(null);
  const { tier } = useUserTier(user?.id);

  useEffect(() => {
    const getUser = async () => {
      if (!supabase) return;
      
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      // Fetch billing_metadata from profiles (only if Supabase is properly configured)
      if (data.user?.id && supabase && !supabase.supabaseUrl.includes('placeholder')) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('billing_metadata')
            .eq('id', data.user.id)
            .single();
          
          if (profile?.billing_metadata) {
            setBillingMetadata(profile.billing_metadata);
          }
        } catch (error) {
          // Silently handle profile fetch errors for development
          console.debug('Profile fetch skipped (development mode)');
        }
      }
      setLoading(false);
    };
    getUser();
    
    if (!supabase) return;
    
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    if (!supabase) return;
    
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) setEmailMsg(error.message);
    else setEmailMsg("Check your email for the confirmation link!");
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (!supabase) return;
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPwMsg(error.message);
    else setPwMsg("Password updated successfully!");
  };

  const handleLogout = async () => {
    if (!supabase) return;
    
    await supabase.auth.signOut();
    window.location.reload();
  };

  // Don't render the component if we're on the server side
  if (!supabase) {
    return null;
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-6">Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Account Information</h3>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Created:</strong> {dayjs(user.created_at).format('MMMM D, YYYY')}</p>
            <p><strong>Last Sign In:</strong> {dayjs(user.last_sign_in_at).format('MMMM D, YYYY HH:mm')}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Subscription</h3>
            <p><strong>Current Tier:</strong> <span className="capitalize">{tier}</span></p>
            {billingMetadata && (
              <div className="mt-2">
                <p><strong>Plan:</strong> {billingMetadata.plan?.id || 'N/A'}</p>
                {billingMetadata.current_period_end && (
                  <p><strong>Next Billing:</strong> {dayjs(billingMetadata.current_period_end * 1000).format('MMMM D, YYYY')}</p>
                )}
                {billingMetadata.cancel_at_period_end && (
                  <p className="text-orange-600"><strong>⚠️ Subscription will cancel at period end</strong></p>
                )}
              </div>
            )}
      </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Update Email</h3>
        <form onSubmit={handleEmailUpdate} className="space-y-4">
          <div>
            <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">
              New Email
            </label>
        <input
          type="email"
              id="newEmail"
          value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
          required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Update Email
          </button>
          {emailMsg && (
            <div className={`p-3 rounded ${emailMsg.includes('error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {emailMsg}
            </div>
          )}
      </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Update Password</h3>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
        <input
          type="password"
              id="newPassword"
          value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
          required
              minLength={6}
              autoComplete="new-password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Update Password
          </button>
          {pwMsg && (
            <div className={`p-3 rounded ${pwMsg.includes('error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {pwMsg}
            </div>
          )}
      </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
} 