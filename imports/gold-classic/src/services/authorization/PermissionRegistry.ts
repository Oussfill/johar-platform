// ============================================================================
// JOHAR — PERMISSION REGISTRY v1 (التنفيذ الفني للمصفوفة docs/JOHAR-PermissionMatrix-v1.md)
// ============================================================================
// السجل الرئيسي للصلاحيات المقننة. يغذي جدول Permission في قاعدة البيانات
// وعمليات التفويض المركزية. كل كود من المصفوفة القسم 2.
//
// minTier: أدنى مستوى تحقق (0..3) مطلوب.
// risk:    LOW/MEDIUM/HIGH/CRITICAL — يحدد مسار العملية.
// sensitive: يتطلب MFA + إعادة مصادقة + تدقيق إلزامي.

export interface PermissionDef {
  code: string;
  module: string;
  action: string;
  minTier: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'BLOCKED';
  sensitive?: boolean;
}

export const PERMISSION_REGISTRY: PermissionDef[] = [
  // ── account / profile / identity ─────────────────────────────────────────
  { code: 'account:create', module: 'account', action: 'create', minTier: 1, risk: 'LOW' },
  { code: 'account:read', module: 'account', action: 'read', minTier: 1, risk: 'LOW' },
  { code: 'account:update', module: 'account', action: 'update', minTier: 2, risk: 'MEDIUM', sensitive: true },
  { code: 'account:deactivate', module: 'account', action: 'deactivate', minTier: 2, risk: 'MEDIUM', sensitive: true },
  { code: 'account:mfa', module: 'account', action: 'mfa', minTier: 1, risk: 'LOW', sensitive: true },
  { code: 'account:sessions', module: 'account', action: 'sessions', minTier: 1, risk: 'MEDIUM', sensitive: true },
  { code: 'profile:view', module: 'profile', action: 'view', minTier: 1, risk: 'LOW' },
  { code: 'profile:update', module: 'profile', action: 'update', minTier: 1, risk: 'LOW' },
  { code: 'identity:submit', module: 'identity', action: 'submit', minTier: 2, risk: 'MEDIUM' },
  { code: 'identity:verify', module: 'identity', action: 'verify', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'identity:badge', module: 'identity', action: 'badge', minTier: 1, risk: 'LOW' },

  // ── organization / team ──────────────────────────────────────────────────
  { code: 'organization:create', module: 'organization', action: 'create', minTier: 2, risk: 'MEDIUM', sensitive: true },
  { code: 'organization:read', module: 'organization', action: 'read', minTier: 2, risk: 'LOW' },
  { code: 'organization:update', module: 'organization', action: 'update', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'organization:deactivate', module: 'organization', action: 'deactivate', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'team:invite', module: 'team', action: 'invite', minTier: 3, risk: 'MEDIUM', sensitive: true },
  { code: 'team:assignrole', module: 'team', action: 'assignrole', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'team:suspend', module: 'team', action: 'suspend', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'team:remove', module: 'team', action: 'remove', minTier: 3, risk: 'HIGH', sensitive: true },

  // ── product / joharid / qrnfc ────────────────────────────────────────────
  { code: 'product:create', module: 'product', action: 'create', minTier: 2, risk: 'MEDIUM' },
  { code: 'product:read', module: 'product', action: 'read', minTier: 1, risk: 'LOW' },
  { code: 'product:update', module: 'product', action: 'update', minTier: 2, risk: 'MEDIUM', sensitive: true },
  { code: 'product:archive', module: 'product', action: 'archive', minTier: 2, risk: 'MEDIUM', sensitive: true },
  { code: 'product:classify', module: 'product', action: 'classify', minTier: 2, risk: 'MEDIUM' },
  { code: 'joharid:create', module: 'joharid', action: 'create', minTier: 2, risk: 'MEDIUM', sensitive: true },
  { code: 'joharid:read', module: 'joharid', action: 'read', minTier: 0, risk: 'LOW' },
  { code: 'joharid:verify', module: 'joharid', action: 'verify', minTier: 0, risk: 'LOW' },
  { code: 'joharid:associate', module: 'joharid', action: 'associate', minTier: 2, risk: 'MEDIUM', sensitive: true },
  { code: 'joharid:transfer', module: 'joharid', action: 'transfer', minTier: 2, risk: 'HIGH', sensitive: true },
  { code: 'qrnfc:generate', module: 'qrnfc', action: 'generate', minTier: 2, risk: 'MEDIUM' },
  { code: 'qrnfc:associate', module: 'qrnfc', action: 'associate', minTier: 2, risk: 'MEDIUM', sensitive: true },
  { code: 'qrnfc:read', module: 'qrnfc', action: 'read', minTier: 0, risk: 'LOW' },
  { code: 'qrnfc:revoke', module: 'qrnfc', action: 'revoke', minTier: 2, risk: 'HIGH', sensitive: true },

  // ── inventory / listing / order / transaction ────────────────────────────
  { code: 'inventory:create', module: 'inventory', action: 'create', minTier: 3, risk: 'MEDIUM' },
  { code: 'inventory:read', module: 'inventory', action: 'read', minTier: 3, risk: 'LOW' },
  { code: 'inventory:update', module: 'inventory', action: 'update', minTier: 3, risk: 'MEDIUM', sensitive: true },
  { code: 'inventory:adjust', module: 'inventory', action: 'adjust', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'listing:create', module: 'listing', action: 'create', minTier: 2, risk: 'MEDIUM' },
  { code: 'listing:read', module: 'listing', action: 'read', minTier: 0, risk: 'LOW' },
  { code: 'listing:update', module: 'listing', action: 'update', minTier: 2, risk: 'MEDIUM', sensitive: true },
  { code: 'listing:publish', module: 'listing', action: 'publish', minTier: 2, risk: 'MEDIUM' },
  { code: 'listing:unpublish', module: 'listing', action: 'unpublish', minTier: 2, risk: 'MEDIUM', sensitive: true },
  { code: 'order:create', module: 'order', action: 'create', minTier: 1, risk: 'MEDIUM' },
  { code: 'order:read', module: 'order', action: 'read', minTier: 1, risk: 'LOW' },
  { code: 'order:update', module: 'order', action: 'update', minTier: 1, risk: 'MEDIUM', sensitive: true },
  { code: 'order:cancel', module: 'order', action: 'cancel', minTier: 1, risk: 'MEDIUM', sensitive: true },
  { code: 'order:return', module: 'order', action: 'return', minTier: 2, risk: 'MEDIUM', sensitive: true },
  { code: 'order:fulfill', module: 'order', action: 'fulfill', minTier: 2, risk: 'MEDIUM', sensitive: true },
  { code: 'transaction:view', module: 'transaction', action: 'view', minTier: 2, risk: 'LOW' },
  { code: 'transaction:create', module: 'transaction', action: 'create', minTier: 2, risk: 'MEDIUM', sensitive: true },
  { code: 'transaction:confirm', module: 'transaction', action: 'confirm', minTier: 2, risk: 'HIGH', sensitive: true },
  { code: 'transaction:dispute', module: 'transaction', action: 'dispute', minTier: 2, risk: 'MEDIUM', sensitive: true },

  // ── documents / messages / logistics / escrow / finance ──────────────────
  { code: 'document:upload', module: 'document', action: 'upload', minTier: 1, risk: 'LOW' },
  { code: 'document:view', module: 'document', action: 'view', minTier: 1, risk: 'LOW' },
  { code: 'document:download', module: 'document', action: 'download', minTier: 1, risk: 'LOW' },
  { code: 'document:verify', module: 'document', action: 'verify', minTier: 0, risk: 'LOW' },
  { code: 'document:revoke', module: 'document', action: 'revoke', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'message:send', module: 'message', action: 'send', minTier: 1, risk: 'LOW' },
  { code: 'message:read', module: 'message', action: 'read', minTier: 1, risk: 'LOW' },
  { code: 'notification:read', module: 'notification', action: 'read', minTier: 1, risk: 'LOW' },
  { code: 'logistics:create', module: 'logistics', action: 'create', minTier: 3, risk: 'MEDIUM' },
  { code: 'logistics:read', module: 'logistics', action: 'read', minTier: 1, risk: 'LOW' },
  { code: 'logistics:update', module: 'logistics', action: 'update', minTier: 3, risk: 'MEDIUM', sensitive: true },
  { code: 'escrow:view', module: 'escrow', action: 'view', minTier: 2, risk: 'LOW' },
  { code: 'escrow:create', module: 'escrow', action: 'create', minTier: 2, risk: 'HIGH', sensitive: true },
  { code: 'escrow:confirm', module: 'escrow', action: 'confirm', minTier: 2, risk: 'HIGH', sensitive: true },
  { code: 'finance:invoice:create', module: 'finance', action: 'invoice:create', minTier: 3, risk: 'MEDIUM', sensitive: true },
  { code: 'finance:invoice:read', module: 'finance', action: 'invoice:read', minTier: 2, risk: 'LOW' },

  // ── ERP advanced — Phase 2 (المعمارية §4): suppliers / procurement / crm ──
  { code: 'supplier:create', module: 'supplier', action: 'create', minTier: 2, risk: 'MEDIUM' },
  { code: 'supplier:read', module: 'supplier', action: 'read', minTier: 2, risk: 'LOW' },
  { code: 'supplier:update', module: 'supplier', action: 'update', minTier: 2, risk: 'MEDIUM', sensitive: true },
  { code: 'supplier:evaluate', module: 'supplier', action: 'evaluate', minTier: 3, risk: 'MEDIUM' },
  { code: 'purchase:request', module: 'purchase', action: 'request', minTier: 2, risk: 'LOW' },
  { code: 'purchase:read', module: 'purchase', action: 'read', minTier: 2, risk: 'LOW' },
  { code: 'purchase:approve', module: 'purchase', action: 'approve', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'purchase:order', module: 'purchase', action: 'order', minTier: 2, risk: 'MEDIUM' },
  { code: 'purchase:receive', module: 'purchase', action: 'receive', minTier: 2, risk: 'MEDIUM' },
  { code: 'rfq:create', module: 'rfq', action: 'create', minTier: 2, risk: 'MEDIUM' },
  { code: 'rfq:read', module: 'rfq', action: 'read', minTier: 2, risk: 'LOW' },
  { code: 'rfq:choose', module: 'rfq', action: 'choose', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'crm:view', module: 'crm', action: 'view', minTier: 2, risk: 'LOW' },
  { code: 'crm:create', module: 'crm', action: 'create', minTier: 2, risk: 'MEDIUM' },
  { code: 'crm:update', module: 'crm', action: 'update', minTier: 2, risk: 'MEDIUM' },

  // ── Trust Levels 4–6 (معيار §12): بوابة ترقية الثقة الآلية بالجوارح ──
  { code: 'trust:view', module: 'trust', action: 'view', minTier: 1, risk: 'LOW' },
  { code: 'trust:apply', module: 'trust', action: 'apply', minTier: 2, risk: 'LOW' },
  { code: 'trust:evaluate', module: 'compliance', action: 'evaluate', minTier: 3, risk: 'HIGH', sensitive: true },
  // أدلة تفعيل البوابة (minTier>3): مزايا تُمنح فقط للمؤسسات متقدمة الثقة
  { code: 'supplier:trustedNetwork', module: 'supplier', action: 'trustedNetwork', minTier: 4, risk: 'LOW' },
  { code: 'product:premiumCertified', module: 'product', action: 'premiumCertified', minTier: 6, risk: 'MEDIUM' },

  // ── reports / api ─────────────────────────────────────────────────────────
  { code: 'report:view', module: 'report', action: 'view', minTier: 2, risk: 'LOW' },
  { code: 'report:export', module: 'report', action: 'export', minTier: 2, risk: 'MEDIUM' },
  { code: 'api:keys:manage', module: 'api', action: 'keys:manage', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'api:read', module: 'api', action: 'read', minTier: 3, risk: 'LOW' },
  { code: 'api:write', module: 'api', action: 'write', minTier: 3, risk: 'MEDIUM' },

  // ── platform / internal (فصل المهام — المصفوفة القسم 6 والمواصفة §28) ────
  { code: 'assay:write', module: 'assay', action: 'write', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'custody:approve', module: 'custody', action: 'approve', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'notary:record', module: 'notary', action: 'record', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'registrar:issue', module: 'registrar', action: 'issue', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'lab:approve', module: 'lab', action: 'approve', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'kyc:approve', module: 'kyc', action: 'approve', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'kyb:approve', module: 'kyb', action: 'approve', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'cert:approve', module: 'cert', action: 'approve', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'compliance:read', module: 'compliance', action: 'read', minTier: 3, risk: 'LOW' },
  { code: 'compliance:review', module: 'compliance', action: 'review', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'compliance:decide', module: 'compliance', action: 'decide', minTier: 3, risk: 'CRITICAL', sensitive: true },
  { code: 'audit:read', module: 'audit', action: 'read', minTier: 3, risk: 'HIGH' },
  { code: 'audit:export', module: 'audit', action: 'export', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'admin:users', module: 'admin', action: 'users', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'admin:roles', module: 'admin', action: 'roles', minTier: 3, risk: 'CRITICAL', sensitive: true },
  { code: 'admin:settings', module: 'admin', action: 'settings', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'admin:products', module: 'admin', action: 'products', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'admin:blockchain', module: 'admin', action: 'blockchain', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'admin:nfc', module: 'admin', action: 'nfc', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'admin:b2b', module: 'admin', action: 'b2b', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'admin:workers', module: 'admin', action: 'workers', minTier: 3, risk: 'HIGH', sensitive: true },
  { code: 'admin:payments', module: 'admin', action: 'payments', minTier: 3, risk: 'HIGH', sensitive: true },
];

export const PERMISSION_MAP: ReadonlyMap<string, PermissionDef> = new Map(
  PERMISSION_REGISTRY.map((p) => [p.code, p]),
);

export function lookupPermission(code: string): PermissionDef | undefined {
  return PERMISSION_MAP.get(code);
}

// ============================================================================
// LEGACY → REGISTRY MAPPING (الشريحة 3: ترحيل المسارات القديمة)
// ============================================================================
// خرّط الأكواد القديمة من Role.permissions إلى نظيرها في السجل المقنن.
// تُستخدم في: (1) بذرة روابط RolePermission، (2) توثيق التوافق،
// (3) أي رد رجعي مستقبلي عند تقييم كود قديم.

export const LEGACY_CODE_MAP: Record<string, string[]> = {
  'assets:register': ['product:create', 'listing:create'],
  'assets:read': ['product:read'],
  'assets:update': ['product:update'],
  'erp:reconciliation': ['inventory:adjust'],
  'erp:dashboard': ['report:view'],
  'erp:fraud-alerts': ['compliance:read'],
  'audit:read': ['audit:read'],
  'custody:transfer': ['transaction:create'],
  'custody:approve': ['custody:approve'],
  'ai:analyze': ['product:classify'],
  'ai:fraud-check': ['compliance:read'],
  'assay:write': ['assay:write'],
};

// ============================================================================
// PLATFORM MODULES — وحدات المنصة الداخلية (فصل المهام — المصفوفة §6/§28)
// ============================================================================
// هذه الوحدات محكومة بدور المنصة والفصل (SoD) وليست ببوابات الترقية التدريجي:
// لا يُطبَّق عليها Tier GATE للعميل، بل دور المنصة + البوابة البنكية للمخاطرة.

export const PLATFORM_MODULES: ReadonlySet<string> = new Set([
  'assay', 'custody', 'notary', 'registrar', 'lab',
  'kyc', 'kyb', 'cert', 'compliance', 'audit', 'admin', 'api',
]);

// ============================================================================
// ORG ROLE → ORG PERMISSIONS (المصفوفة القسم 5)
// ============================================================================

export const ORG_ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: PERMISSION_REGISTRY.map((p) => p.code),
  ADMIN: [
    'team:invite', 'team:assignrole', 'team:suspend', 'team:remove',
    'organization:update', 'organization:read',
    'product:create', 'product:update', 'product:archive', 'product:classify',
    'listing:create', 'listing:update', 'listing:publish', 'listing:unpublish',
    'order:read', 'order:update', 'order:cancel', 'order:fulfill',
    'inventory:create', 'inventory:read', 'inventory:update', 'inventory:adjust',
    'document:upload', 'document:view', 'document:download', 'document:revoke',
    'finance:invoice:create', 'finance:invoice:read',
    'escrow:view', 'escrow:create', 'escrow:confirm',
    'report:view', 'report:export',
    // ERP advanced — Phase 2
    'supplier:create', 'supplier:read', 'supplier:update', 'supplier:evaluate',
    'purchase:request', 'purchase:read', 'purchase:approve', 'purchase:order', 'purchase:receive',
    'rfq:create', 'rfq:read', 'rfq:choose', 'crm:view', 'crm:create', 'crm:update',
    // Trust Levels 4–6 (§12): تطبيق/متابعة الترقية + مزايا الشبكة الموثوقة
    'trust:view', 'trust:apply', 'supplier:trustedNetwork', 'product:premiumCertified',
  ],
  SALES: [
    'product:read', 'product:create', 'product:update', 'product:classify',
    'listing:create', 'listing:update', 'listing:publish', 'listing:unpublish',
    'order:create', 'order:read', 'order:update', 'order:cancel', 'order:fulfill',
    'document:upload', 'document:view', 'message:send', 'message:read',
    // ERP advanced — Phase 2
    'crm:view', 'crm:create', 'crm:update', 'supplier:read',
    // Trust Levels 4–6 (§12)
    'trust:view', 'supplier:trustedNetwork', 'product:premiumCertified',
  ],
  PROCUREMENT: [
    'order:create', 'order:read', 'order:update', 'order:cancel',
    'document:upload', 'document:view', 'finance:invoice:read',
    'product:read', 'message:send', 'message:read',
    // ERP advanced — Phase 2 (sans الموافقات العليا — فصل مهام)
    'supplier:create', 'supplier:read', 'supplier:update',
    'purchase:request', 'purchase:read', 'purchase:order', 'purchase:receive',
    'rfq:create', 'rfq:read', 'crm:view', 'crm:create', 'crm:update',
    // Trust Levels 4–6 (§12)
    'trust:view', 'trust:apply', 'supplier:trustedNetwork',
  ],
  INVENTORY: [
    'inventory:create', 'inventory:read', 'inventory:update', 'inventory:adjust',
    'product:read', 'product:update', 'product:classify',
  ],
  LOGISTICS: [
    'logistics:create', 'logistics:read', 'logistics:update',
    'order:read', 'document:upload', 'document:view',
  ],
  FINANCE: [
    'finance:invoice:create', 'finance:invoice:read',
    'escrow:view', 'escrow:create', 'escrow:confirm',
    'report:view', 'report:export', 'order:read',
  ],
  COMPLIANCE: [
    'document:upload', 'document:view', 'document:download',
    'compliance:read', 'compliance:review',
    'identity:badge', 'order:read',
  ],
  VIEWER: [
    'product:read', 'listing:read', 'order:read', 'inventory:read',
    'report:view', 'document:view', 'logistics:read', 'finance:invoice:read',
  ],
};

// ============================================================================
// ACCOUNT TYPE → CAPABILITY DELTAS (المصفوفة القسم 4)
// ============================================================================

export const ACCOUNT_TYPE_DELTAS: Record<string, string[]> = {
  CUSTOMER: [],
  INDIVIDUAL_SELLER: [],
  PROFESSIONAL: [],
  COMPANY: [],
  MANUFACTURER: ['inventory:create', 'inventory:read', 'inventory:update', 'product:classify'],
  ARTISAN: ['product:create', 'joharid:associate'],
  TRADER: ['listing:create', 'listing:publish', 'inventory:create', 'inventory:read', 'inventory:update'],
  IMPORTER_EXPORTER: ['finance:invoice:create', 'logistics:create', 'logistics:update'],
  SUPPLIER: ['inventory:create', 'inventory:read', 'inventory:update', 'finance:invoice:create'],
  DISTRIBUTOR_WHOLESALER: ['inventory:create', 'inventory:read', 'inventory:update', 'listing:create', 'listing:publish'],
  LABORATORY: ['assay:write', 'document:verify', 'document:upload'],
  LOGISTICS_OPERATOR: ['logistics:create', 'logistics:update', 'logistics:read'],
  SERVICE_PROVIDER: ['api:read', 'message:send'],
  TECHNOLOGY_OPERATOR: ['api:keys:manage', 'api:read', 'api:write'],
  MINING_OPERATOR: ['product:classify', 'document:upload', 'finance:invoice:create'],
  INDUSTRIAL_OPERATOR: ['inventory:create', 'inventory:read', 'inventory:update', 'product:classify', 'finance:invoice:create'],
  INSTITUTIONAL: [],
};