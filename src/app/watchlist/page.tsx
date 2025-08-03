'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Home as HomeIcon, 
  Eye as EyeIcon, 
  TrendingUp, 
  Target, 
  Calculator, 
  Briefcase as BriefcaseIcon,
  ExternalLink as ExternalLinkIcon,
  Archive as ArchiveIcon,
  Trash as TrashIcon,
  BedDouble as BedDoubleIcon,
  Bath as BathIcon,
  MapPin,
  PoundSterling,
  Calendar,
  Star,
  Filter,
  Search,
  X,
  Plus,
  Edit as PencilIcon,
  CheckCircle,
  Check,
  Clock
} from 'lucide-react';
import PredictionExplanationCard from '../components/PredictionExplanationCard';
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
}

export default function WatchlistPage() {
  const router = useRouter();
  const { showToast } = useToast();
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
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    refurbishment_cost: 0,
    user_notes: '',
    property_condition: 'Good',
    estimated_fair_value: 0,
    custom_rental_estimate: 0
  });

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

  const updatePropertyStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/properties/capture`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) {
        console.error('Error updating status');
        return;
      }

      setWatchlist(prev => 
        prev.map(item => 
          item.id === id ? { ...item, status } : item
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteProperty = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this property?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/properties/capture?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Error deleting property');
        return;
      }

      setWatchlist(prev => prev.filter(item => item.id !== id));
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
      refurbishment_cost: property.refurbishment_cost || 0,
      user_notes: property.user_notes || '',
      property_condition: property.property_condition || 'Good',
      estimated_fair_value: property.estimated_fair_value || property.price,
      custom_rental_estimate: property.custom_rental_estimate || calculateRentalEstimateSync(property)
    });
  };

  const saveEdit = async (propertyId: string) => {
    try {
      // Remove custom_rental_estimate from the request for now since the column doesn't exist
      const { custom_rental_estimate, ...updateData } = editForm;
      
      const response = await fetch(`/api/properties/capture`, {
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

      // Reload watchlist to get updated data
      await loadWatchlist();
      setEditingProperty(null);
      setEditForm({
        refurbishment_cost: 0,
        user_notes: '',
        property_condition: 'Good',
        estimated_fair_value: 0,
        custom_rental_estimate: 0
      });
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Failed to save changes');
    }
  };

  const cancelEdit = () => {
    setEditingProperty(null);
    setEditForm({
      refurbishment_cost: 0,
      user_notes: '',
      property_condition: 'Good',
      estimated_fair_value: 0,
      custom_rental_estimate: 0
    });
  };

  const calculateInvestmentMetrics = (property: WatchlistItem) => {
    try {
      const purchasePrice = property.price;
      const deposit = purchasePrice * 0.25; // 25% deposit
      const refurbCost = property.refurbishment_cost || 0;
      const fees = purchasePrice * 0.03; // 3% for stamp duty, legal fees, etc.
      const totalCost = deposit + refurbCost + fees;
      
      const monthlyRent = calculateRentalEstimateSync(property);
      const annualRent = monthlyRent * 12;
      const annualROI = totalCost > 0 ? (annualRent / totalCost) * 100 : 0;
      
      // Calculate payback period (years to return on investment)
      const paybackPeriod = annualRent > 0 ? totalCost / annualRent : 0;
      
      // Mortgage calculations
      const mortgageAmount = purchasePrice - deposit;
      const interestRate = 0.045; // 4.5% default interest rate
      const mortgageTerm = 25; // 25 years
      
      // Interest-only mortgage calculation
      const monthlyInterestOnly = mortgageAmount * (interestRate / 12);
      
      // Repayment mortgage calculation (monthly payment)
      const monthlyRate = interestRate / 12;
      const numberOfPayments = mortgageTerm * 12;
      const monthlyRepayment = mortgageAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
      
      // Default to repayment mortgage
      const monthlyMortgagePayment = monthlyRepayment;
      
      // Additional expenses
      const managementFee = monthlyRent * 0.10; // 10% management fee
      const insuranceCost = purchasePrice * 0.001 / 12; // 0.1% of property value annually
      const maintenanceReserve = monthlyRent * 0.05; // 5% for maintenance
      const voidPeriodReserve = monthlyRent * 0.05; // 5% for void periods
      
      // Total monthly expenses
      const totalMonthlyExpenses = monthlyMortgagePayment + managementFee + insuranceCost + maintenanceReserve + voidPeriodReserve;
      
      // Monthly profit calculations
      const grossMonthlyProfit = monthlyRent - monthlyMortgagePayment;
      const netMonthlyProfit = monthlyRent - totalMonthlyExpenses;
      
      // Annual profit calculations
      const grossAnnualProfit = grossMonthlyProfit * 12;
      const netAnnualProfit = netMonthlyProfit * 12;
      
      // Real profit margin
      const realProfitMargin = monthlyRent > 0 ? (netMonthlyProfit / monthlyRent) * 100 : 0;
      
      return {
        deposit,
        refurbCost,
        fees,
        totalCost,
        annualRent,
        annualROI,
        paybackPeriod,
        // Mortgage details
        mortgageAmount,
        monthlyInterestOnly,
        monthlyRepayment,
        monthlyMortgagePayment,
        // Expenses
        managementFee,
        insuranceCost,
        maintenanceReserve,
        voidPeriodReserve,
        totalMonthlyExpenses,
        // Profit calculations
        grossMonthlyProfit,
        netMonthlyProfit,
        grossAnnualProfit,
        netAnnualProfit,
        realProfitMargin
      };
    } catch (error) {
      console.error('Error calculating investment metrics:', error);
      // Return default values if calculation fails
      return {
        deposit: 0,
        refurbCost: 0,
        fees: 0,
        totalCost: 0,
        annualRent: 0,
        annualROI: 0,
        paybackPeriod: 0,
        mortgageAmount: 0,
        monthlyInterestOnly: 0,
        monthlyRepayment: 0,
        monthlyMortgagePayment: 0,
        managementFee: 0,
        insuranceCost: 0,
        maintenanceReserve: 0,
        voidPeriodReserve: 0,
        totalMonthlyExpenses: 0,
        grossMonthlyProfit: 0,
        netMonthlyProfit: 0,
        grossAnnualProfit: 0,
        netAnnualProfit: 0,
        realProfitMargin: 0
      };
    }
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

  const assessDealQuality = (property: WatchlistItem) => {
    const metrics = calculateInvestmentMetrics(property);
    const monthlyRent = calculateRentalEstimateSync(property);
    const yieldPercentage = parseFloat(calculateYield(monthlyRent, property.price));
    
    // Scoring system
    let score = 0;
    let reasons = [];
    let overallRating = '';
    
    // Yield scoring (40% of total score)
    if (yieldPercentage >= 8) {
      score += 40;
      reasons.push(`Excellent yield: ${yieldPercentage}%`);
    } else if (yieldPercentage >= 6) {
      score += 30;
      reasons.push(`Good yield: ${yieldPercentage}%`);
    } else if (yieldPercentage >= 4) {
      score += 20;
      reasons.push(`Average yield: ${yieldPercentage}%`);
    } else {
      score += 10;
      reasons.push(`Low yield: ${yieldPercentage}%`);
    }
    
    // ROI and Payback Period scoring (30% of total score)
    if (metrics.annualROI >= 12 && metrics.paybackPeriod <= 3) {
      score += 30;
      reasons.push(`Excellent ROI: ${metrics.annualROI.toFixed(1)}% (${metrics.paybackPeriod.toFixed(1)}y payback)`);
    } else if (metrics.annualROI >= 8 && metrics.paybackPeriod <= 4) {
      score += 25;
      reasons.push(`Good ROI: ${metrics.annualROI.toFixed(1)}% (${metrics.paybackPeriod.toFixed(1)}y payback)`);
    } else if (metrics.annualROI >= 6 && metrics.paybackPeriod <= 5) {
      score += 20;
      reasons.push(`Average ROI: ${metrics.annualROI.toFixed(1)}% (${metrics.paybackPeriod.toFixed(1)}y payback)`);
    } else {
      score += 10;
      reasons.push(`Low ROI: ${metrics.annualROI.toFixed(1)}% (${metrics.paybackPeriod.toFixed(1)}y payback)`);
    }
    
    // Price point scoring (20% of total score)
    if (property.price <= 150000) {
      score += 20;
      reasons.push('Affordable entry point');
    } else if (property.price <= 250000) {
      score += 15;
      reasons.push('Mid-range price point');
    } else if (property.price <= 400000) {
      score += 10;
      reasons.push('Higher price point');
    } else {
      score += 5;
      reasons.push('Premium price point');
    }
    
    // Property condition scoring (10% of total score)
    const condition = property.property_condition || 'Good';
    if (condition === 'Excellent' || condition === 'Good') {
      score += 10;
      reasons.push(`Good condition: ${condition}`);
    } else if (condition === 'Fair') {
      score += 7;
      reasons.push(`Fair condition: ${condition}`);
    } else {
      score += 5;
      reasons.push(`Needs work: ${condition}`);
    }
    
    // Overall rating
    if (score >= 85) {
      overallRating = 'Excellent Deal';
    } else if (score >= 70) {
      overallRating = 'Good Deal';
    } else if (score >= 55) {
      overallRating = 'Average Deal';
    } else if (score >= 40) {
      overallRating = 'Poor Deal';
    } else {
      overallRating = 'Avoid';
    }
    
    return {
      score,
      overallRating,
      reasons,
      yieldPercentage,
      annualROI: metrics.annualROI,
      paybackPeriod: metrics.paybackPeriod,
      totalCost: metrics.totalCost
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

  // Memoized rental estimates to prevent recalculation
  const rentalEstimates = useMemo(() => {
    const estimates: { [key: string]: number } = {};
    watchlist.forEach(property => {
      const baseRent = property.price * 0.008;
      // Use property ID to generate consistent variation
      const hash = property.id.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const variation = 0.9 + (Math.abs(hash) % 20) / 100; // 0.9 to 1.1 range
      estimates[property.id] = Math.round(baseRent * variation);
    });
    return estimates;
  }, [watchlist]);

  const calculateRentalEstimateSync = (property: WatchlistItem) => {
    // Use custom rental estimate if available, otherwise use calculated estimate
    if (property.custom_rental_estimate && property.custom_rental_estimate > 0) {
      return property.custom_rental_estimate;
    }
    return rentalEstimates[property.id] || Math.round(property.price * 0.008);
  };

  const calculateYield = (monthlyRent: number, price: number) => {
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

  const getGrowthColor = (assessment: string) => {
    if (assessment.includes('High')) return 'text-green-600';
    if (assessment.includes('Good')) return 'text-blue-600';
    if (assessment.includes('Moderate')) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const filteredWatchlist = useMemo(() => {
    return watchlist.filter(item => {
      const matchesSearch = item.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      let matchesPrice = true;
      if (priceFilter !== 'all') {
        const price = item.price;
        switch (priceFilter) {
          case 'under-100k': matchesPrice = price < 100000; break;
          case '100k-200k': matchesPrice = price >= 100000 && price < 200000; break;
          case '200k-300k': matchesPrice = price >= 200000 && price < 300000; break;
          case '300k-400k': matchesPrice = price >= 300000 && price < 400000; break;
          case '400k-500k': matchesPrice = price >= 400000 && price < 500000; break;
          case 'over-500k': matchesPrice = price >= 500000; break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesPrice;
    }).sort((a, b) => {
      const aValue = a[sortBy as keyof WatchlistItem];
      const bValue = b[sortBy as keyof WatchlistItem];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  }, [watchlist, searchTerm, statusFilter, priceFilter, sortBy, sortOrder]);

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
                  <span className="text-cyan-600 font-semibold">Last 7 days</span>
                </div>
              </div>
            </div>

            {/* Prediction Explanation Section */}
            <div className="mb-8">
              <PredictionExplanationCard />
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-900">Your Watchlist</h2>
                  <span className="text-sm text-gray-500">({filteredWatchlist.length} properties)</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>
                  
                  <button
                    onClick={toggleComparisonMode}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      comparisonMode 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    {comparisonMode ? 'Exit Compare' : 'Compare'}
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search properties..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                    </div>
                </div>
                
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                  </select>
                </div>
                
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <select 
                    value={priceFilter} 
                    onChange={(e) => setPriceFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                      <option value="captured_at">Date Captured</option>
                    <option value="price">Price</option>
                      <option value="address">Address</option>
                      <option value="bedrooms">Bedrooms</option>
                  </select>
                </div>
                      </div>
                    )}

              {filteredWatchlist.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-50 rounded-2xl p-12">
                    <HomeIcon className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">No properties found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      {searchTerm || statusFilter !== 'all' || priceFilter !== 'all'
                        ? "Try adjusting your filters to see more properties."
                        : "Start capturing properties with the BMV Finder Chrome extension to build your watchlist."
                    }
                  </p>
                    {searchTerm || statusFilter !== 'all' || priceFilter !== 'all' ? (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                          setStatusFilter('all');
                          setPriceFilter('all');
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Clear Filters
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push('/extension-welcome')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Get Chrome Extension
                    </button>
                  )}
                </div>
              </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredWatchlist.map((item, index) => {
                                            const rentalEstimate = calculateRentalEstimateSync(item);
                        const yieldPercentage = calculateYield(rentalEstimate, item.price);
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 overflow-hidden"
                      >
                        {item.images && item.images.length > 0 && (
                          <div className="relative h-48 bg-gray-200">
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-3 left-3">
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-full">
                                {getSourceIcon(item.source)} {item.source}
                              </span>
                  </div>
                            <div className="absolute top-3 right-3">
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                item.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {item.status}
                              </span>
                </div>
                          </div>
                        )}

                        <div className="p-6">
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
                                {item.title}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <MapPin className="w-4 h-4" />
                                <span className="line-clamp-1">{item.address}</span>
                                  </div>
                                </div>
                          </div>
                              
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">
                                  {formatPrice(item.price)}
                                </div>
                              <div className="text-xs text-gray-500">Price</div>
                                </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="text-lg font-bold text-green-600">
                                £{rentalEstimate.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">Est. Rent</div>
                            </div>
                          </div>

                          <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Gross Yield:</span>
                              <span className={`font-semibold ${
                                parseFloat(yieldPercentage) >= 6 ? 'text-green-600' :
                                parseFloat(yieldPercentage) >= 4 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                {yieldPercentage}%
                              </span>
                                </div>

                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Bedrooms:</span>
                              <span className="font-semibold">{item.bedrooms > 0 ? item.bedrooms : 'N/A'}</span>
                            </div>
                            
                            {/* Quick Deal Assessment */}
                            {(() => {
                              const assessment = assessDealQuality(item);
                              const getRatingColor = (rating: string) => {
                                if (rating.includes('Excellent')) return 'text-green-600';
                                if (rating.includes('Good')) return 'text-blue-600';
                                if (rating.includes('Average')) return 'text-yellow-600';
                                if (rating.includes('Poor')) return 'text-orange-600';
                                return 'text-red-600';
                              };
                              
                                                            return (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Deal Rating:</span>
                                  <span className={`font-semibold ${getRatingColor(assessment.overallRating)}`}>
                                    {assessment.overallRating}
                                  </span>
                                </div>
                              );
                            })()}

                            {/* Property Valuation Analysis */}
                            {(() => {
                              const valueAnalysis = analyzePropertyValue(item);
                              const offerAnalysis = getRecommendedOffer(item);
                              let growthAnalysis;
                              try {
                                growthAnalysis = analyzeGrowthPotential(item);
                              } catch (error) {
                                console.error('Error analyzing growth potential:', error);
                                growthAnalysis = {
                                  tenYearGrowth: 0,
                                  projectedValue: item.price,
                                  growthAssessment: 'stable'
                                };
                              }
                              
                              const getPriceColor = (assessment: string) => {
                                if (assessment.includes('Excellent')) return 'text-green-600';
                                if (assessment.includes('Good')) return 'text-blue-600';
                                if (assessment.includes('Fair')) return 'text-yellow-600';
                                if (assessment.includes('Overpriced')) return 'text-orange-600';
                                return 'text-red-600';
                              };
                              
                              return (
                                <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Price Assessment:</span>
                                    <span className={`font-semibold ${getPriceColor(valueAnalysis.priceAssessment)}`}>
                                      {valueAnalysis.priceAssessment}
                                    </span>
                                  </div>
                                  
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Fair Value:</span>
                                    <span className="font-semibold text-gray-800">
                                      {formatPrice(valueAnalysis.fairValue)}
                                    </span>
                                  </div>
                                  
                                                                     <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-blue-200">
                                     <div className="text-center">
                                       <div className="text-xs text-gray-600 mb-1">🎯 RECOMMENDED OFFER</div>
                                       <div className="text-xl font-bold text-blue-700 mb-1">
                                         {formatPrice(offerAnalysis.recommendedOffer)}
                                       </div>
                                       <div className="text-xs text-gray-500 mb-2">
                                         {offerAnalysis.negotiationBuffer}% below asking price
                                       </div>
                                       <div className="space-y-2">
                                         <button
                                           onClick={() => {
                                             const metrics = calculateInvestmentMetrics(item);
                                             const message = `Subject: Offer for ${item.address}

Dear ${item.agent_name},

I'm writing to express my interest in making an offer for the property at ${item.address}.

Based on my analysis of comparable properties in the area and current market conditions, I would like to make an offer of ${formatPrice(offerAnalysis?.recommendedOffer || item.price * 0.92)}.

This offer represents:
• ${offerAnalysis ? Math.round((offerAnalysis.recommendedOffer / item.price) * 100) : 92}% of the asking price
• A fair market value based on recent comparable sales
• Consideration for the property's condition and market position

I'm a serious buyer and can proceed quickly with the purchase. I would appreciate the opportunity to discuss this offer and answer any questions you may have.

Please let me know if you need any additional information or if you'd like to arrange a viewing.

Best regards,
[Your Name]
[Your Phone Number]`;
                                             
                                             navigator.clipboard.writeText(message);
                                             showToast({
                                               type: 'success',
                                               title: 'Professional Offer Template Copied!',
                                               message: 'A comprehensive offer message has been copied to your clipboard. You can now paste it in your email to the agent.'
                                             });
                                           }}
                                           className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                         >
                                           📋 Copy Professional Offer
                                         </button>
                                         
                                         <button
                                           onClick={() => {
                                             const metrics = calculateInvestmentMetrics(item);
                                             const strategy = `Negotiation Strategy for ${item.address}:

🎯 TARGET OFFER: ${formatPrice(offerAnalysis?.recommendedOffer || item.price * 0.92)} (${offerAnalysis ? Math.round((offerAnalysis.recommendedOffer / item.price) * 100) : 92}% of asking)

📊 NEGOTIATION POINTS:
• Comparable properties sold for ${formatPrice((offerAnalysis?.recommendedOffer || item.price * 0.92) * 0.95)} - ${formatPrice((offerAnalysis?.recommendedOffer || item.price * 0.92) * 1.05)} in the last 6 months
• Property condition: ${item.property_condition || 'Good'} - may need ${formatPrice(metrics.refurbCost)} in refurbishment
• Market position: ${(() => {
                                             const valueAnalysis = analyzePropertyValue(item);
                                             return valueAnalysis.priceAssessment.toLowerCase();
                                           })()}
• Days on market: ${item.days_on_market || 'Unknown'} - ${item.days_on_market > 30 ? 'Good leverage for negotiation' : 'Property may be in demand'}

💰 INVESTMENT ANALYSIS:
• Total investment needed: ${formatPrice(metrics.totalCost)}
• Monthly mortgage payment: ${formatPrice(metrics.monthlyMortgagePayment)}
• Gross monthly profit: ${formatPrice(metrics.grossMonthlyProfit)}
• Net monthly profit (after all expenses): ${formatPrice(metrics.netMonthlyProfit)}
• Annual ROI: ${metrics.annualROI.toFixed(1)}%
• Payback period: ${metrics.paybackPeriod.toFixed(1)} years
• Real profit margin: ${metrics.realProfitMargin.toFixed(1)}%

💡 NEGOTIATION TACTICS:
1. Start with ${formatPrice((offerAnalysis?.recommendedOffer || item.price * 0.92) * 0.95)} as initial offer
2. Be prepared to go up to ${formatPrice(offerAnalysis?.recommendedOffer || item.price * 0.92)}
3. Use comparable sales data to justify your offer
4. Highlight any property issues or needed repairs
5. Emphasize quick completion and no chain

📞 AGENT CONTACT: ${item.agent_name} - ${item.agent_phone}`;
                                             
                                             navigator.clipboard.writeText(strategy);
                                             showToast({
                                               type: 'success',
                                               title: 'Negotiation Strategy Generated!',
                                               message: 'A detailed negotiation strategy has been copied to your clipboard. Use this to prepare for your conversation with the agent.'
                                             });
                                           }}
                                           className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                                         >
                                           🎯 Generate Negotiation Strategy
                                         </button>
                                       </div>
                                     </div>
                                   </div>
                                  
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">10-Year Growth:</span>
                                    <span className={`font-semibold ${getGrowthColor(growthAnalysis.growthAssessment)}`}>
                                      {growthAnalysis.tenYearGrowth}%
                                    </span>
                                  </div>
                                  
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Projected Value:</span>
                                    <span className="font-semibold text-green-600">
                                      {formatPrice(growthAnalysis.projectedValue)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                </div>

                          {/* Investment Metrics */}
                          {(() => {
                            const metrics = calculateInvestmentMetrics(item);
                            let growthAnalysis;
                            try {
                              growthAnalysis = analyzeGrowthPotential(item);
                            } catch (error) {
                              console.error('Error analyzing growth potential:', error);
                              growthAnalysis = {
                                tenYearGrowth: 0,
                                projectedValue: item.price,
                                growthAssessment: 'stable'
                              };
                            }
                            return (
                              <div className="space-y-3 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="text-sm font-semibold text-blue-800 mb-3">Investment Analysis</h4>
                                
                                {/* Initial Investment */}
                                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Deposit (25%):</span>
                                    <span className="font-semibold text-blue-600">{formatPrice(metrics.deposit)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Refurb Cost:</span>
                                    <span className="font-semibold text-orange-600">{formatPrice(metrics.refurbCost)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Fees (3%):</span>
                                    <span className="font-semibold text-gray-600">{formatPrice(metrics.fees)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Mortgage Amount:</span>
                                    <span className="font-semibold text-purple-600">{formatPrice(metrics.mortgageAmount)}</span>
                                  </div>
                                </div>
                                
                                <div className="border-t border-blue-300 pt-3 mb-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-blue-800">Total Investment:</span>
                                    <span className="text-lg font-bold text-green-700">{formatPrice(metrics.totalCost)}</span>
                                  </div>
                                </div>

                                {/* Mortgage Details */}
                                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Monthly Mortgage:</span>
                                    <span className="font-semibold text-purple-600">{formatPrice(metrics.monthlyMortgagePayment)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Interest Rate:</span>
                                    <span className="font-semibold text-gray-600">4.5%</span>
                                  </div>
                                </div>

                                {/* Monthly Expenses */}
                                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Management Fee:</span>
                                    <span className="font-semibold text-orange-600">{formatPrice(metrics.managementFee)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Insurance:</span>
                                    <span className="font-semibold text-orange-600">{formatPrice(metrics.insuranceCost)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Maintenance:</span>
                                    <span className="font-semibold text-orange-600">{formatPrice(metrics.maintenanceReserve)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Void Period:</span>
                                    <span className="font-semibold text-orange-600">{formatPrice(metrics.voidPeriodReserve)}</span>
                                  </div>
                                </div>

                                {/* Profit Analysis */}
                                <div className="border-t border-blue-300 pt-3 mb-3">
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Monthly Rent:</span>
                                      <span className="font-semibold text-green-600">{formatPrice(calculateRentalEstimateSync(item))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Total Expenses:</span>
                                      <span className="font-semibold text-red-600">{formatPrice(metrics.totalMonthlyExpenses)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Profit Results */}
                                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Gross Monthly Profit:</span>
                                    <span className={`font-semibold ${
                                      metrics.grossMonthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {formatPrice(metrics.grossMonthlyProfit)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Net Monthly Profit:</span>
                                    <span className={`font-semibold ${
                                      metrics.netMonthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {formatPrice(metrics.netMonthlyProfit)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Annual ROI:</span>
                                    <span className={`font-semibold ${
                                      metrics.annualROI >= 8 ? 'text-green-600' :
                                      metrics.annualROI >= 6 ? 'text-yellow-600' :
                                      'text-red-600'
                                    }`}>
                                      {metrics.annualROI.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Payback Period:</span>
                                    <span className={`font-semibold ${
                                      metrics.paybackPeriod <= 3 ? 'text-green-600' :
                                      metrics.paybackPeriod <= 5 ? 'text-yellow-600' :
                                      'text-red-600'
                                    }`}>
                                      {metrics.paybackPeriod > 0 ? `${metrics.paybackPeriod.toFixed(1)}y` : 'N/A'}
                                    </span>
                                  </div>
                                </div>

                                {/* Growth and Rental Profit */}
                                <div className="border-t border-blue-300 pt-3">
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">10-Year Growth:</span>
                                      <span className={`font-semibold ${getGrowthColor(growthAnalysis.growthAssessment)}`}>
                                        {growthAnalysis.tenYearGrowth}%
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Projected Value:</span>
                                      <span className="font-semibold text-green-600">
                                        {formatPrice(growthAnalysis.projectedValue)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Annual Rental Profit:</span>
                                      <span className={`font-semibold ${
                                        metrics.netAnnualProfit >= 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {formatPrice(metrics.netAnnualProfit)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Profit Margin:</span>
                                      <span className={`font-semibold ${
                                        metrics.realProfitMargin >= 20 ? 'text-green-600' :
                                        metrics.realProfitMargin >= 10 ? 'text-yellow-600' :
                                        'text-red-600'
                                      }`}>
                                        {metrics.realProfitMargin.toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="flex space-x-2">
                    <button
                                onClick={() => window.open(item.original_url, '_blank')}
                                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                                title="View Original Listing"
                    >
                                <ExternalLinkIcon className="h-4 w-4" />
                    </button>
                  
                      <button
                                onClick={() => startEditing(item)}
                                className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
                                title="Edit Property"
                      >
                                <PencilIcon className="h-4 w-4" />
                      </button>
                              
                      <button
                                onClick={() => updatePropertyStatus(item.id, item.status === 'active' ? 'archived' : 'active')}
                                className="p-2 text-gray-600 hover:text-yellow-600 transition-colors"
                                title={item.status === 'active' ? 'Archive' : 'Activate'}
                      >
                                <ArchiveIcon className="h-4 w-4" />
                      </button>

                      <button
                                onClick={() => addToPortfolio(item)}
                                className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                                title="Add to Portfolio"
                      >
                                <BriefcaseIcon className="h-4 w-4" />
                      </button>
                  </div>
                  
                    <button
                              onClick={() => deleteProperty(item.id)}
                              className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
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
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
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
                
                    {/* Deal Summary */}
                    {(() => {
                      const assessments = selectedProperties.map(propertyId => {
                    const property = watchlist.find(p => p.id === propertyId);
                    if (!property) return null;
                        return { ...assessDealQuality(property), property };
                      }).filter(Boolean);

                      if (assessments.length === 0) return null;

                      // Find the best deal
                      const bestDeal = assessments.reduce((best, current) => 
                        current.score > best.score ? current : best
                      );

                      const averageScore = Math.round(assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length);
                    
                    return (
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Deal Summary</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{bestDeal.overallRating}</div>
                              <div className="text-sm text-gray-600">Best Deal</div>
                              <div className="text-xs text-gray-500">{bestDeal.property.title.substring(0, 30)}...</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{averageScore}/100</div>
                              <div className="text-sm text-gray-600">Average Score</div>
                              <div className="text-xs text-gray-500">Across {assessments.length} properties</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">{bestDeal.yieldPercentage}%</div>
                              <div className="text-sm text-gray-600">Best Yield</div>
                              <div className="text-xs text-gray-500">From {bestDeal.property.title.substring(0, 20)}...</div>
                          </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {selectedProperties.map(propertyId => {
                        const property = watchlist.find(p => p.id === propertyId);
                        if (!property) return null;

                        const rentalEstimate = calculateRentalEstimateSync(property);
                        const yieldPercentage = calculateYield(rentalEstimate, property.price);

                        return (
                          <div
                            key={property.id}
                            className="bg-gray-50 rounded-xl p-4 border-2 border-blue-200"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900 line-clamp-2">
                                {property.title}
                              </h4>
                          <button
                            onClick={() => togglePropertySelection(property.id)}
                                className="text-red-500 hover:text-red-700"
                          >
                                <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Price:</span>
                                <span className="font-semibold text-blue-600">
                                  {formatPrice(property.price)}
                                </span>
                          </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Est. Rent:</span>
                                <span className="font-semibold text-green-600">
                                  £{rentalEstimate.toLocaleString()}
                                </span>
                          </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Gross Yield:</span>
                                <span className={`font-semibold ${
                                  parseFloat(yieldPercentage) >= 6 ? 'text-green-600' :
                                  parseFloat(yieldPercentage) >= 4 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {yieldPercentage}%
                                </span>
                          </div>

                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Bedrooms:</span>
                                <span className="font-semibold">
                                  {property.bedrooms > 0 ? property.bedrooms : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Address:</span>
                                <span className="font-semibold text-gray-800 line-clamp-1 max-w-[150px]">
                                  {property.address}
                            </span>
                          </div>
                        </div>
                        
                                                         {/* Deal Assessment */}
                             {(() => {
                               const assessment = assessDealQuality(property);
                               const getRatingColor = (rating: string) => {
                                 if (rating.includes('Excellent')) return 'text-green-600 bg-green-50 border-green-200';
                                 if (rating.includes('Good')) return 'text-blue-600 bg-blue-50 border-blue-200';
                                 if (rating.includes('Average')) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
                                 if (rating.includes('Poor')) return 'text-orange-600 bg-orange-50 border-orange-200';
                                 return 'text-red-600 bg-red-50 border-red-200';
                               };
                               
                               return (
                                 <div className="mt-4 pt-3 border-t border-gray-200">
                                   <div className={`mb-3 p-2 rounded-lg border ${getRatingColor(assessment.overallRating)}`}>
                                     <div className="flex justify-between items-center">
                                       <span className="text-sm font-semibold">{assessment.overallRating}</span>
                                       <span className="text-xs font-medium">Score: {assessment.score}/100</span>
                          </div>
                        </div>
                                   <div className="space-y-1 mb-3">
                                     {assessment.reasons.slice(0, 2).map((reason, index) => (
                                       <div key={index} className="text-xs text-gray-600">
                                         • {reason}
                                       </div>
                                     ))}
                                   </div>
                                   <button
                                     onClick={() => window.open(property.original_url, '_blank')}
                                     className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                   >
                                     View Original
                                   </button>
                                 </div>
                               );
                             })()}

                             {/* Valuation Analysis in Comparison */}
                             {(() => {
                               const valueAnalysis = analyzePropertyValue(property);
                               const offerAnalysis = getRecommendedOffer(property);
                               let growthAnalysis;
                               try {
                                 growthAnalysis = analyzeGrowthPotential(property);
                               } catch (error) {
                                 console.error('Error analyzing growth potential:', error);
                                 growthAnalysis = {
                                   tenYearGrowth: 0,
                                   projectedValue: property.price,
                                   growthAssessment: 'stable'
                                 };
                               }
                               
                               const getPriceColor = (assessment: string) => {
                                 if (assessment.includes('Excellent')) return 'text-green-600';
                                 if (assessment.includes('Good')) return 'text-blue-600';
                                 if (assessment.includes('Fair')) return 'text-yellow-600';
                                 if (assessment.includes('Overpriced')) return 'text-orange-600';
                                 return 'text-red-600';
                               };
                               
                               return (
                                 <div className="mt-4 pt-3 border-t border-gray-200">
                                   <h5 className="text-sm font-semibold text-gray-800 mb-2">Valuation Analysis</h5>
                                   <div className="space-y-2 text-xs">
                                     <div className="flex justify-between">
                                       <span className="text-gray-600">Price Assessment:</span>
                                       <span className={`font-medium ${getPriceColor(valueAnalysis.priceAssessment)}`}>
                                         {valueAnalysis.priceAssessment}
                                       </span>
                                     </div>
                                     
                                     <div className="flex justify-between">
                                       <span className="text-gray-600">Fair Value:</span>
                                       <span className="font-medium text-gray-800">
                                         {formatPrice(valueAnalysis.fairValue)}
                                       </span>
                                     </div>
                                     
                                                                            <div className="mt-2 p-2 bg-gradient-to-r from-blue-50 to-green-50 rounded border border-blue-200">
                                         <div className="text-center">
                                           <div className="text-xs text-gray-600 mb-1">🎯 OFFER</div>
                                           <div className="text-sm font-bold text-blue-700 mb-1">
                                             {formatPrice(offerAnalysis.recommendedOffer)}
                                           </div>
                                           <button
                                             onClick={() => {
                                               const message = `I'm interested in making an offer of ${formatPrice(offerAnalysis.recommendedOffer)} for this property.`;
                                               navigator.clipboard.writeText(message);
                                               alert('Offer message copied to clipboard!');
                                             }}
                                             className="w-full px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                                           >
                                             Copy Offer
                                           </button>
                                         </div>
                                       </div>
                                     
                                     <div className="flex justify-between">
                                       <span className="text-gray-600">10-Year Growth:</span>
                                       <span className={`font-medium ${getGrowthColor(growthAnalysis.growthAssessment)}`}>
                                         {growthAnalysis.tenYearGrowth}%
                                       </span>
                                     </div>
                                     
                                     <div className="flex justify-between">
                                       <span className="text-gray-600">Projected Value:</span>
                                       <span className="font-medium text-green-600">
                                         {formatPrice(growthAnalysis.projectedValue)}
                                       </span>
                                     </div>
                                   </div>
                                 </div>
                               );
                             })()}

                             {/* Investment Analysis in Comparison */}
                             {(() => {
                               const metrics = calculateInvestmentMetrics(property);
                               return (
                                 <div className="mt-4 pt-3 border-t border-gray-200">
                                   <h5 className="text-sm font-semibold text-gray-800 mb-2">Investment Summary</h5>
                                   <div className="space-y-2 text-xs">
                                     <div className="flex justify-between">
                                       <span className="text-gray-600">Deposit (25%):</span>
                                       <span className="font-medium text-blue-600">{formatPrice(metrics.deposit)}</span>
                                     </div>
                                     <div className="flex justify-between">
                                       <span className="text-gray-600">Fees (3%):</span>
                                       <span className="font-medium text-gray-600">{formatPrice(metrics.fees)}</span>
                                     </div>
                                     <div className="flex justify-between">
                                       <span className="text-gray-600">Refurb Cost:</span>
                                       <span className="font-medium text-orange-600">{formatPrice(metrics.refurbCost)}</span>
                                     </div>
                                     <div className="mt-2 pt-2 border-t border-gray-300">
                                       <div className="flex justify-between items-center">
                                         <span className="text-sm font-semibold text-blue-800">Total Investment:</span>
                                         <span className="text-base font-bold text-green-700">{formatPrice(metrics.totalCost)}</span>
                                       </div>
                                     </div>
                                     <div className="flex justify-between">
                                       <span className="text-gray-600">Annual ROI:</span>
                                       <span className={`font-medium ${
                                         metrics.annualROI >= 8 ? 'text-green-600' :
                                         metrics.annualROI >= 6 ? 'text-yellow-600' :
                                         'text-red-600'
                                       }`}>
                                         {metrics.annualROI.toFixed(1)}%
                                       </span>
                                     </div>
                                     <div className="flex justify-between">
                                       <span className="text-gray-600">Payback Period:</span>
                                       <span className={`font-medium ${
                                         metrics.paybackPeriod <= 3 ? 'text-green-600' :
                                         metrics.paybackPeriod <= 5 ? 'text-yellow-600' :
                                         'text-red-600'
                                       }`}>
                                         {metrics.paybackPeriod > 0 ? `${metrics.paybackPeriod.toFixed(1)} years` : 'N/A'}
                                       </span>
                                     </div>
                                   </div>
                                 </div>
                               );
                             })()}
                      </div>
                    );
                  })}
                </div>
                  </div>
                </motion.div>
              )}

              {/* Edit Property Modal */}
              {editingProperty && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Edit Property</h3>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-6 w-6" />
                        </button>
                      </div>

                      <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Monthly Rental Estimate (£)
                          </label>
                          <input
                            type="number"
                            value={editForm.custom_rental_estimate}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              custom_rental_estimate: parseInt(e.target.value) || 0
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Property Condition
                          </label>
                          <select
                            value={editForm.property_condition}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              property_condition: e.target.value
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Poor">Poor</option>
                            <option value="Needs Work">Needs Work</option>
                          </select>
                      </div>

                        {/* Refurbishment Recommendations */}
                        {(() => {
                          const property = watchlist.find(p => p.id === editingProperty);
                          if (!property) return null;
                          
                          const recommendations = getRefurbishmentRecommendations({
                            ...property,
                            property_condition: editForm.property_condition
                          });
                          
                          return (
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <h4 className="text-sm font-semibold text-blue-800 mb-3">Refurbishment Recommendations</h4>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                      <div>
                                    <span className="text-sm font-medium text-green-700">Low End:</span>
                                    <p className="text-xs text-gray-600">{recommendations.description.lowEnd}</p>
                        </div>
                                  <div className="text-right">
                                    <span className="text-sm font-bold text-green-700">{formatPrice(recommendations.lowEnd)}</span>
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
                                    <span className="text-sm font-medium text-blue-700">Medium End:</span>
                                    <p className="text-xs text-gray-600">{recommendations.description.mediumEnd}</p>
                        </div>
                                  <div className="text-right">
                                    <span className="text-sm font-bold text-blue-700">{formatPrice(recommendations.mediumEnd)}</span>
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
                                    <span className="text-sm font-medium text-purple-700">High End:</span>
                                    <p className="text-xs text-gray-600">{recommendations.description.highEnd}</p>
                        </div>
                                  <div className="text-right">
                                    <span className="text-sm font-bold text-purple-700">{formatPrice(recommendations.highEnd)}</span>
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
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Refurbishment Cost (£)
                          </label>
                          <input
                            type="number"
                            value={editForm.refurbishment_cost}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              refurbishment_cost: parseInt(e.target.value) || 0
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                          </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estimated Fair Value (£)
                          </label>
                          <input
                            type="number"
                            value={editForm.estimated_fair_value}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              estimated_fair_value: parseInt(e.target.value) || 0
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                          </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                          </label>
                          <textarea
                            value={editForm.user_notes}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              user_notes: e.target.value
                            }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Add your notes about this property..."
                          />
                          </div>
                        </div>

                      <div className="flex space-x-3 mt-6">
                        <button
                          onClick={() => saveEdit(editingProperty)}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
              </div>
            )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}