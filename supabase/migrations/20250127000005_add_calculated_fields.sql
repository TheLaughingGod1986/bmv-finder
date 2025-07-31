-- Add calculated fields to portfolio_properties table
ALTER TABLE portfolio_properties 
ADD COLUMN IF NOT EXISTS equity_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS monthly_profit DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_profit DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS yield_percentage DECIMAL(5,2);

-- Add comments to document the new fields
COMMENT ON COLUMN portfolio_properties.equity_percentage IS 'Calculated equity percentage (equity / current_value * 100)';
COMMENT ON COLUMN portfolio_properties.monthly_profit IS 'Calculated monthly profit (rent - mortgage - expenses)';
COMMENT ON COLUMN portfolio_properties.total_profit IS 'Calculated total profit over ownership period';
COMMENT ON COLUMN portfolio_properties.yield_percentage IS 'Calculated annual yield percentage (annual_rent / current_value * 100)'; 