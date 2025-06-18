'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { BMVCalculation } from '@/types';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  properties: BMVCalculation[];
  onPropertySelect: (property: BMVCalculation) => void;
}

export default function MapComponent({ properties, onPropertySelect }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getBMVColor = (percentage: number) => {
    if (percentage >= 15) return '#10B981'; // green
    if (percentage >= 10) return '#F59E0B'; // yellow
    if (percentage >= 5) return '#F97316'; // orange
    return '#EF4444'; // red
  };

  const createCustomIcon = (bmvPercentage: number) => {
    const color = getBMVColor(bmvPercentage);
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 10px;
        ">
          £
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  useEffect(() => {
    if (mapRef.current && properties.length > 0) {
      const bounds = L.latLngBounds(
        properties.map(p => [p.property.coordinates.lat, p.property.coordinates.lng])
      );
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [properties]);

  if (properties.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">No properties to display on map</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={[51.5074, -0.1278]} // London default
      zoom={10}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {properties.map((bmv) => (
        <Marker
          key={bmv.property.id}
          position={[bmv.property.coordinates.lat, bmv.property.coordinates.lng]}
          icon={createCustomIcon(bmv.bmvPercentage)}
          eventHandlers={{
            click: () => onPropertySelect(bmv),
          }}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-sm mb-2">{bmv.property.title}</h3>
              <p className="text-xs text-gray-600 mb-2">{bmv.property.address}</p>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-semibold">{formatPrice(bmv.property.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span>BMV:</span>
                  <span className="font-semibold text-green-600">
                    +{bmv.bmvPercentage}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Yield:</span>
                  <span className="font-semibold text-blue-600">
                    {bmv.rentalYield}%
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => onPropertySelect(bmv)}
                className="mt-2 w-full bg-blue-600 text-white py-1 px-2 rounded text-xs hover:bg-blue-700"
              >
                View Details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
} 