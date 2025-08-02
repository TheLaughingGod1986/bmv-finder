-- Add size field to captured_properties table
ALTER TABLE captured_properties 
ADD COLUMN IF NOT EXISTS size TEXT;

-- Add index on size for efficient querying
CREATE INDEX IF NOT EXISTS idx_captured_properties_size ON captured_properties(size); 