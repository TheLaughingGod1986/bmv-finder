'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Home as HomeIcon, 
  Eye as EyeIcon, 
  TrendingUp, 
  Target, 
  Calculator, 
  Briefcase as BriefcaseIcon,
  MapPin,
  PoundSterling,
  Filter,
  Search,
  X,
  Plus,
  Clock,
  Calendar,
  Edit,
  Trash2,
  Star,
  CheckCircle,
  AlertCircle,
  ArrowUpDown,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface WatchlistItem {
  id: string;
  title: string;
  price: number;
  address: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  tenure: string;
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  original_url: string;
  source: string;
  agent_name: string;
  agent_phone: string;
  images: string[];
  captured_at: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
  refurbishment_cost?: number;
  estimated_fair_value?: number;
  custom_rental_estimate?: number;
  property_condition?: string;
  days_on_market?: number;
  mortgage_type?: string;
  mortgage_rate?: number;
  mortgage_term?: number;
  user_notes?: string;
  offer_amount?: number;
  offer_date?: string;
  offer_status?: string;
}

interface EditForm {
  title: string;
  price: number;
  address: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  tenure: string;
  postcode: string;
  agent_name: string;
  agent_phone: string;
  refurbishment_cost: number;
  estimated_fair_value: number;
  custom_rental_estimate: number;
  property_condition: string;
  days_on_market: number;
  mortgage_type: string;
  mortgage_rate: number;
  mortgage_term: number;
  user_notes: string;
  status: string;
  offer_amount: number;
  offer_date: string;
  offer_status: string;
}

export default function WatchlistPage() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('captured_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Set<string>>(new Set());
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    title: '',
    price: 0,
    address: '',
    description: '',
    bedrooms: 0,
    bathrooms: 0,
    property_type: '',
    tenure: '',
    postcode: '',
    agent_name: '',
    agent_phone: '',
    refurbishment_cost: 0,
    estimated_fair_value: 0,
    custom_rental_estimate: 0,
    property_condition: 'Good',
    days_on_market: 0,
    mortgage_type: 'Interest-Only',
    mortgage_rate: 4.5,
    mortgage_term: 25,
    user_notes: '',
    status: 'active',
    offer_amount: 0,
    offer_date: '',
    offer_status: 'pending'
  });

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/watchlist');
      if (response.ok) {
        const data = await response.json();
        // API returns { success, count, properties } - we need the properties array
        const properties = data.properties || data;
        setWatchlist(Array.isArray(properties) ? properties : []);
      } else {
        console.error('Failed to load watchlist:', response.status);
        setWatchlist([]);
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  // Utility functions
  const calculateRentalEstimateSync = (property: WatchlistItem): number => {
    const baseRent = property.price * 0.004; // 4.8% annual yield
    const bedroomMultiplier = property.bedrooms * 0.1;
    return Math.round(baseRent * (1 + bedroomMultiplier));
  };

  const calculateYield = (rent: number, price: number): string => {
    if (price === 0) return '0';
    return ((rent * 12 / price) * 100).toFixed(1);
  };

  const calculateInvestmentMetrics = (property: WatchlistItem) => {
    const rentalEstimate = calculateRentalEstimateSync(property);
    const yieldPercentage = parseFloat(calculateYield(rentalEstimate, property.price));
    
    // Calculate mortgage payment (assuming 75% LTV, 4.5% interest rate)
    const mortgageAmount = property.price * 0.75;
    const monthlyMortgagePayment = (mortgageAmount * 0.045) / 12;
    
    // Calculate monthly expenses (insurance, maintenance, etc.)
    const monthlyExpenses = property.price * 0.01 / 12; // 1% of property value annually
    
    // Calculate monthly cash flow
    const monthlyCashFlow = rentalEstimate - monthlyMortgagePayment - monthlyExpenses;
    
    // Calculate annual metrics
    const annualRentalIncome = rentalEstimate * 12;
    const annualMortgagePayment = monthlyMortgagePayment * 12;
    const annualExpenses = monthlyExpenses * 12;
    const netAnnualProfit = annualRentalIncome - annualMortgagePayment - annualExpenses;
    
    // Calculate payback period
    const totalInvestment = property.price * 0.25; // 25% deposit
    const paybackPeriod = totalInvestment / netAnnualProfit;
    
    // Calculate returns
    const annualReturn = (netAnnualProfit / totalInvestment) * 100;
    const cashOnCashReturn = (netAnnualProfit / totalInvestment) * 100;
    
    return {
      monthlyCashFlow,
      monthlyMortgagePayment,
      monthlyExpenses,
      netAnnualProfit,
      paybackPeriod,
      annualReturn,
      cashOnCashReturn,
      totalInvestment
    };
  };

  const analyzePropertyValue = (property: WatchlistItem) => {
    const rentalEstimate = calculateRentalEstimateSync(property);
    const yieldPercentage = parseFloat(calculateYield(rentalEstimate, property.price));
    
    // Calculate fair value based on current market yield
    // Use the actual yield achieved by the property as the baseline
    // If yield is high (>8%), the property is likely undervalued
    // If yield is low (<4%), the property is likely overvalued
    
    let targetYield = 6; // Default target yield
    let fairValue = (rentalEstimate * 12) / (targetYield / 100);
    
    // Adjust target yield based on current market conditions
    if (yieldPercentage > 8) {
      // High yield suggests undervalued property - use higher target yield
      targetYield = 7.5;
      fairValue = (rentalEstimate * 12) / (targetYield / 100);
    } else if (yieldPercentage < 4) {
      // Low yield suggests overvalued property - use lower target yield
      targetYield = 4.5;
      fairValue = (rentalEstimate * 12) / (targetYield / 100);
    }
    
    // Cap fair value to be more realistic (not more than 20% above asking price)
    const maxFairValue = property.price * 1.2;
    if (fairValue > maxFairValue) {
      fairValue = maxFairValue;
    }
    
    // Calculate price difference
    const priceDifference = property.price - fairValue;
    const priceDifferencePercentage = (priceDifference / property.price) * 100;
    
    // Determine if it's a good price
    let priceAssessment = 'Fair Price';
    let priceReason = '';
    
    if (priceDifferencePercentage <= -15) {
      priceAssessment = 'Excellent Price';
      priceReason = `Property is ${Math.abs(priceDifferencePercentage).toFixed(1)}% below fair value`;
    } else if (priceDifferencePercentage <= -8) {
      priceAssessment = 'Good Price';
      priceReason = `Property is ${Math.abs(priceDifferencePercentage).toFixed(1)}% below fair value`;
    } else if (priceDifferencePercentage <= 8) {
      priceAssessment = 'Fair Price';
      priceReason = 'Property is close to fair value';
    } else if (priceDifferencePercentage <= 15) {
      priceAssessment = 'Overpriced';
      priceReason = `Property is ${priceDifferencePercentage.toFixed(1)}% above fair value`;
    } else {
      priceAssessment = 'Significantly Overpriced';
      priceReason = `Property is ${priceDifferencePercentage.toFixed(1)}% above fair value`;
    }
    
    return {
      fairValue: Math.round(fairValue),
      priceDifference,
      priceDifferencePercentage,
      priceAssessment,
      priceReason,
      targetYield
    };
  };

  const getRecommendedOffer = (property: WatchlistItem) => {
    const valueAnalysis = analyzePropertyValue(property);
    const condition = property.property_condition || 'Good';
    
    // Start with the asking price as the base
    let baseOffer = property.price;
    
    // Adjust based on fair value analysis
    if (valueAnalysis.priceDifferencePercentage < -10) {
      // Property is significantly below fair value - can offer closer to asking
      baseOffer = property.price * 0.98; // 2% below asking
    } else if (valueAnalysis.priceDifferencePercentage < -5) {
      // Property is below fair value - reasonable offer
      baseOffer = property.price * 0.95; // 5% below asking
    } else if (valueAnalysis.priceDifferencePercentage > 10) {
      // Property is overpriced - offer significantly less
      baseOffer = property.price * 0.85; // 15% below asking
    } else {
      // Property is around fair value - standard negotiation
      baseOffer = property.price * 0.92; // 8% below asking
    }
    
    // Adjust for condition
    const conditionAdjustments = {
      'Excellent': 1.02, // Pay 2% more for excellent condition
      'Good': 1.0,       // No adjustment for good condition
      'Fair': 0.98,      // Pay 2% less for fair condition
      'Poor': 0.92,      // Pay 8% less for poor condition
      'Needs Work': 0.88 // Pay 12% less if needs work
    };
    
    baseOffer *= conditionAdjustments[condition as keyof typeof conditionAdjustments] || 1.0;
    
    const recommendedOffer = Math.round(baseOffer);
    
    // Calculate offer range (±3% of recommended offer)
    const minOffer = Math.round(recommendedOffer * 0.97);
    const maxOffer = Math.round(recommendedOffer * 1.03);
    
    return {
      recommendedOffer,
      offerRange: { min: minOffer, max: maxOffer },
      baseOffer: Math.round(baseOffer),
      negotiationBuffer: Math.round(((property.price - recommendedOffer) / property.price) * 100)
    };
  };

  const analyzeGrowthPotential = (property: WatchlistItem) => {
    // This would ideally use real market data, but for now we'll use estimates
    // based on property type, location, and current market trends
    
    const baseAnnualGrowth = 2.5; // UK average historical growth
    let growthMultiplier = 1.0;
    const factors: string[] = [];
    
    // Property type adjustments
    if (property.property_type?.toLowerCase().includes('terraced')) {
      growthMultiplier *= 1.1; // Terraced houses often perform well
      factors.push('Terraced houses have strong demand');
    } else if (property.property_type?.toLowerCase().includes('detached')) {
      growthMultiplier *= 1.05; // Detached houses typically perform well
      factors.push('Detached properties have good growth potential');
    }
    
    // Location-based adjustments (simplified)
    if (property.postcode?.startsWith('NE')) {
      growthMultiplier *= 1.15; // Newcastle area has been growing well
      factors.push('Newcastle area showing strong growth');
    } else if (property.postcode?.startsWith('M')) {
      growthMultiplier *= 1.2; // Manchester area
      factors.push('Manchester area has excellent growth potential');
    } else if (property.postcode?.startsWith('B')) {
      growthMultiplier *= 1.1; // Birmingham area
      factors.push('Birmingham area showing good growth');
    }
    
    // Price point adjustments
    if (property.price < 200000) {
      growthMultiplier *= 1.1; // Lower price points often grow faster
      factors.push('Affordable price point typically grows well');
    } else if (property.price > 500000) {
      growthMultiplier *= 0.95; // Higher price points may grow slower
      factors.push('Premium price point may grow slower');
    }
    
    // Calculate 10-year growth
    const annualGrowthRate = baseAnnualGrowth * growthMultiplier;
    const tenYearGrowth = Math.pow(1 + (annualGrowthRate / 100), 10) - 1;
    const projectedValue = property.price * (1 + tenYearGrowth);
    
    let growthAssessment = 'Average Growth';
    if (annualGrowthRate >= 4) {
      growthAssessment = 'High Growth Potential';
    } else if (annualGrowthRate >= 3) {
      growthAssessment = 'Good Growth Potential';
    } else if (annualGrowthRate >= 2) {
      growthAssessment = 'Moderate Growth Potential';
    } else {
      growthAssessment = 'Low Growth Potential';
    }
    
    return {
      annualGrowthRate: annualGrowthRate.toFixed(1),
      tenYearGrowth: (tenYearGrowth * 100).toFixed(1),
      projectedValue: Math.round(projectedValue),
      growthAssessment,
      factors
    };
  };

  const toggleBreakdown = (propertyId: string) => {
    setExpandedBreakdowns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  const getRefurbishmentRecommendations = (property: WatchlistItem) => {
    const basePrice = property.price;
    const bedrooms = property.bedrooms || 2; // Default to 2 if not specified
    const condition = property.property_condition || 'Good';
    
    // Base refurbishment costs per bedroom
    const baseCostPerBedroom = {
      'Excellent': 5000,
      'Good': 8000,
      'Fair': 12000,
      'Poor': 18000,
      'Needs Work': 25000
    };
    
    const baseCost = baseCostPerBedroom[condition as keyof typeof baseCostPerBedroom] || 8000;
    
    // Calculate recommendations based on property size and condition
    const lowEnd = Math.round(baseCost * bedrooms * 0.7);
    const mediumEnd = Math.round(baseCost * bedrooms * 1.0);
    const highEnd = Math.round(baseCost * bedrooms * 1.5);
    
    // Adjust based on property value (higher value properties get higher quality refurbs)
    const valueMultiplier = basePrice > 300000 ? 1.2 : basePrice > 200000 ? 1.1 : 1.0;
    
    return {
      lowEnd: Math.round(lowEnd * valueMultiplier),
      mediumEnd: Math.round(mediumEnd * valueMultiplier),
      highEnd: Math.round(highEnd * valueMultiplier),
      description: {
        lowEnd: `Basic refresh: paint, flooring, minor repairs`,
        mediumEnd: `Standard refurb: kitchen, bathroom, decor`,
        highEnd: `Premium refurb: high-end finishes, extensions`
      }
    };
  };

  // Filtered and sorted watchlist
  const filteredWatchlist = useMemo(() => {
    if (!Array.isArray(watchlist)) return [];
    
    let filtered = watchlist.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesPrice = priceFilter === 'all' || 
        (priceFilter === 'under-100k' && item.price < 100000) ||
        (priceFilter === '100k-200k' && item.price >= 100000 && item.price < 200000) ||
        (priceFilter === '200k-300k' && item.price >= 200000 && item.price < 300000) ||
        (priceFilter === '300k-400k' && item.price >= 300000 && item.price < 400000) ||
        (priceFilter === '400k-500k' && item.price >= 400000 && item.price < 500000) ||
        (priceFilter === 'over-500k' && item.price >= 500000);
      
      return matchesSearch && matchesStatus && matchesPrice;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'captured_at':
          aValue = new Date(a.captured_at).getTime();
          bValue = new Date(b.captured_at).getTime();
          break;
        case 'bedrooms':
          aValue = a.bedrooms;
          bValue = b.bedrooms;
          break;
        case 'yield':
          aValue = parseFloat(calculateYield(calculateRentalEstimateSync(a), a.price));
          bValue = parseFloat(calculateYield(calculateRentalEstimateSync(b), b.price));
          break;
        case 'payback':
          aValue = calculateInvestmentMetrics(a).paybackPeriod;
          bValue = calculateInvestmentMetrics(b).paybackPeriod;
          break;
        case 'cashflow':
          aValue = calculateInvestmentMetrics(a).monthlyCashFlow;
          bValue = calculateInvestmentMetrics(b).monthlyCashFlow;
          break;
        default:
          return 0;
      }
      
      if (aValue !== bValue) {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return filtered;
  }, [watchlist, searchTerm, statusFilter, priceFilter, sortBy, sortOrder]);

  const deleteProperty = async (propertyId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this property?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/watchlist`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: propertyId }),
      });
      
      if (response.ok) {
        await loadWatchlist();
      } else {
        console.error('Error deleting property:', response.status);
      }
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };

  const addToPortfolio = async (property: WatchlistItem) => {
    const confirmed = window.confirm(`Add ${property.address} to your portfolio?`);
    if (!confirmed) return;

    try {
      // For now, just show a success message since portfolio API isn't implemented yet
      alert('Property added to portfolio successfully!');
    } catch (error) {
      console.error('Error adding to portfolio:', error);
    }
  };

  const startEditing = (property: WatchlistItem) => {
    setEditingProperty(property.id);
    setEditForm({
      title: property.title || '',
      price: property.price || 0,
      address: property.address || '',
      description: property.description || '',
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      property_type: property.property_type || '',
      tenure: property.tenure || '',
      postcode: property.postcode || '',
      agent_name: property.agent_name || '',
      agent_phone: property.agent_phone || '',
      refurbishment_cost: property.refurbishment_cost || 0,
      estimated_fair_value: property.estimated_fair_value || property.price,
      custom_rental_estimate: property.custom_rental_estimate || calculateRentalEstimateSync(property),
      property_condition: property.property_condition || 'Good',
      days_on_market: property.days_on_market || 0,
      mortgage_type: property.mortgage_type || 'Interest-Only',
      mortgage_rate: property.mortgage_rate || 4.5,
      mortgage_term: property.mortgage_term || 25,
      user_notes: property.user_notes || '',
      status: property.status || 'active',
      offer_amount: property.offer_amount || 0,
      offer_date: property.offer_date || '',
      offer_status: property.offer_status || 'pending'
    });
  };

  const saveEdit = async (propertyId: string) => {
    try {
      const { custom_rental_estimate, ...updateData } = editForm;
      
      const response = await fetch(`/api/watchlist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: propertyId,
          ...updateData
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error updating property:', errorText);
        return;
      }

      await loadWatchlist();
      setEditingProperty(null);
      setEditForm({
        title: '',
        price: 0,
        address: '',
        description: '',
        bedrooms: 0,
        bathrooms: 0,
        property_type: '',
        tenure: '',
        postcode: '',
        agent_name: '',
        agent_phone: '',
        refurbishment_cost: 0,
        estimated_fair_value: 0,
        custom_rental_estimate: 0,
        property_condition: 'Good',
        days_on_market: 0,
        mortgage_type: 'Interest-Only',
        mortgage_rate: 4.5,
        mortgage_term: 25,
        user_notes: '',
        status: 'active',
        offer_amount: 0,
        offer_date: '',
        offer_status: 'pending'
      });
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Failed to save changes');
    }
  };

  const cancelEdit = () => {
    setEditingProperty(null);
    setEditForm({
      title: '',
      price: 0,
      address: '',
      description: '',
      bedrooms: 0,
      bathrooms: 0,
      property_type: '',
      tenure: '',
      postcode: '',
      agent_name: '',
      agent_phone: '',
      refurbishment_cost: 0,
      estimated_fair_value: 0,
      custom_rental_estimate: 0,
      property_condition: 'Good',
      days_on_market: 0,
      mortgage_type: 'Interest-Only',
      mortgage_rate: 4.5,
      mortgage_term: 25,
      user_notes: '',
      status: 'active',
      offer_amount: 0,
      offer_date: '',
      offer_status: 'pending'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'rightmove': return '🏠';
      case 'zoopla': return '🏘️';
      case 'onthemarket': return '🏡';
      default: return '📋';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'sold': return <Star className="w-4 h-4 text-blue-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your watchlist...</p>
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
                  <HomeIcon className="w-4 h-4 mr-2" />
                  Property Investment Management
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight"
              >
                Captured Properties
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Investment Watchlist
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
              >
                Properties captured with the BMV Finder Chrome extension. Monitor your investment opportunities and track performance with our comprehensive analysis tools.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <button
                  onClick={() => router.push('/portfolio-tracker')}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <BriefcaseIcon className="w-5 h-5 mr-2" />
                  View Portfolio
                </button>
                <button
                  onClick={() => router.push('/deal-calculator')}
                  className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg shadow-lg hover:shadow-xl border border-gray-200 transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  Deal Calculator
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500"
              >
                <div className="flex items-center gap-2">
                  <EyeIcon className="w-4 h-4" />
                  <span>Real-time tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Performance analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>Investment insights</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <HomeIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Total Properties</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {watchlist.length}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-600 font-semibold">{watchlist.filter(p => p.status === 'active').length}</span>
                  <span className="text-gray-500">active</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <PoundSterling className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Total Value</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatPrice(watchlist.reduce((sum, p) => sum + p.price, 0))}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-purple-600 font-semibold">{formatPrice(watchlist.reduce((sum, p) => sum + p.price, 0) / watchlist.length)}</span>
                  <span className="text-gray-500">average</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Avg. Yield</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {watchlist.length > 0 ? 
                    (watchlist.reduce((sum, p) => {
                      const rent = calculateRentalEstimateSync(p);
                      return sum + parseFloat(calculateYield(rent, p.price));
                    }, 0) / watchlist.length).toFixed(1) + '%' : 'N/A'
                  }
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-emerald-600 font-semibold">{formatPrice(watchlist.reduce((sum, p) => sum + calculateRentalEstimateSync(p), 0))}</span>
                  <span className="text-gray-500">monthly rent</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Avg. Payback</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {watchlist.length > 0 ? 
                    (watchlist.reduce((sum, p) => {
                      const metrics = calculateInvestmentMetrics(p);
                      return sum + metrics.paybackPeriod;
                    }, 0) / watchlist.length).toFixed(1) + 'y' : 'N/A'
                  }
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-orange-600 font-semibold">
                    {watchlist.length > 0 ? 
                      watchlist.filter(p => {
                        const metrics = calculateInvestmentMetrics(p);
                        return metrics.paybackPeriod <= 3;
                      }).length : 0
                    }
                  </span>
                  <span className="text-gray-500">≤3y deals</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Recently Added</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {watchlist.filter(p => {
                    const daysSinceAdded = (new Date().getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
                    return daysSinceAdded <= 7;
                  }).length}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-cyan-600 font-semibold">last 7 days</span>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search properties..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                    {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="captured_at">Date Added</option>
                      <option value="price">Price</option>
                      <option value="bedrooms">Bedrooms</option>
                      <option value="yield">Yield</option>
                      <option value="payback">Payback Period</option>
                      <option value="cashflow">Monthly Cash Flow</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="sold">Sold</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                      <select
                        value={priceFilter}
                        onChange={(e) => setPriceFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Prices</option>
                        <option value="under-100k">Under £100k</option>
                        <option value="100k-200k">£100k - £200k</option>
                        <option value="200k-300k">£200k - £300k</option>
                        <option value="300k-400k">£300k - £400k</option>
                        <option value="400k-500k">£400k - £500k</option>
                        <option value="over-500k">Over £500k</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Your Watchlist
                <span className="text-sm text-gray-500 ml-2">({filteredWatchlist.length} properties)</span>
              </h2>
              
              <button
                onClick={() => router.push('/extension-welcome')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Get Chrome Extension
              </button>
            </div>

            {/* Properties Grid */}
            {filteredWatchlist.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || statusFilter !== 'all' || priceFilter !== 'all' 
                    ? "Try adjusting your search or filters to see more properties."
                    : "Start capturing properties with the BMV Finder Chrome extension to build your watchlist."
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && priceFilter === 'all' && (
                  <button
                    onClick={() => router.push('/extension-welcome')}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Get Chrome Extension
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredWatchlist.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 overflow-hidden"
                  >
                    {/* Property Image */}
                    <div className="relative h-48 bg-gray-200">
                      {item.images && item.images.length > 0 ? (
                        <Image
                          src={item.images[0]}
                          alt={item.title}
                          width={400}
                          height={300}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
                                  <div class="text-center">
                                    <div class="text-4xl mb-2">🏠</div>
                                    <div class="text-sm text-gray-500 font-medium">${item.property_type || 'Property'}</div>
                                    <div class="text-xs text-gray-400">${item.bedrooms || 0} bed${item.bedrooms !== 1 ? 's' : ''}</div>
                                  </div>
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
                          <div className="text-center">
                            <div className="text-4xl mb-2">🏠</div>
                            <div className="text-sm text-gray-500 font-medium">{item.property_type || 'Property'}</div>
                            <div className="text-xs text-gray-400">{item.bedrooms || 0} bed{item.bedrooms !== 1 ? 's' : ''}</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Source Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-full">
                          {getSourceIcon(item.source)} {item.source}
                        </span>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Property Content */}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{item.address}</span>
                      </div>
                      
                      <div className="text-2xl font-bold text-blue-600 mb-4">
                        {formatPrice(item.price)}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <span>🛏️ {item.bedrooms} bed{item.bedrooms !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span>🚿 {item.bathrooms} bath{item.bathrooms !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span>🏠 {item.property_type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span>📅 {formatDate(item.captured_at)}</span>
                        </div>
                      </div>

                      {/* Investment Metrics */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-gray-600">
                            <span className="font-medium">Yield:</span> {calculateYield(calculateRentalEstimateSync(item), item.price)}%
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">Rent:</span> {formatPrice(calculateRentalEstimateSync(item))}/mo
                          </div>
                        </div>
                      </div>

                      {/* Growth Projections */}
                      {(() => {
                        const metrics = calculateInvestmentMetrics(item);
                        const growthAnalysis = analyzeGrowthPotential(item);
                        const valueAnalysis = analyzePropertyValue(item);
                        const offerAnalysis = getRecommendedOffer(item);
                        
                        const getGrowthColor = (assessment: string) => {
                          if (assessment === 'Excellent') return 'text-green-600';
                          if (assessment === 'Good') return 'text-blue-600';
                          if (assessment === 'Average') return 'text-yellow-600';
                          return 'text-red-600';
                        };
                        
                        const getPriceColor = (assessment: string) => {
                          if (assessment === 'Excellent Price') return 'text-green-600';
                          if (assessment === 'Good Price') return 'text-blue-600';
                          if (assessment === 'Fair Price') return 'text-yellow-600';
                          return 'text-red-600';
                        };
                        
                        return (
                          <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                            {/* Growth Projections */}
                            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-blue-200">
                              <div className="text-center mb-2">
                                <div className="text-xs text-gray-600 mb-1">📈 GROWTH PROJECTIONS</div>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="flex justify-between p-2 bg-white rounded border border-gray-100">
                                  <span className="text-gray-600">10-Year Growth:</span>
                                  <span className={`font-semibold ${getGrowthColor(growthAnalysis.growthAssessment)}`}>
                                    {growthAnalysis.tenYearGrowth}%
                                  </span>
                                </div>
                                <div className="flex justify-between p-2 bg-white rounded border border-gray-100">
                                  <span className="text-gray-600">Projected Value:</span>
                                  <span className="font-semibold text-green-600">{formatPrice(growthAnalysis.projectedValue)}</span>
                                </div>
                                <div className="flex justify-between p-2 bg-white rounded border border-gray-100">
                                  <span className="text-gray-600">Payback Period:</span>
                                  <span className="font-semibold text-blue-600">{metrics.paybackPeriod.toFixed(1)}y</span>
                                </div>
                                <div className="flex justify-between p-2 bg-white rounded border border-gray-100">
                                  <span className="text-gray-600">Annual Profit:</span>
                                  <span className={`font-semibold ${metrics.netAnnualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatPrice(metrics.netAnnualProfit)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Recommended Offer Section */}
                            <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
                              {/* Header */}
                              <div className="bg-blue-600 px-4 py-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold text-white">🎯 RECOMMENDED OFFER</h4>
                                  <span className="text-xs text-white">{offerAnalysis.negotiationBuffer}% below asking</span>
                                </div>
                              </div>
                              
                              {/* Main Offer Display */}
                              <div className="p-4">
                                <div className="text-center mb-4">
                                  <div className="text-2xl font-bold text-blue-700 mb-1">
                                    {formatPrice(offerAnalysis.recommendedOffer)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    vs {formatPrice(item.price)} asking price
                                  </div>
                                </div>
                                
                                {/* Quick Analysis */}
                                <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                                  <div className="flex justify-between p-2 bg-blue-50 rounded border border-blue-100">
                                    <span className="text-gray-600">Price Assessment:</span>
                                    <span className={`font-semibold ${getPriceColor(valueAnalysis.priceAssessment)}`}>
                                      {valueAnalysis.priceAssessment}
                                    </span>
                                  </div>
                                  <div className="flex justify-between p-2 bg-green-50 rounded border border-green-100">
                                    <span className="text-gray-600">Fair Value:</span>
                                    <span className="font-semibold text-gray-800">
                                      {formatPrice(valueAnalysis.fairValue)}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                  <button className="flex-1 py-2 px-3 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
                                    📄 Copy Professional Offer
                                  </button>
                                  <button className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors">
                                    🎯 Generate Negotiation Strategy
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Investment Summary */}
                            <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
                              {/* Header */}
                              <div className="bg-green-600 px-4 py-2">
                                <h4 className="text-sm font-bold text-white">💰 INVESTMENT SUMMARY</h4>
                              </div>
                              
                              {/* Summary Content */}
                              <div className="p-4">
                                <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                                  <div className="flex justify-between p-2 bg-green-50 rounded border border-green-100">
                                    <span className="text-gray-600">Total Investment:</span>
                                    <span className="font-semibold text-gray-800">{formatPrice(metrics.totalInvestment)}</span>
                                  </div>
                                  <div className="flex justify-between p-2 bg-green-50 rounded border border-green-100">
                                    <span className="text-gray-600">Annual Return:</span>
                                    <span className="font-semibold text-green-600">{metrics.annualReturn.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between p-2 bg-green-50 rounded border border-green-100">
                                    <span className="text-gray-600">Monthly Profit:</span>
                                    <span className="font-semibold text-green-600">{formatPrice(metrics.monthlyCashFlow)}</span>
                                  </div>
                                  <div className="flex justify-between p-2 bg-green-50 rounded border border-green-100">
                                    <span className="text-gray-600">Cash-on-Cash:</span>
                                    <span className="font-semibold text-blue-600">{metrics.cashOnCashReturn.toFixed(1)}%</span>
                                  </div>
                                </div>
                                
                                {/* Mortgage Type Indicator */}
                                <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                                  <span>🏠</span>
                                  <span>{item.mortgage_type || 'Interest-Only'} Mortgage</span>
                                </div>
                                
                                {/* Monthly Cash Flow Breakdown */}
                                <div className="bg-gray-50 rounded-lg p-3 text-xs">
                                  <div className="text-center mb-2 font-medium text-gray-700">Monthly Cash Flow</div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">+ Rental Income:</span>
                                      <span className="font-semibold text-green-600">+{formatPrice(calculateRentalEstimateSync(item))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">- Mortgage Payment:</span>
                                      <span className="font-semibold text-red-600">-{formatPrice(metrics.monthlyMortgagePayment)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">- Other Expenses:</span>
                                      <span className="font-semibold text-red-600">-{formatPrice(metrics.monthlyExpenses)}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-300 pt-1 font-bold">
                                      <span className="text-gray-800">= Net Cash Flow:</span>
                                      <span className={`font-bold ${metrics.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        = {formatPrice(metrics.monthlyCashFlow)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Detailed Breakdown Section */}
                      {(() => {
                        const metrics = calculateInvestmentMetrics(item);
                        const isExpanded = expandedBreakdowns.has(item.id);
                        return (
                          <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                              <button 
                                onClick={() => toggleBreakdown(item.id)}
                                className="flex items-center justify-between w-full hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 bg-gradient-to-r from-green-500 via-red-500 to-blue-500 rounded"></div>
                                  <h4 className="text-sm font-semibold text-gray-800">View Detailed Breakdown</h4>
                                </div>
                                <div className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                  <ChevronDown className="w-4 h-4" />
                                </div>
                              </button>
                            </div>
                            
                            {isExpanded && (
                              <div className="p-4 space-y-4">
                              {/* Initial Investment */}
                              <div>
                                <h5 className="text-xs font-semibold text-gray-700 mb-2">Initial Investment</h5>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-blue-50 rounded p-2">
                                    <div className="text-xs text-gray-600">Deposit</div>
                                    <div className="text-sm font-semibold text-blue-700">{formatPrice(metrics.totalInvestment)}</div>
                                  </div>
                                  <div className="bg-orange-50 rounded p-2">
                                    <div className="text-xs text-gray-600">Refurbishment</div>
                                    <div className="text-sm font-semibold text-orange-700">{formatPrice(item.refurbishment_cost || 0)}</div>
                                  </div>
                                  <div className="bg-red-50 rounded p-2">
                                    <div className="text-xs text-gray-600">Stamp Duty</div>
                                    <div className="text-sm font-semibold text-red-700">{formatPrice(Math.round(item.price * 0.02))}</div>
                                  </div>
                                  <div className="bg-gray-50 rounded p-2">
                                    <div className="text-xs text-gray-600">Legal & Survey</div>
                                    <div className="text-sm font-semibold text-gray-700">{formatPrice(4750)}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Monthly Expenses */}
                              <div>
                                <h5 className="text-xs font-semibold text-gray-700 mb-2">Monthly Expenses</h5>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-purple-50 rounded p-2">
                                    <div className="text-xs text-gray-600">Mortgage ({item.mortgage_type || 'Interest-Only'})</div>
                                    <div className="text-sm font-semibold text-purple-700">{formatPrice(metrics.monthlyMortgagePayment)}</div>
                                  </div>
                                  <div className="bg-blue-50 rounded p-2">
                                    <div className="text-xs text-gray-600">Management</div>
                                    <div className="text-sm font-semibold text-blue-700">{formatPrice(calculateRentalEstimateSync(item) * 0.08)}</div>
                                  </div>
                                  <div className="bg-orange-50 rounded p-2">
                                    <div className="text-xs text-gray-600">Insurance</div>
                                    <div className="text-sm font-semibold text-orange-700">{formatPrice(18)}</div>
                                  </div>
                                  <div className="bg-gray-50 rounded p-2">
                                    <div className="text-xs text-gray-600">Maintenance</div>
                                    <div className="text-sm font-semibold text-gray-700">{formatPrice(metrics.monthlyExpenses)}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Mortgage Options */}
                              <div>
                                <h5 className="text-xs font-semibold text-gray-700 mb-2">Mortgage Options</h5>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-blue-50 rounded p-2">
                                    <div className="text-xs text-gray-600">Interest-Only</div>
                                    <div className="text-sm font-semibold text-blue-700">{formatPrice(metrics.monthlyMortgagePayment)}</div>
                                  </div>
                                  <div className="bg-purple-50 rounded p-2">
                                    <div className="text-xs text-gray-600">Repayment</div>
                                    <div className="text-sm font-semibold text-purple-700">{formatPrice(metrics.monthlyMortgagePayment * 1.48)}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Investment Timeline */}
                              <div>
                                <h5 className="text-xs font-semibold text-gray-700 mb-2">Investment Timeline</h5>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-yellow-50 rounded p-2">
                                    <div className="text-xs text-gray-600">Payback Period</div>
                                    <div className="text-sm font-semibold text-yellow-700">{metrics.paybackPeriod.toFixed(1)} years</div>
                                  </div>
                                  <div className="bg-purple-50 rounded p-2">
                                    <div className="text-xs text-gray-600">Annual Profit</div>
                                    <div className="text-sm font-semibold text-purple-700">{formatPrice(metrics.netAnnualProfit)}</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="space-y-2">
                        <button
                          onClick={() => window.open(item.original_url, '_blank')}
                          className="w-full py-2 px-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Original Listing
                        </button>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(item)}
                            className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <Edit className="w-4 h-4 inline mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProperty(item.id)}
                            className="flex-1 py-2 px-3 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 inline mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Basic Property Details</h3>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Property Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-3">Basic Property Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price (£)</label>
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value) || 0})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bedrooms</label>
                    <input
                      type="number"
                      value={editForm.bedrooms}
                      onChange={(e) => setEditForm({...editForm, bedrooms: parseInt(e.target.value) || 0})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bathrooms</label>
                    <input
                      type="number"
                      value={editForm.bathrooms}
                      onChange={(e) => setEditForm({...editForm, bathrooms: parseInt(e.target.value) || 0})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Property Type</label>
                    <select
                      value={editForm.property_type}
                      onChange={(e) => setEditForm({...editForm, property_type: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select type</option>
                      <option value="Detached">Detached</option>
                      <option value="Semi-Detached">Semi-Detached</option>
                      <option value="Terraced">Terraced</option>
                      <option value="Flat">Flat</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Bungalow">Bungalow</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tenure</label>
                    <select
                      value={editForm.tenure}
                      onChange={(e) => setEditForm({...editForm, tenure: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Freehold">Freehold</option>
                      <option value="Leasehold">Leasehold</option>
                      <option value="Share of Freehold">Share of Freehold</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Postcode</label>
                    <input
                      type="text"
                      value={editForm.postcode}
                      onChange={(e) => setEditForm({...editForm, postcode: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Agent Details */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-green-800 mb-3">Agent Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Agent Name</label>
                    <input
                      type="text"
                      value={editForm.agent_name}
                      onChange={(e) => setEditForm({...editForm, agent_name: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Agent Phone</label>
                    <input
                      type="text"
                      value={editForm.agent_phone}
                      onChange={(e) => setEditForm({...editForm, agent_phone: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Investment Analysis */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-800 mb-3">Investment Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Rental Estimate (£)</label>
                    <input
                      type="number"
                      value={editForm.custom_rental_estimate}
                      onChange={(e) => setEditForm({...editForm, custom_rental_estimate: parseFloat(e.target.value) || 0})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Fair Value (£)</label>
                    <input
                      type="number"
                      value={editForm.estimated_fair_value}
                      onChange={(e) => setEditForm({...editForm, estimated_fair_value: parseFloat(e.target.value) || 0})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Days on Market</label>
                    <input
                      type="number"
                      value={editForm.days_on_market}
                      onChange={(e) => setEditForm({...editForm, days_on_market: parseInt(e.target.value) || 0})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Property Condition</label>
                    <select
                      value={editForm.property_condition}
                      onChange={(e) => setEditForm({...editForm, property_condition: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                      <option value="Needs Work">Needs Work</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Mortgage Settings */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-indigo-800 mb-3">Mortgage Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Mortgage Type</label>
                    <select
                      value={editForm.mortgage_type}
                      onChange={(e) => setEditForm({...editForm, mortgage_type: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Interest-Only">Interest-Only</option>
                      <option value="Repayment">Repayment</option>
                      <option value="Part and Part">Part and Part</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.mortgage_rate}
                      onChange={(e) => setEditForm({...editForm, mortgage_rate: parseFloat(e.target.value) || 0})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Term (Years)</label>
                    <input
                      type="number"
                      value={editForm.mortgage_term}
                      onChange={(e) => setEditForm({...editForm, mortgage_term: parseInt(e.target.value) || 0})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Property Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the property..."
                />
              </div>

              {/* Refurbishment Section */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-orange-800 mb-3">Refurbishment & Costs</h4>

                {/* Refurbishment Recommendations */}
                {(() => {
                  const property = watchlist.find(p => p.id === editingProperty);
                  if (!property) return null;
                  
                  const recommendations = getRefurbishmentRecommendations({
                    ...property,
                    property_condition: editForm.property_condition
                  });
                  
                  return (
                    <div className="bg-white rounded-lg p-3 border border-orange-200 mb-3">
                      <h5 className="text-xs font-semibold text-orange-700 mb-2">Refurbishment Recommendations</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-xs font-medium text-green-700">Low End:</span>
                            <p className="text-xs text-gray-600">{recommendations.description.lowEnd}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-green-700">{formatPrice(recommendations.lowEnd)}</span>
                            <button
                              onClick={() => setEditForm(prev => ({ ...prev, refurbishment_cost: recommendations.lowEnd }))}
                              className="block text-xs text-blue-600 hover:text-blue-800 mt-1"
                            >
                              Use this
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-xs font-medium text-blue-700">Medium End:</span>
                            <p className="text-xs text-gray-600">{recommendations.description.mediumEnd}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-blue-700">{formatPrice(recommendations.mediumEnd)}</span>
                            <button
                              onClick={() => setEditForm(prev => ({ ...prev, refurbishment_cost: recommendations.mediumEnd }))}
                              className="block text-xs text-blue-600 hover:text-blue-800 mt-1"
                            >
                              Use this
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-xs font-medium text-purple-700">High End:</span>
                            <p className="text-xs text-gray-600">{recommendations.description.highEnd}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-purple-700">{formatPrice(recommendations.highEnd)}</span>
                            <button
                              onClick={() => setEditForm(prev => ({ ...prev, refurbishment_cost: recommendations.highEnd }))}
                              className="block text-xs text-blue-600 hover:text-blue-800 mt-1"
                            >
                              Use this
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Refurbishment Cost (£)
                  </label>
                  <input
                    type="number"
                    value={editForm.refurbishment_cost}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      refurbishment_cost: parseInt(e.target.value) || 0
                    }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Status & Notes */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-800 mb-3">Status & Notes</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="sold">Sold</option>
                      <option value="under_offer">Under Offer</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={editForm.user_notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, user_notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add your notes about this property..."
                  />
                </div>
              </div>

              {/* Offer Details - Show only when status is "under_offer" */}
              {editForm.status === 'under_offer' && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <span>📁</span>
                    Offer Details
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Offer Amount (£)</label>
                      <input
                        type="number"
                        value={editForm.offer_amount || 0}
                        onChange={(e) => setEditForm(prev => ({ ...prev, offer_amount: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Offer Date</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={editForm.offer_date || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, offer_date: e.target.value }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                          📅
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Offer Status</label>
                    <select
                      value={editForm.offer_status || 'pending'}
                      onChange={(e) => setEditForm(prev => ({ ...prev, offer_status: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="counter_offer">Counter Offer</option>
                    </select>
                  </div>
                  
                  <div className="bg-red-100 border border-red-200 rounded p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600">💡</span>
                      <div className="text-xs text-red-800">
                        <strong>Tip:</strong> When you set status to "Under Offer", you can track your offer details here. Update the offer status when you receive a response from the vendor.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => saveEdit(editingProperty)}
                className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={cancelEdit}
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}