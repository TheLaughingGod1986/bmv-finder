"use client";
import UserProfile from '../components/UserProfile';
import Link from 'next/link';

export default function AccountPage() {
  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Account</h1>
      <UserProfile />
      <div className="mt-8 flex justify-center">
        <Link href="/account/upgrade">
          <span className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors">Upgrade to Pro</span>
        </Link>
      </div>
    </div>
  );
} 