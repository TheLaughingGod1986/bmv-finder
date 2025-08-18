'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, FolderOpen, Eye, MapPin, Building2, Calendar, Target, Zap } from 'lucide-react';
import Button from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './SimpleCard';
import { Badge } from './SimpleCard';
import { useToast } from './ToastProvider';


interface Property {
  id: string;
  address: string;
  postcode: string;
  propertyType?: string;
  bedrooms?: number;
  floorArea?: number;
  lastSoldPrice?: number;
  lastSoldDate?: string;
  epcRating?: string;
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
  const [activeTab, setActiveTab] = useState<'search' | 'manual' | 'portfolio' | 'watchlist'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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
            epcRating: prop.epc_rating || prop.epcRating
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
            epcRating: prop.epc_rating || prop.epcRating
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching watchlist properties:', error);
    }
  };

  const handlePostcodeSearch = async () => {
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
      const response = await fetch(`/api/enhanced-property-search?postcode=${encodeURIComponent(formattedPostcode)}&includeRental=true&includeHPI=true`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.properties && data.data.properties.length > 0) {
          setSearchResults(data.data.properties.map((prop: any) => ({
            id: prop.id || `search-${prop.postcode}-${prop.address}`,
            address: prop.address || 'Unknown Address',
            postcode: formatPostcode(prop.postcode),
            propertyType: prop.propertyType || 'semi-detached',
            bedrooms: prop.habitableRooms || 3,
            floorArea: prop.totalFloorArea || 0,
            lastSoldPrice: 0, // Not available in EPC data
            lastSoldDate: prop.inspectionDate || '',
            epcRating: prop.currentEnergyRating || 'C',
            // Enhanced data
            energyEfficiency: prop.currentEnergyEfficiency,
            constructionAge: prop.constructionAge,
            tenure: prop.tenure,
            rental: prop.rental,
            marketTrends: prop.marketTrends
          })));
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
          title: 'Search Failed',
          message: 'Search failed. Please try again.'
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      showToast({
        type: 'error',
        title: 'Search Failed',
        message: 'Search failed. Please try again.'
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
      epcRating: manualProperty.epcRating || 'C'
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

  const tabs = [
    { id: 'search', label: 'Postcode Search', icon: Search, show: showPostcodeSearch },
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
        {/* Postcode Search Tab */}
        {activeTab === 'search' && showPostcodeSearch && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search by Postcode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const formatted = formatPostcode(rawValue);
                      setSearchQuery(formatted);
                    }}
                    placeholder="Enter postcode (e.g., NE5 2PR)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handlePostcodeSearch()}
                  />
                  <Button
                    onClick={handlePostcodeSearch}
                    disabled={isSearching}
                    className="px-6"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Postcodes are automatically formatted (e.g., NE54PR → NE5 4PR)</p>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Search Results</h4>
                  {searchResults.map((property) => (
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
                            {property.floorArea && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {property.floorArea}m²
                              </span>
                            )}
                            {property.epcRating && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                EPC {property.epcRating}
                              </span>
                            )}
                          </div>
                          {/* Enhanced Data Display */}
                          {(property.rental || property.marketTrends) && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              {property.rental && (
                                <div className="text-xs text-gray-600">
                                  <span className="font-medium">Rent:</span> £{property.rental.estimatedMonthlyRent}/month
                                  {property.rental.grossYield > 0 && (
                                    <span className="ml-2 text-green-600">
                                      Yield: {property.rental.grossYield}%
                                    </span>
                                  )}
                                </div>
                              )}
                              {property.marketTrends && (
                                <div className="text-xs text-gray-600 mt-1">
                                  <span className="font-medium">Market:</span> {property.marketTrends.region}
                                  {property.marketTrends.monthlyChange !== 0 && (
                                    <span className={`ml-2 ${property.marketTrends.monthlyChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {property.marketTrends.monthlyChange > 0 ? '+' : ''}{property.marketTrends.monthlyChange}% this month
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <Button size="sm" variant="outline">
                          Select
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
