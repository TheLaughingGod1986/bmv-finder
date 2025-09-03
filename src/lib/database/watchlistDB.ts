// Shared watchlist database for both main API and Chrome extension API
// Note: In production, this would use a real database like PostgreSQL

export interface WatchlistProperty {
  id: string;
  userId: string;
  propertyId: string;
  title: string;
  address: string;
  postcode: string;
  price: number;
  priceFormatted: string;
  bedrooms?: number;
  bathrooms?: number;
  propertyType: string;
  listingType: 'sale' | 'rent';
  imageUrl?: string;
  description?: string;
  sourceUrl: string;
  source: 'chrome-extension' | 'manual' | 'api';
  bmvScore?: number;
  marketValue?: number;
  potentialProfit?: number;
  addedAt: Date;
  lastUpdated: Date;
  notes?: string;
  tags: string[];
  isActive: boolean;
  metadata?: {
    originalPrice?: number;
    priceHistory?: Array<{ price: number; date: Date; source: string }>;
    viewCount?: number;
    lastViewed?: Date;
    alerts?: Array<{ type: string; value: number; triggered: boolean }>;
    website?: string;
    listingDate?: string;
    agent?: string;
    capturedAt?: string;
    pageTitle?: string;
    pageDescription?: string;
  };
}

// Shared database instance
export const watchlistDB = new Map<string, WatchlistProperty>();

// Helper functions
export function getPropertiesByUserId(userId: string): WatchlistProperty[] {
  return Array.from(watchlistDB.values()).filter(prop => prop.userId === userId);
}

export function getPropertyById(id: string): WatchlistProperty | undefined {
  return watchlistDB.get(id);
}

export function saveProperty(property: WatchlistProperty): void {
  watchlistDB.set(property.id, property);
}

export function deleteProperty(id: string): boolean {
  return watchlistDB.delete(id);
}

export function getPropertiesBySource(userId: string, source: 'chrome-extension' | 'manual' | 'api'): WatchlistProperty[] {
  return Array.from(watchlistDB.values())
    .filter(prop => prop.userId === userId && prop.source === source);
}
