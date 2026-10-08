// ============================================================================
// GOLD MOBILE — LOCALIZATION SERVICE
// ============================================================================
// خدمة التوطين — دعم 3 لغات (AR/FR/EN) مع RTL تلقائي

import { I18nManager } from 'react-native';
import ar from '../locales/ar.json';
import fr from '../locales/fr.json';
import en from '../locales/en.json';
import { Language } from '../types';

/** قاموس الترجمات */
const TRANSLATIONS: Record<Language, typeof ar> = { AR: ar, FR: fr, EN: en };

/** حالة RTL الحالية */
let currentDirection: 'rtl' | 'ltr' = 'ltr';

/**
 * Localization Service
 * ─────────────────────
 * يدير الترجمة واتجاه الواجهة
 *
 * المبادئ:
 * 1. AR = RTL + Noto Sans Arabic
 * 2. FR/EN = LTR + Inter
 * 3. الترجمة عبر نقاط مفصولة (e.g., "auth.login")
 * 4. fallback إلى EN إذا كانت الترجمة غير موجودة
 */

/** جلب ترجمة بنقطة مفصولة */
export function t(key: string, lang: Language = 'EN'): string {
  const keys = key.split('.');
  let result: any = TRANSLATIONS[lang];

  for (const k of keys) {
    result = result?.[k];
  }

  if (typeof result === 'string') {
    return result;
  }

  // fallback إلى EN
  let fallback: any = TRANSLATIONS.EN;
  for (const k of keys) {
    fallback = fallback?.[k];
  }

  return typeof fallback === 'string' ? fallback : key;
}

/** تعيين اتجاه الواجهة بناءً على اللغة */
export function setDirection(lang: Language): 'rtl' | 'ltr' {
  const direction = lang === 'AR' ? 'rtl' : 'ltr';

  if (currentDirection !== direction) {
    currentDirection = direction;
    I18nManager.forceRTL(direction === 'rtl');
    I18nManager.allowRTL(direction === 'rtl');
  }

  return direction;
}

/** جلب الاتجاه الحالي */
export function getCurrentDirection(): 'rtl' | 'ltr' {
  return currentDirection;
}

/** جلب قائمة اللغات المدعومة */
export function getSupportedLanguages(): Array<{ code: Language; name: string; nativeName: string }> {
  return [
    { code: 'AR', name: 'Arabic', nativeName: 'العربية' },
    { code: 'FR', name: 'French', nativeName: 'Français' },
    { code: 'EN', name: 'English', nativeName: 'English' },
  ];
}

/** ترجمة اسم المعدن */
export function translateMetalType(metal: string, lang: Language): string {
  const translations: Record<Language, Record<string, string>> = {
    AR: { GOLD: 'ذهب', SILVER: 'فضة', PLATINUM: 'بلاتين', PALLADIUM: 'بالاديوم', GEMSTONE: 'حجر كريم' },
    FR: { GOLD: 'Or', SILVER: 'Argent', PLATINUM: 'Platine', PALLADIUM: 'Palladium', GEMSTONE: 'Pierre précieuse' },
    EN: { GOLD: 'Gold', SILVER: 'Silver', PLATINUM: 'Platinum', PALLADIUM: 'Palladium', GEMSTONE: 'Gemstone' },
  };
  return translations[lang]?.[metal] || metal;
}

/** ترجمة نوع المنتج */
export function translateProductType(type: string, lang: Language): string {
  const translations: Record<Language, Record<string, string>> = {
    AR: { BAR: 'سبائك', COIN: 'عملات', JEWELLERY: 'مجوهرات', BULLION: 'سبائك استثمارية', GEMSTONE: 'أحجار', SCRAP: 'مخلفات', CUSTOM: 'مخصص' },
    FR: { BAR: 'Lingot', COIN: 'Pièce', JEWELLERY: 'Bijou', BULLION: 'Lingot d\'investissement', GEMSTONE: 'Pierre', SCRAP: 'Ferraille', CUSTOM: 'Personnalisé' },
    EN: { BAR: 'Bar', COIN: 'Coin', JEWELLERY: 'Jewellery', BULLION: 'Investment Bullion', GEMSTONE: 'Gemstone', SCRAP: 'Scrap', CUSTOM: 'Custom' },
  };
  return translations[lang]?.[type] || type;
}

/** ترجمة حالة الأصل */
export function translateAssetStatus(status: string, lang: Language): string {
  const translations: Record<Language, Record<string, string>> = {
    AR: {
      RAW_MATERIAL: 'مادة خام', IN_REFINING: 'قيد التكرير', READY_FOR_ASSAY: 'جاهز للفحص',
      IN_ASSAY: 'قيد الفحص', ASSAYED: 'تم الفحص', CERTIFIED: 'معتمد', INVENTORY: 'في المخزون',
      LISTED: 'معروض', IN_CUSTODY: 'في الخزينة', IN_TRANSIT: 'قيد النقل', DELIVERED: 'تم التسليم',
      SOLD: 'تم البيع', DECOMMISSIONED: 'مخرج من الخدمة',
    },
    FR: {
      RAW_MATERIAL: 'Matière première', IN_REFINING: 'En raffinage', READY_FOR_ASSAY: 'Prêt pour analyse',
      IN_ASSAY: 'En analyse', ASSAYED: 'Analysé', CERTIFIED: 'Certifié', INVENTORY: 'En inventaire',
      LISTED: 'Listé', IN_CUSTODY: 'En garde', IN_TRANSIT: 'En transit', DELIVERED: 'Livré',
      SOLD: 'Vendu', DECOMMISSIONED: 'Hors service',
    },
    EN: {
      RAW_MATERIAL: 'Raw Material', IN_REFINING: 'In Refining', READY_FOR_ASSAY: 'Ready for Assay',
      IN_ASSAY: 'In Assay', ASSAYED: 'Assayed', CERTIFIED: 'Certified', INVENTORY: 'In Inventory',
      LISTED: 'Listed', IN_CUSTODY: 'In Custody', IN_TRANSIT: 'In Transit', DELIVERED: 'Delivered',
      SOLD: 'Sold', DECOMMISSIONED: 'Decommissioned',
    },
  };
  return translations[lang]?.[status] || status;
}

/** ترجمة حالة NFC */
export function translateNfcStatus(locked: boolean, lang: Language): string {
  if (locked) {
    return lang === 'AR' ? 'مقفل' : lang === 'FR' ? 'Verrouillé' : 'Locked';
  }
  return lang === 'AR' ? 'نشط' : lang === 'FR' ? 'Actif' : 'Active';
}

/** ترجمة حالة التحقق */
export function translateVerificationStatus(status: string, lang: Language): string {
  const translations: Record<Language, Record<string, string>> = {
    AR: { VERIFIED: 'موثق — أصلي', TAMPERED: 'تم التلاعب', REVOKED: 'تم الإلغاء', NOT_FOUND: 'غير موجود' },
    FR: { VERIFIED: 'Certifié — Authentique', TAMPERED: 'Altération détectée', REVOKED: 'Révoqué', NOT_FOUND: 'Introuvable' },
    EN: { VERIFIED: 'Certified — Authentic', TAMPERED: 'Tampering Detected', REVOKED: 'Revoked', NOT_FOUND: 'Not Found' },
  };
  return translations[lang]?.[status] || status;
}
