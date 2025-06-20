export interface SoldPrice {
  id: string;
  price: number;
  date_of_transfer: string;
  postcode: string;
  property_type: string;
  street: string;
  town_city: string;
  county: string;
  paon: string;
  saon: string;
  duration: string;
  old_new: string;
  locality: string;
  district: string;
  ppd_category_type: string;
  record_status: string;
  growthPct?: number;
} 