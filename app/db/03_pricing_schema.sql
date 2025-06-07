-- Create rate_type enum
CREATE TYPE rate_type AS ENUM ('hourly', 'daily', 'fixed');

-- Create rates table
CREATE TABLE rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rate_type rate_type NOT NULL DEFAULT 'hourly',
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    cost NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Add a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rates_updated_at
BEFORE UPDATE ON rates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_rates_name ON rates(name);
CREATE INDEX idx_rates_rate_type ON rates(rate_type);
CREATE INDEX idx_rates_is_active ON rates(is_active); 