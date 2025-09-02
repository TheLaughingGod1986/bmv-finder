'use client';

import { useState } from 'react';
import { 
  MapPinIcon, 
  CurrencyPoundIcon, 
  HomeIcon,
  CalendarIcon,
  ChevronRightIcon,
  HeartIcon,
  ShareIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface Property {
  id: string;
  address: string;
  postcode: string;
  price: number;
  bedrooms?: number;
  propertyType: string;
  dateOfTransfer: string;
  bmvScore?: number;
  estimatedValue?: number;
  images?: string[];
  description?: string;
}

interface MobilePropertyCardProps {
  property: Property;
  onViewDetails?: (property: Property) => void;
  onAddToFavorites?: (property: Property) => void;
  onShare?: (property: Property) => void;
  isFavorite?: boolean;
  className?: string;
}

export default function MobilePropertyCard({
  property,
  onViewDetails,
  onAddToFavorites,
  onShare,
  isFavorite = false,
  className = ""
}: MobilePropertyCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(isFavorite);

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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBMVColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBMVLabel = (score?: number) => {
    if (!score) return 'N/A';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Fair';
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    onAddToFavorites?.(property);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(property);
  };

  const handleCardClick = () => {
    onViewDetails?.(property);
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 ${className}`}
      onClick={handleCardClick}
    >
      {/* Property Image */}
      <div className="relative h-48 bg-gray-100">
        {property.images && property.images.length > 0 && !imageError ? (
          <img
            src={property.images[0]}
            alt={property.address}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
            <HomeIcon className="w-12 h-12 text-blue-400" />
          </div>
        )}

        {/* BMV Score Badge */}
        {property.bmvScore && (
          <div className="absolute top-3 left-3">
            <div className={`px-2 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm ${getBMVColor(property.bmvScore)}`}>
              BMV: {property.bmvScore}%
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex space-x-2">
          <button
            onClick={handleLike}
            className="p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
          >
            {isLiked ? (
              <HeartSolidIcon className="w-4 h-4 text-red-500" />
            ) : (
              <HeartIcon className="w-4 h-4 text-gray-600" />
            )}
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
          >
            <ShareIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Property Type Badge */}
        <div className="absolute bottom-3 left-3">
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
            {property.propertyType}
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="p-4">
        {/* Address */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1">
            {property.address}
          </h3>
          <div className="flex items-center text-gray-500 text-sm">
            <MapPinIcon className="w-4 h-4 mr-1" />
            {property.postcode}
          </div>
        </div>

        {/* Price and Key Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-lg font-bold text-gray-900">
              <CurrencyPoundIcon className="w-5 h-5 mr-1" />
              {formatPrice(property.price)}
            </div>
            {property.bedrooms && (
              <div className="text-sm text-gray-500">
                {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Sale Date */}
          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon className="w-4 h-4 mr-1" />
            Sold {formatDate(property.dateOfTransfer)}
          </div>

          {/* Estimated Value vs Sale Price */}
          {property.estimatedValue && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Est. Value:</span>
              <span className="font-medium text-gray-900">
                {formatPrice(property.estimatedValue)}
              </span>
            </div>
          )}
        </div>

        {/* BMV Analysis */}
        {property.bmvScore && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">BMV Analysis</span>
              <span className={`text-sm font-semibold ${getBMVColor(property.bmvScore)}`}>
                {getBMVLabel(property.bmvScore)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  property.bmvScore >= 80 ? 'bg-green-500' :
                  property.bmvScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${property.bmvScore}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-500">
            <EyeIcon className="w-4 h-4 mr-1" />
            <span>View Details</span>
          </div>
          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
