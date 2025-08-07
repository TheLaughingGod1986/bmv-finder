-- Create table for storing property outcomes for ML learning
CREATE TABLE IF NOT EXISTS property_outcomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES portfolio_properties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    predicted_growth DECIMAL(10,2) NOT NULL,
    actual_growth DECIMAL(10,2) NOT NULL,
    predicted_rent DECIMAL(10,2) NOT NULL,
    actual_rent DECIMAL(10,2) NOT NULL,
    predicted_roi DECIMAL(10,2) NOT NULL,
    actual_roi DECIMAL(10,2) NOT NULL,
    property_type VARCHAR(50) NOT NULL,
    postcode VARCHAR(10) NOT NULL,
    purchase_price DECIMAL(12,2) NOT NULL,
    refurbishment_cost DECIMAL(10,2) DEFAULT 0,
    stamp_duty DECIMAL(10,2) DEFAULT 0,
    legal_fees DECIMAL(10,2) DEFAULT 0,
    mortgage_rate DECIMAL(5,2) NOT NULL,
    ltv DECIMAL(5,2) NOT NULL,
    months_held INTEGER NOT NULL,
    outcome_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accuracy_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for ML model metadata
CREATE TABLE IF NOT EXISTS ml_model_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    last_training_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accuracy_metrics JSONB DEFAULT '{"growthAccuracy": 0, "rentAccuracy": 0, "roiAccuracy": 0, "totalPredictions": 0}'::jsonb,
    model_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_outcomes_property_type ON property_outcomes(property_type);
CREATE INDEX IF NOT EXISTS idx_property_outcomes_postcode ON property_outcomes(postcode);
CREATE INDEX IF NOT EXISTS idx_property_outcomes_purchase_price ON property_outcomes(purchase_price);
CREATE INDEX IF NOT EXISTS idx_property_outcomes_outcome_date ON property_outcomes(outcome_date);
CREATE INDEX IF NOT EXISTS idx_property_outcomes_user_id ON property_outcomes(user_id);

-- Insert initial ML model metadata
INSERT INTO ml_model_metadata (version, accuracy_metrics) 
VALUES ('1.0.0', '{"growthAccuracy": 0, "rentAccuracy": 0, "roiAccuracy": 0, "totalPredictions": 0}')
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_property_outcomes_updated_at 
    BEFORE UPDATE ON property_outcomes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ml_model_metadata_updated_at 
    BEFORE UPDATE ON ml_model_metadata 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE property_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_model_metadata ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own property outcomes" ON property_outcomes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own property outcomes" ON property_outcomes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own property outcomes" ON property_outcomes
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow all authenticated users to read ML model metadata (it's shared)
CREATE POLICY "Authenticated users can view ML model metadata" ON ml_model_metadata
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only allow service role to update ML model metadata
CREATE POLICY "Service role can update ML model metadata" ON ml_model_metadata
    FOR ALL USING (auth.role() = 'service_role'); 