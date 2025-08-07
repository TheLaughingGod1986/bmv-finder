'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Home, 
  Bed, 
  PoundSterling, 
  TrendingUp, 
  Star,
  Heart,
  Eye,
  BarChart3,
  Target,
  Calendar,
  Building2,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Enhanced WatchlistItem interface
interface WatchlistItem {
  id: string;
  address: string;
  postcode: string;
  property_type: string;
  bedrooms: number;
  price: number;
  custom_rental_estimate?: number;
  refurbishment_costs?: {
    low?: number;
    medium?: number;
    high?: number;
    selected?: number;
  };
  offer_history?: Array<{
    date: string;
    amount: number;
    status: 'offer_made' | 'offer_accepted' | 'offer_rejected' | 'under_consideration';
  }>;
  status: 'watching' | 'offer_made' | 'offer_accepted' | 'sold';
  notes?: string;
  created_at: string;
}

// Demo data
const demoWatchlist: WatchlistItem[] = [
  {
    id: '1',
    address: '123 High Street',
    postcode: 'NE1 1AA',
    property_type: 'Terraced House',
    bedrooms: 3,
    price: 250000,
    custom_rental_estimate: 1200,
    refurbishment_costs: {
      low: 10000,
      medium: 20000,
      high: 35000,
      selected: 20000
    },
    offer_history: [
      { date: '2024-01-15', amount: 245000, status: 'offer_made' },
      { date: '2024-01-20', amount: 248000, status: 'offer_rejected' }
    ],
    status: 'watching',
    notes: 'Good location, needs some work',
    created_at: '2024-01-10'
  },
  {
    id: '2',
    address: '456 Main Road',
    postcode: 'NE2 2BB',
    property_type: 'Semi-Detached House',
    bedrooms: 4,
    price: 320000,
    custom_rental_estimate: 1500,
    refurbishment_costs: {
      low: 15000,
      medium: 25000,
      high: 40000,
      selected: 25000
    },
    offer_history: [
      { date: '2024-01-18', amount: 315000, status: 'offer_accepted' }
    ],
    status: 'offer_accepted',
    notes: 'Excellent condition, ready to rent',
    created_at: '2024-01-12'
  },
  {
    id: '3',
    address: '789 Church Lane',
    postcode: 'NE3 3CC',
    property_type: 'Flat',
    bedrooms: 2,
    price: 180000,
    custom_rental_estimate: 900,
    refurbishment_costs: {
      low: 8000,
      medium: 15000,
      high: 25000,
      selected: 15000
    },
    status: 'watching',
    notes: 'Modern flat, good investment potential',
    created_at: '2024-01-14'
  },
  {
    id: '4',
    address: '321 Park Avenue',
    postcode: 'NE4 4DD',
    property_type: 'Detached House',
    bedrooms: 5,
    price: 450000,
    custom_rental_estimate: 2000,
    refurbishment_costs: {
      low: 20000,
      medium: 35000,
      high: 50000,
      selected: 35000
    },
    offer_history: [
      { date: '2024-01-22', amount: 440000, status: 'under_consideration' }
    ],
    status: 'offer_made',
    notes: 'Large family home, premium location',
    created_at: '2024-01-16'
  },
  {
    id: '5',
    address: '654 Station Road',
    postcode: 'NE5 5EE',
    property_type: 'Terraced House',
    bedrooms: 3,
    price: 220000,
    custom_rental_estimate: 1100,
    refurbishment_costs: {
      low: 12000,
      medium: 22000,
      high: 35000,
      selected: 22000
    },
    status: 'watching',
    notes: 'Good rental yield potential',
    created_at: '2024-01-18'
  }
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export default function WatchlistTestPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(demoWatchlist);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showOffersOnly, setShowOffersOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Comparison functionality
  const toggleComparisonMode = () => {
    setComparisonMode(!comparisonMode);
    if (comparisonMode) {
      setSelectedProperties([]);
      setShowComparisonModal(false);
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

  // Investment metrics calculations
  const calculateInvestmentMetrics = (property: WatchlistItem) => {
    const price = property.price;
    const rentalEstimate = property.custom_rental_estimate || (price * 0.005); // 0.5% of price as monthly rent
    const annualRent = rentalEstimate * 12;
    const yieldPercentage = (annualRent / price) * 100;
    
    // Calculate refurbishment costs
    const refurbCost = property.refurbishment_costs?.selected ||
                      property.refurbishment_costs?.medium || 0;
    
    // Calculate stamp duty
    const stampDuty = price <= 250000 ? 0 :
                     price <= 925000 ? (price - 250000) * 0.05 :
                     price <= 1500000 ? 33750 + (price - 925000) * 0.10 :
                     93750 + (price - 1500000) * 0.12;
    
    // Calculate other fees
    const legalFees = Math.max(1500, price * 0.01);
    const surveyFees = Math.max(500, price * 0.002);
    const mortgageFees = Math.max(1000, price * 0.005);
    const landRegistryFees = 200;
    const searchesFees = 300;
    const gasSafetyCertificate = 80;
    const electricalSafetyCertificate = 150;
    const energyPerformanceCertificate = 60;
    const fireSafetyAssessment = 200;
    const legionellaRiskAssessment = 150;
    const asbestosSurvey = 300;
    const landlordInsurance = 300;
    const furnitureAndAppliances = 2000;
    const marketingAndLettingFees = 500;
    const contingencyFund = Math.max(2000, price * 0.02);
    
    // Calculate deposit (assuming 25% deposit)
    const deposit = price * 0.25;
    
    // Calculate mortgage details
    const mortgageAmount = price - deposit;
    const mortgageRate = 0.045; // 4.5% interest rate
    const mortgageType = 'interest_only'; // or 'repayment'
    
    // Calculate monthly mortgage payment
    let monthlyMortgagePayment = 0;
    if (mortgageType === 'interest_only') {
      monthlyMortgagePayment = (mortgageAmount * mortgageRate) / 12;
    } else {
      // Repayment mortgage calculation (simplified)
      const monthlyRate = mortgageRate / 12;
      const numberOfPayments = 25 * 12; // 25 years
      monthlyMortgagePayment = (mortgageAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                               (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }
    
    // Calculate total investment needed
    const totalInvestment = deposit + refurbCost + stampDuty + legalFees + surveyFees + 
                           mortgageFees + landRegistryFees + searchesFees + 
                           gasSafetyCertificate + electricalSafetyCertificate + 
                           energyPerformanceCertificate + fireSafetyAssessment + 
                           legionellaRiskAssessment + asbestosSurvey + landlordInsurance + 
                           furnitureAndAppliances + marketingAndLettingFees + contingencyFund;
    
    // Calculate monthly profit after mortgage
    const monthlyProfit = rentalEstimate - monthlyMortgagePayment;
    
    // Calculate ROI based on total investment
    const annualProfit = monthlyProfit * 12;
    const roi = totalInvestment > 0 ? (annualProfit / totalInvestment) * 100 : 0;
    
    return {
      rentalEstimate,
      annualRent,
      yield: yieldPercentage,
      refurbCost,
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
      furnitureAndAppliances,
      marketingAndLettingFees,
      contingencyFund,
      deposit,
      mortgageAmount,
      mortgageRate: mortgageRate * 100,
      mortgageType,
      monthlyMortgagePayment,
      monthlyProfit,
      annualProfit,
      totalInvestment,
      roi
    };
  };

  const assessDealQuality = (property: WatchlistItem) => {
    const metrics = calculateInvestmentMetrics(property);
    let score = 0;
    const reasons: string[] = [];

    // Yield scoring (0-30 points)
    if (metrics.yield >= 8) {
      score += 30;
      reasons.push('Excellent yield (8%+)');
    } else if (metrics.yield >= 6) {
      score += 20;
      reasons.push('Good yield (6-8%)');
    } else if (metrics.yield >= 4) {
      score += 10;
      reasons.push('Average yield (4-6%)');
    } else {
      reasons.push('Low yield (<4%)');
    }

    // ROI scoring (0-25 points)
    if (metrics.roi >= 6) {
      score += 25;
      reasons.push('Strong ROI (6%+)');
    } else if (metrics.roi >= 4) {
      score += 15;
      reasons.push('Good ROI (4-6%)');
    } else if (metrics.roi >= 2) {
      score += 5;
      reasons.push('Moderate ROI (2-4%)');
    } else {
      reasons.push('Low ROI (<2%)');
    }

    // Price range scoring (0-20 points)
    if (property.price >= 50000 && property.price <= 300000) {
      score += 20;
      reasons.push('Optimal price range');
    } else if (property.price >= 300000 && property.price <= 500000) {
      score += 10;
      reasons.push('Good price range');
    } else {
      reasons.push('Price outside optimal range');
    }

    // Property type scoring (0-15 points)
    if (property.property_type.toLowerCase().includes('house')) {
      score += 15;
      reasons.push('House property type');
    } else if (property.property_type.toLowerCase().includes('flat')) {
      score += 10;
      reasons.push('Flat property type');
    } else {
      score += 5;
      reasons.push('Other property type');
    }

    // Bedrooms scoring (0-10 points)
    if (property.bedrooms >= 3) {
      score += 10;
      reasons.push('3+ bedrooms');
    } else if (property.bedrooms >= 2) {
      score += 5;
      reasons.push('2 bedrooms');
    } else {
      reasons.push('1 bedroom');
    }

    return {
      score,
      reasons,
      grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D'
    };
  };

  // Filter properties
  const filteredProperties = watchlist.filter(property => {
    const matchesSearch = property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.postcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = propertyTypeFilter === 'all' || property.property_type.toLowerCase().includes(propertyTypeFilter.toLowerCase());
    const matchesPrice = property.price >= priceRange.min && property.price <= priceRange.max;
    const matchesFavorites = !showFavoritesOnly || property.status === 'watching';
    const matchesOffers = !showOffersOnly || property.offer_history?.length > 0;

    return matchesSearch && matchesType && matchesPrice && matchesFavorites && matchesOffers;
  });

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
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
                <Eye className="w-4 h-4 mr-2" />
                Enhanced Watchlist
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight"
            >
              Property Watchlist
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Enhanced Analysis & Comparison
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
            >
              Track your favorite properties with detailed investment analysis, comparison tools, and deal quality assessment.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="relative max-w-screen-2xl w-[90vw] mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900">{watchlist.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(watchlist.reduce((sum, p) => sum + p.price, 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <PoundSterling className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Offers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {watchlist.filter(p => p.status === 'offer_made' || p.status === 'offer_accepted').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Yield</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(watchlist.reduce((sum, p) => {
                    const metrics = calculateInvestmentMetrics(p);
                    return sum + metrics.yield;
                  }, 0) / watchlist.length).toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Filters and Controls */}
      <section className="relative max-w-screen-2xl w-[90vw] mx-auto mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={propertyTypeFilter}
                onChange={(e) => setPropertyTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="house">House</option>
                <option value="flat">Flat</option>
                <option value="detached">Detached</option>
                <option value="semi">Semi-Detached</option>
                <option value="terraced">Terraced</option>
              </select>

              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showFavoritesOnly
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart className="w-4 h-4 inline mr-2" />
                Favorites Only
              </button>

              <button
                onClick={() => setShowOffersOnly(!showOffersOnly)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showOffersOnly
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Target className="w-4 h-4 inline mr-2" />
                With Offers
              </button>

              {/* Comparison Mode Button */}
              <button
                onClick={toggleComparisonMode}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  comparisonMode
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                }`}
              >
                <span className="text-lg">⚖️</span>
                {comparisonMode ? 'Exit Comparison' : 'Compare Properties'}
              </button>
              
              {/* Comparison Instructions */}
              {comparisonMode && (
                <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-600">💡</span>
                    <span className="text-sm font-medium text-blue-800">How to Compare Properties:</span>
                  </div>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Click the checkbox on any property card to select it for comparison</p>
                    <p>• Select 2-5 properties to see a detailed side-by-side comparison</p>
                    <p>• Properties will be ranked by investment potential</p>
                  </div>
                  {selectedProperties.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800">
                          Selected: {selectedProperties.length} property{selectedProperties.length !== 1 ? 'ies' : 'y'}
                        </span>
                        {selectedProperties.length >= 2 && (
                          <button
                            onClick={() => setShowComparisonModal(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            🚀 View Comparison ({selectedProperties.length} properties)
                          </button>
                        )}
                      </div>
                      {selectedProperties.length === 1 && (
                        <span className="text-sm text-blue-600">(Select more properties to compare)</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Properties Grid */}
      <section className="relative max-w-screen-2xl w-[90vw] mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredProperties.map((item) => {
            const metrics = calculateInvestmentMetrics(item);
            const assessment = assessDealQuality(item);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 relative"
              >
                {/* Comparison Selection Checkbox */}
                {comparisonMode && (
                  <div className="absolute top-3 left-3 z-10">
                    <button
                      onClick={() => togglePropertySelection(item.id)}
                      className={`w-8 h-8 rounded-full border-3 flex items-center justify-center transition-all duration-200 shadow-lg ${
                        isPropertySelected(item.id)
                          ? 'bg-blue-600 border-blue-600 text-white scale-110'
                          : 'bg-white border-gray-300 hover:border-blue-400 hover:scale-105'
                      }`}
                    >
                      {isPropertySelected(item.id) && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
                
                {/* Comparison Mode Indicator */}
                {comparisonMode && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                      {isPropertySelected(item.id) ? 'Selected' : 'Click to Select'}
                    </div>
                  </div>
                )}

                {/* Property Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <div className="text-center">
                    <Home className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Property Image</p>
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.address}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {item.postcode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{formatPrice(item.price)}</p>
                      <p className="text-sm text-gray-500">{item.property_type}</p>
                    </div>
                  </div>

                  {/* Property Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mx-auto mb-1">
                        <Bed className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">{item.bedrooms}</p>
                      <p className="text-xs text-gray-500">Bedrooms</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mx-auto mb-1">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">{metrics.yield.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">Yield</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mx-auto mb-1">
                        <Target className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">{metrics.roi.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">ROI</p>
                    </div>
                  </div>

                  {/* Investment Metrics */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    {(() => {
                      return (
                        <>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Est. Monthly Rent:</span>
                            <span className="text-sm font-semibold text-green-600">
                              {formatPrice(metrics.rentalEstimate)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Monthly Mortgage:</span>
                            <span className="text-sm font-semibold text-red-600">
                              {formatPrice(metrics.monthlyMortgagePayment)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Monthly Profit:</span>
                            <span className={`text-sm font-semibold ${
                              metrics.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatPrice(metrics.monthlyProfit)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Mortgage Type:</span>
                            <span className="text-sm font-semibold text-blue-600 capitalize">
                              {metrics.mortgageType.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">ROI:</span>
                            <span className="text-sm font-semibold text-purple-600">
                              {metrics.roi.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Deal Quality:</span>
                            <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                              assessment.grade === 'A' ? 'bg-green-100 text-green-800' :
                              assessment.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                              assessment.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              Grade {assessment.grade}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Investment Breakdown */}
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <button
                      onClick={() => toggleSection(`investment-${item.id}`)}
                      className="w-full flex justify-between items-center text-sm font-medium text-gray-700 mb-2"
                    >
                      <span>Investment Breakdown</span>
                      {expandedSections.has(`investment-${item.id}`) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    
                    {expandedSections.has(`investment-${item.id}`) && (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Purchase Price:</span>
                          <span className="font-medium">{formatPrice(item.price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Deposit (25%):</span>
                          <span className="font-medium">{formatPrice(metrics.deposit)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Refurbishment:</span>
                          <span className="font-medium">{formatPrice(metrics.refurbCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Stamp Duty:</span>
                          <span className="font-medium">{formatPrice(metrics.stampDuty)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Legal Fees:</span>
                          <span className="font-medium">{formatPrice(metrics.legalFees)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Survey Fees:</span>
                          <span className="font-medium">{formatPrice(metrics.surveyFees)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mortgage Fees:</span>
                          <span className="font-medium">{formatPrice(metrics.mortgageFees)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Land Registry:</span>
                          <span className="font-medium">{formatPrice(metrics.landRegistryFees)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Searches:</span>
                          <span className="font-medium">{formatPrice(metrics.searchesFees)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Safety Certificates:</span>
                          <span className="font-medium">{formatPrice(metrics.gasSafetyCertificate + metrics.electricalSafetyCertificate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>EPC & Assessments:</span>
                          <span className="font-medium">{formatPrice(metrics.energyPerformanceCertificate + metrics.fireSafetyAssessment + metrics.legionellaRiskAssessment + metrics.asbestosSurvey)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Landlord Insurance:</span>
                          <span className="font-medium">{formatPrice(metrics.landlordInsurance)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Furniture & Marketing:</span>
                          <span className="font-medium">{formatPrice(metrics.furnitureAndAppliances + metrics.marketingAndLettingFees)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Contingency Fund:</span>
                          <span className="font-medium">{formatPrice(metrics.contingencyFund)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-semibold text-sm">
                          <span>Total Investment Needed:</span>
                          <span className="text-blue-600">{formatPrice(metrics.totalInvestment)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Offer History */}
                  {item.offer_history && item.offer_history.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Offer History:</div>
                      <div className="space-y-2">
                        {item.offer_history.slice(0, 2).map((offer, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                offer.status === 'offer_accepted' ? 'bg-green-500' :
                                offer.status === 'offer_rejected' ? 'bg-red-500' :
                                offer.status === 'offer_made' ? 'bg-yellow-500' :
                                'bg-gray-500'
                              }`}></span>
                              <span className="text-gray-600">{offer.status.replace('_', ' ')}</span>
                            </div>
                            <span className="font-medium">{formatPrice(offer.amount)}</span>
                          </div>
                        ))}
                        {item.offer_history.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{item.offer_history.length - 2} more offers
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="flex justify-between items-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      item.status === 'watching' ? 'bg-blue-100 text-blue-800' :
                      item.status === 'offer_made' ? 'bg-yellow-100 text-yellow-800' :
                      item.status === 'offer_accepted' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status.replace('_', ' ').toUpperCase()}
                    </span>
                    
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Heart className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Comparison View */}
      {showComparisonModal && selectedProperties.length >= 2 && (
        <div id="comparison-view" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span>⚖️</span>
                  <span>Detailed Comparison ({selectedProperties.length} properties)</span>
                </h3>
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {selectedProperties.length === 1 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Single Property Analysis</h4>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    You've selected 1 property. To compare multiple properties, go back and select 2-5 properties using the checkboxes.
                  </p>
                  <button
                    onClick={() => setShowComparisonModal(false)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Back to Properties
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {(() => {
                  const rankedProperties = selectedProperties
                    .map(propertyId => {
                      const property = watchlist.find(p => p.id === propertyId);
                      if (!property) return null;
                      const assessment = assessDealQuality(property);
                      return {
                        ...property,
                        assessment,
                        score: assessment.score
                      };
                    })
                    .filter(Boolean)
                    .sort((a, b) => b.score - a.score);
                  
                  return rankedProperties.map((property, index) => {
                    const rank = index + 1;
                    const metrics = calculateInvestmentMetrics(property);
                    const assessment = property.assessment;
                    const rankColors = { 1: 'bg-green-600', 2: 'bg-blue-600', 3: 'bg-orange-600' };
                    const rankIcons = { 1: '🥇', 2: '🥈', 3: '🥉' };
                    const rankLabels = { 1: 'Best Investment', 2: 'Second Choice', 3: 'Third Choice' };
                    const rankCardColors = { 1: 'bg-green-50 border-green-200', 2: 'bg-blue-50 border-blue-200', 3: 'bg-orange-50 border-orange-200' };
                    
                    return (
                      <div key={property.id} className={`border-2 rounded-xl p-6 ${rankCardColors[rank] || 'bg-gray-50 border-gray-200'}`}>
                        <div className="text-center mb-6">
                          <div className={`inline-flex items-center justify-center w-12 h-12 ${rankColors[rank] || 'bg-gray-600'} text-white rounded-full text-lg font-bold mb-3`}>
                            {rankIcons[rank] || '🏆'}
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 mb-1">{property.bedrooms} bed {property.property_type.toLowerCase()}</h4>
                          <p className="text-sm text-gray-600 mb-2">{property.address}</p>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            assessment.grade === 'A' ? 'bg-green-100 text-green-800' :
                            assessment.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                            assessment.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            Grade {assessment.grade} - {assessment.score}/100
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-white rounded-lg border">
                              <p className="text-sm text-gray-600">Price</p>
                              <p className="text-lg font-bold text-gray-900">{formatPrice(property.price)}</p>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg border">
                              <p className="text-sm text-gray-600">Yield</p>
                              <p className="text-lg font-bold text-green-600">{metrics.yield.toFixed(1)}%</p>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg border">
                              <p className="text-sm text-gray-600">ROI</p>
                              <p className="text-lg font-bold text-blue-600">{metrics.roi.toFixed(1)}%</p>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg border">
                              <p className="text-sm text-gray-600">Total Investment</p>
                              <p className="text-lg font-bold text-purple-600">{formatPrice(metrics.totalInvestment)}</p>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg border p-4">
                            <h5 className="font-semibold text-gray-900 mb-3">Investment Breakdown</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between"><span>Purchase Price:</span><span className="font-medium">{formatPrice(property.price)}</span></div>
                              <div className="flex justify-between"><span>Deposit (25%):</span><span className="font-medium">{formatPrice(metrics.deposit)}</span></div>
                              <div className="flex justify-between"><span>Refurbishment:</span><span className="font-medium">{formatPrice(metrics.refurbCost)}</span></div>
                              <div className="flex justify-between"><span>Stamp Duty:</span><span className="font-medium">{formatPrice(metrics.stampDuty)}</span></div>
                              <div className="flex justify-between"><span>Legal & Survey:</span><span className="font-medium">{formatPrice(metrics.legalFees + metrics.surveyFees)}</span></div>
                              <div className="flex justify-between"><span>Mortgage Fees:</span><span className="font-medium">{formatPrice(metrics.mortgageFees)}</span></div>
                              <div className="flex justify-between"><span>Other Fees:</span><span className="font-medium">{formatPrice(metrics.landRegistryFees + metrics.searchesFees + metrics.gasSafetyCertificate + metrics.electricalSafetyCertificate + metrics.energyPerformanceCertificate + metrics.fireSafetyAssessment + metrics.legionellaRiskAssessment + metrics.asbestosSurvey + metrics.landlordInsurance + metrics.furnitureAndAppliances + metrics.marketingAndLettingFees + metrics.contingencyFund)}</span></div>
                              <div className="border-t pt-2 flex justify-between font-semibold"><span>Total Investment:</span><span className="text-blue-600">{formatPrice(metrics.totalInvestment)}</span></div>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg border p-4">
                            <h5 className="font-semibold text-gray-900 mb-3">Rental Analysis</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between"><span>Monthly Rent:</span><span className="font-medium">{formatPrice(metrics.rentalEstimate)}</span></div>
                              <div className="flex justify-between"><span>Monthly Mortgage:</span><span className="font-medium text-red-600">{formatPrice(metrics.monthlyMortgagePayment)}</span></div>
                              <div className="flex justify-between"><span>Monthly Profit:</span><span className={`font-medium ${metrics.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatPrice(metrics.monthlyProfit)}</span></div>
                              <div className="flex justify-between"><span>Mortgage Type:</span><span className="font-medium text-blue-600 capitalize">{metrics.mortgageType.replace('_', ' ')}</span></div>
                              <div className="flex justify-between"><span>Annual Profit:</span><span className="font-medium text-green-600">{formatPrice(metrics.annualProfit)}</span></div>
                              <div className="flex justify-between"><span>ROI:</span><span className="font-medium text-purple-600">{metrics.roi.toFixed(1)}%</span></div>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg border p-4">
                            <h5 className="font-semibold text-gray-900 mb-3">Why This Deal?</h5>
                            <div className="space-y-1">
                              {assessment.reasons.map((reason, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                  <span className="text-gray-700">{reason}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 