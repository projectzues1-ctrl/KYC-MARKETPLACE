-- Email Verification Codes Table
CREATE TABLE IF NOT EXISTS "email_verification_codes" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "code" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Password Reset Codes Table
CREATE TABLE IF NOT EXISTS "password_reset_codes" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "code" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- 2FA Reset Codes Table
CREATE TABLE IF NOT EXISTS "two_factor_reset_codes" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "code" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Add missing columns to platform_wallet_controls
ALTER TABLE platform_wallet_controls 
ADD COLUMN IF NOT EXISTS total_deposited numeric(18, 8) NOT NULL DEFAULT '0',
ADD COLUMN IF NOT EXISTS total_swept numeric(18, 8) NOT NULL DEFAULT '0',
ADD COLUMN IF NOT EXISTS last_sweep_at timestamp;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "email_verification_codes_user_id_idx" ON "email_verification_codes"("user_id");
CREATE INDEX IF NOT EXISTS "password_reset_codes_user_id_idx" ON "password_reset_codes"("user_id");
CREATE INDEX IF NOT EXISTS "two_factor_reset_codes_user_id_idx" ON "two_factor_reset_codes"("user_id");
