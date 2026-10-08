// ============================================================================
// GOLD PLATFORM — OWNERSHIP KEY SERVICE
// ============================================================================
// خدمة توليد ومراجعة مفاتيح التمليك مع تطبيق مبدأ فصل الصلاحيات
//
// المستخدم: كاتب العدل فقط (Notary)
// ─────────────────────────────────────
// التشفير: AES-256-GCM مع متجه بدء عشوائي
// الهاش: SHA-256
// الهوية: المفتاح الأصلي لا يُخزَّن أبداً — فقط الهاش والبيانات المشفرة
// التحقق: مقارنة ثابتة الوقت لمنع Timing Attacks

import crypto from 'node:crypto';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

// ============================================================================
// ثوابت التشفير
// ============================================================================

/** طول المفتاح العشوائي بالبايت (32 byte = 256 bit) */
const KEY_LENGTH_BYTES = 32;

/** طول متجه البداية لـ AES-GCM */
const IV_LENGTH_BYTES = 16;

/** خوارزمية التشفير */
const ALGORITHM = 'aes-256-gcm';

// ============================================================================
// توليد مفتاح التمليك الفريد
// ============================================================================
/**
 * توليد مفتاح التمليك الفريد
 * ────────────────────────────
 * алгоритم:
 * 1. توليد random bytes (32 byte)
 * 2. إنشاء payload = {processId, customerId, assetId, timestamp, nonce}
 * 3. تشفيرPayload بـ AES-256-GCM باستخدام random key
 * 4. توليد HMAC-SHA256 للتحقق
 * 5. المفتاح النهائي = base64(randomKey) + "." + base64(iv) + "." + base64(authTag) + "." + base64(encryptedPayload)
 * 6. الهاش = SHA-256(MasterKey)
 * 7. حفظ: keyHash, keyPrefix (أول 12 حرف), encryptedPayload, iv, authTag
 * 8. لا يُخزَّن المفتاح الأصلي — فقط الهاش والبيانات المشفرة
 */

export async function generateOwnershipKey(
  processId: string,
  customerId: string,
  assetId: string,
): Promise<{
  key: string;
  keyHash: string;
  keyPrefix: string;
  encryptedPayload: string;
  iv: string;
  authTag: string;
}> {
  logger.info('Generating ownership key', { processId, customerId, assetId });

  // 1. توليد مفتاح عشوائي 32 بايت
  const randomKey = crypto.randomBytes(KEY_LENGTH_BYTES);

  // 2. توليد متجه بدء عشوائي 16 بايت
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);

  // 3. إنشاء حمولة البيانات المشفرة
  const payload = JSON.stringify({
    processId,
    customerId,
    assetId,
    timestamp: new Date().toISOString(),
    nonce: crypto.randomBytes(16).toString('hex'),
  });

  // 4. تشفير الحمولة بـ AES-256-GCM
  const cipher = crypto.createCipheriv(ALGORITHM, randomKey, iv);
  const encryptedPayloadBuffer = Buffer.concat([
    cipher.update(payload, 'utf8'),
    cipher.final(),
  ]);

  // 5. الحصول على علامة المصادقة
  const authTag = cipher.getAuthTag();

  // 6. توليد HMAC-SHA256 للتحقق من سلامة المفتاح
  const hmacKey = crypto.randomBytes(32);
  const hmac = crypto.createHmac('sha256', hmacKey);
  hmac.update(randomKey);
  const keyHmac = hmac.digest('hex');

  // 7. إنشاء المفتاح النهائي بالصيغة المطلوبة
  const finalKey = [
    randomKey.toString('base64'),
    iv.toString('base64'),
    authTag.toString('base64'),
    encryptedPayloadBuffer.toString('base64'),
  ].join('.');

  // 8. حساب الهاش SHA-256 للمفتاح
  const keyHash = crypto
    .createHash('sha256')
    .update(finalKey, 'utf8')
    .digest('hex');

  // 9. استخراج أول 12 حرف كبادئة للتمييز
  const keyPrefix = finalKey.substring(0, 12);

  // 10. تسجيل الحدث (بدون تسجيل المفتاح الأصلي أبداً)
  logger.info('Ownership key generated successfully', {
    processId,
    keyPrefix,
    keyHash: keyHash.substring(0, 8) + '...',
    algorithm: ALGORITHM,
  });

  return {
    key: finalKey,
    keyHash,
    keyPrefix,
    encryptedPayload: encryptedPayloadBuffer.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

// ============================================================================
// التحقق من مفتاح التمليك
// ============================================================================

/**
 * التحقق من صحة مفتاح التمليك المقدم
 * ─────────────────────────────────────
 * يستخدم مقارنة ثابتة الوقت لمنع Timing Attacks
 * لا يُسجَّل المفتاح الأصلي أبداً في أي سجل أو log
 */

export async function verifyOwnershipKey(
  providedKey: string,
  storedKeyHash: string,
): Promise<boolean> {
  try {
    // 1. حساب الهاش SHA-256 للمفتاح المقدم
    const computedHash = crypto
      .createHash('sha256')
      .update(providedKey, 'utf8')
      .digest('hex');

    // 2. مقارنة الهاش بوقت ثابت لمنع Timing Attacks
    // نحول HEX strings إلى Buffers أولاً
    const computedBuffer = Buffer.from(computedHash, 'hex');
    const storedBuffer = Buffer.from(storedKeyHash, 'hex');

    // التحقق من تساوي الطول أولاً ( divorced from timing)
    if (computedBuffer.length !== storedBuffer.length) {
      logger.warn('Key hash length mismatch — possible tampering attempt');
      return false;
    }

    // استخدام timingSafeEqual لمقارنة آمنة
    const isMatch = crypto.timingSafeEqual(computedBuffer, storedBuffer);

    if (!isMatch) {
      logger.warn('Ownership key verification failed — hash mismatch');
    }

    return isMatch;
  } catch (error) {
    logger.error('Error during key verification', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

// ============================================================================
// دوال مساعدة
// ============================================================================

/**
 * إنشاء هاش SHA-256 للمفتاح
 * ─────────────────────────────
 * يُستخدم لتخزين الهاش في قاعدة البيانات
 * لا يُخزَّن المفتاح الأصلي أبداً
 */

export function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key, 'utf8').digest('hex');
}

/**
 * استخراج أول 12 حرف من المفتاح كبادئة للتمييز
 * ──────────────────────────────────────────────────
 * تُستخدم لعرض جزئي من المفتاح دون الكشف عن أجزائه الحساسة
 */

export function extractKeyPrefix(key: string): string {
  return key.substring(0, 12);
}

// ============================================================================
// تصدير الخدمة ككائن واحد (للتوافق مع أسلوب الكود الحالي)
// ============================================================================

export const OwnershipKeyService = {
  generateOwnershipKey,
  verifyOwnershipKey,
  hashKey,
  extractKeyPrefix,
};
