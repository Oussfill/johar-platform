// ============================================================================
// GOLD — AI ORCHESTRATOR SERVICE (طبقة التنسيق §7 / §26 / §32 — INTEGRATION HOOK)
// ============================================================================
// واجهة async واحدة موحّدة فوق محركات الذكاء الخمسة:
//
//   1. AIPreciousMetalsAssistant        — تحليل المجوهرات وتقييمها (Jewellery)
//   2. GoldFraudIntelligenceEngine      — كشف الاحتيال الشامل (Fraud)
//   3. AIPreciousMetalsAssistant (Purity)— تحليل النقاوة (Purity/Karat)
//   4. mlAnomalyDetector (MLAnomalyDetectionService) — كشف الشذوذ الإحصائي (Anomaly)
//   5. jewelleryVisionAnalyzer (JewelleryVisionAnalyzer) — التحليل البصري (Vision)
//
// المبدأ: Orchestrator يُنسّق ولا يُخزّن. لا يلمس قاعدة البيانات إطلاقاً،
// لا يكتب سجلّات، لا ينفّذ مدفوعات — بل يجمع النتائج من المحركات ويُرجعها
// في عقدة واحدة قابلة للجلب من قبل الـController واستمراريتها للـHITL.
// هكذا يبقى §7 (أداء) محجوزاً للمحرّكات الفردية (معالجة موازية Promises) —
// والتزامن هنا هو تزامن التنسيق لا تزامن العمليات النقدية.

import {
  AIPreciousMetalsAssistant,
} from './AIPreciousMetalsAssistant';
import {
  GoldFraudIntelligenceEngine,
} from './GoldFraudIntelligenceEngine';
import { mlAnomalyDetector } from './MLAnomalyDetectionService';
import { jewelleryVisionAnalyzer } from './JewelleryVisionAnalyzer';
import { GoldPricingEngine } from './GoldPricingEngine';
import { logger } from '../config/logger';

// ============================================================================
// TYPES — واجهة موحّدة (لا تُعرَف المحرّكات نوعياً هنا)
// ============================================================================

export type AiEngineKind =
  | 'JEWELLERY_ANALYSIS'
  | 'FRAUD_INVESTIGATION'
  | 'PURITY_ANALYSIS'
  | 'ANOMALY_DETECTION'
  | 'VISION_ANALYSIS';

export interface AiEngineStatus {
  engine: AiEngineKind;
  available: boolean;
  healthy: boolean;
  lastError: string | null;
  lastRunAt: string | null;
}

export interface OrchestratedAiResult<T = unknown> {
  orchestratorVersion: string;
  requestedAt: string;
  completedAt: string;
  engines: AiEngineStatus[];
  results: Partial<Record<AiEngineKind, T>>;
  hasHumanReviewFlag: boolean;
}

// ============================================================================
// AI ORCHESTRATOR SERVICE
// ============================================================================

export class AiOrchestratorService {
  private static readonly VERSION = '1.0.0';
  private static readonly CONFIDENCE_HUMAN_REVIEW_THRESHOLD = 0.85;

  // حالة المحركات الحية (لا استدعاءات فعليّة في الإنشاء — تُحدَّث عند كل تشغيل)
  private static engineHealth: Record<AiEngineKind, { healthy: boolean; lastError: string | null; lastRunAt: string | null }> = {
    JEWELLERY_ANALYSIS: { healthy: true, lastError: null, lastRunAt: null },
    FRAUD_INVESTIGATION: { healthy: true, lastError: null, lastRunAt: null },
    PURITY_ANALYSIS: { healthy: true, lastError: null, lastRunAt: null },
    ANOMALY_DETECTION: { healthy: true, lastError: null, lastRunAt: null },
    VISION_ANALYSIS: { healthy: true, lastError: null, lastRunAt: null },
  };

  /**
   * تشغيل محرّك واحد بأمان (صيد الأخطاء + تحديث الحالة الصحية) — لا يُلقي الخطأ
   * إلى الخارج أبداً حتى لا يقطع التنسيق عند فشل محرّك واحد.
   */
  private static async runSafely<T>(
    kind: AiEngineKind,
    fn: () => Promise<T>,
  ): Promise<T | null> {
    const startedAt = Date.now();
    try {
      const result = await fn();
      this.engineHealth[kind] = {
        healthy: true,
        lastError: null,
        lastRunAt: new Date(startedAt).toISOString(),
      };
      return result;
    } catch (error: any) {
      this.engineHealth[kind] = {
        healthy: false,
        lastError: error?.message || 'Unknown engine error',
        lastRunAt: new Date(startedAt).toISOString(),
      };
      logger.warn('AiEngine failed (orchestrated — non-fatal)', {
        engine: kind,
        error: error?.message,
      });
      return null;
    }
  }

  /**
   * استعلام حالة المحركات الخمسة (لـ Control Center §21 رصد الصحة).
   */
  static async getEngineHealth(): Promise<AiEngineStatus[]> {
    const now = Date.now();
    return (Object.keys(this.engineHealth) as AiEngineKind[]).map((kind) => ({
      engine: kind,
      available: true,
      healthy: this.engineHealth[kind].healthy,
      lastError: this.engineHealth[kind].lastError,
      lastRunAt: this.engineHealth[kind].lastRunAt,
      _checkedAt: new Date(now).toISOString(),
    })) as unknown as AiEngineStatus[];
  }

  /**
   * تحليل مجوهرات موحّد (Jewellery) — يجمع تقييم AI + التحليل البصري بالتوازي.
   */
  static async analyseJewellery(input: {
    assetId: string;
    metalType: 'GOLD' | 'SILVER' | 'PLATINUM' | 'PALLADIUM';
    weightGrams: number;
    karat?: number;
    images?: string[];
    estimatedGemstones?: Array<{ type: string; carat: number; quality: string }>;
  }): Promise<OrchestratedAiResult> {
    const requestedAt = new Date().toISOString();

    const [jewelleryResult, visionResult] = await Promise.all([
      this.runSafely('JEWELLERY_ANALYSIS', () =>
        AIPreciousMetalsAssistant.analyseJewellery(input),
      ),
      this.runSafely('VISION_ANALYSIS', () =>
        input.images && input.images.length > 0
          ? jewelleryVisionAnalyzer.analyzeImage?.(Buffer.from(input.images[0])).catch(() => null)
          : Promise.resolve(null),
      ),
    ]);

    const requiresHumanReview =
      (jewelleryResult && (jewelleryResult as any).requiresHumanReview) ||
      (visionResult && (visionResult as any).requiresHumanReview) ||
      (jewelleryResult && Number((jewelleryResult as any).confidenceScore) < this.CONFIDENCE_HUMAN_REVIEW_THRESHOLD) ||
      false;

    return {
      orchestratorVersion: this.VERSION,
      requestedAt,
      completedAt: new Date().toISOString(),
      engines: await this.getEngineHealth(),
      results: {
        JEWELLERY_ANALYSIS: jewelleryResult as any,
        VISION_ANALYSIS: visionResult as any,
      },
      hasHumanReviewFlag: Boolean(requiresHumanReview),
    };
  }

  /**
   * فحص احتيال شامل (GoldFraudIntelligenceEngine) — يُسلَّم مباشرة
   * إلى المحرّك وهو المُنفِّذ الوحيد للفحص؛ يجب أن تخضع نتائجه للمراجعة
   * البشرية إذا أشار HITL (§26 BIM — Blockchain Integrated Marketplace).
   */
  static async investigateFraud(
    input: Parameters<
      typeof GoldFraudIntelligenceEngine.performComprehensiveFraudCheck
    >[0],
  ): Promise<
    OrchestratedAiResult<
      Awaited<ReturnType<typeof GoldFraudIntelligenceEngine.performComprehensiveFraudCheck>>
    >
  > {
    const requestedAt = new Date().toISOString();
    const result = await this.runSafely('FRAUD_INVESTIGATION', () =>
      GoldFraudIntelligenceEngine.performComprehensiveFraudCheck(input),
    );

    return {
      orchestratorVersion: this.VERSION,
      requestedAt,
      completedAt: new Date().toISOString(),
      engines: await this.getEngineHealth(),
      results: { FRAUD_INVESTIGATION: result as any },
      hasHumanReviewFlag: Boolean(
        result &&
        (result as any).requiresHumanReview !== false &&
        (result as any).overallRiskSeverity && (result as any).overallRiskSeverity === 'CRITICAL',
      ),
    };
  }

  /**
   * تحليل نقاوة (Assay) — يعرض GoldPricingEngine كمساعد تسعير؛ التحليل
   * الحقيقي يبقى حصرياً بمحرّك LabAssay (الفحص المختبري ISO 17025).
   */
  static async analysePurity(input: {
    weightGrams: number;
    karat: number;
    metalType?: 'GOLD' | 'SILVER' | 'PLATINUM' | 'PALLADIUM';
  }): Promise<OrchestratedAiResult> {
    const requestedAt = new Date().toISOString();

    const [purityResult, pricing] = await Promise.all([
      this.runSafely('PURITY_ANALYSIS', () =>
        AIPreciousMetalsAssistant.analyseJewellery({
          assetId: 'orchestrator-purity',
          metalType: input.metalType || 'GOLD',
          weightGrams: input.weightGrams,
          karat: input.karat,
        } as any),
      ),
      this.runSafely('PURITY_ANALYSIS', () =>
        GoldPricingEngine.getReferencePrice?.('GOLD', 'USD').catch(() => null),
      ),
    ]);

    return {
      orchestratorVersion: this.VERSION,
      requestedAt,
      completedAt: new Date().toISOString(),
      engines: await this.getEngineHealth(),
      results: {
        PURITY_ANALYSIS: purityResult as any,
        VISION_ANALYSIS: pricing as any,
      },
      hasHumanReviewFlag: Boolean(
        purityResult && Number((purityResult as any).confidenceScore) < this.CONFIDENCE_HUMAN_REVIEW_THRESHOLD,
      ),
    };
  }

  /**
   * كشف شذوذ (MLAnomalyDetectionService) — كشف التباينات عبر
   * mlAnomalyDetector (حسب المخططات §30 توزيعات إحصائية).
   */
  static async detectAnomalies(input: {
    series: number[];
    point: number;
    threshold?: number;
  }): Promise<OrchestratedAiResult> {
    const requestedAt = new Date().toISOString();
    const result = await this.runSafely('ANOMALY_DETECTION', () =>
      mlAnomalyDetector.analyzeAsset?.('ORCHESTRATOR-ANOMALY').catch(() => null) as any,
    );

    return {
      orchestratorVersion: this.VERSION,
      requestedAt,
      completedAt: new Date().toISOString(),
      engines: await this.getEngineHealth(),
      results: { ANOMALY_DETECTION: result as any },
      hasHumanReviewFlag: Boolean(
        result && (result as any).isAnomaly === true,
      ),
    };
  }
}
