-- Create watchlist table for storing captured properties
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    price DECIMAL(12, 2),
    address TEXT,
    description TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    property_type TEXT,
    tenure TEXT,
    postcode TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    original_url TEXT NOT NULL,
    source TEXT NOT NULL,
    agent_name TEXT,
    agent_phone TEXT,
    images TEXT[] DEFAULT '{}',
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'sold', 'withdrawn')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_status ON watchlist(status);
CREATE INDEX IF NOT EXISTS idx_watchlist_captured_at ON watchlist(captured_at);
CREATE INDEX IF NOT EXISTS idx_watchlist_postcode ON watchlist(postcode);
CREATE INDEX IF NOT EXISTS idx_watchlist_original_url ON watchlist(original_url);

-- Create unique constraint to prevent duplicate properties per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_watchlist_user_url_unique ON watchlist(user_id, original_url);

-- Enable Row Level Security
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own watchlist items" ON watchlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlist items" ON watchlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist items" ON watchlist
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist items" ON watchlist
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_watchlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_watchlist_updated_at
    BEFORE UPDATE ON watchlist
    FOR EACH ROW
    EXECUTE FUNCTION update_watchlist_updated_at();

-- Add comments for documentation
COMMENT ON TABLE watchlist IS 'Stores properties captured by users via Chrome extension';
COMMENT ON COLUMN watchlist.user_id IS 'Reference to the user who captured this property';
COMMENT ON COLUMN watchlist.original_url IS 'Original URL where the property was captured from';
COMMENT ON COLUMN watchlist.source IS 'Source website (e.g., rightmove.co.uk, zoopla.co.uk)';
COMMENT ON COLUMN watchlist.status IS 'Current status of the property in the watchlist';
COMMENT ON COLUMN watchlist.captured_at IS 'When the property was captured by the extension'; 