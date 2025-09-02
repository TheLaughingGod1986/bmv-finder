// Offline storage utilities for PWA
interface OfflineData {
  timestamp: number;
  data: any;
  version: string;
}

interface OfflineSearch {
  id: string;
  query: string;
  results: any[];
  timestamp: number;
  postcode: string;
}

interface OfflineProperty {
  id: string;
  data: any;
  timestamp: number;
  isFavorite: boolean;
}

class OfflineStorage {
  private readonly STORAGE_KEYS = {
    SEARCHES: 'bmv_offline_searches',
    PROPERTIES: 'bmv_offline_properties',
    PORTFOLIO: 'bmv_offline_portfolio',
    SETTINGS: 'bmv_offline_settings',
    CACHE_VERSION: 'bmv_cache_version'
  };

  private readonly CACHE_VERSION = '1.0.0';
  private readonly MAX_SEARCHES = 50;
  private readonly MAX_PROPERTIES = 200;

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage() {
    // Check cache version and clear if outdated
    const storedVersion = localStorage.getItem(this.STORAGE_KEYS.CACHE_VERSION);
    if (storedVersion !== this.CACHE_VERSION) {
      this.clearAllData();
      localStorage.setItem(this.STORAGE_KEYS.CACHE_VERSION, this.CACHE_VERSION);
    }
  }

  // Search storage
  saveSearch(query: string, postcode: string, results: any[]): void {
    try {
      const searches = this.getSearches();
      const newSearch: OfflineSearch = {
        id: this.generateId(),
        query,
        results,
        timestamp: Date.now(),
        postcode
      };

      // Add new search and limit to MAX_SEARCHES
      searches.unshift(newSearch);
      const limitedSearches = searches.slice(0, this.MAX_SEARCHES);

      localStorage.setItem(
        this.STORAGE_KEYS.SEARCHES,
        JSON.stringify(limitedSearches)
      );
    } catch (error) {
      console.error('Failed to save search offline:', error);
    }
  }

  getSearches(): OfflineSearch[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.SEARCHES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get offline searches:', error);
      return [];
    }
  }

  getSearchById(id: string): OfflineSearch | null {
    const searches = this.getSearches();
    return searches.find(search => search.id === id) || null;
  }

  getRecentSearches(limit: number = 10): OfflineSearch[] {
    const searches = this.getSearches();
    return searches.slice(0, limit);
  }

  // Property storage
  saveProperty(propertyId: string, data: any, isFavorite: boolean = false): void {
    try {
      const properties = this.getProperties();
      const existingIndex = properties.findIndex(p => p.id === propertyId);

      const propertyData: OfflineProperty = {
        id: propertyId,
        data,
        timestamp: Date.now(),
        isFavorite
      };

      if (existingIndex >= 0) {
        properties[existingIndex] = propertyData;
      } else {
        properties.unshift(propertyData);
        // Limit to MAX_PROPERTIES
        if (properties.length > this.MAX_PROPERTIES) {
          properties.splice(this.MAX_PROPERTIES);
        }
      }

      localStorage.setItem(
        this.STORAGE_KEYS.PROPERTIES,
        JSON.stringify(properties)
      );
    } catch (error) {
      console.error('Failed to save property offline:', error);
    }
  }

  getProperties(): OfflineProperty[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.PROPERTIES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get offline properties:', error);
      return [];
    }
  }

  getPropertyById(id: string): OfflineProperty | null {
    const properties = this.getProperties();
    return properties.find(property => property.id === id) || null;
  }

  getFavoriteProperties(): OfflineProperty[] {
    const properties = this.getProperties();
    return properties.filter(property => property.isFavorite);
  }

  toggleFavorite(propertyId: string): boolean {
    try {
      const properties = this.getProperties();
      const property = properties.find(p => p.id === propertyId);
      
      if (property) {
        property.isFavorite = !property.isFavorite;
        property.timestamp = Date.now();
        localStorage.setItem(
          this.STORAGE_KEYS.PROPERTIES,
          JSON.stringify(properties)
        );
        return property.isFavorite;
      }
      return false;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      return false;
    }
  }

  // Portfolio storage
  savePortfolio(portfolioData: any): void {
    try {
      const data: OfflineData = {
        timestamp: Date.now(),
        data: portfolioData,
        version: this.CACHE_VERSION
      };
      localStorage.setItem(
        this.STORAGE_KEYS.PORTFOLIO,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Failed to save portfolio offline:', error);
    }
  }

  getPortfolio(): any | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.PORTFOLIO);
      if (stored) {
        const parsed: OfflineData = JSON.parse(stored);
        return parsed.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to get offline portfolio:', error);
      return null;
    }
  }

  // Settings storage
  saveSettings(settings: any): void {
    try {
      const data: OfflineData = {
        timestamp: Date.now(),
        data: settings,
        version: this.CACHE_VERSION
      };
      localStorage.setItem(
        this.STORAGE_KEYS.SETTINGS,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Failed to save settings offline:', error);
    }
  }

  getSettings(): any | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed: OfflineData = JSON.parse(stored);
        return parsed.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to get offline settings:', error);
      return null;
    }
  }

  // Cache management
  getStorageSize(): { used: number; available: number; percentage: number } {
    try {
      let used = 0;
      for (const key in this.STORAGE_KEYS) {
        const value = localStorage.getItem(this.STORAGE_KEYS[key as keyof typeof this.STORAGE_KEYS]);
        if (value) {
          used += value.length;
        }
      }

      // Estimate available space (most browsers have 5-10MB limit)
      const estimatedLimit = 5 * 1024 * 1024; // 5MB
      const available = Math.max(0, estimatedLimit - used);
      const percentage = (used / estimatedLimit) * 100;

      return { used, available, percentage };
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  clearOldData(maxAge: number = 7 * 24 * 60 * 60 * 1000): void { // 7 days
    try {
      const now = Date.now();
      
      // Clear old searches
      const searches = this.getSearches();
      const recentSearches = searches.filter(search => 
        now - search.timestamp < maxAge
      );
      localStorage.setItem(
        this.STORAGE_KEYS.SEARCHES,
        JSON.stringify(recentSearches)
      );

      // Clear old properties (keep favorites)
      const properties = this.getProperties();
      const recentProperties = properties.filter(property => 
        property.isFavorite || (now - property.timestamp < maxAge)
      );
      localStorage.setItem(
        this.STORAGE_KEYS.PROPERTIES,
        JSON.stringify(recentProperties)
      );

      console.log('Cleared old offline data');
    } catch (error) {
      console.error('Failed to clear old data:', error);
    }
  }

  clearAllData(): void {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('Cleared all offline data');
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  isDataStale(timestamp: number, maxAge: number = 24 * 60 * 60 * 1000): boolean {
    return Date.now() - timestamp > maxAge;
  }

  // Sync with server when online
  async syncWithServer(): Promise<void> {
    if (!navigator.onLine) {
      console.log('Cannot sync - offline');
      return;
    }

    try {
      // This would implement sync logic with the server
      console.log('Syncing offline data with server...');
      
      // Example: Sync favorite properties
      const favorites = this.getFavoriteProperties();
      if (favorites.length > 0) {
        // Send to server
        console.log(`Syncing ${favorites.length} favorite properties`);
      }

      // Example: Sync portfolio changes
      const portfolio = this.getPortfolio();
      if (portfolio) {
        // Send to server
        console.log('Syncing portfolio data');
      }

      console.log('Sync completed');
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

// Export types
export type { OfflineSearch, OfflineProperty, OfflineData };
