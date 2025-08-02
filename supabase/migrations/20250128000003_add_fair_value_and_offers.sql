-- Add fair value analysis and offer tracking fields

-- Add fair value estimation fields
ALTER TABLE captured_properties 
ADD COLUMN IF NOT EXISTS estimated_fair_value DECIMAL(12,2) DEFAULT 0;

-- Add fair bid calculation
ALTER TABLE captured_properties 
ADD COLUMN IF NOT EXISTS fair_bid_amount DECIMAL(12,2) DEFAULT 0;

-- Add user notes field
ALTER TABLE captured_properties 
ADD COLUMN IF NOT EXISTS user_notes TEXT;

-- Add property condition assessment
ALTER TABLE captured_properties 
ADD COLUMN IF NOT EXISTS property_condition TEXT DEFAULT 'average';

-- Add market analysis fields
ALTER TABLE captured_properties 
ADD COLUMN IF NOT EXISTS market_trend TEXT DEFAULT 'stable';
ALTER TABLE captured_properties 
ADD COLUMN IF NOT EXISTS days_on_market INTEGER DEFAULT 0;

-- Create offers table for tracking offer history
CREATE TABLE IF NOT EXISTS property_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES captured_properties(id) ON DELETE CASCADE,
  offer_amount DECIMAL(12,2) NOT NULL,
  offer_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  offer_status TEXT NOT NULL DEFAULT 'pending' CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'expired')),
  offer_notes TEXT,
  counter_offer_amount DECIMAL(12,2),
  counter_offer_date TIMESTAMP WITH TIME ZONE,
  final_decision TEXT,
  decision_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_property_offers_property_id ON property_offers(property_id);
CREATE INDEX IF NOT EXISTS idx_property_offers_status ON property_offers(offer_status);
CREATE INDEX IF NOT EXISTS idx_property_offers_date ON property_offers(offer_date);

-- Create a function to automatically update the updated_at timestamp for offers
CREATE OR REPLACE FUNCTION update_offers_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column for offers
CREATE TRIGGER update_property_offers_updated_at 
    BEFORE UPDATE ON property_offers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_offers_updated_at_column();

-- Create a function to calculate fair value based on market data
CREATE OR REPLACE FUNCTION calculate_fair_value(
  p_price DECIMAL,
  p_bedrooms INTEGER,
  p_property_type TEXT,
  p_postcode TEXT,
  p_condition TEXT DEFAULT 'average'
)
RETURNS DECIMAL AS $$
DECLARE
  base_multiplier DECIMAL := 1.0;
  condition_multiplier DECIMAL := 1.0;
  market_multiplier DECIMAL := 1.0;
  fair_value DECIMAL;
BEGIN
  -- Base multiplier based on property type and bedrooms
  IF p_property_type = 'terraced' THEN
    base_multiplier := 1.05;
  ELSIF p_property_type = 'semi-detached' THEN
    base_multiplier := 1.1;
  ELSIF p_property_type = 'detached' THEN
    base_multiplier := 1.15;
  ELSIF p_property_type = 'flat' OR p_property_type = 'apartment' THEN
    base_multiplier := 0.95;
  END IF;
  
  -- Bedroom multiplier
  IF p_bedrooms = 1 THEN
    base_multiplier := base_multiplier * 0.85;
  ELSIF p_bedrooms = 2 THEN
    base_multiplier := base_multiplier * 1.0;
  ELSIF p_bedrooms = 3 THEN
    base_multiplier := base_multiplier * 1.1;
  ELSIF p_bedrooms = 4 THEN
    base_multiplier := base_multiplier * 1.2;
  ELSIF p_bedrooms >= 5 THEN
    base_multiplier := base_multiplier * 1.3;
  END IF;
  
  -- Condition multiplier
  IF p_condition = 'excellent' THEN
    condition_multiplier := 1.1;
  ELSIF p_condition = 'good' THEN
    condition_multiplier := 1.05;
  ELSIF p_condition = 'average' THEN
    condition_multiplier := 1.0;
  ELSIF p_condition = 'poor' THEN
    condition_multiplier := 0.9;
  ELSIF p_condition = 'very_poor' THEN
    condition_multiplier := 0.8;
  END IF;
  
  -- Market trend multiplier (based on postcode area)
  IF p_postcode LIKE 'NE1%' THEN
    market_multiplier := 1.05; -- City centre premium
  ELSIF p_postcode LIKE 'NE5%' THEN
    market_multiplier := 1.02; -- Suburban growth
  ELSIF p_postcode LIKE 'NE2%' THEN
    market_multiplier := 1.08; -- University area premium
  ELSE
    market_multiplier := 1.0; -- Default
  END IF;
  
  -- Calculate fair value
  fair_value := p_price * base_multiplier * condition_multiplier * market_multiplier;
  
  RETURN ROUND(fair_value, 2);
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate fair bid amount (typically 5-15% below fair value)
CREATE OR REPLACE FUNCTION calculate_fair_bid(
  p_fair_value DECIMAL,
  p_condition TEXT DEFAULT 'average'
)
RETURNS DECIMAL AS $$
DECLARE
  discount_percentage DECIMAL;
  fair_bid DECIMAL;
BEGIN
  -- Discount based on condition
  IF p_condition = 'excellent' THEN
    discount_percentage := 0.05; -- 5% discount
  ELSIF p_condition = 'good' THEN
    discount_percentage := 0.08; -- 8% discount
  ELSIF p_condition = 'average' THEN
    discount_percentage := 0.12; -- 12% discount
  ELSIF p_condition = 'poor' THEN
    discount_percentage := 0.18; -- 18% discount
  ELSIF p_condition = 'very_poor' THEN
    discount_percentage := 0.25; -- 25% discount
  ELSE
    discount_percentage := 0.12; -- Default 12% discount
  END IF;
  
  fair_bid := p_fair_value * (1 - discount_percentage);
  
  RETURN ROUND(fair_bid, 2);
END;
$$ LANGUAGE plpgsql; 