'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Check, Loader2 } from 'lucide-react';
import { useToast } from './ToastProvider';
import { supabase } from '@/lib/supabaseClient';

interface AddToPortfolioButtonProps {
  propertyData: {
    address: string;
    postcode: string;
    houseNumber: string;
    propertyType: string;
    bedrooms?: number;
    estimatedValue: number;
    dealScore?: number;
    dealRating?: string;
    bmvScore?: number;
    lastSale?: {
      price: number;
      date: string;
      propertyType: string;
    };
  };
  className?: string;
}

export default function AddToPortfolioButton({ propertyData, className = '' }: AddToPortfolioButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInPortfolio, setIsInPortfolio] = useState(false);
  const [checkingPortfolio, setCheckingPortfolio] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      
      if (session) {
        await checkIfInPortfolio(session.access_token);
      } else {
        setCheckingPortfolio(false);
      }
    };
    
    checkAuth();
  }, [propertyData.address, propertyData.postcode, propertyData.houseNumber]);

  const checkIfInPortfolio = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/portfolio', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const portfolio = await response.json();
        const isAlreadyTracked = portfolio.some((property: any) => 
          property.address === propertyData.address &&
          property.postcode === propertyData.postcode &&
          property.house_number === propertyData.houseNumber
        );
        setIsInPortfolio(isAlreadyTracked);
      }
    } catch (err) {
      console.error('Error checking portfolio:', err);
    } finally {
      setCheckingPortfolio(false);
    }
  }, [propertyData.address, propertyData.postcode, propertyData.houseNumber]);

  const handleAddToPortfolio = async () => {
    setLoading(true);
    try {
      // Property data received

      // Calculate rent start date (1 month after purchase date)
      const purchaseDate = new Date();
      const rentStartDate = new Date(purchaseDate);
      rentStartDate.setMonth(rentStartDate.getMonth() + 1);

      // Use actual last sale price if available, otherwise use estimated value
      const actualPurchasePrice = propertyData.lastSale?.price || propertyData.estimatedValue;
      const actualPurchaseDate = propertyData.lastSale?.date || purchaseDate.toISOString().split('T')[0];
      
      const portfolioData = {
        address: propertyData.address || '',
        postcode: propertyData.postcode || '',
        house_number: propertyData.houseNumber || '',
        property_type: propertyData.propertyType || '',
        bedrooms: propertyData.bedrooms ? Math.round(propertyData.bedrooms) : undefined,
        purchase_price: actualPurchasePrice,
        current_value: propertyData.estimatedValue,
        purchase_date: actualPurchaseDate,
        rent_start_date: rentStartDate.toISOString().split('T')[0], // 1 month after purchase
        deal_score: propertyData.dealScore !== undefined ? propertyData.dealScore : 0,
        deal_rating: propertyData.dealRating || 'Good',
        bmv_score: propertyData.bmvScore !== undefined ? propertyData.bmvScore : 0,
        equity: propertyData.estimatedValue - actualPurchasePrice, // Calculate actual equity
        notes: propertyData.lastSale ? 'Added from property analysis with actual sale data' : 'Added from property analysis'
      };

      // Portfolio data being sent

      // Get the current session token
      if (!supabase) {
        showToast({ type: 'error', title: 'Supabase client not available' });
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast({ type: 'error', title: 'Please log in to add properties to your portfolio' });
        return;
      }

      const response = await fetch('/api/portfolio/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(portfolioData),
      });

      if (response.ok) {
        showToast({ type: 'success', title: 'Property added to your portfolio!' });
        setIsInPortfolio(true);
      } else {
        const data = await response.json();
        // API Error Response logged
        showToast({ type: 'error', title: data.error || data.details || 'Failed to add property to portfolio' });
      }
          } catch (err) {
        console.error('Error adding to portfolio:', err);
        showToast({ type: 'error', title: 'Failed to add property to portfolio' });
      } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <button
        onClick={() => showToast({ type: 'error', title: 'Please log in to add properties to your portfolio' })}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed ${className}`}
      >
        <Plus className="w-4 h-4" />
        Log in to Track
      </button>
    );
  }

  if (checkingPortfolio) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg font-semibold cursor-not-allowed ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking...
      </button>
    );
  }

  if (isInPortfolio) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 border border-green-300 rounded-lg font-semibold cursor-not-allowed ${className}`}
      >
        <Check className="w-4 h-4" />
        In Portfolio
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToPortfolio}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 focus:ring-2 focus:ring-blue-600 transition-all duration-200 shadow-soft disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Plus className="w-4 h-4" />
      )}
      {loading ? 'Adding...' : 'Track This Property'}
    </button>
  );
} 