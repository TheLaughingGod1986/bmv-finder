export interface SearchFilters {
  // Location filters
  location?: {
    postcode?: string;
    area?: string;
    radius?: number; // in miles
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  // Property type filters
  propertyType?: string[];
  propertySubType?: string[];

  // Price filters
  price?: {
    min?: number;
    max?: number;
    pricePerSqFt?: {
      min?: number;
      max?: number;
    };
  };

  // Size filters
  size?: {
    bedrooms?: {
      min?: number;
      max?: number;
    };
    bathrooms?: {
      min?: number;
      max?: number;
    };
    floorArea?: {
      min?: number;
      max?: number;
    };
    landArea?: {
      min?: number;
      max?: number;
    };
  };

  // Date filters
  dateRange?: {
    soldAfter?: string; // ISO date
    soldBefore?: string; // ISO date
    builtAfter?: number; // year
    builtBefore?: number; // year
  };

  // Investment filters
  investment?: {
    bmvScore?: {
      min?: number;
      max?: number;
    };
    rentalYield?: {
      min?: number;
      max?: number;
    };
    priceGrowth?: {
      min?: number;
      max?: number;
    };
    marketTrend?: 'rising' | 'falling' | 'stable' | 'any';
  };

  // Property features
  features?: {
    parking?: boolean;
    garden?: boolean;
    garage?: boolean;
    conservatory?: boolean;
    loft?: boolean;
    basement?: boolean;
    period?: string[]; // Victorian, Edwardian, etc.
    condition?: string[]; // Excellent, Good, Fair, Poor
  };

  // Market data filters
  marketData?: {
    salesVolume?: {
      min?: number;
      max?: number;
    };
    averagePrice?: {
      min?: number;
      max?: number;
    };
    pricePerSqFt?: {
      min?: number;
      max?: number;
    };
    daysOnMarket?: {
      min?: number;
      max?: number;
    };
  };

  // EPC and energy
  epc?: {
    rating?: string[]; // A, B, C, D, E, F, G
    energyEfficiency?: {
      min?: number;
      max?: number;
    };
    environmentalImpact?: {
      min?: number;
      max?: number;
    };
  };

  // Search preferences
  preferences?: {
    sortBy?: 'price' | 'date' | 'bmvScore' | 'size' | 'distance';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    includeSold?: boolean;
    includeWithdrawn?: boolean;
  };
}

export interface FilterOption {
  value: string | number | boolean;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: 'range' | 'select' | 'multiselect' | 'checkbox' | 'radio';
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
}

export interface SearchFilterState {
  filters: SearchFilters;
  isOpen: boolean;
  activeFilters: number;
  hasActiveFilters: boolean;
}

export interface AdvancedSearchResult {
  properties: any[];
  totalCount: number;
  appliedFilters: SearchFilters;
  searchMetadata: {
    searchTime: number;
    filtersApplied: number;
    resultsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
  suggestions?: {
    similarProperties?: any[];
    alternativeFilters?: FilterGroup[];
  };
}
