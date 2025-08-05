'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  MapPinIcon, 
  ArrowTopRightOnSquareIcon, 
  ChevronDownIcon,
  XMarkIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useUser } from '@supabase/auth-helpers-react';
import { useUserTier } from '@/hooks/useUserTier';
import { useToast } from '../components/ToastProvider';

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
  total_size?: {
    value: number;
    unit: string;
  } | null;
  floor_plan_links?: Array<{
    url: string;
    text: string;
  }> | null;
  refurbishment_cost?: number;
  total_cost?: number;
  estimated_fair_value?: number;
  fair_bid_amount?: number;
  user_notes?: string;
  property_condition?: string;
  market_trend?: string;
  days_on_market?: number;
  custom_rental_estimate?: number;
  mortgage_type?: string;
  mortgage_rate?: number;
  mortgage_term?: number;
  offer_amount?: number;
  offer_date?: string;
  offer_status?: 'pending' | 'accepted' | 'rejected';
}

export default function WatchlistPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const user = useUser();
  const { tier, loading: tierLoading } = useUserTier(user?.id);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('captured_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingProperty, setEditingProperty] = useState<string | null>(null);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist');
      const result = await response.json();

      if (!response.ok) {
        console.error('Error loading watchlist:', result.error);
        return;
      }

      setWatchlist(result.properties || []);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (id: string) => {
    try {
      const response = await fetch(`/api/properties/capture`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        console.error('Error deleting property');
        return;
      }

      setWatchlist(prev => prev.filter(item => item.id !== id));
      showToast({ type: 'success', title: 'Property deleted successfully' });
    } catch (error) {
      console.error('Error deleting property:', error);
      showToast({ type: 'error', title: 'Error deleting property' });
    }
  };

  const toggleComparisonMode = () => {
    setComparisonMode(!comparisonMode);
    if (comparisonMode) {
      setSelectedProperties([]);
    }
  };

  const togglePropertySelection = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const isPropertySelected = (propertyId: string) => {
    return selectedProperties.includes(propertyId);
  };

  const toggleBreakdown = (propertyId: string) => {
    const newExpanded = new Set(expandedBreakdowns);
    if (newExpanded.has(propertyId)) {
      newExpanded.delete(propertyId);
    } else {
      newExpanded.add(propertyId);
    }
    setExpandedBreakdowns(newExpanded);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleEditProperty = (propertyId: string) => {
    setEditingProperty(propertyId);
    // For now, just show a toast - in a full implementation, this would open an edit modal
    showToast({ 
      type: 'info', 
      title: 'Edit Property', 
      message: 'Property editing feature coming soon!' 
    });
  };

  const calculateRentalEstimateSync = (property: WatchlistItem) => {
    if (property.custom_rental_estimate && property.custom_rental_estimate > 0) {
      return property.custom_rental_estimate;
    }
    return Math.round(property.price * 0.008);
  };

  const calculateYield = (monthlyRent: number, price: number) => {
    if (price <= 0) return '0.0';
    return ((monthlyRent * 12) / price * 100).toFixed(1);
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'rightmove':
        return '🏠';
      case 'zoopla':
        return '🏘️';
      case 'onthemarket':
        return '🏡';
      default:
        return '🏠';
    }
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

  // Validate image URL to ensure it's safe to display
  const isValidImageUrl = (url: string) => {
    if (!url || typeof url !== 'string') return false;
    
    // Check if it's a valid URL
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
    } catch {
      return false;
    }
  };

  const calculateInvestmentMetrics = (property: WatchlistItem) => {
    const rentalEstimate = calculateRentalEstimateSync(property);
    const yieldPercentage = property.price > 0 ? parseFloat(calculateYield(rentalEstimate, property.price)) : 0;
    const totalCost = property.price + (property.refurbishment_cost || 0);
    const annualRent = rentalEstimate * 12;
    const annualROI = totalCost > 0 ? (annualRent / totalCost) * 100 : 0;
    const netAnnualProfit = annualRent - (totalCost * 0.045); // Assuming 4.5% mortgage rate
    const realProfitMargin = totalCost > 0 ? (netAnnualProfit / totalCost) * 100 : 0;
    const paybackPeriod = netAnnualProfit > 0 ? totalCost / netAnnualProfit : 0;

    return {
      rentalEstimate,
      yield: yieldPercentage,
      totalCost,
      annualRent,
      annualROI,
      netAnnualProfit,
      realProfitMargin,
      paybackPeriod
    };
  };

  const calculateDetailedCostBreakdown = (property: WatchlistItem) => {
    const purchasePrice = property.price;
    const deposit = purchasePrice * 0.25; // 25% deposit
    
    // Stamp Duty Land Tax (SDLT) calculation
    let stampDuty = 0;
    if (purchasePrice <= 250000) {
      stampDuty = purchasePrice * 0.03; // 3% for additional properties
    } else if (purchasePrice <= 925000) {
      stampDuty = 7500 + (purchasePrice - 250000) * 0.08; // 3% on first 250k, 8% on remainder
    } else if (purchasePrice <= 1500000) {
      stampDuty = 67500 + (purchasePrice - 925000) * 0.13; // 3% on first 250k, 8% on next 675k, 13% on remainder
    } else {
      stampDuty = 150000 + (purchasePrice - 1500000) * 0.15; // 3% on first 250k, 8% on next 675k, 13% on next 575k, 15% on remainder
    }
    
    // Legal and compliance costs
    const legalFees = 1500; // Conveyancing fees
    const surveyFees = 500; // Building survey
    const mortgageFees = 1000; // Mortgage arrangement fees
    const landRegistryFees = 200; // Land registry fees
    const searchesFees = 300; // Local authority searches
    
    // Gas and electrical safety certificates
    const gasSafetyCertificate = 80; // Annual gas safety check
    const electricalSafetyCertificate = 200; // EICR (Electrical Installation Condition Report)
    const energyPerformanceCertificate = 80; // EPC certificate
    
    // Additional compliance costs
    const fireSafetyAssessment = 150; // Fire risk assessment
    const legionellaRiskAssessment = 100; // Legionella risk assessment
    const asbestosSurvey = 300; // Asbestos survey (if needed)
    const landlordInsurance = 300; // Annual landlord insurance
    
    // Refurbishment costs
    const refurbishmentCost = property.refurbishment_cost || 0;
    
    // Additional setup costs
    const furnitureAndAppliances = 2000; // Basic furniture and appliances
    const marketingAndLettingFees = 500; // Letting agent fees
    const contingencyFund = 1000; // Contingency for unexpected costs
    
    const totalSetupCosts = legalFees + surveyFees + mortgageFees + landRegistryFees + searchesFees +
                           gasSafetyCertificate + electricalSafetyCertificate + energyPerformanceCertificate +
                           fireSafetyAssessment + legionellaRiskAssessment + asbestosSurvey + landlordInsurance +
                           furnitureAndAppliances + marketingAndLettingFees + contingencyFund;
    
    const totalInvestmentCost = deposit + stampDuty + refurbishmentCost + totalSetupCosts;
    
    return {
      deposit,
      stampDuty,
      legalFees,
      surveyFees,
      mortgageFees,
      landRegistryFees,
      searchesFees,
      gasSafetyCertificate,
      electricalSafetyCertificate,
      energyPerformanceCertificate,
      fireSafetyAssessment,
      legionellaRiskAssessment,
      asbestosSurvey,
      landlordInsurance,
      refurbishmentCost,
      furnitureAndAppliances,
      marketingAndLettingFees,
      contingencyFund,
      totalSetupCosts,
      totalInvestmentCost
    };
  };

  const calculateGrowthProjections = (property: WatchlistItem) => {
    // Calculate rental estimate for this function
    const rentalEstimate = calculateRentalEstimateSync(property);
    
    // Base growth rate based on property type and location
    let baseGrowthRate = 2.5; // Conservative base rate
    
    // Adjust based on property type
    if (property.property_type?.toLowerCase().includes('house')) {
      baseGrowthRate += 1.5; // Houses typically appreciate faster
    } else if (property.property_type?.toLowerCase().includes('flat') || property.property_type?.toLowerCase().includes('apartment')) {
      baseGrowthRate += 0.5; // Flats appreciate slower
    }
    
    // Adjust based on bedrooms (more bedrooms = higher growth potential)
    if (property.bedrooms >= 4) {
      baseGrowthRate += 1.0;
    } else if (property.bedrooms >= 3) {
      baseGrowthRate += 0.5;
    }
    
    // Adjust based on property condition
    if (property.property_condition === 'Excellent') {
      baseGrowthRate += 1.0;
    } else if (property.property_condition === 'Good') {
      baseGrowthRate += 0.5;
    } else if (property.property_condition === 'Fair') {
      baseGrowthRate -= 0.5;
    } else if (property.property_condition === 'Poor') {
      baseGrowthRate -= 1.0;
    }
    
    // Adjust based on yield (higher yield areas often have lower growth but better cash flow)
    if (property.price > 0) {
      const yieldPercentage = (rentalEstimate * 12 / property.price) * 100;
      if (yieldPercentage > 8) {
        baseGrowthRate -= 1.0; // High yield areas often have lower growth
      } else if (yieldPercentage < 4) {
        baseGrowthRate += 1.0; // Low yield areas often have higher growth
      }
    }
    
    // Calculate 5-year projections
    const conservativeGrowth = Math.max(0, baseGrowthRate - 1);
    const optimisticGrowth = baseGrowthRate + 2;
    
    // Market trend based on property characteristics
    let marketTrend = 'Stable';
    if (baseGrowthRate > 4) {
      marketTrend = 'Growing';
    } else if (baseGrowthRate < 2) {
      marketTrend = 'Declining';
    }
    
    // Rental demand based on property type and size
    let rentalDemand = 'Moderate';
    if (property.bedrooms >= 3 && property.property_type?.toLowerCase().includes('house')) {
      rentalDemand = 'High';
    } else if (property.bedrooms <= 1) {
      rentalDemand = 'Low';
    }
    
    return {
      conservativeGrowth: conservativeGrowth.toFixed(1),
      optimisticGrowth: optimisticGrowth.toFixed(1),
      marketTrend,
      rentalDemand,
      baseGrowthRate: baseGrowthRate.toFixed(1)
    };
  };

  const assessDealQuality = (property: WatchlistItem) => {
    const metrics = calculateInvestmentMetrics(property);
    let score = 0;
    let reasons: string[] = [];

    // ROI scoring
    if (metrics.annualROI >= 8) {
      score += 25;
      reasons.push('Excellent ROI (8%+)');
    } else if (metrics.annualROI >= 6) {
      score += 20;
      reasons.push('Good ROI (6-8%)');
    } else if (metrics.annualROI >= 4) {
      score += 15;
      reasons.push('Moderate ROI (4-6%)');
    } else {
      score += 5;
      reasons.push('Low ROI (<4%)');
    }

    // Profit margin scoring
    if (metrics.realProfitMargin >= 4) {
      score += 25;
      reasons.push('High profit margin');
    } else if (metrics.realProfitMargin >= 2) {
      score += 20;
      reasons.push('Good profit margin');
    } else if (metrics.realProfitMargin >= 0) {
      score += 15;
      reasons.push('Positive cash flow');
    } else {
      score += 5;
      reasons.push('Negative cash flow');
    }

    // Payback period scoring
    if (metrics.paybackPeriod <= 15) {
      score += 25;
      reasons.push('Quick payback period');
    } else if (metrics.paybackPeriod <= 20) {
      score += 20;
      reasons.push('Reasonable payback period');
    } else if (metrics.paybackPeriod <= 25) {
      score += 15;
      reasons.push('Moderate payback period');
    } else {
      score += 5;
      reasons.push('Long payback period');
    }

    // Property condition scoring
    if (property.property_condition === 'Excellent' || property.property_condition === 'Good') {
      score += 15;
      reasons.push('Good property condition');
    } else if (property.property_condition === 'Fair') {
      score += 10;
      reasons.push('Fair property condition');
    } else {
      score += 5;
      reasons.push('Needs improvement');
    }

    // Location scoring (simplified)
    score += 10;
    reasons.push('Location assessment');

    let overallRating = 'Poor';
    if (score >= 80) overallRating = 'Excellent';
    else if (score >= 70) overallRating = 'Very Good';
    else if (score >= 60) overallRating = 'Good';
    else if (score >= 50) overallRating = 'Fair';
    else if (score >= 40) overallRating = 'Below Average';

    return {
      score,
      overallRating,
      reasons: reasons.slice(0, 3)
    };
  };

  const filteredWatchlist = useMemo(() => {
    let filtered = watchlist;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (priceFilter !== 'all') {
      const [min, max] = priceFilter.split('-').map(Number);
      filtered = filtered.filter(item => {
        if (max) {
          return item.price >= min && item.price <= max;
        } else {
          return item.price >= min;
        }
      });
    }

    return filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof WatchlistItem];
      let bValue: any = b[sortBy as keyof WatchlistItem];

      if (sortBy === 'price') {
        aValue = a.price;
        bValue = b.price;
      } else if (sortBy === 'captured_at') {
        aValue = new Date(a.captured_at);
        bValue = new Date(b.captured_at);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [watchlist, searchTerm, statusFilter, priceFilter, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading watchlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Mode Banner - Only show if user is not authenticated or doesn't have proper tier */}
        {(!user || tier === 'free' || tierLoading) && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-bold">ℹ️</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-800 mb-1">Demo Mode</h3>
                <p className="text-sm text-blue-700 mb-2">
                  You're currently viewing demo data. To capture real properties and access your personal watchlist, 
                  please <a href="/auth" className="font-semibold underline hover:text-blue-800">sign in</a> or 
                  <a href="/pricing" className="font-semibold underline hover:text-blue-800 ml-1">upgrade your account</a>.
                </p>
                <div className="flex items-center gap-4 text-xs text-blue-600">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Demo properties shown
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Real data when logged in
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Watchlist</h1>
          <p className="text-gray-600">Track and analyze your captured properties</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={toggleComparisonMode}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                comparisonMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {comparisonMode ? 'Exit Comparison' : 'Compare Properties'}
            </button>
          </div>
        </div>

        {/* Properties Grid */}
        {filteredWatchlist.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredWatchlist.map((item, index) => {
              const metrics = calculateInvestmentMetrics(item);
              const assessment = assessDealQuality(item);
              const growthProjections = calculateGrowthProjections(item);
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Property Image */}
                  <div className="relative h-48 bg-gray-200">
                    {item.images && item.images.length > 0 && isValidImageUrl(item.images[0]) ? (
                      <Image
                        src={item.images[0]}
                        alt={item.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    {/* Fallback placeholder - always present but hidden when image loads */}
                    <div className={`w-full h-full flex items-center justify-center ${item.images && item.images.length > 0 && isValidImageUrl(item.images[0]) ? 'hidden' : ''}`}>
                      <div className="text-center">
                        <div className="text-4xl mb-2">🏠</div>
                        <div className="text-sm text-gray-500">{item.property_type || 'Property'}</div>
                      </div>
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-full">
                        {getSourceIcon(item.source)} {item.source}
                      </span>
                    </div>
                    {(!user || tier === 'free' || tierLoading) && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          Demo
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Property Content */}
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        {comparisonMode && (
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={isPropertySelected(item.id)}
                              onChange={() => togglePropertySelection(item.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <span className="text-sm text-gray-600">Select for comparison</span>
                          </div>
                        )}
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                          {item.address}
                        </h3>
                        
                        {/* Property Details */}
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">💰</span>
                            <span className="font-bold text-blue-600">{formatPrice(item.price)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">🛏️</span>
                            <span className="font-medium">{item.bedrooms} bed</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">🚿</span>
                            <span className="font-medium">{item.bathrooms} bath</span>
                          </div>
                          {item.total_size && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">📏</span>
                              <span className="font-medium">{item.total_size.value} {item.total_size.unit}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">📋</span>
                            <span className="font-medium">{item.tenure}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <MapPinIcon className="w-4 h-4" />
                          <span className="line-clamp-1">{item.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary Card */}
                    <div className="mb-6 p-6 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 shadow-lg">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                          <span className="text-2xl text-white">💰</span>
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-800">Investment Summary</h4>
                          <p className="text-sm text-gray-600">Complete financial analysis and projections</p>
                        </div>
                      </div>
                      
                      {/* Mortgage Type */}
                      <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <span className="text-lg">🏠</span>
                        </div>
                        <div>
                          <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Mortgage Type</div>
                          <div className="text-base font-bold text-gray-800">{item.mortgage_type || 'Interest-Only Mortgage'}</div>
                        </div>
                      </div>
                      
                      {/* Key Performance Metrics */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex flex-col p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 shadow-sm">
                          <div className="text-xs text-green-600 font-medium mb-1">Annual Return</div>
                          <div className="text-lg font-bold text-green-700 leading-tight">
                            {metrics.annualROI.toFixed(1)}%
                          </div>
                        </div>
                        <div className="flex flex-col p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm">
                          <div className="text-xs text-blue-600 font-medium mb-1">Monthly Profit</div>
                          <div className="text-lg font-bold text-blue-700 leading-tight">
                            {formatPrice(metrics.netAnnualProfit / 12)}
                          </div>
                        </div>
                        <div className="flex flex-col p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 shadow-sm">
                          <div className="text-xs text-purple-600 font-medium mb-1">Cash-on-Cash</div>
                          <div className="text-lg font-bold text-purple-700 leading-tight">
                            {metrics.annualROI.toFixed(1)}%
                          </div>
                        </div>
                        <div className="flex flex-col p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 shadow-sm">
                          <div className="text-xs text-orange-600 font-medium mb-1">Payback Period</div>
                          <div className="text-lg font-bold text-orange-700 leading-tight">
                            {metrics.paybackPeriod.toFixed(1)}y
                          </div>
                        </div>
                      </div>

                      {/* Detailed Cost Breakdown */}
                      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
                        {/* Total Investment - Always Visible */}
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">💼</span>
                            <span className="font-semibold text-gray-800">Total Investment Required:</span>
                          </div>
                          <span className="text-xl font-bold text-blue-600">
                            {formatPrice(calculateDetailedCostBreakdown(item).totalInvestmentCost)}
                          </span>
                        </div>
                        
                        <button 
                          onClick={() => toggleSection('cost-breakdown')}
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-gray-800 text-base">📋 Detailed Cost Breakdown</h5>
                            <ChevronDownIcon 
                              className={`w-4 h-4 text-gray-600 transition-transform ${
                                expandedSections.has('cost-breakdown') ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        
                        {expandedSections.has('cost-breakdown') && (
                          <div className="space-y-2 text-sm border-t pt-3">
                            {(() => {
                              const costs = calculateDetailedCostBreakdown(item);
                              return (
                                <>
                                  {/* Major Costs */}
                                  <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="flex justify-between p-2 bg-blue-50 rounded border">
                                      <span className="text-gray-700 font-medium text-xs">🏦 Deposit (25%):</span>
                                      <span className="font-bold text-blue-600 text-xs">{formatPrice(costs.deposit)}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-purple-50 rounded border">
                                      <span className="text-gray-700 font-medium text-xs">💰 Stamp Duty:</span>
                                      <span className="font-bold text-purple-600 text-xs">{formatPrice(costs.stampDuty)}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Legal & Professional Fees */}
                                  <div className="bg-gray-50 rounded p-2 mb-2">
                                    <div className="text-xs font-semibold text-gray-700 mb-1">⚖️ Legal & Professional Fees</div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Conveyancing:</span>
                                        <span className="font-medium">{formatPrice(costs.legalFees)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Building Survey:</span>
                                        <span className="font-medium">{formatPrice(costs.surveyFees)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Mortgage Fees:</span>
                                        <span className="font-medium">{formatPrice(costs.mortgageFees)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Land Registry:</span>
                                        <span className="font-medium">{formatPrice(costs.landRegistryFees)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Searches:</span>
                                        <span className="font-medium">{formatPrice(costs.searchesFees)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Safety Certificates */}
                                  <div className="bg-green-50 rounded p-2 mb-2">
                                    <div className="text-xs font-semibold text-gray-700 mb-1">🔒 Safety Certificates</div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Gas Safety:</span>
                                        <span className="font-medium">{formatPrice(costs.gasSafetyCertificate)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Electrical Safety:</span>
                                        <span className="font-medium">{formatPrice(costs.electricalSafetyCertificate)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Energy Performance:</span>
                                        <span className="font-medium">{formatPrice(costs.energyPerformanceCertificate)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Additional Compliance */}
                                  <div className="bg-orange-50 rounded p-2 mb-2">
                                    <div className="text-xs font-semibold text-gray-700 mb-1">📋 Additional Compliance</div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Fire Safety Assessment:</span>
                                        <span className="font-medium">{formatPrice(costs.fireSafetyAssessment)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Legionella Assessment:</span>
                                        <span className="font-medium">{formatPrice(costs.legionellaRiskAssessment)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Asbestos Survey:</span>
                                        <span className="font-medium">{formatPrice(costs.asbestosSurvey)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Landlord Insurance:</span>
                                        <span className="font-medium">{formatPrice(costs.landlordInsurance)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Setup Costs */}
                                  <div className="bg-yellow-50 rounded p-2 mb-2">
                                    <div className="text-xs font-semibold text-gray-700 mb-1">🏠 Setup Costs</div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Refurbishment:</span>
                                        <span className="font-medium">{formatPrice(costs.refurbishmentCost)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Furniture & Appliances:</span>
                                        <span className="font-medium">{formatPrice(costs.furnitureAndAppliances)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Marketing & Letting:</span>
                                        <span className="font-medium">{formatPrice(costs.marketingAndLettingFees)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Contingency Fund:</span>
                                        <span className="font-medium">{formatPrice(costs.contingencyFund)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  

                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>


                    </div>

                    {/* Accordion Sections */}
                    <div className="space-y-3">
                      {/* Quick Metrics Section */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <button 
                          onClick={() => toggleSection('quick-metrics')}
                          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 text-left hover:from-emerald-700 hover:to-emerald-800 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold text-sm">📊 QUICK METRICS</span>
                            </div>
                            <ChevronDownIcon 
                              className={`w-4 h-4 text-white transition-transform ${
                                expandedSections.has('quick-metrics') ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        {expandedSections.has('quick-metrics') && (
                          <div className="p-4 bg-white border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex justify-between p-2 bg-gray-50 rounded border border-gray-100">
                                <span className="text-gray-700 font-medium">Monthly Rent:</span>
                                <span className="font-bold text-blue-600">{formatPrice(metrics.rentalEstimate)}</span>
                              </div>
                              <div className="flex justify-between p-2 bg-gray-50 rounded border border-gray-100">
                                <span className="text-gray-700 font-medium">Annual ROI:</span>
                                <span className="font-bold text-green-600">{metrics.annualROI.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between p-2 bg-gray-50 rounded border border-gray-100">
                                <span className="text-gray-700 font-medium">Profit Margin:</span>
                                <span className="font-bold text-purple-600">{metrics.realProfitMargin.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between p-2 bg-gray-50 rounded border border-gray-100">
                                <span className="text-gray-700 font-medium">Payback Period:</span>
                                <span className="font-bold text-orange-600">{metrics.paybackPeriod.toFixed(1)}y</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Monthly Cash Flow Section */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <button 
                          onClick={() => toggleSection('monthly-cash-flow')}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 text-left hover:from-green-700 hover:to-green-800 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold text-sm">💸 MONTHLY CASH FLOW</span>
                            </div>
                            <ChevronDownIcon 
                              className={`w-4 h-4 text-white transition-transform ${
                                expandedSections.has('monthly-cash-flow') ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        {expandedSections.has('monthly-cash-flow') && (
                          <div className="p-4 bg-white border-t border-gray-200">
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border border-green-200 shadow-sm">
                                <span className="text-gray-700 font-medium">+ Rental Income:</span>
                                <span className="font-bold text-green-700">+{formatPrice(metrics.rentalEstimate)}</span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100 shadow-sm">
                                <span className="text-gray-700 font-medium">- Mortgage Payment:</span>
                                <span className="font-bold text-red-600">-{formatPrice(metrics.totalCost * 0.045 / 12)}</span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100 shadow-sm">
                                <span className="text-gray-700 font-medium">- Other Expenses:</span>
                                <span className="font-bold text-red-600">-{formatPrice(metrics.rentalEstimate * 0.15)}</span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-t-2 border-blue-200 shadow-sm">
                                <span className="font-semibold text-gray-800">= Net Cash Flow:</span>
                                <span className="font-bold text-blue-600 text-lg">= {formatPrice(metrics.netAnnualProfit / 12)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Growth Projections Section */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <button 
                          onClick={() => toggleSection('growth-projections')}
                          className="w-full bg-gradient-to-r from-sky-600 to-sky-700 px-4 py-3 text-left hover:from-sky-700 hover:to-sky-800 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold text-sm">📈 GROWTH PROJECTIONS</span>
                            </div>
                            <ChevronDownIcon 
                              className={`w-4 h-4 text-white transition-transform ${
                                expandedSections.has('growth-projections') ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        {expandedSections.has('growth-projections') && (
                          <div className="p-4 bg-white border-t border-gray-200">
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                <span className="text-gray-700 font-medium">Conservative Growth:</span>
                                <span className="font-bold text-orange-600">+{growthProjections.conservativeGrowth}%</span>
                              </div>
                              <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                <span className="text-gray-700 font-medium">Optimistic Growth:</span>
                                <span className="font-bold text-green-600">+{growthProjections.optimisticGrowth}%</span>
                              </div>
                              <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                <span className="text-gray-700 font-medium">Market Trend:</span>
                                <span className={`font-bold ${
                                  growthProjections.marketTrend === 'Growing' ? 'text-green-600' : 
                                  growthProjections.marketTrend === 'Declining' ? 'text-red-600' : 'text-blue-600'
                                }`}>{growthProjections.marketTrend}</span>
                              </div>
                              <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                <span className="text-gray-700 font-medium">Rental Demand:</span>
                                <span className={`font-bold ${
                                  growthProjections.rentalDemand === 'High' ? 'text-green-600' : 
                                  growthProjections.rentalDemand === 'Low' ? 'text-red-600' : 'text-blue-600'
                                }`}>{growthProjections.rentalDemand}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Recommended Offer Section */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <button 
                          onClick={() => toggleSection('recommended-offer')}
                          className="w-full bg-gradient-to-r from-orange-600 to-orange-700 px-4 py-3 text-left hover:from-orange-700 hover:to-orange-800 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold text-sm">🎯 RECOMMENDED OFFER</span>
                            </div>
                            <ChevronDownIcon 
                              className={`w-4 h-4 text-white transition-transform ${
                                expandedSections.has('recommended-offer') ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        {expandedSections.has('recommended-offer') && (
                          <div className="p-4 bg-white border-t border-gray-200">
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                <span className="text-gray-700 font-medium">Fair Value:</span>
                                <span className="font-bold text-blue-600">{formatPrice(item.price * 0.95)}</span>
                              </div>
                              <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                <span className="text-gray-700 font-medium">Recommended:</span>
                                <span className="font-bold text-amber-600">{formatPrice(item.price * 0.92)}</span>
                              </div>
                              <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                <span className="text-gray-700 font-medium">Max Offer:</span>
                                <span className="font-bold text-red-600">{formatPrice(item.price * 0.98)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>



                      {/* Detailed Breakdown Section */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <button 
                          onClick={() => toggleBreakdown(item.id)}
                          className="w-full bg-gradient-to-r from-slate-600 to-slate-700 px-4 py-3 text-left hover:from-slate-700 hover:to-slate-800 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold text-sm">📋 DETAILED BREAKDOWN</span>
                            </div>
                            <ChevronDownIcon 
                              className={`w-4 h-4 text-white transition-transform ${
                                expandedBreakdowns.has(item.id) ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        {expandedBreakdowns.has(item.id) && (
                          <div className="p-4 bg-white border-t border-gray-200">
                            <div className="space-y-3 text-sm">
                              <div className="text-xs text-gray-600 mb-2 font-medium">Deal Assessment:</div>
                              {assessment.reasons.map((reason, index) => (
                                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                  <span className="text-green-500 font-bold">✓</span>
                                  <span className="text-gray-700 font-medium">{reason}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4 mt-6">
                      <button
                        onClick={() => window.open(item.original_url, '_blank')}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        View Original Listing
                      </button>
                      
                      {/* Edit, Professional Offer and Negotiation Strategy Buttons */}
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => handleEditProperty(item.id)}
                          className="py-2 px-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-medium rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Edit Property
                        </button>
                        
                        <button
                          onClick={() => {
                            const offerText = `Hi, I'm interested in the property at ${item.address}. Based on my analysis, I'd like to make a professional offer of ${formatPrice(item.price * 0.92)}. I'm a serious buyer with financing in place and can move quickly. Please let me know if you'd like to discuss this further.`;
                            navigator.clipboard.writeText(offerText);
                            showToast({ type: 'success', title: 'Professional offer copied to clipboard' });
                          }}
                          className="py-2 px-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm"
                        >
                          <span className="text-sm">📄</span>
                          Copy Offer
                        </button>
                        
                        <button
                          onClick={() => {
                            const strategyText = `Negotiation Strategy for ${item.address}:\n\n1. Start with ${formatPrice(item.price * 0.88)} (12% below asking)\n2. Highlight: ${assessment.reasons.join(', ')}\n3. Emphasize quick closing and cash offer\n4. Be prepared to go up to ${formatPrice(item.price * 0.95)} if needed\n5. Use market data to justify offer`;
                            navigator.clipboard.writeText(strategyText);
                            showToast({ type: 'success', title: 'Negotiation strategy copied to clipboard' });
                          }}
                          className="py-2 px-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm"
                        >
                          <span className="text-sm">🎯</span>
                          Strategy
                        </button>
                      </div>
                      
                      <button
                        onClick={() => deleteProperty(item.id)}
                        className="w-full py-2 px-3 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <span className="text-sm">🗑️</span>
                        Delete Property
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Comparison View */}
        {comparisonMode && selectedProperties.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-8"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Property Comparison ({selectedProperties.length} selected)
                </h3>
                <button
                  onClick={() => setSelectedProperties([])}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {selectedProperties.map(propertyId => {
                  const property = watchlist.find(p => p.id === propertyId);
                  if (!property) return null;
                  
                  const metrics = calculateInvestmentMetrics(property);
                  const assessment = assessDealQuality(property);
                  const growthProjections = calculateGrowthProjections(property);
                  
                  return (
                    <div
                      key={property.id}
                      className="bg-gray-50 rounded-xl p-4 border-2 border-blue-200"
                    >
                      <h4 className="font-semibold text-gray-900 line-clamp-2 mb-3">
                        {property.address}
                      </h4>
                      
                      {/* Property Details */}
                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">💰</span>
                          <span className="font-bold text-blue-600">{formatPrice(property.price)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">🛏️</span>
                          <span className="font-medium">{property.bedrooms} bed</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">🚿</span>
                          <span className="font-medium">{property.bathrooms} bath</span>
                        </div>
                        {property.total_size && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">📏</span>
                            <span className="font-medium">{property.total_size.value} {property.total_size.unit}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">📋</span>
                          <span className="font-medium">{property.tenure}</span>
                        </div>
                      </div>
                      
                      {/* Basic Metrics */}
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-800 mb-2 text-sm">📊 Basic Metrics:</h5>
                        <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Price:</span>
                            <span className="font-semibold">{formatPrice(property.price)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Yield:</span>
                            <span className="font-semibold text-green-600">{metrics.yield}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">ROI:</span>
                            <span className="font-semibold text-blue-600">{metrics.annualROI.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Monthly Profit:</span>
                            <span className="font-semibold text-blue-600">{formatPrice(metrics.netAnnualProfit / 12)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Deal Assessment */}
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-800 mb-2 text-sm">Deal Assessment:</h5>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-600">Overall Rating:</span>
                            <span className={`font-bold text-sm ${
                              assessment.overallRating === 'Excellent' ? 'text-green-600' :
                              assessment.overallRating === 'Very Good' ? 'text-blue-600' :
                              assessment.overallRating === 'Good' ? 'text-purple-600' :
                              assessment.overallRating === 'Fair' ? 'text-orange-600' :
                              'text-red-600'
                            }`}>
                              {assessment.overallRating} ({assessment.score}/100)
                            </span>
                          </div>
                          
                          {/* Assessment Details */}
                          <div className="space-y-1">
                            {assessment.reasons.map((reason, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs">
                                <span className="text-blue-500">✓</span>
                                <span className="text-gray-700">{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Investment Details */}
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-800 mb-2 text-sm">Investment Details:</h5>
                        <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Investment Cost:</span>
                            <span className="font-semibold">{formatPrice(calculateDetailedCostBreakdown(property).totalInvestmentCost)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payback Period:</span>
                            <span className="font-semibold">{metrics.paybackPeriod.toFixed(1)} years</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Profit Margin:</span>
                            <span className="font-semibold text-green-600">{metrics.realProfitMargin.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cash-on-Cash:</span>
                            <span className="font-semibold text-purple-600">{metrics.annualROI.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Growth Projections */}
                      <div>
                        <h5 className="font-semibold text-gray-800 mb-2 text-sm">Growth Projections:</h5>
                        <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Conservative Growth:</span>
                            <span className="font-semibold text-orange-600">+{growthProjections.conservativeGrowth}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Optimistic Growth:</span>
                            <span className="font-semibold text-green-600">+{growthProjections.optimisticGrowth}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Market Trend:</span>
                            <span className={`font-semibold ${
                              growthProjections.marketTrend === 'Growing' ? 'text-green-600' : 
                              growthProjections.marketTrend === 'Declining' ? 'text-red-600' : 'text-blue-600'
                            }`}>{growthProjections.marketTrend}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Rental Demand:</span>
                            <span className={`font-semibold ${
                              growthProjections.rentalDemand === 'High' ? 'text-green-600' : 
                              growthProjections.rentalDemand === 'Low' ? 'text-red-600' : 'text-orange-600'
                            }`}>{growthProjections.rentalDemand}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}