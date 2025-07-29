-- Portfolio Properties Table Setup
-- Basic version without complex analytics view

-- Create the portfolio_properties table
CREATE TABLE IF NOT EXISTS portfolio_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  house_number TEXT NOT NULL,
  property_type TEXT NOT NULL,
  bedrooms INTEGER,
  floor_area DECIMAL(10,2),
  epc_rating TEXT,
  construction_year TEXT,
  purchase_price DECIMAL(12,2) NOT NULL,
  current_value DECIMAL(12,2) NOT NULL,
  purchase_date DATE NOT NULL,
  last_valuation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deal_score INTEGER NOT NULL,
  deal_rating TEXT NOT NULL,
  bmv_score INTEGER NOT NULL,
  rental_income DECIMAL(10,2),
  yield DECIMAL(5,2),
  equity DECIMAL(12,2) NOT NULL,
  mortgage_balance DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'watching')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_user_id ON portfolio_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_status ON portfolio_properties(status);
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_postcode ON portfolio_properties(postcode);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_portfolio_properties_updated_at 
    BEFORE UPDATE ON portfolio_properties 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE portfolio_properties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own portfolio properties
CREATE POLICY "Users can view own portfolio properties" ON portfolio_properties
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own portfolio properties
CREATE POLICY "Users can insert own portfolio properties" ON portfolio_properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own portfolio properties
CREATE POLICY "Users can update own portfolio properties" ON portfolio_properties
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own portfolio properties
CREATE POLICY "Users can delete own portfolio properties" ON portfolio_properties
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON portfolio_properties TO authenticated; 