// ============================================================================
// GOLD PLATFORM — RBAC AUTHORIZATION MIDDLEWARE
// ============================================================================
// middleware التحقق من صلاحيات الأدوار على مستوى الخادم
// يطبق مصفوفة الصلاحيات على كل مسار API — لا يكفي الجانب الأمامي فقط

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// ─── تعيين أدوار قاعدة البيانات ───────────────────────────────────────────
// DB roles → access groups
const DB_ROLE = {
  SUPER_ADMIN: 'SA',
  ADMIN: 'OM',
  CUSTODY_MANAGER: 'VM',
  LAB_DIRECTOR: 'LA',
  LAB_TECHNICIAN: 'LA',
  CUSTODIAN: 'VM',
  AUDITOR: 'AU',
  MARKETPLACE_SELLER: 'ME',
  VIEWER: 'CU',
} as const;

// ─── مجموعات الصلاحيات ────────────────────────────────────────────────────
// كل مجموعة تحدد الأدوار المسموح لها — متوافق مع PAGE_ACCESS في roles.ts
const ACCESS = {
  // المصادقة والمعلومات العامة
  public: ['SA', 'OM', 'LA', 'NO', 'VM', 'DR', 'ME', 'CU', 'AU'],

  // نظرة عامة وتقارير
  erp: ['SA', 'OM'],
  erpReadOnly: ['SA', 'OM', 'LA', 'AU'],

  // الأصول والمخزون
  assets: ['SA', 'OM', 'VM', 'ME'],
  vaults: ['SA', 'OM', 'VM', 'CU'],

  // المختبر والفحص
  lab: ['SA', 'LA', 'AU'],
  labTech: ['SA', 'LA'],

  // الحضانة
  custody: ['SA', 'OM', 'VM'],
  custodyDual: ['SA', 'OM', 'VM', 'AU'],

  // المالية
  finance: ['SA', 'OM', 'AU'],
  financeReadOnly: ['SA', 'OM', 'AU', 'ME'],

  // الموارد البشرية
  hr: ['SA', 'OM'],

  // الامتثال والأمن
  compliance: ['SA', 'OM', 'AU'],
  security: ['SA', 'OM', 'AU'],

  // النظام والإدارة
  admin: ['SA', 'OM'],

  // السوق
  marketplace: ['SA', 'OM', 'ME', 'CU'],

  // التمليك والتوثيق
  ownership: ['SA', 'OM', 'NO', 'DR', 'ME', 'CU', 'AU'],
  notary: ['SA', 'NO', 'DR'],

  // الهوية الرقمية
  identity: ['SA', 'OM', 'DR', 'AU'],
} as const;

type AccessGroup = keyof typeof ACCESS;

/**
 * يتحقق من أن الدور الحالي ضمن مجموعة صلاحيات معينة
 */
export function requireRoles(...groups: AccessGroup[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // جلب الدور من JWT (معبأ بواسطة authenticateToken)
    const jwtRole = (req as any).roleCode as string | undefined;

    // إن لم يوجد — لا مصادقة
    if (!jwtRole) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    // تحويل دور قاعدة البيانات إلى رمز وصول
    const accessCode = DB_ROLE[jwtRole as keyof typeof DB_ROLE];

    // تحقق من أن الدور ضمن إحدى المجموعات المطلوبة
    const allowed = groups.some((group) =>
      ACCESS[group].some((role) => role === accessCode),
    );

    // مدير النظام الأعلى (SUPER_ADMIN) يملك جميع الصلاحيات — يمر دائماً
    const isSuperAdmin = jwtRole === 'SUPER_ADMIN' || accessCode === 'SA';

    if (!allowed && !isSuperAdmin) {
      logger.warn('RBAC denied', {
        roleCode: jwtRole,
        page: req.originalUrl,
      });
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Your role does not have access to this resource',
          details: { role: jwtRole, groups: groups.join(', ') },
        },
      });
      return;
    }

    next();
  };
}