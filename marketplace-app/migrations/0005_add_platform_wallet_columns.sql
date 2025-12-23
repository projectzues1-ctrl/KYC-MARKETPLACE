ALTER TABLE platform_wallet_controls 
ADD COLUMN IF NOT EXISTS total_deposited numeric(18,8) NOT NULL DEFAULT '0';

ALTER TABLE platform_wallet_controls 
ADD COLUMN IF NOT EXISTS total_swept numeric(18,8) NOT NULL DEFAULT '0';

ALTER TABLE platform_wallet_controls 
ADD COLUMN IF NOT EXISTS last_sweep_at timestamp;

ALTER TABLE platform_wallet_controls 
ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();
