// ============================================================================
// GOLD PLATFORM — GOLD PRICING ENGINE
// ============================================================================
// محرك التسعير المتعدد — لا يعتمد على سعر أحادي
// المعادلة المؤسسية:
// FINAL PRICE = REFERENCE GOLD PRICE + METAL VALUE + MANUFACTURING + REFINING
//             + ASSAY/CERTIFICATION + PACKAGING + INSURANCE + LOGISTICS
//             + MARKETPLACE FEE + TAXES
//
// يدعم التسعير اللحظي بالدينار الجزائري (DZD)، اليورو (EUR)، والدولار الأمريكي (USD)

import { Currency, MetalType } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { CurrencyAmount, PricingBreakdown } from '../types';
import { convertCurrency, formatCurrencyAmount, fetchGoldPricePerGram } from '../utils/currency';

// ============================================================================
// METAL PRICE DATA — بيانات أسعار المعادن (بديل: API لحظي)
// ============================================================================

interface MetalPriceData {
  metalType: MetalType;
  pricePerGramUsd: number;
  lastUpdated: Date;
  source: string;
}

// في الإنتاج: يجب جلب هذه الأسعار من API موثوق
// مثال: Kitco, GoldPrice.org, Metalary
const METAL_PRICES: Record<MetalType, number> = {
  GOLD: 65.50,
  SILVER: 0.85,
  PLATINUM: 32.20,
  PALLADIUM: 38.75,
  GEMSTONE: 0, // الأحجار الكريمة لا لها سعر مرجعي واحد
};

// ============================================================================
// GOLD PRICING ENGINE SERVICE
// ============================================================================

export class GoldPricingEngine {
  /**
   * حساب السعر النهائي للقطعة وفقاً للمعادلة المؤسسية
   *
   * @param params Parameters حساب التسعير
   * @returns PricingBreakdown تفكيك السعر الكامل
   */
  static async calculateFinalPrice(params: {
    assetId: string;
    metalType: MetalType;
    weightGrams: number;
    purityPercent: number;
    karat?: number;
    manufacturingCost: number;
    refiningCost: number;
    assayCost: number;
    packagingCost: number;
    insurancePercent: number;
    logisticsCost: number;
    marketplaceFeePercent: number;
    taxPercent: number;
    targetCurrency: Currency;
    language: 'AR' | 'FR' | 'EN';
  }): Promise<PricingBreakdown> {
    const {
      metalType,
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
      targetCurrency,
      language,
    } = params;

    // 1. جلب سعر المعدن المرجعي بالدولار
    const referencePriceUsd = METAL_PRICES[metalType];
    if (!referencePriceUsd) {
      throw new Error(`No reference price available for ${metalType}`);
    }

    // 2. تحويل السعر المرجعي للعملة المستهدفة
    const referencePricePerGram = convertCurrency(referencePriceUsd, 'USD', targetCurrency);

    // 3. حساب قيمة المعدن الصافي
    //    METAL VALUE = سعر المرجعي × الوزن × (النقاوة / 100)
    const metalValue = referencePricePerGram * weightGrams * (purityPercent / 100);

    // 4. حساب التأمين (نسبة من القيمة المعدنية + التصنيع)
    const subtotalForInsurance = metalValue + manufacturingCost + refiningCost;
    const insuranceCost = subtotalForInsurance * (insurancePercent / 100);

    // 5. الإجمالي قبل رسوم المنصة والضرائب
    const subtotalBeforeFees =
      metalValue +
      manufacturingCost +
      refiningCost +
      assayCost +
      packagingCost +
      insuranceCost +
      logisticsCost;

    // 6. حساب رسوم المنصة
    const marketplaceFee = subtotalBeforeFees * (marketplaceFeePercent / 100);

    // 7. الإجمالي قبل الضرائب
    const subtotalBeforeTax = subtotalBeforeFees + marketplaceFee;

    // 8. حساب الضرائب
    const taxAmount = subtotalBeforeTax * (taxPercent / 100);

    // 9. السعر النهائي
    const finalPrice = subtotalBeforeTax + taxAmount;

    logger.info('Price calculated', {
      metalType,
      weightGrams,
      purityPercent,
      referencePricePerGram,
      finalPrice,
      targetCurrency,
    });

    return {
      metalValue: formatCurrencyAmount(metalValue, targetCurrency, language),
      manufacturingCost: formatCurrencyAmount(manufacturingCost, targetCurrency, language),
      refiningCost: formatCurrencyAmount(refiningCost, targetCurrency, language),
      assayCost: formatCurrencyAmount(assayCost, targetCurrency, language),
      packagingCost: formatCurrencyAmount(packagingCost, targetCurrency, language),
      insuranceCost: formatCurrencyAmount(insuranceCost, targetCurrency, language),
      logisticsCost: formatCurrencyAmount(logisticsCost, targetCurrency, language),
      marketplaceFee: formatCurrencyAmount(marketplaceFee, targetCurrency, language),
      taxAmount: formatCurrencyAmount(taxAmount, targetCurrency, language),
      total: formatCurrencyAmount(finalPrice, targetCurrency, language),
    };
  }

  /**
   * جلب السعر المرجعي الحالي لمعدن معين
   */
  static async getReferencePrice(
    metalType: MetalType,
    currency: Currency,
  ): Promise<CurrencyAmount> {
    const priceUsd = METAL_PRICES[metalType];
    if (!priceUsd) {
      throw new Error(`No reference price for ${metalType}`);
    }

    const priceInCurrency = convertCurrency(priceUsd, 'USD', currency);
    return formatCurrencyAmount(priceInCurrency, currency, 'EN');
  }

  /**
   * مقارنة الأسعار بين العملات المختلفة
   */
  static async comparePricesAcrossCurrencies(
    metalType: MetalType,
    weightGrams: number,
    purityPercent: number,
  ): Promise<Record<Currency, CurrencyAmount>> {
    const results: Partial<Record<Currency, CurrencyAmount>> = {};

    for (const currency of ['USD', 'EUR', 'DZD'] as Currency[]) {
      const metalValueUsd = METAL_PRICES[metalType] * weightGrams * (purityPercent / 100);
      const metalValue = convertCurrency(metalValueUsd, 'USD', currency);
      results[currency] = formatCurrencyAmount(metalValue, currency, 'EN');
    }

    return results as Record<Currency, CurrencyAmount>;
  }

  /**
   * حساب سعر الجرام الواحد بالkarat المحدد
   */
  static getKaratPricePerGram(
    metalType: MetalType,
    karat: number,
    currency: Currency,
  ): CurrencyAmount {
    const basePriceUsd = METAL_PRICES[metalType];
    const purityRatio = karat / 24;
    const pricePerGramUsd = basePriceUsd * purityRatio;
    const pricePerGram = convertCurrency(pricePerGramUsd, 'USD', currency);
    return formatCurrencyAmount(pricePerGram, currency, 'EN');
  }
}
