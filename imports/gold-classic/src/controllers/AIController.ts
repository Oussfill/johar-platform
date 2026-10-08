// ============================================================================
// GOLD PLATFORM — AI CONTROLLER
// ============================================================================
// Controller لمحركات الذكاء الاصطناعي
// يتضمن: تحليل المجوهرات، كشف الاحتيال، تقييم القيمة

import { Request, Response } from 'express';
import { Language, Currency, MetalType } from '@prisma/client';
import { prisma } from '../config/database';
import { logger, AI_DISCLAIMER } from '../config/logger';
import { AIPreciousMetalsAssistant } from '../services/AIPreciousMetalsAssistant';
import { GoldFraudIntelligenceEngine } from '../services/GoldFraudIntelligenceEngine';
import { GoldPricingEngine } from '../services/GoldPricingEngine';
import { convertCurrency, formatCurrencyAmount } from '../utils/currency';
import { isValidUuid } from '../utils/guards';

// ============================================================================
// POST /api/v1/ai/analyze-jewellery — تحليل المجوهرات بالذكاء الاصطناعي
// ============================================================================

export async function analyseJewellery(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const { metalType, weightGrams, karat, images, estimatedGemstones } =
      (req as any).validatedData;

    // 1. تحليل المجوهرات بالذكاء الاصطناعي
    const aiResult = await AIPreciousMetalsAssistant.analyseJewellery({
      assetId: `AI-${Date.now().toString(36).toUpperCase()}`,
      metalType: metalType as MetalType,
      weightGrams,
      karat,
      images,
      estimatedGemstones,
    });

    // 2. حساب التسعير وفقاً للمعادلة المؤسسية
    const goldPricePerGram = await GoldPricingEngine.getReferencePrice(
      metalType as MetalType,
      currency,
    );

    const pricingBreakdown = await GoldPricingEngine.calculateFinalPrice({
      assetId: aiResult.assetId,
      metalType: metalType as MetalType,
      weightGrams,
      purityPercent: aiResult.predictedPurity,
      karat: aiResult.predictedKarat,
      manufacturingCost: 50, // تقدير افتراضي — في الإنتاج: من قاعدة بيانات التصنيع
      refiningCost: 15,
      assayCost: 25,
      packagingCost: 10,
      insurancePercent: 2,
      logisticsCost: 30,
      marketplaceFeePercent: 3,
      taxPercent: 19, // TVA في الجزائر
      targetCurrency: currency,
      language: lang,
    });

    // 3. تحليل الأحجار الكريمة (إذا وجدت)
    let gemstoneValue = formatCurrencyAmount(0, currency, lang);
    if (estimatedGemstones && estimatedGemstones.length > 0) {
      const gemValue = estimatedGemstones.reduce((total: number, gem: any) => {
        // تقدير قيمة الأحجار الكريمة بناءً على النوع والنوعية
        const gemPrices: Record<string, number> = {
          diamond: 8000,
          ruby: 5000,
          emerald: 4000,
          sapphire: 3500,
        };
        const pricePerCarat = gemPrices[gem.type.toLowerCase()] || 1000;
        return total + pricePerCarat * gem.carat;
      }, 0);
      gemstoneValue = formatCurrencyAmount(gemValue, currency, lang);
    }

    // 4. تحديد التوصية
    const recommendations: Record<Language, string[]> = {
      AR: [
        'يُنصح بفحص مختبري شامل للتحقق النهائي من النقاوة',
        'السعر المقدر هو تقدير أولي ولا يُلزم بالبيع',
        'يجب مراجعة الشهادة المختبرية الصادرة عن مختبر معتمد (ISO 17025)',
      ],
      FR: [
        "Une analyse de laboratoire complète est recommandée pour la vérification finale de la pureté",
        "L'estimation de prix est une évaluation préliminaire et n'engage pas à la vente",
        "Le certificat de laboratoire délivré par un laboratoire accrédité (ISO 17025) doit être consulté",
      ],
      EN: [
        'Comprehensive laboratory analysis recommended for final purity verification',
        'Price estimate is preliminary and does not constitute a binding offer',
        'Consult the laboratory certificate issued by an ISO 17025 accredited lab',
      ],
    };

    logger.info('AI Jewellery analysis completed via API', {
      metalType,
      weightGrams,
      confidenceScore: aiResult.confidenceScore,
      processingTimeMs: aiResult.processingTimeMs,
    });

    const response: any = {
      success: true,
      data: {
        analysis: {
          metalType,
          weightGross: weightGrams,
          karat: aiResult.predictedKarat,
          predictedPurity: aiResult.predictedPurity,
          confidenceScore: aiResult.confidenceScore,
          requiresHumanReview: aiResult.requiresHumanReview,
          processingTimeMs: aiResult.processingTimeMs,
          anomalyDetected: aiResult.anomalyDetected,
        },
        valuation: {
          metalValue: pricingBreakdown.metalValue,
          manufacturingCost: pricingBreakdown.manufacturingCost,
          refiningCost: pricingBreakdown.refiningCost,
          assayCost: pricingBreakdown.assayCost,
          packagingCost: pricingBreakdown.packagingCost,
          insuranceCost: pricingBreakdown.insuranceCost,
          logisticsCost: pricingBreakdown.logisticsCost,
          marketplaceFee: pricingBreakdown.marketplaceFee,
          taxAmount: pricingBreakdown.taxAmount,
          estimatedRetailPrice: pricingBreakdown.total,
          gemstoneValue,
          currency,
        },
        recommendations: recommendations[lang],
        disclaimer: AI_DISCLAIMER[lang.toLowerCase() as keyof typeof AI_DISCLAIMER],
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('AI Jewellery analysis failed', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_ANALYSIS_FAILED',
        message: 'AI analysis service unavailable',
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// ============================================================================
// POST /api/v1/ai/fraud-check — فحص الاحتيال
// ============================================================================

export async function fraudCheck(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const { assetId } = req.body;

    // حارس المدخلات: assetId مطلوب (400 بدل استدعاء الخدمة فارغاً)
    if (!assetId || typeof assetId !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data Validation Error',
          details: [{ field: 'assetId', message: 'Asset id is required' }],
        },
      });
      return;
    }
    if (!isValidUuid(assetId)) {
      res.status(404).json({
        success: false,
        error: { code: 'ASSET_NOT_FOUND', message: 'Asset not found' },
      });
      return;
    }

    // جلب بيانات الأصل
    const asset = await prisma.goldAsset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        goldId: true,
        serialNumber: true,
        metalType: true,
        weightGross: true,
        measuredPurity: true,
        karat: true,
        nfcUidHash: true,
      },
    });

    if (!asset) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: 'Asset not found',
        },
      });
      return;
    }

    // تنفيذ الفحص الشامل للكشف عن الاحتيال
    const fraudResult =
      await GoldFraudIntelligenceEngine.performComprehensiveFraudCheck({
        assetId: asset.id,
        serialNumber: asset.serialNumber,
        metalType: asset.metalType,
        weightGrams: Number(asset.weightGross),
        measuredPurity: asset.measuredPurity ? Number(asset.measuredPurity) : undefined,
        karat: asset.karat || undefined,
        nfcUidHash: asset.nfcUidHash || undefined,
      });

    const response: any = {
      success: true,
      data: {
        assetId: asset.id,
        goldId: asset.goldId,
        riskAssessment: {
          riskLevel: fraudResult.riskLevel,
          riskScore: fraudResult.riskScore,
          requiresHumanReview: fraudResult.requiresHumanReview,
          recommendation: fraudResult.recommendation,
        },
        anomalies: fraudResult.anomalies.map((a) => ({
          type: a.type,
          description: a.description,
          severity: a.severity,
          details: a.details,
        })),
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Fraud check failed', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'FRAUD_CHECK_FAILED',
        message: 'Fraud detection service unavailable',
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}
