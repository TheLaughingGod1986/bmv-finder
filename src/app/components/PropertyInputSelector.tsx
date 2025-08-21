'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, FolderOpen, Eye, MapPin, Building2, Calendar, Target, Zap, Loader2 } from 'lucide-react';
import Button from './Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './SimpleCard';
import { Badge } from './SimpleCard';
import { useToast } from './ToastProvider';


interface Property {
  address: string;
  postcode: string;
  propertyType?: string;
  bedrooms?: number;
  floorArea?: number;
  epcRating?: string;
  lastSaleDate?: string;
  growthPeriod?: string;
  longTermGrowth?: number;
  longTermPeriod?: string;
  grossYield?: number;
  portfolioFit?: {
    diversification: number;
    riskLevel: string;
    potential: string;
  };
  capitalGrowth?: number;
  lastSalePrice?: number;
  currentValuation?: number; // Added for current market value
  salesHistory?: any[];
  totalSales?: number;
  priceRange?: { min: number; max: number };
}

interface PropertyInputSelectorProps {
  onPropertySelect: (property: Property) => void;
  onPropertyInput: (property: Property) => void;
  title?: string;
  description?: string;
  className?: string;
  showManualInput?: boolean;
  showPortfolio?: boolean;
  showWatchlist?: boolean;
  showPostcodeSearch?: boolean;
}

export default function PropertyInputSelector({
  onPropertySelect,
  onPropertyInput,
  title = "Select Property",
  description = "Choose how you'd like to input property details",
  className = "",
  showManualInput = true,
  showPortfolio = true,
  showWatchlist = true,
  showPostcodeSearch = true
}: PropertyInputSelectorProps) {
  const [activeTab, setActiveTab] = useState<'discovery' | 'manual' | 'portfolio' | 'watchlist'>('discovery');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [discoveryLimit, setDiscoveryLimit] = useState(100);
  const [portfolioProperties, setPortfolioProperties] = useState<Property[]>([]);
  const [watchlistProperties, setWatchlistProperties] = useState<Property[]>([]);
  const [manualProperty, setManualProperty] = useState<Partial<Property>>({
    address: '',
    postcode: '',
    propertyType: 'semi-detached',
    bedrooms: 3,
    floorArea: 0,
    lastSoldPrice: 0,
    lastSoldDate: '',
    epcRating: 'C'
  });
  
  const { showToast } = useToast();

  // Simple postcode formatting function
  const formatPostcode = (input: string): string => {
    if (!input) return '';
    let cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned.length > 3) {
      return cleaned.slice(0, -3).trim() + ' ' + cleaned.slice(-3);
    }
    return cleaned;
  };

  // Fetch portfolio and watchlist properties on component mount
  useEffect(() => {
    if (showPortfolio) {
      fetchPortfolioProperties();
    }
    if (showWatchlist) {
      fetchWatchlistProperties();
    }
  }, [showPortfolio, showWatchlist]);

  const fetchPortfolioProperties = async () => {
    try {
      const response = await fetch('/api/portfolio');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.properties) {
          setPortfolioProperties(data.data.properties.map((prop: any) => ({
            id: prop.id || `portfolio-${prop.postcode}-${prop.address}`,
            address: prop.address || prop.full_address || 'Unknown Address',
            postcode: prop.postcode,
            propertyType: prop.property_type || prop.propertyType,
            bedrooms: prop.bedrooms,
            floorArea: prop.floor_area_m2 || prop.floorArea,
            lastSoldPrice: prop.purchase_price || prop.lastSoldPrice,
            lastSoldDate: prop.purchase_date || prop.lastSoldDate,
            epcRating: prop.epc_rating || prop.epcRating,
            salesHistory: prop.sales_history || [],
            totalSales: prop.total_sales || 0,
            priceRange: prop.price_range || { min: 0, max: 0 },
            lastSaleDate: prop.last_sale_date || prop.lastSoldDate,
            growthPeriod: prop.growth_period || 'N/A',
            longTermGrowth: prop.long_term_growth,
            longTermPeriod: prop.long_term_period,
            grossYield: prop.gross_yield,
            portfolioFit: prop.portfolio_fit,
            capitalGrowth: prop.capital_growth,
            lastSalePrice: prop.last_sale_price,
            currentValuation: prop.current_valuation || 0
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching portfolio properties:', error);
    }
  };

  const fetchWatchlistProperties = async () => {
    try {
      const response = await fetch('/api/watchlist');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.properties) {
          setWatchlistProperties(data.data.properties.map((prop: any) => ({
            id: prop.id || `watchlist-${prop.postcode}-${prop.address}`,
            address: prop.address || prop.full_address || 'Unknown Address',
            postcode: prop.postcode,
            propertyType: prop.property_type || prop.propertyType,
            bedrooms: prop.bedrooms,
            floorArea: prop.floor_area_m2 || prop.floorArea,
            lastSoldPrice: prop.last_sold_price || prop.lastSoldPrice,
            lastSoldDate: prop.last_sold_date || prop.lastSoldDate,
            epcRating: prop.epc_rating || prop.epcRating,
            salesHistory: prop.sales_history || [],
            totalSales: prop.total_sales || 0,
            priceRange: prop.price_range || { min: 0, max: 0 },
            lastSaleDate: prop.last_sale_date || prop.lastSoldDate,
            growthPeriod: prop.growth_period || 'N/A',
            longTermGrowth: prop.long_term_growth,
            longTermPeriod: prop.long_term_period,
            grossYield: prop.gross_yield,
            portfolioFit: prop.portfolio_fit,
            capitalGrowth: prop.capital_growth,
            lastSalePrice: prop.last_sale_price,
            currentValuation: prop.current_valuation || 0
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching watchlist properties:', error);
    }
  };

  const handlePropertyDiscovery = async () => {
    if (!searchQuery.trim()) {
      showToast({
        type: 'error',
        title: 'Missing Information',
        message: 'Please enter a postcode'
      });
      return;
    }

    setIsSearching(true);
    try {
      const formattedPostcode = formatPostcode(searchQuery.trim());
      const response = await fetch(`/api/portfolio/discover?postcode=${encodeURIComponent(formattedPostcode)}&limit=${discoveryLimit}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.properties && data.data.properties.length > 0) {
  
          const mappedProperties = data.data.properties.map((prop: any) => {
            const mappedProperty: Property = {
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
              portfolioFit: prop.portfolioFit,
              capitalGrowth: prop.capitalGrowth || 0,
              lastSalePrice: prop.lastSalePrice || 0,
              currentValuation: prop.currentValuation || 0, // Use camelCase from API
              salesHistory: prop.salesHistory || [],
              totalSales: prop.totalSales || 0,
              priceRange: prop.priceRange || { min: 0, max: 0 }
            };
            return mappedProperty;
          });
  
          setSearchResults(mappedProperties);
        } else {
          setSearchResults([]);
          showToast({
            type: 'info',
            title: 'No Results',
            message: 'No properties found for this postcode'
          });
        }
      } else {
        showToast({
          type: 'error',
          title: 'Discovery Failed',
          message: 'Discovery failed. Please try again.'
        });
      }
    } catch (error) {
      console.error('Discovery error:', error);
      showToast({
        type: 'error',
        title: 'Discovery Failed',
        message: 'Discovery failed. Please try again.'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualInputSubmit = () => {
    if (!manualProperty.address || !manualProperty.postcode) {
      showToast({
        type: 'error',
        title: 'Missing Information',
        message: 'Please fill in at least the address and postcode'
      });
      return;
    }

    const property: Property = {
      id: `manual-${Date.now()}`,
      address: manualProperty.address,
      postcode: formatPostcode(manualProperty.postcode),
      propertyType: manualProperty.propertyType || 'semi-detached',
      bedrooms: manualProperty.bedrooms || 3,
      floorArea: manualProperty.floorArea || 0,
      lastSoldPrice: manualProperty.lastSoldPrice || 0,
      lastSoldDate: manualProperty.lastSoldDate || '',
      epcRating: manualProperty.epcRating || 'C',
      salesHistory: [], // No sales history for manual input
      totalSales: 0,
      priceRange: { min: 0, max: 0 },
      lastSaleDate: '',
      growthPeriod: 'N/A',
      longTermGrowth: 0,
      longTermPeriod: 'N/A',
      grossYield: 0,
      portfolioFit: { diversification: 0, riskLevel: 'N/A', potential: 'N/A' },
      capitalGrowth: 0,
      lastSalePrice: 0,
      currentValuation: 0
    };

    onPropertyInput(property);
    showToast({
      type: 'success',
      title: 'Success',
      message: 'Property details saved'
    });
  };

  const handlePropertySelect = (property: Property) => {
    onPropertySelect(property);
    showToast({
      type: 'success',
      title: 'Property Selected',
      message: `Selected: ${property.address}`
    });
  };

  const handleAddToPortfolio = async (property: Property) => {
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: property.address,
          postcode: property.postcode,
          propertyType: property.propertyType,
          bedrooms: property.bedrooms,
          floorArea: property.floorArea,
          lastSoldPrice: property.lastSoldPrice,
          lastSoldDate: property.lastSoldDate,
          epcRating: property.epcRating,
          salesHistory: property.salesHistory,
          totalSales: property.totalSales,
          priceRange: property.priceRange,
          lastSaleDate: property.lastSaleDate,
          growthPeriod: property.growthPeriod,
          longTermGrowth: property.longTermGrowth,
          longTermPeriod: property.longTermPeriod,
          grossYield: property.grossYield,
          portfolioFit: property.portfolioFit,
          capitalGrowth: property.capitalGrowth,
          lastSalePrice: property.lastSalePrice,
          currentValuation: property.currentValuation
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showToast({
            type: 'success',
            title: 'Added to Portfolio',
            message: `${property.address} added to your portfolio!`
          });
          fetchPortfolioProperties(); // Refresh portfolio list
        } else {
          showToast({
            type: 'error',
            title: 'Add to Portfolio Failed',
            message: data.message || 'Failed to add property to portfolio.'
          });
        }
      } else {
        showToast({
          type: 'error',
          title: 'Add to Portfolio Failed',
          message: 'Failed to add property to portfolio. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error adding to portfolio:', error);
      showToast({
        type: 'error',
        title: 'Add to Portfolio Failed',
        message: 'Failed to add property to portfolio. Please try again.'
      });
    }
  };

  const tabs = [
    { id: 'discovery', label: 'Property Search', icon: Target, show: showPostcodeSearch },
    { id: 'manual', label: 'Manual Input', icon: Plus, show: showManualInput },
    { id: 'portfolio', label: 'Portfolio', icon: FolderOpen, show: showPortfolio },
    { id: 'watchlist', label: 'Watchlist', icon: Eye, show: showWatchlist }
  ].filter(tab => tab.show);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Property Discovery Tab */}
        {activeTab === 'discovery' && showPostcodeSearch && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Target className="h-6 w-6 text-blue-600" />
                Property Search & Discovery
              </CardTitle>
              <CardDescription className="text-base text-gray-600 leading-relaxed">
                Search and discover properties with comprehensive investment analysis, EPC insights, and market trends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Input Row */}
              <div className="flex items-end gap-4">
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
                    className="w-full px-4 py-3 text-lg border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
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
                  
                  <Button 
                    onClick={handlePropertyDiscovery}
                    disabled={isSearching || !searchQuery.trim()}
                    className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
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
                  </Button>
                </div>
              </div>
              
              {/* Results Info */}
              {searchResults.length > 0 && (
                <div className="text-base text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-xl border border-blue-100">
                  Found <span className="font-bold text-blue-700">{searchResults.length}</span> properties
                  {searchResults.length === discoveryLimit && (
                    <span className="text-gray-500 ml-3">
                      (showing max results - increase limit to see more)
                    </span>
                  )}
                </div>
              )}
              
              {/* Property Results */}
              <div className="space-y-4">
                {searchResults.map((property, index) => (
                  <div key={property.id || index} className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 cursor-pointer transition-all duration-200 overflow-hidden">
                    
                    {/* Header Section - Address & Sales Badge */}
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 truncate">{property.address}</h3>
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
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <span className="text-gray-700">£{(property.lastSalePrice || 0).toLocaleString()}</span>
                        </div>
                        {property.epcRating && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                            <Zap className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">EPC {property.epcRating}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Investment Metrics - Compact Grid */}
                    <div className="px-4 py-3 bg-gray-50">
                      <div className="grid grid-cols-2 gap-4">
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
                            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Risk</span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              (property.portfolioFit?.riskLevel || 'N/A') === 'LOW' ? 'bg-emerald-100 text-emerald-700' :
                              (property.portfolioFit?.riskLevel || 'N/A') === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {property.portfolioFit?.riskLevel || 'N/A'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Yield</span>
                            <span className="text-sm font-bold text-blue-600">
                              {(property.grossYield || 0).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Potential</span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              (property.portfolioFit?.potential || 'N/A') === 'HIGH' ? 'bg-emerald-100 text-emerald-700' :
                              (property.portfolioFit?.potential || 'N/A') === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {property.portfolioFit?.potential || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sales History - Compact */}
                    {(property.totalSales > 0 || (property.salesHistory && property.salesHistory.length > 0) || property.lastSaleDate) && (
                      <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-800">📊 Sales History</span>
                          <span className="text-sm text-blue-700 font-bold bg-blue-100 px-2 py-1 rounded-full">
                            {property.totalSales || property.salesHistory?.length || 0} total sale{(property.totalSales || property.salesHistory?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {property.lastSaleDate && (
                            <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                              <div className="font-semibold text-gray-800 mb-2 text-sm">Latest Sale</div>
                              <div className="text-lg font-bold text-gray-900">{new Date(property.lastSaleDate).toLocaleDateString('en-GB', { 
                                day: 'numeric', 
                                month: 'long', 
                                year: 'numeric' 
                              })}</div>
                              <div className="text-blue-600 font-semibold">£{(property.lastSalePrice || 0).toLocaleString()}</div>
                            </div>
                          )}
                          
                          {(property.totalSales > 1 || (property.salesHistory && property.salesHistory.length > 1)) && property.priceRange && (
                            <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                              <div className="font-semibold text-gray-800 mb-2 text-sm">Price Range</div>
                              <div className="text-lg font-bold text-emerald-600">
                                £{(property.priceRange.min || 0).toLocaleString()} - £{(property.priceRange.max || 0).toLocaleString()}
                              </div>
                              {property.growthPeriod && property.growthPeriod !== 'N/A' && (
                                <div className="text-gray-600 text-sm mt-2 bg-gray-50 px-2 py-1 rounded">
                                  Period: {property.growthPeriod}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Additional Sales Info */}
                        {property.salesHistory && property.salesHistory.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Sales Timeline:</span> 
                              {property.salesHistory.map((sale: any, index: number) => (
                                <span key={index} className="ml-2">
                                  {new Date(sale.date).getFullYear()} (£{sale.price.toLocaleString()})
                                  {index < property.salesHistory.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Action Buttons - Compact */}
                    <div className="px-4 py-3 bg-gray-25 border-t border-gray-100">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePropertySelect(property)}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm"
                        >
                          <Target className="h-4 w-4" />
                          Analysis
                        </button>
                        <button
                          onClick={() => handleAddToPortfolio(property)}
                          className={`flex-1 font-medium py-2 px-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm ${
                            portfolioProperties.some(p => p.address === property.address && p.postcode === property.postcode)
                              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                              : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white hover:shadow-md'
                          }`}
                          disabled={portfolioProperties.some(p => p.address === property.address && p.postcode === property.postcode)}
                        >
                          {portfolioProperties.some(p => p.address === property.address && p.postcode === property.postcode) ? (
                            <>
                              <Eye className="h-4 w-4" />
                              Added
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              Add
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Input Tab */}
        {activeTab === 'manual' && showManualInput && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Manual Property Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={manualProperty.address}
                    onChange={(e) => setManualProperty(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main Street"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postcode *
                  </label>
                  <input
                    type="text"
                    value={manualProperty.postcode}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const formatted = formatPostcode(rawValue);
                      setManualProperty(prev => ({ ...prev, postcode: formatted }));
                    }}
                    placeholder="NE5 2PR"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Postcodes are automatically formatted</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type
                  </label>
                  <select
                    value={manualProperty.propertyType}
                    onChange={(e) => setManualProperty(prev => ({ ...prev, propertyType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="detached">Detached</option>
                    <option value="semi-detached">Semi-Detached</option>
                    <option value="terraced">Terraced</option>
                    <option value="flat">Flat/Apartment</option>
                    <option value="bungalow">Bungalow</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={manualProperty.bedrooms}
                    onChange={(e) => setManualProperty(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 3 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Floor Area (m²)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={manualProperty.floorArea}
                    onChange={(e) => setManualProperty(prev => ({ ...prev, floorArea: parseInt(e.target.value) || 0 }))}
                    placeholder="95"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Sold Price (£)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={manualProperty.lastSoldPrice}
                    onChange={(e) => setManualProperty(prev => ({ ...prev, lastSoldPrice: parseInt(e.target.value) || 0 }))}
                    placeholder="250000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Sold Date
                  </label>
                  <input
                    type="date"
                    value={manualProperty.lastSoldDate}
                    onChange={(e) => setManualProperty(prev => ({ ...prev, lastSoldDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    EPC Rating
                  </label>
                  <select
                    value={manualProperty.epcRating}
                    onChange={(e) => setManualProperty(prev => ({ ...prev, epcRating: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                    <option value="F">F</option>
                    <option value="G">G</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleManualInputSubmit} className="px-6">
                  Save Property
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && showPortfolio && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Portfolio Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              {portfolioProperties.length > 0 ? (
                <div className="space-y-3">
                  {portfolioProperties.map((property) => (
                    <div
                      key={property.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handlePropertySelect(property)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{property.address}</p>
                          <p className="text-sm text-gray-600">{property.postcode}</p>
                          <div className="flex items-center gap-4 mt-1">
                            {property.propertyType && (
                              <Badge variant="secondary" className="text-xs">
                                {property.propertyType}
                              </Badge>
                            )}
                            {property.bedrooms && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {property.bedrooms} beds
                              </span>
                            )}
                            {property.lastSoldPrice && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                £{property.lastSoldPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Select
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No portfolio properties found</p>
                  <p className="text-sm">Add properties to your portfolio to see them here</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && showWatchlist && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Watchlist Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              {watchlistProperties.length > 0 ? (
                <div className="space-y-3">
                  {watchlistProperties.map((property) => (
                    <div
                      key={property.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handlePropertySelect(property)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{property.address}</p>
                          <p className="text-sm text-gray-600">{property.postcode}</p>
                          <div className="flex items-center gap-4 mt-1">
                            {property.propertyType && (
                              <Badge variant="secondary" className="text-xs">
                                {property.propertyType}
                              </Badge>
                            )}
                            {property.bedrooms && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {property.bedrooms} beds
                              </span>
                            )}
                            {property.lastSoldPrice && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                £{property.lastSoldPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Select
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No watchlist properties found</p>
                  <p className="text-sm">Add properties to your watchlist to see them here</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
