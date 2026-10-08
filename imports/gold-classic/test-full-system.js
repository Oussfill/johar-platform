// ============================================================================
// GOLD PLATFORM — FULL SYSTEM TEST
// ============================================================================
// اختبار شامل لكل طبقات النظام: المصادقة، الأصول، الفحص، الحضانة، المالية، الموارد
// Test runner in PowerShell-compatible structure

const BASE = 'http://localhost:3000/api/v1';

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

let pass = 0;
let fail = 0;
let tokens = {};

function report(name, ok, detail = '') {
  if (ok) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${detail}`); }
}

async function run() {
  console.log('\n══════════════════════════════════════════════');
  console.log('  GOLD PLATFORM — FULL SYSTEM TEST');
  console.log('══════════════════════════════════════════════\n');

  // ─── 1. AUTHENTICATION ─────────────────────────────────────────
  console.log('▌ 1. AUTHENTICATION (6 accounts)');
  const accounts = [
    ['admin@gold-platform.com', 'SUPER_ADMIN'],
    ['custody@gold-platform.com', 'CUSTODY_MANAGER'],
    ['lab@gold-platform.com', 'LAB_DIRECTOR'],
    ['auditor@gold-platform.com', 'AUDITOR'],
    ['tech@gold-platform.com', 'LAB_TECHNICIAN'],
    ['seller@gold-platform.com', 'MARKETPLACE_SELLER'],
  ];
  for (const [email, expectedRole] of accounts) {
    const r = await req('POST', '/auth/login', { email, password: 'GOLD@Admin2024!' });
    const ok = r.status === 200 && r.json.data?.user?.role === expectedRole;
    report(`login(${email}) → ${expectedRole}`, ok, JSON.stringify(r.json).slice(0, 120));
    if (ok) tokens[expectedRole] = r.json.data.token;
  }

  // ─── 2. MAIN ENTITY COUNTS ─────────────────────────────────────
  console.log('\n▌ 2. ENTITY COUNTS (admin token)');
  const admin = tokens['SUPER_ADMIN'];
  const counts = { '/assets': [], '/erp/summary': [], '/vaults': [], '/marketplace': [], '/hr/employees': [], '/financial/summary': [], '/compliance/stats': [], '/audit/logs': [], '/system/health': [] };

  // Core entities
  const assetR = await req('GET', '/assets?limit=5', null, admin);
  report('GET /assets', assetR.status === 200, `status=${assetR.status}`);

  const vaultR = await req('GET', '/vaults', null, admin);
  report('GET /vaults', vaultR.status === 200, `status=${vaultR.status}`);

  const marketR = await req('GET', '/marketplace', null, admin);
  report('GET /marketplace', marketR.status === 200, `status=${marketR.status}`);

  // ─── 3. ERP SUMMARY ───────────────────────────────────────────
  console.log('\n▌ 3. ERP LAYER');
  const erp = await req('GET', '/erp/dashboard', null, admin);
  report('GET /erp/dashboard', erp.status === 200, `status=${erp.status}`);

  // ─── 4. HR LAYER ──────────────────────────────────────────────
  console.log('\n▌ 4. HR LAYER');
  const hr = await req('GET', '/hr/employees', null, admin);
  report('GET /hr/employees', hr.status === 200 && hr.json.data?.employees?.length > 0, `employees=${hr.json.data?.employees?.length}`);

  // ─── 5. FINANCIAL LAYER ───────────────────────────────────────
  console.log('\n▌ 5. FINANCIAL LAYER');
  const fin = await req('GET', '/financial/summary', null, admin);
  report('GET /financial/summary', fin.status === 200, `status=${fin.status}`);

  const prc = await req('GET', '/financial/pricing-engine', null, admin);
  report('GET /financial/pricing-engine', prc.status === 200, `status=${prc.status}`);

  // ─── 6. ASSAY LAYER ───────────────────────────────────────────
  console.log('\n▌ 6. ASSAY LAYER');
  const assay = await req('GET', '/assay/orders', null, admin);
  report('GET /assay/orders', assay.status === 200, `status=${assay.status}`);

  const lab = await req('GET', '/assay/lab-performance', null, admin);
  report('GET /assay/lab-performance', lab.status === 200, `status=${lab.status}`);

  // ─── 7. DIGITAL IDENTITY ──────────────────────────────────────
  console.log('\n▌ 7. DIGITAL IDENTITY');
  const di = await req('GET', '/digital-identity/passports', null, admin);
  report('GET /digital-identity/passports', di.status === 200, `status=${di.status}`);

  // ─── 8. COMPLIANCE ────────────────────────────────────────────
  console.log('\n▌ 8. COMPLIANCE');
  const comp = await req('GET', '/compliance/kyc-queue', null, admin);
  report('GET /compliance/kyc-queue', comp.status === 200, `status=${comp.status}`);

  const aml = await req('GET', '/compliance/aml-screening', null, admin);
  report('GET /compliance/aml-screening', aml.status === 200, `status=${aml.status}`);

  const audit = await req('GET', '/compliance/audit-logs', null, admin);
  report('GET /compliance/audit-logs', audit.status === 200, `status=${audit.status}`);

  // ─── 9. SYSTEM ────────────────────────────────────────────────
  console.log('\n▌ 9. SYSTEM LAYER');
  const sys = await req('GET', '/system/health', null, admin);
  report('GET /system/health', sys.status === 200, `status=${sys.status}`);

  const bc = await req('GET', '/system/blockchain-evidence', null, admin);
  report('GET /system/blockchain-evidence', bc.status === 200, `status=${bc.status}`);

  const keys = await req('GET', '/system/api-keys', null, admin);
  report('GET /system/api-keys', keys.status === 200, `status=${keys.status}`);

  // ─── 10. OWNERSHIP ────────────────────────────────────────────
  console.log('\n▌ 10. OWNERSHIP TRANSFER');
  const own = await req('GET', '/ownership/my-processes', null, admin);
  report('GET /ownership/my-processes', own.status === 200, `status=${own.status}`);

  // ─── 11. SECURITY: ROLE GATING ────────────────────────────────
  console.log('\n▌ 11. ROLE-BASED ACCESS CONTROL');
  // Seller should NOT access HR
  const sellerTok = tokens['MARKETPLACE_SELLER'];
  const hrBlocked = await req('GET', '/hr/employees', null, sellerTok);
  report('Seller blocked from /hr/employees', hrBlocked.status === 403 || hrBlocked.status === 401, `status=${hrBlocked.status}`);

  // Tech should NOT access financial
  const techTok = tokens['LAB_TECHNICIAN'];
  const finBlocked = await req('GET', '/financial/summary', null, techTok);
  report('Tech blocked from /financial/summary', finBlocked.status === 403 || finBlocked.status === 401, `status=${finBlocked.status}`);

  // ─── 12. INVALID AUTH ─────────────────────────────────────────
  console.log('\n▌ 12. AUTH SECURITY');
  const badTok = await req('GET', '/assets', null, 'invalid.token.here');
  report('Rejects invalid token', badTok.status === 401 || badTok.status === 403, `status=${badTok.status}`);

  const noTok = await req('GET', '/assets');
  report('Rejects no token', noTok.status === 401 || noTok.status === 403, `status=${noTok.status}`);

  // ─── SUMMARY ─────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════');
  console.log(`  RESULTS: ${pass} passed, ${fail} failed`);
  console.log('══════════════════════════════════════════════');
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});