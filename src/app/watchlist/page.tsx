'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { motion } from 'framer-motion';
import { MapPinIcon, ArrowTopRightOnSquareIcon, PencilIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useUserTier } from '@/hooks/useUserTier';
import { useToast } from '@/hooks/useToast';

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
  custom_rental_estimate?: number;
  estimated_fair_value?: number;
  fair_bid_amount?: number;
  refurbishment_costs?: {
    low: number;
    medium: number;
    high: number;
  };
  mortgage_type?: string;
  mortgage_rate?: number;
  offer_status?: 'none' | 'offer_made' | 'offer_accepted' | 'offer_rejected';
  offer_amount?: number;
  offer_date?: string;
  offer_notes?: string;
  offer_history?: Array<{
    id: string;
    status: 'offer_made' | 'offer_accepted' | 'offer_rejected' | 'offer_withdrawn';
    amount: number;
    date: string;
    notes: string;
    outcome?: string;
    follow_up_date?: string;
  }>;
  is_favorite?: boolean;
  epc_rating?: string;
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WatchlistItem>>({});
  const [copyingOffer, setCopyingOffer] = useState<string | null>(null);
  const [copyingStrategy, setCopyingStrategy] = useState<string | null>(null);
  const [strategyModal, setStrategyModal] = useState<string | null>(null);
  const [offerModal, setOfferModal] = useState<string | null>(null);
  const [newOfferEntry, setNewOfferEntry] = useState({
    status: 'offer_made' as 'offer_made' | 'offer_accepted' | 'offer_rejected' | 'offer_withdrawn',
    amount: 0,
    date: '',
    notes: '',
    follow_up_date: ''
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showOffersOnly, setShowOffersOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCostBreakdown, setEditingCostBreakdown] = useState<string | null>(null);
  const [costBreakdownData, setCostBreakdownData] = useState<{[key: string]: any}>({});
  
  const user = useUser();
  const { tier, loading: tierLoading } = useUserTier(user?.id);
  const { success, error: showError, info } = useToast();

  const loadWatchlist = async () => {
    try {
      const response = await fetch('/api/properties/capture');
      if (response.ok) {
        const data = await response.json();
        const properties = data.properties || [];
        
        if (properties.length === 0 || !user) {
          console.log('Loading demo properties for non-logged-in user or empty watchlist');
          loadDemoProperties();
        } else {
          setWatchlist(properties);
        }
      } else {
        console.error('Failed to load watchlist');
        loadDemoProperties();
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
      showError('Failed to load watchlist');
      loadDemoProperties();
    } finally {
      setLoading(false);
    }
  };

  const loadDemoProperties = () => {
    const demoProperties = [
      {
        id: 'demo-1',
        title: '4 bedroom detached house for sale',
        price: 450000,
        address: '123 Oak Avenue, Manchester, M1 1AA',
        description: 'Beautiful family home with garden, excellent investment opportunity with strong rental potential',
        bedrooms: 4,
        bathrooms: 2,
        property_type: 'Detached',
        tenure: 'Freehold',
        postcode: 'M1 1AA',
        latitude: 53.4808,
        longitude: -2.2426,
        original_url: 'https://example.com/property1',
        source: 'Rightmove',
        agent_name: 'Demo Estate Agents',
        agent_phone: '0161 123 4567',
        images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop&crop=center'],
        captured_at: new Date().toISOString(),
        notes: 'Excellent BMV opportunity - 15% below market value. Strong rental demand in this area.',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_size: { value: 1800, unit: 'sq ft' },
        custom_rental_estimate: 1800,
        estimated_fair_value: 520000,
        fair_bid_amount: 405000,
        refurbishment_costs: { low: 15000, medium: 25000, high: 40000 },
        mortgage_type: 'Buy to Let',
        mortgage_rate: 5.2,
        offer_status: 'none' as const,
        offer_amount: 0,
        offer_date: '',
        offer_notes: '',
        epc_rating: 'C',
        is_favorite: false
      },
      {
        id: 'demo-2',
        title: '3 bedroom terraced house for sale',
        price: 350000,
        address: 'Clifton Road, Clifton, Bristol, BS8',
        description: 'Character property in popular area, great for HMO potential',
        bedrooms: 3,
        bathrooms: 1,
        property_type: 'Terraced',
        tenure: 'Freehold',
        postcode: 'BS8',
        latitude: 51.4545,
        longitude: -2.5879,
        original_url: 'https://example.com/property2',
        source: 'Rightmove',
        agent_name: 'Demo Property Group',
        agent_phone: '0121 987 6543',
        images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&crop=center'],
        captured_at: new Date().toISOString(),
        notes: 'Potential for HMO conversion. Good student rental area.',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_size: { value: 1200, unit: 'sq ft' },
        custom_rental_estimate: 3000,
        estimated_fair_value: 356250,
        fair_bid_amount: 345000,
        refurbishment_costs: { low: 8000, medium: 15000, high: 25000 },
        mortgage_type: 'Fixed Rate',
        mortgage_rate: 4.8,
        offer_status: 'offer_made' as const,
        offer_amount: 330000,
        offer_date: '2024-01-15',
        offer_notes: 'Initial offer made, waiting for response from vendor.',
        offer_history: [
          {
            id: 'offer-1',
            status: 'offer_made' as const,
            amount: 330000,
            date: '2024-01-15',
            notes: 'Initial offer submitted',
            outcome: 'Pending response'
          }
        ],
        is_favorite: true
      },
      {
        id: 'demo-3',
        title: '2 bedroom apartment for sale',
        price: 280000,
        address: '789 Pine Road, Leeds, LS1 1CC',
        description: 'Modern apartment with city views, excellent location for young professionals',
        bedrooms: 2,
        bathrooms: 2,
        property_type: 'Apartment',
        tenure: 'Leasehold',
        postcode: 'LS1 1CC',
        latitude: 53.8008,
        longitude: -1.5491,
        original_url: 'https://example.com/property3',
        source: 'OnTheMarket',
        agent_name: 'Demo City Properties',
        agent_phone: '0113 456 7890',
        images: ['https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400&h=300&fit=crop&crop=center'],
        captured_at: new Date().toISOString(),
        notes: 'High demand area for rentals. Leasehold but good service charge.',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_size: { value: 850, unit: 'sq ft' },
        custom_rental_estimate: 1100,
        estimated_fair_value: 300000,
        fair_bid_amount: 252000,
        refurbishment_costs: { low: 5000, medium: 10000, high: 18000 },
        mortgage_type: 'Variable Rate',
        mortgage_rate: 5.5,
        offer_status: 'offer_accepted' as const,
        offer_amount: 265000,
        offer_date: '2024-01-10',
        offer_notes: 'Offer accepted! Moving forward with purchase. Solicitor instructed.',
        offer_history: [
          {
            id: 'offer-1',
            status: 'offer_made' as const,
            amount: 250000,
            date: '2024-01-05',
            notes: 'Initial offer submitted',
            outcome: 'Counter offer received'
          },
          {
            id: 'offer-2',
            status: 'offer_accepted' as const,
            amount: 265000,
            date: '2024-01-10',
            notes: 'Counter offer accepted',
            outcome: 'Purchase proceeding'
          }
        ]
      },
      {
        id: 'demo-4',
        title: '5 bedroom detached house for sale',
        price: 650000,
        address: '456 Maple Drive, Birmingham, B1 1DD',
        description: 'Large family home with extensive gardens, excellent investment potential',
        bedrooms: 5,
        bathrooms: 3,
        property_type: 'Detached',
        tenure: 'Freehold',
        postcode: 'B1 1DD',
        latitude: 52.4862,
        longitude: -1.8904,
        original_url: 'https://example.com/property4',
        source: 'Zoopla',
        agent_name: 'Demo Midlands Properties',
        agent_phone: '0121 234 5678',
        images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop&crop=center'],
        captured_at: new Date().toISOString(),
        notes: 'Excellent family home with HMO potential. Strong rental demand.',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_size: { value: 2200, unit: 'sq ft' },
        custom_rental_estimate: 3500,
        estimated_fair_value: 700000,
        fair_bid_amount: 585000,
        refurbishment_costs: { low: 20000, medium: 35000, high: 55000 },
        mortgage_type: 'Buy to Let',
        mortgage_rate: 5.8,
        offer_status: 'offer_rejected' as const,
        offer_amount: 600000,
        offer_date: '2024-01-20',
        offer_notes: 'Offer rejected - vendor wants closer to asking price. Will follow up in 2 weeks.',
        offer_history: [
          {
            id: 'offer-1',
            status: 'offer_made' as const,
            amount: 580000,
            date: '2024-01-15',
            notes: 'Initial offer submitted',
            outcome: 'Rejected - too low'
          },
          {
            id: 'offer-2',
            status: 'offer_rejected' as const,
            amount: 600000,
            date: '2024-01-20',
            notes: 'Increased offer submitted',
            outcome: 'Still rejected - vendor firm on price'
          }
        ],
        is_favorite: false
      },
      {
        id: 'demo-5',
        title: '3 bedroom semi-detached house for sale',
        price: 320000,
        address: '789 Elm Street, Liverpool, L1 1EE',
        description: 'Well-maintained family home in popular residential area',
        bedrooms: 3,
        bathrooms: 2,
        property_type: 'Semi-Detached',
        tenure: 'Freehold',
        postcode: 'L1 1EE',
        latitude: 53.4084,
        longitude: -2.9916,
        original_url: 'https://example.com/property5',
        source: 'Rightmove',
        agent_name: 'Demo Liverpool Properties',
        agent_phone: '0151 345 6789',
        images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&crop=center'],
        captured_at: new Date().toISOString(),
        notes: 'Good condition, minimal work needed. Strong rental yield potential.',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_size: { value: 1400, unit: 'sq ft' },
        custom_rental_estimate: 1800,
        estimated_fair_value: 340000,
        fair_bid_amount: 304000,
        refurbishment_costs: { low: 8000, medium: 15000, high: 25000 },
        mortgage_type: 'Fixed Rate',
        mortgage_rate: 4.9,
        offer_status: 'offer_made' as const,
        offer_amount: 305000,
        offer_date: '2024-01-25',
        offer_notes: 'Recent offer made, waiting for vendor response. Good negotiation position.',
        offer_history: [
          {
            id: 'offer-1',
            status: 'offer_made' as const,
            amount: 305000,
            date: '2024-01-25',
            notes: 'Initial offer submitted',
            outcome: 'Awaiting response'
          }
        ],
        is_favorite: false
      }
    ];
    
    setWatchlist(demoProperties);
  };

  const deleteProperty = async (id: string) => {
    try {
      const response = await fetch(`/api/properties/capture?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
      setWatchlist(prev => prev.filter(item => item.id !== id));
        success('Property removed from watchlist');
      } else {
        showError('Failed to remove property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      showError('Failed to remove property');
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
    const property = watchlist.find(p => p.id === propertyId);
    if (property) {
    setEditingProperty(propertyId);
      setEditForm({
        title: property.title,
        price: property.price,
        address: property.address,
        description: property.description,
        notes: property.notes,
        custom_rental_estimate: property.custom_rental_estimate,
        estimated_fair_value: property.estimated_fair_value,
        fair_bid_amount: property.fair_bid_amount,
        refurbishment_costs: property.refurbishment_costs || { low: 0, medium: 0, high: 0 },
        mortgage_type: property.mortgage_type || 'Fixed Rate',
        mortgage_rate: property.mortgage_rate || 4.5,
        offer_status: property.offer_status || 'none',
        offer_amount: property.offer_amount || 0,
        offer_date: property.offer_date || '',
        offer_notes: property.offer_notes || ''
      });
    }
  };

  const handleSaveEdit = async (propertyId: string) => {
    try {
      const updatedWatchlist = watchlist.map(property => 
        property.id === propertyId 
          ? { ...property, ...editForm, updated_at: new Date().toISOString() }
          : property
      );
      setWatchlist(updatedWatchlist);
      setEditingProperty(null);
      setEditForm({});
      success('Property updated successfully');
    } catch (error) {
      showError('Failed to update property');
    }
  };

  const handleCancelEdit = () => {
    setEditingProperty(null);
    setEditForm({});
    setNewOfferEntry({
      status: 'offer_made',
      amount: 0,
      date: '',
      notes: '',
      follow_up_date: ''
    });
  };

  const handleEditCostBreakdown = (propertyId: string) => {
    const property = watchlist.find(p => p.id === propertyId);
    if (!property) return;
    
    const currentBreakdown = calculateDetailedCostBreakdown(property);
    setCostBreakdownData({
      ...costBreakdownData,
      [propertyId]: {
        deposit: currentBreakdown.deposit,
        purchaseType: 'second_home', // Default to second home
        legalFees: currentBreakdown.legalFees,
        surveyFees: currentBreakdown.surveyFees,
        mortgageFees: currentBreakdown.mortgageFees,
        landRegistryFees: currentBreakdown.landRegistryFees,
        searchesFees: currentBreakdown.searchesFees,
        gasSafetyCertificate: currentBreakdown.gasSafetyCertificate,
        electricalSafetyCertificate: currentBreakdown.electricalSafetyCertificate,
        energyPerformanceCertificate: currentBreakdown.energyPerformanceCertificate,
        fireSafetyAssessment: currentBreakdown.fireSafetyAssessment,
        legionellaRiskAssessment: currentBreakdown.legionellaRiskAssessment,
        asbestosSurvey: currentBreakdown.asbestosSurvey,
        landlordInsurance: currentBreakdown.landlordInsurance,
        refurbishmentCost: currentBreakdown.refurbishmentCost,
        furnitureAndAppliances: currentBreakdown.furnitureAndAppliances,
        marketingAndLettingFees: currentBreakdown.marketingAndLettingFees,
        contingencyFund: currentBreakdown.contingencyFund
      }
    });
    setEditingCostBreakdown(propertyId);
  };

  const handleSaveCostBreakdown = (propertyId: string) => {
    setEditingCostBreakdown(null);
    // The data is already saved in costBreakdownData state
    success('Cost breakdown updated successfully');
  };

  const handleCancelCostBreakdown = () => {
    setEditingCostBreakdown(null);
  };

  const updateCostBreakdownField = (propertyId: string, field: string, value: any) => {
    setCostBreakdownData(prev => ({
      ...prev,
      [propertyId]: {
        ...prev[propertyId],
        [field]: value
      }
    }));
  };

  const addOfferToHistory = () => {
    if (!newOfferEntry.amount || !newOfferEntry.date) {
      showError('Please fill in amount and date');
      return;
    }

    const newOffer = {
      id: Date.now().toString(),
      ...newOfferEntry
    };

    const updatedHistory = [...(editForm.offer_history || []), newOffer];
    setEditForm({
      ...editForm,
      offer_history: updatedHistory
    });

    // Reset the form
    setNewOfferEntry({
      status: 'offer_made',
      amount: 0,
      date: '',
      notes: '',
      follow_up_date: ''
    });

    success('Offer added to history');
  };

  const removeOfferFromHistory = (offerId: string) => {
    const updatedHistory = editForm.offer_history?.filter(offer => offer.id !== offerId) || [];
    setEditForm({
      ...editForm,
      offer_history: updatedHistory
    });
    success('Offer removed from history');
  };

  const toggleFavorite = async (propertyId: string) => {
    try {
      const property = watchlist.find(p => p.id === propertyId);
      if (!property) {
        showError('Property not found');
        return;
      }

      const newFavoriteStatus = !property.is_favorite;
      
      // Update local state immediately for responsive UI
      const updatedWatchlist = watchlist.map(property => 
        property.id === propertyId 
          ? { ...property, is_favorite: newFavoriteStatus }
          : property
      );
      setWatchlist(updatedWatchlist);
      
      // For demo properties, just update local state without API call
      if (propertyId.startsWith('demo-')) {
        if (newFavoriteStatus) {
          success('Added to favorites');
        } else {
          success('Removed from favorites');
        }
        return;
      }
      
      // Persist to database for real properties
      const response = await fetch('/api/watchlist', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: propertyId,
          is_favorite: newFavoriteStatus
        }),
      });

      if (!response.ok) {
        // For demo data, don't revert state - just show a warning
        if (propertyId.startsWith('demo-')) {
          console.warn('Demo property - changes not persisted to database');
        } else {
          // Revert local state if API call failed for real properties
          setWatchlist(watchlist);
          throw new Error('Failed to update favorite status');
        }
      }
      
      if (newFavoriteStatus) {
        success('Added to favorites');
      } else {
        success('Removed from favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showError('Failed to update favorite status');
    }
  };

  const deletePropertyFromWatchlist = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property from your watchlist? This action cannot be undone.')) {
      return;
    }

    try {
      // Update local state immediately for responsive UI
      const updatedWatchlist = watchlist.filter(property => property.id !== propertyId);
      setWatchlist(updatedWatchlist);
      
      // For demo properties, just update local state without API call
      if (propertyId.startsWith('demo-')) {
        success('Property removed from watchlist');
        return;
      }
      
      // Persist deletion to database for real properties
      const response = await fetch(`/api/watchlist?id=${propertyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // For demo data, don't revert state - just show a warning
        if (propertyId.startsWith('demo-')) {
          console.warn('Demo property - deletion not persisted to database');
        } else {
          // Revert local state if API call failed for real properties
          setWatchlist(watchlist);
          throw new Error('Failed to delete property');
        }
      }
      
      success('Property removed from watchlist');
    } catch (error) {
      console.error('Error deleting property:', error);
      showError('Failed to delete property');
    }
  };

  const calculateRentalEstimateSync = (property: WatchlistItem) => {
    if (property.custom_rental_estimate && property.custom_rental_estimate > 0) {
      return property.custom_rental_estimate;
    }
    return Math.round(property.price * 0.004);
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
        return '🏢';
      case 'primelocation':
        return '🏛️';
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

  const isValidImageUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const calculateInvestmentMetrics = (property: WatchlistItem) => {
    const monthlyRent = calculateRentalEstimateSync(property);
    const annualRent = monthlyRent * 12;
    const yieldValue = parseFloat(calculateYield(monthlyRent, property.price));
    
    const deposit = property.price * 0.25;
    const mortgageAmount = property.price * 0.75;
    const mortgageRate = 0.045;
    const monthlyMortgagePayment = (mortgageAmount * mortgageRate) / 12;
    
    const stampDuty = property.price > 250000 ? (property.price - 250000) * 0.05 : 0;
    const legalFees = 1500;
    const surveyFees = 500;
    const mortgageFees = 1000;
    const insurance = 300;
    const maintenance = property.price * 0.01;
    
    const totalInvestmentCost = deposit + stampDuty + legalFees + surveyFees + mortgageFees;
    const annualExpenses = (monthlyMortgagePayment * 12) + insurance + maintenance;
    const netAnnualProfit = annualRent - annualExpenses;
    const annualROI = (netAnnualProfit / totalInvestmentCost) * 100;
    const paybackPeriod = totalInvestmentCost / netAnnualProfit;
    const realProfitMargin = (netAnnualProfit / property.price) * 100;

    return {
      monthlyRent,
      annualRent,
      yield: yieldValue,
      deposit,
      mortgageAmount,
      monthlyMortgagePayment,
      totalInvestmentCost,
      annualExpenses,
      netAnnualProfit,
      annualROI,
      paybackPeriod,
      realProfitMargin
    };
  };

  const calculateDetailedCostBreakdown = (property: WatchlistItem, customData?: any) => {
    const deposit = customData?.deposit || property.price * 0.25;
    const purchaseType = customData?.purchaseType || 'additional_property';
    
    // Use manually entered stamp duty if provided, otherwise calculate based on purchase type
    let stampDuty = customData?.stampDuty || 0;
    const price = property.price;
    
    // Only calculate stamp duty if not manually provided
    if (!customData?.stampDuty) {
    
    if (purchaseType === 'first_home') {
      // First-time buyer rates (0% up to £425k, 5% on £425k-£625k, standard rates above)
      if (price <= 425000) {
        stampDuty = 0;
      } else if (price <= 625000) {
        stampDuty = (price - 425000) * 0.05;
      } else {
        // Standard rates for portion above £625k
        if (price <= 925000) {
          stampDuty = 10000 + (price - 625000) * 0.05;
        } else if (price <= 1500000) {
          stampDuty = 25000 + (price - 925000) * 0.10;
        } else {
          stampDuty = 82500 + (price - 1500000) * 0.12;
        }
      }
    } else if (purchaseType === 'own_name') {
      // Standard rates for main residence
      if (price <= 250000) {
        stampDuty = 0;
      } else if (price <= 925000) {
        stampDuty = (price - 250000) * 0.05;
      } else if (price <= 1500000) {
        stampDuty = 33750 + (price - 925000) * 0.10;
      } else {
        stampDuty = 93750 + (price - 1500000) * 0.12;
      }
    } else if (purchaseType === 'second_home') {
      // Additional property rates (3% surcharge)
      if (price <= 250000) {
        stampDuty = price * 0.03;
      } else if (price <= 925000) {
        stampDuty = 7500 + (price - 250000) * 0.08;
      } else if (price <= 1500000) {
        stampDuty = 67500 + (price - 925000) * 0.13;
      } else {
        stampDuty = 150000 + (price - 1500000) * 0.15;
      }
    } else if (purchaseType === 'ltd_company') {
      // Company purchase rates (higher rates)
      if (price <= 250000) {
        stampDuty = price * 0.05;
      } else if (price <= 925000) {
        stampDuty = 12500 + (price - 250000) * 0.10;
      } else if (price <= 1500000) {
        stampDuty = 80000 + (price - 925000) * 0.15;
      } else {
        stampDuty = 166250 + (price - 1500000) * 0.17;
      }
    } else {
      // Default to additional property rates
      if (price <= 250000) {
        stampDuty = price * 0.03;
      } else if (price <= 925000) {
        stampDuty = 7500 + (price - 250000) * 0.08;
      } else if (price <= 1500000) {
        stampDuty = 67500 + (price - 925000) * 0.13;
      } else {
        stampDuty = 150000 + (price - 1500000) * 0.15;
      }
    }
    }
    
    // Legal and compliance costs
    const legalFees = customData?.legalFees || 1500; // Conveyancing fees
    const surveyFees = customData?.surveyFees || 500; // Building survey
    const mortgageFees = customData?.mortgageFees || 1000; // Mortgage arrangement fees
    const landRegistryFees = customData?.landRegistryFees || 200; // Land registry fees
    const searchesFees = customData?.searchesFees || 300; // Local authority searches
    
    // Gas and electrical safety certificates
    const gasSafetyCertificate = customData?.gasSafetyCertificate || 80; // Annual gas safety check
    const electricalSafetyCertificate = customData?.electricalSafetyCertificate || 200; // EICR (Electrical Installation Condition Report)
    const energyPerformanceCertificate = customData?.energyPerformanceCertificate || 80; // EPC certificate
    
    // Additional compliance costs
    const fireSafetyAssessment = customData?.fireSafetyAssessment || 150; // Fire risk assessment
    const legionellaRiskAssessment = customData?.legionellaRiskAssessment || 100; // Legionella risk assessment
    const asbestosSurvey = customData?.asbestosSurvey || 300; // Asbestos survey (if needed)
    const landlordInsurance = customData?.landlordInsurance || 300; // Annual landlord insurance
    
    // Refurbishment costs
    const refurbishmentCost = customData?.refurbishmentCost || property.refurbishment_costs?.medium || 0;
    
    // Additional setup costs
    const furnitureAndAppliances = customData?.furnitureAndAppliances || 2000; // Basic furniture and appliances
    const marketingAndLettingFees = customData?.marketingAndLettingFees || 500; // Letting agent fees
    const contingencyFund = customData?.contingencyFund || 1000; // Contingency for unexpected costs
    
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
    const baseGrowth = 2.5;
    const propertyTypeMultiplier = property.property_type === 'Detached' ? 1.2 : 1.0;
    const locationMultiplier = property.postcode.startsWith('M') ? 1.1 : 1.0;
    
    const conservativeGrowth = (baseGrowth * propertyTypeMultiplier * locationMultiplier).toFixed(1);
    const optimisticGrowth = (baseGrowth * 1.5 * propertyTypeMultiplier * locationMultiplier).toFixed(1);
    
    return {
      conservativeGrowth,
      optimisticGrowth,
      marketTrend: 'Stable',
      rentalDemand: 'High'
    };
  };

  const assessDealQuality = (property: WatchlistItem) => {
    const metrics = calculateInvestmentMetrics(property);
    let score = 0;
    const reasons: string[] = [];
    const negativeFactors: string[] = [];

    if (metrics.annualROI >= 8) {
      score += 25;
      reasons.push('Excellent ROI (8%+)');
    } else if (metrics.annualROI >= 6) {
      score += 20;
      reasons.push('Good ROI above 6%');
    } else if (metrics.annualROI >= 4) {
      score += 15;
      reasons.push('Acceptable ROI above 4%');
    } else {
      negativeFactors.push('Low ROI below 4%');
    }
    
    if (metrics.yield >= 6) {
      score += 20;
      reasons.push('Strong rental yield');
    } else if (metrics.yield >= 4) {
      score += 15;
      reasons.push('Good rental yield');
    } else {
      negativeFactors.push('Low rental yield below 4%');
    }

    if (metrics.paybackPeriod <= 15) {
      score += 20;
      reasons.push('Quick payback period');
    } else if (metrics.paybackPeriod <= 20) {
      score += 15;
      reasons.push('Reasonable payback period');
    } else {
      negativeFactors.push('Long payback period over 20 years');
    }

    if (property.property_type === 'Detached') {
      score += 15;
      reasons.push('Detached property premium');
    } else if (property.property_type === 'Semi-detached') {
      score += 10;
      reasons.push('Semi-detached good value');
    } else if (property.property_type === 'Apartment') {
      negativeFactors.push('Apartment - lower capital growth potential');
    }

    if (property.bedrooms >= 4) {
    score += 10;
      reasons.push('Family-sized property');
    } else if (property.bedrooms >= 3) {
      score += 5;
      reasons.push('Good bedroom count');
    } else if (property.bedrooms <= 1) {
      negativeFactors.push('Small property - limited appeal');
    }

    // Additional negative factors
    if (property.tenure === 'Leasehold') {
      negativeFactors.push('Leasehold - additional costs and restrictions');
    }

    if (property.epc_rating && ['F', 'G'].includes(property.epc_rating)) {
      negativeFactors.push('Poor EPC rating - potential upgrade costs');
    }

    let overallRating = 'Poor';
    if (score >= 80) overallRating = 'Excellent';
    else if (score >= 70) overallRating = 'Very Good';
    else if (score >= 60) overallRating = 'Good';
    else if (score >= 50) overallRating = 'Fair';

    return {
      score,
      overallRating,
      reasons,
      negativeFactors
    };
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const filteredWatchlist = watchlist.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || (
      item.address.toLowerCase().includes(searchLower) ||
      item.property_type.toLowerCase().includes(searchLower) ||
      item.tenure.toLowerCase().includes(searchLower)
    );
    
    // If favorites filter is active, only show favorites
    if (showFavoritesOnly) {
      return matchesSearch && item.is_favorite;
    }

    // If offers filter is active, only show properties with offers made
    if (showOffersOnly) {
      return matchesSearch && item.offer_status && item.offer_status !== 'none';
    }
    
    return matchesSearch;
  });

  // Pagination logic
  const itemsPerPage = viewMode === 'cards' ? 6 : 10;
  const totalPages = Math.ceil(filteredWatchlist.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedWatchlist = filteredWatchlist.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showFavoritesOnly, showOffersOnly, viewMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading watchlist...</p>
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
                  <span className="mr-2">📊</span>
                  Professional Property Analyzer
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight"
              >
                Property Analyzer
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Investment Analysis & Deal Comparison
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
              >
                Analyze investment opportunities, compare properties, and make data-driven decisions with our comprehensive property analysis tools.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <button
                  onClick={() => window.location.href = '/portfolio-tracker'}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span className="mr-2">📊</span>
                  View Investment Portfolio
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg shadow-lg hover:shadow-xl border border-gray-200 transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span className="mr-2">🔄</span>
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
                  <span>✅</span>
                  <span>Property comparison</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📈</span>
                  <span>Investment analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💡</span>
                  <span>Deal insights</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Demo Mode Banner */}
          {(!user || tier === 'free' || tierLoading) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-lg">ℹ️</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Demo Mode</h3>
                  <p className="text-blue-700 mb-3">
                    You're currently viewing demo data. To capture real properties and access your personal watchlist, 
                    please <a href="/auth" className="font-semibold underline hover:text-blue-800">sign in</a> or 
                    <a href="/pricing" className="font-semibold underline hover:text-blue-800 ml-1">upgrade your account</a>.
                  </p>
                  <div className="flex items-center gap-6 text-sm text-blue-600">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                      Demo properties shown
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                      Real data when logged in
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Filter Status Info */}

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
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                showFavoritesOnly
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700 shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-sm">⭐</span>
              {showFavoritesOnly ? 'Show All' : 'Favorites'}
              {watchlist.filter(p => p.is_favorite).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">
                  {watchlist.filter(p => p.is_favorite).length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                const newState = !showOffersOnly;
                console.log('Button clicked! Current state:', showOffersOnly, 'New state:', newState);
                setShowOffersOnly(newState);
                console.log('Offers filter toggled:', newState);
                console.log('Properties with offers:', watchlist.filter(p => p.offer_status && p.offer_status !== 'none').length);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                showOffersOnly
                  ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg border-2 border-green-400'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300 border-2 border-gray-300'
              }`}
              style={{ 
                minWidth: '120px',
                backgroundColor: showOffersOnly ? '#10b981' : '#e5e7eb',
                color: showOffersOnly ? '#ffffff' : '#1f2937',
                border: showOffersOnly ? '2px solid #34d399' : '2px solid #d1d5db',
                boxShadow: showOffersOnly ? '0 10px 15px -3px rgba(16, 185, 129, 0.3)' : 'none'
              }}
            >
              <span className="text-sm">📋</span>
              <span className="font-semibold">{showOffersOnly ? 'Show All' : 'Offers Made'}</span>
              {watchlist.filter(p => p.offer_status && p.offer_status !== 'none').length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white bg-opacity-30 rounded-full text-xs font-bold">
                  {watchlist.filter(p => p.offer_status && p.offer_status !== 'none').length}
                </span>
              )}
            </button>
            <button
              onClick={toggleComparisonMode}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                comparisonMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-md'
              }`}
            >
              <span className="text-sm">⚖️</span>
              {comparisonMode ? 'Exit Comparison' : 'Compare Properties'}
              {selectedProperties.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">
                  {selectedProperties.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              <span className="text-sm">{viewMode === 'cards' ? '📋' : '🃏'}</span>
              {viewMode === 'cards' ? 'List View' : 'Card View'}
            </button>
          </div>
        </div>

        {/* Comparison Mode Banner */}
        {comparisonMode && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚖️</span>
                <div>
                  <h3 className="font-semibold text-blue-900">Comparison Mode</h3>
                  <p className="text-sm text-blue-700">
                    Select up to 3 properties to compare side by side. Click the checkboxes on property cards to select them.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {selectedProperties.length > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-900">
                      {selectedProperties.length} selected
                    </p>
                    <p className="text-xs text-blue-600">
                      {selectedProperties.length === 1 ? 'Select 1-2 more' : 
                       selectedProperties.length === 2 ? 'Select 1 more or compare now' : 
                       'Ready to compare'}
                    </p>
                  </div>
                )}
                {selectedProperties.length >= 2 && (
                  <button
                    onClick={() => {
                      // Scroll to the comparison view
                      const comparisonElement = document.getElementById('comparison-view');
                      if (comparisonElement) {
                        comparisonElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-md flex items-center gap-2 border border-blue-500"
                  >
                    <span className="text-sm">📊</span>
                    <span className="font-semibold">View Comparison</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Properties Grid */}

        
        {filteredWatchlist.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {showOffersOnly ? 'No properties with offers found' : 'No properties found'}
            </h3>
            <p className="text-gray-600">
              {showOffersOnly 
                ? 'No properties in your watchlist have offers made. Try adding some offers or adjust your search.'
                : 'Try adjusting your search or filters'
              }
            </p>
            {showOffersOnly && (
              <button
                onClick={() => setShowOffersOnly(false)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Show All Properties
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'cards' ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
            
            {paginatedWatchlist.map((item, index) => {
              const metrics = calculateInvestmentMetrics(item);
              const assessment = assessDealQuality(item);
              const growthProjections = calculateGrowthProjections(item);
              
              if (viewMode === 'list') {
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center p-4">
                      {/* Property Image */}
                      <div className="relative w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.images && item.images.length > 0 && isValidImageUrl(item.images[0]) ? (
                          <Image
                            src={item.images[0]}
                            alt={item.title}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center ${item.images && item.images.length > 0 && isValidImageUrl(item.images[0]) ? 'hidden' : ''}`}>
                          <div className="text-center">
                            <div className="text-lg">🏠</div>
                            <div className="text-xs text-gray-500">{item.property_type || 'Property'}</div>
                          </div>
                        </div>
                        
                        {/* Status Badges */}
                        <div className="absolute -top-1 -right-1 flex flex-col gap-1">
                          {/* Source Badge */}
                          <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full shadow-sm">
                            {getSourceIcon(item.source)}
                          </span>
                          
                          {/* Offer Status */}
                          {item.offer_status && item.offer_status !== 'none' && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full shadow-sm ${
                              item.offer_status === 'offer_accepted' ? 'bg-green-100 text-green-800' :
                              item.offer_status === 'offer_rejected' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {item.offer_status === 'offer_accepted' ? '✅' :
                               item.offer_status === 'offer_rejected' ? '❌' :
                               '📋'}
                            </span>
                          )}
                          
                          {/* Favorite Status */}
                          {item.is_favorite && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full shadow-sm">
                              ⭐
                            </span>
                          )}
                        </div>
                        
                        {/* Comparison Selection */}
                        {comparisonMode && (
                          <div className="absolute -top-1 -left-1">
                            <label className="flex items-center justify-center w-5 h-5 bg-white rounded-full shadow-md cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200">
                              <input
                                type="checkbox"
                                checked={isPropertySelected(item.id)}
                                onChange={() => togglePropertySelection(item.id)}
                                className="sr-only"
                                disabled={selectedProperties.length >= 3 && !isPropertySelected(item.id)}
                              />
                              {isPropertySelected(item.id) ? (
                                <span className="text-blue-600 text-xs">✓</span>
                              ) : (
                                <span className="text-gray-400 text-xs">+</span>
                              )}
                            </label>
                          </div>
                        )}
                      </div>
                      
                      {/* Property Info */}
                      <div className="flex-1 ml-4 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 text-base truncate">
                              {item.bedrooms} bed {item.property_type.toLowerCase()}
                            </h3>
                            <p className="text-gray-600 text-sm truncate mt-1">{item.address}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              {item.total_size && (
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                                  {item.total_size.value} {item.total_size.unit}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                                {item.tenure}
                              </span>
                              {item.epc_rating && (
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                                  EPC: {item.epc_rating}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Price and Date */}
                          <div className="text-right ml-4 flex-shrink-0">
                            <div className="text-lg font-bold text-gray-900">{formatPrice(item.price)}</div>
                            <div className="text-xs text-gray-500 mt-1">{formatDate(item.captured_at)}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Investment Metrics */}
                      <div className="hidden md:flex items-center gap-4 ml-6 flex-shrink-0">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Investment</div>
                          <div className="font-semibold text-sm text-gray-900">{formatPrice(metrics.totalInvestmentCost)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Yield</div>
                          <div className={`font-semibold text-sm ${metrics.yield >= 6 ? 'text-green-600' : 'text-orange-600'}`}>
                            {metrics.yield.toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Monthly</div>
                          <div className={`font-semibold text-sm ${metrics.netAnnualProfit / 12 > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPrice(metrics.netAnnualProfit / 12)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        <button
                          onClick={() => handleEditProperty(item.id)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Property"
                        >
                          <span className="text-sm">✏️</span>
                        </button>
                        <button
                          onClick={() => setOfferModal(item.id)}
                          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Copy Offer"
                        >
                          <span className="text-sm">📋</span>
                        </button>
                        <button
                          onClick={() => setStrategyModal(item.id)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="View Strategy"
                        >
                          <span className="text-sm">🎯</span>
                        </button>
                        <button
                          onClick={() => toggleFavorite(item.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            item.is_favorite 
                              ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                              : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                          }`}
                          title={item.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                        >
                          <span className="text-sm">⭐</span>
                        </button>
                        <button
                          onClick={() => deletePropertyFromWatchlist(item.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Property"
                        >
                          <span className="text-sm">🗑️</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              }
              
              // Card view (existing code)
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Property Image */}
                  <div className="relative h-64 bg-gray-200">
                    {item.images && item.images.length > 0 && isValidImageUrl(item.images[0]) ? (
                      <Image
                        src={item.images[0]}
                        alt={item.title}
                        width={800}
                        height={400}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${item.images && item.images.length > 0 && isValidImageUrl(item.images[0]) ? 'hidden' : ''}`}>
                      <div className="text-center">
                        <div className="text-4xl mb-2">🏠</div>
                        <div className="text-sm text-gray-500">{item.property_type || 'Property'}</div>
                      </div>
                    </div>
                    
                    {/* Comparison Selection Checkbox */}
                    {comparisonMode && (
                    <div className="absolute top-3 left-3">
                        <label className="flex items-center justify-center w-6 h-6 bg-white rounded-full shadow-md cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={isPropertySelected(item.id)}
                            onChange={() => togglePropertySelection(item.id)}
                            className="sr-only"
                            disabled={selectedProperties.length >= 3 && !isPropertySelected(item.id)}
                          />
                          {isPropertySelected(item.id) ? (
                            <span className="text-blue-600 text-sm">✓</span>
                          ) : (
                            <span className="text-gray-400 text-sm">+</span>
                          )}
                        </label>
                      </div>
                    )}
                    
                    <div className={`absolute top-3 ${comparisonMode ? 'left-12' : 'left-3'}`}>
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
                    
                    {/* Favorite Indicator */}
                    {item.is_favorite && (
                      <div className="absolute top-12 right-3">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full shadow-sm">
                          ⭐ Favorite
                        </span>
                  </div>
                    )}

                    {/* Offer Status Indicator */}
                    {item.offer_status && item.offer_status !== 'none' && (
                      <div className="absolute top-12 left-3">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full shadow-sm ${
                          item.offer_status === 'offer_accepted' ? 'bg-green-100 text-green-800' :
                          item.offer_status === 'offer_rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item.offer_status === 'offer_accepted' ? '✅ Accepted' :
                           item.offer_status === 'offer_rejected' ? '❌ Rejected' :
                           '📋 Offer Made'}
                        </span>
                          </div>
                        )}
                    
                    {/* Selection Overlay */}
                    {comparisonMode && isPropertySelected(item.id) && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-blue-500 rounded-t-lg pointer-events-none">
                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {selectedProperties.indexOf(item.id) + 1}
                          </div>
                            </div>
                          )}
                        </div>
                        
                  {/* Property Content */}
                  <div className="p-6">
                    {/* Property Header */}
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {item.bedrooms} bedroom {item.property_type.toLowerCase()}
                      </h2>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{item.address}</span>
                        </div>
                      {item.total_size && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <span className="text-gray-500">📏</span>
                          <span>
                            {item.total_size.unit === 'sq ft' 
                              ? `${item.total_size.value.toLocaleString()} sq ft (${Math.round(item.total_size.value * 0.0929).toLocaleString()} sq m)`
                              : item.total_size.unit === 'sq m'
                              ? `${item.total_size.value.toLocaleString()} sq m (${Math.round(item.total_size.value * 10.764).toLocaleString()} sq ft)`
                              : `${item.total_size.value.toLocaleString()} ${item.total_size.unit}`
                            }
                          </span>
                      </div>
                      )}
                      <p className="text-lg font-semibold text-gray-800 mb-3">
                        {formatPrice(item.price)}
                      </p>
                      
                      {/* Quick Property Details */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-gray-500">🏠</span>
                          <span>{item.tenure || 'Freehold'}</span>
                        </div>
                        {item.epc_rating && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-gray-500">⚡</span>
                            <span>EPC: {item.epc_rating}</span>
                        </div>
                        )}
                        {item.bathrooms && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-gray-500">🚿</span>
                            <span>{item.bathrooms} bathroom{item.bathrooms > 1 ? 's' : ''}</span>
                      </div>
                        )}
                        {item.postcode && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-gray-500">📍</span>
                            <span>{item.postcode}</span>
                        </div>
                        )}
                      </div>
                      
                      {/* Current Offer Summary */}
                      {item.offer_status && item.offer_status !== 'none' && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-blue-900 text-sm flex items-center gap-1">
                              <span>📋</span>
                              Current Offer
                            </h5>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              item.offer_status === 'offer_accepted' ? 'bg-green-100 text-green-800' :
                              item.offer_status === 'offer_rejected' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {item.offer_status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </div>
                          {item.offer_amount && (
                            <div className="text-lg font-bold text-blue-900 mb-1">
                              £{item.offer_amount.toLocaleString()}
                        </div>
                          )}
                          {item.offer_date && (
                            <div className="text-xs text-blue-700 mb-1">
                              {new Date(item.offer_date).toLocaleDateString()}
                          </div>
                          )}
                          {item.offer_notes && (
                            <div className="text-xs text-blue-600">
                              {item.offer_notes}
                        </div>
                          )}
                          </div>
                      )}

                      {/* Offer History Summary */}
                      {item.offer_history && item.offer_history.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-blue-900 text-sm flex items-center gap-1">
                              <span>📋</span>
                              Offer History ({item.offer_history.length})
                            </h5>
                            <span className="text-xs text-blue-600">
                              {item.offer_history.length > 1 ? 'Multiple offers' : '1 offer'}
                            </span>
                        </div>
                          <div className="space-y-2">
                            {item.offer_history.slice(-2).map((offer) => (
                              <div key={offer.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                    offer.status === 'offer_accepted' ? 'bg-green-100 text-green-800' :
                                    offer.status === 'offer_rejected' ? 'bg-red-100 text-red-800' :
                                    offer.status === 'offer_withdrawn' ? 'bg-gray-100 text-gray-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {offer.status.replace('_', ' ').toUpperCase()}
                        </span>
                                  <span className="font-semibold text-gray-900">{formatPrice(offer.amount)}</span>
                      </div>
                                <span className="text-gray-600">{new Date(offer.date).toLocaleDateString()}</span>
                        </div>
                            ))}
                            {item.offer_history.length > 2 && (
                              <div className="text-xs text-blue-600 text-center">
                                +{item.offer_history.length - 2} more offers
                                      </div>
                            )}
                                      </div>
                                    </div>
                      )}
                                  </div>
                                  
                    {/* Investment Summary Card */}
                    <div className="mb-6 p-6 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 shadow-lg">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg">
                          <span className="text-2xl">💰</span>
                                      </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-800">Investment Summary</h4>
                          <p className="text-sm text-gray-600">Complete financial analysis and projections</p>
                                      </div>
                                      </div>
                      
                      {/* Key Performance Metrics */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <button 
                          onClick={() => toggleSection(`cost-breakdown-${item.id}`)}
                          className="flex flex-col p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 shadow-sm hover:from-green-100 hover:to-green-200 transition-colors cursor-pointer"
                        >
                          <div className="text-xs text-green-600 font-medium mb-1">Investment Cost</div>
                          <div className="text-lg font-bold text-green-700 leading-tight">
                            {formatPrice(calculateDetailedCostBreakdown(item).totalInvestmentCost)}
                          </div>
                          <div className="text-xs text-green-500 mt-1">Click for breakdown</div>
                        </button>
                        <div className="flex flex-col p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm">
                          <div className="text-xs text-blue-600 font-medium mb-1">Yield</div>
                          <div className="text-lg font-bold text-blue-700 leading-tight">
                            {metrics.yield}%
                                    </div>
                                    </div>
                        <div className="flex flex-col p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm">
                          <div className="text-xs text-blue-600 font-medium mb-1">Monthly Profit</div>
                          <div className="text-lg font-bold text-blue-700 leading-tight">
                            {formatPrice(metrics.netAnnualProfit / 12)}
                                  </div>
                                      </div>
                        <div className="flex flex-col p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 shadow-sm">
                          <div className="text-xs text-orange-600 font-medium mb-1">Estimated Growth (per year)</div>
                          <div className="text-lg font-bold text-orange-700 leading-tight">
                            {growthProjections?.conservativeGrowth || '5.0'}%
                                      </div>
                                    </div>
                                  </div>
                                  
                      {/* Detailed Cost Breakdown */}
                      {expandedSections.has(`cost-breakdown-${item.id}`) && (
                        <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                              <span className="text-xl">💰</span>
                              Investment Cost Breakdown
                            </h4>
                            {editingCostBreakdown === item.id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveCostBreakdown(item.id)}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelCostBreakdown}
                                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditCostBreakdown(item.id)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                          <div className="space-y-3 text-sm">
                            {/* Purchase Type Options (only in edit mode) */}
                            {editingCostBreakdown === item.id && (
                              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  📋 Purchase Type (affects Stamp Duty):
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      name={`purchaseType-${item.id}`}
                                      value="first_home"
                                      checked={costBreakdownData[item.id]?.purchaseType === 'first_home'}
                                      onChange={(e) => updateCostBreakdownField(item.id, 'purchaseType', e.target.value)}
                                      className="text-blue-600"
                                    />
                                    <span className="text-sm">First Home</span>
                                  </label>
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      name={`purchaseType-${item.id}`}
                                      value="own_name"
                                      checked={costBreakdownData[item.id]?.purchaseType === 'own_name'}
                                      onChange={(e) => updateCostBreakdownField(item.id, 'purchaseType', e.target.value)}
                                      className="text-blue-600"
                                    />
                                    <span className="text-sm">Own Name</span>
                                  </label>
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      name={`purchaseType-${item.id}`}
                                      value="second_home"
                                      checked={costBreakdownData[item.id]?.purchaseType === 'second_home'}
                                      onChange={(e) => updateCostBreakdownField(item.id, 'purchaseType', e.target.value)}
                                      className="text-blue-600"
                                    />
                                    <span className="text-sm">Second Home</span>
                                  </label>
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      name={`purchaseType-${item.id}`}
                                      value="ltd_company"
                                      checked={costBreakdownData[item.id]?.purchaseType === 'ltd_company'}
                                      onChange={(e) => updateCostBreakdownField(item.id, 'purchaseType', e.target.value)}
                                      className="text-blue-600"
                                    />
                                    <span className="text-sm">LTD Company</span>
                                  </label>
                                </div>
                              </div>
                            )}

                            {/* Major Costs */}
                            <div className="flex justify-between items-center p-3 bg-blue-100 rounded-lg border border-blue-200 shadow-sm">
                              <span className="text-gray-700 font-medium">🏦 Deposit (25%):</span>
                              {editingCostBreakdown === item.id ? (
                                <input
                                  type="number"
                                  value={costBreakdownData[item.id]?.deposit || calculateDetailedCostBreakdown(item).deposit}
                                  onChange={(e) => updateCostBreakdownField(item.id, 'deposit', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-1 text-right font-bold text-blue-700 border border-blue-300 rounded"
                                />
                              ) : (
                                <span className="font-bold text-blue-700">+{formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).deposit)}</span>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-purple-100 rounded-lg border border-purple-200 shadow-sm">
                              <span className="text-gray-700 font-medium">📋 Stamp Duty:</span>
                              {editingCostBreakdown === item.id ? (
                                <input
                                  type="number"
                                  value={costBreakdownData[item.id]?.stampDuty || calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).stampDuty}
                                  onChange={(e) => updateCostBreakdownField(item.id, 'stampDuty', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-1 text-right font-bold text-purple-700 border border-purple-300 rounded"
                                />
                              ) : (
                                <span className="font-bold text-purple-700">+{formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).stampDuty)}</span>
                              )}
                            </div>
                            
                            {/* Refurbishment - Always show in edit mode, conditional in view mode */}
                            {(editingCostBreakdown === item.id || calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).refurbishmentCost > 0) && (
                              <div className="flex justify-between items-center p-3 bg-orange-100 rounded-lg border border-orange-200 shadow-sm">
                                <span className="text-gray-700 font-medium">🔨 Refurbishment:</span>
                                {editingCostBreakdown === item.id ? (
                                  <input
                                    type="number"
                                    value={costBreakdownData[item.id]?.refurbishmentCost || calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).refurbishmentCost}
                                    onChange={(e) => updateCostBreakdownField(item.id, 'refurbishmentCost', parseFloat(e.target.value) || 0)}
                                    className="w-24 p-1 text-right font-bold text-orange-700 border border-orange-300 rounded"
                                  />
                                ) : (
                                  <span className="font-bold text-orange-700">+{formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).refurbishmentCost)}</span>
                                )}
                              </div>
                            )}
                            
                            {/* Legal & Setup Costs */}
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-gray-700 font-medium">⚖️ Legal Fees:</span>
                              {editingCostBreakdown === item.id ? (
                                <input
                                  type="number"
                                  value={costBreakdownData[item.id]?.legalFees || calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).legalFees}
                                  onChange={(e) => updateCostBreakdownField(item.id, 'legalFees', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-1 text-right font-bold text-gray-700 border border-gray-300 rounded"
                                />
                              ) : (
                                <span className="font-bold text-gray-700">+{formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).legalFees)}</span>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-gray-700 font-medium">🔍 Survey Fees:</span>
                              {editingCostBreakdown === item.id ? (
                                <input
                                  type="number"
                                  value={costBreakdownData[item.id]?.surveyFees || calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).surveyFees}
                                  onChange={(e) => updateCostBreakdownField(item.id, 'surveyFees', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-1 text-right font-bold text-gray-700 border border-gray-300 rounded"
                                />
                              ) : (
                                <span className="font-bold text-gray-700">+{formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).surveyFees)}</span>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-gray-700 font-medium">🏦 Mortgage Fees:</span>
                              {editingCostBreakdown === item.id ? (
                                <input
                                  type="number"
                                  value={costBreakdownData[item.id]?.mortgageFees || calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).mortgageFees}
                                  onChange={(e) => updateCostBreakdownField(item.id, 'mortgageFees', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-1 text-right font-bold text-gray-700 border border-gray-300 rounded"
                                />
                              ) : (
                                <span className="font-bold text-gray-700">+{formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).mortgageFees)}</span>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-gray-700 font-medium">📄 Land Registry:</span>
                              {editingCostBreakdown === item.id ? (
                                <input
                                  type="number"
                                  value={costBreakdownData[item.id]?.landRegistryFees || calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).landRegistryFees}
                                  onChange={(e) => updateCostBreakdownField(item.id, 'landRegistryFees', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-1 text-right font-bold text-gray-700 border border-gray-300 rounded"
                                />
                              ) : (
                                <span className="font-bold text-gray-700">+{formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).landRegistryFees)}</span>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-gray-700 font-medium">🔎 Searches:</span>
                              {editingCostBreakdown === item.id ? (
                                <input
                                  type="number"
                                  value={costBreakdownData[item.id]?.searchesFees || calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).searchesFees}
                                  onChange={(e) => updateCostBreakdownField(item.id, 'searchesFees', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-1 text-right font-bold text-gray-700 border border-gray-300 rounded"
                                />
                              ) : (
                                <span className="font-bold text-gray-700">+{formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).searchesFees)}</span>
                              )}
                            </div>
                            
                            {/* Compliance Costs */}
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-gray-700 font-medium">🔥 Gas Safety Certificate:</span>
                              {editingCostBreakdown === item.id ? (
                                <input
                                  type="number"
                                  value={costBreakdownData[item.id]?.gasSafetyCertificate || calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).gasSafetyCertificate}
                                  onChange={(e) => updateCostBreakdownField(item.id, 'gasSafetyCertificate', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-1 text-right font-bold text-gray-700 border border-gray-300 rounded"
                                />
                              ) : (
                                <span className="font-bold text-gray-700">+{formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).gasSafetyCertificate)}</span>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-gray-700 font-medium">⚡ Electrical Certificate:</span>
                              {editingCostBreakdown === item.id ? (
                                <input
                                  type="number"
                                  value={costBreakdownData[item.id]?.electricalSafetyCertificate || calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).electricalSafetyCertificate}
                                  onChange={(e) => updateCostBreakdownField(item.id, 'electricalSafetyCertificate', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-1 text-right font-bold text-gray-700 border border-gray-300 rounded"
                                />
                              ) : (
                                <span className="font-bold text-gray-700">+{formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).electricalSafetyCertificate)}</span>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-gray-700 font-medium">🌱 EPC Certificate:</span>
                              {editingCostBreakdown === item.id ? (
                                <input
                                  type="number"
                                  value={costBreakdownData[item.id]?.energyPerformanceCertificate || calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).energyPerformanceCertificate}
                                  onChange={(e) => updateCostBreakdownField(item.id, 'energyPerformanceCertificate', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-1 text-right font-bold text-gray-700 border border-gray-300 rounded"
                                />
                              ) : (
                                <span className="font-bold text-gray-700">+{formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).energyPerformanceCertificate)}</span>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-gray-700 font-medium">🚨 Fire Safety Assessment:</span>
                              {editingCostBreakdown === item.id ? (
                                <input
                                  type="number"
                                  value={costBreakdownData[item.id]?.fireSafetyAssessment || calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).fireSafetyAssessment}
                                  onChange={(e) => updateCostBreakdownField(item.id, 'fireSafetyAssessment', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-1 text-right font-bold text-gray-700 border border-gray-300 rounded"
                                />
                              ) : (
                                <span className="font-bold text-gray-700">+{formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).fireSafetyAssessment)}</span>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-gray-700 font-medium">💧 Legionella Assessment:</span>
                              {editingCostBreakdown === item.id ? (
                                <input
                                  type="number"
                                  value={costBreakdownData[item.id]?.legionellaRiskAssessment || calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).legionellaRiskAssessment}
                                  onChange={(e) => updateCostBreakdownField(item.id, 'legionellaRiskAssessment', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-1 text-right font-bold text-gray-700 border border-gray-300 rounded"
                                />
                              ) : (
                                <span className="font-bold text-gray-700">+{formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).legionellaRiskAssessment)}</span>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-gray-700 font-medium">🏗️ Asbestos Survey:</span>
                              {editingCostBreakdown === item.id ? (
                                <input
                                  type="number"
                                  value={costBreakdownData[item.id]?.asbestosSurvey || calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).asbestosSurvey}
                                  onChange={(e) => updateCostBreakdownField(item.id, 'asbestosSurvey', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-1 text-right font-bold text-gray-700 border border-gray-300 rounded"
                                />
                              ) : (
                                <span className="font-bold text-gray-700">+{formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).asbestosSurvey)}</span>
                              )}
                            </div>
                            
                            {/* Additional Costs */}
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-gray-700 font-medium">🛡️ Landlord Insurance:</span>
                              {editingCostBreakdown === item.id ? (
                                <input
                                  type="number"
                                  value={costBreakdownData[item.id]?.landlordInsurance || calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).landlordInsurance}
                                  onChange={(e) => updateCostBreakdownField(item.id, 'landlordInsurance', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-1 text-right font-bold text-gray-700 border border-gray-300 rounded"
                                />
                              ) : (
                                <span className="font-bold text-gray-700">+{formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).landlordInsurance)}</span>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-gray-700 font-medium">🪑 Furniture & Appliances:</span>
                              {editingCostBreakdown === item.id ? (
                                <input
                                  type="number"
                                  value={costBreakdownData[item.id]?.furnitureAndAppliances || calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).furnitureAndAppliances}
                                  onChange={(e) => updateCostBreakdownField(item.id, 'furnitureAndAppliances', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-1 text-right font-bold text-gray-700 border border-gray-300 rounded"
                                />
                              ) : (
                                <span className="font-bold text-gray-700">+{formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).furnitureAndAppliances)}</span>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-gray-700 font-medium">📢 Marketing & Letting:</span>
                              {editingCostBreakdown === item.id ? (
                                <input
                                  type="number"
                                  value={costBreakdownData[item.id]?.marketingAndLettingFees || calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).marketingAndLettingFees}
                                  onChange={(e) => updateCostBreakdownField(item.id, 'marketingAndLettingFees', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-1 text-right font-bold text-gray-700 border border-gray-300 rounded"
                                />
                              ) : (
                                <span className="font-bold text-gray-700">+{formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).marketingAndLettingFees)}</span>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-gray-700 font-medium">💰 Contingency Fund:</span>
                              {editingCostBreakdown === item.id ? (
                                <input
                                  type="number"
                                  value={costBreakdownData[item.id]?.contingencyFund || calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).contingencyFund}
                                  onChange={(e) => updateCostBreakdownField(item.id, 'contingencyFund', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-1 text-right font-bold text-gray-700 border border-gray-300 rounded"
                                />
                              ) : (
                                <span className="font-bold text-gray-700">+{formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).contingencyFund)}</span>
                              )}
                            </div>
                            
                            {/* Total */}
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-t-2 border-green-200 shadow-sm">
                              <span className="font-semibold text-gray-800">= Total Investment Required:</span>
                              <span className="font-bold text-green-600 text-lg">= {formatPrice(calculateDetailedCostBreakdown(item, costBreakdownData[item.id]).totalInvestmentCost)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                                  
                      {/* Mortgage Type */}
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <span className="text-lg">🏠</span>
                                      </div>
                        <div>
                          <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Mortgage Type</div>
                          <div className="text-base font-bold text-gray-800">Interest-Only Mortgage</div>
                                      </div>
                                    </div>
                                  </div>
                                  
                    {/* Monthly Cash Flow */}
                    <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200">
                      <h4 className="text-lg font-bold text-gray-900 mb-4">Monthly Cash Flow</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border border-green-200 shadow-sm">
                          <span className="text-gray-700 font-medium">+ Rental Income:</span>
                          <span className="font-bold text-green-700">+{formatPrice(metrics.monthlyRent)}</span>
                                      </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100 shadow-sm">
                          <span className="text-gray-700 font-medium">- Mortgage Payment:</span>
                          <span className="font-bold text-red-600">-{formatPrice(metrics.monthlyMortgagePayment)}</span>
                                      </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100 shadow-sm">
                          <span className="text-gray-700 font-medium">- Other Expenses:</span>
                          <span className="font-bold text-red-600">-{formatPrice(metrics.monthlyRent * 0.15)}</span>
                                      </div>
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-t-2 border-blue-200 shadow-sm">
                          <span className="font-semibold text-gray-800">= Net Cash Flow:</span>
                          <span className="font-bold text-blue-600 text-lg">= {formatPrice(metrics.netAnnualProfit / 12)}</span>
                                      </div>
                                    </div>
                    </div>

                    {/* Accordion Sections */}
                    <div className="space-y-3">
                      {/* Quick Metrics Section */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <button 
                          onClick={() => toggleSection(`quick-metrics-${item.id}`)}
                          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 text-left hover:from-emerald-700 hover:to-emerald-800 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold text-sm">QUICK METRICS</span>
                            </div>
                            <ChevronDownIcon 
                              className={`w-4 h-4 text-white transition-transform ${
                                expandedSections.has(`quick-metrics-${item.id}`) ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        {expandedSections.has(`quick-metrics-${item.id}`) && (
                          <div className="p-4 bg-white border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex justify-between p-2 bg-gray-50 rounded border border-gray-100">
                                <span className="text-gray-700 font-medium">Monthly Rent:</span>
                                <span className="font-bold text-blue-600">{formatPrice(metrics.monthlyRent)}</span>
                              </div>
                              <div className="flex justify-between p-2 bg-gray-50 rounded border border-gray-100">
                                <span className="text-gray-700 font-medium">Annual ROI:</span>
                                <span className="font-bold text-purple-600">{metrics.annualROI.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between p-2 bg-gray-50 rounded border border-gray-100">
                                <span className="text-gray-700 font-medium">Profit Margin:</span>
                                <span className="font-bold text-indigo-600">{metrics.realProfitMargin.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between p-2 bg-gray-50 rounded border border-gray-100">
                                <span className="text-gray-700 font-medium">Payback Period:</span>
                                <span className="font-bold text-orange-600">{metrics.paybackPeriod.toFixed(1)}y</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Growth Projections Section */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <button 
                          onClick={() => toggleSection(`growth-projections-${item.id}`)}
                          className="w-full bg-gradient-to-r from-sky-600 to-sky-700 px-4 py-3 text-left hover:from-sky-700 hover:to-sky-800 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold text-sm">GROWTH PROJECTIONS</span>
                            </div>
                            <ChevronDownIcon 
                              className={`w-4 h-4 text-white transition-transform ${
                                expandedSections.has(`growth-projections-${item.id}`) ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        {expandedSections.has(`growth-projections-${item.id}`) && (
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
                                <span className="font-bold text-blue-600">{growthProjections.marketTrend}</span>
                              </div>
                              <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                <span className="text-gray-700 font-medium">Rental Demand:</span>
                                <span className="font-bold text-green-600">{growthProjections.rentalDemand}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Recommended Offer Section */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <button 
                          onClick={() => toggleSection(`recommended-offer-${item.id}`)}
                          className="w-full bg-gradient-to-r from-orange-600 to-orange-700 px-4 py-3 text-left hover:from-orange-700 hover:to-orange-800 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold text-sm">RECOMMENDED OFFER</span>
                            </div>
                            <ChevronDownIcon 
                              className={`w-4 h-4 text-white transition-transform ${
                                expandedSections.has(`recommended-offer-${item.id}`) ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        {expandedSections.has(`recommended-offer-${item.id}`) && (
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

                      {/* Investment Summary Section */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <button 
                          onClick={() => toggleSection(`investment-summary-${item.id}`)}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-left hover:from-blue-700 hover:to-blue-800 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold text-sm">INVESTMENT SUMMARY</span>
                            </div>
                            <ChevronDownIcon 
                              className={`w-4 h-4 text-white transition-transform ${
                                expandedSections.has(`investment-summary-${item.id}`) ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        {expandedSections.has(`investment-summary-${item.id}`) && (
                          <div className="p-4 bg-white border-t border-gray-200">
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                <span className="text-gray-700 font-medium">Total Investment:</span>
                                <span className="font-bold text-blue-600">{formatPrice(item.price)}</span>
                              </div>
                              <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                <span className="text-gray-700 font-medium">Annual Profit:</span>
                                <span className="font-bold text-black">{formatPrice(metrics.netAnnualProfit)}</span>
                              </div>
                              <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                <span className="text-gray-700 font-medium">Deal Score:</span>
                                <span className="font-bold text-blue-600">{assessment.score}/100</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Detailed Breakdown Section */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <button 
                          onClick={() => toggleSection(`detailed-breakdown-${item.id}`)}
                          className="w-full bg-gradient-to-r from-slate-600 to-slate-700 px-4 py-3 text-left hover:from-slate-700 hover:to-slate-800 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold text-sm">DETAILED BREAKDOWN</span>
                            </div>
                            <ChevronDownIcon 
                              className={`w-4 h-4 text-white transition-transform ${
                                expandedSections.has(`detailed-breakdown-${item.id}`) ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        {expandedSections.has(`detailed-breakdown-${item.id}`) && (
                          <div className="p-4 bg-white border-t border-gray-200">
                            <div className="space-y-3 text-sm">
                              <div className="text-xs text-gray-600 mb-2 font-medium">Deal Assessment:</div>
                              {assessment.reasons.map((reason, index) => (
                                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                  <span className="text-green-500 font-bold">✔</span>
                                  <span className="text-gray-700 font-medium">{reason}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Debug: Show if comparison mode is active */}
                    {comparisonMode && (
                      <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
                        Comparison Mode Active - {selectedProperties.length} properties selected
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-6 space-y-3">
                      {/* Primary Action */}
                      <button
                        onClick={() => window.open(item.original_url, '_blank')}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        View Original Listing
                      </button>
                      
                      {/* Secondary Actions */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleEditProperty(item.id)}
                          className="py-2.5 px-4 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 border border-gray-200"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Edit Property
                        </button>
                        
                        <button
                          onClick={() => setOfferModal(item.id)}
                          className="py-2.5 px-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 min-w-0"
                        >
                          <span className="text-sm">📋</span>
                          Copy Offer
                        </button>
                      </div>
                        
                      {/* Tertiary Actions */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setStrategyModal(item.id)}
                          className="py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                        >
                          <span className="text-sm">🎯</span>
                          Strategy
                        </button>
                      
                        <button
                          onClick={() => toggleFavorite(item.id)}
                          className={`py-2.5 px-4 font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 border ${
                            item.is_favorite 
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200' 
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-sm">{item.is_favorite ? '⭐' : '☆'}</span>
                          {item.is_favorite ? 'Favorited' : 'Favorite'}
                        </button>
                      </div>
                      
                      {/* Delete Action */}
                      <div className="pt-2 border-t border-gray-200">
                      <button
                          onClick={() => deletePropertyFromWatchlist(item.id)}
                          className="w-full py-2 px-4 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 border border-red-200"
                      >
                          <XMarkIcon className="h-4 w-4" />
                          Remove from Watchlist
                      </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

        {/* Pagination */}
        {filteredWatchlist.length > itemsPerPage && (
          <div className="mt-8 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
              <div className="flex items-center gap-4">
                {/* Previous Page */}
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  ← Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Page */}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Next →
                </button>
              </div>

              {/* Page Info */}
              <div className="text-center mt-3 text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredWatchlist.length)} of {filteredWatchlist.length} properties
                {viewMode === 'cards' ? ' (6 per page)' : ' (10 per page)'}
              </div>
            </div>
          </div>
        )}

        {/* Comparison View */}
        {comparisonMode && selectedProperties.length > 0 && (
          <div id="comparison-view" className="mt-8">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <span className="text-white">⚖️</span>
                  <span className="text-white">Detailed Comparison ({selectedProperties.length} properties)</span>
                </h3>
              </div>
              
              <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {(() => {
                    // Rank properties by their deal quality score
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
                      
                      const rankColors = {
                        1: 'bg-green-600',
                        2: 'bg-blue-600', 
                        3: 'bg-orange-600'
                      };
                      const rankIcons = {
                        1: '🥇',
                        2: '🥈', 
                        3: '🥉'
                      };
                      const rankLabels = {
                        1: 'Best Investment',
                        2: 'Second Choice',
                        3: 'Third Choice'
                      };
                      const rankCardColors = {
                        1: 'bg-green-50 border-green-200',
                        2: 'bg-blue-50 border-blue-200', 
                        3: 'bg-orange-50 border-orange-200'
                      };
                  
                  return (
                        <div key={property.id} className={`border rounded-lg p-4 ${rankCardColors[rank]}`}>
                          <div className="text-center mb-4">
                            <div className={`inline-flex items-center justify-center w-10 h-10 ${rankColors[rank]} text-white rounded-full text-sm font-bold mb-2`}>
                              {rankIcons[rank]}
                            </div>
                            <h4 className="font-semibold text-gray-900">{property.bedrooms} bed {property.property_type.toLowerCase()}</h4>
                            <p className="text-sm text-gray-600 truncate">{property.address}</p>
                            <div className="mt-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                rank === 1 ? 'bg-green-100 text-green-800' :
                                rank === 2 ? 'bg-blue-100 text-blue-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {rankLabels[rank]}
                              </span>
                            </div>
                          </div>
                        
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Price:</span>
                              <span className="font-semibold text-gray-900">{formatPrice(property.price)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Yield:</span>
                              <span className={`font-semibold ${metrics.yield >= 6 ? 'text-green-600' : 'text-orange-600'}`}>
                                {metrics.yield}%
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">ROI:</span>
                              <span className={`font-semibold ${metrics.annualROI >= 8 ? 'text-green-600' : 'text-orange-600'}`}>
                                {metrics.annualROI.toFixed(1)}%
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Payback:</span>
                              <span className="font-semibold text-gray-900">{metrics.paybackPeriod.toFixed(1)} years</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Score:</span>
                              <span className="font-semibold text-gray-900">{assessment.score}/100</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Rating:</span>
                              <span className={`font-semibold px-2 py-1 rounded text-xs ${
                                assessment.overallRating === 'Excellent' ? 'bg-green-100 text-green-800' :
                                assessment.overallRating === 'Good' ? 'bg-blue-100 text-blue-800' :
                                assessment.overallRating === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {assessment.overallRating}
                              </span>
                            </div>
                          </div>

                          {/* Why This Property */}
                          {assessment.reasons.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <div className="text-xs text-gray-600 mb-1">Why {rankLabels[rank]}:</div>
                              <div className="text-sm text-gray-700">
                                {assessment.reasons.slice(0, 2).join(', ')}
                              </div>
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
                            {/* Primary Actions */}
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleEditProperty(property.id)}
                                className="py-2 px-3 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 border border-gray-200"
                              >
                                <span className="text-sm">✏️</span>
                                Edit Property
                              </button>
                              
                              <button
                                onClick={() => setOfferModal(property.id)}
                                className="py-2 px-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                              >
                                <span className="text-sm">📋</span>
                                Copy Offer
                              </button>
                        </div>

                            {/* Secondary Actions */}
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => setStrategyModal(property.id)}
                                className="py-2 px-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                              >
                                <span className="text-sm">🎯</span>
                                Strategy
                              </button>
                              
                              <button
                                onClick={() => toggleFavorite(property.id)}
                                className={`py-2 px-3 font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 border ${
                                  property.is_favorite 
                                    ? 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200' 
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <span className="text-sm">{property.is_favorite ? '⭐' : '☆'}</span>
                                {property.is_favorite ? 'Favorited' : 'Favorite'}
                              </button>
                        </div>

                            {/* Remove Actions */}
                            <div className="pt-2 border-t border-gray-200">
                              <button
                                onClick={() => togglePropertySelection(property.id)}
                                className="w-full py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium flex items-center justify-center gap-2 border border-red-200"
                              >
                                <span className="text-sm">✕</span>
                                Remove from Comparison
                              </button>
                        </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                
                {selectedProperties.length >= 2 && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-3">
                        Compare key metrics and investment potential side by side
                      </p>
                      <button
                        onClick={() => {
                          // Here you could implement a detailed comparison view
                          info('Detailed comparison view coming soon!');
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium"
                      >
                        View Detailed Comparison
                      </button>
                    </div>
                          </div>
                        )}
                        </div>
                      </div>
          </div>
        )}

      {/* Edit Property Modal */}
      {editingProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit Property</h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
                          </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                          </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (£)</label>
                  <input
                    type="number"
                    value={editForm.price || ''}
                    onChange={(e) => setEditForm({...editForm, price: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                          </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                          </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={editForm.bedrooms || ''}
                      onChange={(e) => setEditForm({...editForm, bedrooms: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                        </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                    <select
                      value={editForm.property_type || 'Detached'}
                      onChange={(e) => setEditForm({...editForm, property_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Detached">Detached</option>
                      <option value="Semi-Detached">Semi-Detached</option>
                      <option value="Terraced">Terraced</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Maisonette">Maisonette</option>
                      <option value="Bungalow">Bungalow</option>
                      <option value="Townhouse">Townhouse</option>
                      <option value="Cottage">Cottage</option>
                    </select>
                        </div>
                      </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">EPC Rating</label>
                    <select
                      value={editForm.epc_rating || 'C'}
                      onChange={(e) => setEditForm({...editForm, epc_rating: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="A">A (92-100)</option>
                      <option value="B">B (81-91)</option>
                      <option value="C">C (69-80)</option>
                      <option value="D">D (55-68)</option>
                      <option value="E">E (39-54)</option>
                      <option value="F">F (21-38)</option>
                      <option value="G">G (1-20)</option>
                    </select>
                          </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Size (sq ft)</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.total_size?.value || ''}
                      onChange={(e) => setEditForm({
                        ...editForm, 
                        total_size: {
                          value: parseInt(e.target.value) || 0,
                          unit: 'sq ft'
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                        </div>
                      </div>
                      
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                          </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                          </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rental Estimate (£)</label>
                    <input
                      type="number"
                      value={editForm.custom_rental_estimate || ''}
                      onChange={(e) => setEditForm({...editForm, custom_rental_estimate: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                          </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Fair Value (£)</label>
                    <input
                      type="number"
                      value={editForm.estimated_fair_value || ''}
                      onChange={(e) => setEditForm({...editForm, estimated_fair_value: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                        </div>
                      </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fair Bid Amount (£)</label>
                  <input
                    type="number"
                    value={editForm.fair_bid_amount || ''}
                    onChange={(e) => setEditForm({...editForm, fair_bid_amount: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                          </div>
                          
                {/* Refurbishment Costs */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Refurbishment Costs</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Estimated costs based on property size, condition, and local contractor rates. These figures are derived from industry averages and recent renovation projects in similar properties.
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Low (£) - Decoration</label>
                      <p className="text-xs text-gray-500 mb-2">Paint, carpets, minor repairs, cosmetic updates</p>
                      <input
                        type="number"
                        value={editForm.refurbishment_costs?.low || ''}
                        onChange={(e) => setEditForm({
                          ...editForm, 
                          refurbishment_costs: {
                            ...editForm.refurbishment_costs,
                            low: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                              </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medium (£) - Detailed</label>
                      <p className="text-xs text-gray-500 mb-2">Kitchen, bathroom updates, flooring, electrical work</p>
                      <input
                        type="number"
                        value={editForm.refurbishment_costs?.medium || ''}
                        onChange={(e) => setEditForm({
                          ...editForm, 
                          refurbishment_costs: {
                            ...editForm.refurbishment_costs,
                            medium: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">High (£) - Back to Brick</label>
                      <p className="text-xs text-gray-500 mb-2">Full renovation, structural work, complete overhaul</p>
                      <input
                        type="number"
                        value={editForm.refurbishment_costs?.high || ''}
                        onChange={(e) => setEditForm({
                          ...editForm, 
                          refurbishment_costs: {
                            ...editForm.refurbishment_costs,
                            high: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                          </div>
                        </div>
                      </div>

                {/* Mortgage Details */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Mortgage Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mortgage Type</label>
                      <select
                        value={editForm.mortgage_type || 'Fixed Rate'}
                        onChange={(e) => setEditForm({...editForm, mortgage_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Fixed Rate">Fixed Rate</option>
                        <option value="Variable Rate">Variable Rate</option>
                        <option value="Tracker">Tracker</option>
                        <option value="Interest Only">Interest Only</option>
                        <option value="Buy to Let">Buy to Let</option>
                      </select>
                          </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mortgage Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.mortgage_rate || ''}
                        onChange={(e) => setEditForm({...editForm, mortgage_rate: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                          </div>
                          </div>
                          </div>

                {/* Offer Tracking */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Offer Tracking</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Offer Status</label>
                      <select
                        value={editForm.offer_status || 'none'}
                        onChange={(e) => setEditForm({...editForm, offer_status: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="none">No Offer Made</option>
                        <option value="offer_made">Offer Made</option>
                        <option value="offer_accepted">Offer Accepted</option>
                        <option value="offer_rejected">Offer Rejected</option>
                      </select>
                      </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Offer Amount (£)</label>
                        <input
                          type="number"
                          value={editForm.offer_amount || ''}
                          onChange={(e) => setEditForm({...editForm, offer_amount: parseInt(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                          </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Offer Date</label>
                        <input
                          type="date"
                          value={editForm.offer_date || ''}
                          onChange={(e) => setEditForm({...editForm, offer_date: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                          </div>
                          </div>
                    
                                            <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Offer Notes</label>
                          <textarea
                            value={editForm.offer_notes || ''}
                            onChange={(e) => setEditForm({...editForm, offer_notes: e.target.value})}
                            rows={3}
                            placeholder="Add any notes about the offer, negotiations, or next steps..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        {/* Offer History Section */}
                        <div className="mt-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-blue-600">📋</span>
                            Offer History
                          </h4>
                          
                          {/* Current Offer Summary */}
                          {editForm.offer_status && editForm.offer_status !== 'none' && (
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold text-blue-900">Current Offer</h5>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  editForm.offer_status === 'offer_accepted' ? 'bg-green-100 text-green-800' :
                                  editForm.offer_status === 'offer_rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {editForm.offer_status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Amount:</span>
                                  <span className="font-semibold text-gray-900 ml-2">{formatPrice(editForm.offer_amount || 0)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Date:</span>
                                  <span className="font-semibold text-gray-900 ml-2">{editForm.offer_date || 'Not set'}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Add New Offer Entry */}
                          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <h5 className="font-semibold text-gray-900 mb-3">Add New Offer Entry</h5>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                                <select
                                  value={newOfferEntry.status || 'offer_made'}
                                  onChange={(e) => setNewOfferEntry({...newOfferEntry, status: e.target.value as any})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                >
                                  <option value="offer_made">Offer Made</option>
                                  <option value="offer_accepted">Offer Accepted</option>
                                  <option value="offer_rejected">Offer Rejected</option>
                                  <option value="offer_withdrawn">Offer Withdrawn</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Amount (£)</label>
                                <input
                                  type="number"
                                  value={newOfferEntry.amount || ''}
                                  onChange={(e) => setNewOfferEntry({...newOfferEntry, amount: parseInt(e.target.value) || 0})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                                <input
                                  type="date"
                                  value={newOfferEntry.date || ''}
                                  onChange={(e) => setNewOfferEntry({...newOfferEntry, date: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Follow-up Date</label>
                                <input
                                  type="date"
                                  value={newOfferEntry.follow_up_date || ''}
                                  onChange={(e) => setNewOfferEntry({...newOfferEntry, follow_up_date: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                              </div>
                            </div>
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                              <textarea
                                value={newOfferEntry.notes || ''}
                                onChange={(e) => setNewOfferEntry({...newOfferEntry, notes: e.target.value})}
                                rows={2}
                                placeholder="Add notes about this offer..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>
                            <button
                              onClick={() => addOfferToHistory()}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              Add to History
                            </button>
                          </div>

                          {/* Offer History List */}
                          {editForm.offer_history && editForm.offer_history.length > 0 && (
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-3">Previous Offers</h5>
                              <div className="space-y-3 max-h-60 overflow-y-auto">
                                {editForm.offer_history.map((offer, index) => (
                                  <div key={offer.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                          offer.status === 'offer_accepted' ? 'bg-green-100 text-green-800' :
                                          offer.status === 'offer_rejected' ? 'bg-red-100 text-red-800' :
                                          offer.status === 'offer_withdrawn' ? 'bg-gray-100 text-gray-800' :
                                          'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          {offer.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900">{formatPrice(offer.amount)}</span>
                                      </div>
                                      <button
                                        onClick={() => removeOfferFromHistory(offer.id)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                    <div className="text-xs text-gray-600 space-y-1">
                                      <div>Date: {new Date(offer.date).toLocaleDateString()}</div>
                                      {offer.follow_up_date && (
                                        <div>Follow-up: {new Date(offer.follow_up_date).toLocaleDateString()}</div>
                                      )}
                                      {offer.notes && (
                                        <div className="text-gray-700 mt-1">{offer.notes}</div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        </div>
                      </div>
                    </div>
              
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => editingProperty && handleSaveEdit(editingProperty)}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-sm">✕</span>
                  Cancel
                </button>
              </div>
            </div>
      </div>
        </div>
      )}

      {/* Strategy Modal */}
      {strategyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Negotiation Strategy</h3>
                <button
                  onClick={() => setStrategyModal(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {(() => {
                const property = watchlist.find(p => p.id === strategyModal);
                if (!property) return null;
                
                const assessment = assessDealQuality(property);
                const strategyText = `Negotiation Strategy for ${property.address}:

1. Start with ${formatPrice(property.price * 0.88)} (12% below asking)
2. Leverage: ${assessment.reasons.join(', ')} - use these as negotiation points
3. Emphasize quick closing and cash offer as buyer advantages
4. Be prepared to go up to ${formatPrice(property.price * 0.95)} if needed
5. Use market data to justify lower offer`;

                return (
                  <div className="space-y-6">
                    {/* Property Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{property.bedrooms} bedroom {property.property_type.toLowerCase()}</h4>
                      <p className="text-gray-600 text-sm">{property.address}</p>
                      <p className="text-lg font-bold text-gray-800 mt-1">{formatPrice(property.price)}</p>
                    </div>

                    {/* Deal Assessment */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Deal Assessment</h4>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-800">Deal Score:</span>
                          <span className="text-lg font-bold text-blue-900">{assessment.score}/100</span>
                        </div>
                        <div className="text-sm text-blue-700">
                          <strong>Rating:</strong> {assessment.overallRating}
                        </div>
                      </div>
                    </div>

                    {/* Positive Factors */}
                    {assessment.reasons.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Positive Factors</h4>
                        <div className="space-y-3">
                            {assessment.reasons.map((reason, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                              <span className="text-green-600 font-bold mt-0.5">✓</span>
                                <span className="text-gray-700">{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                    )}

                    {/* Negative Factors */}
                    {assessment.negativeFactors.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Why Poor Rating</h4>
                        <div className="space-y-3">
                          {assessment.negativeFactors.map((factor, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                              <span className="text-red-600 font-bold mt-0.5">⚠</span>
                              <span className="text-gray-700">{factor}</span>
                      </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Negotiation Strategy */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Recommended Approach</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Starting Offer:</span>
                            <span className="font-bold text-blue-600">{formatPrice(property.price * 0.88)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Target Price:</span>
                            <span className="font-bold text-green-600">{formatPrice(property.price * 0.92)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Maximum Offer:</span>
                            <span className="font-bold text-orange-600">{formatPrice(property.price * 0.95)}</span>
                          </div>
                          </div>
                        </div>
                      </div>

                    {/* Strategy Text */}
                      <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Strategy Text</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{strategyText}</pre>
                          </div>
                          </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={async () => {
                          try {
                            if (navigator.clipboard && window.isSecureContext) {
                              await navigator.clipboard.writeText(strategyText);
                              success('Strategy copied to clipboard');
                            } else {
                              const textArea = document.createElement('textarea');
                              textArea.value = strategyText;
                              document.body.appendChild(textArea);
                              textArea.select();
                              document.execCommand('copy');
                              document.body.removeChild(textArea);
                              success('Strategy copied to clipboard');
                            }
                          } catch (error) {
                            console.error('Failed to copy strategy:', error);
                            showError('Failed to copy strategy to clipboard');
                          }
                        }}
                        className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                      >
                        Copy Strategy
                      </button>
                      <button
                        onClick={() => setStrategyModal(null)}
                        className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="text-sm">✕</span>
                        Close
                      </button>
                          </div>
                          </div>
                );
              })()}
                        </div>
                      </div>
                    </div>
      )}

      {/* Offer Modal */}
      {offerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Professional Offer</h3>
                <button
                  onClick={() => setOfferModal(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {(() => {
                const property = watchlist.find(p => p.id === offerModal);
                if (!property) return null;
                
                const offerText = `Hi, I'm interested in the property at ${property.address}. Based on my analysis, I'd like to make a professional offer of ${formatPrice(property.price * 0.92)}. I'm a serious buyer with financing in place and can move quickly. Please let me know if you'd like to discuss this further.`;

                return (
                  <div className="space-y-6">
                    {/* Property Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{property.bedrooms} bedroom {property.property_type.toLowerCase()}</h4>
                      <p className="text-gray-600 text-sm">{property.address}</p>
                      <p className="text-lg font-bold text-gray-800 mt-1">{formatPrice(property.price)}</p>
            </div>

                    {/* Offer Details */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Offer Details</h4>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Asking Price:</span>
                            <span className="font-bold text-gray-800">{formatPrice(property.price)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Your Offer:</span>
                            <span className="font-bold text-blue-600">{formatPrice(property.price * 0.92)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Discount:</span>
                            <span className="font-bold text-green-600">-8% ({formatPrice(property.price * 0.08).replace('£', '')})</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Offer Text */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Professional Offer Text</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{offerText}</pre>
                      </div>
                    </div>

                    {/* Contact Information */}
                    {property.agent_name && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700 font-medium">Agent:</span>
                              <span className="font-bold text-gray-800">{property.agent_name}</span>
                            </div>
                            {property.agent_phone && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium">Phone:</span>
                                <span className="font-bold text-blue-600">{property.agent_phone}</span>
                              </div>
                            )}
                            {property.source && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium">Source:</span>
                                <span className="font-bold text-gray-800">{property.source}</span>
      </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      {/* Primary Actions */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            const emailSubject = `Offer for ${property.address}`;
                            const emailBody = offerText;
                            const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                            window.open(mailtoLink, '_blank');
                          }}
                          className="py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <span className="text-sm">📧</span>
                          Send Email
                        </button>
                        <button
                          onClick={() => {
                            const phoneNumber = property.agent_phone?.replace(/\s/g, '') || '';
                            if (phoneNumber) {
                              window.open(`tel:${phoneNumber}`, '_blank');
                            } else {
                              info('Phone number not available');
                            }
                          }}
                          className="py-2.5 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                        >
                          <span className="text-sm">📞</span>
                          Call Agent
                        </button>
                      </div>

                      {/* Secondary Actions */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={async () => {
                            try {
                              if (navigator.clipboard && window.isSecureContext) {
                                await navigator.clipboard.writeText(offerText);
                                success('Professional offer copied to clipboard');
                              } else {
                                const textArea = document.createElement('textarea');
                                textArea.value = offerText;
                                document.body.appendChild(textArea);
                                textArea.select();
                                document.execCommand('copy');
                                document.body.removeChild(textArea);
                                success('Professional offer copied to clipboard');
                              }
                            } catch (error) {
                              console.error('Failed to copy offer:', error);
                              showError('Failed to copy offer to clipboard');
                            }
                          }}
                          className="py-2.5 px-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <span className="text-sm">📋</span>
                          Copy Offer
                        </button>
                        <button
                          onClick={() => setOfferModal(null)}
                          className="py-2.5 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <span className="text-sm">✕</span>
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
        </div>
      </>
    );
}