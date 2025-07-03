'use client';

import React from 'react';
import { Home } from 'lucide-react';

export default function MyPropertyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans">
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="bg-white/80 shadow-lg rounded-2xl p-8 md:p-12 text-center border border-slate-200">
          <div className="flex flex-col items-center mb-6">
            <Home className="w-12 h-12 text-blue-500 mb-2" />
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">My Property</h1>
            <p className="text-lg text-gray-600 mb-4">View and manage your saved properties here.</p>
          </div>
          <div className="text-gray-500 text-base">
            <p>This feature is coming soon! You'll be able to save properties, add notes, and track your investments.</p>
          </div>
        </div>
      </main>
    </div>
  );
} 