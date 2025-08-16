'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  BarChart3
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
  // Additional fields for enhanced display
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  garden?: boolean;
  parking?: boolean;
  condition?: string;
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
          // Add mock data for enhanced display
          const enhancedData = data.data.map((item: WatchlistItem) => ({
            ...item,
            bedrooms: Math.floor(Math.random() * 4) + 1,
            bathrooms: Math.floor(Math.random() * 2) + 1,
            square_feet: Math.floor(Math.random() * 1000) + 500,
            garden: Math.random() > 0.3,
            parking: Math.random() > 0.4,
            condition: ['Excellent', 'Good', 'Fair', 'Needs Work'][Math.floor(Math.random() * 4)],
            estimated_rent: Math.floor(item.price * 0.004),
            yield_percentage: Math.floor((item.price * 0.004 * 12) / item.price * 100)
          }));
          setWatchlist(enhancedData);
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
            Track and analyze properties you're interested in
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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

                        <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                          <div className="text-center">
                            <p className="font-medium">{property.bedrooms}</p>
                            <p className="text-gray-500">Beds</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{property.bathrooms}</p>
                            <p className="text-gray-500">Baths</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{property.square_feet?.toLocaleString()}</p>
                            <p className="text-gray-500">Sq ft</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                          <span>Added: {formatDate(property.date_added)}</span>
                          <span className={`px-2 py-1 rounded text-xs ${property.condition === 'Excellent' ? 'bg-green-100 text-green-800' : property.condition === 'Good' ? 'bg-blue-100 text-blue-800' : property.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {property.condition}
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
                              <p className="font-medium">{property.bedrooms} bed</p>
                              <p className="text-sm text-gray-500">{property.bathrooms} bath</p>
                            </div>
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
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
                                {property.bedrooms} bed, {property.bathrooms} bath
                              </div>
                              <div className="text-sm text-gray-500">
                                {property.square_feet?.toLocaleString()} sq ft
                              </div>
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
