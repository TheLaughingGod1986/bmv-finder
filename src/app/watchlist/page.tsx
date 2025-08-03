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
  Edit,
  CheckCircle,
  Trash2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
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
  epc_rating?: string;
  floor_area?: number;
}

export default function WatchlistPage() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rentEstimates, setRentEstimates] = useState<{ [key: string]: number }>({});
  const [yieldEstimates, setYieldEstimates] = useState<{ [key: string]: number }>({});
  const [calculatingRents, setCalculatingRents] = useState(false);
  const [priceFilter, setPriceFilter] = useState('');
  const [yieldFilter, setYieldFilter] = useState('');
  const [sortBy, setSortBy] = useState('roi');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [savedProperties, setSavedProperties] = useState<string[]>([]);
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WatchlistItem>>({});
  const [refurbCosts, setRefurbCosts] = useState<Record<string, number>>({});
  const [showRefurbModal, setShowRefurbModal] = useState<string | null>(null);
  const [refurbForm, setRefurbForm] = useState({
    kitchen: 0,
    bathroom: 0,
    decor: 0,
    structural: 0,
    garden: 0,
    other: 0
  });

  // State for mass delete functionality
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // State for editable rental estimates
  const [editingRent, setEditingRent] = useState<string | null>(null);
  const [rentEditValue, setRentEditValue] = useState<string>('');
  
  // State for ROI calculations
  const [roiEstimates, setRoiEstimates] = useState<{ [key: string]: number }>({});

  // Suggested refurbishment costs based on property type and condition
  const suggestedCosts = {
    kitchen: { basic: 5000, standard: 10000, premium: 15000 },
    bathroom: { basic: 3000, standard: 6000, premium: 10000 },
    decor: { basic: 2000, standard: 4000, premium: 7000 },
    structural: { basic: 5000, standard: 10000, premium: 20000 },
    garden: { basic: 1000, standard: 3000, premium: 5000 },
    other: { basic: 1000, standard: 2000, premium: 3000 }
  };

  const calculateRentEstimates = async (properties: WatchlistItem[]) => {
    console.log('Starting rent estimation for', properties.length, 'properties');
    setCalculatingRents(true);
    const newRentEstimates: { [key: string]: number } = {};
    const newYieldEstimates: { [key: string]: number } = {};

    for (const property of properties) {
      try {
        console.log('Calculating rent for property:', property.id, property.title);
        const rentEstimate = await calculateRentalEstimateSync(property);
        const yieldEstimate = await calculateYield(rentEstimate, property);
        
        console.log('Rent estimate for', property.id, ':', rentEstimate, 'yield:', yieldEstimate);
        
        newRentEstimates[property.id] = rentEstimate;
        newYieldEstimates[property.id] = yieldEstimate;
      } catch (error) {
        console.error('Error calculating estimates for property:', property.id, error);
        // Use fallback calculations
        const baseRent = (property.price || 200000) * 0.008;
        const variation = 0.9 + Math.random() * 0.2;
        const fallbackRent = Math.round(baseRent * variation);
        const fallbackYield = property.price ? Math.round((fallbackRent * 12 / property.price) * 100 * 10) / 10 : 0;
        
        newRentEstimates[property.id] = fallbackRent;
        newYieldEstimates[property.id] = fallbackYield;
      }
    }

    console.log('Setting rent estimates:', newRentEstimates);
    console.log('Setting yield estimates:', newYieldEstimates);
    
    setRentEstimates(newRentEstimates);
    setYieldEstimates(newYieldEstimates);
    setCalculatingRents(false);
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  useEffect(() => {
    if (watchlist.length > 0) {
      console.log('useEffect triggered - calculating rent estimates for', watchlist.length, 'properties');
      calculateRentEstimates(watchlist);
    }
  }, [watchlist.length]); // Only depend on watchlist length to prevent infinite loops

  const loadWatchlist = async () => {
    try {
      // Use the API endpoint instead of direct Supabase query to bypass RLS
      const response = await fetch('/api/watchlist', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Error loading watchlist:', response.statusText);
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setWatchlist(data.properties || []);
        console.log(`Loaded ${data.properties?.length || 0} properties from watchlist`);
      } else {
        console.error('Error loading watchlist:', data.error);
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePropertyStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('watchlist')
        .update({ status })
        .eq('id', id);

      if (error) {
        console.error('Error updating status:', error);
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
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting property:', error);
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
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please sign in to add properties to your portfolio.');
        return;
      }

      const { error } = await supabase
        .from('portfolio_properties')
        .insert({
          user_id: user.id,
          address: property.address,
          postcode: property.postcode,
          purchase_price: property.price,
          current_value: property.price,
          purchase_date: new Date().toISOString().split('T')[0],
          property_type: property.property_type,
          status: 'active',
          notes: `Added from watchlist: ${property.title}`
        });

      if (error) {
        console.error('Error adding to portfolio:', error);
        return;
      }

      alert('Property added to portfolio successfully!');
    } catch (error) {
      console.error('Error adding to portfolio:', error);
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

  const isPropertySaved = (propertyId: string) => {
    return savedProperties.includes(propertyId);
  };

  const saveSelectedProperties = () => {
    setSavedProperties(prev => [...new Set([...prev, ...selectedProperties])]);
    setSelectedProperties([]);
    setComparisonMode(false);
  };

  const removeFromSaved = (propertyId: string) => {
    setSavedProperties(prev => prev.filter(id => id !== propertyId));
  };

  const cleanTitle = (title: string, address: string) => {
    // If title is just the address or very similar, return just the address
    if (title.toLowerCase().includes(address.toLowerCase()) || 
        address.toLowerCase().includes(title.toLowerCase())) {
      return address;
    }
    
    // If title contains "for sale" or similar, extract the address part
    const addressMatch = title.match(/(\d+[^,]*,[^,]*,[^,]*)/i);
    if (addressMatch) {
      return addressMatch[1].trim();
    }
    
    // Otherwise return the address if it's more descriptive
    return address || title;
  };

  const startEditing = (property: WatchlistItem) => {
    setEditingProperty(property.id);
    setEditForm({
      title: property.title,
      price: property.price,
      address: property.address,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      property_type: property.property_type,
      notes: property.notes
    });
  };

  const saveEdit = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('watchlist')
        .update(editForm)
        .eq('id', propertyId);

      if (error) {
        console.error('Error updating property:', error);
        return;
      }

      // Update local state
      setWatchlist(prev => prev.map(p => 
        p.id === propertyId ? { ...p, ...editForm } : p
      ));

      setEditingProperty(null);
      setEditForm({});
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  };

  const cancelEdit = () => {
    setEditingProperty(null);
    setEditForm({});
  };

  const openRefurbModal = (propertyId: string) => {
    setShowRefurbModal(propertyId);
    // Load existing refurb costs if any
    const existing = refurbCosts[propertyId] || 0;
    if (existing > 0) {
      // For now, just set a default distribution
      setRefurbForm({
        kitchen: Math.round(existing * 0.3),
        bathroom: Math.round(existing * 0.25),
        decor: Math.round(existing * 0.2),
        structural: Math.round(existing * 0.15),
        garden: Math.round(existing * 0.05),
        other: Math.round(existing * 0.05)
      });
    }
  };

  const saveRefurbCosts = (propertyId: string) => {
    const total = Object.values(refurbForm).reduce((sum, cost) => sum + cost, 0);
    setRefurbCosts(prev => ({ ...prev, [propertyId]: total }));
    setShowRefurbModal(null);
    setRefurbForm({
      kitchen: 0,
      bathroom: 0,
      decor: 0,
      structural: 0,
      garden: 0,
      other: 0
    });
  };

  const getTotalInvestment = (property: WatchlistItem) => {
    const purchasePrice = property.price || 0;
    const refurbCost = refurbCosts[property.id] || 0;
    return purchasePrice + refurbCost;
  };

  const getAdjustedYield = (property: WatchlistItem) => {
    const totalInvestment = getTotalInvestment(property);
    const annualRent = (rentEstimates[property.id] || 0) * 12;
    return totalInvestment > 0 ? (annualRent / totalInvestment) * 100 : 0;
  };

  const getInvestmentRating = (property: WatchlistItem) => {
    const adjustedYield = getAdjustedYield(property);
    if (adjustedYield >= 8) return { rating: 'Excellent', color: 'text-green-600', icon: '⭐' };
    if (adjustedYield >= 6) return { rating: 'Good', color: 'text-blue-600', icon: '👍' };
    if (adjustedYield >= 4) return { rating: 'Fair', color: 'text-yellow-600', icon: '⚠️' };
    return { rating: 'Poor', color: 'text-red-600', icon: '❌' };
  };

  const applySuggestedCosts = (level: 'basic' | 'standard' | 'premium') => {
    const newCosts = {
      kitchen: suggestedCosts.kitchen[level],
      bathroom: suggestedCosts.bathroom[level],
      decor: suggestedCosts.decor[level],
      structural: suggestedCosts.structural[level],
      garden: suggestedCosts.garden[level],
      other: suggestedCosts.other[level]
    };
    setRefurbForm(newCosts);
  };

  const calculateRentalEstimateSync = async (property: WatchlistItem) => {
    try {
      // Handle missing postcode - use a default for NE5 area
      const postcode = property.postcode || 'NE5 1AA';
      const propertyType = property.property_type || 'house';
      const bedrooms = property.bedrooms || 3;
      
      console.log('Sending rent estimation request:', {
        postcode,
        propertyType,
        bedrooms,
        price: property.price
      });

      // Use the new sophisticated rent estimation API
      const response = await fetch('/api/rent-estimation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postcode,
          propertyType,
          bedrooms,
          price: property.price,
          epcRating: property.epc_rating,
          floorArea: property.floor_area
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('Rent estimation API response:', data.estimation);
          return data.estimation.monthlyRent;
        }
      }
      
      // Fallback to simple calculation if API fails
      console.warn('Rent estimation API failed, using fallback calculation');
      const baseRent = (property.price || 200000) * 0.008; // 0.8% of property price per month
      const variation = 0.9 + Math.random() * 0.2; // Random variation between 90-110%
      return Math.round(baseRent * variation);
      
    } catch (error) {
      console.error('Error calculating rent estimate:', error);
      // Fallback to simple calculation
      const baseRent = (property.price || 200000) * 0.008;
      const variation = 0.9 + Math.random() * 0.2;
      return Math.round(baseRent * variation);
    }
  };

  const calculateYield = async (monthlyRent: number, property: WatchlistItem) => {
    if (!property.price || property.price === 0) return 0;
    const annualRent = monthlyRent * 12;
    return Math.round((annualRent / property.price) * 100 * 10) / 10; // Round to 1 decimal place
  };

  const getSourceIcon = (source: string) => {
    const sourceMap: { [key: string]: string } = {
      'rightmove': '🏠',
      'zoopla': '🏡',
      'onthemarket': '🏘️',
      'prime-location': '🏢'
    };
    return sourceMap[source] || '🏠';
  };

  const filteredWatchlist = useMemo(() => {
    let filtered = watchlist;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.postcode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Price filter
    if (priceFilter !== '') {
      filtered = filtered.filter(item => {
        const price = item.price || 0;
        switch (priceFilter) {
          case '0-100k':
            return price < 100000;
          case '100k-200k':
            return price >= 100000 && price < 200000;
          case '200k-300k':
            return price >= 200000 && price < 300000;
          case '300k+':
            return price >= 300000;
          default:
            return true;
        }
      });
    }

    // Yield filter
    if (yieldFilter) {
      filtered = filtered.filter(item => {
        const yieldPercentage = yieldEstimates[item.id] || 0;
        switch (yieldFilter) {
          case '6+':
            return yieldPercentage >= 6;
          case '4-6':
            return yieldPercentage >= 4 && yieldPercentage < 6;
          case '2-4':
            return yieldPercentage >= 2 && yieldPercentage < 4;
          case '0-2':
            return yieldPercentage >= 0 && yieldPercentage < 2;
          default:
            return true;
        }
      });
    }

    // Sort by
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'roi':
          // ROI is now just the yield percentage since we removed BMV score
          return (yieldEstimates[b.id] || 0) - (yieldEstimates[a.id] || 0); // Highest yield first
        case 'yield':
          return (yieldEstimates[b.id] || 0) - (yieldEstimates[a.id] || 0); // Highest yield first
        case 'price':
          return a.price - b.price; // Lowest price first
        case 'captured_at':
          return new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime(); // Most recent first
        default:
          return 0;
      }
    });

    return filtered;
  }, [watchlist, searchTerm, priceFilter, sortBy, yieldEstimates, yieldFilter]);

  // Mass delete functionality
  const toggleDeleteSelection = (propertyId: string) => {
    const newSelected = new Set(selectedForDelete);
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId);
    } else {
      newSelected.add(propertyId);
    }
    setSelectedForDelete(newSelected);
  };

  const handleMassDelete = async () => {
    if (selectedForDelete.size === 0) return;
    
    try {
      const deletePromises = Array.from(selectedForDelete).map(id => 
        fetch(`/api/properties/capture?id=${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      
      // Remove from local state
      setWatchlist(prev => prev.filter(p => !selectedForDelete.has(p.id)));
      setSelectedForDelete(new Set());
      setShowDeleteConfirm(false);
      
      toast({
        title: `Deleted ${selectedForDelete.size} properties`,
        description: `Properties deleted successfully.`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Error deleting properties:', error);
      toast({
        title: 'Failed to delete properties',
        description: 'Failed to delete some properties. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Editable rental estimates
  const startEditingRent = (propertyId: string, currentRent: number) => {
    setEditingRent(propertyId);
    setRentEditValue(currentRent.toString());
  };

  const saveRentEdit = async (propertyId: string) => {
    try {
      const newRent = parseInt(rentEditValue);
      if (isNaN(newRent) || newRent < 0) {
        toast({
          title: 'Invalid rent amount',
          description: 'Please enter a valid rent amount.',
          variant: 'destructive',
        });
        return;
      }

      // Update local state
      setRentEstimates(prev => ({ ...prev, [propertyId]: newRent }));
      
      // Recalculate yield
      const property = watchlist.find(p => p.id === propertyId);
      if (property) {
        const newYield = await calculateYield(newRent, property);
        setYieldEstimates(prev => ({ ...prev, [propertyId]: newYield }));
        
        // Calculate ROI
        const totalInvestment = getTotalInvestment(property);
        const annualRent = newRent * 12;
        const roi = totalInvestment > 0 ? ((annualRent / totalInvestment) * 100) : 0;
        setRoiEstimates(prev => ({ ...prev, [propertyId]: roi }));
      }
      
      setEditingRent(null);
      setRentEditValue('');
      toast({
        title: 'Rent estimate updated',
        description: 'Rent estimate updated successfully.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error updating rent estimate:', error);
      toast({
        title: 'Failed to update rent estimate',
        description: 'Failed to update rent estimate. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const cancelRentEdit = () => {
    setEditingRent(null);
    setRentEditValue('');
  };

  // Calculate ROI for a property
  const calculateROI = (property: WatchlistItem) => {
    const totalInvestment = getTotalInvestment(property);
    const monthlyRent = rentEstimates[property.id] || 0;
    const annualRent = monthlyRent * 12;
    
    if (totalInvestment > 0) {
      return (annualRent / totalInvestment) * 100;
    }
    return 0;
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
            {/* Investment Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium opacity-90">Avg. Yield</span>
                </div>
                <div className="text-3xl font-bold mb-2">
                  {watchlist.length > 0 
                    ? `${(watchlist.reduce((sum, p) => sum + getAdjustedYield(p), 0) / watchlist.length).toFixed(1)}%`
                    : '0%'
                  }
                </div>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <span className="font-semibold">{watchlist.length}</span>
                  <span>properties</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <PoundSterling className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium opacity-90">Total Investment</span>
                </div>
                <div className="text-3xl font-bold mb-2">
                  {formatPrice(watchlist.reduce((sum, p) => sum + getTotalInvestment(p), 0))}
                </div>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <span className="font-semibold">{formatPrice(watchlist.reduce((sum, p) => sum + getTotalInvestment(p), 0) / Math.max(watchlist.length, 1))}</span>
                  <span>avg. investment</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-4" />
                  </div>
                  <span className="text-sm font-medium opacity-90">High Yield</span>
                </div>
                <div className="text-3xl font-bold mb-2">
                  {watchlist.filter(p => getAdjustedYield(p) >= 6).length}
                </div>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <span className="font-semibold">6%+ yield</span>
                  <span>properties</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium opacity-90">Refurb Budget</span>
                </div>
                <div className="text-3xl font-bold mb-2">
                  {formatPrice(watchlist.reduce((sum, p) => sum + (refurbCosts[p.id] || 0), 0))}
                </div>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <span className="font-semibold">{watchlist.filter(p => refurbCosts[p.id] > 0).length}</span>
                  <span>properties</span>
                </div>
              </div>
            </div>

            {/* Investment Opportunities Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-900">Investment Opportunities</h2>
                  <span className="text-sm text-gray-500">({filteredWatchlist.length} properties)</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setPriceFilter('');
                      setYieldFilter('');
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    Clear Filters
                  </button>
                  
                  <button
                    onClick={toggleComparisonMode}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      comparisonMode 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    {comparisonMode ? 'Exit Compare' : 'Compare'}
                  </button>
                  
                  {comparisonMode && selectedProperties.length > 0 && (
                    <button
                      onClick={saveSelectedProperties}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Save Selected ({selectedProperties.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Search:</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search properties..."
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm w-48"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Yield Range:</label>
                  <select 
                    value={yieldFilter} 
                    onChange={(e) => setYieldFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">All Yields</option>
                    <option value="6+">6%+ (Excellent)</option>
                    <option value="4-6">4-6% (Good)</option>
                    <option value="2-4">2-4% (Low)</option>
                    <option value="0-2">0-2% (Poor)</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Price Range:</label>
                  <select 
                    value={priceFilter} 
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">All Prices</option>
                    <option value="0-100k">Under £100k</option>
                    <option value="100k-200k">£100k-£200k</option>
                    <option value="200k-300k">£200k-£300k</option>
                    <option value="300k+">Over £300k</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Sort by:</label>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="roi">ROI Potential</option>
                    <option value="yield">Yield %</option>
                    <option value="price">Price</option>
                    <option value="captured_at">Date Added</option>
                  </select>
                </div>
              </div>

              {/* Table Header */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Investment Opportunities ({filteredWatchlist.length} properties)
                    </h3>
                    
                    {/* Mass Delete Controls */}
                    {selectedForDelete.size > 0 && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          {selectedForDelete.size} selected
                        </span>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                        >
                          Delete Selected
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedForDelete.size === filteredWatchlist.length && filteredWatchlist.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedForDelete(new Set(filteredWatchlist.map(p => p.id)));
                              } else {
                                setSelectedForDelete(new Set());
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Property
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Refurb
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rent Est.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Yield %
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ROI %
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredWatchlist.map((property) => {
                        const rentalEstimate = rentEstimates[property.id] || 0;
                        const yieldEstimate = yieldEstimates[property.id] || 0;
                        const roiEstimate = calculateROI(property);
                        
                        return (
                          <tr key={property.id} className="hover:bg-gray-50">
                            {/* Checkbox */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedForDelete.has(property.id)}
                                onChange={() => toggleDeleteSelection(property.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            
                            {/* Property */}
                            <td className="px-6 py-4">
                              <div className="flex items-start space-x-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {cleanTitle(property.title, property.address)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {getSourceIcon(property.source)} {property.source} • {formatDate(property.captured_at)}
                                  </p>
                                  <a
                                    href={property.original_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    View Original
                                  </a>
                                </div>
                              </div>
                            </td>
                            
                            {/* Price */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {formatPrice(property.price)}
                              </div>
                              {editingProperty?.id === property.id ? (
                                <input
                                  type="number"
                                  value={editForm.price}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                                  className="mt-1 w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                                />
                              ) : null}
                            </td>
                            
                            {/* Refurb */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {formatPrice(refurbCosts[property.id] || 0)}
                              </div>
                              <button
                                onClick={() => openRefurbModal(property.id)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Add Refurb
                              </button>
                            </td>
                            
                            {/* Total */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">
                                {formatPrice(getTotalInvestment(property))}
                              </div>
                            </td>
                            
                            {/* Rent Estimate */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingRent === property.id ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    value={rentEditValue}
                                    onChange={(e) => setRentEditValue(e.target.value)}
                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                                    placeholder="Rent"
                                  />
                                  <button
                                    onClick={() => saveRentEdit(property.id)}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={cancelRentEdit}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {rentalEstimate > 0 ? formatPrice(rentalEstimate) : 'Calculating...'}
                                    </div>
                                    <div className="text-xs text-gray-500">per month</div>
                                  </div>
                                  <button
                                    onClick={() => startEditingRent(property.id, rentalEstimate)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                            
                            {/* Yield */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {yieldEstimate > 0 ? `${yieldEstimate.toFixed(1)}%` : 'Calculating...'}
                              </div>
                              <div className={`text-xs ${
                                yieldEstimate >= 6 ? 'text-green-600' :
                                yieldEstimate >= 4 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {yieldEstimate >= 6 ? 'Excellent' :
                                 yieldEstimate >= 4 ? 'Good' :
                                 yieldEstimate > 0 ? 'Poor' : 'Calculating...'}
                              </div>
                            </td>
                            
                            {/* ROI */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">
                                {roiEstimate > 0 ? `${roiEstimate.toFixed(1)}%` : 'N/A'}
                              </div>
                              <div className={`text-xs ${
                                roiEstimate >= 8 ? 'text-green-600' :
                                roiEstimate >= 6 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {roiEstimate >= 8 ? 'High' :
                                 roiEstimate >= 6 ? 'Medium' :
                                 roiEstimate > 0 ? 'Low' : 'N/A'}
                              </div>
                            </td>
                            
                            {/* Details */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="space-y-1">
                                <div>{property.bedrooms > 0 ? `${property.bedrooms} bed` : 'N/A'}</div>
                                <div className="capitalize">{property.property_type || 'House'}</div>
                                <div>{property.total_size?.value ? `${property.total_size.value} ${property.total_size.unit}` : 'N/A'}</div>
                                <div>{property.epc_rating || 'N/A'}</div>
                              </div>
                            </td>
                            
                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => addToPortfolio(property)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Add to Portfolio"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => startEditing(property)}
                                  className="text-gray-600 hover:text-gray-900"
                                  title="Edit Property"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteProperty(property.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete Property"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {filteredWatchlist.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-gray-50 rounded-2xl p-12">
                  <Target className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">No investment opportunities found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {searchTerm || priceFilter !== '' || yieldFilter !== ''
                      ? "Try adjusting your filters to see more investment opportunities."
                      : "Start capturing properties with the BMV Finder Chrome extension to build your investment portfolio."
                    }
                  </p>
                  {searchTerm || priceFilter !== '' || yieldFilter !== '' ? (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setPriceFilter('');
                        setYieldFilter('');
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
            )}

            {/* Saved Properties Section */}
            {savedProperties.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-900">Saved Properties</h2>
                    <span className="text-sm text-gray-500">({savedProperties.length} properties)</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Property</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Price</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Rent Est.</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Yield %</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {watchlist
                        .filter(item => savedProperties.includes(item.id))
                        .map((item) => {
                          const rentalEstimate = rentEstimates[item.id] || 0;
                          const yieldPercentage = yieldEstimates[item.id] || 0;
                          
                          return (
                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="py-4 px-4">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900 mb-1">
                                    {cleanTitle(item.title, item.address)}
                                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Saved
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600 mb-2">{item.address}</div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>{getSourceIcon(item.source)} {item.source}</span>
                                    <span>•</span>
                                    <span>{new Date(item.captured_at).toLocaleDateString()}</span>
                                    {item.original_url && (
                                      <>
                                        <span>•</span>
                                        <a
                                          href={item.original_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 underline"
                                        >
                                          View Original
                                        </a>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </td>
                              
                              <td className="text-center py-4 px-4">
                                <div className="font-semibold text-gray-900">
                                  {formatPrice(item.price)}
                                </div>
                              </td>
                              
                              <td className="text-center py-4 px-4">
                                <div className="font-semibold text-gray-900">
                                  {calculatingRents ? 'Calculating...' : formatPrice(rentalEstimate)}
                                </div>
                                <div className="text-xs text-gray-500">per month</div>
                              </td>
                              
                              <td className="text-center py-4 px-4">
                                <div className={`font-semibold ${
                                  yieldPercentage >= 6 ? 'text-green-600' :
                                  yieldPercentage >= 4 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {calculatingRents ? 'Calculating...' : `${yieldPercentage}%`}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {yieldPercentage >= 6 ? 'Excellent' : yieldPercentage >= 4 ? 'Good' : 'Low'}
                                </div>
                              </td>
                              
                              <td className="text-center py-4 px-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => addToPortfolio(item)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Add to Portfolio"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => removeFromSaved(item.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove from Saved"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => startEditing(item)}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Edit Property"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Confirm Delete
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete {selectedForDelete.size} selected properties? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleMassDelete}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete {selectedForDelete.size} Properties
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Refurbishment Cost Modal */}
            {showRefurbModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Refurbishment Costs</h3>
                    <button
                      onClick={() => setShowRefurbModal(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  {/* Quick Select Buttons */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-3">Quick Select:</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => applySuggestedCosts('basic')}
                        className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Basic (£17k)
                      </button>
                      <button
                        onClick={() => applySuggestedCosts('standard')}
                        className="flex-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Standard (£35k)
                      </button>
                      <button
                        onClick={() => applySuggestedCosts('premium')}
                        className="flex-1 px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        Premium (£55k)
                      </button>
                    </div>
                  </div>
                  
                  {/* Cost Breakdown */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">Kitchen</span>
                        <div className="text-xs text-gray-500">£5k - £15k typical</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">£</span>
                        <input
                          type="number"
                          value={refurbForm.kitchen}
                          onChange={(e) => setRefurbForm(prev => ({ ...prev, kitchen: parseInt(e.target.value) || 0 }))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">Bathroom</span>
                        <div className="text-xs text-gray-500">£3k - £10k typical</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">£</span>
                        <input
                          type="number"
                          value={refurbForm.bathroom}
                          onChange={(e) => setRefurbForm(prev => ({ ...prev, bathroom: parseInt(e.target.value) || 0 }))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">Decor & Paint</span>
                        <div className="text-xs text-gray-500">£2k - £7k typical</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">£</span>
                        <input
                          type="number"
                          value={refurbForm.decor}
                          onChange={(e) => setRefurbForm(prev => ({ ...prev, decor: parseInt(e.target.value) || 0 }))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">Structural Work</span>
                        <div className="text-xs text-gray-500">£5k - £20k typical</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">£</span>
                        <input
                          type="number"
                          value={refurbForm.structural}
                          onChange={(e) => setRefurbForm(prev => ({ ...prev, structural: parseInt(e.target.value) || 0 }))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">Garden & Exterior</span>
                        <div className="text-xs text-gray-500">£1k - £5k typical</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">£</span>
                        <input
                          type="number"
                          value={refurbForm.garden}
                          onChange={(e) => setRefurbForm(prev => ({ ...prev, garden: parseInt(e.target.value) || 0 }))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">Other Costs</span>
                        <div className="text-xs text-gray-500">£1k - £3k typical</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">£</span>
                        <input
                          type="number"
                          value={refurbForm.other}
                          onChange={(e) => setRefurbForm(prev => ({ ...prev, other: parseInt(e.target.value) || 0 }))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Total Cost Display */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total Refurb Cost:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        £{Object.values(refurbForm).reduce((sum, cost) => sum + cost, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRefurbModal(null)}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveRefurbCosts(showRefurbModal)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Costs
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Comparison View */}
            {comparisonMode && selectedProperties.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Investment Comparison</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{selectedProperties.length} properties selected</span>
                    <button
                      onClick={() => setSelectedProperties([])}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {selectedProperties.map(propertyId => {
                    const property = watchlist.find(p => p.id === propertyId);
                    if (!property) return null;
                    
                    const rentalEstimate = rentEstimates[property.id] || 0;
                    const yieldPercentage = yieldEstimates[property.id] || 0;
                    
                    return (
                      <div key={property.id} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-gray-50 to-white">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 line-clamp-2 mb-2">{property.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <MapPin className="w-3 h-3" />
                              <span className="line-clamp-1">{property.address}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>{property.bedrooms > 0 ? `${property.bedrooms} bed`