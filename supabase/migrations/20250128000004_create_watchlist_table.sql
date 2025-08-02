-- Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  bedrooms INTEGER,
  bathrooms INTEGER,
  property_type TEXT,
  tenure TEXT,
  postcode TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  original_url TEXT,
  source TEXT,
  agent_name TEXT,
  agent_phone TEXT,
  images JSONB,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_size JSONB,
  floor_plan_links JSONB,
  refurbishment_cost DECIMAL(12,2),
  total_cost DECIMAL(12,2),
  estimated_fair_value DECIMAL(12,2),
  fair_bid_amount DECIMAL(12,2),
  user_notes TEXT,
  property_condition TEXT,
  market_trend TEXT,
  days_on_market INTEGER
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_status ON watchlist(status);
CREATE INDEX IF NOT EXISTS idx_watchlist_captured_at ON watchlist(captured_at);
CREATE INDEX IF NOT EXISTS idx_watchlist_price ON watchlist(price);
CREATE INDEX IF NOT EXISTS idx_watchlist_postcode ON watchlist(postcode);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_watchlist_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_watchlist_updated_at_column 
  BEFORE UPDATE ON watchlist 
  FOR EACH ROW 
  EXECUTE FUNCTION update_watchlist_updated_at_column();

-- Disable RLS for now (we can enable it later when we add user authentication)
-- ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY; 