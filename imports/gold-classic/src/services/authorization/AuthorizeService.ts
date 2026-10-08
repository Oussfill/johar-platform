// ============================================================================
// JOHAR — AUTHORIZATION SERVICE (التنفيذ المركزي للمصفوفة القسم 31)
// ============================================================================
// الرسالة: USER → AUTHENTICATION → ORGANIZATION → ROLE → PERMISSION →
//          ATTRIBUTE/SCOPE → RISK & COMPLIANCE → AUTHORIZATION → ACTION → AUDIT
//
// القاعدة الذهبية (المصفوفة القسم 32):
// allow = hasPermission(role) ∧ tierSatisfied ∧ scopeMatches ∧ riskGate
// ثم: ALLOW | REQUIRE_VERIFICATION | REQUIRE_REVIEW | BLOCK

import {
  lookupPermission,
  ORG_ROLE_PERMISSIONS,
  ACCOUNT_TYPE_DELTAS,
  PLATFORM_MODULES,
} from './PermissionRegistry';

export type DecisionAction =
  | 'ALLOW'
  | 'REQUIRE_VERIFICATION'
  | 'REQUIRE_REVIEW'
  | 'BLOCK';

export interface Decision {
  allowed: boolean;
  action: DecisionAction;
  permission: string;
  reason?: string;
  requireMfa?: boolean;
  requireReview?: boolean;
}

export interface AuthContext {
  userId: string;
  platformRoleCode: string;
  rolePermissions: string[]; // مجمّعة من Role.permissions + RolePermission + deltas النوع
  accountType?: string;
  verificationLevel?: number;
  orgRole?: string | null;
  activeOrgId?: string | null;
  orgTrustLevel?: number; // Trust Levels §12 — ثقة المؤسسة (0–6) للبوابة الصاعدة
  mfaConfirmed?: boolean;
}

export interface AuthorizeOptions {
  scope?: 'own' | 'org' | 'all' | 'platform';
}

function decide(
  allowed: boolean,
  action: DecisionAction,
  permission: string,
  extra: Partial<Decision> = {},
): Decision {
  return { allowed, action, permission, ...extra };
}

/**
 * إسراع القرار المعياري لعملية ما.
 * الافتراض: السياق يحتوي صلاحيات الدور المنصي + تلقت نوع الحساب مسبقاً.
 */
export function authorize(
  ctx: AuthContext,
  permissionCode: string,
  opts: AuthorizeOptions = {},
): Decision {
  const def = lookupPermission(permissionCode);

  if (!def) {
    return decide(false, 'BLOCK', permissionCode, {
      reason: 'PERMISSION_NOT_REGISTERED',
    });
  }

  // 1) AUTHORIZATION: هل يملك الدور (منصة أو مؤسسة) الصلاحية؟
  //      ملاحظة SoD: صلاحيات المؤسسة ونوع الحساب لا تمتد أبداً إلى وحدات المنصة
  //      الداخلية (approvals/audit/admin…) — تُمنح بدور المنصة فقط (المصفوفة §6).
  const legacyDef = def;
  const orgGrantable = !PLATFORM_MODULES.has(legacyDef.module);
  const platformHas =
    ctx.platformRoleCode === 'SUPER_ADMIN' ||
    ctx.rolePermissions.includes('*') ||
    ctx.rolePermissions.includes(permissionCode);
  const orgRolePermissions = ctx.orgRole
    ? ORG_ROLE_PERMISSIONS[ctx.orgRole] || []
    : [];
  const orgHas =
    ctx.activeOrgId && orgGrantable
      ? orgRolePermissions.includes(permissionCode)
      : false;
  const typeHas = orgGrantable
    ? (ACCOUNT_TYPE_DELTAS[ctx.accountType || 'CUSTOMER'] || []).includes(permissionCode)
    : false;

  const hasPermission = platformHas || orgHas || typeHas;

  if (!hasPermission) {
    return decide(false, 'BLOCK', permissionCode, { reason: 'PERMISSION_DENIED' });
  }

  // 2) POLICY (ABAC): المستخدم = USER + ACTIVE ORG فقط (مصفوفة القسم 15)
  if (opts.scope === 'org' && !ctx.activeOrgId && !ctx.orgRole) {
    return decide(false, 'BLOCK', permissionCode, { reason: 'NO_ACTIVE_ORG' });
  }

// 3) TIER GATE (المصفوفة القسم 1): REQUIRED VERIFICATION
  //      وحدات المنصة الداخلية (assay/custody/audit/erp…) تحكم بفصل المهام لا بالترقية التدريجي.
  //      مديرو المنصة الأعلى ودور '*' يتجاوزون Boise.
  const isMaster =
    ctx.platformRoleCode === 'SUPER_ADMIN' || ctx.rolePermissions.includes('*');
  // المستوى الفعّال: في سياق المؤسسة تُضمّن الثقة المؤسسية الصاعدة (§12 — المستويات 4–6)،
  // وإلا يبقى مستوى المستخدم الفردي.
  const baseLevel = ctx.verificationLevel ?? 1;
  const level = opts.scope === 'org'
    ? Math.max(baseLevel, ctx.orgTrustLevel ?? 0)
    : baseLevel;
  const isPlatformModule = PLATFORM_MODULES.has(def.module);
  if (!isMaster && !isPlatformModule && level < def.minTier) {
    return decide(false, 'REQUIRE_VERIFICATION', permissionCode, {
      reason: `MIN_TIER_${def.minTier}`,
    });
  }

  // 4) RISK GATE (المصفوفة القسم 9)
  if (def.risk === 'BLOCKED') {
    return decide(false, 'BLOCK', permissionCode, { reason: 'RISK_BLOCKED' });
  }

  if (def.risk === 'CRITICAL') {
    if (!ctx.mfaConfirmed) {
      return decide(false, 'BLOCK', permissionCode, { reason: 'MFA_REQUIRED' });
    }
    return decide(false, 'REQUIRE_REVIEW', permissionCode, {
      reason: 'DUAL_APPROVAL_REQUIRED',
      requireReview: true,
    });
  }

  const requireMfa = def.sensitive === true && !ctx.mfaConfirmed;
  const requireReview = def.risk === 'HIGH' && opts.scope !== 'platform';

  return decide(true, 'ALLOW', permissionCode, {
    requireMfa: requireMfa || undefined,
    requireReview: requireReview || undefined,
  });
}

/**
 * الدمج المباشر بين صلاحيات دور المنصة ودور المؤسسة ودلتا نوع الحساب.
 * تُستدعى عند بناء سياق التفويض (بعد المصادقة وقبل أي process).
 */
export function resolveEffectivePermissions(
  platformPermissions: string[],
  orgRole?: string | null,
  accountType?: string,
): string[] {
  const set = new Set(platformPermissions || []);
  if (orgRole) {
    (ORG_ROLE_PERMISSIONS[orgRole] || []).forEach((p) => set.add(p));
  }
  (ACCOUNT_TYPE_DELTAS[accountType || 'CUSTOMER'] || []).forEach((p) => set.add(p));
  return Array.from(set);
}

/**
 * إسقاط قرار الخدمة على رد HTTP موحّد.
 */
export function toHttpStatus(decision: Decision): number {
  switch (decision.action) {
    case 'ALLOW':
      return 200;
    case 'REQUIRE_VERIFICATION':
      return 428; // Precondition Required — الترقية للمستوى المطلوب
    case 'REQUIRE_REVIEW':
      return 423; // Locked — قيد المراجعة اليدوية
    case 'BLOCK':
    default:
      return 403;
  }
}