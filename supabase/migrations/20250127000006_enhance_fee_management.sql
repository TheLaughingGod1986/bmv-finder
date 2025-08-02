-- Enhance Fee Management Fields
-- This migration adds comprehensive fee management fields for better property cost tracking

-- Add new fee management columns to portfolio_properties table
ALTER TABLE portfolio_properties 
ADD COLUMN IF NOT EXISTS monthly_agent_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_insurance DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS annual_insurance DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS one_off_fees JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS scheduled_fees JSONB DEFAULT '[]';

-- Create a table for detailed fee tracking
CREATE TABLE IF NOT EXISTS property_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES portfolio_properties(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('monthly_agent', 'monthly_insurance', 'annual_insurance', 'one_off', 'scheduled')),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency TEXT CHECK (frequency IN ('monthly', 'quarterly', 'annually', 'one_off', 'specific_date')),
  scheduled_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for property_fees
CREATE INDEX IF NOT EXISTS idx_property_fees_property_id ON property_fees(property_id);
CREATE INDEX IF NOT EXISTS idx_property_fees_fee_type ON property_fees(fee_type);
CREATE INDEX IF NOT EXISTS idx_property_fees_scheduled_date ON property_fees(scheduled_date);

-- Create a trigger for property_fees updated_at
CREATE TRIGGER update_property_fees_updated_at 
    BEFORE UPDATE ON property_fees 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on property_fees
ALTER TABLE property_fees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for property_fees
CREATE POLICY "Users can view own property fees" ON property_fees
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM portfolio_properties 
        WHERE portfolio_properties.id = property_fees.property_id 
        AND portfolio_properties.user_id = auth.uid()
      )
    );

CREATE POLICY "Users can insert own property fees" ON property_fees
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM portfolio_properties 
        WHERE portfolio_properties.id = property_fees.property_id 
        AND portfolio_properties.user_id = auth.uid()
      )
    );

CREATE POLICY "Users can update own property fees" ON property_fees
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM portfolio_properties 
        WHERE portfolio_properties.id = property_fees.property_id 
        AND portfolio_properties.user_id = auth.uid()
      )
    );

CREATE POLICY "Users can delete own property fees" ON property_fees
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM portfolio_properties 
        WHERE portfolio_properties.id = property_fees.property_id 
        AND portfolio_properties.user_id = auth.uid()
      )
    );

-- Grant permissions
GRANT ALL ON property_fees TO authenticated;

-- Create a function to calculate total monthly fees
CREATE OR REPLACE FUNCTION calculate_total_monthly_fees(property_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_fees DECIMAL := 0;
BEGIN
  -- Monthly agent fee
  SELECT COALESCE(monthly_agent_fee, 0) INTO total_fees
  FROM portfolio_properties WHERE id = property_uuid;
  
  -- Monthly insurance
  SELECT total_fees + COALESCE(monthly_insurance, 0) INTO total_fees
  FROM portfolio_properties WHERE id = property_uuid;
  
  -- Annual insurance divided by 12
  SELECT total_fees + (COALESCE(annual_insurance, 0) / 12) INTO total_fees
  FROM portfolio_properties WHERE id = property_uuid;
  
  -- Monthly expenses
  SELECT total_fees + COALESCE(monthly_expenses, 0) INTO total_fees
  FROM portfolio_properties WHERE id = property_uuid;
  
  RETURN ROUND(total_fees, 2);
END;
$$ LANGUAGE plpgsql;

-- Create a function to get upcoming scheduled fees
CREATE OR REPLACE FUNCTION get_upcoming_scheduled_fees(property_uuid UUID, days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
  fee_description TEXT,
  amount DECIMAL,
  scheduled_date DATE,
  days_until_due INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pf.description,
    pf.amount,
    pf.scheduled_date,
    pf.scheduled_date - CURRENT_DATE as days_until_due
  FROM property_fees pf
  WHERE pf.property_id = property_uuid
    AND pf.fee_type = 'scheduled'
    AND pf.is_active = true
    AND pf.scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 day' * days_ahead
  ORDER BY pf.scheduled_date;
END;
$$ LANGUAGE plpgsql; 