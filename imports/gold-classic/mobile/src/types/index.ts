// ============================================================================
// GOLD MOBILE — TYPE DEFINITIONS
// ============================================================================
// تعريفات الأنواع لتطبيق الموبايل الميداني

export type Language = 'AR' | 'FR' | 'EN';
export type Currency = 'DZD' | 'EUR' | 'USD';

/** بيانات المستخدم المصادق عليه */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  hierarchy: number;
  preferredLanguage: Language;
  preferredCurrency: Currency;
}

/** بيانات جلسة المصادقة */
export interface AuthSession {
  user: AuthUser;
  token: string;
  tokenType: string;
  expiresIn: string;
}

/** نتيجة قراءة NFC */
export interface NfcScanResult {
  uid: string;
  uidHash: string;
  rawPayload: string | null;
  ndefRecords: NdefRecord[];
  isLocked: boolean;
  timestamp: number;
}

/** سجل NDEF على الشريحة */
export interface NdefRecord {
  tnf: number;
  type: string;
  payload: string;
  id?: string;
}

/** نتيجة مسح QR */
export interface QrScanResult {
  data: string;
  type: string;
  goldId?: string;
  passportNumber?: string;
  timestamp: number;
}

/** بيانات التحقق الميداني */
export interface FieldVerification {
  goldId: string;
  passportNumber: string;
  status: 'VERIFIED' | 'TAMPERED' | 'REVOKED' | 'NOT_FOUND';
  asset: {
    name: string;
    metalType: string;
    karat: number;
    weightGross: string;
    weightNet: string;
    measuredPurity: string;
    productType: string;
    serialNumber: string;
  };
  digitalIdentity: {
    isActive: boolean;
    isLocked: boolean;
    hashChainLength: number;
    nfcUidHash: string | null;
    qrCodeHash: string | null;
  } | null;
  custody: {
    status: string;
    warehouse: string;
  } | null;
  assay: {
    totalAssays: number;
    certifiedPurity: string;
    certifiedKarat: number;
  };
  chainOfCustody: {
    totalEvents: number;
    history: Array<{
      fromEntityId: string;
      toEntityId: string;
      date: string;
      type: string;
    }>;
  };
  disclaimer: string;
  verifiedAt: string;
  verifiedBy: string;
  deviceInfo: DeviceInfo;
}

/** معلومات الجهاز */
export interface DeviceInfo {
  platform: string;
  model: string;
  osVersion: string;
  appVersion: string;
  isOnline: boolean;
  batteryLevel?: number;
}

/** سجل مخزن مؤقتاً (للعمل بدون إنترنت) */
export interface OfflineRecord {
  id: string;
  type: 'VERIFICATION' | 'NFC_SCAN' | 'QR_SCAN' | 'CUSTODY_TRANSFER';
  data: any;
  timestamp: number;
  synced: boolean;
  syncAttempts: number;
  lastSyncAttempt?: number;
}

/** إعدادات التطبيق */
export interface AppSettings {
  language: Language;
  currency: Currency;
  apiBaseUrl: string;
  offlineMode: boolean;
  autoSync: boolean;
  nfcWriteLock: boolean;
  hapticFeedback: boolean;
  soundFeedback: boolean;
  theme: 'dark' | 'light';
}

/** نتيجة الخادم العامة */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
  meta: {
    language: Language;
    currency: Currency;
    timestamp: string;
  };
}
