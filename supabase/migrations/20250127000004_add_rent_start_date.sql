-- Add rent_start_date field to portfolio_properties table

-- Add the rent_start_date column
ALTER TABLE portfolio_properties 
ADD COLUMN IF NOT EXISTS rent_start_date DATE;

-- Add a comment to document the field
COMMENT ON COLUMN portfolio_properties.rent_start_date IS 'Date when rent started being collected for this property'; 