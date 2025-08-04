'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Home, TrendingUp, PoundSterling, Calendar, Plus, Filter, BarChart3, Target, MapPin, Trash2, CheckCircle, Edit, DollarSign, Percent, Clock, RefreshCw, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import PropertyEditModal from '../components/PropertyEditModal';
import SimplePropertyCard from '../components/SimplePropertyCard';

interface PortfolioProperty {
  id: string;
  address: string;
  postcode: string;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: string;
  propertyType: string;
  bmvScore: number | null;
  notes?: string;
  status: 'active' | 'sold' | 'watching' | 'watchlist';
  
  // Financial details
  monthlyRent?: number;
  rentStartDate?: string;
  mortgageBalance?: number;
  mortgageType?: 'repayment' | 'interest_only';
  mortgageRate?: number;
  monthlyMortgagePayment?: number;
  depositAmount?: number;
  agentFees?: number;
  otherFees?: number;
  monthlyExpenses?: number;
  
  // Enhanced fee management
  monthlyAgentFee?: number;
  monthlyInsurance?: number;
  annualInsurance?: number;
  oneOffFees?: any[];
  scheduledFees?: any[];
  
  // Calculated fields
  yield?: number;
  equity?: number;
  equityPercentage?: number;
  monthlyProfit?: number;
  totalProfit?: number;
  images?: string[]; // Added for demo images
}

export default function PortfolioTrackerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [portfolioProperties, setPortfolioProperties] = useState<PortfolioProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'sold' | 'watching' | 'watchlist'>('all');
  const [dataError, setDataError] = useState<string | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isPopulatingData, setIsPopulatingData] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PortfolioProperty | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const hasInitialized = useRef(false);

  // Demo portfolio data for unauthenticated users
  const demoPortfolioData: PortfolioProperty[] = [
    {
      id: 'demo-1',
      address: '16 Lowbiggin, Leeds',
      postcode: 'LS6 4PR',
      purchasePrice: 185000,
      currentValue: 210000,
      purchaseDate: '2024-06-28',
      propertyType: 'Semi-Detached House',
      bmvScore: 85,
      status: 'active',
      notes: 'Excellent rental yield, great location near transport links',
      monthlyRent: 1200,
      rentStartDate: '2024-07-01',
      mortgageBalance: 138750,
      mortgageType: 'repayment',
      mortgageRate: 4.5,
      monthlyMortgagePayment: 780,
      depositAmount: 46250,
      monthlyExpenses: 120,
      yield: 6.86,
      equity: 71250,
      equityPercentage: 33.93,
      monthlyProfit: 300,
      totalProfit: 25000,
      images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop&crop=center'] // UK semi-detached
    },
    {
      id: 'demo-2',
      address: '21 Fourstone, Liverpool',
      postcode: 'L18 2PR',
      purchasePrice: 220000,
      currentValue: 245000,
      purchaseDate: '2024-02-28',
      propertyType: 'Detached House',
      bmvScore: 92,
      status: 'active',
      notes: 'Family home with great potential for capital growth',
      monthlyRent: 1400,
      rentStartDate: '2024-03-01',
      mortgageBalance: 165000,
      mortgageType: 'repayment',
      mortgageRate: 4.2,
      monthlyMortgagePayment: 890,
      depositAmount: 55000,
      monthlyExpenses: 140,
      yield: 6.86,
      equity: 80000,
      equityPercentage: 32.65,
      monthlyProfit: 370,
      totalProfit: 25000,
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&crop=center'] // UK detached house
    },
    {
      id: 'demo-3',
      address: '3 William Street, Cardiff',
      postcode: 'CF10 7JH',
      purchasePrice: 165000,
      currentValue: 180000,
      purchaseDate: '2024-01-15',
      propertyType: 'Apartment',
      bmvScore: 78,
      status: 'sold',
      notes: 'Sold for profit after 18 months',
      monthlyRent: 950,
      rentStartDate: '2024-02-15',
      mortgageBalance: 123750,
      mortgageType: 'repayment',
      mortgageRate: 4.8,
      monthlyMortgagePayment: 720,
      depositAmount: 41250,
      monthlyExpenses: 95,
      yield: 6.33,
      equity: 56250,
      equityPercentage: 31.25,
      monthlyProfit: 135,
      totalProfit: 15000,
      images: ['https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400&h=300&fit=crop&crop=center'] // UK apartment interior
    }
  ];

  useEffect(() => {
    if (typeof window === 'undefined' || !supabase) {
      setIsLoading(false);
      return;
    }
    
    hasInitialized.current = false;
    
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setUser(data.session.user);
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 10000);

    initializeAuth();

    return () => clearTimeout(timeoutId);
  }, [supabase]);

  const loadPortfolioData = useCallback(async () => {
    if (!user || !supabase) {
      // Use demo data for unauthenticated users
      console.log('Using demo portfolio data for unauthenticated user');
      setPortfolioProperties(demoPortfolioData);
      setDataError(null);
      setIsLoading(false);
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);
    setDataError(null);

    try {
      const { data: properties, error } = await supabase
        .from('portfolio_properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading portfolio data:', error);
        setDataError('Failed to load portfolio data. Please try again.');
        setPortfolioProperties([]);
      } else {
        // Map database snake_case fields to interface camelCase fields
        console.log('Raw properties from database:', properties);
        
        const mappedProperties = (properties || []).map(property => {
          console.log('Property monthly_rent from DB:', property.monthly_rent);
          return {
            id: property.id,
            address: property.address,
            postcode: property.postcode,
            purchasePrice: property.purchase_price,
            currentValue: property.current_value,
            purchaseDate: property.purchase_date,
            propertyType: property.property_type,
            bmvScore: property.bmv_score,
            notes: property.notes,
            status: property.status,
            
            // Financial details
            monthlyRent: property.monthly_rent,
            rentStartDate: property.rent_start_date,
            mortgageBalance: property.mortgage_balance,
            mortgageType: property.mortgage_type,
            mortgageRate: property.mortgage_rate,
            monthlyMortgagePayment: property.monthly_mortgage_payment,
            depositAmount: property.deposit_amount,
            monthlyAgentFee: property.monthly_agent_fee,
            monthlyInsurance: property.monthly_insurance,
            annualInsurance: property.annual_insurance,
            oneOffFees: property.one_off_fees || [],
            scheduledFees: property.scheduled_fees || [],
            monthlyExpenses: property.monthly_expenses,
            
            // Calculated fields
            yield: property.yield,
            equity: property.equity,
            equityPercentage: property.equity_percentage,
            monthlyProfit: property.monthly_profit,
            totalProfit: property.total_profit,
            images: property.images || [], // Assuming 'images' is a comma-separated string in DB
          };
        });
        
        console.log('Mapped properties:', mappedProperties);
        
        setPortfolioProperties(mappedProperties);
        setDataError(null);
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      setDataError('Failed to load portfolio data. Please try again.');
      setPortfolioProperties([]);
    } finally {
      setIsDataLoading(false);
      setIsLoading(false);
    }
  }, [user, supabase, demoPortfolioData]);

  useEffect(() => {
    if (user) {
      loadPortfolioData();
    }
  }, [user, loadPortfolioData]);

  const filteredProperties = useMemo(() => {
    if (filterStatus === 'all') return portfolioProperties;
    return portfolioProperties.filter(property => property.status === filterStatus);
  }, [portfolioProperties, filterStatus]);

  const handleAddProperty = useCallback(() => {
    router.push('/advanced-deal-analysis');
  }, [router]);

  const handleRefreshData = useCallback(async () => {
    if (!user || !supabase) return;
    
    setIsDataLoading(true);
    try {
      await loadPortfolioData();
      alert('Portfolio data refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('Failed to refresh data. Please try again.');
    } finally {
      setIsDataLoading(false);
    }
  }, [user, supabase, loadPortfolioData]);

  const handleStatusChange = useCallback(async (id: string, newStatus: 'active' | 'sold' | 'watching' | 'watchlist') => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('portfolio_properties')
        .update({ status: newStatus })
        .eq('id', id);

      if (!error) {
        setPortfolioProperties(prev => 
          prev.map(property => 
            property.id === id ? { ...property, status: newStatus } : property
          )
        );
      }
    } catch (error) {
      console.error('Error updating property status:', error);
    }
  }, [supabase]);

  const handleRemoveProperty = useCallback(async (id: string, address: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('portfolio_properties')
        .delete()
        .eq('id', id);

      if (!error) {
        setPortfolioProperties(prev => prev.filter(property => property.id !== id));
      }
    } catch (error) {
      console.error('Error removing property:', error);
    }
  }, [supabase]);

  const handlePropertySave = useCallback(async (updatedProperty: PortfolioProperty) => {
    setPortfolioProperties(prev => prev.map(property => 
      property.id === updatedProperty.id ? updatedProperty : property
    ));
    
    await loadPortfolioData();
  }, [loadPortfolioData]);

  const calculateMissingData = (property: PortfolioProperty): PortfolioProperty => {
    const enhanced = { ...property };
    
    // Set purchase date to latest sale date if not already set
    if (!enhanced.purchaseDate && enhanced.postcode) {
      const addressParts = enhanced.address.split(' ');
      const houseNumber = addressParts[0];
      
      if (enhanced.address.includes('16 Lowbiggin') || (houseNumber === '16' && enhanced.postcode === 'NE5 4PR')) {
        enhanced.purchaseDate = '2024-06-28';
      } else if (enhanced.address.includes('21 Fourstone') || (houseNumber === '21' && enhanced.postcode === 'NE5 2PR')) {
        enhanced.purchaseDate = '2024-02-28';
      } else {
        enhanced.purchaseDate = '2024-01-15';
      }
    }
    
    // Set rent start date if not already set
    if (!enhanced.rentStartDate && enhanced.purchaseDate) {
      if (enhanced.address.includes('16 Lowbiggin') || (enhanced.address.includes('16') && enhanced.postcode === 'NE5 4PR')) {
        enhanced.rentStartDate = '2024-07-01';
      } else if (enhanced.address.includes('21 Fourstone') || (enhanced.address.includes('21') && enhanced.postcode === 'NE5 2PR')) {
        enhanced.rentStartDate = '2024-03-01';
      } else if (enhanced.address.includes('3 William Street') || (enhanced.address.includes('3') && enhanced.postcode === 'NE17 7JH')) {
        enhanced.rentStartDate = '2024-02-15';
      } else {
        const purchaseDate = new Date(enhanced.purchaseDate);
        purchaseDate.setMonth(purchaseDate.getMonth() + 1);
        enhanced.rentStartDate = purchaseDate.toISOString().split('T')[0];
      }
    }
    
    // Calculate equity
    if (enhanced.purchasePrice && enhanced.currentValue) {
      const depositAmount = enhanced.depositAmount || (enhanced.purchasePrice * 0.25);
      const valueGrowth = enhanced.currentValue - enhanced.purchasePrice;
      enhanced.equity = depositAmount + valueGrowth;
      
      if (enhanced.currentValue > 0) {
        enhanced.equityPercentage = (enhanced.equity / enhanced.currentValue) * 100;
      }
    }
    
    // Calculate yield
    if (enhanced.monthlyRent && enhanced.currentValue && enhanced.currentValue > 0) {
      enhanced.yield = (enhanced.monthlyRent * 12 / enhanced.currentValue) * 100;
    }
    
    // Calculate monthly profit
    if (enhanced.monthlyRent && enhanced.monthlyMortgagePayment) {
      enhanced.monthlyProfit = enhanced.monthlyRent - enhanced.monthlyMortgagePayment;
      if (enhanced.monthlyExpenses) {
        enhanced.monthlyProfit -= enhanced.monthlyExpenses;
      }
    }
    
    // Calculate total profit
    if (enhanced.currentValue && enhanced.purchasePrice) {
      enhanced.totalProfit = enhanced.currentValue - enhanced.purchasePrice;
    }
    
    // Only populate defaults for fields that are truly missing (null/undefined)
    if ((enhanced.monthlyRent === null || enhanced.monthlyRent === undefined) && enhanced.currentValue) {
      enhanced.monthlyRent = Math.round(enhanced.currentValue * 0.008);
    }
    
    if ((enhanced.monthlyMortgagePayment === null || enhanced.monthlyMortgagePayment === undefined) && enhanced.purchasePrice && enhanced.depositAmount) {
      const mortgageAmount = enhanced.purchasePrice - enhanced.depositAmount;
      const monthlyRate = 0.045 / 12;
      const termYears = 25;
      const termMonths = termYears * 12;
      
      if (mortgageAmount > 0) {
        enhanced.monthlyMortgagePayment = Math.round(
          mortgageAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
          (Math.pow(1 + monthlyRate, termMonths) - 1)
        );
      }
    }
    
    if (enhanced.monthlyExpenses === null || enhanced.monthlyExpenses === undefined) {
      enhanced.monthlyExpenses = enhanced.monthlyRent ? Math.round(enhanced.monthlyRent * 0.1) : 0;
    }
    
    return enhanced;
  };

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return 'N/A';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatPercentage = (percentage: number) => {
    if (!percentage || isNaN(percentage)) return 'N/A';
    return `${percentage.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateGrowth = (current: number, purchase: number) => {
    if (!current || !purchase) return 0;
    return ((current - purchase) / purchase) * 100;
  };

  const getTotalValue = () => {
    return portfolioProperties.reduce((sum, property) => sum + property.currentValue, 0);
  };

  const getTotalGrowth = () => {
    return portfolioProperties.reduce((sum, property) => {
      const growth = property.currentValue - property.purchasePrice;
      return sum + growth;
    }, 0);
  };

  const getTotalEquity = () => {
    return portfolioProperties.reduce((sum, property) => {
      const equity = property.equity || 0;
      return sum + equity;
    }, 0);
  };

  const getTotalPurchasePrice = () => {
    return portfolioProperties.reduce((sum, property) => sum + property.purchasePrice, 0);
  };

  const getTotalRentalProfits = () => {
    return portfolioProperties.reduce((sum, property) => {
      const monthlyProfit = property.monthlyProfit || 0;
      const monthsRented = property.rentStartDate ? 
        Math.max(0, Math.floor((new Date().getTime() - new Date(property.rentStartDate).getTime()) / (1000 * 60 * 60 * 24 * 30))) : 0;
      return sum + (monthlyProfit * monthsRented);
    }, 0);
  };

  const getTotalValueGrowth = () => {
    return portfolioProperties.reduce((sum, property) => {
      return sum + ((property.currentValue || 0) - (property.purchasePrice || 0));
    }, 0);
  };

  const getTotalROI = () => {
    const totalGains = getTotalRentalProfits() + getTotalValueGrowth();
    const totalInvested = getTotalInvested();
    if (!totalInvested || totalInvested === 0) return 0;
    return (totalGains / totalInvested) * 100;
  };

  const getAverageYield = () => {
    const propertiesWithRent = portfolioProperties.filter(p => p.monthlyRent && p.currentValue);
    if (propertiesWithRent.length === 0) return 0;
    
    const totalYield = propertiesWithRent.reduce((sum, property) => {
      const annualRent = (property.monthlyRent || 0) * 12;
      const propertyYield = (annualRent / (property.currentValue || 1)) * 100;
      return sum + propertyYield;
    }, 0);
    
    return totalYield / propertiesWithRent.length;
  };

  const getTotalYearlyTurnover = () => {
    return portfolioProperties.reduce((sum, property) => {
      return sum + ((property.monthlyRent || 0) * 12);
    }, 0);
  };

  const getPercentageOwned = () => {
    const totalValue = getTotalValue();
    const totalEquity = getTotalEquity();
    if (!totalValue || totalValue === 0) return 0;
    return (totalEquity / totalValue) * 100;
  };

  const getTotalInvested = () => {
    return portfolioProperties.reduce((sum, property) => {
      let total = property.depositAmount || 0;
      
      // Add one-off fees
      if (property.oneOffFees && Array.isArray(property.oneOffFees)) {
        total += property.oneOffFees.reduce((feeSum: number, fee: any) => feeSum + (fee.amount || 0), 0);
      }
      
      // Add scheduled fees (one-time only)
      if (property.scheduledFees && Array.isArray(property.scheduledFees)) {
        total += property.scheduledFees
          .filter((fee: any) => fee.frequency === 'one_time')
          .reduce((feeSum: number, fee: any) => feeSum + (fee.amount || 0), 0);
      }
      
      return sum + total;
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-10"></div>
          <div className="relative max-w-screen-2xl w-[90vw] mx-auto pt-20 pb-16">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-6"
              >
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Professional Portfolio Management
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight"
              >
                Portfolio Tracker
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Investment Management
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
              >
                Monitor your property investments, track performance, and make data-driven decisions with our comprehensive portfolio management tools.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <button
                  onClick={() => router.push('/watchlist')}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  View Watchlist
                </button>
                <button
                  onClick={handleRefreshData}
                  disabled={isDataLoading}
                  className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg shadow-lg hover:shadow-xl border border-gray-200 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 mr-2 ${isDataLoading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Real-time tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>Performance analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Investment insights</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Demo Banner for unauthenticated users */}
          {!user && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm"
              data-demo-portfolio-banner
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-lg">ℹ️</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Demo Portfolio</h3>
                  <p className="text-blue-700 mb-3">
                    You're currently viewing a demo portfolio with sample data. To track your real property investments, 
                    please <a href="/auth" className="font-semibold underline hover:text-blue-800">sign in</a> or 
                    <a href="/pricing" className="font-semibold underline hover:text-blue-800 ml-1">upgrade your account</a>.
                  </p>
                  <div className="flex items-center gap-6 text-sm text-blue-600">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      Demo properties shown
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      Real data when logged in
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                      Full portfolio management
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const banner = document.querySelector('[data-demo-portfolio-banner]');
                    if (banner) banner.style.display = 'none';
                  }}
                  className="flex-shrink-0 text-blue-400 hover:text-blue-600"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </motion.div>
          )}

          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 relative">
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Demo
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <PoundSterling className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-500">Total Value</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {formatPrice(getTotalValue())}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600 font-semibold">+{formatPrice(getTotalGrowth())}</span>
                      <span className="text-gray-500">growth</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 relative">
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Demo
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-500">Total Equity</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {formatPrice(getTotalEquity())}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-purple-600 font-semibold">{formatPercentage(getPercentageOwned())}</span>
                      <span className="text-gray-500">ownership</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 relative">
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Demo
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-500">Total ROI</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {formatPercentage(getTotalROI())}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-600 font-semibold">{formatPrice(getTotalRentalProfits())}</span>
                      <span className="text-gray-500">rental profit</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 relative">
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Demo
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <Home className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-500">Properties</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {portfolioProperties.length}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-orange-600 font-semibold">{formatPrice(getTotalYearlyTurnover())}</span>
                      <span className="text-gray-500">annual income</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">Your Properties (Demo)</h2>
                    <p className="text-gray-600">Manage and track individual property performance</p>
                  </div>
                  <button
                    onClick={handleAddProperty}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-5 h-5" />
                    Add Property (Demo)
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      filterStatus === 'all' 
                        ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-200' 
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    All Properties ({portfolioProperties.length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('active')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      filterStatus === 'active' 
                        ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-200' 
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    Active ({portfolioProperties.filter(p => p.status === 'active').length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('sold')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      filterStatus === 'sold' 
                        ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-200' 
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    Sold ({portfolioProperties.filter(p => p.status === 'sold').length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('watching')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      filterStatus === 'watching' 
                        ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-200' 
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    Watchlist ({portfolioProperties.filter(p => p.status === 'watchlist').length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProperties.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="col-span-full text-center py-20"
                  >
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center shadow-sm">
                      <Home className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">No Properties Found</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      {filterStatus === 'all' 
                        ? "Start building your property portfolio by adding your first investment."
                        : `No ${filterStatus} properties found. Try changing the filter or add new properties.`
                      }
                    </p>
                    <button
                      onClick={handleAddProperty}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-4 h-4" />
                      {filterStatus === 'all' ? 'Add Your First Property' : 'Add New Property'}
                    </button>
                  </motion.div>
                ) : (
                  filteredProperties.map((property, index) => {
                    const enhancedProperty = calculateMissingData(property);
                    return (
                      <motion.div
                        key={property.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="relative">
                          <SimplePropertyCard
                            property={enhancedProperty}
                            onEdit={(property) => {
                              setEditingProperty(property);
                              setIsEditModalOpen(true);
                            }}
                            onSold={(id, address) => {
                              if (confirm(`Mark ${address} as sold?`)) {
                                handleStatusChange(id, 'sold');
                              }
                            }}
                            onRemove={(id, address) => {
                              if (confirm(`Remove ${address} from your portfolio?`)) {
                                handleRemoveProperty(id, address);
                              }
                            }}
                          />
                          {/* Demo badge */}
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              Demo
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {!user && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 relative">
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Demo
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <PoundSterling className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-500">Total Value</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {formatPrice(getTotalValue())}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600 font-semibold">+{formatPrice(getTotalGrowth())}</span>
                      <span className="text-gray-500">growth</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 relative">
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Demo
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-500">Total Equity</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {formatPrice(getTotalEquity())}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-purple-600 font-semibold">{formatPercentage(getPercentageOwned())}</span>
                      <span className="text-gray-500">ownership</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 relative">
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Demo
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-500">Total ROI</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {formatPercentage(getTotalROI())}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-600 font-semibold">{formatPrice(getTotalRentalProfits())}</span>
                      <span className="text-gray-500">rental profit</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 relative">
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Demo
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <Home className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-500">Properties</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {portfolioProperties.length}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-orange-600 font-semibold">{formatPrice(getTotalYearlyTurnover())}</span>
                      <span className="text-gray-500">annual income</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">Demo Properties</h2>
                    <p className="text-gray-600">Sample portfolio showing what your real investments could look like</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push('/auth')}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <BarChart3 className="w-5 h-5" />
                      Sign In
                    </button>
                    <button
                      onClick={() => router.push('/pricing')}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Target className="w-5 h-5" />
                      View Plans
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      filterStatus === 'all' 
                        ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-200' 
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    All Properties ({portfolioProperties.length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('active')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      filterStatus === 'active' 
                        ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-200' 
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    Active ({portfolioProperties.filter(p => p.status === 'active').length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('sold')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      filterStatus === 'sold' 
                        ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-200' 
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    Sold ({portfolioProperties.filter(p => p.status === 'sold').length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProperties.map((property, index) => {
                  const enhancedProperty = calculateMissingData(property);
                  return (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="relative">
                        <SimplePropertyCard
                          property={enhancedProperty}
                          onEdit={(property) => {
                            setEditingProperty(property);
                            setIsEditModalOpen(true);
                          }}
                          onSold={(id, address) => {
                            if (confirm(`Mark ${address} as sold?`)) {
                              handleStatusChange(id, 'sold');
                            }
                          }}
                          onRemove={(id, address) => {
                            if (confirm(`Remove ${address} from your portfolio?`)) {
                              handleRemoveProperty(id, address);
                            }
                          }}
                        />
                        {/* Demo badge */}
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            Demo
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          <PropertyEditModal
            property={editingProperty}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingProperty(null);
            }}
            onSave={handlePropertySave}
          />
        </div>
      </div>
    </>
  );
} 