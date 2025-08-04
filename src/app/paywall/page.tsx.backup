"use client";


import Button from '../components/Button';
import { useToast } from '../components/ToastProvider';


export default function PaywallPage() {
  const { showToast } = useToast();
  
  const handleUpgrade = () => {
    // Placeholder for upgrade logic
    showToast({ type: 'info', title: 'Upgrade functionality not yet implemented.' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 px-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-blue-100 max-w-md w-full p-10 flex flex-col items-center">
        <svg className="w-16 h-16 text-blue-500 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11V7a4 4 0 10-8 0v4a4 4 0 008 0zm0 0v2a4 4 0 008 0v-2a4 4 0 00-8 0zm0 0v2a4 4 0 01-8 0v-2a4 4 0 018 0z" />
        </svg>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3 text-center">Unlock Full Access</h1>
        <p className="text-gray-600 text-center mb-8 text-lg">
          This feature is available to subscribers only. Get unlimited access to property data, advanced analytics, and more.
        </p>
        <Button variant="primary" size="lg" className="w-full" onClick={handleUpgrade}>
          Upgrade Now
        </Button>
        <p className="mt-6 text-xs text-gray-400 text-center">
          Already a member? <a href="/login" className="text-blue-600 underline hover:text-blue-800">Log in</a>
        </p>
      </div>
    </div>
  );
} 