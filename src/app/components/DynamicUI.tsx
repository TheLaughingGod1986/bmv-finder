'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamic imports for heavy UI components
const FullScreenChart = dynamic(() => import('./FullScreenChart'), {
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),
  ssr: false,
});

const GroupedSoldPricesTable = dynamic(() => import('./GroupedSoldPricesTable'), {
  loading: () => (
    <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>
  ),
  ssr: false,
});

const HpiDataCard = dynamic(() => import('./HpiDataCard'), {
  loading: () => (
    <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>
  ),
  ssr: false,
});

// Export components with Suspense wrappers
export function DynamicFullScreenChart(props: { children: React.ReactNode; [key: string]: unknown }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <FullScreenChart {...props} />
    </Suspense>
  );
}

export function DynamicGroupedSoldPricesTable(props: {
  soldPrices: Array<{ 
    id: string; 
    postcode: string; 
    price: number; 
    date_of_transfer: string;
    [key: string]: unknown 
  }>;
  onRowClick: (property: { id: string; [key: string]: unknown }) => void;
  sortConfig: { key: string; direction: 'ascending' | 'descending' };
  onSort: (key: string) => void;
  isLoading: boolean;
  selectedRowId: string | null;
  className?: string;
  postcode?: string;
  pagination: { page: number; size: number; has_more: boolean; after_key?: string };
  onPageChange: (page: number, after?: string) => void;
  [key: string]: unknown;
}) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    }>
      <GroupedSoldPricesTable {...props} />
    </Suspense>
  );
}

export function DynamicHpiDataCard(props: { postcode: string; [key: string]: unknown }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    }>
      <HpiDataCard {...props} />
    </Suspense>
  );
} 