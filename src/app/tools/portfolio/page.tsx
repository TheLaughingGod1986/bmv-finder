'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatPrice, formatDate, formatPercentage } from '@/lib/formatters';
import { Home, TrendingUp, PoundSterling, Calendar, Plus, Filter, BarChart3, Target, MapPin, Trash2, CheckCircle, Edit, DollarSign, Percent, Clock, RefreshCw, Eye, ChevronDown, ChevronUp, LineChart, Building2, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
import PropertyEditModal from '../../components/PropertyEditModal';
import SimplePropertyCard from '../../components/SimplePropertyCard';
import PropertyValuationCard from '../../components/PropertyValuationCard';
import AuthModal from '../../components/AuthModal';
import PropertyInputSelector from '../../components/PropertyInputSelector';

interface SearchResult {
  id: string;
  address: string;
  postcode: string;
  price: number;
  date: string;
  propertyType: string;
  bedrooms?: number;
  floorArea?: number;
  epcRating?: string;
  lastSaleDate?: string;
  lastSalePrice?: number;
  growthPeriod?: string;
  longTermGrowth?: number;
  longTermPeriod?: string;
  grossYield?: number;
  portfolioFit?: { diversification: number; riskLevel: string; potential: string };
  capitalGrowth?: number;
  currentValuation?: number;
  salesHistory?: Array<{ price: number; date: string; [key: string]: unknown }>;
  totalSales?: number;
  priceRange?: { min: number; max: number };
  [key: string]: unknown;
}

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
  mortgageType?: 'repayment' | 'interest_only' | string;
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
  oneOffFees?: Array<{
    description: string;
    amount: number;
    frequency?: string;
    [key: string]: unknown;
  }>;
  scheduledFees?: Array<{
    description: string;
    amount: number;
    frequency?: string;
    [key: string]: unknown;
  }>;
  
  // Renovation costs
  refurbishmentCosts?: { low: number; medium: number; high: number };
  selectedRefurbishmentLevel?: 'light' | 'medium' | 'high' | string;
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
  otherCosts?: number;
  
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

// Demo data for unauthenticated users
const demoPortfolioData: PortfolioProperty[] = [
  {
    id: '1',
    address: '16 Lowbiggin',
    postcode: 'NE5 4PR',
    purchasePrice: 95000,
    currentValue: 117434,
    purchaseDate: '2023-01-15',
    propertyType: 'House',
    bmvScore: 75,
    status: 'active',
    monthlyRent: 1050,
    mortgageBalance: 76000,
    monthlyMortgagePayment: 380,
    depositAmount: 19000,
    monthlyExpenses: 150,
    yield: 8.1,
    equity: 41434, // This will be calculated as currentValue - mortgageBalance
    equityPercentage: 35.3, // This will be calculated as equity / currentValue
    monthlyProfit: 520,
    totalProfit: 22434,
    actualRefurbishmentCost: 15000,
    legalFees: 2500,
    stampDuty: 2850,
    otherCosts: 1000
  },
  {
    id: '2',
    address: '71 Belgrave Road',
    postcode: 'SS9 5EL',
    purchasePrice: 455000,
    currentValue: 455000,
    purchaseDate: '2022-06-11',
    propertyType: 'House',
    bmvScore: 82,
    status: 'active',
    monthlyRent: 3900,
    mortgageBalance: 364000,
    monthlyMortgagePayment: 1820,
    depositAmount: 91000,
    monthlyExpenses: 300,
    yield: 10.9,
    equity: 91000,
    equityPercentage: 20.0,
    monthlyProfit: 1780,
    totalProfit: 0,
    actualRefurbishmentCost: 25000,
    legalFees: 4000,
    stampDuty: 13750,
    otherCosts: 2000
  }
];

export default function PortfolioTrackerPage() {
  const [user, setUser] = useState<any>(null);
  const [portfolioProperties, setPortfolioProperties] = useState<PortfolioProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PortfolioProperty | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'sold' | 'watching' | 'watchlist'>('all');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showAllYears, setShowAllYears] = useState(false);
  const [showPropertySearch, setShowPropertySearch] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'discovery' | 'manual'>('discovery');
  const [discoveryLimit, setDiscoveryLimit] = useState(100);
  const [manualPropertyData, setManualPropertyData] = useState({
    address: '',
    postcode: '',
    purchasePrice: '',
    currentValue: '',
    monthlyRent: '',
    depositAmount: '',
    purchaseDate: ''
  });
  const router = useRouter();

  // Load demo data and calculate derived values
  useEffect(() => {
    console.log('Loading demo data...');
    console.log('Demo data:', demoPortfolioData);
    setPortfolioProperties([...demoPortfolioData]);
    setIsLoading(false);
  }, []);

  // Postcode formatting function
  const formatPostcode = (input: string): string => {
    if (!input) return '';
    let cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned.length > 3) {
      return cleaned.slice(0, -3).trim() + ' ' + cleaned.slice(-3);
    }
    return cleaned;
  };

  // Helper functions
  const getTotalValue = () => portfolioProperties.reduce((sum, p) => sum + (p.currentValue || 0), 0);
  const getTotalGrowth = () => portfolioProperties.reduce((sum, p) => sum + ((p.currentValue || 0) - (p.purchasePrice || 0)), 0);
  
  // Calculate equity as current value minus mortgage balance
  const getTotalEquity = () => portfolioProperties.reduce((sum, p) => 
    sum + ((p.currentValue || 0) - (p.mortgageBalance || 0)), 0
  );
  
  // Calculate ROI based on capital growth only (not including rental income)
  const getTotalROI = () => {
    const totalInvested = getTotalInvested();
    if (totalInvested === 0) return 0;
    return (getTotalGrowth() / totalInvested) * 100;
  };
  
  // Calculate average yield across all properties
  const getAverageYield = () => {
    const propertiesWithRent = portfolioProperties.filter(p => p.monthlyRent && p.currentValue);
    if (propertiesWithRent.length === 0) return 0;
    
    const totalYield = propertiesWithRent.reduce((sum, p) => {
      const annualRent = (p.monthlyRent || 0) * 12;
      const rentalYield = (annualRent / p.currentValue) * 100;
      return sum + rentalYield;
    }, 0);
    
    return totalYield / propertiesWithRent.length;
  };

  // Calculate investment quality score (0-100) based on multiple factors
  const getInvestmentQualityScore = (property: PortfolioProperty) => {
    let score = 0;
    
    // Capital growth score (0-40 points)
    if (property.currentValue && property.purchasePrice) {
      const growthRate = ((property.currentValue - property.purchasePrice) / property.purchasePrice) * 100;
      if (growthRate >= 20) score += 40; // 20%+ growth
      else if (growthRate >= 15) score += 35; // 15-19% growth
      else if (growthRate >= 10) score += 30; // 10-14% growth
      else if (growthRate >= 5) score += 25; // 5-9% growth
      else if (growthRate >= 0) score += 15; // 0-4% growth
      else score += 5; // Negative growth (still some points for having data)
    }
    
    // Rental yield score (0-30 points)
    if (property.monthlyRent && property.currentValue) {
      const annualYield = ((property.monthlyRent * 12) / property.currentValue) * 100;
      if (annualYield >= 8) score += 30; // 8%+ yield
      else if (annualYield >= 6) score += 25; // 6-7.9% yield
      else if (annualYield >= 4) score += 20; // 4-5.9% yield
      else if (annualYield >= 2) score += 10; // 2-3.9% yield
      else score += 5; // 0-1.9% yield
    }
    
    // Cash flow score (0-20 points)
    if (property.monthlyRent && property.monthlyMortgagePayment) {
      const cashFlow = property.monthlyRent - property.monthlyMortgagePayment;
      if (cashFlow >= 500) score += 20; // £500+ positive cash flow
      else if (cashFlow >= 200) score += 15; // £200-499 positive cash flow
      else if (cashFlow >= 0) score += 10; // £0-199 positive cash flow
      else if (cashFlow >= -200) score += 5; // £0 to -£199 (small negative)
      else score += 0; // £200+ negative cash flow
    }
    
    // Property age score (0-10 points) - newer properties get bonus points
    if (property.purchaseDate) {
      const purchaseYear = new Date(property.purchaseDate).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - purchaseYear;
      if (age <= 2) score += 10; // 0-2 years
      else if (age <= 5) score += 8; // 3-5 years
      else if (age <= 10) score += 5; // 6-10 years
      else score += 2; // 10+ years
    }
    
    return Math.min(100, Math.max(0, Math.round(score)));
  };

  // Get investment quality label based on score
  const getInvestmentQualityLabel = (score: number) => {
    if (score >= 90) return { label: 'Exceptional', color: 'text-emerald-600', bg: 'bg-emerald-100' };
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 70) return { label: 'Very Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 60) return { label: 'Good', color: 'text-amber-600', bg: 'bg-amber-100' };
    if (score >= 50) return { label: 'Average', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (score >= 40) return { label: 'Below Average', color: 'text-red-600', bg: 'bg-red-100' };
    return { label: 'Poor', color: 'text-red-700', bg: 'bg-red-200' };
  };
  
  const getTotalRentalProfits = () => portfolioProperties.reduce((sum, p) => sum + ((p.monthlyRent || 0) * 12), 0);
  const getTotalYearlyTurnover = () => portfolioProperties.reduce((sum, p) => sum + ((p.monthlyRent || 0) * 12), 0);
  
  const getPercentageOwned = () => {
    const totalValue = getTotalValue();
    if (totalValue === 0) return 0;
    return (getTotalEquity() / totalValue) * 100;
  };
  
  const getTotalInvested = () => portfolioProperties.reduce((sum, p) => 
    sum + (p.depositAmount || 0) + (p.actualRefurbishmentCost || 0) + (p.legalFees || 0) + (p.stampDuty || 0) + (p.otherCosts || 0), 0
  );
  
  // Net profit should be capital growth minus additional costs (renovation, legal, etc.)
  const getNetProfit = () => {
    const totalGrowth = getTotalGrowth();
    const additionalCosts = portfolioProperties.reduce((sum, p) => 
      sum + (p.actualRefurbishmentCost || 0) + (p.legalFees || 0) + (p.stampDuty || 0) + (p.otherCosts || 0), 0
    );
    return totalGrowth - additionalCosts;
  };
  
  // Calculate monthly cash flow (rental income minus mortgage payments and expenses)
  const getMonthlyCashFlow = () => {
    return portfolioProperties.reduce((sum, p) => 
      sum + (p.monthlyRent || 0) - (p.monthlyMortgagePayment || 0) - (p.monthlyExpenses || 0), 0
    );
  };

  // Chart data generation functions
  const getPortfolioPerformanceData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    // Generate historical data based on current values
    const baseValue = 95000; // Starting purchase price
    const growthRate = 0.02; // 2% monthly growth
    const monthlyValues = months.map((month, index) => {
      const monthsSincePurchase = index + 1;
      return baseValue * Math.pow(1 + growthRate, monthsSincePurchase);
    });

    const currentValue = getTotalValue();
    const finalValues = months.map((month, index) => {
      if (index === months.length - 1) return currentValue;
      return monthlyValues[index];
    });

    return {
      labels: months,
      datasets: [
        {
          label: 'Portfolio Value',
          data: finalValues,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Capital Growth',
          data: finalValues.map(value => value - baseValue),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: false,
          tension: 0.4
        }
      ]
    };
  };

  const getCashFlowData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
      labels: months,
      datasets: [
        {
          label: 'Rental Income',
          data: months.map(() => getTotalRentalProfits() / 12),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1
        },
        {
          label: 'Total Expenses',
          data: months.map(() => {
            const totalMortgage = portfolioProperties.reduce((sum, p) => sum + (p.monthlyMortgagePayment || 0), 0);
            const totalExpenses = portfolioProperties.reduce((sum, p) => sum + (p.monthlyExpenses || 0), 0);
            return totalMortgage + totalExpenses;
          }),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1
        }
      ]
    };
  };

  const getPropertyComparisonData = () => {
    const properties = portfolioProperties.filter(p => p.currentValue && p.purchasePrice);
    
    return {
      labels: properties.map(p => p.address.split(' ')[0]),
      datasets: [
        {
          label: 'Capital Growth %',
          data: properties.map(p => ((p.currentValue - p.purchasePrice) / p.purchasePrice) * 100),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        },
        {
          label: 'Yield %',
          data: properties.map(p => p.monthlyRent ? ((p.monthlyRent * 12) / p.currentValue) * 100 : 0),
          backgroundColor: 'rgba(168, 85, 247, 0.8)',
          borderColor: 'rgb(168, 85, 247)',
          borderWidth: 1
        }
      ]
    };
  };

  const getFutureValuePrediction = (property: PortfolioProperty) => {
    const currentValue = property.currentValue || 0;
    const purchasePrice = property.purchasePrice || 0;
    const monthsOwned = Math.max(1, (new Date().getTime() - new Date(property.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    // Calculate historical growth rate
    const historicalGrowthRate = Math.pow(currentValue / purchasePrice, 1 / monthsOwned) - 1;
    
    // Project future values (conservative estimate)
    const conservativeGrowthRate = historicalGrowthRate * 0.7; // 70% of historical rate
    
    const futureValues = [1, 3, 6, 12, 24].map(monthsAhead => 
      currentValue * Math.pow(1 + conservativeGrowthRate, monthsAhead)
    );
    
    return {
      labels: ['1 month', '3 months', '6 months', '1 year', '2 years'],
      datasets: [{
        label: 'Predicted Value',
        data: futureValues,
        borderColor: 'rgb(251, 191, 36)',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };
  };

  const filteredProperties = portfolioProperties.filter(property => {
    if (filterStatus === 'all') return true;
    return property.status === filterStatus;
  });


  const handleEditProperty = (property: PortfolioProperty) => {
    setEditingProperty(property);
    setIsEditModalOpen(true);
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      // Update property values from the latest API data
      const updatedProperties = await Promise.all(
        portfolioProperties.map(async (property) => {
          try {
            // Extract house number from address
            const addressParts = property.address.split(' ');
            const houseNumber = addressParts[0];
            
            // Call the property valuation API for each property
            const response = await fetch(`/api/property-valuation?type=comprehensive&postcode=${encodeURIComponent(property.postcode)}&number=${encodeURIComponent(houseNumber)}`);
            
            if (response.ok) {
              const data = await response.json();
              
              if (data.success && data.data?.marketAnalysis?.averagePrice) {
                const updatedProperty = {
                  ...property,
                  currentValue: data.data.marketAnalysis.averagePrice
                };
                
                // Recalculate equity and equity percentage
                updatedProperty.equity = updatedProperty.currentValue - (updatedProperty.mortgageBalance || 0);
                updatedProperty.equityPercentage = updatedProperty.currentValue ? 
                  ((updatedProperty.equity / updatedProperty.currentValue) * 100) : 0;
                
                return updatedProperty;
              }
            }
          } catch (error) {
            console.error(`Failed to update ${property.address}:`, error);
          }
          return property; // Return unchanged if update failed
        })
      );
      
      setPortfolioProperties(updatedProperties);
      alert('Property values updated from latest market data!');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      alert('Failed to refresh data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePropertySelect = (property: SearchResult) => {
    // Handle property selection from search
    console.log('Property selected:', property);
    setShowPropertySearch(false);
    // You can add logic here to add the property to portfolio or show details
  };

  const handlePropertyInput = (property: SearchResult) => {
    // Handle manual property input
    console.log('Property input:', property);
    setShowPropertySearch(false);
    // You can add logic here to add the property to portfolio
  };

      const handlePropertyDiscovery = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // First, get the basic property list (same as deal analysis)
      const searchResponse = await fetch(`/api/portfolio/discover?postcode=${encodeURIComponent(searchQuery.trim())}&limit=${discoveryLimit}`);
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        
        if (searchData.success && searchData.data?.properties && searchData.data.properties.length > 0) {
          // Now get comprehensive data for each property (same as deal analysis)
          const enrichedProperties = await Promise.all(
            searchData.data.properties.slice(0, 10).map(async (prop: SearchResult, index: number) => {
              // Add small delay to prevent rate limiting
              if (index > 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
              
              try {
                // Extract house number from address
                const addressParts = prop.address.split(' ');
                const addressNumber = addressParts[0];
                
                // Log the basic property data we received
                console.log(`Basic property data for ${prop.address}:`, {
                  lastSalePrice: prop.lastSalePrice,
                  lastSaleDate: prop.lastSaleDate,
                  totalSales: prop.totalSales,
                  currentValuation: prop.currentValuation,
                  capitalGrowth: prop.capitalGrowth
                });
                
                // Call the same API as deal analysis page
                const valuationResponse = await fetch(`/api/property-valuation?type=comprehensive&postcode=${encodeURIComponent(prop.postcode)}&number=${addressNumber}`);
                
                if (valuationResponse.ok) {
                  const valuationData = await valuationResponse.json();
                  const marketAnalysis = valuationData.data?.marketAnalysis;
                  const comparables = valuationData.data?.comparables;
                  
                  // Extract the house number more reliably
                  const houseNumber = addressNumber.replace(/[^\d]/g, ''); // Remove non-digits
                  
                  // Debug logging
                  console.log(`Processing property ${prop.address}:`, {
                    houseNumber,
                    totalComparables: comparables?.length || 0,
                    sampleComparables: comparables?.slice(0, 3).map(c => ({ address: c.address, price: c.price, date: c.date })) || []
                  });
                  
                  // Calculate property-specific sales count by filtering comparables to this property
                  let propertySpecificSales = 0;
                  let lastPurchasePrice = 0;
                  let lastPurchaseDate = 'N/A';
                  let growthPercentage = 0; // Declare here to fix linter error
                  
                  if (comparables && comparables.length > 0) {
                    // Filter comparables to only include sales of this specific property number
                    // Handle different address formats: "16", "16 Lowbiggin", "16, Lowbiggin", etc.
                    const propertySales = comparables.filter((sale: { price: number; date: string; address: string; [key: string]: unknown }) => {
                      const saleAddress = sale.address || '';
                      const saleNumber = saleAddress.replace(/[^\d]/g, ''); // Extract just the number
                      
                      // Match by house number
                      if (saleNumber === houseNumber) {
                        return true;
                      }
                      
                      // Also check if the full address contains the house number
                      if (saleAddress.includes(houseNumber)) {
                        return true;
                      }
                      
                      return false;
                    });
                    
                    console.log(`Property ${prop.address} matched sales:`, propertySales.length, propertySales.map(s => ({ address: s.address, price: s.price, date: s.date })));
                    
                    propertySpecificSales = propertySales.length;
                    
                    // Get the most recent sale for this property as the last purchase price
                    if (propertySales.length > 0) {
                      const sortedSales = propertySales.sort((a: { date: string; [key: string]: unknown }, b: { date: string; [key: string]: unknown }) => 
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                      );
                      lastPurchasePrice = sortedSales[0].price;
                      lastPurchaseDate = sortedSales[0].date;
                    }
                  }
                  
                  // If no property-specific sales found, check if the basic property data has sales info
                  if (propertySpecificSales === 0) {
                    // Check if the basic property data has sales information
                    if (prop.lastSalePrice && prop.lastSalePrice > 0) {
                      propertySpecificSales = 1; // At least one sale
                      lastPurchasePrice = prop.lastSalePrice;
                      lastPurchaseDate = prop.lastSaleDate || 'N/A';
                      console.log(`Using fallback data for ${prop.address}:`, { lastPurchasePrice, lastPurchaseDate });
                    } else {
                      // Property genuinely has no sales history
                      propertySpecificSales = 0;
                      lastPurchasePrice = 0;
                      lastPurchaseDate = 'N/A';
                      console.log(`Property ${prop.address} has no sales history - this is normal for some properties`);
                      
                      // For properties with no sales, we can't calculate growth, so use market data
                      if (marketAnalysis?.yoyGrowth !== undefined) {
                        growthPercentage = marketAnalysis.yoyGrowth * 100;
                        console.log(`Using market growth for ${prop.address}: ${growthPercentage}%`);
                      }
                    }
                  }
                  
                  // Calculate proper growth percentage
                  if (lastPurchasePrice > 0 && marketAnalysis?.averagePrice > 0) {
                    growthPercentage = ((marketAnalysis.averagePrice - lastPurchasePrice) / lastPurchasePrice) * 100;
                  } else if (prop.capitalGrowth !== undefined && prop.capitalGrowth !== 0) {
                    growthPercentage = prop.capitalGrowth;
                  } else if (marketAnalysis?.yoyGrowth !== undefined) {
                    // Use market-level growth if no property-specific data
                    growthPercentage = marketAnalysis.yoyGrowth * 100;
                  }
                  
                  // Ensure growth is a reasonable number (not -124.2%)
                  if (growthPercentage < -100 || growthPercentage > 1000) {
                    console.warn(`Unrealistic growth percentage for ${prop.address}: ${growthPercentage}%, using market growth instead`);
                    growthPercentage = marketAnalysis?.yoyGrowth ? marketAnalysis.yoyGrowth * 100 : 0;
                  }
                  
                  return {
                    id: prop.id || `prop-${Date.now()}-${Math.random()}`,
                    address: prop.address,
                    postcode: prop.postcode,
                    propertyType: prop.propertyType || 'Unknown',
                    bedrooms: prop.bedrooms || 0,
                    floorArea: prop.floorArea || 0,
                    epcRating: prop.epcRating || 'Unknown',
                    lastSaleDate: lastPurchaseDate,
                    growthPeriod: prop.growthPeriod || 'N/A',
                    longTermGrowth: prop.longTermGrowth || 0,
                    longTermPeriod: prop.longTermPeriod || 'N/A',
                    grossYield: prop.grossYield || 0,
                    portfolioFit: prop.portfolioFit || { diversification: 0, riskLevel: 'N/A', potential: 'N/A' },
                    capitalGrowth: growthPercentage,
                    lastSalePrice: lastPurchasePrice,
                    currentValuation: marketAnalysis?.averagePrice || prop.currentValuation || 0,
                    salesHistory: comparables || prop.salesHistory || [],
                    totalSales: propertySpecificSales,
                    priceRange: { 
                      min: comparables && comparables.length > 0 ? Math.min(...comparables.map(c => c.price)) : 0,
                      max: comparables && comparables.length > 0 ? Math.max(...comparables.map(c => c.price)) : 0
                    },
                    marketAnalysis: marketAnalysis
                  };
                } else {
                  // Fallback to basic data if comprehensive API fails
                  console.log(`Comprehensive API failed for ${prop.address}, using basic data`);
                  return {
                    id: prop.id || `prop-${Date.now()}-${Math.random()}`,
                    address: prop.address,
                    postcode: prop.postcode,
                    propertyType: prop.propertyType || 'Unknown',
                    bedrooms: prop.bedrooms || 0,
                    floorArea: prop.floorArea || 0,
                    epcRating: prop.epcRating || 'Unknown',
                    lastSaleDate: prop.lastSaleDate || 'N/A',
                    growthPeriod: prop.growthPeriod || 'N/A',
                    longTermGrowth: prop.longTermGrowth || 0,
                    longTermPeriod: prop.longTermPeriod || 'N/A',
                    grossYield: prop.grossYield || 0,
                    portfolioFit: prop.portfolioFit || { diversification: 0, riskLevel: 'N/A', potential: 'N/A' },
                    capitalGrowth: prop.capitalGrowth || 0,
                    lastSalePrice: prop.lastSalePrice || 0,
                    currentValuation: prop.currentValuation || 0,
                    salesHistory: prop.salesHistory || [],
                    totalSales: prop.totalSales || 0,
                    priceRange: prop.priceRange || { min: 0, max: 0 },
                    marketAnalysis: null
                  };
                }
              } catch (error) {
                console.error('Error enriching property:', prop.address, error);
                // Return basic data if enrichment fails
                return {
                  id: prop.id || `prop-${Date.now()}-${Math.random()}`,
                  address: prop.address,
                  postcode: prop.postcode,
                  propertyType: prop.propertyType || 'Unknown',
                  bedrooms: prop.bedrooms || 0,
                  floorArea: prop.floorArea || 0,
                  epcRating: prop.epcRating || 'Unknown',
                  lastSaleDate: prop.lastSaleDate || 'N/A',
                  growthPeriod: prop.growthPeriod || 'N/A',
                  longTermGrowth: prop.longTermGrowth || 0,
                  longTermPeriod: prop.longTermPeriod || 'N/A',
                  grossYield: prop.grossYield || 0,
                  portfolioFit: prop.portfolioFit || { diversification: 0, riskLevel: 'N/A', potential: 'N/A' },
                  capitalGrowth: prop.capitalGrowth || 0,
                  lastSalePrice: prop.lastSalePrice || 0,
                  currentValuation: prop.currentValuation || 0,
                  salesHistory: prop.salesHistory || [],
                  totalSales: prop.totalSales || 0,
                  priceRange: prop.priceRange || { min: 0, max: 0 },
                  marketAnalysis: null
                };
              }
            })
          );
          
          setSearchResults(enrichedProperties);
        } else {
          setSearchResults([]);
        }
      } else {
        console.error('Search failed:', searchResponse.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Discovery error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddPropertyFromSearch = (property: SearchResult) => {
    // Use comprehensive data from the same API as deal analysis
    const purchasePrice = property.lastSalePrice || property.currentValuation || 250000;
    const currentValue = property.currentValuation || property.lastSalePrice || 275000;
    
    const newProperty: PortfolioProperty = {
      id: Date.now().toString(),
      address: property.address,
      postcode: property.postcode,
      purchasePrice: purchasePrice,
      currentValue: currentValue,
      purchaseDate: new Date().toISOString().split('T')[0],
      propertyType: property.propertyType || 'semi-detached',
      bmvScore: 75, // Default BMV score
      status: 'active',
      monthlyRent: 1200, // Default value
      mortgageBalance: 0,
      monthlyMortgagePayment: 0,
      depositAmount: Math.round(purchasePrice * 0.2), // Default 20% deposit
      monthlyExpenses: 150, // Default monthly expenses
      yield: 0, // Will be calculated
      equity: 0, // Will be calculated
      equityPercentage: 0, // Will be calculated
      monthlyProfit: 0, // Will be calculated
      totalProfit: 0, // Will be calculated
      actualRefurbishmentCost: 0,
      legalFees: 2500, // Default legal fees
      stampDuty: 0, // Will be calculated based on purchase price
      otherCosts: 1000 // Default other costs
    };
    
    setPortfolioProperties(prev => [...prev, newProperty]);
    setSearchResults([]);
    setSearchQuery('');
    setShowPropertySearch(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Investment <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Portfolio</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Track your property investments, monitor performance, and analyze returns with real-time market data and comprehensive financial insights.
            </p>
            
            {/* Action Button */}
            <div className="flex justify-center mb-8">
              <button
                onClick={() => {
                  setShowPropertySearch(!showPropertySearch);
                  if (!showPropertySearch) {
                    // Smooth scroll to top when opening the form
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-lg"
              >
                <Plus className="w-6 h-6" />
                {showPropertySearch ? 'Hide Property Form' : 'Add New Property'}
              </button>
            </div>

            {/* Property Search & Add Form */}
            {showPropertySearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Property to Portfolio</h2>
                    <p className="text-gray-600">Search and discover properties to add directly to your portfolio</p>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex justify-center">
                    <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-lg border border-gray-200">
                      <button
                        onClick={() => setActiveTab('discovery')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          activeTab === 'discovery'
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Target className="h-4 w-4" />
                        Property Search
                      </button>
                      <button
                        onClick={() => setActiveTab('manual')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          activeTab === 'manual'
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Plus className="h-4 w-4" />
                        Manual Input
                      </button>
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="space-y-6">
                    {/* Property Discovery Tab */}
                    {activeTab === 'discovery' && (
                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="mb-6">
                          <h3 className="flex items-center gap-3 text-xl font-semibold text-gray-900 mb-2">
                            <Target className="h-6 w-6 text-blue-600" />
                            Property Search & Discovery
                          </h3>
                          <p className="text-base text-gray-600 leading-relaxed">
                            Search and discover properties with comprehensive investment analysis, EPC insights, and market trends
                          </p>
                        </div>
                        
                        {/* Search Input Row */}
                        <div className="flex items-end gap-4 mb-6">
                          <div className="flex-1">
                            <label htmlFor="discovery-postcode" className="block text-sm font-semibold text-gray-700 mb-2">
                              Enter Postcode
                            </label>
                            <input
                              id="discovery-postcode"
                              type="text"
                              placeholder="e.g., NE5 4PR"
                              value={searchQuery}
                              onChange={(e) => {
                                const rawValue = e.target.value;
                                const formatted = formatPostcode(rawValue);
                                setSearchQuery(formatted);
                              }}
                              onKeyPress={(e) => e.key === 'Enter' && handlePropertyDiscovery()}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          
                          <div className="flex items-end gap-3">
                            <div>
                              <label htmlFor="discovery-limit" className="block text-sm font-semibold text-gray-700 mb-2">
                                Max Results
                              </label>
                              <input
                                id="discovery-limit"
                                type="number"
                                value={discoveryLimit}
                                onChange={(e) => setDiscoveryLimit(parseInt(e.target.value) || 100)}
                                min="1"
                                max="500"
                                className="w-24 px-3 py-3 text-center border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              />
                            </div>
                            
                            <button 
                              onClick={handlePropertyDiscovery}
                              disabled={isSearching || !searchQuery.trim()}
                              className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSearching ? (
                                <>
                                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                  Searching...
                                </>
                              ) : (
                                <>
                                  <Search className="h-5 w-5 mr-3" />
                                  Discover
                                </>
                              )}
                            </button>
                          </div>
                        </div>



                        {/* Search Results */}
                        {searchResults.length > 0 && (
                          <div className="mb-6">
                            <div className="text-base text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-xl border border-blue-100 mb-4">
                              Found <span className="font-bold text-blue-700">{searchResults.length}</span> properties
                              {searchResults.length === discoveryLimit && (
                                <span className="text-gray-500 ml-3">
                                  (showing max results - increase limit to see more)
                                </span>
                              )}
                            </div>
                            
                            {/* Data Enrichment Info */}
                            <div className="text-sm text-gray-600 bg-amber-50 px-4 py-3 rounded-xl border border-amber-100 mb-4">
                              <div className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                                <div>
                                  <div className="font-medium text-amber-800">Data Enrichment in Progress</div>
                                  <div className="text-amber-700 mt-1">
                                    Properties are being enriched with sales history, valuations, and market analysis. 
                                    Financial metrics will appear as data becomes available. You can still add properties to your portfolio.
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              {searchResults.map((property, index) => (
                                <div key={property.id || index} className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 overflow-hidden">
                                  {/* Header Section - Address & Sales Badge */}
                                  <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-lg font-bold text-gray-900 truncate">{property.address}</h4>
                                        <p className="text-sm text-gray-600">{property.postcode}</p>
                                      </div>
                                      <div className="ml-3 flex-shrink-0">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                          {property.totalSales || 0} sale{(property.totalSales || 0) !== 1 ? 's' : ''}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Property Details Row - Compact */}
                                  <div className="px-4 py-3 border-b border-gray-100">
                                    <div className="flex items-center gap-4 text-sm">
                                      <div className="flex items-center gap-1.5">
                                        <Building2 className="h-4 w-4 text-gray-500" />
                                        <span className="text-gray-700">{property.propertyType || 'Unknown'}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                        <span className="text-gray-700">{property.bedrooms || 0} beds</span>
                                      </div>
                                      {property.floorArea > 0 && (
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                          <span className="text-gray-700">{property.floorArea}m²</span>
                                        </div>
                                      )}
                                      {property.epcRating && property.epcRating !== 'Unknown' && (
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                          <span className="text-gray-700">EPC {property.epcRating}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Investment Metrics */}
                                  <div className="px-4 py-3 bg-gray-50">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Current Value</span>
                                          <span className="text-sm font-bold text-emerald-600">
                                            £{(property.currentValuation || 0).toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Last Sale</span>
                                          <span className="text-sm font-bold text-blue-600">
                                            £{(property.lastSalePrice || 0).toLocaleString()}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Growth</span>
                                          <span className={`text-sm font-bold ${
                                            (property.capitalGrowth || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                          }`}>
                                            {(property.capitalGrowth || 0) >= 0 ? '+' : ''}{(property.capitalGrowth || 0).toFixed(1)}%
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Sales</span>
                                          <span className="text-sm font-bold text-gray-700">
                                            {property.totalSales || 0}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="px-4 py-3 bg-gray-25 border-t border-gray-100">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleAddPropertyFromSearch(property)}
                                        className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm"
                                      >
                                        <Plus className="h-5 w-5" />
                                        Add to Portfolio
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Manual Input Tab */}
                    {activeTab === 'manual' && (
                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="mb-6">
                          <h3 className="flex items-center gap-3 text-xl font-semibold text-gray-900 mb-2">
                            <Plus className="h-6 w-6 text-blue-600" />
                            Manual Property Input
                          </h3>
                          <p className="text-base text-gray-600 leading-relaxed">
                            Add a property manually with your own details and investment information
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <input
                              type="text"
                              placeholder="123 Main Street"
                              value={manualPropertyData.address}
                              onChange={(e) => setManualPropertyData(prev => ({ ...prev, address: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                            <input
                              type="text"
                              placeholder="NE5 4PR"
                              value={manualPropertyData.postcode}
                              onChange={(e) => setManualPropertyData(prev => ({ ...prev, postcode: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (£)</label>
                            <input
                              type="number"
                              placeholder="250000"
                              value={manualPropertyData.purchasePrice}
                              onChange={(e) => setManualPropertyData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Value (£)</label>
                            <input
                              type="number"
                              placeholder="275000"
                              value={manualPropertyData.currentValue}
                              onChange={(e) => setManualPropertyData(prev => ({ ...prev, currentValue: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (£)</label>
                            <input
                              type="number"
                              placeholder="1200"
                              value={manualPropertyData.monthlyRent}
                              onChange={(e) => setManualPropertyData(prev => ({ ...prev, monthlyRent: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount (£)</label>
                            <input
                              type="number"
                              placeholder="19000"
                              value={manualPropertyData.depositAmount}
                              onChange={(e) => setManualPropertyData(prev => ({ ...prev, depositAmount: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                            <input
                              type="date"
                              value={manualPropertyData.purchaseDate}
                              onChange={(e) => setManualPropertyData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                          <button
                            onClick={() => setShowPropertySearch(false)}
                            className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              const newProperty: PortfolioProperty = {
                                id: Date.now().toString(),
                                address: manualPropertyData.address || 'New Property',
                                postcode: manualPropertyData.postcode || 'NE5 4PR',
                                purchasePrice: Number(manualPropertyData.purchasePrice) || 250000,
                                currentValue: Number(manualPropertyData.currentValue) || 275000,
                                purchaseDate: manualPropertyData.purchaseDate || new Date().toISOString().split('T')[0],
                                propertyType: 'semi-detached',
                                bmvScore: 75,
                                status: 'active',
                                monthlyRent: Number(manualPropertyData.monthlyRent) || 1200,
                                depositAmount: Number(manualPropertyData.depositAmount) || 19000,
                                actualRefurbishmentCost: 0,
                                legalFees: 2500,
                                stampDuty: 0,
                                otherCosts: 1000
                              };
                              setPortfolioProperties(prev => [...prev, newProperty]);
                              setShowPropertySearch(false);
                              // Reset form
                              setManualPropertyData({
                                address: '',
                                postcode: '',
                                purchasePrice: '',
                                currentValue: '',
                                monthlyRent: '',
                                depositAmount: '',
                                purchaseDate: ''
                              });
                            }}
                            className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl hover:shadow-xl transition-all duration-200 shadow-lg font-semibold"
                          >
                            Add Property
                          </button>
                        </div>
                      </div>
                                         )}
                  </div>
                </div>
              </motion.div>
            )}

          </div>

          {/* Portfolio Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatPrice(getTotalValue())}
                </div>
              </div>
              <div className="text-sm text-gray-600 font-medium">Total Portfolio Value</div>
              <div className="text-xs text-gray-400 mt-1">Current market value</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatPrice(getTotalGrowth())}
                </div>
              </div>
              <div className="text-sm text-gray-600 font-medium">Total Capital Growth</div>
              <div className="text-xs text-gray-400 mt-1">Appreciation since purchase</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Percent className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatPercentage(getAverageYield())}
                </div>
              </div>
              <div className="text-sm text-gray-600 font-medium">Average Yield</div>
              <div className="text-xs text-gray-400 mt-1">Annual rental return</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatPrice(getTotalEquity())}
                </div>
              </div>
              <div className="text-sm text-gray-600 font-medium">Total Equity</div>
              <div className="text-xs text-gray-400 mt-1">Value minus mortgages</div>
            </div>
          </div>

          {/* Additional Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPrice(getTotalInvested())}
                </div>
              </div>
              <div className="text-sm text-gray-600 font-medium">Total Cash Invested</div>
              <div className="text-xs text-gray-400 mt-2">Including deposits, renovation & legal costs</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPrice(getNetProfit())}
                </div>
              </div>
              <div className="text-sm text-gray-600 font-medium">Net Profit</div>
              <div className="text-xs text-gray-400 mt-2">After all costs & expenses</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-5 h-5 text-cyan-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPrice(getTotalYearlyTurnover())}
                </div>
              </div>
              <div className="text-sm text-gray-600 font-medium">Annual Rental Income</div>
              <div className="text-xs text-gray-400 mt-2">Gross rental revenue</div>
            </div>
          </div>

          {/* Charts & Analytics Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Portfolio Analytics</h2>
            </div>
            
            {/* Top Row - 50/50 Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Portfolio Performance Over Time */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                    <LineChart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Portfolio Performance</h3>
                    <p className="text-sm text-gray-500">Value growth over time</p>
                  </div>
                </div>
                <div className="h-64">
                  <Line 
                    data={getPortfolioPerformanceData()} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { 
                          position: 'top',
                          labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 12 }
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: 'white',
                          bodyColor: 'white',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderWidth: 1,
                          callbacks: {
                            label: (context) => `${context.dataset.label}: ${formatPrice(context.parsed.y)}`
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: 'rgba(0, 0, 0, 0.05)' },
                          ticks: {
                            callback: (value) => formatPrice(value as number),
                            font: { size: 11 }
                          }
                        },
                        x: {
                          grid: { color: 'rgba(0, 0, 0, 0.05)' },
                          ticks: { font: { size: 11 } }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Cash Flow Analysis */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Cash Flow Analysis</h3>
                    <p className="text-sm text-gray-500">Income vs. expenses</p>
                  </div>
                </div>
                <div className="h-64">
                  <Bar 
                    data={getCashFlowData()} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { 
                          position: 'top',
                          labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 12 }
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: 'white',
                          bodyColor: 'white',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderWidth: 1,
                          callbacks: {
                            label: (context) => `${context.dataset.label}: ${formatPrice(context.parsed.y)}`
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: 'rgba(0, 0, 0, 0.05)' },
                          ticks: {
                            callback: (value) => formatPrice(value as number),
                            font: { size: 11 }
                          }
                        },
                        x: {
                          grid: { color: 'rgba(0, 0, 0, 0.05)' },
                          ticks: { font: { size: 11 } }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Row - 50/50 Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Property Performance Comparison */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Property Comparison</h3>
                    <p className="text-sm text-gray-500">Growth & yield metrics</p>
                  </div>
                </div>
                <div className="h-64">
                  <Bar 
                    data={getPropertyComparisonData()} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { 
                          position: 'top',
                          labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 12 }
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: 'white',
                          bodyColor: 'white',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderWidth: 1,
                          callbacks: {
                            label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: 'rgba(0, 0, 0, 0.05)' },
                          ticks: {
                            callback: (value) => `${value}%`,
                            font: { size: 11 }
                          }
                        },
                        x: {
                          grid: { color: 'rgba(0, 0, 0, 0.05)' },
                          ticks: { font: { size: 11 } }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Break-Even Analysis */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Break-Even Analysis</h3>
                    <p className="text-sm text-gray-500">Profit vs. investment breakdown</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                      <div className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Current Status</div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Total Invested:</span>
                          <span className="text-sm font-semibold text-gray-900">{formatPrice(getTotalInvested())}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Net Profit:</span>
                          <span className={`text-sm font-semibold ${getNetProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPrice(getNetProfit())}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">To Break-Even:</span>
                          <span className="text-sm font-semibold text-blue-600">
                            {formatPrice(Math.max(0, getTotalInvested() - getNetProfit()))}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <div className="text-xs font-semibold text-blue-600 mb-3 uppercase tracking-wide">Monthly Progress</div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Cash Flow:</span>
                          <span className={`text-sm font-semibold ${getMonthlyCashFlow() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPrice(getMonthlyCashFlow())}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Months to Break-Even:</span>
                          <span className="text-sm font-semibold text-blue-600">
                            {getMonthlyCashFlow() > 0 ? Math.ceil(Math.max(0, getTotalInvested() - getNetProfit()) / getMonthlyCashFlow()) : '∞'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-48">
                    <Doughnut 
                      data={{
                        labels: ['Net Profit', 'Remaining Investment'],
                        datasets: [{
                          data: [Math.max(0, getNetProfit()), Math.max(0, getTotalInvested() - getNetProfit())],
                          backgroundColor: [
                            'rgba(34, 197, 94, 0.9)', 
                            'rgba(59, 130, 246, 0.9)'
                          ],
                          borderColor: [
                            'rgb(34, 197, 94)', 
                            'rgb(59, 130, 246)'
                          ],
                          borderWidth: 2,
                          hoverOffset: 4
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { 
                            position: 'bottom',
                            labels: {
                              usePointStyle: true,
                              padding: 15,
                              font: { size: 11 }
                            }
                          },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            callbacks: {
                              label: (context) => `${context.label}: ${formatPrice(context.parsed)}`
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

            {/* Top Performing Properties & Rental Yield Leaders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Properties</h3>
                <div className="space-y-3">
                  {portfolioProperties
                    .sort((a, b) => {
                      const aGrowth = ((a.currentValue - a.purchasePrice) / a.purchasePrice) * 100;
                      const bGrowth = ((b.currentValue - b.purchasePrice) / b.purchasePrice) * 100;
                      return bGrowth - aGrowth;
                    })
                    .slice(0, 3)
                    .map((property, index) => (
                      <div key={property.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{property.address}</div>
                          <div className="text-xs text-gray-500">{property.postcode}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            +{(((property.currentValue - property.purchasePrice) / property.purchasePrice) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            +{formatPrice(property.currentValue - property.purchasePrice)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rental Yield Leaders</h3>
                <div className="space-y-3">
                  {portfolioProperties
                    .filter(p => p.monthlyRent && p.currentValue)
                    .sort((a, b) => {
                      const aYield = ((a.monthlyRent! * 12) / a.currentValue) * 100;
                      const bYield = ((b.monthlyRent! * 12) / b.currentValue) * 100;
                      return bYield - aYield;
                    })
                    .slice(0, 3)
                    .map((property, index) => (
                      <div key={property.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{property.address}</div>
                          <div className="text-xs text-gray-500">{property.postcode}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">
                            {(((property.monthlyRent! * 12) / property.currentValue) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatPrice(property.monthlyRent! * 12)}/year
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Property Portfolio */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Home className="w-6 h-6 text-blue-600" />
                Your Properties
                <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {portfolioProperties.length} {portfolioProperties.length === 1 ? 'Property' : 'Properties'}
                </span>
              </h3>

              {/* Investment Breakdown */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Investment Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Total Invested</span>
                      <span className="font-bold text-green-600">{formatPrice(getTotalInvested())}</span>
                    </div>
                    <div className="text-xs text-gray-500">25% Deposit on all properties</div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Total Equity</span>
                      <span className="font-bold text-blue-600">{formatPrice(getTotalEquity())}</span>
                    </div>
                    <div className="text-xs text-gray-500">Current market value minus debt</div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {formatPercentage(getTotalROI())}
                  </div>
                  <div className="text-sm text-gray-600">Portfolio Growth</div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                  <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-pink-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {formatPercentage(getAverageYield())}
                  </div>
                  <div className="text-sm text-gray-600">Average Yield</div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Percent className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {formatPercentage(getPercentageOwned())}
                  </div>
                  <div className="text-sm text-gray-600">Equity Ratio</div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {formatPrice(getMonthlyCashFlow())}
                  </div>
                  <div className="text-sm text-gray-600">Monthly Cash Flow</div>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-sm text-gray-600">View:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      viewMode === 'cards'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="grid grid-cols-2 gap-0.5">
                        <div className="w-2 h-2 bg-current rounded-sm"></div>
                        <div className="w-2 h-2 bg-current rounded-sm"></div>
                        <div className="w-2 h-2 bg-current rounded-sm"></div>
                        <div className="w-2 h-2 bg-current rounded-sm"></div>
                      </div>
                      Cards
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      viewMode === 'table'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="space-y-1">
                        <div className="w-4 h-0.5 bg-current rounded"></div>
                        <div className="w-4 h-0.5 bg-current rounded"></div>
                        <div className="w-4 h-0.5 bg-current rounded"></div>
                      </div>
                      Table
                    </div>
                  </button>
                </div>
              </div>



            {/* Properties Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Properties</h2>
                  <p className="text-gray-600">Manage and track individual property performance</p>
                </div>
                <div className="flex items-center gap-3">
                  <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>All Properties</option>
                    <option>Active</option>
                    <option>Sold</option>
                    <option>Watching</option>
                  </select>
                  <button
                    onClick={() => setShowPropertySearch(!showPropertySearch)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
                  >
                    <Plus className="w-5 h-5" />
                    {showPropertySearch ? 'Hide Search' : 'Add Property'}
                  </button>
                </div>
              </div>

              {/* Properties Display */}
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {portfolioProperties.map((property) => (
                    <div key={property.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                            <Home className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{property.address}</h3>
                            <p className="text-sm text-gray-500">{property.postcode}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                {property.status}
                              </span>
                              <span className="text-xs text-gray-500">
                                +{(((property.currentValue - property.purchasePrice) / property.purchasePrice) * 100).toFixed(1)}% Growth
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditProperty(property)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Property"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${property.address}?`)) {
                                setPortfolioProperties(prev => prev.filter(p => p.id !== property.id));
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Property"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Purchased {formatDate(property.purchaseDate)}</span>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              Investment Score: {getInvestmentQualityScore(property)}/100
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full ${getInvestmentQualityLabel(getInvestmentQualityScore(property)).bg} ${getInvestmentQualityLabel(getInvestmentQualityScore(property)).color}`}>
                              {getInvestmentQualityLabel(getInvestmentQualityScore(property)).label}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Purchase Price:</span>
                          <span className="font-medium">{formatPrice(property.purchasePrice)}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Value:</span>
                          <span className="font-medium">{formatPrice(property.currentValue)}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Capital Growth:</span>
                          <span className="font-medium text-green-600">
                            {formatPrice(property.currentValue - property.purchasePrice)} (+{(((property.currentValue - property.purchasePrice) / property.purchasePrice) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Monthly Rent:</span>
                          <span className="font-medium">{formatPrice(property.monthlyRent || 0)}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Yield:</span>
                          <span className="font-medium">{formatPercentage(property.yield || 0)}%</span>
                        </div>
                        
                        {(property.depositAmount || property.actualRefurbishmentCost || property.legalFees || property.stampDuty || property.otherCosts) && (
                          <div className="border-t pt-3 mt-3">
                            <div className="text-xs font-medium text-gray-500 mb-2">Additional Costs:</div>
                            {property.depositAmount && (
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Deposit:</span>
                                <span className="font-medium">{formatPrice(property.depositAmount)}</span>
                              </div>
                            )}
                            {property.actualRefurbishmentCost && (
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Renovation:</span>
                                <span className="font-medium">{formatPrice(property.actualRefurbishmentCost)}</span>
                              </div>
                            )}
                            {property.legalFees && (
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Legal:</span>
                                <span className="font-medium">{formatPrice(property.legalFees)}</span>
                              </div>
                            )}
                            {property.stampDuty && (
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Stamp Duty:</span>
                                <span className="font-medium">{formatPrice(property.stampDuty)}</span>
                              </div>
                            )}
                            {property.otherCosts && (
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Other:</span>
                                <span className="font-medium">{formatPrice(property.otherCosts)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs font-medium border-t pt-1 mt-1">
                              <span className="text-gray-600">Total Invested:</span>
                              <span className="text-blue-600">
                                {formatPrice((property.depositAmount || 0) + (property.actualRefurbishmentCost || 0) + (property.legalFees || 0) + (property.stampDuty || 0) + (property.otherCosts || 0))}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-6 py-3">Property</th>
                        <th className="px-6 py-3">Purchase Price</th>
                        <th className="px-6 py-3">Current Value</th>
                        <th className="px-6 py-3">Growth</th>
                        <th className="px-6 py-3">Monthly Rent</th>
                        <th className="px-6 py-3">Yield</th>
                        <th className="px-6 py-3">Investment Score</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {portfolioProperties.map((property) => (
                        <tr key={property.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{property.address}</div>
                              <div className="text-sm text-gray-500">{property.postcode}</div>
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                {property.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">{formatPrice(property.purchasePrice)}</td>
                          <td className="px-6 py-4">{formatPrice(property.currentValue)}</td>
                          <td className="px-6 py-4">
                            <span className="text-green-600 font-medium">
                              +{(((property.currentValue - property.purchasePrice) / property.purchasePrice) * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4">{formatPrice(property.monthlyRent || 0)}</td>
                          <td className="px-6 py-4">{formatPercentage(property.yield || 0)}%</td>
                          <td className="px-6 py-4">
                            <div className="text-center">
                              <div className="font-semibold text-gray-900">{getInvestmentQualityScore(property)}/100</div>
                              <div className={`text-xs px-2 py-1 rounded-full ${getInvestmentQualityLabel(getInvestmentQualityScore(property)).bg} ${getInvestmentQualityLabel(getInvestmentQualityScore(property)).color}`}>
                                {getInvestmentQualityLabel(getInvestmentQualityScore(property)).label}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditProperty(property)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Property"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${property.address}?`)) {
                                    setPortfolioProperties(prev => prev.filter(p => p.id !== property.id));
                                  }
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Property"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

             {/* Modals */}
       {isAddModalOpen && (
         <PropertyEditModal
           property={{
             id: '',
             address: '',
             postcode: '',
             purchasePrice: 0,
             currentValue: 0
           }}
           isOpen={isAddModalOpen}
           onClose={() => setIsAddModalOpen(false)}
           onSave={async (newProperty) => {
             const portfolioProperty: PortfolioProperty = {
               ...newProperty,
               id: Date.now().toString(),
               currentValue: newProperty.currentValue || newProperty.purchasePrice || 0,
               purchaseDate: new Date().toISOString().split('T')[0],
               propertyType: (newProperty.propertyType as string) || 'Unknown',
               bmvScore: null,
               status: 'active'
             };
             setPortfolioProperties(prev => [...prev, portfolioProperty]);
             setIsAddModalOpen(false);
           }}
         />
       )}

       {isEditModalOpen && editingProperty && (
         <PropertyEditModal
           isOpen={isEditModalOpen}
           onClose={() => setIsEditModalOpen(false)}
           onSave={async (updatedProperty) => {
             const portfolioProperty: PortfolioProperty = {
               ...editingProperty,
               ...updatedProperty,
               currentValue: updatedProperty.currentValue || editingProperty.currentValue || 0,
               purchaseDate: editingProperty.purchaseDate,
               propertyType: editingProperty.propertyType,
               bmvScore: editingProperty.bmvScore,
               status: editingProperty.status
             };
             setPortfolioProperties(prev => 
               prev.map(p => p.id === updatedProperty.id ? portfolioProperty : p)
             );
             setIsEditModalOpen(false);
           }}
           property={{
             ...editingProperty,
             currentValue: editingProperty.currentValue || 0
           }}
         />
       )}

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}
    </div>
  );
} 