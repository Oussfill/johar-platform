-- Make KYC Requests fully permissive and add missing columns
ALTER TABLE IF EXISTS kyc_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "testing_permissive_policy" ON kyc_requests;
CREATE POLICY "testing_permissive_policy" ON kyc_requests FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE kyc_requests ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE kyc_requests ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE kyc_requests ADD COLUMN IF NOT EXISTS risk TEXT;
ALTER TABLE kyc_requests ADD COLUMN IF NOT EXISTS submitted TEXT;
ALTER TABLE kyc_requests ADD COLUMN IF NOT EXISTS docs INTEGER;

-- Make KYB Requests fully permissive and add missing columns
ALTER TABLE IF EXISTS kyb_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "testing_permissive_policy" ON kyb_requests;
CREATE POLICY "testing_permissive_policy" ON kyb_requests FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE kyb_requests ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE kyb_requests ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE kyb_requests ADD COLUMN IF NOT EXISTS level TEXT;
ALTER TABLE kyb_requests ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE kyb_requests ADD COLUMN IF NOT EXISTS submitted TEXT;

-- Make UBO Details fully permissive and add missing columns
ALTER TABLE IF EXISTS ubo_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "testing_permissive_policy" ON ubo_details;
CREATE POLICY "testing_permissive_policy" ON ubo_details FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE ubo_details ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE ubo_details ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE ubo_details ADD COLUMN IF NOT EXISTS ownership TEXT;
ALTER TABLE ubo_details ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE ubo_details ADD COLUMN IF NOT EXISTS status TEXT;

