'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Home, 
  TrendingUp, 
  Lightbulb, 
  ArrowRight,
  Clock,
  Star
} from 'lucide-react';
import { cn, getPopularAreas } from '../../lib/utils';

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
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  const popularAreas = getPopularAreas().slice(0, 8);

  const SuggestionCard = ({ area, index }: { area: string; index: number }) => (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => onSearchSuggestion(area)}
      onMouseEnter={() => setSelectedSuggestion(area)}
      onMouseLeave={() => setSelectedSuggestion(null)}
      className={cn(
        "group relative p-4 bg-white rounded-lg border-2 transition-all duration-300 hover:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2",
        selectedSuggestion === area 
          ? "border-blue-300 shadow-md" 
          : "border-gray-200 hover:border-blue-200"
      )}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg transition-colors duration-300",
          selectedSuggestion === area 
            ? "bg-blue-100 text-blue-600" 
            : "bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-500"
        )}>
          <MapPin className="h-4 w-4" />
        </div>
        <div className="text-left">
          <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
            {area}
          </div>
          <div className="text-xs text-gray-500">Popular area</div>
        </div>
        <ArrowRight className={cn(
          "h-4 w-4 ml-auto transition-all duration-300",
          selectedSuggestion === area 
            ? "text-blue-600 translate-x-1" 
            : "text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1"
        )} />
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
      className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200"
    >
      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-blue-900 mb-1">{title}</h4>
        <p className="text-sm text-blue-700">{description}</p>
      </div>
    </motion.div>
  );

  if (!hasSearched) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-16"
      >
        {/* Hero Section */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg"
        >
          <Search className="w-16 h-16 text-blue-600" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold text-gray-800 mb-4"
        >
          Ready to explore property prices?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-lg text-gray-600 max-w-2xl mx-auto mb-8"
        >
          Enter a postcode, street name, or town above to discover sold property prices and market trends in your area.
        </motion.p>

        {/* Search Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">💡 Smart Search Tips</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <TipCard
              title="Try Partial Postcodes"
              description="Use 'SW1A' instead of 'SW1A 1AA' for broader results"
              icon={<MapPin className="h-4 w-4" />}
              delay={0.9}
            />
            <TipCard
              title="Search by Street"
              description="Enter street names like 'Downing Street' or 'Oxford Street'"
              icon={<Home className="h-4 w-4" />}
              delay={1.0}
            />
            <TipCard
              title="Use Town Names"
              description="Search for cities like 'Manchester' or 'Birmingham'"
              icon={<TrendingUp className="h-4 w-4" />}
              delay={1.1}
            />
            <TipCard
              title="Keyboard Shortcuts"
              description="Press ⌘K to focus search, Enter to search, Esc to clear"
              icon={<Clock className="h-4 w-4" />}
              delay={1.2}
            />
          </div>
        </motion.div>

        {/* Popular Areas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-800">Popular Areas to Explore</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularAreas.map((area, index) => (
              <SuggestionCard key={area} area={area} index={index} />
            ))}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center py-16"
    >
      {/* No Results State */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-lg"
      >
        <Home className="w-16 h-16 text-gray-500" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-3xl font-bold text-gray-800 mb-4"
      >
        No properties found for &quot;{postcode}&quot;
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-lg text-gray-600 max-w-2xl mx-auto mb-8"
      >
        We couldn&apos;t find any sold properties matching your search. Let&apos;s try some alternatives!
      </motion.p>

      {/* Why No Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gray-50 border border-gray-200 rounded-xl p-6 max-w-2xl mx-auto mb-8"
      >
        <h3 className="font-semibold text-gray-800 mb-4">🤔 Why no results?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
            <div>
              <div className="font-medium text-gray-800">Too specific</div>
              <div className="text-sm text-gray-600">Try a broader area or partial postcode</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
            <div>
              <div className="font-medium text-gray-800">No recent sales</div>
              <div className="text-sm text-gray-600">Properties might not have sold recently</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <div className="font-medium text-gray-800">Spelling difference</div>
              <div className="text-sm text-gray-600">Check the spelling of your search</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <div className="font-medium text-gray-800">New area</div>
              <div className="text-sm text-gray-600">Area might be too new or small</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="space-y-4 mb-8"
      >
        <button
          onClick={onTryDifferentSearch}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
        >
          Try a Different Search
        </button>
        
        <div className="text-sm text-gray-500">
          Or explore these popular areas:
        </div>
      </motion.div>

      {/* Popular Areas Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="max-w-4xl mx-auto"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {popularAreas.map((area, index) => (
            <SuggestionCard key={area} area={area} index={index} />
          ))}
        </div>
      </motion.div>

      {/* Additional Help */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-2xl mx-auto"
      >
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-800">Need help?</span>
        </div>
        <p className="text-sm text-blue-700">
          Try searching for a nearby town or city, or use just the first part of a postcode to see a wider area.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default EnhancedEmptyState; 