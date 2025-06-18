'use client';

import { BMVCalculation } from '@/types';
import { MapPin, Bed, TrendingUp, ExternalLink, Star, PoundSterling, Home, Sparkles } from 'lucide-react';

interface PropertyGridProps {
  properties: BMVCalculation[];
}

export default function PropertyGrid({ properties }: PropertyGridProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-gradient-to-r from-emerald-100 via-green-100 to-teal-100 text-emerald-800 border-emerald-200';
      case 'medium':
        return 'bg-gradient-to-r from-amber-100 via-yellow-100 to-orange-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-gradient-to-r from-rose-100 via-red-100 to-pink-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gradient-to-r from-slate-100 via-gray-100 to-zinc-100 text-slate-800 border-slate-200';
    }
  };

  const getBMVColor = (percentage: number) => {
    if (percentage >= 15) return 'text-emerald-600';
    if (percentage >= 10) return 'text-amber-600';
    if (percentage >= 5) return 'text-orange-600';
    return 'text-rose-600';
  };

  const getBMVBackground = (percentage: number) => {
    if (percentage >= 15) return 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500';
    if (percentage >= 10) return 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500';
    if (percentage >= 5) return 'bg-gradient-to-r from-orange-500 via-red-500 to-rose-500';
    return 'bg-gradient-to-r from-rose-500 via-red-500 to-pink-500';
  };

  const getPropertyTypeColor = (type: string) => {
    const colors = {
      'House': 'from-blue-500 to-cyan-500',
      'Flat': 'from-purple-500 to-pink-500',
      'Terraced': 'from-emerald-500 to-teal-500',
      'Semi-Detached': 'from-violet-500 to-indigo-500',
      'Detached': 'from-orange-500 to-red-500',
      'Studio': 'from-fuchsia-500 to-purple-500',
      'End of Terrace': 'from-cyan-500 to-blue-500'
    };
    return colors[type as keyof typeof colors] || 'from-gray-500 to-slate-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {properties.map((bmv, index) => (
        <div
          key={bmv.property.id}
          className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden hover-lift group animate-fade-in relative"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-200 to-purple-200 rounded-full opacity-30 -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-cyan-200 to-blue-200 rounded-full opacity-30 translate-y-8 -translate-x-8"></div>
          
          {/* Property Image */}
          <div className="relative h-56 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
            <img
              src={bmv.property.imageUrl}
              alt={bmv.property.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            
            {/* Confidence Badge */}
            <div className="absolute top-4 left-4 z-10">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-lg ${getConfidenceColor(bmv.confidence)}`}>
                {bmv.confidence.toUpperCase()} Confidence
              </span>
            </div>
            
            {/* Price Badge */}
            <div className="absolute top-4 right-4 z-10">
              <span className="bg-black/90 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-sm font-bold shadow-lg">
                {formatPrice(bmv.property.price)}
              </span>
            </div>

            {/* BMV Badge */}
            <div className="absolute bottom-4 left-4 z-10">
              <div className={`${getBMVBackground(bmv.bmvPercentage)} text-white px-3 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center`}>
                <Sparkles className="h-3 w-3 mr-1" />
                +{bmv.bmvPercentage}% BMV
              </div>
            </div>

            {/* Property Type Badge */}
            <div className="absolute bottom-4 right-4 z-10">
              <div className={`bg-gradient-to-r ${getPropertyTypeColor(bmv.property.propertyType)} text-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg`}>
                {bmv.property.propertyType}
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="p-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-xl text-gray-900 line-clamp-2 group-hover:text-violet-600 transition-colors">
                {bmv.property.title}
              </h3>
              <a
                href={bmv.property.listingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-600 hover:text-fuchsia-600 ml-3 flex-shrink-0 p-2 hover:bg-violet-50 rounded-lg transition-colors"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>

            <div className="flex items-center text-gray-600 mb-3">
              <MapPin className="h-5 w-5 mr-2 text-violet-500" />
              <span className="text-sm font-medium">{bmv.property.address}</span>
            </div>

            <div className="flex items-center text-gray-600 mb-6">
              <Bed className="h-5 w-5 mr-2 text-fuchsia-500" />
              <span className="text-sm font-medium">{bmv.property.bedrooms} bed • {bmv.property.propertyType}</span>
            </div>

            {/* BMV Analysis */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 rounded-xl border border-emerald-200">
                <span className="text-sm font-medium text-gray-700">BMV Amount:</span>
                <span className="font-bold text-lg text-emerald-600">
                  +{formatPrice(bmv.bmvAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 rounded-xl border border-cyan-200">
                <span className="text-sm font-medium text-gray-700">Rental Yield:</span>
                <span className="font-bold text-lg text-cyan-600">
                  {bmv.rentalYield}%
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 rounded-xl border border-violet-200">
                <span className="text-sm font-medium text-gray-700">Est. Monthly Rent:</span>
                <span className="font-bold text-lg text-violet-600">
                  {formatPrice(bmv.estimatedRent)}
                </span>
              </div>
            </div>

            {/* Market Comparison */}
            <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Avg. Sold Price:</span>
                <span className="font-bold text-gray-900">
                  {formatPrice(bmv.averageSoldPrice)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button className="flex-1 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white py-3 px-4 rounded-xl text-sm font-bold hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                View Details
              </button>
              <button className="flex-1 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white py-3 px-4 rounded-xl text-sm font-bold hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                Save Deal
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 