-- Add floor plan links and size fields to captured_properties table

-- Add total_size field (JSONB to store value and unit)
ALTER TABLE captured_properties 
ADD COLUMN IF NOT EXISTS total_size JSONB;

-- Add floor_plan_links field (JSONB to store array of floor plan objects)
ALTER TABLE captured_properties 
ADD COLUMN IF NOT EXISTS floor_plan_links JSONB;

-- Add refurbishment_cost field
ALTER TABLE captured_properties 
ADD COLUMN IF NOT EXISTS refurbishment_cost DECIMAL(12,2) DEFAULT 0;

-- Add total_cost field (calculated field)
ALTER TABLE captured_properties 
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12,2) DEFAULT 0;

-- Create a function to calculate total cost
CREATE OR REPLACE FUNCTION calculate_total_cost()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_cost = COALESCE(NEW.price, 0) + COALESCE(NEW.refurbishment_cost, 0);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically calculate total cost
DROP TRIGGER IF EXISTS update_total_cost ON captured_properties;
CREATE TRIGGER update_total_cost 
    BEFORE INSERT OR UPDATE ON captured_properties 
    FOR EACH ROW 
    EXECUTE FUNCTION calculate_total_cost(); 