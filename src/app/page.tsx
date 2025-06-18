'use client';

import { useState } from 'react';
import { Search, MapPin, TrendingUp, Home, Building2 } from 'lucide-react';
import PostcodeScanner from '@/components/PostcodeScanner';
import PropertyGrid from '@/components/PropertyGrid';
import MapView from '@/components/MapView';
import StatsPanel from '@/components/StatsPanel';
import { BMVCalculation } from '@/types';

export default function DealScannerPage() {
  const [scanResults, setScanResults] = useState<BMVCalculation[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [scanStats, setScanStats] = useState<any>(null);

  const handleScanComplete = (results: any) => {
    setScanResults(results.properties || []);
    setScanStats(results);
    setIsScanning(false);
  };

  const handleScanStart = () => {
    setIsScanning(true);
    setScanResults([]);
    setScanStats(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-cyan-50 to-emerald-100 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
      
      {/* Floating Color Orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-3 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200 hover:shadow-2xl">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                  DealScanner
                </h1>
                <p className="text-sm text-gray-600 font-medium">Find Below Market Value Properties</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 bg-gradient-to-r from-emerald-100 to-teal-100 px-4 py-2 rounded-full border border-emerald-200">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-emerald-700">Live Market Data</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Postcode Scanner */}
        <div className="mb-8 animate-fade-in">
          <PostcodeScanner 
            onScanStart={handleScanStart}
            onScanComplete={handleScanComplete}
            isScanning={isScanning}
          />
        </div>

        {/* Results Section */}
        {scanResults.length > 0 && (
          <div className="animate-slide-up">
            {/* Stats Panel */}
            <div className="mb-6">
              <StatsPanel stats={scanStats} />
            </div>

            {/* View Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                Found {scanResults.length} Properties
              </h2>
              
              <div className="flex bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Grid View
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center ${
                    viewMode === 'map'
                      ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Map View
                </button>
              </div>
            </div>

            {/* Results Display */}
            <div className="animate-fade-in">
              {viewMode === 'grid' ? (
                <PropertyGrid properties={scanResults} />
              ) : (
                <MapView properties={scanResults} />
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isScanning && scanResults.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="mx-auto h-24 w-24 bg-gradient-to-br from-violet-200 via-purple-200 to-fuchsia-200 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <Search className="h-12 w-12 text-violet-600" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-3">
              Ready to Find BMV Properties?
            </h3>
            <p className="text-gray-600 max-w-md mx-auto text-lg leading-relaxed">
              Enter a UK postcode above to start scanning for below market value opportunities. 
              We'll analyze recent sold prices and rental yields to find the best deals.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
