const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT = path.join(__dirname, 'ppt-assets');

const PAGES = [
  { name: '01-landing', hash: '#/', desc: 'الصفحة العامة' },
  { name: '02-login', hash: '#/', desc: 'تسجيل الدخول' },
  { name: '03-dashboard', hash: '#/', desc: 'لوحة التحكم' },
  { name: '04-marketplace', hash: '#/marketplace', desc: 'السوق' },
  { name: '05-erp-assets', hash: '#/erp/assets', desc: 'سجل الأصول' },
  { name: '06-erp-vaults', hash: '#/erp/vaults', desc: 'الخزائن' },
  { name: '07-custody-chain', hash: '#/custody/chain-of-custody', desc: 'سلسلة الحيازة' },
  { name: '08-finance-treasury', hash: '#/finance/treasury', desc: 'الخزينة' },
  { name: '09-security-fraud', hash: '#/security/fraud-alerts', desc: 'كشف الاحتيال' },
  { name: '10-compliance', hash: '#/compliance/kyc-aml', desc: 'الامتثال' },
  { name: '11-system-monitor', hash: '#/system-monitor', desc: 'مراقبة النظام' },
  { name: '12-admin-products', hash: '#/admin/products', desc: 'إدارة المنتجات' },
  { name: '13-mobile', hash: '#/', desc: 'نسخة الهاتف' },
];

async function getAuthToken() {
  const res = await fetch(BASE + '/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gold-platform.com', password: 'GOLD@Admin2024!' }),
  });
  const json = await res.json();
  if (!json.success) throw new Error('Login failed: ' + JSON.stringify(json.error));
  return json.data;
}

(async () => {
  const fs = require('fs');
  fs.mkdirSync(OUT, { recursive: true });

  // Get real token from API
  const auth = await getAuthToken();
  const user = auth.user;
  console.log('Logged in as:', user.email, user.role);

  // The auth state the frontend expects in localStorage
  const authState = {
    'gold-token': auth.token,
    'gold-user': JSON.stringify({
      id: user.id, email: user.email, firstName: user.firstName || 'Admin',
      lastName: user.lastName || 'User', roleCode: user.role, hierarchy: user.hierarchy || 5,
      preferredLanguage: 'AR', preferredCurrency: 'DZD', mfaEnabled: false,
    }),
    'gold-lang': 'AR',
    'gold-currency': 'DZD',
  };

  const browser = await chromium.launch({
    executablePath: 'C:/Users/oussf/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe',
    headless: true,
  });

  // 1) Public landing (no auth)
  const pubCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ar-DZ' });
  const pubPage = await pubCtx.newPage();
  await pubPage.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  await pubPage.waitForTimeout(2500);
  await pubPage.screenshot({ path: path.join(OUT, '01-landing.png'), fullPage: false });

  // 2) Login page (click the header login button on public landing)
  try {
    const btns = pubPage.locator('header button');
    const count = await btns.count();
    console.log('header buttons:', count);
    for (let i = 0; i < count; i++) {
      const txt = await btns.nth(i).innerText().catch(() => '');
      console.log('  btn[' + i + ']:', JSON.stringify(txt));
      if (txt.includes('تسجيل') || txt.includes('ابدأ') || txt.includes('Sign') || txt.includes('Get')) {
        await btns.nth(i).click();
        await pubPage.waitForTimeout(2000);
        break;
      }
    }
  } catch (e) { console.log('login nav issue:', e.message); }
  await pubPage.screenshot({ path: path.join(OUT, '02-login.png'), fullPage: false });
  await pubCtx.close();

  // 3+) Authenticated pages: inject localStorage before load
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ar-DZ',
    storageState: { cookies: [], origins: [{ origin: BASE, localStorage: Object.entries(authState).map(([k, v]) => ({ name: k, value: v })) }] },
  });
  const page = await ctx.newPage();

  for (const p of PAGES.slice(2, 12)) {
    await page.goto(BASE + '/' + p.hash, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUT, p.name + '.png'), fullPage: false });
    console.log('captured', p.name, '-', p.desc);
  }

  // 13) Mobile view (authenticated, Arabic)
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'ar-DZ',
    storageState: { cookies: [], origins: [{ origin: BASE, localStorage: Object.entries(authState).map(([k, v]) => ({ name: k, value: v })) }] },
  });
  const mpage = await mctx.newPage();
  await mpage.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  await mpage.waitForTimeout(2500);
  await mpage.screenshot({ path: path.join(OUT, '13-mobile.png'), fullPage: false });

  await browser.close();
  console.log('DONE - screenshots saved to', OUT);
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
