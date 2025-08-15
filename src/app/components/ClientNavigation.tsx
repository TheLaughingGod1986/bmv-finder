'use client';
import ClientOnly from './ClientOnly';
import Navigation from './Navigation';

export default function ClientNavigation() {
  return (
    <ClientOnly>
      <Navigation />
    </ClientOnly>
  );
} 