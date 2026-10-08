// ============================================================================
// JOHAR — AUTHORIZATION MIDDLEWARE (RBAC + ABAC المركزي)
// ============================================================================
// البديل الموحّد لعن `requirePermissions`. يبني سياق التفويض من قاعدة البيانات
// ثم يستدعي AuthorizeService (المصفوفة القسم 31-32).
//
// الاستخدام:  router.post('/x', authenticateToken, authz('product:create', { scope: 'org' }), handler)

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import {
  authorize,
  toHttpStatus,
  resolveEffectivePermissions,
  type AuthContext,
  type AuthorizeOptions,
} from '../services/authorization/AuthorizeService';

export function authz(permissionCode: string, opts: AuthorizeOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          isActive: true,
          accountType: true,
          verificationLevel: true,
          activeOrgId: true,
          role: {
            select: {
              roleCode: true,
              permissions: true,
              rolePermissions: {
                select: { permission: { select: { code: true } } },
              },
            },
          },
          orgMembers: {
            where: { userId, isActive: true },
            select: { orgRole: true },
            take: 1,
          },
        },
      });

      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          error: { code: 'USER_INACTIVE', message: 'User account is inactive' },
        });
        return;
      }

      const legacyPerms = (user.role.permissions as string[]) || [];
      const structuredPerms = (user.role.rolePermissions || []).map(
        (rp: any) => rp.permission.code,
      );

      const platformPermissions = Array.from(
        new Set([...legacyPerms, ...structuredPerms]),
      );

      // موقع العضوية النشطة (دور المؤسسة) غير محدود بالحقل activeOrgId فقط —
      // نستخدم أول عضوية نشطة إذا توفرت وإلا activeOrgId الجاهز.
      const activeMembership = user.orgMembers && user.orgMembers.length > 0
        ? user.orgMembers[0]
        : null;

      // ثقة المؤسسة النشطة (Trust Levels §12 — المستويات 4–6) لبوابة السياق المؤسسي
      let orgTrustLevel: number | undefined;
      if (user.activeOrgId) {
        const org = await prisma.organization.findUnique({
          where: { id: user.activeOrgId },
          select: { trustLevel: true },
        });
        orgTrustLevel = org?.trustLevel ?? 0;
      }

      const ctx: AuthContext = {
        userId: user.id,
        platformRoleCode: user.role.roleCode,
        rolePermissions: platformPermissions,
        accountType: user.accountType,
        verificationLevel: user.verificationLevel,
        orgRole: activeMembership ? activeMembership.orgRole : null,
        activeOrgId: user.activeOrgId,
        orgTrustLevel,
        mfaConfirmed: false, // يُفعّل في مرحلة لاحقة عبر Re-auth
      };

      const decision = authorize(ctx, permissionCode, opts);

      if (!decision.allowed) {
        logger.warn('Authorization denied', {
          userId,
          permission: permissionCode,
          action: decision.action,
          reason: decision.reason,
        });
        res.status(toHttpStatus(decision)).json({
          success: false,
          error: {
            code: decision.action,
            message: decision.reason,
            requiredTier: decision.reason && decision.reason.startsWith('MIN_TIER_')
              ? Number(decision.reason.split('_')[2])
              : undefined,
          },
        });
        return;
      }

      // تسهيل التفرّع لاحقاً في المعالجات
      (req as any).authorization = decision;
      next();
    } catch (error) {
      logger.error('Authorization middleware error', { error });
      res.status(500).json({
        success: false,
        error: { code: 'AUTHORIZATION_ERROR', message: 'Authorization error' },
      });
    }
  };
}

export { resolveEffectivePermissions };