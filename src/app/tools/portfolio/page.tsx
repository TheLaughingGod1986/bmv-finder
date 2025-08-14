'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { formatPrice, formatDate, formatPercentage } from '@/lib/formatters';
import { Home, TrendingUp, PoundSterling, Calendar, Plus, Filter, BarChart3, Target, MapPin, Trash2, CheckCircle, Edit, DollarSign, Percent, Clock, RefreshCw, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import PropertyEditModal from '../../components/PropertyEditModal';
import SimplePropertyCard from '../../components/SimplePropertyCard';
import PropertyValuationCard from '../../components/PropertyValuationCard';
import AuthModal from '../../components/AuthModal';

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
  corporationTaxRate?: number; // Default 25% for 2024/25
  personalTaxRate?: number; // Default 40% for higher rate
  directorLoanBalance?: number;
  directorLoanInterestRate?: number; // Default 2.25% for 2024/25
  
  // Calculated fields
  yield?: number;
  equity?: number;
  equityPercentage?: number;
  monthlyProfit?: number;
  totalProfit?: number;
  images?: string[]; // Added for demo images
}

interface PortfolioSummary {
  totalValue: number;
  totalPurchasePrice: number;
  totalCapitalGrowth: number;
  totalRentalIncome: number;
  totalMortgagePayments: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  totalTaxLiability: number;
  directorLoanInterest: number;
  netProfitAfterTax: number;
  annualizedROI: number;
  lifetimeROI: number;
  yearlyBreakdown: {
    year: number;
    rentalIncome: number;
    capitalGrowth: number;
    expenses: number;
    mortgagePayments: number;
    grossProfit: number;
    taxLiability: number;
    netProfit: number;
  }[];
}

// Demo portfolio data for unauthenticated users - moved outside component to prevent recreation
const demoPortfolioData: PortfolioProperty[] = [
    {
      id: 'demo-1',
      address: '21, FOURSTONES, NEWCASTLE UPON TYNE, NE5 2PR',
      postcode: 'NE5 2PR',
      purchasePrice: 87650,
      currentValue: 90223,
      purchaseDate: '2024-02-28',
      propertyType: 'Terraced House',
      bmvScore: 85,
      status: 'active',
      notes: 'Excellent rental yield, great location near transport links. Property performing above expectations.',
      monthlyRent: 1200,
      rentStartDate: '2024-03-01',
      mortgageBalance: 65750,
      mortgageType: 'repayment',
      mortgageRate: 4.5,
      monthlyMortgagePayment: 780,
      depositAmount: 21900,
      monthlyExpenses: 120,
      yield: 6.86,
      equity: 24473,
      equityPercentage: 27.13,
      monthlyProfit: 300,
      totalProfit: 2573,
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
      images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop&crop=center']
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
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&crop=center']
    },
    {
      id: 'demo-3',
      address: '9, FOURSTONES, NEWCASTLE UPON TYNE, NE5 2PR',
      postcode: 'NE5 2PR',
      purchasePrice: 82000,
      currentValue: 85000,
      purchaseDate: '2022-09-22',
      propertyType: 'Terraced House',
      bmvScore: 78,
      status: 'sold',
      notes: 'Sold for profit after 18 months. Excellent ROI achieved.',
      monthlyRent: 950,
      rentStartDate: '2022-10-01',
      mortgageBalance: 61500,
      mortgageType: 'repayment',
      mortgageRate: 4.8,
      monthlyMortgagePayment: 720,
      depositAmount: 20500,
      monthlyExpenses: 95,
      yield: 6.33,
      equity: 23500,
      equityPercentage: 27.65,
      monthlyProfit: 135,
      totalProfit: 3000,
      isLtdCompany: false,
      corporationTaxRate: 25,
      personalTaxRate: 40,
      directorLoanBalance: 0,
      directorLoanInterestRate: 2.25,
      images: ['https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400&h=300&fit=crop&crop=center']
    },
    {
      id: 'demo-4',
      address: '5, FOURSTONES, NEWCASTLE UPON TYNE, NE5 2PR',
      postcode: 'NE5 2PR',
      purchasePrice: 100000,
      currentValue: 110000,
      purchaseDate: '2022-01-28',
      propertyType: 'Terraced House',
      bmvScore: 88,
      status: 'active',
      notes: 'Premium location with strong rental demand. Property value increasing steadily.',
      monthlyRent: 1800,
      rentStartDate: '2022-02-01',
      mortgageBalance: 75000,
      mortgageType: 'interest_only',
      mortgageRate: 4.1,
      monthlyMortgagePayment: 820,
      depositAmount: 25000,
      monthlyExpenses: 150,
      yield: 6.75,
      equity: 35000,
      equityPercentage: 31.82,
      monthlyProfit: 830,
      totalProfit: 10000,
      isLtdCompany: true,
      corporationTaxRate: 25,
      personalTaxRate: 40,
      directorLoanBalance: 60000,
      directorLoanInterestRate: 2.25,
      images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop&crop=center']
    },
    {
      id: 'demo-5',
      address: '19, FOURSTONES, NEWCASTLE UPON TYNE, NE5 2PR',
      postcode: 'NE5 2PR',
      purchasePrice: 109000,
      currentValue: 115000,
      purchaseDate: '2021-06-03',
      propertyType: 'Terraced House',
      bmvScore: 82,
      status: 'active',
      notes: 'City centre location with excellent rental yield. Student market performing well.',
      monthlyRent: 1600,
      rentStartDate: '2021-07-01',
      mortgageBalance: 81750,
      mortgageType: 'repayment',
      mortgageRate: 4.6,
      monthlyMortgagePayment: 1050,
      depositAmount: 27250,
      monthlyExpenses: 120,
      yield: 6.86,
      equity: 33250,
      equityPercentage: 28.91,
      monthlyProfit: 430,
      totalProfit: 6000,
      isLtdCompany: true,
      corporationTaxRate: 25,
      personalTaxRate: 40,
      directorLoanBalance: 40000,
      directorLoanInterestRate: 2.25,
      images: ['https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400&h=300&fit=crop&crop=center']
    },
    {
      id: 'demo-6',
      address: '29, FOURSTONES, NEWCASTLE UPON TYNE, NE5 2PR',
      postcode: 'NE5 2PR',
      purchasePrice: 97500,
      currentValue: 105000,
      purchaseDate: '2007-11-09',
      propertyType: 'Terraced House',
      bmvScore: 79,
      status: 'watching',
      notes: 'Potential HMO conversion opportunity. Currently evaluating planning permission.',
      monthlyRent: 1100,
      rentStartDate: '2007-12-01',
      mortgageBalance: 73125,
      mortgageType: 'repayment',
      mortgageRate: 4.7,
      monthlyMortgagePayment: 820,
      depositAmount: 24375,
      monthlyExpenses: 100,
      yield: 6.77,
      equity: 31875,
      equityPercentage: 30.36,
      monthlyProfit: 180,
      totalProfit: 7500,
      isLtdCompany: false,
      corporationTaxRate: 25,
      personalTaxRate: 40,
      directorLoanBalance: 0,
      directorLoanInterestRate: 2.25,
      images: ['https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400&h=300&fit=crop&crop=center']
    },
    {
      id: 'demo-7',
      address: '33, FOURSTONES, NEWCASTLE UPON TYNE, NE5 2PR',
      postcode: 'NE5 2PR',
      purchasePrice: 57000,
      currentValue: 65000,
      purchaseDate: '2003-09-17',
      propertyType: 'Terraced House',
      bmvScore: 86,
      status: 'active',
      notes: 'Family home in popular area. Strong capital growth and rental demand.',
      monthlyRent: 1400,
      rentStartDate: '2003-10-01',
      mortgageBalance: 42750,
      mortgageType: 'repayment',
      mortgageRate: 4.3,
      monthlyMortgagePayment: 950,
      depositAmount: 14250,
      monthlyExpenses: 130,
      yield: 6.72,
      equity: 22250,
      equityPercentage: 34.23,
      monthlyProfit: 320,
      totalProfit: 8000,
      isLtdCompany: true,
      corporationTaxRate: 25,
      personalTaxRate: 40,
      directorLoanBalance: 30000,
      directorLoanInterestRate: 2.25,
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&crop=center']
    },
    {
      id: 'demo-8',
      address: '3, FOURSTONES, NEWCASTLE UPON TYNE, NE5 2PR',
      postcode: 'NE5 2PR',
      purchasePrice: 34950,
      currentValue: 45000,
      purchaseDate: '2000-04-28',
      propertyType: 'Terraced House',
      bmvScore: 95,
      status: 'active',
      notes: 'Long-term investment showing excellent capital growth. Property has doubled in value over 20+ years.',
      monthlyRent: 800,
      rentStartDate: '2000-05-01',
      mortgageBalance: 26212,
      mortgageType: 'repayment',
      mortgageRate: 3.8,
      monthlyMortgagePayment: 450,
      depositAmount: 8737,
      monthlyExpenses: 80,
      yield: 6.77,
      equity: 18788,
      equityPercentage: 41.75,
      monthlyProfit: 270,
      totalProfit: 10050,
      isLtdCompany: true,
      corporationTaxRate: 25,
      personalTaxRate: 40,
      directorLoanBalance: 20000,
      directorLoanInterestRate: 2.25,
      images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop&crop=center']
    },
    {
      id: 'demo-9',
      address: '11, FOURSTONES, NEWCASTLE UPON TYNE, NE5 2PR',
      postcode: 'NE5 2PR',
      purchasePrice: 33000,
      currentValue: 42000,
      purchaseDate: '1999-10-18',
      propertyType: 'Terraced House',
      bmvScore: 93,
      status: 'active',
      notes: 'Vintage investment property with strong rental history. Excellent ROI over 25+ years.',
      monthlyRent: 750,
      rentStartDate: '1999-11-01',
      mortgageBalance: 24750,
      mortgageType: 'repayment',
      mortgageRate: 3.9,
      monthlyMortgagePayment: 420,
      depositAmount: 8250,
      monthlyExpenses: 75,
      yield: 6.77,
      equity: 17250,
      equityPercentage: 41.07,
      monthlyProfit: 255,
      totalProfit: 9000,
      isLtdCompany: true,
      corporationTaxRate: 25,
      personalTaxRate: 40,
      directorLoanBalance: 15000,
      directorLoanInterestRate: 2.25,
      images: ['https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400&h=300&fit=crop&crop=center']
    }
  ];

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
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [selectedPropertyForValuation, setSelectedPropertyForValuation] = useState<PortfolioProperty | null>(null);
  const [isValuationModalOpen, setIsValuationModalOpen] = useState(false);
  const [isPortfolioValuationModalOpen, setIsPortfolioValuationModalOpen] = useState(false);
  const [showAllYears, setShowAllYears] = useState(false);
  const hasInitialized = useRef(false);

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
    if (!user) {
      // Use demo data for unauthenticated users
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
        
        const mappedProperties = (properties || []).map(property => {
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
  }, [user, supabase]);

  useEffect(() => {
    loadPortfolioData();
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

  // Formatting functions now imported from centralized utilities

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

  const getTotalRentalIncome = () => {
    return portfolioProperties.reduce((sum, property) => {
      const monthlyRent = property.monthlyRent || 0;
      const monthsRented = property.rentStartDate ? 
        Math.max(0, Math.floor((new Date().getTime() - new Date(property.rentStartDate).getTime()) / (1000 * 60 * 60 * 24 * 30))) : 0;
      return sum + (monthlyRent * monthsRented);
    }, 0);
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
      
      return sum + total;
    }, 0);
  };

  // Comprehensive financial calculations
  // Convert portfolio property to PropertyValuationCard format
  const convertToValuationCard = (property: PortfolioProperty) => {
    const purchaseDate = new Date(property.purchaseDate);
    const currentDate = new Date();
    const monthsSincePurchase = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    // Generate historical data based on purchase price and current value
    const historicalData = [];
    const totalGrowth = property.currentValue - property.purchasePrice;
    const monthlyGrowth = totalGrowth / Math.max(1, monthsSincePurchase);
    
    for (let i = 0; i <= monthsSincePurchase; i += 2) {
      const date = new Date(purchaseDate);
      date.setMonth(date.getMonth() + i);
      const value = property.purchasePrice + (monthlyGrowth * i);
      historicalData.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value)
      });
    }

    // Generate comparable sales data
    const comparableSales = [
      {
        number: property.address.split(',')[0].trim(),
        address: property.address,
        postcode: property.postcode,
        propertyType: property.propertyType.charAt(0).toUpperCase(),
        price: property.purchasePrice,
        date: property.purchaseDate
      },
      {
        number: (parseInt(property.address.split(',')[0]) + 2).toString(),
        address: property.address.replace(property.address.split(',')[0], (parseInt(property.address.split(',')[0]) + 2).toString()),
        postcode: property.postcode,
        propertyType: property.propertyType.charAt(0).toUpperCase(),
        price: Math.round(property.purchasePrice * 0.95),
        date: new Date(purchaseDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        number: (parseInt(property.address.split(',')[0]) - 2).toString(),
        address: property.address.replace(property.address.split(',')[0], (parseInt(property.address.split(',')[0]) - 2).toString()),
        postcode: property.postcode,
        propertyType: property.propertyType.charAt(0).toUpperCase(),
        price: Math.round(property.purchasePrice * 1.05),
        date: new Date(purchaseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ];

    return {
      address: property.address,
      postcode: property.postcode,
      propertyType: property.propertyType,
      bedrooms: property.propertyType.includes('3') ? 3 : property.propertyType.includes('2') ? 2 : 4,
      estimatedValue: property.currentValue,
      confidence: (property.bmvScore && property.bmvScore > 85 ? 'high' : property.bmvScore && property.bmvScore > 70 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      valueRange: {
        low: Math.round(property.currentValue * 0.95),
        high: Math.round(property.currentValue * 1.05)
      },
      lastUpdated: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      nextUpdate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      dataSource: "Your property value is connected to Hometrack (Zoopla) for automatic updates",
      purchaseHistory: {
        purchasePrice: property.purchasePrice,
        purchaseDate: property.purchaseDate,
        totalGain: property.currentValue - property.purchasePrice,
        growthPercentage: ((property.currentValue - property.purchasePrice) / property.purchasePrice) * 100,
        annualAppreciation: ((property.currentValue - property.purchasePrice) / property.purchasePrice) * 100
      },
      mortgage: {
        currentBalance: property.mortgageBalance || 0,
        propertyReference: property.address.split(',')[0].trim()
      },
      historicalData,
      comparableSales,
      valuationBreakdown: {
        comparableSalesValue: Math.round(property.currentValue * 0.7),
        hpiAdjustedValue: Math.round(property.currentValue * 0.8),
        marketTrends: Math.round(property.currentValue * 0.05),
        locationPremium: Math.round(property.currentValue * 0.03),
        propertyCondition: Math.round(property.currentValue * 0.02)
      },
      marketInsights: {
        averagePricePerSqm: Math.round(property.currentValue / 80), // Assuming 80sqm average
        priceGrowth: 2.8,
        daysOnMarket: 45,
        supplyDemand: 'medium' as const
      }
    };
  };

  const calculatePortfolioSummary = (): PortfolioSummary => {
    const now = new Date();
    const yearlyBreakdown: { [key: number]: any } = {};
    
    // Initialize yearly breakdown
    portfolioProperties.forEach(property => {
      const purchaseDate = new Date(property.purchaseDate);
      const startYear = purchaseDate.getFullYear();
      const endYear = property.status === 'sold' ? 
        new Date(property.rentStartDate || property.purchaseDate).getFullYear() : 
        now.getFullYear();
      
      for (let year = startYear; year <= endYear; year++) {
        if (!yearlyBreakdown[year]) {
          yearlyBreakdown[year] = {
            year,
            rentalIncome: 0,
            capitalGrowth: 0,
            expenses: 0,
            mortgagePayments: 0,
            grossProfit: 0,
            taxLiability: 0,
            netProfit: 0
          };
        }
      }
    });

    // Calculate totals and yearly breakdown
    let totalValue = 0;
    let totalPurchasePrice = 0;
    let totalCapitalGrowth = 0;
    let totalRentalIncome = 0;
    let totalMortgagePayments = 0;
    let totalExpenses = 0;
    let totalTaxLiability = 0;
    let totalDirectorLoanInterest = 0;

    portfolioProperties.forEach(property => {
      const purchaseDate = new Date(property.purchaseDate);
      const rentStartDate = property.rentStartDate ? new Date(property.rentStartDate) : purchaseDate;
      const endDate = property.status === 'sold' ? new Date(property.rentStartDate || property.purchaseDate) : now;
      
      // Basic calculations
      totalValue += property.currentValue || 0;
      totalPurchasePrice += property.purchasePrice || 0;
      const capitalGrowth = (property.currentValue || 0) - (property.purchasePrice || 0);
      totalCapitalGrowth += capitalGrowth;

      // Calculate rental income and expenses
      const monthsRented = Math.max(0, Math.floor((endDate.getTime() - rentStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      const totalRent = (property.monthlyRent || 0) * monthsRented;
      const totalMortgage = (property.monthlyMortgagePayment || 0) * monthsRented;
      const totalPropertyExpenses = (property.monthlyExpenses || 0) * monthsRented;
      
      totalRentalIncome += totalRent;
      totalMortgagePayments += totalMortgage;
      totalExpenses += totalPropertyExpenses;

      // Calculate yearly breakdown
      const startYear = rentStartDate.getFullYear();
      const endYear = endDate.getFullYear();
      
      for (let year = startYear; year <= endYear; year++) {
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);
        const propertyYearStart = new Date(Math.max(rentStartDate.getTime(), yearStart.getTime()));
        const propertyYearEnd = new Date(Math.min(endDate.getTime(), yearEnd.getTime()));
        
        const monthsInYear = Math.max(0, Math.floor((propertyYearEnd.getTime() - propertyYearStart.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        
        const yearlyRent = (property.monthlyRent || 0) * monthsInYear;
        const yearlyMortgage = (property.monthlyMortgagePayment || 0) * monthsInYear;
        const yearlyExpenses = (property.monthlyExpenses || 0) * monthsInYear;
        
        yearlyBreakdown[year].rentalIncome += yearlyRent;
        yearlyBreakdown[year].mortgagePayments += yearlyMortgage;
        yearlyBreakdown[year].expenses += yearlyExpenses;
        
        // Capital growth for the year (proportional based on months in year)
        const totalMonthsHeld = Math.max(0, Math.floor((endDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        if (totalMonthsHeld > 0) {
          const growthProportion = monthsInYear / totalMonthsHeld;
          yearlyBreakdown[year].capitalGrowth += capitalGrowth * growthProportion;
        }
      }

      // Calculate tax liability
      if (property.isLtdCompany) {
        // Corporation tax on rental profits
        const rentalProfit = totalRent - totalPropertyExpenses;
        const corporationTax = rentalProfit * ((property.corporationTaxRate || 25) / 100);
        totalTaxLiability += corporationTax;
        
        // Director loan interest
        const directorLoanInterest = (property.directorLoanBalance || 0) * ((property.directorLoanInterestRate || 2.25) / 100);
        totalDirectorLoanInterest += directorLoanInterest;
      } else {
        // Personal tax on rental income
        const rentalProfit = totalRent - totalPropertyExpenses;
        const personalTax = rentalProfit * ((property.personalTaxRate || 40) / 100);
        totalTaxLiability += personalTax;
      }
    });

    // Calculate yearly tax and net profits
    Object.values(yearlyBreakdown).forEach(yearData => {
      yearData.grossProfit = yearData.rentalIncome - yearData.expenses;
      yearData.taxLiability = yearData.grossProfit * 0.25; // Simplified tax calculation
      yearData.netProfit = yearData.grossProfit - yearData.taxLiability;
    });

    const grossProfit = totalRentalIncome - totalExpenses;
    const netProfit = grossProfit - totalTaxLiability;
    const netProfitAfterTax = netProfit - totalDirectorLoanInterest;

    // Calculate ROI
    const totalInvested = getTotalInvested();
    const lifetimeROI = totalInvested > 0 ? ((totalCapitalGrowth + netProfitAfterTax) / totalInvested) * 100 : 0;
    
    // Calculate annualized ROI
    const oldestPurchase = Math.min(...portfolioProperties.map(p => new Date(p.purchaseDate).getTime()));
    const yearsHeld = (now.getTime() - oldestPurchase) / (1000 * 60 * 60 * 24 * 365);
    const annualizedROI = yearsHeld > 0 ? lifetimeROI / yearsHeld : 0;

    return {
      totalValue,
      totalPurchasePrice,
      totalCapitalGrowth,
      totalRentalIncome,
      totalMortgagePayments,
      totalExpenses,
      grossProfit,
      netProfit,
      totalTaxLiability,
      directorLoanInterest: totalDirectorLoanInterest,
      netProfitAfterTax,
      annualizedROI,
      lifetimeROI,
      yearlyBreakdown: Object.values(yearlyBreakdown).sort((a, b) => a.year - b.year)
    };
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
                  Professional Investment Management
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
                  Performance Tracking & Analytics
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
                  View Property Analyzer
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
                    const banner = document.querySelector('[data-demo-portfolio-banner]') as HTMLElement;
                    if (banner) banner.style.display = 'none';
                  }}
                  className="flex-shrink-0 text-blue-400 hover:text-blue-600"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </motion.div>
          )}

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

              {/* Comprehensive Financial Summary */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Financial Performance Summary</h2>
                {(() => {
                  const summary = calculatePortfolioSummary();
                  return (
                    <div className="space-y-6">
                      {/* Lifetime Totals */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                              <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-500">Total Rental Income</span>
                          </div>
                          <div className="text-3xl font-bold text-gray-900 mb-2">
                            {formatPrice(summary.totalRentalIncome)}
                          </div>
                          <div className="text-sm text-green-600 font-semibold">
                            Lifetime earnings
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                              <PoundSterling className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-500">Capital Growth</span>
                          </div>
                          <div className="text-3xl font-bold text-gray-900 mb-2">
                            {formatPrice(summary.totalCapitalGrowth)}
                          </div>
                          <div className="text-sm text-blue-600 font-semibold">
                            Property appreciation
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                              <Target className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-500">Total Tax Liability</span>
                          </div>
                          <div className="text-3xl font-bold text-gray-900 mb-2">
                            {formatPrice(summary.totalTaxLiability)}
                          </div>
                          <div className="text-sm text-red-600 font-semibold">
                            Corporation & personal tax
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-500">Net Profit After Tax</span>
                          </div>
                          <div className="text-3xl font-bold text-gray-900 mb-2">
                            {formatPrice(summary.netProfitAfterTax)}
                          </div>
                          <div className="text-sm text-purple-600 font-semibold">
                            After all deductions
                          </div>
                        </div>
                      </div>

                      {/* ROI and Performance Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">ROI Performance</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Lifetime ROI</span>
                              <span className="font-bold text-green-600">{summary.lifetimeROI.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Annualized ROI</span>
                              <span className="font-bold text-blue-600">{summary.annualizedROI.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Total Invested</span>
                              <span className="font-bold">{formatPrice(getTotalInvested())}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Total Expenses</span>
                              <span className="font-bold text-red-600">{formatPrice(summary.totalExpenses)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Mortgage Payments</span>
                              <span className="font-bold text-orange-600">{formatPrice(summary.totalMortgagePayments)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Director Loan Interest</span>
                              <span className="font-bold text-purple-600">{formatPrice(summary.directorLoanInterest)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Structure</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">LTD Companies</span>
                              <span className="font-bold text-blue-600">
                                {portfolioProperties.filter(p => p.isLtdCompany).length}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Personal Properties</span>
                              <span className="font-bold text-green-600">
                                {portfolioProperties.filter(p => !p.isLtdCompany).length}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Total Director Loans</span>
                              <span className="font-bold text-purple-600">
                                {formatPrice(portfolioProperties.reduce((sum, p) => sum + (p.directorLoanBalance || 0), 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Yearly Breakdown */}
                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Yearly Performance Breakdown</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 font-semibold text-gray-900">Year</th>
                                <th className="text-right py-2 font-semibold text-gray-900">Rental Income</th>
                                <th className="text-right py-2 font-semibold text-gray-900">Capital Growth</th>
                                <th className="text-right py-2 font-semibold text-gray-900">Expenses</th>
                                <th className="text-right py-2 font-semibold text-gray-900">Tax</th>
                                <th className="text-right py-2 font-semibold text-gray-900">Net Profit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {summary.yearlyBreakdown
                                .slice(0, showAllYears ? undefined : 5)
                                .map((year) => (
                                <tr key={year.year} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="py-2 font-medium text-gray-900">{year.year}</td>
                                  <td className="py-2 text-right text-green-600">{formatPrice(year.rentalIncome)}</td>
                                  <td className="py-2 text-right text-blue-600">{formatPrice(year.capitalGrowth)}</td>
                                  <td className="py-2 text-right text-red-600">{formatPrice(year.expenses)}</td>
                                  <td className="py-2 text-right text-orange-600">{formatPrice(year.taxLiability)}</td>
                                  <td className="py-2 text-right font-bold text-gray-900">{formatPrice(year.netProfit)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          
                          {summary.yearlyBreakdown.length > 5 && (
                            <div className="mt-4 text-center">
                              <button
                                onClick={() => setShowAllYears(!showAllYears)}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                {showAllYears ? (
                                  <>
                                    <ChevronUp className="w-4 h-4" />
                                    Show Less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    Show {summary.yearlyBreakdown.length - 5} More Years
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Investment Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Breakdown</h3>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-600">Total Deposits</span>
                              <span className="font-bold text-blue-600">
                                {formatPrice(portfolioProperties.reduce((sum, p) => sum + (p.depositAmount || 0), 0))}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-600">Renovation Costs</span>
                              <span className="font-bold text-orange-600">
                                {formatPrice(portfolioProperties.reduce((sum, p) => {
                                  const refurbCost = p.actualRefurbishmentCost || 
                                    p.refurbishmentCosts?.[p.selectedRefurbishmentLevel || 'medium'] || 0;
                                  return sum + refurbCost;
                                }, 0))}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-600">Legal & Setup Costs</span>
                              <span className="font-bold text-purple-600">
                                {formatPrice(portfolioProperties.reduce((sum, p) => {
                                  return sum + (p.stampDuty || 0) + (p.legalFees || 0) + (p.surveyFees || 0) +
                                         (p.mortgageFees || 0) + (p.landRegistryFees || 0) + (p.searchesFees || 0) +
                                         (p.gasSafetyCertificate || 0) + (p.electricalSafetyCertificate || 0) +
                                         (p.energyPerformanceCertificate || 0) + (p.fireSafetyAssessment || 0) +
                                         (p.legionellaRiskAssessment || 0) + (p.asbestosSurvey || 0) +
                                         (p.landlordInsurance || 0) + (p.furnitureAndAppliances || 0) +
                                         (p.marketingAndLettingFees || 0) + (p.contingencyFund || 0);
                                }, 0))}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                              <span className="text-sm text-gray-600 font-semibold">Total Invested</span>
                              <span className="font-bold text-green-600 text-lg">{formatPrice(getTotalInvested())}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Offer History Summary</h3>
                          <div className="space-y-4">
                            {(() => {
                              const allOffers = portfolioProperties.flatMap(p => 
                                (p.offerHistory || []).map(offer => ({ ...offer, propertyAddress: p.address }))
                              );
                              const recentOffers = allOffers
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .slice(0, 5);
                              
                              return recentOffers.length > 0 ? (
                                <div className="space-y-3">
                                  {recentOffers.map((offer, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                          {offer.propertyAddress}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {new Date(offer.date).toLocaleDateString()} - {offer.status.replace('_', ' ')}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-blue-600">{formatPrice(offer.amount)}</div>
                                        <div className={`text-xs px-2 py-1 rounded ${
                                          offer.status === 'offer_accepted' ? 'bg-green-100 text-green-800' :
                                          offer.status === 'offer_rejected' ? 'bg-red-100 text-red-800' :
                                          offer.status === 'offer_withdrawn' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-blue-100 text-blue-800'
                                        }`}>
                                          {offer.status.replace('_', ' ')}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <div className="text-lg mb-2">📋</div>
                                  <div>No offer history available</div>
                                  <div className="text-sm">Add offers when editing properties</div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Property Performance Analysis */}
                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Performance Analysis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                            <div className="text-2xl font-bold text-blue-600 mb-2">
                              {portfolioProperties.filter(p => p.currentValue > p.purchasePrice).length}
                            </div>
                            <div className="text-sm text-gray-600">Properties in Profit</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {((portfolioProperties.filter(p => p.currentValue > p.purchasePrice).length / portfolioProperties.length) * 100).toFixed(1)}% of portfolio
                            </div>
                          </div>
                          
                          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                            <div className="text-2xl font-bold text-green-600 mb-2">
                              {formatPrice(portfolioProperties.reduce((sum, p) => {
                                const monthlyRent = p.monthlyRent || 0;
                                const monthlyExpenses = p.monthlyExpenses || 0;
                                const monthlyMortgage = p.monthlyMortgagePayment || 0;
                                return sum + (monthlyRent - monthlyExpenses - monthlyMortgage);
                              }, 0))}
                            </div>
                            <div className="text-sm text-gray-600">Monthly Cash Flow</div>
                            <div className="text-xs text-gray-500 mt-1">After all expenses</div>
                          </div>
                          
                          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                            <div className="text-2xl font-bold text-purple-600 mb-2">
                              {formatPrice(portfolioProperties.reduce((sum, p) => {
                                const currentValue = p.currentValue || 0;
                                const purchasePrice = p.purchasePrice || 0;
                                const totalInvested = p.depositAmount || 0;
                                return sum + ((currentValue - purchasePrice) / totalInvested * 100);
                              }, 0) / portfolioProperties.length)}%
                            </div>
                            <div className="text-sm text-gray-600">Average ROI</div>
                            <div className="text-xs text-gray-500 mt-1">Based on deposits</div>
                          </div>
                        </div>
                      </div>

                      {/* Market Trends & Insights */}
                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Trends & Insights</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Top Performing Properties</h4>
                            <div className="space-y-2">
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
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Rental Yield Leaders</h4>
                            <div className="space-y-2">
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
                                        {formatPrice(property.monthlyRent!)}/month
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
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


            </motion.div>

          <PropertyEditModal
            property={editingProperty}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingProperty(null);
            }}
            onSave={handlePropertySave}
          />

          {/* Individual Property Valuation Modal */}
          {isValuationModalOpen && selectedPropertyForValuation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Property Valuation Report</h2>
                  <button
                    onClick={() => {
                      setIsValuationModalOpen(false);
                      setSelectedPropertyForValuation(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6">
                  <PropertyValuationCard property={convertToValuationCard(selectedPropertyForValuation)} />
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Valuation Modal */}
          {isPortfolioValuationModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Portfolio Valuation Summary</h2>
                  <button
                    onClick={() => setIsPortfolioValuationModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Portfolio Overview */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Portfolio Overview</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Portfolio Value</span>
                          <span className="text-2xl font-bold text-gray-900">{formatPrice(getTotalValue())}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Capital Growth</span>
                          <span className="text-xl font-bold text-green-600">{formatPrice(getTotalGrowth())}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Average Annual ROI</span>
                          <span className="text-xl font-bold text-blue-600">{getTotalROI().toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Properties</span>
                          <span className="text-xl font-bold text-purple-600">{portfolioProperties.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Portfolio Performance Chart */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Portfolio Performance</h3>
                      <div className="space-y-3">
                        {portfolioProperties.slice(0, 5).map((property, index) => (
                          <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{property.address.split(',')[0]}</div>
                              <div className="text-sm text-gray-600">{property.postcode}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-900">{formatPrice(property.currentValue)}</div>
                              <div className="text-sm text-green-600">+{formatPrice(property.currentValue - property.purchasePrice)}</div>
                            </div>
                          </div>
                        ))}
                        {portfolioProperties.length > 5 && (
                          <div className="text-center text-gray-500 text-sm">
                            +{portfolioProperties.length - 5} more properties
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Individual Property Valuations */}
                  <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Individual Property Valuations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {portfolioProperties.map((property) => (
                        <div key={property.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer"
                             onClick={() => {
                               setSelectedPropertyForValuation(property);
                               setIsValuationModalOpen(true);
                               setIsPortfolioValuationModalOpen(false);
                             }}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">{property.address.split(',')[0]}</h4>
                            <span className="text-sm text-gray-500">{property.postcode}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Current Value</span>
                              <span className="font-bold text-gray-900">{formatPrice(property.currentValue)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Growth</span>
                              <span className="text-sm text-green-600">+{formatPrice(property.currentValue - property.purchasePrice)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">ROI</span>
                              <span className="text-sm text-blue-600">{((property.currentValue - property.purchasePrice) / property.purchasePrice * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-500 text-center">Click to view detailed valuation</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sign In Modal */}
          <AuthModal
            isOpen={isSignInModalOpen}
            onClose={() => setIsSignInModalOpen(false)}
            defaultMode="login"
          />
        </div>
      </div>
    </>
  );
} 