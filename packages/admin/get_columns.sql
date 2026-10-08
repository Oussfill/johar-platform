SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND column_name IN ('user_id', 'owner_id', 'profile_id', 'org_id', 'tenant_id', 'client_id', 'requested_by');
