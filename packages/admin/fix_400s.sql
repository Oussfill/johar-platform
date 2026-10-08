-- Fix lab_tests foreign key
ALTER TABLE lab_tests ADD CONSTRAINT lab_tests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES profiles(id);

-- Check or create finance_transactions
CREATE TABLE IF NOT EXISTS finance_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_type TEXT,
    amount NUMERIC,
    currency TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT;
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS status TEXT;

-- Grant permissions for finance_transactions
GRANT ALL ON TABLE finance_transactions TO anon, authenticated, service_role;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_transactions_permissive_policy ON finance_transactions;
CREATE POLICY finance_transactions_permissive_policy ON finance_transactions FOR ALL USING (true) WITH CHECK (true);
