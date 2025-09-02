// Elasticsearch Data Type Definitions
// This file contains proper TypeScript interfaces for all Elasticsearch indices
// to replace 'as any' assertions throughout the codebase

// Base Elasticsearch response structure
export interface ElasticsearchHit<T> {
  _index: string;
  _id: string;
  _score: number;
  _source: T;
}

export interface ElasticsearchResponse<T> {
  hits: {
    total: number | { value: number };
    hits: ElasticsearchHit<T>[];
  };
}

// Recent Sales Index (recent_sales)
export interface RecentSaleDocument {
  // Core property information
  address: string;
  postcode: string;
  price: number;
  date: string;
  date_of_transfer: string;
  
  // Property details
  property_type: string;
  estate_type?: string;
  new_build: 'Y' | 'N';
  tenure?: string;
  
  // Location details
  paon?: string; // Primary Addressable Object Name (house number)
  saon?: string; // Secondary Addressable Object Name (flat number)
  street?: string;
  locality?: string;
  town_city?: string;
  district?: string;
  county?: string;
  
  // Property characteristics
  bedrooms?: number;
  epc_bedrooms?: number;
  floor_area?: number;
  floor_area_m2?: number; // Alternative field name used in some indices
  epc_floor_area?: number; // Alternative field name used in some indices
  epc_size?: number;
  total_floor_area?: number;
  square_footage?: number;
  
  // EPC data
  epc_rating?: string;
  current_energy_rating?: string;
  
  // Additional metadata
  record_status?: string;
  ppd_category_type?: string;
  transaction_category?: string;
  
  // Additional fields
  energy_efficient?: boolean;
  has_epc?: boolean;
  
  // Calculated fields
  full_address?: string;
}

// EPC Data Index (epc_data)
export interface EPCDocument {
  // Address information
  address: string;
  full_address?: string;
  postcode: string;
  street?: string;
  locality?: string;
  town_city?: string;
  district?: string;
  county?: string;
  
  // Property details
  property_type: string;
  building_type?: string;
  property_type_label?: string;
  
  // EPC ratings
  current_energy_rating: string;
  potential_energy_rating?: string;
  current_energy_efficiency?: number;
  potential_energy_efficiency?: number;
  epc_rating?: string; // Alternative field name
  
  // Additional EPC fields
  energy_efficient?: boolean;
  has_epc?: boolean;
  inspection_date?: string;
  number_habitable_rooms?: number;
  bedroom_count?: number;
  number_of_bedrooms?: number;
  rooms?: number;
  local_authority?: string;
  
  // Extended EPC fields
  built_form?: string;
  construction_age_band?: string;
  local_authority_label?: string;
  constituency?: string;
  constituency_label?: string;
  number_heated_rooms?: number;
  floor_level?: number;
  lighting_cost_current?: number;
  heating_cost_current?: number;
  hot_water_cost_current?: number;
  co2_emissions_current?: number;
  environment_impact_current?: string;
  mainheat_description?: string;
  mainheatcont_description?: string;
  windows_description?: string;
  walls_description?: string;
  roof_description?: string;
  floor_description?: string;
  mains_gas_flag?: string;
  low_energy_lighting?: string;
  solar_water_heating_flag?: string;
  
  // Property characteristics
  bedrooms?: number;
  epc_bedrooms?: number;
  floor_area?: number;
  epc_size?: number;
  total_floor_area?: number;
  
  // Construction details
  construction_year?: number;
  year_built?: number;
  build_year?: number;
  
  // Additional metadata
  tenure?: string;
  estate_type_label?: string;
  has_garage?: boolean;
  has_garden?: boolean;
  has_parking?: boolean;
  
  // Condition assessment
  condition?: string;
  house_condition?: string;
}

// Properties Enhanced Index (properties-enhanced)
export interface PropertiesEnhancedDocument {
  // Core property information
  address: string;
  postcode: string;
  property_type: string;
  property_type_label?: string;
  
  // Property characteristics
  bedrooms?: number;
  epc_bedrooms?: number;
  floor_area?: number;
  epc_size?: number;
  square_footage?: number;
  
  // EPC data
  epc_rating?: string;
  epc_score?: number;
  
  // Property details
  estate_type?: string;
  estate_type_label?: string;
  tenure?: string;
  
  // Construction details
  build_year?: number;
  year_built?: number;
  construction_year?: number;
  
  // Condition and features
  condition?: string;
  house_condition?: string;
  has_garage?: boolean;
  has_garden?: boolean;
  has_parking?: boolean;
  
  // Sales data
  price?: number;
  date?: string;
  last_sale_price?: number;
  last_sale_date?: string;
  
  // Additional metadata
  paon?: string;
  saon?: string;
  street?: string;
  locality?: string;
  town_city?: string;
  district?: string;
  county?: string;
}

// House Price Index (house_price_index)
export interface HPIDocument {
  // Core HPI data
  postcode: string;
  date: string;
  hpi_index?: number;
  index_value?: number;
  
  // Growth metrics
  percentage_change_yearly?: number;
  yearly_change?: number;
  yoy_growth?: number;
  
  // Market data
  average_price?: number;
  avg_price?: number;
  sales_volume?: number;
  salesVolume?: number;
  
  // Regional information
  region_label?: string;
  regionLabel?: string;
  region_code?: string;
  
  // Additional metadata
  last_updated?: string;
  source?: string;
}

// Rental Prices Index (rental_prices)
export interface RentalPricesDocument {
  // Core rental data
  postcode: string;
  property_type: string;
  property_type_label?: string;
  
  // Rental amounts
  rental_price: number;
  monthly_rent?: number;
  weekly_rent?: number;
  
  // Property characteristics
  bedrooms?: number;
  floor_area?: number;
  
  // Location details
  address?: string;
  street?: string;
  locality?: string;
  town_city?: string;
  district?: string;
  county?: string;
  
  // Additional metadata
  date?: string;
  source?: string;
  data_quality?: string;
  region_name?: string;
  confidence_score?: number;
  data_source?: string;
}

// Properties Index (properties)
export interface PropertiesDocument {
  // Core property information
  address: string;
  postcode: string;
  property_type: string;
  
  // Property characteristics
  bedrooms?: number;
  floor_area?: number;
  square_footage?: number;
  
  // EPC data
  epc_rating?: string;
  
  // Sales data
  price?: number;
  date?: string;
  last_sale_price?: number;
  last_sale_date?: string;
  
  // Additional metadata
  paon?: string;
  saon?: string;
  street?: string;
  locality?: string;
  town_city?: string;
  district?: string;
  county?: string;
}

// Generic property interface for cross-index compatibility
export interface GenericPropertyDocument {
  // Core fields (common across indices)
  address: string;
  postcode: string;
  property_type: string;
  bedrooms?: number;
  floor_area?: number;
  price?: number;
  date?: string;
  
  // EPC fields
  epc_rating?: string;
  epc_score?: number;
  
  // Additional fields (union of all possible fields)
  [key: string]: any;
}

// Utility types for API responses
export type RecentSalesResponse = ElasticsearchResponse<RecentSaleDocument>;
export type EPCResponse = ElasticsearchResponse<EPCDocument>;
export type PropertiesEnhancedResponse = ElasticsearchResponse<PropertiesEnhancedDocument>;
export type HPIResponse = ElasticsearchResponse<HPIDocument>;
export type RentalPricesResponse = ElasticsearchResponse<RentalPricesDocument>;
export type PropertiesResponse = ElasticsearchResponse<PropertiesDocument>;

// Type guards for runtime type checking
export const isRecentSaleDocument = (obj: any): obj is RecentSaleDocument => {
  return obj && typeof obj.address === 'string' && typeof obj.postcode === 'string';
};

export const isEPCDocument = (obj: any): obj is EPCDocument => {
  return obj && typeof obj.postcode === 'string' && typeof obj.current_energy_rating === 'string';
};

export const isHPIDocument = (obj: any): obj is HPIDocument => {
  return obj && typeof obj.postcode === 'string' && (typeof obj.hpi_index === 'number' || typeof obj.index_value === 'number');
};

// Helper function to safely extract data from Elasticsearch hits
export const extractSource = <T>(hit: ElasticsearchHit<T>): T => {
  return hit._source;
};

// Helper function to safely map Elasticsearch responses
export const mapElasticsearchHits = <T, R>(
  response: ElasticsearchResponse<T>,
  mapper: (source: T) => R
): R[] => {
  return response.hits.hits.map(hit => mapper(hit._source));
};
