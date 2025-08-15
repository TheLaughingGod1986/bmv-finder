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
export function DynamicFullScreenChart(props: any) {
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

export function DynamicGroupedSoldPricesTable(props: any) {
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

export function DynamicHpiDataCard(props: any) {
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