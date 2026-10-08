// ============================================================================
// GOLD PLATFORM — CURRENCY UTILITIES
// ============================================================================
// محرك تحويل العملات وتنسيق العروض多币种

import { Currency } from '@prisma/client';
import { CurrencyAmount, PricingBreakdown } from '../types';

// ============================================================================
// EXCHANGE RATES (بديل: ربط API سعر الصرف اللحظي)
// ============================================================================
// في الإنتاج: يجب جلب هذه الأسعار من API موثوق كل 60 ثانية
// مثال: https://api.exchangeratesapi.io/latest

const EXCHANGE_RATES: Record<Currency, Record<Currency, number>> = {
  USD: { USD: 1, EUR: 0.92, DZD: 135.5 },
  EUR: { EUR: 1, USD: 1.087, DZD: 147.3 },
  DZD: { DZD: 1, USD: 0.00738, EUR: 0.00679 },
};

// ============================================================================
// CONVERSION — تحويل العملات
// ============================================================================

/**
 * تحويل مبلغ من عملة إلى أخرى
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
): number {
  if (from === to) return amount;
  const rate = EXCHANGE_RATES[from][to];
  if (!rate) {
    throw new Error(`Exchange rate not available for ${from} to ${to}`);
  }
  return Math.round(amount * rate * 100) / 100;
}

/**
 * إنشاء مبلغ عملة منسق
 */
export function formatCurrencyAmount(
  amount: number,
  currency: Currency,
  language: 'AR' | 'FR' | 'EN' = 'EN',
): CurrencyAmount {
  const formatter = new Intl.NumberFormat(getLocale(language), {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return {
    amount,
    currency,
    formatted: formatter.format(amount),
  };
}

/**
 * تحويل Locale Code من اللغة إلى كود Intl
 */
function getLocale(lang: 'AR' | 'FR' | 'EN'): string {
  switch (lang) {
    case 'AR': return 'ar-DZ';
    case 'FR': return 'fr-FR';
    case 'EN': return 'en-US';
    default: return 'en-US';
  }
}

// ============================================================================
// GOLD PRICE — سعر الذهب المرجعي
// ============================================================================

/**
 * جلب سعر الذهب المرجعي الحالي (بديل: ربط API حقيقي)
 * في الإنتاج: يجب استخدام API مثل GoldPrice.org أو Kitco
 */
export async function fetchGoldPricePerGram(currency: Currency): Promise<number> {
  // في بيئة الإنتاج، هذا يتصل بـ API سعر الذهب الحقيقي
  // مثال: const response = await axios.get(`${GOLD_PRICE_API_URL}/latest?currency=${currency}`);

  const basePriceUsd = 65.5; // سعر تقريبي للجرام بالدولار
  return convertCurrency(basePriceUsd, 'USD', currency);
}

// ============================================================================
// PRICING BREAKDOWN — تفكيك السعر
// ============================================================================

/**
 * حساب تفكيك السعر الكامل وفقاً للمعادلة المؤسسية:
 * FINAL PRICE = METAL VALUE + MANUFACTURING + REFINING + ASSAY + PACKAGING
 *             + INSURANCE + LOGISTICS + MARKETPLACE FEE + TAXES
 */
export function calculatePricingBreakdown(params: {
  weightGrams: number;
  purityPercent: number;
  manufacturingCost: number;
  refiningCost: number;
  assayCost: number;
  packagingCost: number;
  insurancePercent: number; // نسبة مئوية
  logisticsCost: number;
  marketplaceFeePercent: number;
  taxPercent: number;
  goldPricePerGram: number;
  currency: Currency;
  language: 'AR' | 'FR' | 'EN';
}): PricingBreakdown {
  const {
    weightGrams,
    purityPercent,
    manufacturingCost,
    refiningCost,
    assayCost,
    packagingCost,
    insurancePercent,
    logisticsCost,
    marketplaceFeePercent,
    taxPercent,
    goldPricePerGram,
    currency,
    language,
  } = params;

  // حساب قيمة المعدن الصافي
  const metalValue = goldPricePerGram * weightGrams * (purityPercent / 100);

  // حساب التكاليف الإجمالية قبل الضرائب والرسوم
  const subtotalBeforeFees =
    metalValue +
    manufacturingCost +
    refiningCost +
    assayCost +
    packagingCost;

  // حساب التأمين
  const insuranceCost = subtotalBeforeFees * (insurancePercent / 100);

  // الإجمالي قبل رسوم المنصة والضرائب
  const subtotalBeforeFeeAndTax =
    subtotalBeforeFees + insuranceCost + logisticsCost;

  // حساب رسوم المنصة
  const marketplaceFee = subtotalBeforeFeeAndTax * (marketplaceFeePercent / 100);

  // الإجمالي قبل الضرائب
  const subtotalBeforeTax = subtotalBeforeFeeAndTax + marketplaceFee;

  // حساب الضرائب
  const taxAmount = subtotalBeforeTax * (taxPercent / 100);

  // السعر النهائي
  const finalPrice = subtotalBeforeTax + taxAmount;

  return {
    metalValue: formatCurrencyAmount(metalValue, currency, language),
    manufacturingCost: formatCurrencyAmount(manufacturingCost, currency, language),
    refiningCost: formatCurrencyAmount(refiningCost, currency, language),
    assayCost: formatCurrencyAmount(assayCost, currency, language),
    packagingCost: formatCurrencyAmount(packagingCost, currency, language),
    insuranceCost: formatCurrencyAmount(insuranceCost, currency, language),
    logisticsCost: formatCurrencyAmount(logisticsCost, currency, language),
    marketplaceFee: formatCurrencyAmount(marketplaceFee, currency, language),
    taxAmount: formatCurrencyAmount(taxAmount, currency, language),
    total: formatCurrencyAmount(finalPrice, currency, language),
  };
}
