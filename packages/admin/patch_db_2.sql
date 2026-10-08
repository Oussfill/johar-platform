-- Fix equipment columns
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS lab TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS last_cal TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS next_maint TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS status TEXT;

-- Verify finance_transactions
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT;
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS status TEXT;

GRANT ALL ON TABLE equipment TO anon, authenticated, service_role;
GRANT ALL ON TABLE finance_transactions TO anon, authenticated, service_role;
