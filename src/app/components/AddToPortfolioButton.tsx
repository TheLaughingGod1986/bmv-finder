'use client';

import React, { useState } from 'react';
import { Home, Plus, Check, AlertCircle } from 'lucide-react';
import { useToast } from './ToastProvider';
import { useUser } from '@supabase/auth-helpers-react';

interface AddToPortfolioButtonProps {
  propertyData: {
    address: string;
    postcode: string;
    houseNumber: string;
    propertyType: string;
    bedrooms?: number;
    floorArea?: number;
    epcRating?: string;
    constructionYear?: string;
    purchasePrice: number;
    currentValue: number;
    purchaseDate: string;
    dealScore: number;
    dealRating: string;
    bmvScore: number;
    rentalIncome?: number;
    yield?: number;
    mortgageBalance?: number;
    notes?: string;
  };
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  children?: React.ReactNode;
}

export default function AddToPortfolioButton({
  propertyData,
  className = '',
  variant = 'default',
  size = 'md',
  showIcon = true,
  children
}: AddToPortfolioButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const { showToast } = useToast();
  const user = useUser();

  const handleAddToPortfolio = async () => {
    if (!user) {
      showToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to add properties to your portfolio.'
      });
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/portfolio/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...propertyData,
          userId: user.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAdded(true);
        showToast({
          type: 'success',
          title: 'Property Added',
          message: `${propertyData.address} has been added to your portfolio successfully!`
        });

        // Reset added state after 3 seconds
        setTimeout(() => setAdded(false), 3000);
      } else {
        if (response.status === 409) {
          showToast({
            type: 'warning',
            title: 'Already in Portfolio',
            message: 'This property is already in your portfolio.'
          });
        } else {
          throw new Error(data.error || 'Failed to add to portfolio');
        }
      }
    } catch (err) {
      console.error('Error adding to portfolio:', err);
      showToast({
        type: 'error',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to add property to portfolio'
      });
    } finally {
      setLoading(false);
    }
  };

  const getButtonContent = () => {
    if (added) {
      return (
        <>
          <Check className="h-4 w-4" />
          Added to Portfolio
        </>
      );
    }

    if (loading) {
      return (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
          Adding...
        </>
      );
    }

    return (
      <>
        {showIcon && <Plus className="h-4 w-4" />}
        {children || 'Add to Portfolio'}
      </>
    );
  };

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
      default: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
      outline: 'border-2 border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500',
      ghost: 'text-green-600 hover:bg-green-50 focus:ring-green-500'
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    // Override styling based on state
    let stateClasses = '';
    if (added) {
      stateClasses = 'bg-green-600 text-white border-green-600 cursor-default hover:bg-green-600';
    } else if (loading) {
      stateClasses = 'opacity-75 cursor-not-allowed';
    } else {
      stateClasses = variantClasses[variant];
    }

    return `${baseClasses} ${stateClasses} ${sizeClasses[size]} ${className}`;
  };

  return (
    <button
      onClick={handleAddToPortfolio}
      disabled={loading || added}
      className={getButtonClasses()}
      type="button"
    >
      {getButtonContent()}
    </button>
  );
}

// Helper function to extract property data from comprehensive valuation
export function extractPropertyDataFromValuation(valuationData: any) {
  if (!valuationData || !valuationData.property) {
    return null;
  }

  const { property, methods, summary } = valuationData;

  // Calculate rental income from income approach
  const rentalIncome = methods?.incomeApproach?.breakdown?.annualRentalIncome || 0;
  const rentalYield = methods?.incomeApproach?.breakdown?.yield || 0;

  // Calculate deal score from summary confidence
  const dealScore = summary?.confidence || 0;
  const dealRating = getDealRating(dealScore);

  // Calculate BMV score (simplified - in real app, you'd have a more sophisticated calculation)
  const bmvScore = Math.min(100, Math.max(0, 
    (dealScore * 0.4) + 
    (rentalYield * 5) + 
    ((summary?.finalValue / property?.lastSoldPrice || 1) * 20)
  ));

  return {
    address: property.address || `${property.houseNumber} ${property.street}`,
    postcode: property.postcode,
    houseNumber: property.houseNumber || property.address?.split(' ')[0] || '',
    propertyType: property.propertyType,
    bedrooms: property.bedrooms,
    floorArea: property.floorArea,
    epcRating: property.epcRating,
    constructionYear: property.constructionYear,
    purchasePrice: property.lastSoldPrice || summary?.finalValue * 0.85,
    currentValue: summary?.finalValue,
    purchaseDate: property.lastSoldDate || new Date().toISOString().split('T')[0],
    dealScore: Math.round(dealScore),
    dealRating,
    bmvScore: Math.round(bmvScore),
    rentalIncome: Math.round(rentalIncome),
    yield: Math.round(rentalYield * 100) / 100,
    mortgageBalance: 0, // User can edit this later
    notes: `Added from valuation analysis. Deal Score: ${dealScore}, BMV Score: ${Math.round(bmvScore)}`
  };
}

function getDealRating(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Poor';
  return 'Very Poor';
} 