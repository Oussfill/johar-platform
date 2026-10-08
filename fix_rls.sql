-- ============================================================
-- JOHAR DATABASE RLS POLICIES FIX
-- This script enables permissive RLS policies for all tables 
-- so the frontend can read and write data during testing.
-- ============================================================

-- List of all tables to apply the policy to
DO 
DECLARE
    table_list text[] := ARRAY[
        'kpi_metrics', 'alerts', 'companies', 'suppliers', 
        'kyb_requests', 'ubo_details', 'johar_passports', 
        'inventory', 'assay_results', 'equipment', 
        'custody_records', 'warehouses', 'invoices', 
        'payments', 'negotiations', 'auctions', 
        'aml_checks', 'sanctions_list', 'security_logs', 
        'contracts', 'notary_records', 'legal_cases', 
        'ai_pricing', 'ai_fraud_alerts', 'ai_risk_scores', 
        'roles', 'support_tickets', 'assets', 'profiles', 
        'marketplace_offers', 'lab_tests', 'shipments', 
        'finance_transactions', 'compliance_cases'
    ];
    t text;
BEGIN
    FOREACH t IN ARRAY table_list
    LOOP
        -- Enable RLS just in case it's not enabled
        EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY;', t);
        
        -- Drop existing permissive policy if it exists to avoid duplication errors
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS ""testing_permissive_policy"" ON %I;', t);
        EXCEPTION WHEN undefined_object THEN
            -- Ignore
        END;

        -- Create a permissive policy that allows ALL operations for everyone (anon & authenticated)
        EXECUTE format('CREATE POLICY ""testing_permissive_policy"" ON %I FOR ALL USING (true) WITH CHECK (true);', t);
    END LOOP;
END ;
