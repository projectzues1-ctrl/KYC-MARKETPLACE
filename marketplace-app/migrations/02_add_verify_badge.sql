-- Add missing has_verify_badge column to vendor_profiles table
-- This column tracks verification badge status for vendors

ALTER TABLE vendor_profiles 
ADD COLUMN IF NOT EXISTS has_verify_badge BOOLEAN DEFAULT FALSE NOT NULL;

-- Also add to orders table if missing
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS has_verify_badge BOOLEAN DEFAULT FALSE NOT NULL;
