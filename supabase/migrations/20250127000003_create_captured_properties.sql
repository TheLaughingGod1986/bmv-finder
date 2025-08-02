-- Create captured_properties table for Chrome extension
CREATE TABLE IF NOT EXISTS captured_properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    price INTEGER,
    address TEXT,
    description TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    property_type TEXT,
    tenure TEXT,
    postcode TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    original_url TEXT,
    source TEXT DEFAULT 'chrome-extension',
    agent_name TEXT,
    agent_phone TEXT,
    images JSONB DEFAULT '[]',
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    status TEXT DEFAULT 'active',
    extension_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on captured_at for efficient querying
CREATE INDEX IF NOT EXISTS idx_captured_properties_captured_at ON captured_properties(captured_at);

-- Create index on source for filtering
CREATE INDEX IF NOT EXISTS idx_captured_properties_source ON captured_properties(source);

-- Create index on original_url for duplicate checking
CREATE INDEX IF NOT EXISTS idx_captured_properties_url ON captured_properties(original_url);

-- Add RLS (Row Level Security) - for now, allow all operations
ALTER TABLE captured_properties ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on captured_properties" ON captured_properties
    FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_captured_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_captured_properties_updated_at
    BEFORE UPDATE ON captured_properties
    FOR EACH ROW
    EXECUTE FUNCTION update_captured_properties_updated_at(); 