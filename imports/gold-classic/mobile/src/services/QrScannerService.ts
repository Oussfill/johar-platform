// ============================================================================
// GOLD MOBILE — QR SCANNER SERVICE
// ============================================================================
// خدمة المسح الضوئي لرموز QR
// تدعم: قراءة QR Code + استخراج Gold ID + استخراج Passport Number
// + التحقق من صيغة الرابط + فتح صفحة التحقق المباشر

import { Platform, Linking } from 'react-native';
import { QrScanResult } from '../types';

/** أنماط QR المدعومة */
const QR_PATTERNS = {
  // رابط التحقق العام
  VERIFY_URL: /https?:\/\/(?:www\.)?gold-platform\.com\/verify\/([A-Z0-9-]+)/i,
  // Gold ID مباشرة
  GOLD_ID: /^GOLD-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
  // Passport Number
  PASSPORT: /^DP-[A-Z0-9]+$/i,
  // NFC URL specifier
  NFC_URL: /gold:\/\/verify\?id=([A-Z0-9-]+)/i,
  // Generic JSON payload
  JSON_PAYLOAD: /^\{.*"goldId".*\}$/s,
} as const;

/**
 * QR Scanner Service
 * ───────────────────
 * يدير عمليات المسح الضوئي لرموز QR
 *
 * يدعم:
 * 1. روابط التحقق المباشرة (gold-platform.com/verify/...)
 * 2. Gold ID مباشرة (GOLD-XXXX-XXXX-XXXX)
 * 3. Passport Numbers (DP-XXXXXXXXXX)
 * 4. JSON payloads من الشرائح الذكية
 * 5. Deep links للتطبيق (gold://verify?id=...)
 */
class QrScannerService {
  /**
   * تحليل نتيجة مسح QR
   *
   * يتحقق من نوع البيانات ويستخرج المعرفات المناسبة
   *
   * @param rawData - البيانات الخام من ماسح QR
   * @returns نتيجة محققة مع Gold ID أو Passport Number
   */
  parseQrData(rawData: string): QrScanResult {
    const trimmed = rawData.trim();
    const timestamp = Date.now();

    // 1. فحص رابط التحقق
    const verifyMatch = trimmed.match(QR_PATTERNS.VERIFY_URL);
    if (verifyMatch) {
      return {
        data: trimmed,
        type: 'VERIFY_URL',
        goldId: verifyMatch[1],
        timestamp,
      };
    }

    // 2. فحص Gold ID مباشرة
    if (QR_PATTERNS.GOLD_ID.test(trimmed)) {
      return {
        data: trimmed,
        type: 'GOLD_ID',
        goldId: trimmed,
        timestamp,
      };
    }

    // 3. فحص Passport Number
    if (QR_PATTERNS.PASSPORT.test(trimmed)) {
      return {
        data: trimmed,
        type: 'PASSPORT',
        passportNumber: trimmed,
        timestamp,
      };
    }

    // 4. فحص NFC Deep Link
    const nfcMatch = trimmed.match(QR_PATTERNS.NFC_URL);
    if (nfcMatch) {
      return {
        data: trimmed,
        type: 'NFC_DEEP_LINK',
        goldId: nfcMatch[1],
        timestamp,
      };
    }

    // 5. فحص JSON payload
    if (QR_PATTERNS.JSON_PAYLOAD.test(trimmed)) {
      try {
        const parsed = JSON.parse(trimmed);
        return {
          data: trimmed,
          type: 'JSON_PAYLOAD',
          goldId: parsed.goldId || parsed.gold_id,
          passportNumber: parsed.passportNumber || parsed.passport_number,
          timestamp,
        };
      } catch {
        // JSON غير صالح — نُعامله كـ raw data
      }
    }

    // 6. أي نوع آخر — raw data
    return {
      data: trimmed,
      type: 'UNKNOWN',
      timestamp,
    };
  }

  /**
   * التحقق من صيغة Gold ID
   * الصيغة: GOLD-XXXX-XXXX-XXXX (4 أحرف/أرقام لكل قسم)
   */
  isValidGoldId(goldId: string): boolean {
    return /^GOLD-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(goldId);
  }

  /**
   * التحقق من صيغة Passport Number
   * الصيغة: DP-XXXXXXXXXX (حرف DP- متبوع بأرقام/أحرف)
   */
  isValidPassportNumber(passport: string): boolean {
    return /^DP-[A-Z0-9]+$/i.test(passport);
  }

  /**
   * بناء رابط التحقق للخادم
   * يُستخدم لتحميل بيانات التحقق عبر API
   */
  buildVerificationUrl(
    baseUrl: string,
    goldId?: string,
    passportNumber?: string,
    lang: string = 'EN',
    currency: string = 'USD',
  ): string {
    if (passportNumber) {
      return `${baseUrl}/api/v1/assets/verify/${passportNumber}?lang=${lang}&currency=${currency}`;
    }
    if (goldId) {
      return `${baseUrl}/api/v1/assets/gold/${goldId}?lang=${lang}&currency=${currency}`;
    }
    throw new Error('Either goldId or passportNumber is required');
  }

  /**
   * فتح رابط التحقق في المتصفح
   * يُستخدم كخيار بديل عند عدم توفر API
   */
  async openVerificationUrl(goldId: string): Promise<boolean> {
    const url = `https://gold-platform.com/verify/${goldId}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const qrScanner = new QrScannerService();
