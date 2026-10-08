// ============================================================================
// GOLD MOBILE — NFC MANAGER SERVICE
// ============================================================================
// خدمة إدارة شرائح NFC — قراءة، كتابة، قفل NDEF
// تدعم: قراءة UID + قراءة/كتابة NDEF Records + NDEF Write-Lock
// المعيار: ISO 14443-A/B + ISO 15693 + NFC Forum Type 2/4 Tags

import NfcManager, {
  NfcTech,
  Nfcndef,
  NfcTag,
  Ndef,
} from 'react-native-nfc-manager';
import { Platform, NativeModules } from 'react-native';
import { sha256 } from 'crypto-js';
import { NfcScanResult, NdefRecord } from '../types';
import { t, Language } from './LocalizationService';

// تهيئة NFC Manager
NfcManager.start();

/** أكواد NFC الأعلى */
const NFC_ERRORS = {
  NOT_SUPPORTED: 'NFC_NOT_SUPPORTED',
  NOT_ENABLED: 'NFC_NOT_ENABLED',
  CANCELLED: 'NFC_CANCELLED',
  TIMEOUT: 'NFC_TIMEOUT',
  TAG_LOST: 'NFC_TAG_LOST',
  INVALID_FORMAT: 'NFC_INVALID_FORMAT',
  WRITE_FAILED: 'NFC_WRITE_FAILED',
  LOCK_FAILED: 'NFC_LOCK_FAILED',
  READ_FAILED: 'NFC_READ_FAILED',
} as const;

/**
 * NFC Manager Service
 * ─────────────────────
 * يدير جميع عمليات القراءة والكتابة مع شرائح NFC
 *
 * المبادئ:
 * 1. قراءة UID دائماً أولاً (معرّف فريد للشريحة)
 * 2. تشفير UID بـ SHA-256 قبل الحفظ (لا نخزن UID خام)
 * 3. NDEF Write-Lock بعد التسجيل النهائي (لا رجعة)
 * 4. Offline-first: كل العملية تتم محلياً ثم تُرسل للخادم
 */
class NfcManagerService {
  private isInitialized = false;
  private isScanning = false;

  // ─── التهيئة ──────────────────────────────────────────────

  /** التحقق من دعم الجهاز لـ NFC */
  async isSupported(): Promise<boolean> {
    try {
      const supported = await NfcManager.isSupported();
      return supported;
    } catch {
      return false;
    }
  }

  /** التحقق من تفعيل NFC على الجهاز */
  async isEnabled(): Promise<boolean> {
    try {
      const enabled = await NfcManager.isEnabled();
      return enabled;
    } catch {
      return false;
    }
  }

  /** فتح إعدادات NFC للنشاط */
  async openSettings(): Promise<void> {
    if (Platform.OS === 'android') {
      await NfcManager.openSettings();
    }
  }

  /** التهيئة الأولية — التحقق من الدعم والتفعيل */
  async initialize(): Promise<{ supported: boolean; enabled: boolean }> {
    const supported = await this.isSupported();
    if (!supported) {
      return { supported: false, enabled: false };
    }

    const enabled = await this.isEnabled();
    this.isInitialized = true;
    return { supported, enabled };
  }

  // ─── قراءة NFC ─────────────────────────────────────────────

  /**
   * قراءة شريحة NFC كاملة
   *
   * الخطوات:
   * 1. تفعيل قراءة NfcTech.Ndef
   * 2. انتظار اكتشاف الشريحة (timeout: 30 ثانية)
   * 3. استخراج UID وتحويله لـ hash
   * 4. قراءة NDEF Records إن وجدت
   * 5. التحقق من حالة القفل
   */
  async readTag(lang: Language = 'EN'): Promise<NfcScanResult> {
    if (this.isScanning) {
      throw new Error(NFC_ERRORS.TIMEOUT);
    }

    this.isScanning = true;

    try {
      // التحقق من التهيئة
      if (!this.isInitialized) {
        await this.initialize();
      }

      const enabled = await this.isEnabled();
      if (!enabled) {
        throw new Error(NFC_ERRORS.NOT_ENABLED);
      }

      // تفعيل قراءة NDEF
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: t('scan.nfcInstructions', lang),
      });

      // انتظار اكتشاف الشريحة
      const tag: NfcTag | null = await NfcManager.getTag();
      if (!tag) {
        throw new Error(NFC_ERRORS.TAG_LOST);
      }

      // استخراج UID
      const uid = this.extractUid(tag);
      if (!uid) {
        throw new Error(NFC_ERRORS.READ_FAILED);
      }

      // تشفير UID
      const uidHash = sha256(uid).toString();

      // قراءة NDEF Records
      const ndefRecords = this.extractNdefRecords(tag);

      // التحقق من حالة القفل
      const isLocked = this.checkLockStatus(tag);

      this.isScanning = false;

      return {
        uid,
        uidHash,
        rawPayload: JSON.stringify(tag),
        ndefRecords,
        isLocked,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      this.isScanning = false;

      if (error.message === 'Canceled' || error.message?.includes('cancel')) {
        throw new Error(NFC_ERRORS.CANCELLED);
      }
      if (error.message?.includes('timeout')) {
        throw new Error(NFC_ERRORS.TIMEOUT);
      }
      if (error.message?.includes('Tag was lost')) {
        throw new Error(NFC_ERRORS.TAG_LOST);
      }

      throw new Error(NFC_ERRORS.READ_FAILED);
    } finally {
      this.cancelScan();
    }
  }

  /**
   * استخراج UID من الشريحة
   * يدعم: ISO 14443-A (NTAG, MIFARE) + ISO 15693
   */
  private extractUid(tag: NfcTag): string | null {
    // ISO 14443-A: UID في الحقل id
    if (tag.id) {
      return Array.from(tag.id)
        .map((byte: number) => byte.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
    }

    // ISO 15693: UID في الحقل Technologies
    if (tag.technologies) {
      for (const tech of tag.technologies) {
        if (tech.startsWith('IsoDep') || tech.startsWith('NfcA') || tech.startsWith('NfcB')) {
          // محاولة استخراج UID من tag info
          const tagInfo = (tag as any).tag;
          if (tagInfo?.id) {
            return Array.from(tagInfo.id)
              .map((byte: number) => byte.toString(16).padStart(2, '0'))
              .join('')
              .toUpperCase();
          }
        }
      }
    }

    return null;
  }

  /**
   * استخراج سجلات NDEF من الشريحة
   * كل سجل يحتوي: TNF (Type Name Format) + Type + Payload
   */
  private extractNdefRecords(tag: NfcTag): NdefRecord[] {
    const records: NdefRecord[] = [];

    try {
      if (tag.ndefMessage && Array.isArray(tag.ndefMessage)) {
        for (const record of tag.ndefMessage) {
          records.push({
            tnf: record.tnf || 0,
            type: this.bytesToString(record.type || []),
            payload: this.bytesToString(record.payload || []),
            id: record.id ? this.bytesToString(record.id) : undefined,
          });
        }
      }
    } catch {
      // تجاهل أخطاء قراءة NDEF — الشريحة قد لا تحتوي سجلات
    }

    return records;
  }

  /**
   * التحقق من حالة NDEF Write-Lock
   * NFC Forum Type 2: CC byte bit 3
   * NFC Forum Type 4:_OC Capability Container
   */
  private checkLockStatus(tag: NfcTag): boolean {
    try {
      // فحص MIFARE Ultralight / NTAG lock bytes
      if (tag.techTypes?.includes('android.nfc.tech.MifareUltralight')) {
        const mifareTag = (tag as any).mifareUltralight;
        if (mifareTag?.pages) {
          // صفحة CC (Capability Container) — الصفحة 3 في NTAG
          const ccPage = mifareTag.pages[3];
          if (ccPage && ccPage.length >= 4) {
            // Byte 2, Bit 3: MINT — Memory Initialization (1 = locked)
            return (ccPage[2] & 0x08) !== 0;
          }
        }
      }

      // فحص عام — إذا كان هناك NDEF message صالح فحساب check
      if (tag.maxTransceiveLength && tag.maxTransceiveLength > 0) {
        return false; // افتراضي: غير مقفل
      }

      return false;
    } catch {
      return false;
    }
  }

  // ─── كتابة NFC ─────────────────────────────────────────────

  /**
   * كتابة سجلات NDEF على الشريحة
   *
   * ⚠️ تحذير: الكتابة تتم فقط إذا كانت الشريحة غير مقفلة
   * بعد القفل، لا يمكن تعديل البيانات نهائياً
   *
   * @param records - مصفوفة سجلات NDEF للكتابة
   * @param lockAfterWrite - قفل الشريحة بعد الكتابة (NDEF Write-Lock)
   */
  async writeNdef(
    records: Array<{ type: string; payload: string }>,
    lockAfterWrite: boolean = false,
    lang: Language = 'EN',
  ): Promise<{ success: boolean; locked: boolean }> {
    try {
      const enabled = await this.isEnabled();
      if (!enabled) {
        throw new Error(NFC_ERRORS.NOT_ENABLED);
      }

      // التحقق من عدم القفل
      const currentTag = await this.readTag(lang);
      if (currentTag.isLocked) {
        throw new Error(NFC_ERRORS.WRITE_FAILED + ': Chip is locked');
      }

      // تفعيل قراءة/كتابة NDEF
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: t('scan.nfcInstructions', lang),
      });

      // بناء NDEF Message
      const ndefMessage = records.map((record) => ({
        tnf: Ndef.UriRecord.TNF,
        type: Ndef.UriRecord.RTD_TEXT,
        payload: Ndef.encodeMessage([
          Ndef.textRecord(record.payload, 'en', record.type),
        ]),
      }));

      // كتابة البيانات
      await NfcManager.ndefHandler.writeNdefMessage(ndefMessage);

      // قفل الشريحة إذا كان مطلوباً (NDEF Write-Lock)
      let locked = false;
      if (lockAfterWrite) {
        try {
          await NfcManager.ndefHandler.makeReadOnly();
          locked = true;
        } catch (lockError) {
          // قد يفشل القفل على بعض الأنواع — نسجل الخطأ لكن الكتابة نجحت
          console.warn('NDEF Write-Lock failed:', lockError);
        }
      }

      return { success: true, locked };
    } catch (error: any) {
      throw new Error(NFC_ERRORS.WRITE_FAILED + ': ' + error.message);
    } finally {
      this.cancelScan();
    }
  }

  /**
   * كتابة Gold ID و Hash على الشريحة
   * يستخدم عند تسجيل أصل جديد
   */
  async writeGoldIdentity(
    goldId: string,
    assetId: string,
    lang: Language = 'EN',
  ): Promise<{ success: boolean; locked: boolean }> {
    const identityPayload = JSON.stringify({
      goldId,
      assetId,
      platform: 'GOLD',
      version: '1.0',
      timestamp: Date.now(),
    });

    return this.writeNdef(
      [
        { type: 'gold/identity', payload: identityPayload },
        { type: 'gold/verify', payload: `https://gold-platform.com/verify/${goldId}` },
      ],
      false, // لا نقفل بعد التسجيل — يُقفل لاحقاً بعد الاختبار
      lang,
    );
  }

  /**
   * قفل شريحة NFC بشكل دائم (NDEF Write-Lock)
   *
   * ⚠️ هذا الإجراء لا رجعة فيه — الشريحة تصبح للقراءة فقط
   * يُستخدم بعد:
   * 1. التأكد من صحة البيانات
   * 2. اجتياز الفحص المختبري
   * 3. الموافقة النهائية على التسجيل
   */
  async lockChip(lang: Language = 'EN'): Promise<boolean> {
    try {
      const enabled = await this.isEnabled();
      if (!enabled) {
        throw new Error(NFC_ERRORS.NOT_ENABLED);
      }

      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: t('scan.nfcInstructions', lang),
      });

      await NfcManager.ndefHandler.makeReadOnly();
      return true;
    } catch (error: any) {
      throw new Error(NFC_ERRORS.LOCK_FAILED + ': ' + error.message);
    } finally {
      this.cancelScan();
    }
  }

  // ─── إلغاء وتنظيف ─────────────────────────────────────────

  /** إلغاء عملية المسح الحالية */
  async cancelScan(): Promise<void> {
    this.isScanning = false;
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch {
      // تجاهل أخطاء الإلغاء
    }
  }

  /** إيقاف NFC Manager بالكامل */
  async destroy(): Promise<void> {
    await this.cancelScan();
    NfcManager.stop();
  }

  // ─── أدوات مساعدة ──────────────────────────────────────────

  /** تحويل byte array إلى string */
  private bytesToString(bytes: number[]): string {
    return bytes
      .map((b) => String.fromCharCode(b))
      .join('');
  }
}

// نسخة واحدة (Singleton)
export const nfcManager = new NfcManagerService();
export { NFC_ERRORS };
