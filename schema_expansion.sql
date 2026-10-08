-- ============================================================
-- JOHAR DATABASE EXPANSION (Phase 3)
-- Adds all missing tables for the 40+ pages in the dashboard
-- ============================================================

-- 01. Dashboard
create table if not exists kpi_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  metric_value numeric not null,
  trend text,
  created_at timestamptz default now()
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  severity text default 'INFO',
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 02. Customers
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  registration_number text,
  industry text,
  status text default 'ACTIVE',
  created_at timestamptz default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  supply_type text,
  rating numeric,
  created_at timestamptz default now()
);

-- 03. KYC / KYB
create table if not exists kyb_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  status text default 'PENDING',
  documents jsonb,
  created_at timestamptz default now()
);

create table if not exists ubo_details (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  owner_name text,
  ownership_percentage numeric,
  status text default 'VERIFIED',
  created_at timestamptz default now()
);

-- 04. Assets
create table if not exists johar_passports (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id),
  passport_hash text unique,
  issue_date timestamptz default now(),
  status text default 'ACTIVE'
);

create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id),
  warehouse_id uuid,
  quantity numeric,
  last_audited timestamptz,
  created_at timestamptz default now()
);

-- 05. Lab
create table if not exists assay_results (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references lab_tests(id),
  element text,
  percentage numeric,
  created_at timestamptz default now()
);

create table if not exists equipment (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid,
  name text,
  calibration_date timestamptz,
  status text default 'OPERATIONAL',
  created_at timestamptz default now()
);

-- 06. Logistics
create table if not exists custody_records (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id),
  custodian text,
  transfer_date timestamptz,
  signature_hash text,
  created_at timestamptz default now()
);

create table if not exists warehouses (
  id uuid primary key default gen_random_uuid(),
  name text,
  location text,
  capacity_kg numeric,
  security_level text,
  created_at timestamptz default now()
);

-- 07. Finance
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references finance_transactions(id),
  invoice_number text unique,
  amount numeric,
  due_date timestamptz,
  status text default 'UNPAID',
  created_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id),
  amount numeric,
  payment_method text,
  status text default 'COMPLETED',
  created_at timestamptz default now()
);

-- 08. Marketplace
create table if not exists negotiations (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references marketplace_offers(id),
  buyer_id uuid references profiles(id),
  proposed_price numeric,
  status text default 'PENDING',
  created_at timestamptz default now()
);

create table if not exists auctions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id),
  start_price numeric,
  highest_bid numeric,
  end_time timestamptz,
  status text default 'LIVE',
  created_at timestamptz default now()
);

-- 09. Compliance
create table if not exists aml_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  risk_score numeric,
  status text default 'CLEARED',
  created_at timestamptz default now()
);

create table if not exists sanctions_list (
  id uuid primary key default gen_random_uuid(),
  entity_name text,
  country text,
  listed_on timestamptz,
  created_at timestamptz default now()
);

create table if not exists security_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text,
  ip_address text,
  details jsonb,
  created_at timestamptz default now()
);

-- 10. Legal
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  party_a uuid references profiles(id),
  party_b uuid,
  contract_type text,
  status text default 'SIGNED',
  created_at timestamptz default now()
);

create table if not exists notary_records (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references contracts(id),
  notary_name text,
  stamp_hash text,
  created_at timestamptz default now()
);

create table if not exists legal_cases (
  id uuid primary key default gen_random_uuid(),
  case_number text,
  description text,
  status text default 'OPEN',
  created_at timestamptz default now()
);

-- 11. AI Pricing
create table if not exists ai_pricing (
  id uuid primary key default gen_random_uuid(),
  asset_type text,
  predicted_price numeric,
  confidence numeric,
  created_at timestamptz default now()
);

create table if not exists ai_fraud_alerts (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references finance_transactions(id),
  fraud_probability numeric,
  flag_reason text,
  created_at timestamptz default now()
);

create table if not exists ai_risk_scores (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid,
  entity_type text,
  score numeric,
  created_at timestamptz default now()
);

-- 12. Settings
create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  role_name text unique,
  permissions jsonb,
  created_at timestamptz default now()
);

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  subject text,
  message text,
  status text default 'OPEN',
  created_at timestamptz default now()
);
