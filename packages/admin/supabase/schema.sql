-- ============================================================
-- JOHAR — full schema (Supabase / PostgreSQL)
-- 38 tables covering every admin page + seed data.
-- RLS is DISABLED: the admin app uses the anon key without
-- Supabase Auth (auth is handled by the NestJS backend / Google),
-- so PostgREST must not restrict access. Restrict at the app/API
-- layer instead, or enable RLS + policies before production.
-- All identifiers ASCII / snake_case.
-- ============================================================
begin;

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Core identity
-- ------------------------------------------------------------
create table if not exists profiles (
  id          uuid primary key default gen_random_uuid(),
  full_name   text,
  email       text unique,
  avatar_url  text,
  phone       text,
  role        text not null default 'consumer',
  org_id      uuid,
  country     text,
  kyc_status  text not null default 'PENDING',
  balance     numeric(18,2) not null default 0,
  status      text not null default 'ACTIVE',
  two_factor  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table profiles add column if not exists country text;
alter table profiles add column if not exists kyc_status text not null default 'PENDING';
alter table profiles add column if not exists balance numeric(18,2) not null default 0;
alter table profiles add column if not exists phone text;

-- ------------------------------------------------------------
-- Assets
-- ------------------------------------------------------------
create table if not exists assets (
  id               uuid primary key default gen_random_uuid(),
  asset_code       text unique not null,
  asset_type       text not null default 'GOLD',
  name             text not null,
  grade            text,
  weight_grams     numeric(18,6) not null default 0,
  purity           numeric(18,6),
  status           text not null default 'VERIFIED',
  certificate_hash text,
  current_owner_id uuid references profiles(id) on delete set null,
  organization_id  uuid,
  laboratory_id    uuid,
  verified_at      timestamptz,
  custody_location text,
  created_by       uuid references profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_assets_owner  on assets(current_owner_id);
create index if not exists idx_assets_status on assets(status);
create index if not exists idx_assets_code   on assets(asset_code);

-- ------------------------------------------------------------
-- KYC / KYB / UBO
-- ------------------------------------------------------------
create table if not exists kyc_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete set null,
  type          text not null default 'INDIVIDUAL',
  status        text not null default 'PENDING',
  level         text not null default 'L1',
  name          text,
  country       text,
  risk          text not null default 'LOW',
  docs          integer not null default 0,
  documents     jsonb not null default '[]',
  note          text,
  reject_reason text,
  reviewed_by   uuid,
  reviewed_at   timestamptz,
  submitted_at  timestamptz not null default now()
);
create index if not exists idx_kyc_user  on kyc_requests(user_id);
create index if not exists idx_kyc_state on kyc_requests(status);

create table if not exists kyb_requests (
  id          uuid primary key default gen_random_uuid(),
  company     text,
  type        text,
  level       text default 'L2',
  country     text,
  status      text not null default 'PENDING',
  risk        text not null default 'LOW',
  submitted   text,
  created_at  timestamptz not null default now()
);

create table if not exists ubo_details (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  nationality text,
  ownership   text,
  company     text,
  status      text not null default 'ACTIVE',
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Lab / assay / equipment
-- ------------------------------------------------------------
create table if not exists lab_tests (
  id             uuid primary key default gen_random_uuid(),
  asset_id       uuid references assets(id) on delete set null,
  asset_code     text,
  status         text not null default 'REQUESTED',
  test_type      text not null default 'PURITY',
  certificate_no text,
  passed         boolean,
  result         jsonb,
  lab_id         uuid,
  report_url     text,
  requested_by   uuid references profiles(id) on delete set null,
  requested_at   timestamptz not null default now(),
  completed_at   timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists idx_lab_asset on lab_tests(asset_id);
create index if not exists idx_lab_state on lab_tests(status);

create table if not exists assay_results (
  id          uuid primary key default gen_random_uuid(),
  asset_code  text,
  test_type   text default 'PURITY',
  purity      numeric(9,4),
  weight      numeric(18,6),
  result      text default 'PASS',
  lab         text,
  technician  text,
  status      text not null default 'COMPLETED',
  tested_at   timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create table if not exists equipment (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  model       text,
  lab         text,
  location    text,
  acc         text,
  expiry      text,
  requests    integer not null default 0,
  rating      numeric(3,1),
  status      text not null default 'ACTIVE',
  last_cal    text,
  next_maint  text,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Logistics / custody / warehouses
-- ------------------------------------------------------------
create table if not exists shipments (
  id              uuid primary key default gen_random_uuid(),
  shipment_code   text,
  asset_id        uuid references assets(id) on delete set null,
  source          text,
  destination     text,
  carrier         text,
  tracking_number text,
  status          text not null default 'PENDING',
  insured_value   numeric(18,2),
  from_user_id    uuid references profiles(id) on delete set null,
  to_user_id      uuid references profiles(id) on delete set null,
  eta             timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists idx_ship_state on shipments(status);

create table if not exists custody_records (
  id            uuid primary key default gen_random_uuid(),
  asset_id      uuid references assets(id) on delete set null,
  asset_code    text,
  from_party    text,
  to_party      text,
  location      text,
  status        text not null default 'ACTIVE',
  transfer_hash text,
  created_at    timestamptz not null default now()
);

create table if not exists warehouses (
  id              uuid primary key default gen_random_uuid(),
  name            text,
  location        text,
  status          text not null default 'ACTIVE',
  used            integer not null default 0,
  capacity        integer not null default 0,
  value           numeric(18,2) not null default 0,
  manager         text,
  last_inspection text,
  created_at      timestamptz not null default now()
);

create table if not exists inventory (
  id          uuid primary key default gen_random_uuid(),
  code        text,
  type        text,
  weight      numeric(18,6),
  value       numeric(18,2),
  location    text,
  last_audit  text,
  status      text not null default 'IN_STOCK',
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Finance
-- ------------------------------------------------------------
create table if not exists finance_transactions (
  id               uuid primary key default gen_random_uuid(),
  txn_code         text,
  type             text,
  transaction_type text,
  amount           numeric(18,2) not null default 0,
  currency         text not null default 'USD',
  status           text not null default 'PENDING',
  description      text,
  asset_id         uuid,
  party_user_id    uuid references profiles(id) on delete set null,
  org_id           uuid,
  invoiced         boolean not null default false,
  invoice_url      text,
  created_at       timestamptz not null default now()
);
alter table finance_transactions add column if not exists transaction_type text;
create index if not exists idx_fin_status on finance_transactions(status);

create table if not exists invoices (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid,
  invoice_number text,
  amount         numeric(18,2) not null default 0,
  currency       text not null default 'USD',
  due_date       date,
  status         text not null default 'PENDING',
  created_at     timestamptz not null default now()
);

create table if not exists payments (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid,
  reference      text,
  amount         numeric(18,2) not null default 0,
  currency       text not null default 'USD',
  method         text default 'BANK_TRANSFER',
  status         text not null default 'PENDING',
  created_at     timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Marketplace
-- ------------------------------------------------------------
create table if not exists marketplace_offers (
  id             uuid primary key default gen_random_uuid(),
  offer_code     text,
  asset_id       uuid references assets(id) on delete set null,
  asset_code     text,
  type           text not null default 'SELL',
  asking_price   numeric(18,2) not null default 0,
  currency       text not null default 'USD',
  quantity_grams numeric(18,6),
  status         text not null default 'OPEN',
  seller_id      uuid references profiles(id) on delete set null,
  buyer_id       uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_offer_status on marketplace_offers(status);
create index if not exists idx_offer_asset  on marketplace_offers(asset_id);

create table if not exists negotiations (
  id             uuid primary key default gen_random_uuid(),
  offer_id       uuid,
  asset_id       uuid references assets(id) on delete set null,
  asset_code     text,
  buyer_id       uuid,
  seller_id      uuid references profiles(id) on delete set null,
  current_price  numeric(18,2) not null default 0,
  currency       text not null default 'USD',
  last_offer_by  text,
  status         text not null default 'OPEN',
  created_at     timestamptz not null default now()
);

create table if not exists auctions (
  id            uuid primary key default gen_random_uuid(),
  asset_id      uuid references assets(id) on delete set null,
  asset_code    text,
  start_price   numeric(18,2) not null default 0,
  current_bid   numeric(18,2),
  min_increment numeric(18,2) not null default 0,
  currency      text not null default 'USD',
  status        text not null default 'UPCOMING',
  ends_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Compliance / AML / sanctions / security
-- ------------------------------------------------------------
create table if not exists compliance_cases (
  id                uuid primary key default gen_random_uuid(),
  case_number       text,
  entity_id         uuid,
  entity_type       text,
  subject_type      text,
  subject_target_id uuid,
  status            text not null default 'OPEN',
  risk_level        text not null default 'LOW',
  flags             jsonb not null default '[]',
  findings          text,
  actioned_by       uuid,
  actioned_at       timestamptz,
  created_at        timestamptz not null default now()
);
alter table compliance_cases add column if not exists entity_id uuid;
alter table compliance_cases add column if not exists entity_type text;
create index if not exists idx_cases_state on compliance_cases(status);
create index if not exists idx_cases_risk  on compliance_cases(risk_level);

create table if not exists aml_checks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  status      text not null default 'CLEAR',
  risk_level  text not null default 'LOW',
  details     text,
  created_at  timestamptz not null default now()
);

create table if not exists sanctions_list (
  id           uuid primary key default gen_random_uuid(),
  entity_name  text,
  country      text,
  entity_type  text default 'ENTITY',
  dob          text,
  match_score  integer default 0,
  status       text not null default 'BLOCKED',
  created_at   timestamptz not null default now()
);

create table if not exists security_logs (
  id          uuid primary key default gen_random_uuid(),
  type        text not null default 'info',
  ip          text,
  user_id     uuid,
  action      text,
  severity    text not null default 'LOW',
  status      text not null default 'RESOLVED',
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Legal
-- ------------------------------------------------------------
create table if not exists contracts (
  id            uuid primary key default gen_random_uuid(),
  contract_type text,
  party_a       text,
  party_b       text,
  status        text not null default 'DRAFT',
  start_date    date,
  end_date      date,
  terms         text,
  created_at    timestamptz not null default now()
);

create table if not exists notary_records (
  id           uuid primary key default gen_random_uuid(),
  contract_id  uuid,
  notary_name  text,
  stamp_hash   text,
  status       text not null default 'PENDING',
  created_at   timestamptz not null default now()
);

create table if not exists legal_cases (
  id           uuid primary key default gen_random_uuid(),
  case_number  text,
  description  text,
  status       text not null default 'OPEN',
  country      text,
  authority    text,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- AI
-- ------------------------------------------------------------
create table if not exists ai_pricing (
  id              uuid primary key default gen_random_uuid(),
  asset_type      text,
  predicted_price numeric(18,2),
  confidence      numeric(5,2),
  timeframe       text,
  status          text not null default 'COMPLETED',
  created_at      timestamptz not null default now()
);

create table if not exists ai_fraud_alerts (
  id                uuid primary key default gen_random_uuid(),
  transaction_id    uuid,
  fraud_probability numeric(5,2),
  flag_reason       text,
  status            text not null default 'OPEN',
  created_at        timestamptz not null default now()
);

create table if not exists ai_risk_scores (
  id           uuid primary key default gen_random_uuid(),
  entity_id    uuid,
  entity_type  text,
  score        integer,
  risk_level   text default 'LOW',
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Ops / system
-- ------------------------------------------------------------
create table if not exists alerts (
  id          uuid primary key default gen_random_uuid(),
  type        text not null default 'info',
  title       text,
  description  text,
  entity      text,
  is_read     boolean not null default false,
  time        text,
  status      text not null default 'OPEN',
  created_at  timestamptz not null default now()
);
alter table alerts add column if not exists is_read boolean not null default false;

create table if not exists support_tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  subject     text,
  message     text,
  priority    text not null default 'normal',
  assigned_to text,
  status      text not null default 'open',
  created_at  timestamptz not null default now()
);

create table if not exists roles (
  id          uuid primary key default gen_random_uuid(),
  role_name   text,
  description text,
  permissions text,
  created_at  timestamptz not null default now()
);

create table if not exists kpi_metrics (
  id          uuid primary key default gen_random_uuid(),
  category    text,
  label       text,
  value       text,
  trend       text,
  current     numeric(18,2),
  unit        text,
  target      numeric(18,2),
  percent     integer,
  name        text,
  revenue     numeric(18,2),
  created_at  timestamptz not null default now()
);

create table if not exists companies (
  id                  uuid primary key default gen_random_uuid(),
  name                text,
  registration_number text,
  industry            text,
  type                text,
  country             text,
  kyb                 text default 'PENDING',
  employees           integer,
  volume              text,
  status              text not null default 'ACTIVE',
  created_at          timestamptz not null default now()
);

create table if not exists suppliers (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  country     text,
  material    text,
  delivery    text,
  rating      numeric(3,1),
  status      text not null default 'ACTIVE',
  created_at  timestamptz not null default now()
);

create table if not exists johar_passports (
  id          uuid primary key default gen_random_uuid(),
  asset_id    uuid references assets(id) on delete set null,
  asset       text,
  issued      text,
  updated     text,
  transfers   integer not null default 0,
  status      text not null default 'ACTIVE',
  created_at  timestamptz not null default now()
);

create table if not exists user_settings (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid,
  lang             text not null default 'ar',
  theme            text not null default 'dark',
  currency         text not null default 'USD',
  notifications_on boolean not null default true,
  two_factor       boolean not null default false,
  updated_at       timestamptz not null default now()
);

create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid,
  title      text not null,
  body       text,
  type       text not null default 'info',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_user on notifications(user_id, read);

create table if not exists audit_log (
  id           bigserial primary key,
  user_id      uuid,
  org_id       uuid,
  action       text not null,
  entity_type  text,
  entity_id    uuid,
  before_json  jsonb,
  after_json   jsonb,
  ip           text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_audit_user on audit_log(user_id, created_at);

-- ------------------------------------------------------------
-- RLS: disabled (app-layer auth). Enforce policies before prod.
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','assets','kyc_requests','kyb_requests','ubo_details',
    'lab_tests','assay_results','equipment','shipments','custody_records',
    'warehouses','inventory','finance_transactions','invoices','payments',
    'marketplace_offers','negotiations','auctions','compliance_cases','aml_checks',
    'sanctions_list','security_logs','contracts','notary_records','legal_cases',
    'ai_pricing','ai_fraud_alerts','ai_risk_scores','alerts','support_tickets',
    'roles','kpi_metrics','companies','suppliers','johar_passports',
    'user_settings','notifications','audit_log'
  ] loop
    execute format('alter table if exists %I disable row level security', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- Seed data
-- ------------------------------------------------------------
insert into profiles (id, full_name, email, role, country, kyc_status, balance, status)
values
  ('00000000-0000-0000-0000-000000000001','Oussama Filali','oussfil01@gmail.com','super_admin','MA','VERIFIED',0,'ACTIVE'),
  ('00000000-0000-0000-0000-000000000002','محمد أحمد العلي','mohammed@johar.demo','consumer','SA','VERIFIED',128500,'ACTIVE'),
  ('00000000-0000-0000-0000-000000000003','سارة محمود الحربي','sara@johar.demo','consumer','SA','PENDING',43200,'ACTIVE'),
  ('00000000-0000-0000-0000-000000000004','Gold Vault Ltd','vault@goldvault.demo','organizational','GB','VERIFIED',2450000,'ACTIVE'),
  ('00000000-0000-0000-0000-000000000005','NYC Gold Trading','nyc@nycgold.demo','organizational','US','REJECTED',0,'SUSPENDED'),
  ('00000000-0000-0000-0000-000000000006','Diamond Gallery','info@diamond.demo','organizational','AE','PENDING',98000,'ACTIVE')
on conflict (email) do nothing;

insert into assets (asset_code, asset_type, name, grade, weight_grams, purity, status, custody_location, current_owner_id, created_by)
select v.asset_code, v.asset_type, v.name, v.grade, v.weight_grams, v.purity, v.status, v.custody_location, v.owner, v.owner
from (values
  ('JOHAR-AU-DEMO-0001','GOLD','Gold 24K Bar','999.9',100,0.9999,'VERIFIED','Dubai Vault','00000000-0000-0000-0000-000000000002'::uuid),
  ('JOHAR-AU-DEMO-0002','GOLD','Gold 22K Coin','916',50,0.916,'VERIFIED','Riyadh Vault','00000000-0000-0000-0000-000000000003'::uuid),
  ('JOHAR-AG-DEMO-0003','SILVER','Silver 999 Bar','999',1000,0.999,'UNDER_REVIEW','Dubai Vault','00000000-0000-0000-0000-000000000004'::uuid),
  ('JOHAR-PT-DEMO-0004','PLATINUM','Platinum Bar','950',200,0.950,'IN_TRANSIT','In transit','00000000-0000-0000-0000-000000000006'::uuid)
) as v(asset_code,asset_type,name,grade,weight_grams,purity,status,custody_location,owner)
where not exists (select 1 from assets);

insert into kpi_metrics (category,label,value,trend,current,unit,target,percent,name,revenue) values
  ('assets','إجمالي الأصول المُوثّقة','12,480','+8.2%',12480,'أصل',15000,83,null,null),
  ('assets','الأصول قيد الفحص','312','-2.1%',312,'أصل',500,62,null,null),
  ('assets','الأصول المُسلّمة','11,970','+6.4%',11970,'أصل',14000,85,null,null),
  ('financial','حجم المعاملات','$248.5M','+12.4%',248500000,'USD',300000000,83,null,null),
  ('financial','الإيرادات','$4.2M','+9.8%',4200000,'USD',6000000,70,null,null),
  ('financial','المدفوعات المعلقة','$1.8M','-3.2%',1800000,'USD',0,0,null,null),
  ('users','إجمالي المستخدمين','8,942','+4.5%',8942,'مستخدم',12000,75,null,null),
  ('users','مستخدمون موثّقون','6,215','+5.1%',6215,'مستخدم',9000,69,null,null),
  ('users','طلبات KYC معلقة','87','+1.3%',87,'طلب',0,0,null,null),
  ('chart','يناير',null,null,null,null,null,null,'يناير',320000),
  ('chart','فبراير',null,null,null,null,null,null,'فبراير',410000),
  ('chart','مارس',null,null,null,null,null,null,'مارس',380000),
  ('chart','أبريل',null,null,null,null,null,null,'أبريل',520000),
  ('chart','مايو',null,null,null,null,null,null,'مايو',610000),
  ('chart','يونيو',null,null,null,null,null,null,'يونيو',590000),
  ('progress','الأصول الموثّقة',null,null,12480,'أصل',15000,83,null,null),
  ('progress','المستخدمون الموثّقون',null,null,6215,'مستخدم',9000,69,null,null),
  ('progress','رخص المختبرات',null,null,42,'رخصة',50,84,null,null)
on conflict do nothing;

insert into alerts (type,title,description,entity,is_read,time,status) values
  ('critical','محاولة غسل أموال مشتبه بها','معاملة بقيمة $450K تطابق نمطاً مشبوهاً','معاملة TXN-88213',false,'منذ 5 دقائق','OPEN'),
  ('warning','مستند KYC منتهي الصلاحية','انتهت صلاحية جواز السفر للمستخدم محمد أحمد العلي','KYC-1846',false,'منذ ساعتين','OPEN'),
  ('warning','انحراف في مختبر','نتيجة فحص نقاء خارج النطاق المتوقع','LAB-0091',false,'منذ 4 ساعات','OPEN'),
  ('info','اكتمال دفعة تسوية','تمت تسوية 128 معاملة بنجاح','دفعة BATCH-042',true,'أمس','RESOLVED')
on conflict do nothing;

insert into companies (name,registration_number,industry,type,country,kyb,employees,volume,status) values
  ('Royal Gold House','CR-1010101','تجارة الذهب','شركة','AE','APPROVED',120,'$45M','ACTIVE'),
  ('Gold Vault Ltd','GB-778899','تخزين آمن','شركة','GB','APPROVED',80,'$120M','ACTIVE'),
  ('NYC Gold Trading','US-445566','تداول','شركة','US','REJECTED',45,'$18M','SUSPENDED'),
  ('Diamond Gallery','AE-332211','مجوهرات','شركة','AE','PENDING',30,'$9M','ACTIVE')
on conflict do nothing;

insert into suppliers (name,country,material,delivery,rating,status) values
  ('سويس ري فاينري','CH','سبائك ذهب','98%',4.8,'ACTIVE'),
  ('Gulf Bullion','AE','عملات ذهبية','95%',4.5,'ACTIVE'),
  ('Rand Refinery','ZA','سبائك فضة','91%',4.1,'WARNING'),
  ('Perth Mint','AU','ذهب وفضة','99%',4.9,'ACTIVE')
on conflict do nothing;

insert into kyb_requests (company,type,level,country,status,risk,submitted) values
  ('Royal Gold House','شركة','L2','AE','PENDING','LOW','2026-09-12'),
  ('Gold Vault Ltd','شركة','L3','GB','APPROVED','LOW','2026-09-10'),
  ('NYC Gold Trading','شركة','L3','US','REJECTED','HIGH','2026-09-08')
on conflict do nothing;

insert into ubo_details (name,nationality,ownership,company,status) values
  ('محمد عبد الله','SA','60%','Royal Gold House','ACTIVE'),
  ('Sarah Jenkins','GB','25%','Gold Vault Ltd','ACTIVE'),
  ('John Carter','US','51%','NYC Gold Trading','SUSPENDED')
on conflict do nothing;

insert into equipment (name,model,lab,location,acc,expiry,requests,rating,status,last_cal,next_maint) values
  ('جهاز تحليل XRF','Olympus GoldXpert','مختبر دبي','Dubai','ISO-17025','2027-03-01',128,4.8,'ACTIVE','2026-03-01','2026-12-01'),
  ('ميزان دقيق','Mettler Toledo XPR','مختبر الرياض','Riyadh','ISO-17025','2026-11-15',96,4.6,'ACTIVE','2026-05-15','2026-11-15'),
  ('فرن صهر','Nabertherm L5','مختبر جنيف','Geneva','ISO-9001','2027-01-20',54,4.4,'MAINTENANCE','2025-11-20','2026-10-01')
on conflict do nothing;

insert into warehouses (name,location,status,used,capacity,value,manager,last_inspection) values
  ('خزنة دبي المركزية','Dubai, UAE','ACTIVE',720,1000,125000000,'Ahmed Al Mansoori','2026-08-15'),
  ('خزنة الرياض','Riyadh, KSA','ACTIVE',410,800,68000000,'Faisal Al Otaibi','2026-07-20'),
  ('خزنة جنيف','Geneva, CH','ACTIVE',180,500,94000000,'Luc Meyer','2026-09-01')
on conflict do nothing;

insert into inventory (code,type,weight,value,location,last_audit,status) values
  ('INV-0001','GOLD',1000,65000000,'Dubai Vault','2026-09-01','IN_STOCK'),
  ('INV-0002','SILVER',5000,4200000,'Riyadh Vault','2026-08-28','IN_STOCK'),
  ('INV-0003','PLATINUM',800,7800000,'Geneva Vault','2026-08-15','UNDER_AUDIT')
on conflict do nothing;

insert into assay_results (asset_code,test_type,purity,weight,result,lab,technician,status) values
  ('JOHAR-AU-DEMO-0001','PURITY',0.9999,100,'PASS','Dubai Lab','Hassan Ali','COMPLETED'),
  ('JOHAR-AU-DEMO-0002','PURITY',0.9160,50,'PASS','Riyadh Lab','Omar Khalid','COMPLETED'),
  ('JOHAR-AG-DEMO-0003','PURITY',0.9980,1000,'REVIEW','Dubai Lab','Hassan Ali','PENDING')
on conflict do nothing;

insert into johar_passports (asset,issued,updated,transfers,status) values
  ('JOHAR-AU-DEMO-0001','2026-01-10','2026-09-01',3,'ACTIVE'),
  ('JOHAR-AU-DEMO-0002','2026-02-14','2026-08-20',1,'ACTIVE'),
  ('JOHAR-AG-DEMO-0003','2026-03-05','2026-09-10',2,'UNDER_REVIEW')
on conflict do nothing;

insert into invoices (transaction_id,invoice_number,amount,due_date,status) values
  ('00000000-0000-0000-0000-000000000101','INV-2026-001',45000,'2026-10-01','PENDING'),
  ('00000000-0000-0000-0000-000000000102','INV-2026-002',120000,'2026-09-15','PAID'),
  ('00000000-0000-0000-0000-000000000103','INV-2026-003',78000,'2026-10-10','OVERDUE')
on conflict do nothing;

insert into payments (transaction_id,reference,amount,currency,method,status) values
  ('00000000-0000-0000-0000-000000000101','PAY-77001',45000,'USD','BANK_TRANSFER','PENDING'),
  ('00000000-0000-0000-0000-000000000102','PAY-77002',120000,'USD','WIRE','COMPLETED'),
  ('00000000-0000-0000-0000-000000000103','PAY-77003',78000,'USD','CARD','FAILED')
on conflict do nothing;

insert into negotiations (asset_code,buyer_id,seller_id,current_price,last_offer_by,status) values
  ('JOHAR-AU-DEMO-0001','00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000002',64500,'BUYER','OPEN'),
  ('JOHAR-AG-DEMO-0003','00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000004',4100,'SELLER','OPEN')
on conflict do nothing;

insert into auctions (asset_code,start_price,current_bid,min_increment,status,ends_at) values
  ('JOHAR-AU-DEMO-0001',60000,64500,500,'LIVE',now() + interval '2 days'),
  ('JOHAR-PT-DEMO-0004',14000,15000,250,'LIVE',now() + interval '5 days'),
  ('JOHAR-AG-DEMO-0003',3800,null,100,'UPCOMING',now() + interval '9 days')
on conflict do nothing;

insert into contracts (contract_type,party_a,party_b,status,start_date,end_date,terms) values
  ('SALE','Royal Gold House','Gold Vault Ltd','ACTIVE','2026-01-01','2026-12-31','عقد بيع وشراء'),
  ('CUSTODY','Diamond Gallery','خزنة دبي المركزية','ACTIVE','2026-03-15','2027-03-15','اتفاقية تخزين'),
  ('NDA','NYC Gold Trading','Royal Gold House','DRAFT','2026-09-01','2026-12-01','اتفاقية سرية')
on conflict do nothing;

insert into notary_records (notary_name,stamp_hash,status) values
  ('مكتب التوثيق دبي','a1b2c3d4e5f6','APPROVED'),
  ('Geneva Notary Office','f6e5d4c3b2a1','PENDING')
on conflict do nothing;

insert into legal_cases (case_number,description,status,country,authority) values
  ('LEG-2026-001','مراجعة ترخيص تجاري','OPEN','AE','وزارة الاقتصاد'),
  ('LEG-2026-002','نزاع تعاقدي','CLOSED','GB','محكمة لندن'),
  ('LEG-2026-003','تحديث ترخيص تصدير','PENDING','SA','هيئة التعدين')
on conflict do nothing;

insert into ai_pricing (asset_type,predicted_price,confidence,timeframe,status) values
  ('GOLD',2685.40,94,'7 أيام','COMPLETED'),
  ('SILVER',32.15,88,'7 أيام','COMPLETED'),
  ('PLATINUM',1024.80,90,'30 يوم','COMPLETED')
on conflict do nothing;

insert into ai_fraud_alerts (fraud_probability,flag_reason,status) values
  (92.5,'نمط تحويلات مشبوه','OPEN'),
  (78.1,'تباين جغرافي','REVIEWED'),
  (45.3,'قيمة معاملة غير معتادة','DISMISSED')
on conflict do nothing;

insert into ai_risk_scores (entity_id,entity_type,score,risk_level) values
  ('00000000-0000-0000-0000-000000000002','company',22,'LOW'),
  ('00000000-0000-0000-0000-000000000005','company',87,'HIGH'),
  ('00000000-0000-0000-0000-000000000006','company',54,'MEDIUM')
on conflict do nothing;

insert into aml_checks (user_id,status,risk_level,details) values
  ('00000000-0000-0000-0000-000000000002','CLEAR','LOW','لا توجد مطابقات'),
  ('00000000-0000-0000-0000-000000000005','FLAGGED','HIGH','مطابقة قوائم عقوبات'),
  ('00000000-0000-0000-0000-000000000003','CLEAR','LOW','مراجعة روتينية')
on conflict do nothing;

insert into sanctions_list (entity_name,country,entity_type,dob,match_score,status) values
  ('John Carter','US','INDIVIDUAL','1975-04-12',92,'BLOCKED'),
  ('Caspian Metals Ltd','IR','ENTITY',null,78,'UNDER_REVIEW'),
  ('Orion Trading Co','SY','ENTITY',null,85,'BLOCKED')
on conflict do nothing;

insert into security_logs (type,ip,action,severity,status) values
  ('critical','185.220.101.4','محاولات دخول فاشلة متكررة','HIGH','OPEN'),
  ('warning','103.44.12.9','تسجيل دخول من موقع جديد','MEDIUM','RESOLVED'),
  ('info','192.168.1.24','تغيير كلمة مرور','LOW','RESOLVED')
on conflict do nothing;

insert into compliance_cases (case_number,entity_id,entity_type,status,risk_level,findings) values
  ('CASE-2026-001','00000000-0000-0000-0000-000000000005','company','OPEN','HIGH','اشتباه في مصدر أموال'),
  ('CASE-2026-002','00000000-0000-0000-0000-000000000006','company','UNDER_REVIEW','MEDIUM','مستندات ناقصة')
on conflict do nothing;

insert into support_tickets (user_id,subject,message,priority,status) values
  ('00000000-0000-0000-0000-000000000002','مشكلة في التحقق','لم يتم قبول مستنداتي','high','open'),
  ('00000000-0000-0000-0000-000000000003','استفسار عن رسوم','ما هي رسوم التحويل؟','normal','open')
on conflict do nothing;

insert into roles (role_name,description,permissions) values
  ('super_admin','مسؤول أعلى','all'),
  ('compliance_officer','مسؤول الامتثال','read,review,flag'),
  ('lab_manager','مدير المختبر','read,test,certify'),
  ('finance_manager','مدير المالية','read,invoice,payment')
on conflict do nothing;

insert into custody_records (asset_code,from_party,to_party,location,status,transfer_hash) values
  ('JOHAR-AU-DEMO-0001','Gold Vault Ltd','خزنة دبي المركزية','Dubai Vault','ACTIVE','0x9f2a'),
  ('JOHAR-AG-DEMO-0003','Diamond Gallery','خزنة جنيف','Geneva Vault','ACTIVE','0x7b1c')
on conflict do nothing;

insert into marketplace_offers (offer_code,asset_id,asset_code,type,asking_price,currency,seller_id,status)
select 'OFF-2026-001', a.id, a.asset_code, 'SELL', 64500, 'USD', a.current_owner_id, 'OPEN'
from assets a where a.asset_code = 'JOHAR-AU-DEMO-0001'
and not exists (select 1 from marketplace_offers);

insert into marketplace_offers (offer_code,asset_id,asset_code,type,asking_price,currency,seller_id,status)
select 'OFF-2026-002', a.id, a.asset_code, 'SELL', 4100, 'USD', a.current_owner_id, 'OPEN'
from assets a where a.asset_code = 'JOHAR-AG-DEMO-0003'
and not exists (select 1 from marketplace_offers where offer_code = 'OFF-2026-002');

insert into lab_tests (asset_id,asset_code,status,test_type,requested_by)
select a.id, a.asset_code, 'REQUESTED', 'PURITY', a.current_owner_id
from assets a where a.asset_code = 'JOHAR-PT-DEMO-0004'
and not exists (select 1 from lab_tests);

insert into shipments (shipment_code,asset_id,destination,status,from_user_id,source)
select 'SHP-2026-001', a.id, 'Geneva Vault', 'IN_TRANSIT', a.current_owner_id, 'Dubai Vault'
from assets a where a.asset_code = 'JOHAR-PT-DEMO-0004'
and not exists (select 1 from shipments);

commit;
