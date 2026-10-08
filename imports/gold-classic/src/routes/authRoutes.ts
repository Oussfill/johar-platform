// ============================================================================
// GOLD PLATFORM — AUTH ROUTES
// ============================================================================
// مسارات API للمصادقة والتفويض

import { Router } from 'express';
import {
  register,
  login,
  requestOtp,
  verifyOtp,
  googleAuthUrl,
  googleAuthCallback,
  setupMfa,
  verifyMfaSetup,
  disableMfa,
  getMe,
  logout,
} from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';
import { i18nAndCurrencyMiddleware } from '../middleware/i18n';

const router = Router();

// تطبيق middleware اللغة والعملة على مسارات المصادقة
router.use(i18nAndCurrencyMiddleware);

/**
 * POST /api/v1/auth/register
 * تسجيل مستخدم جديد
 *
 * لا يتطلب مصادقة
 * المدخلات: email, password, firstName, lastName, phone (اختياري), roleCode
 */
router.post('/register', register);

/**
 * POST /api/v1/auth/login
 * تسجيل الدخول
 *
 * لا يتطلب مصادقة
 * المدخلات: email, password, mfaToken (اختياري إذا كان MFA مفعلاً)
 * المخرجات: JWT Token + بيانات المستخدم
 */
router.post('/login', login);

/**
 * POST /api/v1/auth/otp/request
 * طلب كود دخول لمرة واحدة (OTP) عبر البريد الإلكتروني
 *
 * لا يتطلب مصادقة
 * المدخلات: email
 */
router.post('/otp/request', requestOtp);

/**
 * POST /api/v1/auth/otp/verify
 * التحقق من كود الدخول وتسجيل الدخول
 *
 * لا يتطلب مصادقة
 * المدخلات: email, code, mfaToken (اختياري إذا كان MFA مفعلاً)
 * المخرجات: JWT Token + بيانات المستخدم
 */
router.post('/otp/verify', verifyOtp);

/**
 * GET /api/v1/auth/google/url
 * رابط تسجيل الدخول عبر Google (يُعاد بكود state موقّع ضد CSRF)
 *
 * لا يتطلب مصادقة
 * المخرجات: { url } — يعيد توجيه المتصفح إليه
 */
router.get('/google/url', googleAuthUrl);

/**
 * GET /api/v1/auth/google/callback
 * معاودة Google بعد قبول المستخدم التفويض (تسجيل أو دخول مباشر)
 *
 * لا يتطلب مصادقة — يُرجع صفحة HTML تفتح الجلسة وتعيد التوجيه للتطبيق
 * ولا يلزم إضافتها في netlify.toml لأنها تحت مسار /api/* (تُوجَّه للمثال تلقائياً)
 */
router.get('/google/callback', googleAuthCallback);

/**
 * POST /api/v1/auth/mfa/setup
 * إعداد التحقق بخطوتين (MFA)
 *
 * يتطلب مصادقة
 * يُرجع: QR Code URL + سر TOTP + رموز استعادة الطوارئ
 */
router.post('/mfa/setup', authenticateToken, setupMfa);

/**
 * POST /api/v1/auth/mfa/verify
 * تأكيد إعداد MFA
 *
 * يتطلب مصادقة
 * المدخلات: token (رمز TOTP من التطبيق)
 */
router.post('/mfa/verify', authenticateToken, verifyMfaSetup);

/**
 * POST /api/v1/auth/mfa/disable
 * تعطيل MFA
 *
 * يتطلب مصادقة + كلمة المرور
 */
router.post('/mfa/disable', authenticateToken, disableMfa);

/**
 * GET /api/v1/auth/me
 * جلب معلومات المستخدم الحالي
 *
 * يتطلب مصادقة
 */
router.get('/me', authenticateToken, getMe);

/**
 * POST /api/v1/auth/logout
 * تسجيل الخروج
 *
 * يتطلب مصادقة
 */
router.post('/logout', authenticateToken, logout);

export default router;
