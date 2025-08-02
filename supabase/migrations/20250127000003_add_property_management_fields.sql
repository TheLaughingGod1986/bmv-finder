-- Add Property Management Fields to Portfolio Properties
-- This migration adds the detailed financial fields needed for property management

-- Add new columns to portfolio_properties table
ALTER TABLE portfolio_properties 
ADD COLUMN IF NOT EXISTS monthly_rent DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rent_start_date DATE,
ADD COLUMN IF NOT EXISTS mortgage_type TEXT DEFAULT 'repayment' CHECK (mortgage_type IN ('repayment', 'interest_only')),
ADD COLUMN IF NOT EXISTS mortgage_rate DECIMAL(5,4) DEFAULT 0.045,
ADD COLUMN IF NOT EXISTS monthly_mortgage_payment DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS agent_fees DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_fees DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_expenses DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS property_notes TEXT,
ADD COLUMN IF NOT EXISTS equity_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_profit DECIMAL(10,2) DEFAULT 0;

-- Update existing records to set default values
UPDATE portfolio_properties 
SET 
  monthly_rent = COALESCE(rental_income / 12, 0),
  deposit_amount = COALESCE(purchase_price * 0.25, 0),
  equity_percentage = CASE 
    WHEN current_value > 0 THEN ((deposit_amount + (current_value - purchase_price)) / current_value) * 100
    ELSE 0 
  END,
  monthly_profit = COALESCE(rental_income / 12, 0) - COALESCE(monthly_mortgage_payment, 0) - COALESCE(monthly_expenses, 0)
WHERE monthly_rent IS NULL OR deposit_amount IS NULL;

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_monthly_rent ON portfolio_properties(monthly_rent);
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_rent_start_date ON portfolio_properties(rent_start_date);
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_mortgage_balance ON portfolio_properties(mortgage_balance);

-- Create a table for monthly statements
CREATE TABLE IF NOT EXISTS portfolio_monthly_statements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES portfolio_properties(id) ON DELETE CASCADE,
  statement_month DATE NOT NULL,
  rental_income DECIMAL(10,2) DEFAULT 0,
  mortgage_payment DECIMAL(10,2) DEFAULT 0,
  expenses DECIMAL(10,2) DEFAULT 0,
  net_profit DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, statement_month)
);

-- Create indexes for monthly statements
CREATE INDEX IF NOT EXISTS idx_monthly_statements_user_id ON portfolio_monthly_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_statements_property_id ON portfolio_monthly_statements(property_id);
CREATE INDEX IF NOT EXISTS idx_monthly_statements_month ON portfolio_monthly_statements(statement_month);

-- Create a trigger for monthly statements updated_at
CREATE TRIGGER update_monthly_statements_updated_at 
    BEFORE UPDATE ON portfolio_monthly_statements 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on monthly statements
ALTER TABLE portfolio_monthly_statements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for monthly statements
CREATE POLICY "Users can view own monthly statements" ON portfolio_monthly_statements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly statements" ON portfolio_monthly_statements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly statements" ON portfolio_monthly_statements
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly statements" ON portfolio_monthly_statements
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON portfolio_monthly_statements TO authenticated;

-- Create a function to calculate monthly mortgage payment
CREATE OR REPLACE FUNCTION calculate_mortgage_payment(
  loan_amount DECIMAL,
  annual_rate DECIMAL,
  loan_term_years INTEGER,
  mortgage_type TEXT
) RETURNS DECIMAL AS $$
DECLARE
  monthly_rate DECIMAL;
  total_payments INTEGER;
  payment DECIMAL;
BEGIN
  monthly_rate := annual_rate / 12;
  total_payments := loan_term_years * 12;
  
  IF mortgage_type = 'interest_only' THEN
    payment := loan_amount * monthly_rate;
  ELSE
    -- Repayment mortgage calculation
    payment := loan_amount * (monthly_rate * POWER(1 + monthly_rate, total_payments)) / 
               (POWER(1 + monthly_rate, total_payments) - 1);
  END IF;
  
  RETURN ROUND(payment, 2);
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate property yield
CREATE OR REPLACE FUNCTION calculate_property_yield(
  annual_rent DECIMAL,
  property_value DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  IF property_value > 0 THEN
    RETURN ROUND((annual_rent / property_value) * 100, 2);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate equity percentage
CREATE OR REPLACE FUNCTION calculate_equity_percentage(
  current_value DECIMAL,
  mortgage_balance DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  IF current_value > 0 THEN
    RETURN ROUND(((current_value - mortgage_balance) / current_value) * 100, 2);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql; 