'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useToast } from '../components/ToastProvider';
import { Search, Clock, MapPin, Trash2, Plus, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import Head from 'next/head';

interface SavedSearch {
  id: string;
  query: string;
  location: string;
  savedAt: string;
  lastUsed?: string;
  resultCount?: number;
}

export default function SavedSearchesPage() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Memoized calculations
  const stats = useMemo(() => ({
    totalSearches: savedSearches.length,
    areasTracked: new Set(savedSearches.map(s => s.location)).size,
    lastUpdated: savedSearches.length > 0 
      ? new Date(Math.max(...savedSearches.map(s => new Date(s.savedAt).getTime()))).toLocaleDateString()
      : 'Never'
  }), [savedSearches]);

  // Memoized event handlers
  const handleRunSearch = useCallback((query: string) => {
    window.location.href = `/?search=${encodeURIComponent(query)}`;
  }, []);

  const handleDelete = useCallback((id: string) => {
    setSavedSearches(prev => prev.filter(search => search.id !== id));
  }, []);

  const handleNewSearch = useCallback(() => {
    window.location.href = '/';
  }, []);

  const handleExport = useCallback(() => {
    // Export saved searches
  }, []);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setSavedSearches([
        {
          id: '1',
          query: 'NE5 2PR',
          location: 'Newcastle upon Tyne',
          savedAt: '2024-01-15T10:30:00Z',
          lastUsed: '2024-01-20T14:22:00Z',
          resultCount: 45
        },
        {
          id: '2',
          query: 'SE3 9FE',
          location: 'London, Greenwich',
          savedAt: '2024-01-10T09:15:00Z',
          lastUsed: '2024-01-18T16:45:00Z',
          resultCount: 23
        },
        {
          id: '3',
          query: 'SS9 5EL',
          location: 'Leigh-on-Sea, Essex',
          savedAt: '2024-01-05T11:20:00Z',
          resultCount: 67
        }
      ]);
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {[1, 2, 3].map((index) => (
        <div key={index} className="bg-white/90 rounded-2xl p-6 shadow-soft border border-neutral-200 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-slate-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-slate-100 rounded-lg p-3 border border-neutral-200 shadow-soft">
                    <div className="h-3 bg-slate-200 rounded mb-2 w-1/2"></div>
                    <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 ml-6">
              <div className="h-10 bg-slate-200 rounded-lg w-24"></div>
              <div className="h-9 bg-slate-200 rounded-lg w-9"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return formatDate(dateString);
  };

  return (
    <>
      <Head>
        <title>Saved Searches | BMV Finder - Track Your Property Search History</title>
        <meta name="description" content="Access your saved property searches and track market insights. Quickly run searches on your favorite areas and monitor property price trends with BMV Finder." />
        <meta name="keywords" content="saved searches, property search history, BMV finder, property tracking, UK property market" />
        <meta property="og:title" content="Saved Searches | BMV Finder" />
        <meta property="og:description" content="Access your saved property searches and track market insights with BMV Finder." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bmvfinder.com/saved-searches" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Saved Searches | BMV Finder" />
        <meta name="twitter:description" content="Access your saved property searches and track market insights." />
        <link rel="canonical" href="https://bmvfinder.com/saved-searches" />
      </Head>
      <div className="min-h-screen bg-neutral-light font-sans">
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Standardized Header */}
          <div className="text-center mb-10 max-w-3xl mx-auto pt-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Bookmark className="w-7 h-7 text-blue-600" />
              </div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-0" id="page-title">Saved Searches</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4" id="page-description">
              Access your frequently used property searches and track market insights across your favorite areas.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12" role="region" aria-labelledby="stats-heading">
            <h2 className="sr-only" id="stats-heading">Search Statistics</h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-soft border border-neutral-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <Search className="w-7 h-7 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">Total Searches</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">{stats.totalSearches}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-soft border border-neutral-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-7 h-7 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">Areas Tracked</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">{stats.areasTracked}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-soft border border-neutral-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-7 h-7 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-900">Last Updated</h3>
              </div>
              <p className="text-3xl font-bold text-purple-600">{stats.lastUpdated}</p>
            </motion.div>
          </div>

          {/* Saved Searches List */}
          <div className="space-y-6" role="region" aria-labelledby="searches-heading">
            <h2 className="sr-only" id="searches-heading">Saved Searches List</h2>
            {isLoading ? (
              <LoadingSkeleton />
            ) : savedSearches.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center py-16"
              >
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center shadow-soft">
                  <Search className="w-16 h-16 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No Saved Searches Yet</h3>
                <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
                  Save your frequently used property searches to quickly access market insights and track areas of interest.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleNewSearch}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-400 focus:outline-none transition shadow-soft"
                  >
                    <Plus className="w-5 h-5" />
                    Start Your First Search
                  </button>
                  <button
                    onClick={() => {
                      // Demo functionality
                      // View demo searches
                    }}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-slate-100 text-slate-700 rounded-full font-semibold hover:bg-slate-200 active:bg-slate-300 focus:ring-2 focus:ring-slate-300 focus:outline-none transition shadow-soft"
                  >
                    <Bookmark className="w-5 h-5" />
                    View Examples
                  </button>
                </div>
              </motion.div>
            ) : (
              savedSearches.map((search, index) => (
                <motion.div
                  key={search.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="bg-white rounded-2xl shadow-soft hover:shadow-xl transition-all duration-200 group border border-neutral-200"
                  role="article"
                  aria-labelledby={`search-${search.id}-title`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                          <Search className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1" id={`search-${search.id}-title`}>{search.query}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {search.location}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                        <div className="bg-slate-50 rounded-lg p-3 border border-neutral-200 shadow-soft">
                          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Saved</p>
                          <p className="font-semibold text-gray-900">{new Date(search.savedAt).toLocaleDateString()}</p>
                        </div>
                        {search.lastUsed && (
                          <div className="bg-slate-50 rounded-lg p-3 border border-neutral-200 shadow-soft">
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Last Used</p>
                            <p className="font-semibold text-gray-900">{new Date(search.lastUsed).toLocaleDateString()}</p>
                          </div>
                        )}
                        {search.resultCount && (
                          <div className="bg-slate-50 rounded-lg p-3 border border-neutral-200 shadow-soft">
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Results</p>
                            <p className="font-semibold text-gray-900">{search.resultCount}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-6">
                      <button
                        onClick={() => handleRunSearch(search.query)}
                        className="rounded-full font-semibold shadow-soft bg-primary-500 text-white px-5 py-2.5 hover:bg-primary-600 focus:ring-2 focus:ring-primary-400 transition inline-flex items-center gap-2 text-sm"
                        aria-label={`Run search for ${search.query}`}
                      >
                        <Search className="w-4 h-4" />
                        Run Search
                      </button>
                      <button
                        className="rounded-full font-semibold shadow-soft bg-red-100 text-red-700 px-5 py-2.5 hover:bg-red-500 hover:text-white focus:ring-2 focus:ring-red-300 transition"
                        aria-label={`Delete saved search for ${search.query}`}
                        onClick={() => handleDelete(search.id)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Quick Actions */}
          {savedSearches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 bg-white rounded-2xl shadow-soft border border-neutral-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12" role="toolbar" aria-label="Search actions">
                <div className="flex gap-2">
                  <button 
                    onClick={handleNewSearch}
                    className="rounded-full font-semibold shadow-soft bg-primary-500 text-white px-5 py-2.5 hover:bg-primary-600 focus:ring-2 focus:ring-primary-400 transition inline-flex items-center gap-2"
                    aria-label="Create a new property search"
                  >
                    <Plus className="w-5 h-5" />
                    New Search
                  </button>
                  <button 
                    onClick={handleExport}
                    className="rounded-full font-semibold shadow-soft bg-slate-100 text-slate-700 px-5 py-2.5 hover:bg-slate-200 focus:ring-2 focus:ring-primary-400 transition inline-flex items-center gap-2"
                    aria-label="Export saved searches"
                  >
                    <Bookmark className="w-5 h-5" />
                    Export
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </>
  );
} 