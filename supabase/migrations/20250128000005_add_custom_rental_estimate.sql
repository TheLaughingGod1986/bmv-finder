-- Add custom rental estimate field to watchlist table
ALTER TABLE watchlist 
ADD COLUMN IF NOT EXISTS custom_rental_estimate DECIMAL(12,2) DEFAULT 0; 