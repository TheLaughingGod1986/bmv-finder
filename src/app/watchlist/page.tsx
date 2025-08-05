'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useToast } from '../components/ToastProvider';
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
  const { showToast } = useToast();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('captured_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['quick-metrics']));
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
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
    
    // Format the offer date for HTML date input (YYYY-MM-DD)
    let formattedOfferDate = '';
    if (property.offer_date) {
      try {
        const date = new Date(property.offer_date);
        if (!isNaN(date.getTime())) {
          formattedOfferDate = date.toISOString().split('T')[0];
        }
      } catch (error) {
        console.warn('Invalid offer date format:', property.offer_date);
      }
    }
    
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
      offer_date: formattedOfferDate,
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
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return 'Invalid date';
    }
  };

  // Validate image URL
  const isValidImageUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    
    // Check if URL is valid
    try {
      new URL(url);
    } catch {
      return false;
    }
    
    // Check if it's an image URL
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext));
    
    // Check if it's from a known property website
    const knownDomains = [
      'zoopla.co.uk',
      'rightmove.co.uk',
      'onthemarket.com',
      'primelocation.com',
      'st.zoocdn.com',
      'media.rightmove.co.uk',
      'images.zoopla.co.uk',
      'media.onthemarket.com',
      'media.primelocation.com'
    ];
    
    const hasKnownDomain = knownDomains.some(domain => url.includes(domain));
    
    return hasImageExtension || hasKnownDomain;
  };

  // Get valid image URL
  const getValidImageUrl = (images: string[]): string | null => {
    if (!images || !Array.isArray(images)) return null;
    
    for (const imageUrl of images) {
      if (isValidImageUrl(imageUrl)) {
        return imageUrl;
      }
    }
    
    return null;
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'rightmove': return '🏠';
      case 'zoopla': return '🏘️';
      case 'onthemarket': return '🏡';
      default: return '📋';
    }
  };

  // Calculate rental demand based on location, property type, and market factors
  const calculateRentalDemand = (property: WatchlistItem) => {
    const postcode = property.postcode?.toUpperCase() || '';
    const propertyType = property.property_type?.toLowerCase() || '';
    const bedrooms = property.bedrooms || 2;
    
    // High demand areas (major cities, university towns, commuter hotspots)
    const highDemandAreas = [
      'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17', 'M18', 'M19', 'M20', 'M21', 'M22', 'M23', 'M24', 'M25', 'M26', 'M27', 'M28', 'M29', 'M30', 'M31', 'M32', 'M33', 'M34', 'M35', 'M36', 'M37', 'M38', 'M39', 'M40', 'M41', 'M42', 'M43', 'M44', 'M45', 'M46', 'M47', 'M48', 'M49', 'M50', 'M51', 'M52', 'M53', 'M54', 'M55', 'M56', 'M57', 'M58', 'M59', 'M60', 'M61', 'M62', 'M63', 'M64', 'M65', 'M66', 'M67', 'M68', 'M69', 'M70', 'M71', 'M72', 'M73', 'M74', 'M75', 'M76', 'M77', 'M78', 'M79', 'M80', 'M81', 'M82', 'M83', 'M84', 'M85', 'M86', 'M87', 'M88', 'M89', 'M90', 'M91', 'M92', 'M93', 'M94', 'M95', 'M96', 'M97', 'M98', 'M99', // Manchester
      'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12', 'L13', 'L14', 'L15', 'L16', 'L17', 'L18', 'L19', 'L20', 'L21', 'L22', 'L23', 'L24', 'L25', 'L26', 'L27', 'L28', 'L29', 'L30', 'L31', 'L32', 'L33', 'L34', 'L35', 'L36', 'L37', 'L38', 'L39', 'L40', 'L41', 'L42', 'L43', 'L44', 'L45', 'L46', 'L47', 'L48', 'L49', 'L50', 'L51', 'L52', 'L53', 'L54', 'L55', 'L56', 'L57', 'L58', 'L59', 'L60', 'L61', 'L62', 'L63', 'L64', 'L65', 'L66', 'L67', 'L68', 'L69', 'L70', 'L71', 'L72', 'L73', 'L74', 'L75', 'L76', 'L77', 'L78', 'L79', 'L80', 'L81', 'L82', 'L83', 'L84', 'L85', 'L86', 'L87', 'L88', 'L89', 'L90', 'L91', 'L92', 'L93', 'L94', 'L95', 'L96', 'L97', 'L98', 'L99', // Liverpool
      'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16', 'B17', 'B18', 'B19', 'B20', 'B21', 'B22', 'B23', 'B24', 'B25', 'B26', 'B27', 'B28', 'B29', 'B30', 'B31', 'B32', 'B33', 'B34', 'B35', 'B36', 'B37', 'B38', 'B39', 'B40', 'B41', 'B42', 'B43', 'B44', 'B45', 'B46', 'B47', 'B48', 'B49', 'B50', 'B51', 'B52', 'B53', 'B54', 'B55', 'B56', 'B57', 'B58', 'B59', 'B60', 'B61', 'B62', 'B63', 'B64', 'B65', 'B66', 'B67', 'B68', 'B69', 'B70', 'B71', 'B72', 'B73', 'B74', 'B75', 'B76', 'B77', 'B78', 'B79', 'B80', 'B81', 'B82', 'B83', 'B84', 'B85', 'B86', 'B87', 'B88', 'B89', 'B90', 'B91', 'B92', 'B93', 'B94', 'B95', 'B96', 'B97', 'B98', 'B99', // Birmingham
      'BS1', 'BS2', 'BS3', 'BS4', 'BS5', 'BS6', 'BS7', 'BS8', 'BS9', 'BS10', 'BS11', 'BS12', 'BS13', 'BS14', 'BS15', 'BS16', 'BS17', 'BS18', 'BS19', 'BS20', 'BS21', 'BS22', 'BS23', 'BS24', 'BS25', 'BS26', 'BS27', 'BS28', 'BS29', 'BS30', 'BS31', 'BS32', 'BS33', 'BS34', 'BS35', 'BS36', 'BS37', 'BS38', 'BS39', 'BS40', 'BS41', 'BS42', 'BS43', 'BS44', 'BS45', 'BS46', 'BS47', 'BS48', 'BS49', 'BS50', 'BS51', 'BS52', 'BS53', 'BS54', 'BS55', 'BS56', 'BS57', 'BS58', 'BS59', 'BS60', 'BS61', 'BS62', 'BS63', 'BS64', 'BS65', 'BS66', 'BS67', 'BS68', 'BS69', 'BS70', 'BS71', 'BS72', 'BS73', 'BS74', 'BS75', 'BS76', 'BS77', 'BS78', 'BS79', 'BS80', 'BS81', 'BS82', 'BS83', 'BS84', 'BS85', 'BS86', 'BS87', 'BS88', 'BS89', 'BS90', 'BS91', 'BS92', 'BS93', 'BS94', 'BS95', 'BS96', 'BS97', 'BS98', 'BS99', // Bristol
      'EH1', 'EH2', 'EH3', 'EH4', 'EH5', 'EH6', 'EH7', 'EH8', 'EH9', 'EH10', 'EH11', 'EH12', 'EH13', 'EH14', 'EH15', 'EH16', 'EH17', 'EH18', 'EH19', 'EH20', 'EH21', 'EH22', 'EH23', 'EH24', 'EH25', 'EH26', 'EH27', 'EH28', 'EH29', 'EH30', 'EH31', 'EH32', 'EH33', 'EH34', 'EH35', 'EH36', 'EH37', 'EH38', 'EH39', 'EH40', 'EH41', 'EH42', 'EH43', 'EH44', 'EH45', 'EH46', 'EH47', 'EH48', 'EH49', 'EH50', 'EH51', 'EH52', 'EH53', 'EH54', 'EH55', 'EH56', 'EH57', 'EH58', 'EH59', 'EH60', 'EH61', 'EH62', 'EH63', 'EH64', 'EH65', 'EH66', 'EH67', 'EH68', 'EH69', 'EH70', 'EH71', 'EH72', 'EH73', 'EH74', 'EH75', 'EH76', 'EH77', 'EH78', 'EH79', 'EH80', 'EH81', 'EH82', 'EH83', 'EH84', 'EH85', 'EH86', 'EH87', 'EH88', 'EH89', 'EH90', 'EH91', 'EH92', 'EH93', 'EH94', 'EH95', 'EH96', 'EH97', 'EH98', 'EH99', // Edinburgh
      'BA1', 'BA2', 'BA3', 'BA4', 'BA5', 'BA6', 'BA7', 'BA8', 'BA9', 'BA10', 'BA11', 'BA12', 'BA13', 'BA14', 'BA15', 'BA16', 'BA17', 'BA18', 'BA19', 'BA20', 'BA21', 'BA22', 'BA23', 'BA24', 'BA25', 'BA26', 'BA27', 'BA28', 'BA29', 'BA30', 'BA31', 'BA32', 'BA33', 'BA34', 'BA35', 'BA36', 'BA37', 'BA38', 'BA39', 'BA40', 'BA41', 'BA42', 'BA43', 'BA44', 'BA45', 'BA46', 'BA47', 'BA48', 'BA49', 'BA50', 'BA51', 'BA52', 'BA53', 'BA54', 'BA55', 'BA56', 'BA57', 'BA58', 'BA59', 'BA60', 'BA61', 'BA62', 'BA63', 'BA64', 'BA65', 'BA66', 'BA67', 'BA68', 'BA69', 'BA70', 'BA71', 'BA72', 'BA73', 'BA74', 'BA75', 'BA76', 'BA77', 'BA78', 'BA79', 'BA80', 'BA81', 'BA82', 'BA83', 'BA84', 'BA85', 'BA86', 'BA87', 'BA88', 'BA89', 'BA90', 'BA91', 'BA92', 'BA93', 'BA94', 'BA95', 'BA96', 'BA97', 'BA98', 'BA99', // Bath
      'GL1', 'GL2', 'GL3', 'GL4', 'GL5', 'GL6', 'GL7', 'GL8', 'GL9', 'GL10', 'GL11', 'GL12', 'GL13', 'GL14', 'GL15', 'GL16', 'GL17', 'GL18', 'GL19', 'GL20', 'GL21', 'GL22', 'GL23', 'GL24', 'GL25', 'GL26', 'GL27', 'GL28', 'GL29', 'GL30', 'GL31', 'GL32', 'GL33', 'GL34', 'GL35', 'GL36', 'GL37', 'GL38', 'GL39', 'GL40', 'GL41', 'GL42', 'GL43', 'GL44', 'GL45', 'GL46', 'GL47', 'GL48', 'GL49', 'GL50', 'GL51', 'GL52', 'GL53', 'GL54', 'GL55', 'GL56', 'GL57', 'GL58', 'GL59', 'GL60', 'GL61', 'GL62', 'GL63', 'GL64', 'GL65', 'GL66', 'GL67', 'GL68', 'GL69', 'GL70', 'GL71', 'GL72', 'GL73', 'GL74', 'GL75', 'GL76', 'GL77', 'GL78', 'GL79', 'GL80', 'GL81', 'GL82', 'GL83', 'GL84', 'GL85', 'GL86', 'GL87', 'GL88', 'GL89', 'GL90', 'GL91', 'GL92', 'GL93', 'GL94', 'GL95', 'GL96', 'GL97', 'GL98', 'GL99', // Cheltenham
      'CF1', 'CF2', 'CF3', 'CF4', 'CF5', 'CF6', 'CF7', 'CF8', 'CF9', 'CF10', 'CF11', 'CF12', 'CF13', 'CF14', 'CF15', 'CF16', 'CF17', 'CF18', 'CF19', 'CF20', 'CF21', 'CF22', 'CF23', 'CF24', 'CF25', 'CF26', 'CF27', 'CF28', 'CF29', 'CF30', 'CF31', 'CF32', 'CF33', 'CF34', 'CF35', 'CF36', 'CF37', 'CF38', 'CF39', 'CF40', 'CF41', 'CF42', 'CF43', 'CF44', 'CF45', 'CF46', 'CF47', 'CF48', 'CF49', 'CF50', 'CF51', 'CF52', 'CF53', 'CF54', 'CF55', 'CF56', 'CF57', 'CF58', 'CF59', 'CF60', 'CF61', 'CF62', 'CF63', 'CF64', 'CF65', 'CF66', 'CF67', 'CF68', 'CF69', 'CF70', 'CF71', 'CF72', 'CF73', 'CF74', 'CF75', 'CF76', 'CF77', 'CF78', 'CF79', 'CF80', 'CF81', 'CF82', 'CF83', 'CF84', 'CF85', 'CF86', 'CF87', 'CF88', 'CF89', 'CF90', 'CF91', 'CF92', 'CF93', 'CF94', 'CF95', 'CF96', 'CF97', 'CF98', 'CF99' // Cardiff
    ];
    
    // Medium demand areas (smaller cities, commuter towns)
    const mediumDemandAreas = [
      'LS1', 'LS2', 'LS3', 'LS4', 'LS5', 'LS6', 'LS7', 'LS8', 'LS9', 'LS10', 'LS11', 'LS12', 'LS13', 'LS14', 'LS15', 'LS16', 'LS17', 'LS18', 'LS19', 'LS20', 'LS21', 'LS22', 'LS23', 'LS24', 'LS25', 'LS26', 'LS27', 'LS28', 'LS29', 'LS30', 'LS31', 'LS32', 'LS33', 'LS34', 'LS35', 'LS36', 'LS37', 'LS38', 'LS39', 'LS40', 'LS41', 'LS42', 'LS43', 'LS44', 'LS45', 'LS46', 'LS47', 'LS48', 'LS49', 'LS50', 'LS51', 'LS52', 'LS53', 'LS54', 'LS55', 'LS56', 'LS57', 'LS58', 'LS59', 'LS60', 'LS61', 'LS62', 'LS63', 'LS64', 'LS65', 'LS66', 'LS67', 'LS68', 'LS69', 'LS70', 'LS71', 'LS72', 'LS73', 'LS74', 'LS75', 'LS76', 'LS77', 'LS78', 'LS79', 'LS80', 'LS81', 'LS82', 'LS83', 'LS84', 'LS85', 'LS86', 'LS87', 'LS88', 'LS89', 'LS90', 'LS91', 'LS92', 'LS93', 'LS94', 'LS95', 'LS96', 'LS97', 'LS98', 'LS99', // Leeds
      'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19', 'S20', 'S21', 'S22', 'S23', 'S24', 'S25', 'S26', 'S27', 'S28', 'S29', 'S30', 'S31', 'S32', 'S33', 'S34', 'S35', 'S36', 'S37', 'S38', 'S39', 'S40', 'S41', 'S42', 'S43', 'S44', 'S45', 'S46', 'S47', 'S48', 'S49', 'S50', 'S51', 'S52', 'S53', 'S54', 'S55', 'S56', 'S57', 'S58', 'S59', 'S60', 'S61', 'S62', 'S63', 'S64', 'S65', 'S66', 'S67', 'S68', 'S69', 'S70', 'S71', 'S72', 'S73', 'S74', 'S75', 'S76', 'S77', 'S78', 'S79', 'S80', 'S81', 'S82', 'S83', 'S84', 'S85', 'S86', 'S87', 'S88', 'S89', 'S90', 'S91', 'S92', 'S93', 'S94', 'S95', 'S96', 'S97', 'S98', 'S99', // Sheffield
      'NG1', 'NG2', 'NG3', 'NG4', 'NG5', 'NG6', 'NG7', 'NG8', 'NG9', 'NG10', 'NG11', 'NG12', 'NG13', 'NG14', 'NG15', 'NG16', 'NG17', 'NG18', 'NG19', 'NG20', 'NG21', 'NG22', 'NG23', 'NG24', 'NG25', 'NG26', 'NG27', 'NG28', 'NG29', 'NG30', 'NG31', 'NG32', 'NG33', 'NG34', 'NG35', 'NG36', 'NG37', 'NG38', 'NG39', 'NG40', 'NG41', 'NG42', 'NG43', 'NG44', 'NG45', 'NG46', 'NG47', 'NG48', 'NG49', 'NG50', 'NG51', 'NG52', 'NG53', 'NG54', 'NG55', 'NG56', 'NG57', 'NG58', 'NG59', 'NG60', 'NG61', 'NG62', 'NG63', 'NG64', 'NG65', 'NG66', 'NG67', 'NG68', 'NG69', 'NG70', 'NG71', 'NG72', 'NG73', 'NG74', 'NG75', 'NG76', 'NG77', 'NG78', 'NG79', 'NG80', 'NG81', 'NG82', 'NG83', 'NG84', 'NG85', 'NG86', 'NG87', 'NG88', 'NG89', 'NG90', 'NG91', 'NG92', 'NG93', 'NG94', 'NG95', 'NG96', 'NG97', 'NG98', 'NG99' // Nottingham
    ];
    
    // Check if postcode is in high or medium demand areas
    const postcodePrefix = postcode.substring(0, 3).toUpperCase();
    const isHighDemand = highDemandAreas.includes(postcodePrefix);
    const isMediumDemand = mediumDemandAreas.includes(postcodePrefix);
    
    // Property type demand factors
    const propertyTypeDemand = {
      'flat': 0.9,      // High demand for flats in cities
      'apartment': 0.9, // High demand for apartments in cities
      'house': 0.7,     // Good demand for houses
      'semi-detached': 0.8, // Very good demand
      'detached': 0.6,  // Lower demand (higher price point)
      'terraced': 0.85, // High demand (good value)
      'studio': 0.95,   // Very high demand in cities
      'bedsit': 0.7     // Moderate demand
    };
    
    // Bedroom demand factors (2-3 beds are most popular)
    const bedroomDemand = {
      1: 0.8,   // Good demand for 1-bed properties
      2: 1.0,   // Highest demand (baseline)
      3: 0.95,  // Very high demand
      4: 0.7,   // Lower demand (family homes)
      5: 0.5,   // Much lower demand
      6: 0.3    // Very low demand
    };
    
    // Calculate base demand score
    let demandScore = 0;
    
    if (isHighDemand) {
      demandScore = 85; // High demand areas start at 85
    } else if (isMediumDemand) {
      demandScore = 70; // Medium demand areas start at 70
    } else {
      demandScore = 50; // Other areas start at 50
    }
    
    // Apply property type multiplier
    const typeMultiplier = propertyTypeDemand[propertyType as keyof typeof propertyTypeDemand] || 0.7;
    demandScore *= typeMultiplier;
    
    // Apply bedroom multiplier
    const bedMultiplier = bedroomDemand[bedrooms as keyof typeof bedroomDemand] || 0.7;
    demandScore *= bedMultiplier;
    
    // Add some randomness to make it more realistic
    const randomFactor = 0.9 + (Math.random() * 0.2); // ±10% variation
    demandScore *= randomFactor;
    
    // Ensure score is between 0-100
    demandScore = Math.max(0, Math.min(100, Math.round(demandScore)));
    
    // Convert to demand level
    let demandLevel = '';
    let demandColor = '';
    
    if (demandScore >= 80) {
      demandLevel = 'Very High';
      demandColor = 'text-green-600';
    } else if (demandScore >= 65) {
      demandLevel = 'High';
      demandColor = 'text-blue-600';
    } else if (demandScore >= 50) {
      demandLevel = 'Medium';
      demandColor = 'text-yellow-600';
    } else if (demandScore >= 35) {
      demandLevel = 'Low';
      demandColor = 'text-orange-600';
    } else {
      demandLevel = 'Very Low';
      demandColor = 'text-red-600';
    }
    
    return {
      demandLevel,
      demandColor,
      demandScore
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'sold': return <Star className="w-4 h-4 text-blue-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  // Copy professional offer to clipboard
  const copyProfessionalOffer = async (property: WatchlistItem) => {
    const offerAnalysis = getRecommendedOffer(property);
    const valueAnalysis = analyzePropertyValue(property);
    const metrics = calculateInvestmentMetrics(property);
    const rentalDemand = calculateRentalDemand(property);
    
    const offerText = `PROFESSIONAL PROPERTY OFFER

Property: ${property.title}
Address: ${property.address}
Asking Price: ${formatPrice(property.price)}

RECOMMENDED OFFER: ${formatPrice(offerAnalysis.recommendedOffer)}
(${offerAnalysis.negotiationBuffer}% below asking price)

INVESTMENT ANALYSIS:
• Price Assessment: ${valueAnalysis.priceAssessment}
• Fair Value: ${formatPrice(valueAnalysis.fairValue)}
• Rental Yield: ${calculateYield(calculateRentalEstimateSync(property), property.price)}%
• Annual ROI: ${metrics.annualReturn.toFixed(1)}%
• Monthly Cash Flow: ${formatPrice(metrics.monthlyCashFlow)}
• Payback Period: ${metrics.paybackPeriod.toFixed(1)} years
• Rental Demand: ${rentalDemand.demandLevel}

PROPERTY DETAILS:
• ${property.bedrooms} bedroom${property.bedrooms !== 1 ? 's' : ''}, ${property.bathrooms} bathroom${property.bathrooms !== 1 ? 's' : ''}
• Property Type: ${property.property_type}
• Tenure: ${property.tenure}

OFFER TERMS:
• Offer Amount: ${formatPrice(offerAnalysis.recommendedOffer)}
• Subject to: Survey, Mortgage, and Legal Checks
• Completion: Within 8-12 weeks
• Chain Status: No chain

This offer is based on comprehensive market analysis and investment metrics.`;

    try {
      await navigator.clipboard.writeText(offerText);
      showToast({
        type: 'success',
        title: 'Offer Copied!',
        message: 'Professional offer copied to clipboard'
      });
    } catch (error) {
      console.error('Failed to copy offer:', error);
      showToast({
        type: 'error',
        title: 'Copy Failed',
        message: 'Failed to copy offer to clipboard'
      });
    }
  };

  // Generate negotiation strategy
  const generateNegotiationStrategy = (property: WatchlistItem) => {
    const offerAnalysis = getRecommendedOffer(property);
    const valueAnalysis = analyzePropertyValue(property);
    const metrics = calculateInvestmentMetrics(property);
    const rentalDemand = calculateRentalDemand(property);
    const daysOnMarket = property.days_on_market || 0;
    
    let strategy = `NEGOTIATION STRATEGY FOR ${property.title.toUpperCase()}

CURRENT MARKET POSITION:
• Asking Price: ${formatPrice(property.price)}
• Days on Market: ${daysOnMarket} days
• Price Assessment: ${valueAnalysis.priceAssessment}
• Rental Demand: ${rentalDemand.demandLevel}

RECOMMENDED APPROACH:`;

    // Strategy based on market conditions
    if (daysOnMarket > 60) {
      strategy += `
🎯 AGGRESSIVE NEGOTIATION (Property on market >60 days)
• Start with: ${formatPrice(Math.round(offerAnalysis.recommendedOffer * 0.95))} (5% below recommended)
• Target: ${formatPrice(offerAnalysis.recommendedOffer)}
• Maximum: ${formatPrice(Math.round(offerAnalysis.recommendedOffer * 1.05))}

TACTICS:
• Emphasize time on market as leverage
• Highlight any needed repairs/updates
• Offer quick completion to sweeten deal
• Be prepared to walk away if price doesn't move`;
    } else if (daysOnMarket > 30) {
      strategy += `
🎯 MODERATE NEGOTIATION (Property on market 30-60 days)
• Start with: ${formatPrice(Math.round(offerAnalysis.recommendedOffer * 0.97))} (3% below recommended)
• Target: ${formatPrice(offerAnalysis.recommendedOffer)}
• Maximum: ${formatPrice(Math.round(offerAnalysis.recommendedOffer * 1.03))}

TACTICS:
• Present market analysis to justify offer
• Show comparable properties
• Offer flexible completion date
• Be patient but firm on price`;
    } else {
      strategy += `
🎯 CONSERVATIVE NEGOTIATION (Property on market <30 days)
• Start with: ${formatPrice(offerAnalysis.recommendedOffer)}
• Target: ${formatPrice(Math.round(offerAnalysis.recommendedOffer * 1.02))}
• Maximum: ${formatPrice(Math.round(offerAnalysis.recommendedOffer * 1.05))}

TACTICS:
• Present strong financial position
• Offer quick decision and completion
• Emphasize no chain status
• Be prepared to move quickly`;
    }

    strategy += `

KEY TALKING POINTS:
• Investment potential: ${metrics.annualReturn.toFixed(1)}% annual return
• Rental income: ${formatPrice(calculateRentalEstimateSync(property))}/month
• Market demand: ${rentalDemand.demandLevel} rental demand
• Fair value assessment: ${formatPrice(valueAnalysis.fairValue)}

NEGOTIATION TIMELINE:
• Week 1: Submit initial offer
• Week 2: Follow up and negotiate
• Week 3: Finalize terms
• Week 4-8: Complete transaction

Remember: Stay professional, be prepared with data, and know your walk-away price.`;

    // Create a modal or alert with the strategy
    const strategyWindow = window.open('', '_blank', 'width=600,height=800');
    if (strategyWindow) {
      strategyWindow.document.write(`
        <html>
          <head>
            <title>Negotiation Strategy - ${property.title}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
              .header { background: #3B82F6; color: white; padding: 20px; margin: -20px -20px 20px -20px; }
              .section { margin: 20px 0; padding: 15px; border-left: 4px solid #3B82F6; background: #f8fafc; }
              .highlight { background: #fef3c7; padding: 10px; border-radius: 5px; margin: 10px 0; }
              .tactics { background: #dbeafe; padding: 15px; border-radius: 5px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎯 Negotiation Strategy</h1>
              <h2>${property.title}</h2>
            </div>
            <pre style="white-space: pre-wrap; font-family: inherit;">${strategy}</pre>
          </body>
        </html>
      `);
      strategyWindow.document.close();
    } else {
      // Fallback to alert if popup is blocked
      alert('Negotiation strategy generated! Check your popup blocker if the window didn\'t open.');
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
                      {(() => {
                        const validImageUrl = getValidImageUrl(item.images);
                        return validImageUrl ? (
                          <Image
                            src={validImageUrl}
                            alt={item.title}
                            width={400}
                            height={300}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log('BMV Finder: Image failed to load:', validImageUrl);
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
                            onLoad={(e) => {
                              console.log('BMV Finder: Image loaded successfully:', validImageUrl);
                            }}
                            unoptimized={true}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
                            <div className="text-center">
                              <div className="text-4xl mb-2">🏠</div>
                              <div className="text-sm text-gray-500 font-medium">{item.property_type || 'Property'}</div>
                              <div className="text-xs text-gray-400">{item.bedrooms || 0} bed{item.bedrooms !== 1 ? 's' : ''}</div>
                            </div>
                          </div>
                        );
                      })()}
                      
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
                      
                      <div className="text-2xl font-bold text-blue-600 mb-4">
                        {formatPrice(item.price)}
                      </div>

                      {/* Rental Demand & Deal Rating Badges */}
                      {(() => {
                        const rentalDemand = calculateRentalDemand(item);
                        const valueAnalysis = analyzePropertyValue(item);
                        const metrics = calculateInvestmentMetrics(item);
                        
                        // Calculate deal rating based on multiple factors
                        const getDealRating = () => {
                          let score = 0;
                          
                          // Price assessment (30% weight)
                          if (valueAnalysis.priceAssessment === 'Excellent Price') score += 30;
                          else if (valueAnalysis.priceAssessment === 'Good Price') score += 25;
                          else if (valueAnalysis.priceAssessment === 'Fair Price') score += 20;
                          else score += 10;
                          
                          // Rental yield (25% weight)
                          const yieldValue = parseFloat(calculateYield(calculateRentalEstimateSync(item), item.price));
                          if (yieldValue >= 8) score += 25;
                          else if (yieldValue >= 6) score += 20;
                          else if (yieldValue >= 4) score += 15;
                          else score += 10;
                          
                          // Annual ROI (25% weight)
                          if (metrics.annualReturn >= 12) score += 25;
                          else if (metrics.annualReturn >= 8) score += 20;
                          else if (metrics.annualReturn >= 5) score += 15;
                          else score += 10;
                          
                          // Payback period (20% weight)
                          if (metrics.paybackPeriod <= 5) score += 20;
                          else if (metrics.paybackPeriod <= 8) score += 15;
                          else if (metrics.paybackPeriod <= 12) score += 10;
                          else score += 5;
                          
                          return score;
                        };
                        
                        const dealScore = getDealRating();
                        
                        const getDealRatingInfo = (score: number) => {
                          if (score >= 85) return { level: 'Excellent', color: 'bg-green-100 text-green-800 border-green-200' };
                          if (score >= 70) return { level: 'Good', color: 'bg-blue-100 text-blue-800 border-blue-200' };
                          if (score >= 55) return { level: 'Fair', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
                          if (score >= 40) return { level: 'Poor', color: 'bg-orange-100 text-orange-800 border-orange-200' };
                          return { level: 'Very Poor', color: 'bg-red-100 text-red-800 border-red-200' };
                        };
                        
                        const dealRating = getDealRatingInfo(dealScore);
                        
                        return (
                          <div className="flex gap-2 mb-4">
                            {/* Rental Demand Badge */}
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${rentalDemand.demandColor.replace('text-', 'bg-').replace('-600', '-100')} ${rentalDemand.demandColor} border-${rentalDemand.demandColor.replace('text-', '').replace('-600', '-200')}`}>
                              <span className="mr-1">🏠</span>
                              {rentalDemand.demandLevel} Demand
                            </div>
                            
                            {/* Deal Rating Badge */}
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${dealRating.color}`}>
                              <span className="mr-1">⭐</span>
                              {dealRating.level} Deal ({dealScore})
                            </div>
                          </div>
                        );
                      })()}

                      {/* Basic Property Info */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-lg">🛏️</span>
                            <span className="font-medium">{item.bedrooms} bed{item.bedrooms !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-lg">🚿</span>
                            <span className="font-medium">{item.bathrooms} bath{item.bathrooms !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-lg">🏠</span>
                            <span className="font-medium">{item.property_type}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-lg">📅</span>
                            <span className="font-medium">{formatDate(item.captured_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Investment Metrics */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
                        <button 
                          onClick={() => toggleSection('quick-metrics')}
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 text-left hover:from-purple-700 hover:to-purple-800 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-white">📊</span>
                              <h4 className="text-sm font-bold text-white">QUICK METRICS</h4>
                            </div>
                            <div className={`text-white transition-transform duration-200 ${expandedSections.has('quick-metrics') ? 'rotate-180' : ''}`}>
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </button>
                        {expandedSections.has('quick-metrics') && (
                          <div className="p-4">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="flex justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                                <span className="text-gray-600 font-medium">Yield:</span>
                                <span className="font-bold text-purple-600">{calculateYield(calculateRentalEstimateSync(item), item.price)}%</span>
                              </div>
                              <div className="flex justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                                <span className="text-gray-600 font-medium">Monthly Rent:</span>
                                <span className="font-bold text-purple-600">{formatPrice(calculateRentalEstimateSync(item))}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Investment Metrics */}
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
                          <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
                            {/* Growth Projections */}
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              {/* Header */}
                              <button 
                                onClick={() => toggleSection('growth-projections')}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-left hover:from-blue-700 hover:to-blue-800 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-white">📈</span>
                                    <h4 className="text-sm font-bold text-white">GROWTH PROJECTIONS</h4>
                                  </div>
                                  <div className={`text-white transition-transform duration-200 ${expandedSections.has('growth-projections') ? 'rotate-180' : ''}`}>
                                    <ChevronDown className="w-4 h-4" />
                                  </div>
                                </div>
                              </button>
                              
                              {/* Content */}
                              {expandedSections.has('growth-projections') && (
                                <div className="p-4">
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                      <span className="text-gray-600 font-medium">10-Year Growth:</span>
                                      <span className={`font-bold ${getGrowthColor(growthAnalysis.growthAssessment)}`}>
                                        {growthAnalysis.tenYearGrowth}%
                                      </span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                      <span className="text-gray-600 font-medium">Projected Value:</span>
                                      <span className="font-bold text-green-600">{formatPrice(growthAnalysis.projectedValue)}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                      <span className="text-gray-600 font-medium">Payback Period:</span>
                                      <span className="font-bold text-blue-600">{metrics.paybackPeriod.toFixed(1)}y</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                      <span className="text-gray-600 font-medium">Annual Profit:</span>
                                      <span className={`font-bold ${metrics.netAnnualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatPrice(metrics.netAnnualProfit)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Recommended Offer Section */}
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              {/* Header */}
                              <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-white">🎯</span>
                                    <h4 className="text-sm font-bold text-white">RECOMMENDED OFFER</h4>
                                  </div>
                                  <span className="text-xs text-amber-100 font-medium">{offerAnalysis.negotiationBuffer}% below asking</span>
                                </div>
                              </div>
                              
                              {/* Main Offer Display */}
                              <div className="p-4">
                                <div className="text-center mb-4">
                                  <div className="text-3xl font-bold text-amber-700 mb-2">
                                    {formatPrice(offerAnalysis.recommendedOffer)}
                                  </div>
                                  <div className="text-sm text-gray-500 font-medium">
                                    vs {formatPrice(item.price)} asking price
                                  </div>
                                </div>
                                
                                {/* Quick Analysis */}
                                <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                                  <div className="flex justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <span className="text-gray-600 font-medium">Price Assessment:</span>
                                    <span className={`font-bold ${getPriceColor(valueAnalysis.priceAssessment)}`}>
                                      {valueAnalysis.priceAssessment}
                                    </span>
                                  </div>
                                  <div className="flex justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                    <span className="text-gray-600 font-medium">Fair Value:</span>
                                    <span className="font-bold text-gray-800">
                                      {formatPrice(valueAnalysis.fairValue)}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                  <button 
                                    onClick={() => copyProfessionalOffer(item)}
                                    className="flex-1 py-3 px-4 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <span>📄</span>
                                    Copy Professional Offer
                                  </button>
                                  <button 
                                    onClick={() => generateNegotiationStrategy(item)}
                                    className="flex-1 py-3 px-4 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <span>🎯</span>
                                    Generate Strategy
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Investment Summary */}
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              {/* Header */}
                              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-white">💰</span>
                                  <h4 className="text-sm font-bold text-white">INVESTMENT SUMMARY</h4>
                                </div>
                              </div>
                              
                              {/* Summary Content */}
                              <div className="p-4">
                                <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                                  <div className="flex justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                    <span className="text-gray-600 font-medium">Total Investment:</span>
                                    <span className="font-bold text-gray-800">{formatPrice(metrics.totalInvestment)}</span>
                                  </div>
                                  <div className="flex justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                    <span className="text-gray-600 font-medium">Annual Return:</span>
                                    <span className="font-bold text-green-600">{metrics.annualReturn.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                    <span className="text-gray-600 font-medium">Monthly Profit:</span>
                                    <span className="font-bold text-green-600">{formatPrice(metrics.monthlyCashFlow)}</span>
                                  </div>
                                  <div className="flex justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                    <span className="text-gray-600 font-medium">Cash-on-Cash:</span>
                                    <span className="font-bold text-blue-600">{metrics.cashOnCashReturn.toFixed(1)}%</span>
                                  </div>
                                </div>
                                
                                {/* Mortgage Type Indicator */}
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                  <span>🏠</span>
                                  <span className="font-medium">{item.mortgage_type || 'Interest-Only'} Mortgage</span>
                                </div>
                                
                                {/* Monthly Cash Flow Breakdown */}
                                <div className="bg-gray-50 rounded-lg p-4 text-xs border border-gray-100">
                                  <div className="text-center mb-3 font-bold text-gray-700 text-sm">Monthly Cash Flow</div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600 font-medium">+ Rental Income:</span>
                                      <span className="font-bold text-green-600">+{formatPrice(calculateRentalEstimateSync(item))}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600 font-medium">- Mortgage Payment:</span>
                                      <span className="font-bold text-red-600">-{formatPrice(metrics.monthlyMortgagePayment)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600 font-medium">- Other Expenses:</span>
                                      <span className="font-bold text-red-600">-{formatPrice(metrics.monthlyExpenses)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                                      <span className="text-gray-800 font-bold">= Net Cash Flow:</span>
                                      <span className={`font-bold text-lg ${metrics.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                      return { 
                        ...analyzePropertyValue(property), 
                        property,
                        metrics: calculateInvestmentMetrics(property),
                        growth: analyzeGrowthPotential(property)
                      };
                    }).filter(Boolean);

                    if (assessments.length === 0) return null;

                    // Find the best deal based on various metrics
                    const bestROI = assessments.reduce((best, current) => 
                      current.metrics.annualReturn > best.metrics.annualReturn ? current : best
                    );
                    
                    const bestPaybackPeriod = assessments.reduce((best, current) => 
                      current.metrics.paybackPeriod < best.metrics.paybackPeriod ? current : best
                    );
                    
                    const bestGrowth = assessments.reduce((best, current) => 
                      parseFloat(current.growth.tenYearGrowth) > parseFloat(best.growth.tenYearGrowth) ? current : best
                    );
                    
                    const averageROI = Math.round(assessments.reduce((sum, a) => sum + a.metrics.annualReturn, 0) / assessments.length);
                    
                    return (
                      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="mr-2">📊</span> Deal Comparison Summary
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                            <div className="text-2xl font-bold text-green-600">{bestROI.metrics.annualReturn.toFixed(1)}%</div>
                            <div className="text-sm text-gray-600">Best Annual ROI</div>
                            <div className="text-xs text-gray-500 mt-1">{bestROI.property.title.substring(0, 25)}...</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                            <div className="text-2xl font-bold text-green-600">{bestPaybackPeriod.metrics.paybackPeriod.toFixed(1)}y</div>
                            <div className="text-sm text-gray-600">Fastest Payback</div>
                            <div className="text-xs text-gray-500 mt-1">{bestPaybackPeriod.property.title.substring(0, 25)}...</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                            <div className="text-2xl font-bold text-purple-600">{bestGrowth.growth.tenYearGrowth}%</div>
                            <div className="text-sm text-gray-600">Best Growth Potential</div>
                            <div className="text-xs text-gray-500 mt-1">{bestGrowth.property.title.substring(0, 25)}...</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
                            <div className="text-2xl font-bold text-orange-600">{formatPrice(bestROI.metrics.netAnnualProfit)}</div>
                            <div className="text-sm text-gray-600">Best Annual Profit</div>
                            <div className="text-xs text-gray-500 mt-1">{bestROI.property.title.substring(0, 25)}...</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Detailed Comparison Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Property</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">Price</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">Yield</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">ROI</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">Payback</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProperties.map(propertyId => {
                          const property = watchlist.find(p => p.id === propertyId);
                          if (!property) return null;
                          const metrics = calculateInvestmentMetrics(property);
                          const growth = analyzeGrowthPotential(property);
                          const yieldPercentage = calculateYield(calculateRentalEstimateSync(property), property.price);
                          
                          return (
                            <tr key={propertyId} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div>
                                  <div className="font-medium text-gray-900">{property.title.substring(0, 30)}...</div>
                                  <div className="text-xs text-gray-500">{property.address}</div>
                                </div>
                              </td>
                              <td className="text-center py-3 px-4 font-semibold text-gray-900">
                                {formatPrice(property.price)}
                              </td>
                              <td className="text-center py-3 px-4">
                                <span className={`font-semibold ${
                                  parseFloat(yieldPercentage) >= 6 ? 'text-green-600' :
                                  parseFloat(yieldPercentage) >= 4 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {yieldPercentage}%
                                </span>
                              </td>
                              <td className="text-center py-3 px-4">
                                <span className={`font-semibold ${
                                  metrics.annualReturn >= 8 ? 'text-green-600' :
                                  metrics.annualReturn >= 5 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {metrics.annualReturn.toFixed(1)}%
                                </span>
                              </td>
                              <td className="text-center py-3 px-4 font-semibold text-gray-900">
                                {metrics.paybackPeriod.toFixed(1)}y
                              </td>
                              <td className="text-center py-3 px-4">
                                <span className={`font-semibold ${
                                  parseFloat(growth.tenYearGrowth) >= 50 ? 'text-green-600' :
                                  parseFloat(growth.tenYearGrowth) >= 30 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {growth.tenYearGrowth}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
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
                      <input
                        type="date"
                        value={editForm.offer_date || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, offer_date: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        placeholder="Select date"
                      />
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

              {/* Offer History & Recommendations */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <span>📊</span>
                  Offer History & Recommendations
                </h4>
                
                {(() => {
                  const currentOffer = editForm.offer_amount || 0;
                  const currentOfferDate = editForm.offer_date || '';
                  const currentOfferStatus = editForm.offer_status || 'pending';
                  const askingPrice = editForm.price;
                  const offerAnalysis = getRecommendedOffer({
                    ...editForm,
                    price: askingPrice,
                    title: editForm.title,
                    address: editForm.address,
                    bedrooms: editForm.bedrooms,
                    bathrooms: editForm.bathrooms,
                    property_type: editForm.property_type,
                    postcode: editForm.postcode
                  } as WatchlistItem);
                  
                  const getNextOfferRecommendation = () => {
                    if (currentOfferStatus === 'rejected') {
                      // If rejected, suggest a slightly higher offer
                      const rejectionDiscount = (askingPrice - currentOffer) / askingPrice;
                      if (rejectionDiscount > 0.15) {
                        // If we offered more than 15% below asking, try 10% below
                        return Math.round(askingPrice * 0.90);
                      } else if (rejectionDiscount > 0.10) {
                        // If we offered more than 10% below asking, try 8% below
                        return Math.round(askingPrice * 0.92);
                      } else {
                        // If we offered close to asking, try 5% below
                        return Math.round(askingPrice * 0.95);
                      }
                    } else if (currentOfferStatus === 'counter_offer') {
                      // If counter offer, suggest meeting in the middle
                      const counterOffer = Math.round((currentOffer + askingPrice) / 2);
                      return counterOffer;
                    } else {
                      // If pending or accepted, show recommended offer
                      return offerAnalysis.recommendedOffer;
                    }
                  };
                  
                  const nextOffer = getNextOfferRecommendation();
                  const daysSinceOffer = currentOfferDate ? Math.floor((Date.now() - new Date(currentOfferDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                  
                  return (
                    <div className="space-y-4">
                      {/* Current Offer Summary */}
                      {currentOffer > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Current Offer</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              currentOfferStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                              currentOfferStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                              currentOfferStatus === 'counter_offer' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {currentOfferStatus.charAt(0).toUpperCase() + currentOfferStatus.slice(1)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-600">Amount:</span>
                              <span className="font-semibold text-gray-800 ml-1">{formatPrice(currentOffer)}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Date:</span>
                              <span className="font-semibold text-gray-800 ml-1">{currentOfferDate || 'Not set'}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">% Below Asking:</span>
                              <span className="font-semibold text-gray-800 ml-1">{((askingPrice - currentOffer) / askingPrice * 100).toFixed(1)}%</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Days Since:</span>
                              <span className="font-semibold text-gray-800 ml-1">{daysSinceOffer}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Next Offer Recommendation */}
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Recommended Next Offer</span>
                          <span className="text-xs text-purple-600 font-medium">
                            {currentOfferStatus === 'rejected' ? 'After Rejection' :
                             currentOfferStatus === 'counter_offer' ? 'Counter Strategy' :
                             'Initial Offer'}
                          </span>
                        </div>
                        <div className="text-center mb-3">
                          <div className="text-2xl font-bold text-purple-700">{formatPrice(nextOffer)}</div>
                          <div className="text-xs text-gray-600">
                            {((askingPrice - nextOffer) / askingPrice * 100).toFixed(1)}% below asking price
                          </div>
                        </div>
                        
                        {/* Recommendation Logic */}
                        <div className="text-xs text-gray-600 space-y-1">
                          {currentOfferStatus === 'rejected' && (
                            <div className="bg-red-50 p-2 rounded border border-red-100">
                              <strong>Rejection Strategy:</strong> 
                              {currentOffer > 0 && (
                                <span> Your previous offer of {formatPrice(currentOffer)} was rejected. 
                                {daysSinceOffer > 7 ? ' Consider waiting a few more days before following up.' : ' Follow up in 3-5 days.'}</span>
                              )}
                            </div>
                          )}
                          
                          {currentOfferStatus === 'counter_offer' && (
                            <div className="bg-orange-50 p-2 rounded border border-orange-100">
                              <strong>Counter Offer Strategy:</strong> 
                              <span> Vendor countered. Consider meeting in the middle or offering {formatPrice(Math.round(nextOffer * 0.98))} as a final offer.</span>
                            </div>
                          )}
                          
                          {currentOfferStatus === 'pending' && daysSinceOffer > 3 && (
                            <div className="bg-yellow-50 p-2 rounded border border-yellow-100">
                              <strong>Follow-up Reminder:</strong> 
                              <span> It's been {daysSinceOffer} days since your offer. Consider following up with the agent.</span>
                            </div>
                          )}
                          
                          {currentOfferStatus === 'pending' && daysSinceOffer <= 3 && (
                            <div className="bg-blue-50 p-2 rounded border border-blue-100">
                              <strong>Waiting Period:</strong> 
                              <span> Give the vendor time to respond. Follow up after 3-5 days if no response.</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Market Context */}
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <div className="text-sm font-medium text-gray-700 mb-2">Market Context</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Asking Price:</span>
                            <span className="font-semibold text-gray-800 ml-1">{formatPrice(askingPrice)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Recommended:</span>
                            <span className="font-semibold text-gray-800 ml-1">{formatPrice(offerAnalysis.recommendedOffer)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Fair Value:</span>
                            <span className="font-semibold text-gray-800 ml-1">{formatPrice(offerAnalysis.recommendedOffer * 1.05)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Max Offer:</span>
                            <span className="font-semibold text-gray-800 ml-1">{formatPrice(offerAnalysis.recommendedOffer * 1.08)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
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