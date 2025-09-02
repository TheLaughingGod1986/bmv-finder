-- Create portfolio management tables
-- Migration: 001_create_portfolio_tables.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address VARCHAR(500) NOT NULL,
    postcode VARCHAR(10) NOT NULL,
    property_type VARCHAR(100),
    bedrooms INTEGER,
    floor_area NUMERIC(10,2),
    epc_rating VARCHAR(2),
    last_sale_price NUMERIC(12,2),
    last_sale_date DATE,
    estimated_value NUMERIC(12,2),
    rental_estimate JSONB,
    market_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(address, postcode)
);

-- Portfolio Properties table (junction table)
CREATE TABLE IF NOT EXISTS portfolio_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    purchase_price NUMERIC(12,2),
    purchase_date DATE,
    estimated_value NUMERIC(12,2),
    last_valuation_date DATE,
    rental_income NUMERIC(12,2),
    expenses NUMERIC(12,2),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SOLD', 'RENTED', 'UNDER_OFFER')),
    UNIQUE(portfolio_id, property_id)
);

-- Portfolio Performance table
CREATE TABLE IF NOT EXISTS portfolio_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_value NUMERIC(15,2) NOT NULL,
    total_properties INTEGER NOT NULL,
    total_rental_income NUMERIC(12,2) NOT NULL,
    total_expenses NUMERIC(12,2) NOT NULL,
    net_return NUMERIC(12,2) NOT NULL,
    capital_growth NUMERIC(8,4) NOT NULL,
    rental_yield NUMERIC(8,4) NOT NULL,
    UNIQUE(portfolio_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_portfolio_id ON portfolio_properties(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_property_id ON portfolio_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_properties_address_postcode ON properties(address, postcode);
CREATE INDEX IF NOT EXISTS idx_portfolio_performance_portfolio_id ON portfolio_performance(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_performance_date ON portfolio_performance(date);

-- Create a default portfolio for existing users (if any)
-- This will be handled by the application logic

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts for portfolio management';
COMMENT ON TABLE portfolios IS 'User portfolios for organizing properties';
COMMENT ON TABLE properties IS 'Property data from various sources';
COMMENT ON TABLE portfolio_properties IS 'Properties within portfolios with additional metadata';
COMMENT ON TABLE portfolio_performance IS 'Historical portfolio performance snapshots';
