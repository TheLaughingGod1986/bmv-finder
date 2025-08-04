'use client';


import { ChartBarIcon } from '@heroicons/react/24/outline';

interface UsageData {
  lookupsUsed: number;
  lookupsLimit: number;
  searchesThisMonth?: number;
  propertiesSaved?: number;
  daysActive?: number;
}

interface UsageProgressCardProps {
  usageData: UsageData;
  showUpgradePrompt?: boolean;
  className?: string;
}

export default function UsageProgressCard({ 
  usageData, 
  showUpgradePrompt = true, 
  className = '' 
}: UsageProgressCardProps) {
  const usagePercentage = Math.round((usageData.lookupsUsed / usageData.lookupsLimit) * 100);
  
  return (
    <section className={`bg-neutral-100 rounded-xl p-6 border border-neutral-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-primary-700 flex items-center gap-2">
          <ChartBarIcon className="w-6 h-6" />
          Your Usage This Month
        </h2>
        <span className="text-sm font-semibold text-primary-600">
          {usageData.lookupsUsed}/{usageData.lookupsLimit} lookups
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-neutral-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              usagePercentage >= 80 ? 'bg-red-500' : 
              usagePercentage >= 60 ? 'bg-yellow-500' : 'bg-secondary-600'
            }`}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-primary-600 mt-2">
          <span>{usagePercentage}% used</span>
          {usagePercentage >= 80 && (
            <span className="text-red-600 font-semibold">Almost at limit!</span>
          )}
        </div>
      </div>
      
      {/* Usage Stats */}
      {(usageData.searchesThisMonth !== undefined || usageData.propertiesSaved !== undefined) && (
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          {usageData.searchesThisMonth !== undefined && (
            <div className="bg-white bg-opacity-50 rounded-lg p-3">
              <div className="font-semibold text-primary-700">{usageData.searchesThisMonth}</div>
              <div className="text-primary-600">Searches this month</div>
            </div>
          )}
          {usageData.propertiesSaved !== undefined && (
            <div className="bg-white bg-opacity-50 rounded-lg p-3">
              <div className="font-semibold text-primary-700">{usageData.propertiesSaved}</div>
              <div className="text-primary-600">Properties saved</div>
            </div>
          )}
        </div>
      )}
      
      {/* Upgrade CTA */}
      {showUpgradePrompt && usagePercentage >= 60 && (
        <div className="p-4 bg-gradient-to-r from-[#3A7CA5] to-[#2C6E91] rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold mb-1">Ready for unlimited access?</h3>
              <p className="text-sm opacity-90">Upgrade to Pro for unlimited lookups and advanced features</p>
            </div>
            <a
              href="/account/upgrade"
              className="px-4 py-2 bg-white text-primary-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Upgrade Now
            </a>
          </div>
        </div>
      )}
    </section>
  );
} 