"use client";
import React, { useState, useMemo } from "react";
import { createClient } from '@supabase/supabase-js';

export default function AuthForm() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = useMemo(() => {
    // Only create client on the client side
    if (typeof window === 'undefined') {
      return null;
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase environment variables are not set');
    }
    
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!supabase) return;

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else setSuccess("Signed in!");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setSuccess("Check your email for the confirmation link!");
    }
    setLoading(false);
  };

  const handleOAuthSignIn = async () => {
    setLoading(true);
    setError(null);
    if (!supabase) return;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/auth/callback`
      }
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  // Don't render the form if we're on the server side
  if (!supabase) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {mode === "sign-in" ? "Sign In" : "Sign Up"}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
        <input
          type="email"
            id="email"
          value={email}
            onChange={(e) => setEmail(e.target.value)}
          required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
        <input
          type="password"
            id="password"
          value={password}
            onChange={(e) => setPassword(e.target.value)}
          required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? "Loading..." : mode === "sign-in" ? "Sign In" : "Sign Up"}
        </button>
      </form>

      <div className="mt-4">
        <button
          onClick={handleOAuthSignIn}
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Sign in with Google"}
        </button>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
} 