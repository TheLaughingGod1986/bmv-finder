'use client';

import { useState, useEffect } from 'react';
import { Home, TrendingUp, Search, MapPin, Sparkles, Clock, BarChart3, Calculator, BookOpen, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useUser } from '@supabase/auth-helpers-react';
import { useUserTier } from '@/hooks/useUserTier';
import UpgradePrompt from './UpgradePrompt';
import { apiClient } from '@/lib/apiClient';
import Button from './Button';

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
    { area: 'SW1A 1AA', description: 'Westminster, London', icon: <Home className="w-4 h-4" /> },
    { area: 'M1 1AA', description: 'Manchester City Centre', icon: <TrendingUp className="w-4 h-4" /> },
    { area: 'B1 1AA', description: 'Birmingham City Centre', icon: <Home className="w-4 h-4" /> },
    { area: 'L1 1AA', description: 'Liverpool City Centre', icon: <TrendingUp className="w-4 h-4" /> },
    { area: 'E1 1AA', description: 'East London', icon: <Home className="w-4 h-4" /> },
    { area: 'W11 1AA', description: 'Notting Hill, London', icon: <TrendingUp className="w-4 h-4" /> },
  ]);

  const user = useUser();
  const { tier, loading: tierLoading } = useUserTier(user?.id);
  const [lookupCount, setLookupCount] = useState<number>(0);

  useEffect(() => {
    if (!user?.id) return;
    apiClient.getUserProfile(user.id)
      .then(response => {
        if (!response.error && response.data && typeof response.data === 'object' && 'lookup_count' in response.data) {
          setLookupCount((response.data as any).lookup_count || 0);
        }
      });
  }, [user]);

  useEffect(() => {
    async function fetchPopularAreas() {
      try {
        const response = await apiClient.suggestPostcodes(' ');
        if (!response.error && response.data && typeof response.data === 'object' && 'suggestions' in response.data && Array.isArray((response.data as any).suggestions) && (response.data as any).suggestions.length > 0) {
          setPopularAreas(
            (response.data as any).suggestions.slice(0, 6).map((postcode: string) => ({
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

  if (tier === 'free' && lookupCount >= 3) {
    return <UpgradePrompt />;
  }

  const SuggestionCard = ({ area, index }: { area: { area: string; description: string; icon: React.ReactNode }; index: number }) => (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => onSearchSuggestion(area.area)}
      className="group flex items-center gap-3 p-5 bg-beige rounded-2xl border-2 border-taupe hover:border-gold hover:shadow-lg transition-all duration-200 hover:scale-105"
    >
      <div className="text-primary group-hover:text-gold transition-colors">
        {area.icon}
      </div>
      <div className="text-left">
        <div className="font-semibold text-primary group-hover:text-gold transition-colors">
          {area.area}
        </div>
        <div className="text-sm text-taupe">
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
      className="flex items-start gap-3 p-5 bg-softgrey rounded-2xl border-2 border-taupe"
    >
      <div className="text-gold mt-0.5">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-primary mb-1">{title}</h4>
        <p className="text-sm text-taupe leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-beige rounded-3xl shadow-xl border border-taupe p-10">
      {/* Main Empty State */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-light to-primary rounded-full flex items-center justify-center border-2 border-gold shadow">
          <Search className="w-12 h-12 text-gold" />
        </div>
        
        <h2 className="text-2xl font-bold text-primary mb-3">
          No properties found for &quot;{postcode}&quot;
        </h2>
        
        <p className="text-taupe mb-6 max-w-2xl mx-auto leading-relaxed">
          We couldn&apos;t find any property sales data for this area. This could be because:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-3xl mx-auto">
          <TipCard
            title="New or Small Area"
            description="The postcode might be very new or cover a small area with no recent sales."
            icon={<AlertTriangle className="w-5 h-5" />}
            delay={0.2}
          />
          <TipCard
            title="Try Different Search"
            description="Try searching for a broader area or nearby postcode to see more results."
            icon={<Sparkles className="w-5 h-5" />}
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
        className="mb-10"
      >
        <h3 className="text-xl font-bold text-primary mb-4 text-center">
          Try These Popular Areas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        className="flex flex-col sm:flex-row gap-6 justify-center items-center"
      >
        <Button
          onClick={onTryDifferentSearch}
          className="px-7 py-3 bg-primary text-beige rounded-2xl font-bold hover:bg-primary-light border-2 border-gold lux-accent-gold shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
        >
          Try Different Search
        </Button>
        
        <Button
          onClick={() => onSearchSuggestion('SW1')}
          className="px-7 py-3 bg-taupe text-primary rounded-2xl font-bold hover:bg-gold hover:text-beige border-2 border-silver lux-accent-silver shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-silver focus:ring-offset-2"
        >
          Browse London Areas
        </Button>
      </motion.div>

      {/* Additional Help */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200"
      >
        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-600" />
          Search Tips
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
          <div>
            <strong>Try partial postcodes:</strong>
            <ul className="mt-1 space-y-1">
              <li>• &quot;SW1&quot; for all SW1 areas</li>
              <li>• &quot;M1&quot; for Manchester city centre</li>
              <li>• &quot;B1&quot; for Birmingham city centre</li>
            </ul>
          </div>
          <div>
            <strong>Search by location:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Street names (e.g., &quot;Oxford Street&quot;)</li>
              <li>• Town names (e.g., &quot;Manchester&quot;)</li>
              <li>• Area names (e.g., &quot;Notting Hill&quot;)</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedEmptyState; 