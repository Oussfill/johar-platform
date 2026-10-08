-- Grant permissions for labs table
GRANT ALL ON TABLE labs TO anon, authenticated, service_role;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS labs_permissive_policy ON labs;
CREATE POLICY labs_permissive_policy ON labs FOR ALL USING (true) WITH CHECK (true);

-- Fix lab_tests constraints to avoid 400 errors when inserting from UI
ALTER TABLE lab_tests ALTER COLUMN asset_id DROP NOT NULL;
ALTER TABLE lab_tests ALTER COLUMN lab_id DROP NOT NULL;
