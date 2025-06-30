export interface SoldPrice {
  id: string;
  price: number;
  dateOfTransfer: string;
  postcode: string;
  propertyType: string;
  street: string;
  town_city: string;
  county: string;
  paon: string;
  saon: string;
  duration: string;
  old_new: string;
  locality: string;
  ppd_category_type: string;
  record_status: string;
  growthPct?: number;
  // BMV Score Engine fields
  bmvScore?: number;
  marketValue?: number;
  askingPrice?: number;
  rentalYield?: number;
  areaGrowth?: number;
  postcodeYield?: number;
  postcodeGrowth?: number;
} 