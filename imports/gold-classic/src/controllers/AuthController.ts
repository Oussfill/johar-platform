// ============================================================================
// GOLD PLATFORM — AUTH CONTROLLER
// ============================================================================
// Controller للمصادقة والتفويض والتحقق بخطوتين (MFA)
//
// الأمان:
//   - كلمات المرور مشفرة بـ bcrypt (12 جولة)
//   - JWT Token مع صلاحية محدودة
//   - MFA عبر TOTP (Google Authenticator)
//   - مقاومة Timing Attacks في التحقق
//   - قفل الحساب بعد 5 محاولات فاشلة (30 دقيقة)
//   - تسجيل كل محاولة في Audit Log (ISO 27001)

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import { Language, Currency } from '@prisma/client';
import { prisma } from '../config/database';
import { config } from '../config';
import { logger } from '../config/logger';
import { generateSecureRandom, sha256Hash } from '../utils/crypto';
import { sendOtpEmail } from '../services/MailService';
import {
  buildAuthUrl,
  getGoogleProfile,
  googleOAuthEnabled,
  issueState,
  verifyState,
} from '../services/GoogleOAuthService';

// ============================================================================
// TYPES
// ============================================================================

interface LoginRequest {
  email: string;
  password: string;
  mfaToken?: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleCode?: string;
  preferredLanguage?: Language;
  preferredCurrency?: Currency;
}

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
// CONSTANTS
// ============================================================================

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
const BCRYPT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_REQUESTS_PER_WINDOW = 3;
const OTP_RATE_WINDOW_MINUTES = 10;

// ============================================================================
// POST /api/v1/auth/register — تسجيل مستخدم جديد
// ============================================================================

export async function register(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      roleCode = 'VIEWER',
      preferredLanguage = lang,
      preferredCurrency = currency,
    } = req.body as RegisterRequest;

    // حارس المدخلات: لا تصل قيمة فارغة إلى منطق التسجيل (400 بدل 500)
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data Validation Error',
          details: [
            ...(typeof email !== 'string' || !email ? [{ field: 'email', message: 'Email is required' }] : []),
            ...(typeof password !== 'string' || !password ? [{ field: 'password', message: 'Password is required' }] : []),
          ],
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // التحقق من عدم وجود مستخدم بنفس البريد الإلكتروني
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: getLocalizedMsg('email_exists', lang),
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // جلب الدور المطلوب
    const role = await prisma.role.findFirst({
      where: { roleCode, isActive: true },
    });

    if (!role) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: getLocalizedMsg('invalid_role', lang),
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // تشفير كلمة المرور
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // إنشاء المستخدم
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        phone,
        roleId: role.id,
        preferredLanguage: preferredLanguage as Language,
        preferredCurrency: preferredCurrency as Currency,
        mfaEnabled: false,
        isEmailVerified: false,
        isActive: true,
        passwordChangedAt: new Date(),
      },
      include: {
        role: {
          select: { roleCode: true, nameEn: true, nameAr: true, nameFr: true },
        },
      },
    });

    // تسجيل الحدث في سجل التدقيق (ISO 27001)
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: user.id,
        description: `New user registered: ${email} (${role.roleCode})`,
        newValues: {
          email,
          firstName,
          lastName,
          roleCode: role.roleCode,
        },
        severity: 'INFO',
        category: 'AUTHENTICATION',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    // توليد JWT Token
    const token = generateJwtToken(user, role);

    logger.info('User registered successfully', {
      userId: user.id,
      email,
      roleCode: role.roleCode,
    });

    const response: any = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: role.roleCode,
          preferredLanguage: user.preferredLanguage,
          preferredCurrency: user.preferredCurrency,
          mfaEnabled: user.mfaEnabled,
        },
        token,
        tokenType: 'Bearer',
        expiresIn: config.jwt.expiry,
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Registration failed', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: getLocalizedMsg('internal_error', lang),
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// POST /api/v1/auth/login — تسجيل الدخول
// ============================================================================

export async function login(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const { email, password, mfaToken } = req.body as LoginRequest;

    // حارس المدخلات: لا تصل قيمة فارغة إلى استعلام الهوية (400 بدل 500)
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data Validation Error',
          details: [
            ...(typeof email !== 'string' || !email ? [{ field: 'email', message: 'Email is required' }] : []),
            ...(typeof password !== 'string' || !password ? [{ field: 'password', message: 'Password is required' }] : []),
          ],
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // جلب المستخدم
    const user = await prisma.user.findUnique({
      where: { email: email?.toLowerCase() },
      include: {
        role: {
          select: {
            id: true,
            roleCode: true,
            nameEn: true,
            nameAr: true,
            nameFr: true,
            hierarchy: true,
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      // تسجيل محاولة فاشلة (بصيغة عامة لتجنب تسريب وجود المستخدم)
      await logFailedLoginAttempt(null, email, req);
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: getLocalizedMsg('invalid_credentials', lang),
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // التحقق من نشاط المستخدم
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: getLocalizedMsg('account_disabled', lang),
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // التحقق من قفل الحساب
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / 60000,
      );
      res.status(423).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: getLocalizedMsg('account_locked', lang).replace(
            '{minutes}',
            remainingMinutes.toString(),
          ),
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // التحقق من كلمة المرور (مقاومة Timing Attacks)
    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      // زيادة عداد المحاولات الفاشلة
      const newFailedCount = user.failedLoginCount + 1;
      const shouldLock = newFailedCount >= MAX_LOGIN_ATTEMPTS;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: newFailedCount,
          lockoutUntil: shouldLock
            ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000)
            : null,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          entityType: 'User',
          entityId: user.id,
          description: `Failed login attempt ${newFailedCount}/${MAX_LOGIN_ATTEMPTS} for ${email}`,
          newValues: {
            failedAttempts: newFailedCount,
            locked: shouldLock,
          },
          severity: shouldLock ? 'WARNING' : 'INFO',
          category: 'AUTHENTICATION',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      logger.warn('Failed login attempt', {
        userId: user.id,
        email,
        failedAttempts: newFailedCount,
        locked: shouldLock,
      });

      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: shouldLock
            ? getLocalizedMsg('account_locked_after', lang)
            : getLocalizedMsg('invalid_credentials', lang),
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // التحقق من MFA إذا كان مفعلاً
    if (user.mfaEnabled) {
      if (!mfaToken) {
        // المطلوب: إرسال طلب MFA منفصل
        res.status(200).json({
          success: true,
          data: {
            mfaRequired: true,
            message: getLocalizedMsg('mfa_required', lang),
          },
          meta: { language: lang, currency, timestamp: new Date().toISOString() },
        });
        return;
      }

      // التحقق من رمز TOTP
      const mfaSecret = user.mfaSecret;
      if (!mfaSecret) {
        res.status(500).json({
          success: false,
          error: { code: 'MFA_CONFIG_ERROR', message: 'MFA configuration error' },
        });
        return;
      }

      const mfaValid = speakeasy.totp.verify({
        secret: mfaSecret,
        encoding: 'base32',
        token: mfaToken,
        window: 1,
      });

      if (!mfaValid) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'MFA_FAILED',
            entityType: 'User',
            entityId: user.id,
            description: `Invalid MFA token for ${email}`,
            severity: 'WARNING',
            category: 'AUTHENTICATION',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        });

        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_MFA',
            message: getLocalizedMsg('invalid_mfa', lang),
          },
          meta: { language: lang, currency, timestamp: new Date().toISOString() },
        });
        return;
      }
    }

    // تسجيل الدخول الناجح — إعادة تعيين عداد المحاولات
    await finalizeLogin(user, req, res, lang, currency);
  } catch (error) {
    logger.error('Login failed', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: getLocalizedMsg('internal_error', lang),
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// POST /api/v1/auth/otp/request — طلب كود دخول عبر البريد الإلكتروني
// ============================================================================

export async function requestOtp(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const email = (req.body?.email || '').toString().trim().toLowerCase();

    // التحقق الأساسي من الصيغة
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL', message: getLocalizedMsg('invalid_email', lang) },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // إجابة موحّدة دائماً (سواء وُجد المستخدم أم لا) لمنع تسريب وجود الحساب
    if (!user || !user.isActive) {
      res.json({
        success: true,
        data: {
          delivery: 'demo',
          expiresInMinutes: OTP_EXPIRY_MINUTES,
          message: getLocalizedMsg('otp_sent', lang),
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // الحد من عدد الطلبات لكل نافذة زمنية
    const windowStart = new Date(Date.now() - OTP_RATE_WINDOW_MINUTES * 60000);
    const recentCount = await prisma.emailOtp.count({
      where: { userId: user.id, purpose: 'LOGIN', createdAt: { gte: windowStart } },
    });

    if (recentCount >= OTP_MAX_REQUESTS_PER_WINDOW) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'OTP_RATE_LIMITED',
          entityType: 'User',
          entityId: user.id,
          description: `OTP request rate limit hit for ${email}`,
          severity: 'WARNING',
          category: 'AUTHENTICATION',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(429).json({
        success: false,
        error: { code: 'OTP_RATE_LIMITED', message: getLocalizedMsg('otp_rate_limited', lang) },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // توليد كود رقمي من 6 خانات (عشوائية آمنة تشفيرياً)
    const code = crypto.randomInt(100000, 1000000).toString();

    // تنظيف الرموز المنتهية والمستهلكة القديمة
    await prisma.emailOtp.deleteMany({
      where: { userId: user.id, purpose: 'LOGIN', OR: [{ expiresAt: { lt: new Date() } }, { consumedAt: { not: null } }] },
    });

    // تخزين هاش الكود (SHA-256) — لا يُخزَّن النص الصريح أبداً
    await prisma.emailOtp.create({
      data: {
        userId: user.id,
        codeHash: sha256Hash(`JOHAR_OTP:${code}`),
        purpose: 'LOGIN',
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000),
      },
    });

    // إرسال البريد
    const { delivery } = await sendOtpEmail({
      email,
      code,
      lang: lang as 'AR' | 'FR' | 'EN',
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'OTP_REQUESTED',
        entityType: 'User',
        entityId: user.id,
        description: `OTP login code requested for ${email}`,
        severity: 'INFO',
        category: 'AUTHENTICATION',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({
      success: true,
      data: {
        delivery,
        expiresInMinutes: OTP_EXPIRY_MINUTES,
        // الوضع التجريبي فقط: لا يُعاد الكود في وضع الإرسال الفعلي أبداً
        devCode: delivery === 'demo' ? code : undefined,
        message: getLocalizedMsg('otp_sent', lang),
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('OTP request failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'OTP_REQUEST_FAILED', message: getLocalizedMsg('internal_error', lang) },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// POST /api/v1/auth/otp/verify — التحقق من الكود وتسجيل الدخول
// ============================================================================

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const { email, code, mfaToken } = req.body as {
      email?: string;
      code?: string;
      mfaToken?: string;
    };

    const normalizedEmail = (email || '').toString().trim().toLowerCase();
    const normalizedCode = (code || '').toString().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        role: {
          select: {
            id: true,
            roleCode: true,
            nameEn: true,
            nameAr: true,
            nameFr: true,
            hierarchy: true,
            permissions: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_OTP', message: getLocalizedMsg('invalid_otp', lang) },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // البحث عن رمز نشط — الأحدث فقط
    const otp = await prisma.emailOtp.findFirst({
      where: {
        userId: user.id,
        purpose: 'LOGIN',
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      res.status(401).json({
        success: false,
        error: { code: 'OTP_EXPIRED', message: getLocalizedMsg('otp_expired', lang) },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      await prisma.emailOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
      res.status(401).json({
        success: false,
        error: { code: 'OTP_EXPIRED', message: getLocalizedMsg('otp_expired', lang) },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // مقارنة ثابتة الوقت للهاش
    const providedHash = sha256Hash(`JOHAR_OTP:${normalizedCode}`);
    const valid = crypto.timingSafeEqual(
      Buffer.from(providedHash, 'hex'),
      Buffer.from(otp.codeHash, 'hex'),
    );

    if (!valid) {
      const newAttempts = otp.attempts + 1;
      await prisma.emailOtp.update({
        where: { id: otp.id },
        data: newAttempts >= OTP_MAX_ATTEMPTS ? { attempts: newAttempts, consumedAt: new Date() } : { attempts: newAttempts },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'OTP_FAILED',
          entityType: 'User',
          entityId: user.id,
          description: `Invalid OTP attempt ${newAttempts}/${OTP_MAX_ATTEMPTS} for ${normalizedEmail}`,
          severity: 'WARNING',
          category: 'AUTHENTICATION',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(401).json({
        success: false,
        error: { code: 'INVALID_OTP', message: getLocalizedMsg('invalid_otp', lang) },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // التحقق من MFA إذا كان مفعلاً (بنفس منطق تسجيل الدخول بكلمة المرور)
    if (user.mfaEnabled) {
      if (!mfaToken) {
        res.status(200).json({
          success: true,
          data: {
            mfaRequired: true,
            message: getLocalizedMsg('mfa_required', lang),
          },
          meta: { language: lang, currency, timestamp: new Date().toISOString() },
        });
        return;
      }

      if (!user.mfaSecret) {
        res.status(500).json({
          success: false,
          error: { code: 'MFA_CONFIG_ERROR', message: 'MFA configuration error' },
        });
        return;
      }

      const mfaValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: mfaToken,
        window: 1,
      });

      if (!mfaValid) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'MFA_FAILED',
            entityType: 'User',
            entityId: user.id,
            description: `Invalid MFA token during OTP login for ${normalizedEmail}`,
            severity: 'WARNING',
            category: 'AUTHENTICATION',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        });

        res.status(401).json({
          success: false,
          error: { code: 'INVALID_MFA', message: getLocalizedMsg('invalid_mfa', lang) },
          meta: { language: lang, currency, timestamp: new Date().toISOString() },
        });
        return;
      }
    }

    // ناجح — استهلاك الرمز وإصدار الجلسة
    await prisma.emailOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

    await finalizeLogin(user, req, res, lang, currency);
  } catch (error) {
    logger.error('OTP verification failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'OTP_VERIFY_FAILED', message: getLocalizedMsg('internal_error', lang) },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// GET /api/v1/auth/google/url — رابط تسجيل الدخول عبر Google
// ============================================================================

export async function googleAuthUrl(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  if (!googleOAuthEnabled()) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GOOGLE_OAUTH_NOT_CONFIGURED',
        message: 'Google login is not configured on this site yet',
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
    return;
  }

  const state = issueState();
  res.json({
    success: true,
    data: {
      url: buildAuthUrl(state),
      expiresIn: 600,
    },
    meta: { language: lang, currency, timestamp: new Date().toISOString() },
  });
}

// ============================================================================
// GET /api/v1/auth/google/callback — معاودة Google (تسجيل أو دخول مباشر)
// ============================================================================

export async function googleAuthCallback(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  // إعادة توجيه sf إلى الواجهة — بدون أي HTML أو سكربت مضمّن (لتفادي CSP)
  // النجاح: ذيل الرابط (جزء الـ hash فقط، لا يصل للخادم) يحمل الجلسة ويقرؤه main.tsx
  const respond = (ok: boolean, payload?: { error?: string; session?: any }): void => {
    res.setHeader('Cache-Control', 'no-store');
    if (ok && payload?.session) {
      res.redirect(
        302,
        `${baseUrl}/#/auth/sso?session=${encodeURIComponent(JSON.stringify(payload.session))}`,
      );
    } else {
      res.redirect(302, `${baseUrl}/#/login?error=${encodeURIComponent(payload?.error || 'google_denied')}`);
    }
  };

  try {
    const { code, state } = req.query as { code?: string; state?: string };

    if (!code) {
      respond(false, { error: 'google_missing_code' });
      return;
    }

    if (!state || !verifyState(state)) {
      logger.warn('Google OAuth invalid state', { state: state ? state.slice(0, 12) : undefined });
      respond(false, { error: 'google_invalid_state' });
      return;
    }

    const profile = await getGoogleProfile(code);

    if (!profile.emailVerified) {
      logger.warn('Google OAuth unverified email', { email: profile.email });
      respond(false, { error: 'google_email_unverified' });
      return;
    }

    let user = await prisma.user.findUnique({
      where: { email: profile.email },
      include: {
        role: { select: { roleCode: true, hierarchy: true } },
      },
    });

    if (user) {
      if (!user.isActive) {
        respond(false, { error: '' });
        return;
      }

      // تحديث بيانات الحساب من Google إن كانت ناقصة
      const patch: any = {};
      if (!user.avatarUrl && profile.picture) patch.avatarUrl = profile.picture;
      if (!user.firstName && profile.name) {
        patch.firstName = nameParts(profile.name).first;
        patch.lastName =
          nameParts(profile.name).last || patch.firstName || 'Google';
      }

      if (Object.keys(patch).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: patch,
          include: { role: { select: { roleCode: true, hierarchy: true } } },
        });
      }
    } else {
      // حساب جديد — تلقائي التسجيل مع الدور الافتراضي
      const role = await prisma.role.findFirst({
        where: { roleCode: config.oauth.defaultRoleCode, isActive: true },
      });

      if (!role) {
        logger.error('OAuth default role not found', {
          roleCode: config.oauth.defaultRoleCode,
        });
        respond(false, { error: '' });
        return;
      }

      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, BCRYPT_ROUNDS);
      const parts = nameParts(profile.name);

      user = await prisma.user.create({
        data: {
          email: profile.email,
          passwordHash,
          firstName: parts.first || 'Google',
          lastName: parts.last || 'User',
          avatarUrl: profile.picture,
          roleId: role.id,
          preferredLanguage: lang,
          preferredCurrency: currency,
          mfaEnabled: false,
          isEmailVerified: true,
          isActive: true,
          passwordChangedAt: new Date(),
        },
        include: { role: { select: { roleCode: true, hierarchy: true } } },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTERED',
          entityType: 'User',
          entityId: user.id,
          description: `New user registered via Google: ${profile.email} (${role.roleCode})`,
          newValues: { email: profile.email, roleCode: role.roleCode, source: 'google_oauth' },
          severity: 'INFO',
          category: 'AUTHENTICATION',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      logger.info('User registered via Google', {
        userId: user.id,
        email: profile.email,
      });
    }

    // إصدار الجلسة
    const token = generateJwtToken(user, user.role);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockoutUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: req.ip,
        isEmailVerified: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        entityType: 'User',
        entityId: user.id,
        description: `Login via Google: ${user.email}`,
        severity: 'INFO',
        category: 'AUTHENTICATION',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    const session = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.roleCode,
        hierarchy: user.role.hierarchy,
        preferredLanguage: user.preferredLanguage,
        preferredCurrency: user.preferredCurrency,
        mfaEnabled: user.mfaEnabled,
        avatarUrl: user.avatarUrl,
      },
      token,
      tokenType: 'Bearer',
      expiresIn: config.jwt.expiry,
    };

    logger.info('User logged in via Google', {
      userId: user.id,
      email: user.email,
      roleCode: user.role.roleCode,
    });

    respond(true, { session });
  } catch (error) {
    logger.error('Google OAuth callback failed', { error });
    respond(false, { error: '' });
  }
}

// ============================================================================
// HELPERS: تحضير اسم وصفحة المعاودة
// ============================================================================

function nameParts(fullName: string): { first: string; last: string } {
  const trimmed = (fullName || '').trim();
  if (!trimmed) return { first: '', last: '' };
  const words = trimmed.split(/\s+/);
  const first = words.shift() || '';
  const last = words.join(' ') || '';
  return { first, last };
}


  // ============================================================================
// HELPER: إكمال تسجيل دخول ناجح (مشترك بين كلمة المرور و OTP و Google)
// ============================================================================

async function finalizeLogin(
  user: any,
  req: Request,
  res: Response,
  lang: Language,
  currency: Currency,
): Promise<void> {
  const token = generateJwtToken(user, user.role);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockoutUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: req.ip,
      isEmailVerified: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      description: `Successful login: ${user.email}`,
      severity: 'INFO',
      category: 'AUTHENTICATION',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  logger.info('User logged in successfully', {
    userId: user.id,
    email: user.email,
    roleCode: user.role.roleCode,
  });

  const response: any = {
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.roleCode,
        hierarchy: user.role.hierarchy,
        preferredLanguage: user.preferredLanguage,
        preferredCurrency: user.preferredCurrency,
        mfaEnabled: user.mfaEnabled,
      },
      token,
      tokenType: 'Bearer',
      expiresIn: config.jwt.expiry,
    },
    meta: {
      language: lang,
      currency,
      timestamp: new Date().toISOString(),
    },
  };

  res.json(response);
}

// ============================================================================
// POST /api/v1/auth/mfa/setup — إعداد التحقق بخطوتين
// ============================================================================

export async function setupMfa(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, mfaEnabled: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    if (user.mfaEnabled) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MFA_ALREADY_ENABLED',
          message: getLocalizedMsg('mfa_already_enabled', lang),
        },
      });
      return;
    }

    // توليد سر TOTP جديد
    const secret = speakeasy.generateSecret({
      name: `GOLD Platform (${user.email})`,
      issuer: 'JOHAR',
      length: 32,
    });

    // حفظ السر بشكل مؤقت (يُفعّل بعد التحقق من الرمز الأول)
    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret.base32 },
    });

    // توليد رمز استعادة الطوارئ
    const backupCodes = Array.from({ length: 8 }, () =>
      generateSecureRandom(8).substring(0, 8).toUpperCase(),
    );

    const response: any = {
      success: true,
      data: {
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(secret.otpauth_url || '')}`,
        backupCodes,
        instructions: {
          ar: 'امسح الرمز الضوئي باستخدام تطبيق المصادقة (Google Authenticator أو Authy)، ثم أدخل الرمز للتأكيد.',
          fr: 'Scannez le code QR avec une application d\'authentification (Google Authenticator ou Authy), puis entrez le code pour confirmer.',
          en: 'Scan the QR code with an authenticator app (Google Authenticator or Authy), then enter the code to confirm.',
        },
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('MFA setup failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'MFA_SETUP_FAILED', message: 'MFA setup failed' },
    });
  }
}

// ============================================================================
// POST /api/v1/auth/mfa/verify — تأكيد إعداد MFA
// ============================================================================

export async function verifyMfaSetup(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const userId = (req as any).userId;
    const { token } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mfaSecret: true, mfaEnabled: true },
    });

    if (!user || !user.mfaSecret) {
      res.status(400).json({
        success: false,
        error: { code: 'MFA_NOT_SET_UP', message: 'MFA has not been set up' },
      });
      return;
    }

    // التحقق من الرمز
    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MFA_TOKEN',
          message: getLocalizedMsg('invalid_mfa', lang),
        },
      });
      return;
    }

    // تفعيل MFA
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaVerifiedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'MFA_ENABLED',
        entityType: 'User',
        entityId: userId,
        description: 'MFA enabled successfully',
        severity: 'INFO',
        category: 'SECURITY',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    const response: any = {
      success: true,
      data: {
        mfaEnabled: true,
        message: {
          ar: 'تم تفعيل التحقق بخطوتين بنجاح',
          fr: 'Authentification à deux facteurs activée avec succès',
          en: 'Two-factor authentication enabled successfully',
        }[lang.toLowerCase() as 'ar' | 'fr' | 'en'],
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    };

    res.json(response);
  } catch (error) {
    logger.error('MFA verification failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'MFA_VERIFICATION_FAILED', message: 'MFA verification failed' },
    });
  }
}

// ============================================================================
// POST /api/v1/auth/mfa/disable — تعطيل MFA
// ============================================================================

export async function disableMfa(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const userId = (req as any).userId;
    const { password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, mfaEnabled: true },
    });

    if (!user || !user.mfaEnabled) {
      res.status(400).json({
        success: false,
        error: { code: 'MFA_NOT_ENABLED', message: 'MFA is not enabled' },
      });
      return;
    }

    // التحقق من كلمة المرور قبل التعطيل
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: getLocalizedMsg('invalid_credentials', lang),
        },
      });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaVerifiedAt: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'MFA_DISABLED',
        entityType: 'User',
        entityId: userId,
        description: 'MFA disabled',
        severity: 'WARNING',
        category: 'SECURITY',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    const response: any = {
      success: true,
      data: {
        mfaEnabled: false,
        message: {
          ar: 'تم تعطيل التحقق بخطوتين',
          fr: 'Authentification à deux facteurs désactivée',
          en: 'Two-factor authentication disabled',
        }[lang.toLowerCase() as 'ar' | 'fr' | 'en'],
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    };

    res.json(response);
  } catch (error) {
    logger.error('MFA disable failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'MFA_DISABLE_FAILED', message: 'MFA disable failed' },
    });
  }
}

// ============================================================================
// GET /api/v1/auth/me — جلب معلومات المستخدم الحالي
// ============================================================================

export async function getMe(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: {
            roleCode: true,
            nameEn: true,
            nameAr: true,
            nameFr: true,
            permissions: true,
            hierarchy: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    const roleName =
      lang === 'AR'
        ? user.role.nameAr
        : lang === 'FR'
        ? user.role.nameFr
        : user.role.nameEn;

    const response: any = {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role.roleCode,
        roleName,
        hierarchy: user.role.hierarchy,
        permissions: user.role.permissions,
        preferredLanguage: user.preferredLanguage,
        preferredCurrency: user.preferredCurrency,
        mfaEnabled: user.mfaEnabled,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Get user profile failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'PROFILE_FAILED', message: 'Failed to retrieve profile' },
    });
  }
}

// ============================================================================
// POST /api/v1/auth/logout — تسجيل الخروج
// ============================================================================

export async function logout(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const userId = (req as any).userId;

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGOUT',
        entityType: 'User',
        entityId: userId,
        description: 'User logged out',
        severity: 'INFO',
        category: 'AUTHENTICATION',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({
      success: true,
      data: {
        message: {
          ar: 'تم تسجيل الخروج بنجاح',
          fr: 'Déconnexion réussie',
          en: 'Logged out successfully',
        }[lang.toLowerCase() as 'ar' | 'fr' | 'en'],
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('Logout failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'LOGOUT_FAILED', message: 'Logout failed' },
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateJwtToken(user: any, role: any): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    roleId: role.id,
    roleCode: role.roleCode,
    hierarchy: role.hierarchy,
    preferredLanguage: user.preferredLanguage,
    preferredCurrency: user.preferredCurrency,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 ساعة
  };

  return jwt.sign(payload, config.jwt.secret);
}

async function logFailedLoginAttempt(
  userId: string | null,
  email: string,
  req: Request,
): Promise<void> {
  try {
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'LOGIN_FAILED',
          entityType: 'User',
          entityId: userId,
          description: `Failed login for ${email}`,
          severity: 'WARNING',
          category: 'AUTHENTICATION',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    }
  } catch (error) {
    logger.error('Failed to log failed login attempt', { error });
  }
}

function getLocalizedMsg(key: string, lang: Language): string {
  const messages: Record<Language, Record<string, string>> = {
    AR: {
      email_exists: 'البريد الإلكتروني مسجل بالفعل',
      invalid_role: 'الدور المحدد غير صالح',
      invalid_credentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      account_disabled: 'تم تعطيل هذا الحساب',
      account_locked: 'تم قفل الحساب مؤقتاً. حاول مرة أخرى بعد {minutes} دقيقة',
      account_locked_after: 'تم قفل الحساب بعد 5 محاولات فاشلة. حاول مرة أخرى بعد 30 دقيقة',
      mfa_required: 'التحقق بخطوتين مطلوب — أدخل الرمز من تطبيق المصادقة',
      invalid_mfa: 'رمز التحقق غير صالح',
      mfa_already_enabled: 'التحقق بخطوتين مفعل بالفعل',
      invalid_email: 'صيغة البريد الإلكتروني غير صحيحة',
      otp_sent: 'تم إرسال رمز الدخول إلى بريدك الإلكتروني — صالح لمدة 10 دقائق',
      otp_rate_limited: 'طلبت عدداً كبيراً من الرموز — حاول مرة أخرى خلال 10 دقائق',
      otp_expired: 'انتهت صلاحية الكود أو استُهلك — اطلب رمزاً جديداً',
      invalid_otp: 'رمز التحقق غير صحيح',
      internal_error: 'خطأ داخلي',
    },
    FR: {
      email_exists: 'Cet email est déjà enregistré',
      invalid_role: 'Rôle invalide',
      invalid_credentials: 'Email ou mot de passe incorrect',
      account_disabled: 'Ce compte a été désactivé',
      account_locked: 'Compte verrouillé temporairement. Réessayez dans {minutes} minutes',
      account_locked_after: 'Compte verrouillé après 5 tentatives. Réessayez dans 30 minutes',
      mfa_required: 'Authentification à deux facteurs requise — entrez le code depuis l\'application',
      invalid_mfa: 'Code de vérification invalide',
      mfa_already_enabled: 'L\'authentification à deux facteurs est déjà activée',
      invalid_email: 'Format d\'email invalide',
      otp_sent: 'Un code de connexion a été envoyé à votre email — valable 10 minutes',
      otp_rate_limited: 'Trop de codes demandés — réessayez dans 10 minutes',
      otp_expired: 'Code expiré ou déjà utilisé — demandez un nouveau code',
      invalid_otp: 'Code de vérification invalide',
      internal_error: 'Erreur interne',
    },
    EN: {
      email_exists: 'Email already registered',
      invalid_role: 'Invalid role',
      invalid_credentials: 'Invalid email or password',
      account_disabled: 'This account has been disabled',
      account_locked: 'Account temporarily locked. Try again in {minutes} minutes',
      account_locked_after: 'Account locked after 5 failed attempts. Try again in 30 minutes',
      mfa_required: 'Two-factor authentication required — enter code from authenticator app',
      invalid_mfa: 'Invalid verification code',
      mfa_already_enabled: 'Two-factor authentication is already enabled',
      invalid_email: 'Invalid email format',
      otp_sent: 'A login code has been sent to your email — valid for 10 minutes',
      otp_rate_limited: 'Too many codes requested — try again in 10 minutes',
      otp_expired: 'Code expired or already used — request a new code',
      invalid_otp: 'Invalid verification code',
      internal_error: 'Internal error',
    },
  };
  return messages[lang]?.[key] || messages[Language.EN][key] || key;
}
