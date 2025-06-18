'use client';

import { useState } from 'react';
import { Search, MapPin, AlertCircle, Sparkles, TrendingUp, Home, Zap } from 'lucide-react';

interface PostcodeScannerProps {
  onScanStart: () => void;
  onScanComplete: (results: any) => void;
  onScanError: (errorMessage: string) => void;
  onScanFinish: () => void;
  isScanning?: boolean;
}

export default function PostcodeScanner({ onScanStart, onScanComplete, onScanError, onScanFinish, isScanning = false }: PostcodeScannerProps) {
  const [postcode, setPostcode] = useState('');
  const [radius, setRadius] = useState(1); // Default 1 mile radius
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);

  const validatePostcode = (code: string) => {
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
    return postcodeRegex.test(code);
  };

  const handlePostcodeChange = (value: string) => {
    setPostcode(value.toUpperCase());
    setError('');
    
    if (value.length > 0) {
      const valid = validatePostcode(value);
      setIsValid(valid);
      if (!valid) {
        setError('Please enter a valid UK postcode');
      }
    } else {
      setIsValid(false);
    }
  };

  const handleScan = async () => {
    if (!isValid || isScanning) return;

    onScanStart();
    setError('');

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          postcode,
          config: {
            radius: radius
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan properties');
      }

      onScanComplete(data);
      onScanFinish();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onScanError(errorMessage);
      onScanFinish();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid && !isScanning) {
      handleScan();
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 p-8 md:p-10 hover-lift relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-200 to-purple-200 rounded-full opacity-30 -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-cyan-200 to-blue-200 rounded-full opacity-30 translate-y-12 -translate-x-12"></div>
      
      <div className="text-center mb-8 relative z-10">
        <div className="mx-auto h-24 w-24 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl animate-bounce-in">
          <MapPin className="h-12 w-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-3">
          Find BMV Properties
        </h2>
        <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
          Enter a UK postcode to scan for below market value opportunities
        </p>
      </div>

      <div className="max-w-md mx-auto relative z-10 space-y-6">
        {/* Postcode Input */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MapPin className="h-6 w-6 text-violet-500 group-focus-within:text-fuchsia-600 transition-colors duration-200" />
          </div>
          <input
            type="text"
            value={postcode}
            onChange={(e) => handlePostcodeChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., SW1A 1AA"
            className={`block w-full pl-12 pr-4 py-4 border-2 rounded-xl text-lg font-medium transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-violet-500/20 ${
              error
                ? 'border-red-300 focus:border-red-500 bg-red-50'
                : isValid
                ? 'border-emerald-300 focus:border-emerald-500 bg-emerald-50'
                : 'border-gray-300 focus:border-violet-500 bg-white hover:border-violet-400'
            }`}
            disabled={isScanning}
          />
          {isValid && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <div className="h-6 w-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Radius Selector */}
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200/50">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Search Radius
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 3, 5].map((mileRadius) => (
              <button
                key={mileRadius}
                onClick={() => setRadius(mileRadius)}
                disabled={isScanning}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  radius === mileRadius
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-violet-300'
                }`}
              >
                {mileRadius} mile{mileRadius > 1 ? 's' : ''}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Larger radius = more properties but may include less relevant areas
          </p>
        </div>

        {error && (
          <div className="flex items-center text-red-600 text-sm bg-gradient-to-r from-red-50 to-pink-50 px-4 py-3 rounded-lg border border-red-200 animate-fade-in">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={!isValid || isScanning}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center group relative overflow-hidden ${
            isValid && !isScanning
              ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {/* Button Background Animation */}
          {isValid && !isScanning && (
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          )}
          
          <span className="relative z-10 flex items-center">
            {isScanning ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Scanning Properties...
              </>
            ) : (
              <>
                <Zap className="h-6 w-6 mr-3 group-hover:animate-pulse" />
                Scan for Deals
              </>
            )}
          </span>
        </button>

        {isScanning && (
          <div className="text-center animate-fade-in">
            <p className="text-sm text-gray-600 mb-3">
              Analyzing market data and calculating BMV opportunities...
            </p>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-fuchsia-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Features */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200/50 hover-lift group">
          <div className="h-14 w-14 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
            <Search className="h-7 w-7 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2 text-center">Live Scraping</h3>
          <p className="text-sm text-gray-600 text-center">Real-time data from Rightmove, Zoopla & more</p>
        </div>
        
        <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200/50 hover-lift group">
          <div className="h-14 w-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
            <TrendingUp className="h-7 w-7 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2 text-center">BMV Analysis</h3>
          <p className="text-sm text-gray-600 text-center">Compare against recent sold prices</p>
        </div>
        
        <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-200/50 hover-lift group">
          <div className="h-14 w-14 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2 text-center">Rental Yield</h3>
          <p className="text-sm text-gray-600 text-center">Calculate potential rental returns</p>
        </div>
      </div>
    </div>
  );
} 