-- Portfolio Properties Table Setup
-- Run this script in your Supabase SQL editor

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
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_property_type ON portfolio_properties(property_type);
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_purchase_date ON portfolio_properties(purchase_date);
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_deal_score ON portfolio_properties(deal_score);
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_bmv_score ON portfolio_properties(bmv_score);

-- Create a composite index for user and status queries
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_user_status ON portfolio_properties(user_id, status);

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

-- Create a view for portfolio analytics
CREATE OR REPLACE VIEW portfolio_analytics AS
SELECT 
    user_id,
    COUNT(*) as total_properties,
    SUM(current_value) as total_value,
    SUM(equity) as total_equity,
    SUM(COALESCE(rental_income, 0)) as total_rental_income,
    AVG(COALESCE(yield, 0)) as average_yield,
    SUM(current_value - purchase_price) as total_growth,
    CASE 
        WHEN SUM(purchase_price) > 0 
        THEN ((SUM(current_value) - SUM(purchase_price)) / SUM(purchase_price)) * 100 
        ELSE 0 
    END as growth_percentage,
    AVG(deal_score) as average_deal_score,
    AVG(bmv_score) as average_bmv_score,
    CASE 
        WHEN COUNT(*) > 0 THEN
            (SELECT SUM(current_value) 
             FROM portfolio_properties p2 
             WHERE p2.user_id = portfolio_properties.user_id 
             AND p2.status = 'active'
             ORDER BY current_value DESC 
             LIMIT 3) / SUM(current_value) * 100
        ELSE 0
    END as concentration_risk
FROM portfolio_properties 
WHERE status = 'active'
GROUP BY user_id;

-- Grant necessary permissions
GRANT ALL ON portfolio_properties TO authenticated;
GRANT ALL ON portfolio_analytics TO authenticated;

-- Insert some sample data for testing (optional)
-- Uncomment the following lines if you want to add sample data

/*
INSERT INTO portfolio_properties (
    user_id,
    address,
    postcode,
    house_number,
    property_type,
    bedrooms,
    floor_area,
    epc_rating,
    purchase_price,
    current_value,
    purchase_date,
    deal_score,
    deal_rating,
    bmv_score,
    rental_income,
    yield,
    equity,
    notes
) VALUES 
(
    'your-user-id-here', -- Replace with actual user ID
    '15 High Street',
    'NE5 2PR',
    '15',
    'Semi-detached',
    3,
    85.5,
    'C',
    185000,
    210000,
    '2022-03-15',
    78,
    'Good',
    75,
    1200,
    6.9,
    210000,
    'Great investment property with strong rental yield'
),
(
    'your-user-id-here', -- Replace with actual user ID
    '42 Park Avenue',
    'SE3 9FE',
    '42',
    'Terraced',
    2,
    65.0,
    'D',
    320000,
    345000,
    '2021-08-22',
    82,
    'Excellent',
    80,
    1800,
    6.3,
    345000,
    'Excellent location near transport links'
);
*/ 