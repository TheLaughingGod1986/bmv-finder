'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from './SimpleCard';
import { Home, MapPin, Bed, Calendar, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface Comparable {
  address: string;
  postcode: string;
  price: number;
  date: string;
  propertyType: string;
  bedrooms?: number;
}

interface SubjectProperty {
  address?: string;
  fullAddress?: string;
  postcode?: string;
  propertyNumber?: string;
  propertyType?: string;
  bedrooms?: number;
}

interface Props {
  estimatedValue: number | null;
  confidence: 'high' | 'medium' | 'low';
  comparables: Comparable[];
  usedBedroomFilter: boolean;
  subject: SubjectProperty | null;
  loading?: boolean;
}

const confidenceColors = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-red-100 text-red-800',
};

const confidenceLabels = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const confidenceIcons = {
  high: <CheckCircle className="h-4 w-4" />,
  medium: <Info className="h-4 w-4" />,
  low: <AlertTriangle className="h-4 w-4" />,
};

function formatCurrency(amount: number | null) {
  if (amount === null) return 'N/A';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function EnhancedDealAnalysisCard({ estimatedValue, confidence, comparables, usedBedroomFilter, subject, loading = false }: Props) {

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Property Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-primary-700">
              <Home className="h-6 w-6" />
              {subject?.fullAddress || subject?.address || 'Property'}
            </CardTitle>
            {subject?.propertyNumber && (
              <div className="text-sm text-gray-600 mt-1">
                Property Number: {subject.propertyNumber}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge className={confidenceColors[confidence]}>
                {confidenceIcons[confidence]}
                <span className="ml-1">{confidenceLabels[confidence]} Confidence</span>
              </Badge>
              {usedBedroomFilter && <span className="text-xs text-gray-500">(Matched by bedrooms)</span>}
            </div>
            <div className="mt-2 text-3xl font-bold text-primary-700">
              {formatCurrency(estimatedValue)}
            </div>
                      <div className="text-sm text-gray-600 mt-1">
            {subject?.postcode} • {subject?.propertyType} • {subject?.bedrooms ? `${subject.bedrooms} bed` : ''}
          </div>
        </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Warning if low confidence or few comparables */}
        {(confidence === 'low' || comparables.length < 3) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              {confidence === 'low'
                ? 'Low confidence: Not enough similar sales found. Please interpret this estimate with caution.'
                : 'Fewer than 3 comparables found. Estimate may be less reliable.'}
            </span>
          </div>
        )}
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary-600" />
          Comparable Sales Used ({comparables.length})
        </h3>
        {comparables.length === 0 ? (
          <div className="text-gray-500 text-sm">No comparable sales found in this area.</div>
        ) : (
          <div className="space-y-3">
            {comparables.map((comp, idx) => (
              <div key={idx} className="border border-gray-100 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between bg-gray-50 hover:bg-gray-100 transition">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{comp.address}</div>
                  <div className="text-xs text-gray-600">{comp.postcode} • {comp.propertyType} {comp.bedrooms ? `• ${comp.bedrooms} bed` : ''}</div>
                </div>
                <div className="flex flex-col items-end mt-2 md:mt-0">
                  <div className="font-bold text-lg text-primary-700">{formatCurrency(comp.price)}</div>
                  <div className="text-xs text-gray-500">{formatDate(comp.date)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 