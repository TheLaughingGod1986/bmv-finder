'use client';

import { useState, useEffect } from 'react';
import { HybridUser } from '@/lib/auth/hybridAuth';

interface WatchlistProperty {
  id: string;
  userId: string;
  propertyId: string;
  title: string;
  address: string;
  postcode: string;
  price: number;
  priceFormatted: string;
  bedrooms?: number;
  bathrooms?: number;
  propertyType: string;
  listingType: 'sale' | 'rent';
  imageUrl?: string;
  description?: string;
  sourceUrl: string;
  source: 'chrome-extension' | 'manual' | 'api';
  bmvScore?: number;
  marketValue?: number;
  potentialProfit?: number;
  addedAt: string;
  lastUpdated: string;
  notes?: string;
  tags: string[];
  isActive: boolean;
  metadata?: {
    originalPrice?: number;
    priceHistory?: Array<{ price: number; date: string; source: string }>;
    viewCount?: number;
    lastViewed?: string;
    website?: string;
    agent?: string;
  };
}

interface WatchlistStats {
  total: number;
  active: number;
  inactive: number;
  chromeExtension: number;
  manual: number;
  totalValue: number;
  averagePrice: number;
}

interface WatchlistProps {
  user: HybridUser;
}

export default function WatchlistPage({ user }: WatchlistProps) {
  const [properties, setProperties] = useState<WatchlistProperty[]>([]);
  const [stats, setStats] = useState<WatchlistStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('addedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadWatchlist();
  }, [currentPage, sortBy, sortOrder, filter, search]);

  const loadWatchlist = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy,
        sortOrder,
        filter,
        ...(search && { search })
      });

      // Get auth token for API calls
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Try to get Supabase session token
      if (typeof window !== 'undefined') {
        try {
          const { supabase } = await import('@/lib/supabaseClient');
          if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              headers['Authorization'] = `Bearer ${session.access_token}`;
            }
          }
        } catch (e) {
          // Supabase not available, continue without token
        }
      }

      const response = await fetch(`/api/watchlist?${params}`, {
        headers
      });
      const data = await response.json();

      if (data.success) {
        setProperties(data.properties);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(data.error || 'Failed to load watchlist');
      }
    } catch (err) {
      setError('Network error loading watchlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveProperty = async (propertyId: string) => {
    try {
      const response = await fetch(`/api/watchlist?id=${propertyId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setProperties(properties.filter(p => p.id !== propertyId));
        loadWatchlist(); // Refresh stats
      } else {
        setError(data.error || 'Failed to remove property');
      }
    } catch (err) {
      setError('Network error removing property');
    }
  };

  const handleUpdateProperty = async (propertyId: string, updates: Partial<WatchlistProperty>) => {
    try {
      const response = await fetch('/api/watchlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: propertyId, ...updates })
      });

      const data = await response.json();
      if (data.success) {
        setProperties(properties.map(p => p.id === propertyId ? data.property : p));
      } else {
        setError(data.error || 'Failed to update property');
      }
    } catch (err) {
      setError('Network error updating property');
    }
  };

  const handleBulkAction = async (action: 'remove' | 'activate' | 'deactivate') => {
    if (selectedProperties.size === 0) return;

    try {
      const promises = Array.from(selectedProperties).map(propertyId => {
        switch (action) {
          case 'remove':
            return fetch(`/api/watchlist?id=${propertyId}`, { method: 'DELETE' });
          case 'activate':
            return fetch('/api/watchlist', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: propertyId, isActive: true })
            });
          case 'deactivate':
            return fetch('/api/watchlist', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: propertyId, isActive: false })
            });
        }
      });

      await Promise.all(promises);
      setSelectedProperties(new Set());
      loadWatchlist();
    } catch (err) {
      setError('Network error performing bulk action');
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'chrome-extension': return '🔌';
      case 'manual': return '✋';
      case 'api': return '🔗';
      default: return '❓';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'chrome-extension': return 'bg-blue-100 text-blue-800';
      case 'manual': return 'bg-green-100 text-green-800';
      case 'api': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading && properties.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Property Watchlist</h1>
              <p className="text-gray-600 mt-1">
                Track and manage your saved properties from Chrome extension and manual additions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {viewMode === 'grid' ? '📋' : '⊞'}
              </button>
              <button
                onClick={loadWatchlist}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">⭐</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Properties</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg">🔌</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Chrome Extension</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.chromeExtension}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-lg">💰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Value</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    £{stats.totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-lg">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Average Price</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    £{Math.round(stats.averagePrice).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Properties</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="chrome-extension">Chrome Extension</option>
                  <option value="manual">Manual</option>
                </select>

                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="addedAt-desc">Newest First</option>
                  <option value="addedAt-asc">Oldest First</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="lastUpdated-desc">Recently Updated</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedProperties.size > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 font-medium">
                    {selectedProperties.size} properties selected
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleBulkAction('activate')}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleBulkAction('deactivate')}
                      className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                    >
                      Deactivate
                    </button>
                    <button
                      onClick={() => handleBulkAction('remove')}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => setSelectedProperties(new Set())}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Properties Grid/List */}
        {properties.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Properties in Watchlist</h3>
            <p className="text-gray-600 mb-6">
              Start building your watchlist by using the Chrome extension or adding properties manually.
            </p>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">🔌 Chrome Extension</h4>
                <p className="text-blue-800 text-sm">
                  Install our Chrome extension to easily capture properties from Rightmove, Zoopla, and other property websites.
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">✋ Manual Addition</h4>
                <p className="text-green-800 text-sm">
                  Add properties manually by clicking the "Add Property" button and filling in the details.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                viewMode={viewMode}
                isSelected={selectedProperties.has(property.id)}
                onSelect={(selected) => {
                  const newSelected = new Set(selectedProperties);
                  if (selected) {
                    newSelected.add(property.id);
                  } else {
                    newSelected.delete(property.id);
                  }
                  setSelectedProperties(newSelected);
                }}
                onUpdate={handleUpdateProperty}
                onRemove={handleRemoveProperty}
                getSourceIcon={getSourceIcon}
                getSourceColor={getSourceColor}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 border rounded-md text-sm font-medium ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Property Card Component
function PropertyCard({
  property,
  viewMode,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  getSourceIcon,
  getSourceColor,
  formatDate
}: {
  property: WatchlistProperty;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onUpdate: (id: string, updates: Partial<WatchlistProperty>) => void;
  onRemove: (id: string) => void;
  getSourceIcon: (source: string) => string;
  getSourceColor: (source: string) => string;
  formatDate: (date: string) => string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState(property.notes || '');
  const [editTags, setEditTags] = useState(property.tags.join(', '));

  const handleSaveEdit = () => {
    onUpdate(property.id, {
      notes: editNotes,
      tags: editTags.split(',').map(tag => tag.trim()).filter(tag => tag)
    });
    setIsEditing(false);
  };

  return (
    <div className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow ${
      viewMode === 'list' ? 'flex' : ''
    } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      {/* Selection Checkbox */}
      <div className="p-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>

      {/* Property Image */}
      {viewMode === 'grid' && (
        <div className="aspect-w-16 aspect-h-9">
          {property.imageUrl ? (
            <img
              src={property.imageUrl}
              alt={property.title}
              className="w-full h-48 object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
              <span className="text-gray-400 text-4xl">🏠</span>
            </div>
          )}
        </div>
      )}

      {/* Property Details */}
      <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {property.title}
            </h3>
            <p className="text-gray-600 text-sm mb-2">{property.address}</p>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(property.source)}`}>
                {getSourceIcon(property.source)} {property.source.replace('-', ' ')}
              </span>
              {property.metadata?.website && (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                  {property.metadata.website}
                </span>
              )}
              {!property.isActive && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                  Inactive
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{property.priceFormatted}</p>
            <p className="text-sm text-gray-500">Added {formatDate(property.addedAt)}</p>
          </div>
        </div>

        {/* Property Info */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          {property.bedrooms && (
            <div>
              <span className="text-gray-500">Bedrooms:</span>
              <span className="ml-1 font-medium">{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms && (
            <div>
              <span className="text-gray-500">Bathrooms:</span>
              <span className="ml-1 font-medium">{property.bathrooms}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">Type:</span>
            <span className="ml-1 font-medium">{property.propertyType}</span>
          </div>
          <div>
            <span className="text-gray-500">Listing:</span>
            <span className="ml-1 font-medium capitalize">{property.listingType}</span>
          </div>
        </div>

        {/* Notes and Tags */}
        {isEditing ? (
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="investment, bmv, fixer-upper"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditNotes(property.notes || '');
                  setEditTags(property.tags.join(', '));
                }}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            {property.notes && (
              <div className="mb-2">
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  {property.notes}
                </p>
              </div>
            )}
            {property.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {property.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <a
              href={property.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              View Original
            </a>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          <button
            onClick={() => onRemove(property.id)}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
