const fs = require('fs');
const sql = `
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'assets', 'johar_passports', 'inventory', 'lab_tests', 'assay_results', 
    'equipment', 'shipments', 'custody_records', 'warehouses', 'finance_transactions', 
    'invoices', 'payments', 'marketplace_offers', 'negotiations', 'auctions', 
    'compliance_cases', 'aml_checks', 'sanctions_list', 'legal_cases', 'contracts', 
    'notary_records', 'ai_pricing', 'ai_fraud_alerts', 'ai_risk_scores', 'support_tickets', 
    'audit_logs', 'security_sessions', 'kyc_requests', 'kyb_requests', 'ubo_details', 
    'companies', 'suppliers', 'labs', 'alerts', 'kpi_metrics', 'workers'
  ];
BEGIN
  CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS boolean AS $func$
  BEGIN
    RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'super_admin' = ANY(roles));
  END;
  $func$ LANGUAGE plpgsql SECURITY DEFINER;

  FOR t IN SELECT unnest(tables)
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS owner_id UUID DEFAULT auth.uid()', t);
    EXCEPTION WHEN OTHERS THEN END;

    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS testing_permissive_policy ON %I', t);
    EXCEPTION WHEN OTHERS THEN END;
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS labs_permissive_policy ON %I', t);
    EXCEPTION WHEN OTHERS THEN END;
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS finance_transactions_permissive_policy ON %I', t);
    EXCEPTION WHEN OTHERS THEN END;

    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    BEGIN
      EXECUTE format('CREATE POLICY tenant_isolation_policy ON %I FOR ALL USING (auth.uid() = owner_id OR owner_id IS NULL OR public.is_super_admin())', t);
    EXCEPTION WHEN OTHERS THEN END;
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS testing_permissive_policy ON profiles;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profile_isolation ON profiles;
CREATE POLICY profile_isolation ON profiles FOR ALL USING (auth.uid() = id OR public.is_super_admin());
`;
fs.writeFileSync('rls_hardener.sql', sql);
