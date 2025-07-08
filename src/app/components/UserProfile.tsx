"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AuthForm from "./AuthForm";
import { useUserTier } from '@/hooks/useUserTier';

export default function UserProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  // Always call useUserTier, even if user is null
  const { tier, loading: tierLoading } = useUserTier(user?.id);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setEmail(data.user?.email || "");
      setLoading(false);
    };
    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setEmail(session?.user?.email || "");
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <AuthForm />;

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) setEmailMsg(error.message);
    else setEmailMsg("Email update requested. Check your new email to confirm.");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPwMsg(error.message);
    else setPwMsg("Password updated.");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="max-w-sm mx-auto p-4 border rounded-lg bg-white shadow flex flex-col items-center gap-4">
      <div className="text-lg font-semibold">Welcome!</div>
      <div className="text-gray-700">{email}</div>
      {/* Show membership tier */}
      <div className="mt-2 text-base font-bold text-blue-700">
        {tierLoading ? 'Loading membership...' : `Membership: ${tier ? tier.toUpperCase() : 'FREE'}`}
      </div>
      <button
        onClick={handleLogout}
        className="mt-4 bg-red-500 hover:bg-red-600 text-white rounded px-4 py-2 font-semibold"
      >
        Log Out
      </button>
      <form onSubmit={handleEmailChange} className="w-full flex flex-col gap-2 mt-4">
        <label className="font-medium">Change Email</label>
        <input
          type="email"
          placeholder="New email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <button type="submit" className="bg-blue-500 text-white rounded px-4 py-2 font-semibold">Update Email</button>
        {emailMsg && <div className="text-sm mt-1 text-green-700">{emailMsg}</div>}
      </form>
      <form onSubmit={handlePasswordChange} className="w-full flex flex-col gap-2 mt-2">
        <label className="font-medium">Change Password</label>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <button type="submit" className="bg-blue-500 text-white rounded px-4 py-2 font-semibold">Update Password</button>
        {pwMsg && <div className="text-sm mt-1 text-green-700">{pwMsg}</div>}
      </form>
    </div>
  );
} 