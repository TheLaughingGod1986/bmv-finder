-- Add 'watchlist' status to portfolio_properties table
-- This allows properties added from the Chrome extension watchlist to be tracked separately

-- First, drop the existing constraint
ALTER TABLE portfolio_properties DROP CONSTRAINT IF EXISTS portfolio_properties_status_check;

-- Add the new constraint with 'watchlist' included
ALTER TABLE portfolio_properties ADD CONSTRAINT portfolio_properties_status_check 
  CHECK (status IN ('active', 'sold', 'watching', 'watchlist'));

-- Add comment to document the new status
COMMENT ON COLUMN portfolio_properties.status IS 'Property status: active (owned), sold (disposed), watching (potential), watchlist (from Chrome extension)'; 