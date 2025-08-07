'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Home, 
  MapPin, 
  Calendar, 
  PoundSterling, 
  Percent, 
  Edit, 
  Trash2, 
  Plus,
  Eye,
  Calculator,
  FileText,
  Calendar as CalendarIcon,
  BuildingOffice,
  UserGroup,
  Cog,
  X
} from 'lucide-react';
import Image from 'next/image';
import { useUserTier } from '@/hooks/useUserTier';
import { useToast } from '@/hooks/useToast';

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
  monthlyExpenses?: number;
  
  // Enhanced fee management
  monthlyAgentFee?: number;
  monthlyInsurance?: number;
  annualInsurance?: number;
  oneOffFees?: any[];
  scheduledFees?: any[];
  
  // Renovation costs
  refurbishmentCosts?: { low: number; medium: number; high: number };
  selectedRefurbishmentLevel?: 'light' | 'medium' | 'high';
  actualRefurbishmentCost?: number;
  
  // Legal and setup costs
  stampDuty?: number;
  legalFees?: number;
  surveyFees?: number;
  mortgageFees?: number;
  landRegistryFees?: number;
  searchesFees?: number;
  gasSafetyCertificate?: number;
  electricalSafetyCertificate?: number;
  energyPerformanceCertificate?: number;
  fireSafetyAssessment?: number;
  legionellaRiskAssessment?: number;
  asbestosSurvey?: number;
  landlordInsurance?: number;
  furnitureAndAppliances?: number;
  marketingAndLettingFees?: number;
  contingencyFund?: number;
  
  // Offer history
  offerHistory?: Array<{
    id: string;
    status: 'offer_made' | 'offer_accepted' | 'offer_rejected' | 'offer_withdrawn';
    amount: number;
    date: string;
    notes: string;
    outcome?: string;
  }>;
  
  // Tax and company structure
  isLtdCompany?: boolean;
  corporationTaxRate?: number;
  personalTaxRate?: number;
  directorLoanBalance?: number;
  directorLoanInterestRate?: number;
  
  // Calculated fields
  yield?: number;
  equity?: number;
  equityPercentage?: number;
  monthlyProfit?: number;
  totalProfit?: number;
  images?: string[];
}

const PortfolioTestPage = () => {
  const [portfolioProperties, setPortfolioProperties] = useState<PortfolioProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { userTier } = useUserTier();
  const { showToast } = useToast();

  // Demo data with enhanced information
  const demoProperties: PortfolioProperty[] = [
    {
      id: 'demo-1',
      address: '42 Maple Avenue, Newcastle upon Tyne',
      postcode: 'NE5 4PR',
      purchasePrice: 90000,
      currentValue: 110000,
      purchaseDate: '2023-03-15',
      propertyType: 'Semi-Detached House',
      bmvScore: 88,
      status: 'active',
      notes: 'Great potential for rental income. Needs some cosmetic updates.',
      monthlyRent: 1200,
      rentStartDate: '2023-04-01',
      mortgageBalance: 67500,
      mortgageType: 'repayment',
      mortgageRate: 4.2,
      monthlyMortgagePayment: 720,
      depositAmount: 22500,
      monthlyExpenses: 120,
      yield: 6.86,
      equity: 42500,
      equityPercentage: 38.64,
      monthlyProfit: 360,
      totalProfit: 20000,
      isLtdCompany: true,
      corporationTaxRate: 25,
      personalTaxRate: 40,
      directorLoanBalance: 50000,
      directorLoanInterestRate: 2.25,
      // Renovation costs
      refurbishmentCosts: { low: 12000, medium: 20000, high: 35000 },
      selectedRefurbishmentLevel: 'medium',
      actualRefurbishmentCost: 20000,
      // Legal and setup costs
      stampDuty: 6000,
      legalFees: 1500,
      surveyFees: 500,
      mortgageFees: 1000,
      landRegistryFees: 200,
      searchesFees: 300,
      gasSafetyCertificate: 80,
      electricalSafetyCertificate: 200,
      energyPerformanceCertificate: 80,
      fireSafetyAssessment: 150,
      legionellaRiskAssessment: 100,
      asbestosSurvey: 300,
      landlordInsurance: 300,
      furnitureAndAppliances: 2000,
      marketingAndLettingFees: 500,
      contingencyFund: 1000,
      // Offer history
      offerHistory: [
        {
          id: '1',
          status: 'offer_made',
          amount: 85000,
          date: '2023-03-10',
          notes: 'Initial offer below asking price'
        },
        {
          id: '2',
          status: 'offer_accepted',
          amount: 90000,
          date: '2023-03-25',
          notes: 'Final offer accepted after negotiation'
        }
      ],
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&crop=center']
    },
    {
      id: 'demo-2',
      address: '16 Lowbiggin, Newcastle upon Tyne',
      postcode: 'NE5 4PR',
      purchasePrice: 95000,
      currentValue: 128000,
      purchaseDate: '2024-06-28',
      propertyType: 'Semi-Detached House',
      bmvScore: 92,
      status: 'active',
      notes: 'Family home with great potential for capital growth. High-end rental market performing well.',
      monthlyRent: 1400,
      rentStartDate: '2024-07-01',
      mortgageBalance: 71250,
      mortgageType: 'repayment',
      mortgageRate: 4.2,
      monthlyMortgagePayment: 890,
      depositAmount: 23750,
      monthlyExpenses: 140,
      yield: 6.86,
      equity: 56750,
      equityPercentage: 44.34,
      monthlyProfit: 370,
      totalProfit: 33000,
      isLtdCompany: true,
      corporationTaxRate: 25,
      personalTaxRate: 40,
      directorLoanBalance: 75000,
      directorLoanInterestRate: 2.25,
      // Renovation costs
      refurbishmentCosts: { low: 15000, medium: 25000, high: 40000 },
      selectedRefurbishmentLevel: 'medium',
      actualRefurbishmentCost: 25000,
      // Legal and setup costs
      stampDuty: 7500,
      legalFees: 1500,
      surveyFees: 500,
      mortgageFees: 1000,
      landRegistryFees: 200,
      searchesFees: 300,
      gasSafetyCertificate: 80,
      electricalSafetyCertificate: 200,
      energyPerformanceCertificate: 80,
      fireSafetyAssessment: 150,
      legionellaRiskAssessment: 100,
      asbestosSurvey: 300,
      landlordInsurance: 300,
      furnitureAndAppliances: 2000,
      marketingAndLettingFees: 500,
      contingencyFund: 1000,
      // Offer history
      offerHistory: [
        {
          id: '1',
          status: 'offer_made',
          amount: 92000,
          date: '2024-06-20',
          notes: 'Initial offer below asking price'
        },
        {
          id: '2',
          status: 'offer_accepted',
          amount: 95000,
          date: '2024-06-25',
          notes: 'Final offer accepted after negotiation'
        }
      ],
      images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop&crop=center']
    }
  ];

  useEffect(() => {
    setPortfolioProperties(demoProperties);
    setIsLoading(false);
  }, []);

  const handleEditProperty = (propertyId: string) => {
    const property = portfolioProperties.find(p => p.id === propertyId);
    if (property) {
      setEditingProperty(propertyId);
      setEditForm({
        address: property.address,
        postcode: property.postcode,
        purchasePrice: property.purchasePrice,
        currentValue: property.currentValue,
        purchaseDate: property.purchaseDate,
        propertyType: property.propertyType,
        notes: property.notes,
        monthlyRent: property.monthlyRent,
        rentStartDate: property.rentStartDate,
        mortgageBalance: property.mortgageBalance,
        mortgageType: property.mortgageType,
        mortgageRate: property.mortgageRate,
        depositAmount: property.depositAmount,
        monthlyExpenses: property.monthlyExpenses,
        refurbishmentCosts: property.refurbishmentCosts,
        selectedRefurbishmentLevel: property.selectedRefurbishmentLevel,
        actualRefurbishmentCost: property.actualRefurbishmentCost,
        stampDuty: property.stampDuty,
        legalFees: property.legalFees,
        surveyFees: property.surveyFees,
        mortgageFees: property.mortgageFees,
        landRegistryFees: property.landRegistryFees,
        searchesFees: property.searchesFees,
        gasSafetyCertificate: property.gasSafetyCertificate,
        electricalSafetyCertificate: property.electricalSafetyCertificate,
        energyPerformanceCertificate: property.energyPerformanceCertificate,
        fireSafetyAssessment: property.fireSafetyAssessment,
        legionellaRiskAssessment: property.legionellaRiskAssessment,
        asbestosSurvey: property.asbestosSurvey,
        landlordInsurance: property.landlordInsurance,
        furnitureAndAppliances: property.furnitureAndAppliances,
        marketingAndLettingFees: property.marketingAndLettingFees,
        contingencyFund: property.contingencyFund,
        offerHistory: property.offerHistory || []
      });
    }
  };

  const handleSaveProperty = async () => {
    try {
      setPortfolioProperties(prev => prev.map(item => 
        item.id === editingProperty 
          ? { ...item, ...editForm }
          : item
      ));
      
      setEditingProperty(null);
      showToast('Property updated successfully!', 'success');
    } catch (error) {
      console.error('Error saving property:', error);
      showToast('Failed to save property', 'error');
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

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateGrowth = (current: number, purchase: number) => {
    return ((current - purchase) / purchase) * 100;
  };

  const getTotalInvested = (property: PortfolioProperty) => {
    let total = property.depositAmount || 0;
    
    // Add renovation costs
    const refurbishmentCost = property.actualRefurbishmentCost || 
                             property.refurbishmentCosts?.[property.selectedRefurbishmentLevel || 'medium'] || 0;
    total += refurbishmentCost;
    
    // Add legal and setup costs
    total += property.stampDuty || 0;
    total += property.legalFees || 0;
    total += property.surveyFees || 0;
    total += property.mortgageFees || 0;
    total += property.landRegistryFees || 0;
    total += property.searchesFees || 0;
    total += property.gasSafetyCertificate || 0;
    total += property.electricalSafetyCertificate || 0;
    total += property.energyPerformanceCertificate || 0;
    total += property.fireSafetyAssessment || 0;
    total += property.legionellaRiskAssessment || 0;
    total += property.asbestosSurvey || 0;
    total += property.landlordInsurance || 0;
    total += property.furnitureAndAppliances || 0;
    total += property.marketingAndLettingFees || 0;
    total += property.contingencyFund || 0;
    
    return total;
  };

  const filteredProperties = portfolioProperties.filter(property => {
    if (filterStatus !== 'all' && property.status !== filterStatus) return false;
    if (searchTerm && !property.address.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

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
                  Enhanced Portfolio Management
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight"
              >
                Investment Portfolio
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Enhanced Tracking & Analytics
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-gray-600 max-w-3xl mx-auto mb-12"
              >
                Track your property investments with comprehensive cost analysis, renovation tracking, and offer history management.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative max-w-screen-2xl w-[90vw] mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-2xl font-bold text-gray-900">{portfolioProperties.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(portfolioProperties.reduce((sum, p) => sum + p.currentValue, 0))}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <PoundSterling className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Invested</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(portfolioProperties.reduce((sum, p) => sum + getTotalInvested(p), 0))}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Calculator className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. ROI</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPercentage(
                      portfolioProperties.reduce((sum, p) => {
                        const totalInvested = getTotalInvested(p);
                        const totalReturn = p.currentValue + (p.monthlyProfit || 0) * 12;
                        return sum + ((totalReturn - totalInvested) / totalInvested) * 100;
                      }, 0) / Math.max(1, portfolioProperties.length)
                    )}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Percent className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Filters */}
        <section className="relative max-w-screen-2xl w-[90vw] mx-auto mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Properties</option>
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="watching">Watching</option>
                </select>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Cog className="w-4 h-4" />
                Advanced Filters
              </button>
            </div>
          </div>
        </section>

        {/* Properties Grid */}
        <section className="relative max-w-screen-2xl w-[90vw] mx-auto mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Property Image */}
                <div className="relative h-48 bg-gray-200">
                  {property.images && property.images.length > 0 ? (
                    <Image
                      src={property.images[0]}
                      alt={property.address}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Home className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      property.status === 'active' ? 'bg-green-100 text-green-800' :
                      property.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                    </span>
                  </div>

                  {/* Price Tag */}
                  <div className="absolute bottom-3 left-3">
                    <span className="px-3 py-1 bg-white rounded-lg text-lg font-bold text-gray-900 shadow-lg">
                      {formatPrice(property.currentValue)}
                    </span>
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{property.address}</h3>
                    <button
                      onClick={() => handleEditProperty(property.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{property.postcode}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{property.propertyType}</div>
                      <div className="text-xs text-gray-600">Type</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{formatPrice(property.purchasePrice)}</div>
                      <div className="text-xs text-gray-600">Purchase</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {formatPercentage(calculateGrowth(property.currentValue, property.purchasePrice))}
                      </div>
                      <div className="text-xs text-gray-600">Growth</div>
                    </div>
                  </div>

                  {/* Investment Metrics */}
                  {property.monthlyRent && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Monthly Rent:</span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatPrice(property.monthlyRent)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm font-medium text-gray-700">Yield:</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {formatPercentage(property.yield || 0)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Total Investment Breakdown */}
                  <div className="bg-purple-50 rounded-lg p-3 mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Total Investment:</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="font-medium text-purple-700">Deposit</div>
                        <div>{formatPrice(property.depositAmount || 0)}</div>
                      </div>
                      <div>
                        <div className="font-medium text-purple-700">Renovation</div>
                        <div>{formatPrice(property.actualRefurbishmentCost || 0)}</div>
                      </div>
                      <div>
                        <div className="font-medium text-purple-700">Legal & Setup</div>
                        <div>{formatPrice((property.stampDuty || 0) + (property.legalFees || 0) + (property.surveyFees || 0))}</div>
                      </div>
                      <div>
                        <div className="font-medium text-purple-700">Total</div>
                        <div className="font-bold">{formatPrice(getTotalInvested(property))}</div>
                      </div>
                    </div>
                  </div>

                  {/* Offer History */}
                  {property.offerHistory && property.offerHistory.length > 0 && (
                    <div className="bg-orange-50 rounded-lg p-3 mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Offer History:</div>
                      <div className="space-y-1">
                        {property.offerHistory.slice(-2).map((offer) => (
                          <div key={offer.id} className="flex justify-between items-center text-xs">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              offer.status === 'offer_accepted' ? 'bg-green-100 text-green-800' :
                              offer.status === 'offer_rejected' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {offer.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="font-medium">{formatPrice(offer.amount)}</span>
                            <span className="text-gray-600">{formatDate(offer.date)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProperty(property.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => window.open(`/property/${property.id}`, '_blank')}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Purchased: {formatDate(property.purchaseDate)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Edit Modal */}
      {editingProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Edit Property</h2>
                <button
                  onClick={() => setEditingProperty(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Value</label>
                  <input
                    type="number"
                    value={editForm.currentValue || ''}
                    onChange={(e) => setEditForm({ ...editForm, currentValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent</label>
                  <input
                    type="number"
                    value={editForm.monthlyRent || ''}
                    onChange={(e) => setEditForm({ ...editForm, monthlyRent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actual Refurbishment Cost</label>
                  <input
                    type="number"
                    value={editForm.actualRefurbishmentCost || ''}
                    onChange={(e) => setEditForm({ ...editForm, actualRefurbishmentCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setEditingProperty(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProperty}
                  className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PortfolioTestPage; 