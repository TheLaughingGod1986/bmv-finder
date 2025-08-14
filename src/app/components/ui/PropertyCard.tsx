import { Home, MapPin, Calendar, PoundSterling, TrendingUp, TrendingDown } from 'lucide-react';
import { formatPrice, formatDate, formatPercentage } from '@/lib/formatters';

interface PropertyCardProps {
  property: {
    id: string;
    address: string;
    postcode: string;
    price: number;
    dateOfTransfer: string;
    propertyType?: string;
    bmvScore?: number | null;
    bedrooms?: number | null;
    floorArea?: number | null;
    epcRating?: string | null;
    growth?: number | null;
    growthPercentage?: number | null;
  };
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  className?: string;
}

export default function PropertyCard({
  property,
  variant = 'default',
  showActions = false,
  onEdit,
  onDelete,
  onView,
  className = ''
}: PropertyCardProps) {
  const isCompact = variant === 'compact';
  const isDetailed = variant === 'detailed';

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className={`font-semibold text-gray-900 ${isCompact ? 'text-sm' : 'text-base'}`}>
              {property.address}
            </h3>
            <p className="text-gray-500 text-sm flex items-center mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              {property.postcode}
            </p>
          </div>
          
          {/* BMV Score Badge */}
          {property.bmvScore && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              property.bmvScore >= 80 ? 'bg-green-100 text-green-800' :
              property.bmvScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {property.bmvScore}% BMV
            </div>
          )}
        </div>

        {/* Price and Growth */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <PoundSterling className="w-4 h-4 text-gray-400 mr-1" />
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(property.price)}
            </span>
          </div>
          
          {property.growth && (
            <div className={`flex items-center text-sm ${
              property.growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {property.growth >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {formatPercentage(Math.abs(property.growthPercentage || 0))}
            </div>
          )}
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{formatDate(property.dateOfTransfer)}</span>
          </div>
          
          {property.propertyType && (
            <div className="flex items-center">
              <Home className="w-4 h-4 mr-2" />
              <span>{property.propertyType}</span>
            </div>
          )}
          
          {property.bedrooms && (
            <div className="flex items-center">
              <span className="mr-2">🛏️</span>
              <span>{property.bedrooms} bed</span>
            </div>
          )}
          
          {property.floorArea && (
            <div className="flex items-center">
              <span className="mr-2">📏</span>
              <span>{property.floorArea}m²</span>
            </div>
          )}
        </div>

        {/* EPC Rating */}
        {property.epcRating && (
          <div className="mb-3">
            <span className="text-xs text-gray-500">EPC Rating: </span>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              property.epcRating === 'A' ? 'bg-green-100 text-green-800' :
              property.epcRating === 'B' ? 'bg-blue-100 text-blue-800' :
              property.epcRating === 'C' ? 'bg-yellow-100 text-yellow-800' :
              property.epcRating === 'D' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {property.epcRating}
            </span>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
            {onView && (
              <button
                onClick={onView}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              >
                View
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact property card for lists
 */
export function CompactPropertyCard({ property, ...props }: PropertyCardProps) {
  return <PropertyCard property={property} variant="compact" {...props} />;
}

/**
 * Detailed property card with full information
 */
export function DetailedPropertyCard({ property, ...props }: PropertyCardProps) {
  return <PropertyCard property={property} variant="detailed" {...props} />;
}
