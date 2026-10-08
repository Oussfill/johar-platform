// ============================================================================
// GOLD PLATFORM — i18n & CURRENCY MIDDLEWARE
// ============================================================================
// Middleware للتحقق من لغة الطلب (AR/FR/EN) وعملة العرض (DZD/EUR/USD)
// وإرجاع الردود باللغة والعملة المحددة مع تبديل اتجاه الواجهة (RTL/LTR)

import { Request, Response, NextFunction } from 'express';
import { Language, Currency } from '@prisma/client';
import arDict from '../locales/ar.json';
import frDict from '../locales/fr.json';
import enDict from '../locales/en.json';
import { LocaleDictionary } from '../types';

// ============================================================================
// DICTIONARY REGISTRY — سجل القاموس حسب اللغة
// ============================================================================

const DICTIONARIES: Record<Language, LocaleDictionary> = {
  AR: arDict as unknown as LocaleDictionary,
  FR: frDict as unknown as LocaleDictionary,
  EN: enDict as unknown as LocaleDictionary,
};

// ============================================================================
// i18n & CURRENCY MIDDLEWARE
// ============================================================================

/**
 * Middleware مركزي لمعالجة التدويل والعملة
 *
 * آلية العمل:
 * 1. يتحقق من رأس اللغة (Accept-Language أو X-Language)
 * 2. يتحقق من رأس العملة (X-Currency)
 * 3. يضيفelize للطلب:
 *    - req.preferredLanguage
 *    - req.preferredCurrency
 *    - req.t() — دالة الترجمة
 *    - req.formatCurrency() — دالة تنسيق العملة
 *    - req.direction — اتجاه الواجهة (rtl/ltr)
 * 4. يضيف رؤوس الاستجابة المناسبة (Content-Language, Direction)
 *
 * ترتيب الأولوية:
 *   رأس اللغة > الإعداد الافتراضي للمستخدم > اللغة الافتراضية للنظام
 */
export function i18nAndCurrencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // استخراج اللغة من الرأس أو الـ query أو الإعداد الافتراضي
  const langHeader =
    req.headers['accept-language'] as string | undefined;
  const langQuery = req.query.lang as string | undefined;
  const langHeaderCustom = req.headers['x-language'] as string | undefined;

  // تحديد اللغة (الأولوية: X-Language > Accept-Language > query > default)
  let preferredLanguage: Language = Language.EN;

  if (langHeaderCustom && isValidLanguage(langHeaderCustom)) {
    preferredLanguage = langHeaderCustom.toUpperCase() as Language;
  } else if (langQuery && isValidLanguage(langQuery)) {
    preferredLanguage = langQuery.toUpperCase() as Language;
  } else if (langHeader) {
    const extractedLang = extractLanguageFromAccept(langHeader);
    if (extractedLang) {
      preferredLanguage = extractedLang;
    }
  }

  // تحديد العملة من الرأس أو الـ query
  const currencyHeader = req.headers['x-currency'] as string | undefined;
  const currencyQuery = req.query.currency as string | undefined;

  let preferredCurrency: Currency = Currency.USD;

  if (currencyHeader && isValidCurrency(currencyHeader)) {
    preferredCurrency = currencyHeader.toUpperCase() as Currency;
  } else if (currencyQuery && isValidCurrency(currencyQuery)) {
    preferredCurrency = currencyQuery.toUpperCase() as Currency;
  }

  // حساب اتجاه الواجهة
  const direction = preferredLanguage === Language.AR ? 'rtl' : 'ltr';

  // إضافة الـ utility functions إلى الطلب
  (req as any).preferredLanguage = preferredLanguage;
  (req as any).preferredCurrency = preferredCurrency;
  (req as any).direction = direction;

  /**
   * دالة الترجمة — تأخذ مسار المفتاح وترجع النص المترجم
   * مثال: req.t('asset.register') → "تسجيل أصل جديد" (بالعربية)
   */
  (req as any).t = (key: string, fallback?: string): string => {
    const dict = DICTIONARIES[preferredLanguage];
    const keys = key.split('.');
    let value: any = dict;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback || key;
      }
    }

    return typeof value === 'string' ? value : fallback || key;
  };

  /**
   * دالة تنسيق العملة — تأخذ مبلغاً وترجع نصاً منسقاً بالعملة المحددة
   * مثال: req.formatCurrency(1250.50) → "$1,250.50" (بالدولار الأمريكي)
   */
  (req as any).formatCurrency = (amount: number): string => {
    const formatter = new Intl.NumberFormat(getLocale(preferredLanguage), {
      style: 'currency',
      currency: preferredCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  };

  // تعيين رؤوس الاستجابة
  res.setHeader('Content-Language', preferredLanguage.toLowerCase());
  res.setHeader('X-Direction', direction);
  res.setHeader('X-Preferred-Currency', preferredCurrency);

  next();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isValidLanguage(lang: string): boolean {
  return ['AR', 'FR', 'EN'].includes(lang.toUpperCase());
}

function isValidCurrency(currency: string): boolean {
  return ['DZD', 'EUR', 'USD'].includes(currency.toUpperCase());
}

function extractLanguageFromAccept(acceptLanguage: string): Language | null {
  // تحليل رأس Accept-Language
  // مثال: "ar-DZ,ar;q=0.9,en;q=0.8"
  const parts = acceptLanguage.split(',');
  for (const part of parts) {
    const lang = part.split(';')[0].trim().split('-')[0].toUpperCase();
    if (lang === 'AR') return Language.AR;
    if (lang === 'FR') return Language.FR;
    if (lang === 'EN') return Language.EN;
  }
  return null;
}

function getLocale(lang: Language): string {
  switch (lang) {
    case Language.AR: return 'ar-DZ';
    case Language.FR: return 'fr-FR';
    case Language.EN: return 'en-US';
    default: return 'en-US';
  }
}
