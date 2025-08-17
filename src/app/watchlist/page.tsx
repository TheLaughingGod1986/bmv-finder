'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatPrice } from '@/lib/formatters';
import { 
  Eye, 
  List, 
  Grid3X3, 
  Table, 
  Search, 
  Filter, 
  SortAsc, 
  Plus,
  MapPin,
  Home,
  PoundSterling,
  Calendar,
  Tag,
  Edit3,
  Trash2,
  Eye as ViewIcon,
  TrendingUp,
  BarChart3,
  Zap
} from 'lucide-react';

interface WatchlistItem {
  id: string;
  user_id: string;
  property_id: string;
  postcode: string;
  address: string;
  house_number: string;
  street: string;
  town: string;
  county: string;
  property_type: string;
  price: number;
  date_added: string;
  notes: string;
  status: 'watching' | 'interested' | 'purchased';
  source: string;
  last_updated: string;
  // EPC data fields
  epc_rating?: string;
  floor_area_m2?: number;
  total_floor_area?: number;
  current_energy_rating?: string;
  potential_energy_rating?: string;
  current_energy_cost?: number;
  potential_energy_cost?: number;
  // Additional calculated fields
  estimated_rent?: number;
  yield_percentage?: number;
}

type ViewMode = 'cards' | 'list' | 'table';

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date_added');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedProperty, setSelectedProperty] = useState<WatchlistItem | null>(null);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/watchlist');
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          // Enhance watchlist items with EPC data
          const enhancedWatchlist = await Promise.all(
            data.data.map(async (item: WatchlistItem) => {
              try {
                // Fetch EPC data for each property
                const epcResponse = await fetch(`/api/epc-data?postcode=${item.postcode}&number=${item.house_number}`);
                if (epcResponse.ok) {
                  const epcData = await epcResponse.json();
                  if (epcData.success && epcData.data) {
                    const epc = epcData.data;
                    return {
                      ...item,
                      epc_rating: epc.currentEnergyRating || epc.epcRating,
                      floor_area_m2: epc.floorArea || epc.totalFloorArea || epc.floor_area_m2,
                      total_floor_area: epc.totalFloorArea || epc.floorArea || epc.floor_area_m2,
                      current_energy_rating: epc.currentEnergyRating || epc.epcRating,
                      potential_energy_rating: epc.potentialEnergyRating,
                      current_energy_cost: epc.currentEnergyCost,
                      potential_energy_cost: epc.potentialEnergyCost,
                      estimated_rent: Math.floor(item.price * 0.004),
                      yield_percentage: Math.floor((item.price * 0.004 * 12) / item.price * 100)
                    };
                  }
                }
              } catch (epcError) {
                console.log(`No EPC data found for ${item.address}:`, epcError);
              }
              
              // Return item with default values if no EPC data
              return {
                ...item,
                estimated_rent: Math.floor(item.price * 0.004),
                yield_percentage: Math.floor((item.price * 0.004 * 12) / item.price * 100)
              };
            })
          );
          
          setWatchlist(enhancedWatchlist);
        } else {
          setWatchlist([]);
        }
      } else {
        setWatchlist([]);
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedWatchlist = watchlist
    .filter(item => {
      const matchesSearch = 
        item.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.postcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.town.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'date_added':
          aValue = new Date(a.date_added);
          bValue = new Date(b.date_added);
          break;
        case 'yield_percentage':
          aValue = a.yield_percentage || 0;
          bValue = b.yield_percentage || 0;
          break;
        case 'floor_area':
          aValue = a.floor_area_m2 || a.total_floor_area || 0;
          bValue = b.floor_area_m2 || b.total_floor_area || 0;
          break;
        default:
          aValue = a.date_added;
          bValue = b.date_added;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'watching': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'interested': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'purchased': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'watching': return <Eye className="w-4 h-4" />;
      case 'interested': return <TrendingUp className="w-4 h-4" />;
      case 'purchased': return <Home className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const getEPCRatingColor = (rating: string) => {
    switch (rating?.toUpperCase()) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'E': return 'bg-red-100 text-red-800 border-red-200';
      case 'F': return 'bg-red-100 text-red-800 border-red-200';
      case 'G': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFloorArea = (item: WatchlistItem) => {
    return item.floor_area_m2 || item.total_floor_area || 'N/A';
  };

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Property Watchlist</h1>
          <p className="text-gray-600 mt-2">
            Track and analyze properties you're interested in with EPC data
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{watchlist.length}</div>
              <div className="text-sm text-gray-600">Total Properties</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {watchlist.filter(p => p.status === 'interested').length}
              </div>
              <div className="text-sm text-gray-600">Interested</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {watchlist.filter(p => p.status === 'purchased').length}
              </div>
              <div className="text-sm text-gray-600">Purchased</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatPrice(watchlist.reduce((sum, p) => sum + p.price, 0))}
              </div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {watchlist.length > 0 ? 
                  Math.round(watchlist.reduce((sum, p) => sum + (p.yield_percentage || 0), 0) / watchlist.length) : 0
                }%
              </div>
              <div className="text-sm text-gray-600">Avg Yield</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {watchlist.filter(p => p.floor_area_m2 || p.total_floor_area).length}
              </div>
              <div className="text-sm text-gray-600">With EPC Data</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="watching">Watching</option>
                <option value="interested">Interested</option>
                <option value="purchased">Purchased</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date_added">Date Added</option>
                <option value="price">Price</option>
                <option value="yield_percentage">Yield %</option>
                <option value="floor_area">Floor Area</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <SortAsc className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Table className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-8">
          {filteredAndSortedWatchlist.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Add properties to your watchlist to get started'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Cards View */}
              {viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAndSortedWatchlist.map((property) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {property.house_number} {property.street}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                              {property.town}, {property.county} {property.postcode}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(property.status)}`}>
                            {getStatusIcon(property.status)}
                            <span className="ml-1 capitalize">{property.status}</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-2xl font-bold text-blue-600">{formatPrice(property.price)}</p>
                            <p className="text-xs text-gray-500">Price</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-green-600">{property.yield_percentage}%</p>
                            <p className="text-xs text-gray-500">Yield</p>
                          </div>
                        </div>

                        {/* EPC Data Section */}
                        {(property.floor_area_m2 || property.total_floor_area || property.epc_rating) && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm font-medium text-gray-700">EPC Data</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              {property.floor_area_m2 || property.total_floor_area ? (
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {getFloorArea(property)} m²
                                  </p>
                                  <p className="text-gray-500">Floor Area</p>
                                </div>
                              ) : null}
                              {property.epc_rating ? (
                                <div>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEPCRatingColor(property.epc_rating)}`}>
                                    {property.epc_rating}
                                  </span>
                                  <p className="text-gray-500 mt-1">EPC Rating</p>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                          <span>Added: {formatDate(property.date_added)}</span>
                          <span className="text-xs text-gray-500">
                            {property.floor_area_m2 || property.total_floor_area ? 'EPC Available' : 'No EPC Data'}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                            View Details
                          </button>
                          <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {filteredAndSortedWatchlist.map((property) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {property.house_number} {property.street}
                              </h3>
                              <p className="text-gray-600">
                                {property.town}, {property.county} {property.postcode}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">{formatPrice(property.price)}</p>
                              <p className="text-sm text-gray-500">Price</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-semibold text-green-600">{property.yield_percentage}%</p>
                              <p className="text-sm text-gray-500">Yield</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">{getFloorArea(property)} m²</p>
                              <p className="text-sm text-gray-500">Floor Area</p>
                            </div>
                            {property.epc_rating && (
                              <div className="text-center">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEPCRatingColor(property.epc_rating)}`}>
                                  {property.epc_rating}
                                </span>
                                <p className="text-sm text-gray-500 mt-1">EPC</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(property.status)}`}>
                            {getStatusIcon(property.status)}
                            <span className="ml-1 capitalize">{property.status}</span>
                          </span>
                          <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yield</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-xs font-medium text-gray-500 uppercase tracking-wider">Floor Area</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EPC Rating</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAndSortedWatchlist.map((property) => (
                          <tr key={property.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {property.house_number} {property.street}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {property.town}, {property.county}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {property.postcode}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-blue-600">{formatPrice(property.price)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-green-600">{property.yield_percentage}%</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {getFloorArea(property)} m²
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {property.epc_rating ? (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEPCRatingColor(property.epc_rating)}`}>
                                  {property.epc_rating}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(property.status)}`}>
                                {getStatusIcon(property.status)}
                                <span className="ml-1 capitalize">{property.status}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(property.date_added)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <button className="text-blue-600 hover:text-blue-900">
                                  <ViewIcon className="w-4 h-4" />
                                </button>
                                <button className="text-gray-600 hover:text-gray-900">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button className="text-red-600 hover:text-red-900">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
