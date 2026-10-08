// ============================================================================
// GOLD PLATFORM — ROLES & PERMISSIONS TYPE SYSTEM
// ============================================================================
// نظام الأدوار والصلاحيات — يحدد الأدوار التسعة والصلاحيات الـ 25 للصفحات

// ─── الأدوار التسعة ────────────────────────────────────────────────────────
export type RoleCode =
  | 'SA'   // Super Admin — مدير النظام الأعلى
  | 'OM'   // Operations Manager — مدير العمليات
  | 'LA'   // Lab Authority — مدير المختبر
  | 'NO'   // Notary — كاتب العدل
  | 'VM'   // Vault Manager — مدير الخزائن
  | 'DR'   // Digital Registrar — الكاتب الرقمي
  | 'ME'   // Merchant — التاجر
  | 'CU'   // Customer — الزبون
  | 'AU';  // Auditor — المفتتش

// ─── تسميات الأدوار ───────────────────────────────────────────────────────
export const ROLE_LABELS: Record<RoleCode, { AR: string; FR: string; EN: string }> = {
  SA: { AR: 'مدير النظام', FR: 'Super Admin', EN: 'Super Admin' },
  OM: { AR: 'مدير العمليات', FR: 'Directeur Opérations', EN: 'Operations Manager' },
  LA: { AR: 'مدير المختبر', FR: 'Autorité Labo', EN: 'Lab Authority' },
  NO: { AR: 'كاتب العدل', FR: 'Notaire', EN: 'Notary' },
  VM: { AR: 'مدير الخزائن', FR: 'Gestionnaire Coffres', EN: 'Vault Manager' },
  DR: { AR: 'كاتب رقمي', FR: 'Registraire Numérique', EN: 'Digital Registrar' },
  ME: { AR: 'تاجر', FR: 'Marchand', EN: 'Merchant' },
  CU: { AR: 'زبون', FR: 'Client', EN: 'Customer' },
  AU: { AR: 'مفتتش', FR: 'Auditeur', EN: 'Auditor' },
};

// ─── معرّفات الصفحات (25 صفحة) ───────────────────────────────────────────
export type PageId =
  // صفحات عامة
  | 'home'
  | 'marketplace'
  | 'marketplace-detail'
  | 'verify'
  | 'ai-assistant'
  // صفحات الزبون والتاجر
  | 'my-assets'
  | 'my-orders'
  | 'ownership-activate'
  // بوابة التوثيق
  | 'notary-dashboard'
  | 'notary-certify'
  | 'digital-registrar'
  | 'ownership-history'
  // الأصول والمخزون
  | 'erp-assets'
  | 'erp-assets-register'
  | 'erp-vaults'
  | 'erp-inventory-reconciliation'
  | 'erp-invariant-check'
  | 'erp-asset-mutations'
  // التحليل الإحصائي
  | 'statistics-analysis'
  // المختبرات
  | 'lab-requests'
  | 'lab-records'
  | 'lab-certificates'
  // الحيازة واللوجستيات
  | 'custody-chain'
  | 'custody-transfers'
  | 'custody-approvals'
  | 'logistics-tracking'
  // المالية
  | 'finance-treasury'
  | 'finance-escrow'
  | 'finance-pricing'
  | 'finance-invoices'
  // الأمان
  | 'security-fraud'
  | 'security-human-review'
  // الامتثال
  | 'compliance-kyc-aml'
  // النظام
  | 'admin-audit-logs'
  | 'admin-blockchain'
  | 'admin-users-rbac'
  | 'system-monitor'
  | 'admin-products'
  | 'admin-nfc'
  | 'admin-b2b'
  | 'admin-workers'
  // مركز التحكم المؤسسي (BRD §21)
  | 'control-center';

// ─── مصفوفة الصلاحيات لكل صفحة ──────────────────────────────────────────
export const PAGE_ACCESS: Record<PageId, RoleCode[]> = {
  // صفحات عامة
  home:                             ['SA', 'OM', 'LA', 'NO', 'VM', 'DR', 'ME', 'CU', 'AU'],
  marketplace:                      ['SA', 'OM', 'LA', 'NO', 'VM', 'DR', 'ME', 'CU', 'AU'],
  'marketplace-detail':             ['SA', 'OM', 'LA', 'NO', 'VM', 'DR', 'ME', 'CU', 'AU'],
  verify:                           ['SA', 'OM', 'LA', 'NO', 'VM', 'DR', 'ME', 'CU', 'AU'],
  'ai-assistant':                   ['SA', 'OM', 'LA', 'NO', 'VM', 'DR', 'ME', 'CU', 'AU'],

  // صفحات الزبون والتاجر
  'my-assets':                      ['CU', 'ME', 'SA'],
  'my-orders':                      ['CU', 'ME', 'SA'],
  'ownership-activate':             ['CU', 'SA'],

  // بوابة التوثيق
  'notary-dashboard':               ['NO', 'SA'],
  'notary-certify':                 ['NO', 'SA'],
  'digital-registrar':              ['DR', 'SA'],
  'ownership-history':              ['AU', 'SA', 'NO'],

  // الأصول والمخزون
  'erp-assets':                     ['SA', 'OM', 'VM', 'ME'],
  'erp-assets-register':            ['SA', 'OM', 'ME'],
  'erp-vaults':                     ['SA', 'OM', 'VM'],
  'erp-inventory-reconciliation':   ['SA', 'OM', 'AU'],
  'erp-invariant-check':            ['SA', 'OM', 'AU'],
  'erp-asset-mutations':            ['SA', 'OM'],
  'statistics-analysis':            ['SA', 'OM', 'LA', 'NO', 'VM', 'DR', 'ME', 'CU', 'AU'],

  // المختبرات
  'lab-requests':                   ['SA', 'OM', 'LA'],
  'lab-records':                    ['LA', 'SA'],
  'lab-certificates':               ['LA', 'SA'],

  // الحيازة واللوجستيات
  'custody-chain':                  ['SA', 'OM', 'VM', 'AU'],
  'custody-transfers':              ['SA', 'OM', 'VM'],
  'custody-approvals':              ['SA', 'OM'],
  'logistics-tracking':             ['SA', 'OM', 'VM'],

  // المالية
  'finance-treasury':               ['SA', 'OM', 'AU'],
  'finance-escrow':                 ['SA', 'OM', 'AU'],
  'finance-pricing':                ['SA', 'OM'],
  'finance-invoices':               ['SA', 'OM', 'AU'],

  // الأمان
  'security-fraud':                 ['SA', 'OM', 'AU'],
  'security-human-review':          ['SA', 'AU'],

  // الامتثال
  'compliance-kyc-aml':             ['SA', 'AU'],

  // النظام
  'admin-audit-logs':               ['SA', 'AU'],
  'admin-blockchain':               ['SA', 'AU'],
  'admin-users-rbac':               ['SA'],
  'system-monitor':                 ['SA', 'OM', 'AU'],
  'admin-products':                 ['SA', 'OM'],
  'admin-nfc':                       ['SA', 'OM'],
  'admin-b2b':                       ['SA', 'OM'],
  'admin-workers':                   ['SA', 'OM'],
  'control-center':                  ['SA', 'OM', 'AU'],
};

// ─── مسارات URL لكل صفحة ──────────────────────────────────────────────────
export const PAGE_PATHS: Record<PageId, string> = {
  home:                            '/',
  marketplace:                     '/marketplace',
  'marketplace-detail':            '/marketplace/:id',
  verify:                          '/verify/:passport_id',
  'ai-assistant':                  '/ai-assistant',
  'my-assets':                     '/app/my-assets',
  'my-orders':                     '/app/my-orders',
  'ownership-activate':            '/app/ownership/activate',
  'notary-dashboard':              '/portal/notary/dashboard',
  'notary-certify':                '/portal/notary/certify',
  'digital-registrar':             '/services/digital-registrar',
  'ownership-history':             '/portal/ownership/history',
  'erp-assets':                    '/erp/assets',
  'erp-assets-register':           '/erp/assets/register',
  'erp-vaults':                    '/erp/vaults',
  'erp-inventory-reconciliation':  '/erp/inventory/reconciliation',
  'erp-invariant-check':           '/erp/invariant-check',
  'erp-asset-mutations':           '/erp/assets/mutations',
  'statistics-analysis':           '/analytics/statistics',
  'lab-requests':                  '/lab/requests',
  'lab-records':                   '/lab/records',
  'lab-certificates':              '/lab/certificates/issue',
  'custody-chain':                 '/custody/chain-of-custody',
  'custody-transfers':             '/custody/transfers',
  'custody-approvals':             '/custody/approvals',
  'logistics-tracking':            '/logistics/tracking',
  'finance-treasury':              '/finance/treasury',
  'finance-escrow':                '/finance/escrow',
  'finance-pricing':               '/finance/pricing-engine',
  'finance-invoices':              '/finance/invoices',
  'security-fraud':                '/security/fraud-alerts',
  'security-human-review':         '/security/human-review',
  'compliance-kyc-aml':            '/compliance/kyc-aml',
  'admin-audit-logs':              '/admin/audit-logs',
  'admin-blockchain':              '/admin/blockchain-evidence',
  'admin-users-rbac':               '/admin/users-rbac',
  'system-monitor':                 '/system-monitor',
  'admin-products':                 '/admin/products',
  'admin-nfc':                       '/admin/nfc',
  'admin-b2b':                       '/admin/b2b',
  'admin-workers':                   '/admin/workers',
  'control-center':                  '/control-center',
};

// ─── تسميات الصفحات (عربي/إنجليزي) ──────────────────────────────────────
export const PAGE_LABELS: Record<PageId, { AR: string; FR: string; EN: string; icon: string; group: string }> = {
  // عامة
  home:                   { AR: 'الرئيسية',               FR: 'Accueil',                EN: 'Home',                   icon: '🏠', group: 'public' },
  marketplace:            { AR: 'السوق',                  FR: 'Marché',                 EN: 'Marketplace',            icon: '🏪', group: 'public' },
  'marketplace-detail':   { AR: 'تفاصيل المنتج',         FR: 'Détails Produit',        EN: 'Product Details',         icon: '📋', group: 'public' },
  verify:                 { AR: 'تحقق ميداني',           FR: 'Vérifier',               EN: 'Field Verify',            icon: '📱', group: 'public' },
  'ai-assistant':         { AR: 'مساعد ذكي',             FR: 'Assistant IA',           EN: 'AI Assistant',            icon: '🤖', group: 'public' },
  // زبون
  'my-assets':            { AR: 'أصولي',                 FR: 'Mes Actifs',             EN: 'My Assets',               icon: '💰', group: 'consumer' },
  'my-orders':            { AR: 'طلباتي',                FR: 'Mes Commandes',          EN: 'My Orders',               icon: '📦', group: 'consumer' },
  'ownership-activate':   { AR: 'تفعيل التمليك',        FR: 'Activer Propriété',      EN: 'Activate Ownership',      icon: '🔑', group: 'consumer' },
  // توثيق
  'notary-dashboard':     { AR: 'بوابة كاتب العدل',      FR: 'Portail Notaire',         EN: 'Notary Portal',           icon: '⚖️', group: 'notary' },
  'notary-certify':       { AR: 'توثيق العقد',           FR: 'Certifier Contrat',        EN: 'Certify Contract',         icon: '✍️', group: 'notary' },
  'digital-registrar':    { AR: 'كاتب رقمي',             FR: 'Registraire Numérique',    EN: 'Digital Registrar',        icon: '📝', group: 'notary' },
  'ownership-history':    { AR: 'سجل التمليك',           FR: 'Historique Propriété',     EN: 'Ownership History',        icon: '📜', group: 'notary' },
  // أصول
  'erp-assets':           { AR: 'سجل الأصول',            FR: 'Registre Actifs',          EN: 'Asset Registry',           icon: '📦', group: 'assets' },
  'erp-assets-register':  { AR: 'تسجيل أصل',            FR: 'Enregistrer Actif',        EN: 'Register Asset',           icon: '➕', group: 'assets' },
  'erp-vaults':           { AR: 'الخزائن والمخازن',      FR: 'Coffres & Entrepôts',      EN: 'Vaults & Warehouses',     icon: '🏦', group: 'assets' },
  'erp-inventory-reconciliation': { AR: 'مطابقة المخزون', FR: 'Réconciliation Stock',    EN: 'Inventory Reconciliation', icon: '🔍', group: 'assets' },
  'erp-invariant-check':          { AR: 'فحص ثبات الحفظ', FR: 'Invariance',              EN: 'Conservation Check',      icon: '⚖️', group: 'assets' },
  'erp-asset-mutations':          { AR: 'دمج وتقسيم الأصول', FR: 'Fusion & Division',    EN: 'Merge & Split',           icon: '🔀', group: 'assets' },
  'statistics-analysis':          { AR: 'التحليل الإحصائي', FR: 'Analyse Statistique',   EN: 'Statistics Analysis',     icon: '📊', group: 'public' },
  // مختبر
  'lab-requests':         { AR: 'طلبات الفحص',           FR: 'Demandes Labo',            EN: 'Lab Requests',             icon: '🔬', group: 'lab' },
  'lab-records':          { AR: 'سجلات المختبر',         FR: 'Registres Labo',           EN: 'Lab Records',              icon: '📊', group: 'lab' },
  'lab-certificates':     { AR: 'إصدار شهادات',          FR: 'Émettre Certificats',      EN: 'Issue Certificates',       icon: '📜', group: 'lab' },
  // حيازة
  'custody-chain':        { AR: 'سلسلة الحيازة',        FR: 'Chaîne de Garde',          EN: 'Chain of Custody',         icon: '🔗', group: 'custody' },
  'custody-transfers':    { AR: 'نقل الحيازة',           FR: 'Transferts de Garde',      EN: 'Custody Transfers',        icon: '🚚', group: 'custody' },
  'custody-approvals':    { AR: 'اعتمادات ثنائية',       FR: 'Double Approbation',       EN: 'Dual Approvals',          icon: '✅', group: 'custody' },
  'logistics-tracking':   { AR: 'التتبع اللوجستي',      FR: 'Suivi Logistique',         EN: 'Logistics Tracking',       icon: '📡', group: 'custody' },
  // مالي
  'finance-treasury':     { AR: 'الخزينة',               FR: 'Trésorerie',               EN: 'Treasury',                 icon: '💰', group: 'finance' },
  'finance-escrow':       { AR: 'الضمان المالي',        FR: 'Comptes Séquestre',        EN: 'Escrow Accounts',          icon: '🔒', group: 'finance' },
  'finance-pricing':      { AR: 'محرك التسعير',         FR: 'Moteur de Prix',           EN: 'Pricing Engine',           icon: '💲', group: 'finance' },
  'finance-invoices':     { AR: 'الفواتير',             FR: 'Factures',                 EN: 'Invoices',                 icon: '🧾', group: 'finance' },
  // أمان
  'security-fraud':       { AR: 'كشف الاحتيال',         FR: 'Alertes Fraude',           EN: 'Fraud Alerts',             icon: '🛡️', group: 'security' },
  'security-human-review':{ AR: 'المراجعة البشرية',      FR: 'Revue Humaine',            EN: 'Human Review',             icon: '👤', group: 'security' },
  // امتثال
  'compliance-kyc-aml':   { AR: 'KYC / AML',             FR: 'KYC / AML',                EN: 'KYC / AML',                icon: '⚖️', group: 'compliance' },
  // نظام
  'admin-audit-logs':     { AR: 'سجل التدقيق',          FR: 'Journal d\'Audit',         EN: 'Audit Logs',               icon: '📋', group: 'admin' },
  'admin-blockchain':     { AR: 'الأدلة المشفرة',       FR: 'Preuves Blockchain',       EN: 'Blockchain Evidence',      icon: '⛓️', group: 'admin' },
  'admin-users-rbac':               { AR: 'إدارة المستخدمين',      FR: 'Gestion Utilisateurs',     EN: 'User Management',          icon: '👥', group: 'admin' },
  'system-monitor':                 { AR: 'مراقبة النظام',         FR: 'Surveillance du système',  EN: 'System Monitor',           icon: '📊', group: 'admin' },
  'admin-products':                 { AR: 'إدارة المنتجات',        FR: 'Gestion des produits',     EN: 'Product Management',      icon: '📦', group: 'admin' },
  'admin-nfc':                       { AR: 'إدارة بطاقات NFC',      FR: 'Gestion des cartes NFC',  EN: 'NFC Card Management',    icon: '📡', group: 'admin' },
  'admin-b2b':                       { AR: 'الخدمات العامة',        FR: 'Services publics',        EN: 'Public Services',        icon: '🌐', group: 'admin' },
  'admin-workers':                   { AR: 'إدارة العمال والرواتب', FR: 'Personnel & Paie',       EN: 'Workers & Payroll',      icon: '👷', group: 'finance' },
  'control-center':                  { AR: 'مركز التحكم',           FR: 'Centre de Contrôle',    EN: 'Control Center',        icon: '🧭', group: 'admin' },
};

// ─── مجموعات الصفحات في الشريط الجانبي ────────────────────────────────────
export const SIDEBAR_GROUPS: { id: string; AR: string; FR: string; EN: string; pages: PageId[] }[] = [
  { id: 'public',    AR: 'عام',               FR: 'Public',           EN: 'Public',           pages: ['home', 'marketplace', 'verify', 'ai-assistant', 'statistics-analysis'] },
  { id: 'consumer',  AR: 'حسابي',              FR: 'Mon Compte',       EN: 'My Account',       pages: ['my-assets', 'my-orders', 'ownership-activate'] },
  { id: 'notary',    AR: 'التوثيق',            FR: 'Notariat',         EN: 'Notary',           pages: ['notary-dashboard', 'notary-certify', 'digital-registrar', 'ownership-history'] },
  { id: 'assets',    AR: 'الأصول والمخزون',    FR: 'Actifs & Stocks',  EN: 'Assets & Inventory', pages: ['erp-assets', 'erp-assets-register', 'erp-vaults', 'erp-inventory-reconciliation', 'erp-invariant-check', 'erp-asset-mutations'] },
  { id: 'lab',       AR: 'المختبر',            FR: 'Laboratoire',      EN: 'Laboratory',       pages: ['lab-requests', 'lab-records', 'lab-certificates'] },
  { id: 'custody',   AR: 'الحيازة واللوجستيات',FR: 'Garde & Logistique', EN: 'Custody & Logistics', pages: ['custody-chain', 'custody-transfers', 'custody-approvals', 'logistics-tracking'] },
  { id: 'finance',   AR: 'المالية',            FR: 'Finance',          EN: 'Finance',          pages: ['finance-treasury', 'finance-escrow', 'finance-pricing', 'finance-invoices', 'admin-workers'] },
  { id: 'security',  AR: 'الأمان والامتثال',   FR: 'Sécurité & Conformité', EN: 'Security & Compliance', pages: ['security-fraud', 'security-human-review', 'compliance-kyc-aml'] },
  { id: 'admin',     AR: 'إدارة النظام',       FR: 'Administration',   EN: 'System Admin',     pages: ['control-center', 'admin-audit-logs', 'admin-blockchain', 'admin-users-rbac', 'admin-products', 'admin-nfc', 'admin-b2b'] },
];

// ─── دوال مساعدة ──────────────────────────────────────────────────────────
export function canAccessPage(roleCode: RoleCode, pageId: PageId): boolean {
  const allowed = PAGE_ACCESS[pageId];
  if (!allowed) return false;
  return allowed.includes(roleCode);
}

export function getAccessiblePages(roleCode: RoleCode): PageId[] {
  return (Object.keys(PAGE_ACCESS) as PageId[]).filter(page => canAccessPage(roleCode, page));
}

export function getPathForPage(pageId: PageId): string {
  return PAGE_PATHS[pageId] || '/';
}
