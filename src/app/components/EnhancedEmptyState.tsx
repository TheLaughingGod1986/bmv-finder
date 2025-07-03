'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Home, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EnhancedEmptyStateProps {
  postcode: string;
  hasSearched: boolean;
  onTryDifferentSearch: () => void;
  onSearchSuggestion: (suggestion: string) => void;
}

const EnhancedEmptyState: React.FC<EnhancedEmptyStateProps> = ({ 
  postcode, 
  hasSearched, 
  onTryDifferentSearch,
  onSearchSuggestion 
}) => {
  const [popularAreas, setPopularAreas] = useState([
    { area: 'SW1A 1AA', description: 'Buckingham Palace, London', icon: <MapPin className="w-4 h-4" /> },
    { area: 'M1 1AA', description: 'Manchester City Centre', icon: <Home className="w-4 h-4" /> },
    { area: 'B1 1AA', description: 'Birmingham City Centre', icon: <Home className="w-4 h-4" /> },
    { area: 'L1 1AA', description: 'Liverpool City Centre', icon: <Home className="w-4 h-4" /> },
    { area: 'SE22 0HP', description: 'East Dulwich, London', icon: <TrendingUp className="w-4 h-4" /> },
    { area: 'W11 1AA', description: 'Notting Hill, London', icon: <TrendingUp className="w-4 h-4" /> },
  ]);

  useEffect(() => {
    async function fetchPopularAreas() {
      try {
        const res = await fetch('/api/suggest-postcodes?q= ');
        const data = await res.json();
        if (data.suggestions && data.suggestions.length > 0) {
          setPopularAreas(
            data.suggestions.slice(0, 6).map((postcode: string) => ({
              area: postcode,
              description: '', // Optionally fetch area descriptions if available
              icon: <Home className="w-4 h-4" />
            }))
          );
        }
      } catch (e) {
        // fallback to hardcoded
      }
    }
    fetchPopularAreas();
  }, []);

  const SuggestionCard = ({ area, index }: { area: { area: string; description: string; icon: React.ReactNode }; index: number }) => (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => onSearchSuggestion(area.area)}
      className="group flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:scale-105"
    >
      <div className="text-blue-500 group-hover:text-blue-600 transition-colors">
        {area.icon}
      </div>
      <div className="text-left">
        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
          {area.area}
        </div>
        <div className="text-sm text-slate-600">
          {area.description}
        </div>
      </div>
    </motion.button>
  );

  const TipCard = ({ title, description, icon, delay }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    delay: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200"
    >
      <div className="text-blue-600 mt-0.5">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-blue-900 mb-1">{title}</h4>
        <p className="text-sm text-blue-800 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Main Empty State */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
          <Search className="w-12 h-12 text-blue-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          No properties found for "{postcode}"
        </h2>
        
        <p className="text-slate-600 mb-6 max-w-2xl mx-auto leading-relaxed">
          We couldn't find any property sales data for this area. This could be because:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
          <TipCard
            title="New or Small Area"
            description="The postcode might be very new or cover a small area with no recent sales."
            icon={<AlertCircle className="w-5 h-5" />}
            delay={0.2}
          />
          <TipCard
            title="Try Different Search"
            description="Try searching for a broader area or nearby postcode to see more results."
            icon={<Lightbulb className="w-5 h-5" />}
            delay={0.3}
          />
          <TipCard
            title="Check Spelling"
            description="Double-check the postcode format and try again with correct spelling."
            icon={<Search className="w-5 h-5" />}
            delay={0.4}
          />
        </div>
      </motion.div>

      {/* Popular Areas Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8"
      >
        <h3 className="text-xl font-bold text-slate-900 mb-4 text-center">
          Try These Popular Areas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularAreas.map((area, index) => (
            <SuggestionCard key={area.area} area={area} index={index} />
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
      >
        <button
          onClick={onTryDifferentSearch}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Try Different Search
        </button>
        
        <button
          onClick={() => onSearchSuggestion('SW1')}
          className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          Browse London Areas
        </button>
      </motion.div>

      {/* Additional Help */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200"
      >
        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          Search Tips
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
          <div>
            <strong>Try partial postcodes:</strong>
            <ul className="mt-1 space-y-1">
              <li>• "SW1" for all SW1 areas</li>
              <li>• "M1" for Manchester city centre</li>
              <li>• "B1" for Birmingham city centre</li>
            </ul>
          </div>
          <div>
            <strong>Search by location:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Street names (e.g., "Oxford Street")</li>
              <li>• Town names (e.g., "Manchester")</li>
              <li>• Area names (e.g., "Notting Hill")</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedEmptyState; 