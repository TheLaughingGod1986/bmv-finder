'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Target, 
  Calculator, 
  BarChart3, 
  Search, 
  PieChart,
  ChevronDown,
  Building2,
  TrendingUp,
  PoundSterling,
  Eye,
  FileText,
  MapPin,
  Calculator as CalcIcon,
  ChartBar,
  Search as SearchIcon,
  Watch,
  Settings,
  User,
  Bookmark
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface UpdateStats {
  propertiesCount: number;
  recentSalesCount: number;
  hpiCount: number;
  epcCount: number;
  watchlistCount: number;
}

const navItems = [
  { name: 'Home', href: '/', icon: Home, description: 'Property Intelligence' },
  { 
    name: 'Analysis', 
    icon: Target, 
    description: 'Property analysis & insights',
    hasDropdown: true,
    dropdownItems: [
      {
        title: 'Deal Analysis',
        description: 'BMV & investment analysis',
        href: '/analysis/deal-analysis',
        icon: Target
      },
      {
        title: 'Property Analyzer',
        description: 'Investment analysis & insights',
        href: '/analysis/property-analyzer',
        icon: Eye
      },
      {
        title: 'Valuation',
        description: 'What should I pay?',
        href: '/analysis/valuation',
        icon: PoundSterling
      },
      {
        title: 'Comprehensive Valuation',
        description: 'Detailed property valuation',
        href: '/analysis/comprehensive',
        icon: Building2
      },
      {
        title: 'Portfolio Tracker',
        description: 'Track your investments',
        href: '/tools/portfolio',
        icon: PieChart
      }
    ]
  },
  { 
    name: 'Tools', 
    icon: Calculator, 
    description: 'Investment calculators & tools',
    hasDropdown: true,
    dropdownItems: [
      {
        title: 'Investment Calculator',
        description: 'ROI, yield & portfolio',
        href: '/tools/calculator',
        icon: CalcIcon
      },
      {
        title: 'BTL Calculator',
        description: 'Buy-to-let analysis',
        href: '/btl-calculator',
        icon: CalcIcon
      },
      {
        title: 'Portfolio Tracker',
        description: 'Track your investments',
        href: '/tools/portfolio',
        icon: PieChart
      }
    ]
  },
  { 
    name: 'Market Data', 
    icon: BarChart3, 
    description: 'Market insights & trends',
    hasDropdown: true,
    dropdownItems: [
      {
        title: 'Market Analysis',
        description: 'Regional insights & trends',
        href: '/market/analysis',
        icon: ChartBar
      },
      {
        title: 'HPI Dashboard',
        description: 'House price trends',
        href: '/market/hpi',
        icon: TrendingUp
      },
      {
        title: 'HPI Search',
        description: 'Search by postcode & region',
        href: '/market/hpi-search',
        icon: SearchIcon
      },
      {
        title: 'HPI Regions',
        description: 'Regional house price data',
        href: '/market/hpi',
        icon: MapPin
      },
      {
        title: 'Postcode Research',
        description: 'Area analysis & data',
        href: '/market/postcodes',
        icon: MapPin
      },
      {
        title: 'ONS Data',
        description: 'Official statistics',
        href: '/market/ons',
        icon: FileText
      }
    ]
  },
  { 
    name: 'Search', 
    icon: Search, 
    description: 'Find & analyze properties',
    hasDropdown: true,
    dropdownItems: [
      {
        title: 'Property Search',
        description: 'Find properties & analyze',
        href: '/search/properties',
        icon: SearchIcon
      },
      {
        title: 'Property Analyzer',
        description: 'Watchlist & investment analysis',
        href: '/analysis/property-analyzer',
        icon: Eye
      },
      {
        title: 'Recent Sales',
        description: 'Latest property sales',
        href: '/search/sales',
        icon: Watch
      },
      {
        title: 'Saved Searches',
        description: 'Your saved search criteria',
        href: '/search/saved',
        icon: Settings
      }
    ]
  }
];

export default function Navigation() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [stats, setStats] = useState<UpdateStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchUpdateStats();
  }, []);

  const fetchUpdateStats = async () => {
    try {
      const response = await fetch('/api/last-updated');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Failed to fetch update stats');
      }
    } catch (err) {
      setError('Error fetching update stats');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formattedDate = stats ? formatDate(stats.lastUpdated) : '';

  const handleDropdownEnter = (name: string) => {
    setActiveDropdown(name);
  };

  const handleDropdownLeave = () => {
    setActiveDropdown(null);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200/60 sticky top-0 z-50">
      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">Property Intelligence</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            {navItems.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => item.hasDropdown && handleDropdownEnter(item.name)}
                onMouseLeave={() => item.hasDropdown && handleDropdownLeave()}
              >
                <a
                  href={item.href || '#'}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.hasDropdown 
                      ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                  {item.hasDropdown && (
                    <ChevronDown className="ml-1 h-3 w-3 transition-transform group-hover:rotate-180" />
                  )}
                </a>

                {/* Mega Menu Dropdown */}
                {item.hasDropdown && activeDropdown === item.name && (
                  <div className="absolute top-full left-0 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    </div>
                    <div className="py-2">
                      {item.dropdownItems?.map((dropdownItem) => (
                        <a
                          key={dropdownItem.title}
                          href={dropdownItem.href}
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                        >
                          <dropdownItem.icon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                          <div>
                            <div className="font-medium">{dropdownItem.title}</div>
                            <div className="text-xs text-gray-500">{dropdownItem.description}</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Auth Button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
              className="hidden sm:flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <User className="mr-2 h-4 w-4" />
              Sign In / Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href || '#'}
                className="flex-shrink-0 flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-white rounded-md border border-gray-200 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <item.icon className="mr-1 h-3 w-3" />
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Data Update Status Bar */}
      <div className="w-full bg-gray-50/80 backdrop-blur-sm text-gray-600 text-xs py-2 px-4 border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
          {error && <span className="text-red-600">Data update status unavailable: {error}</span>}
          {!stats && !error && <span>Loading data update status...</span>}
          {stats && (
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span>{stats.propertiesCount.toLocaleString()} Properties</span>
              </div>
              <div className="flex items-center space-x-2">
                <PoundSterling className="h-4 w-4 text-green-600" />
                <span>{stats.recentSalesCount.toLocaleString()} Sales</span>
              </div>
              <div className="flex items-center space-x-2">
                <PieChart className="h-4 w-4 text-purple-600" />
                <span>{stats.hpiCount.toLocaleString()} HPI Records</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-orange-600" />
                <span>{stats.epcCount.toLocaleString()} EPC Records</span>
              </div>
              <div className="flex items-center space-x-2">
                <Bookmark className="h-4 w-4 text-red-600" />
                <span>{stats.watchlistCount.toLocaleString()} Watchlist</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}