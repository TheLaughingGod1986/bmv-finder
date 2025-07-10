"use client";
import React, { useState } from "react";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are not set');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    if (mode === "sign-in") {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else setSuccess("Signed in!");
    } else {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setSuccess("Check your email to confirm your account.");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin + window.location.pathname : undefined
      }
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto p-4 border rounded-lg bg-white shadow">
      <h2 className="text-lg font-semibold mb-2">{mode === "sign-in" ? "Sign In" : "Sign Up"}</h2>
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full bg-red-500 text-white rounded px-4 py-2 font-semibold mb-3 flex items-center justify-center gap-2 disabled:opacity-50"
        disabled={loading}
      >
        <svg width="20" height="20" viewBox="0 0 48 48" className="inline-block mr-2"><g><path fill="#4285F4" d="M43.6 20.5H42V20H24v8h11.3C34.7 32.1 29.8 35 24 35c-6.1 0-11.3-4.1-13.1-9.6-1.8-5.5.2-11.6 5.1-15.1C20.2 6.1 27.8 7.1 32.2 12.1l6.1-6.1C34.1 1.7 29.2 0 24 0 14.6 0 6.4 6.7 3.1 16.1c-3.3 9.4.2 19.9 8.2 25.2 8 5.3 18.7 3.7 25.1-3.7 5.1-5.1 7.1-12.7 5.2-19.1z"/><path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.2 16.1 18.7 13 24 13c3.1 0 6 .9 8.3 2.5l6.2-6.2C34.1 1.7 29.2 0 24 0 14.6 0 6.4 6.7 3.1 16.1c-.5 1.3-.8 2.7-.8 4.1z"/><path fill="#FBBC05" d="M24 48c5.8 0 11.1-2.1 15.2-5.7l-7.1-5.8c-2.1 1.4-4.7 2.2-7.6 2.2-5.8 0-10.7-3.9-12.5-9.1l-7.1 5.5C6.4 41.3 14.6 48 24 48z"/><path fill="#EA4335" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.7 5.6-7.3 6.7l7.1 5.8c4.2-3.8 6.9-9.4 6.9-15.5 0-1.3-.1-2.6-.4-3.8z"/></g></svg>
        Continue with Google
      </button>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 font-semibold disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Loading..." : mode === "sign-in" ? "Sign In" : "Sign Up"}
        </button>
      </form>
      <div className="flex justify-between mt-2 text-sm">
        <button
          className="underline text-blue-700"
          onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
        >
          {mode === "sign-in" ? "Need an account? Sign Up" : "Already have an account? Sign In"}
        </button>
      </div>
      {error && <div className="mt-2 text-red-600">{error}</div>}
      {success && <div className="mt-2 text-green-700">{success}</div>}
    </div>
  );
} 