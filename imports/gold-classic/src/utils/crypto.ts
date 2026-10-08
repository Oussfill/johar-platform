// ============================================================================
// GOLD PLATFORM — CRYPTOGRAPHIC UTILITIES
// ============================================================================
// أدوات التشفير والهاش للمعاملات الآمنة
// تطبيق: قفل NFC، توقيع الشهادات، سلسلة الهاشات لل

import crypto from 'crypto';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'CHANGE_ME_IN_PRODUCTION_32_BYTES_HEX';

// ============================================================================
// HASH FUNCTIONS — دوال الهاش (SHA-256)
// ============================================================================

/**
 * إنشاء هاش SHA-256 لبيانات معينة
 * يُستخدم في: سلسلة الهاشات للبلوكتشين، بصمة الشهادة، تشفير NFC UID
 */
export function sha256Hash(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * إنشاء هاش مركب من عدة حقول (لإنشاء الهاش الأولي)
 */
export function compositeHash(...fields: string[]): string {
  const combined = fields.join('|');
  return sha256Hash(combined);
}

// ============================================================================
// NFC UID HASHING — تشفير معرّف شريحة NFC
// ============================================================================

/**
 * تشفير NFC UID لتخزينه بشكل آمن
 * يُستخدم عند قفل شريحة NFC بـ NDEF Write-Lock
 */
export function hashNfcUid(uid: string): string {
  return sha256Hash(`GOLD_NFC_V1:${uid}`);
}

/**
 * التحقق من NFC UID مع هاش مخزّن
 */
export function verifyNfcUid(uid: string, storedHash: string): boolean {
  const computedHash = hashNfcUid(uid);
  // استخدام مقارنة ثابتة الوقت لمنع Timing Attacks
  return crypto.timingSafeEqual(
    Buffer.from(computedHash, 'hex'),
    Buffer.from(storedHash, 'hex'),
  );
}

// ============================================================================
// DIGITAL SIGNATURE — التوقيع الرقمي للشهادات
// ============================================================================

/**
 * إنشاء توقيع رقمي لبيانات الشهادة
 * يُستخدم في: توقيع تقارير المختبرات، شهادات الجواز الرقمي
 */
export function signData(data: string, privateKeyPem: string): string {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(privateKeyPem, 'base64');
}

/**
 * التحقق من توقيع رقمي
 */
export function verifySignature(
  data: string,
  signature: string,
  publicKeyPem: string,
): boolean {
  const verify = crypto.createVerify('SHA256');
  verify.update(data);
  verify.end();
  return verify.verify(publicKeyPem, signature, 'base64');
}

// ============================================================================
// ENCRYPTION AT REST — تشفير البيانات المخزّنة
// ============================================================================

/**
 * تشفير حقل بيانات حساس (مثل معلومات الحيازة)
 * يُستخدم في تطبيق معمارية Zero-Knowledge على مستوى قاعدة البيانات
 */
export function encryptField(plaintext: string): string {
  return CryptoJS.AES.encrypt(plaintext, ENCRYPTION_KEY).toString();
}

/**
 * فك تشفير حقل بيانات
 */
export function decryptField(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// ============================================================================
// GOLD ID GENERATION — توليد المعرّف الذهبي الفريد
// ============================================================================

/**
 * توليد Gold ID فريد بالصيغة: GOLD-XXXX-XXXX-XXXX
 * يجب أن يكون فريداً عالمياً ولا يمكن توليده مرتين لنفس الأصل
 */
export function generateGoldId(): string {
  const segment1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const segment2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const segment3 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `GOLD-${segment1}-${segment2}-${segment3}`;
}

/**
 * توليد رقم تقرير فريد
 */
export function generateReportNumber(prefix: string = 'RPT'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * توليد معرّف طلب نقل فريد
 */
export function generateRequestId(prefix: string = 'CTR'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * توليد مفتاح عشوائي بأمان
 */
export function generateSecureRandom(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * إنشاء HMAC للتحقق من سلامة البيانات
 */
export function createHmac(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * التحقق من HMAC
 */
export function verifyHmac(data: string, secret: string, expectedHmac: string): boolean {
  const computedHmac = createHmac(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(computedHmac, 'hex'),
    Buffer.from(expectedHmac, 'hex'),
  );
}
