'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserTier {
  id: string;
  name: string;
  maxWatchlistItems: number;
  canRunFullAnalysis: boolean;
  canExportData: boolean;
  canCompareProperties: boolean;
  price: number;
  features: string[];
}

export const USER_TIERS: UserTier[] = [
  {
    id: 'free',
    name: 'Free',
    maxWatchlistItems: 5,
    canRunFullAnalysis: false,
    canExportData: false,
    canCompareProperties: false,
    price: 0,
    features: [
      'Basic property capture',
      'Simple watchlist (5 properties)',
      'Basic property details'
    ]
  },
  {
    id: 'mid',
    name: 'Mid-Tier',
    maxWatchlistItems: 25,
    canRunFullAnalysis: false,
    canExportData: true,
    canCompareProperties: true,
    price: 9.99,
    features: [
      'Enhanced property capture',
      'Extended watchlist (25 properties)',
      'Property comparison',
      'Basic investment analysis',
      'Data export'
    ]
  },
  {
    id: 'elite',
    name: 'Elite',
    maxWatchlistItems: -1, // Unlimited
    canRunFullAnalysis: true,
    canExportData: true,
    canCompareProperties: true,
    price: 19.99,
    features: [
      'Unlimited property capture',
      'Unlimited watchlist',
      'Advanced property comparison',
      'Full investment analysis',
      'Value growth forecasting',
      'BMV scoring',
      'ROI calculations',
      'Data export & integration'
    ]
  }
];

interface UserTierContextType {
  currentTier: UserTier;
  watchlistCount: number;
  setWatchlistCount: (count: number) => void;
  canAddToWatchlist: boolean;
  canRunAnalysis: boolean;
  canExport: boolean;
  canCompare: boolean;
  showUpgradePrompt: boolean;
  setShowUpgradePrompt: (show: boolean) => void;
  upgradeTier: (tierId: string) => void;
}

const UserTierContext = createContext<UserTierContextType | undefined>(undefined);

export function UserTierProvider({ children }: { children: React.ReactNode }) {
  const [currentTier, setCurrentTier] = useState<UserTier>(USER_TIERS[0]); // Default to free
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Check if user can add to watchlist
  const canAddToWatchlist = currentTier.maxWatchlistItems === -1 || watchlistCount < currentTier.maxWatchlistItems;
  
  // Check if user can run full analysis
  const canRunAnalysis = currentTier.canRunFullAnalysis;
  
  // Check if user can export data
  const canExport = currentTier.canExportData;
  
  // Check if user can compare properties
  const canCompare = currentTier.canCompareProperties;

  const upgradeTier = (tierId: string) => {
    const newTier = USER_TIERS.find(tier => tier.id === tierId);
    if (newTier) {
      setCurrentTier(newTier);
      setShowUpgradePrompt(false);
      // In a real app, this would integrate with payment processing
    }
  };

  const value = {
    currentTier,
    watchlistCount,
    setWatchlistCount,
    canAddToWatchlist,
    canRunAnalysis,
    canExport,
    canCompare,
    showUpgradePrompt,
    setShowUpgradePrompt,
    upgradeTier
  };

  return (
    <UserTierContext.Provider value={value}>
      {children}
    </UserTierContext.Provider>
  );
}

export function useUserTier() {
  const context = useContext(UserTierContext);
  if (context === undefined) {
    throw new Error('useUserTier must be used within a UserTierProvider');
  }
  return context;
} 