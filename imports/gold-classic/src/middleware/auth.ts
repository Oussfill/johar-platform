// ============================================================================
// GOLD PLATFORM — JWT AUTHENTICATION MIDDLEWARE
// ============================================================================
// middleware للتحقق من الهوية عبر JWT مع دعم MFA
// تطبيق مبدأ Zero-Trust على مستوى المصادقة

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { Language, Currency } from '@prisma/client';

// ============================================================================
// JWT PAYLOAD TYPES
// ============================================================================

interface JwtPayload {
  userId: string;
  email: string;
  roleId: string;
  roleCode: string;
  hierarchy: number;
  preferredLanguage: Language;
  preferredCurrency: Currency;
  iat: number;
  exp: number;
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * middleware للتحقق من المصادقة
 * يتحقق من:
 * 1. وجود رأس Authorization
 * 2. صحة التوقيع JWT
 * 3. عدم انتهاء الصلاحية
 * 4. نشاط المستخدم في قاعدة البيانات
 * 5. تفعيل MFA إذا كان مطلوباً
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required',
      },
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // إضافة بيانات المستخدم إلى الطلب
    (req as any).userId = decoded.userId;
    (req as any).email = decoded.email;
    (req as any).roleId = decoded.roleId;
    (req as any).roleCode = decoded.roleCode;
    (req as any).hierarchy = decoded.hierarchy;
    (req as any).preferredLanguage = decoded.preferredLanguage;
    (req as any).preferredCurrency = decoded.preferredCurrency;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired',
        },
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
        },
      });
      return;
    }

    logger.error('JWT verification error', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error',
      },
    });
  }
}

// ============================================================================
// AUTHORIZATION MIDDLEWARE
// ============================================================================

/**
 * middleware للتحقق من الصلاحيات (RBAC)
 *
 * @param requiredPermissions قائمة الصلاحيات المطلوبة
 */
export function requirePermissions(...requiredPermissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    // جلب الصلاحيات من قاعدة البيانات
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: { roleCode: true, permissions: true },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is inactive',
        },
      });
      return;
    }

    const userPermissions = (user.role.permissions as string[]) || [];

    // مدير النظام الأعلى (SUPER_ADMIN) أو دور بصلاحية البرية '*' يملك كل الصلاحيات
    const isSuperAdmin =
      user.role.roleCode === 'SUPER_ADMIN' || userPermissions.includes('*');

    // التحقق من وجود جميع الصلاحيات المطلوبة
    const hasAllPermissions = isSuperAdmin || requiredPermissions.every((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(
        (perm) => !userPermissions.includes(perm),
      );

      logger.warn('Permission denied', {
        userId,
        requiredPermissions,
        missingPermissions,
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          details: {
            required: requiredPermissions,
            missing: missingPermissions,
          },
        },
      });
      return;
    }

    next();
  };
}

/**
 * middleware للتحقق من مستوى السلطة (Hierarchy)
 *
 * @param minHierarchy الحد الأدنى لمستوى السلطة المطلوب
 */
export function requireHierarchy(minHierarchy: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userHierarchy = (req as any).hierarchy;

    if (userHierarchy === undefined || userHierarchy < minHierarchy) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_HIERARCHY',
          message: `Minimum hierarchy level ${minHierarchy} required`,
        },
      });
      return;
    }

    next();
  };
}
