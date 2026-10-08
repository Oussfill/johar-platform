// ============================================================================
// GOLD ML ANOMALY DETECTION SERVICE
// ============================================================================
// خدمة كشف الاحتيال بالتعلم الآلي
//
// المبادئ:
// 1. تحليل سلوك المعاملات (Transaction Behavior)
// 2. كشف الأماكن الجغرافية غير المنطقية
// 3. انحراف الأوزان التراكمي
// 4. نموذج Isolation Forest لكشف الشذوذ
// 5. Human review queue للمخاطر العالية
// 6. AI Disclaimer على كل نتيجة

import { prisma } from '../config/database';
import { logger } from '../config/logger';

// ════════════════════════════════════════════════════════════════
// أنواع الشذوذ
// ════════════════════════════════════════════════════════════════

export enum AnomalyType {
  WEIGHT_DEVIATION = 'WEIGHT_DEVIATION',
  PURITY_DEVIATION = 'PURITY_DEVIATION',
  SERIAL_DUPLICATE = 'SERIAL_DUPLICATE',
  GEO_ANOMALY = 'GEO_ANOMALY',
  VELOCITY_ANOMALY = 'VELOCITY_ANOMALY',
  PATTERN_ANOMALY = 'PATTERN_ANOMALY',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AnomalyResult {
  anomalyType: AnomalyType;
  riskLevel: RiskLevel;
  confidence: number;
  score: number;           // 0-100
  details: Record<string, any>;
  description: Record<string, string>;
  requiresHumanReview: boolean;
  timestamp: Date;
}

export interface MLAnalysisResult {
  overallRisk: RiskLevel;
  overallScore: number;
  anomalies: AnomalyResult[];
  recommendation: Record<string, string>;
  disclaimer: string;
}

// ════════════════════════════════════════════════════════════════
// الإعدادات
// ════════════════════════════════════════════════════════════════

const ML_CONFIG = {
  /** عتبة الوزن: انحراف > 5% */
  WEIGHT_DEVIATION_THRESHOLD: 0.05,
  /** عتبة النقاوة: انحراف > 3% */
  PURITY_DEVIATION_THRESHOLD: 0.03,
  /** عتبة الحد الأقصى للمسافة: > 5000 كم في ساعة واحدة */
  MAX_GEO_DISTANCE_KM: 5000,
  /** عتبة السرعة: > 10 معاملات في ساعة */
  MAX_VELOCITY_PER_HOUR: 10,
  /** عتبة المخاطر لمراجعة يدوية */
  HUMAN_REVIEW_THRESHOLD: 70,
};

/**
 * MLAnomalyDetectionService
 * ──────────────────────────
 * نموذج تعليم آلي لكشف الاحتيال
 *
 * في الإنتاج:
 * 1. Isolation Forest لكشف الشذوذ
 * 2. LSTM لتسلسل المعاملات
 * 3. DBSCAN لكشف المجموعات المشبوهة
 * 4. Feature engineering على المعاملات
 */
class MLAnomalyDetectionService {
  /**
   * فحص شامل لأصل
   */
  async analyzeAsset(goldId: string): Promise<MLAnalysisResult> {
    const anomalies: AnomalyResult[] = [];

    // 1. فحص انحراف الوزن
    const weightAnomaly = await this.checkWeightDeviation(goldId);
    if (weightAnomaly) anomalies.push(weightAnomaly);

    // 2. فحص انحراف النقاوة
    const purityAnomaly = await this.checkPurityDeviation(goldId);
    if (purityAnomaly) anomalies.push(purityAnomaly);

    // 3. فحص تكرار الرقم التسلسلي
    const serialAnomaly = await this.checkSerialDuplicate(goldId);
    if (serialAnomaly) anomalies.push(serialAnomaly);

    // 4. فحص الشذوذ الجغرافي
    const geoAnomaly = await this.checkGeoAnomaly(goldId);
    if (geoAnomaly) anomalies.push(geoAnomaly);

    // 5. فحص الشذوذ السلوكي
    const velocityAnomaly = await this.checkVelocityAnomaly(goldId);
    if (velocityAnomaly) anomalies.push(velocityAnomaly);

    // حساب المخاطر الإجمالية
    const overallScore = this.calculateOverallRiskScore(anomalies);
    const overallRisk = this.scoreToRiskLevel(overallScore);

    // اتخاذ قرار
    const recommendation = this.generateRecommendation(overallRisk, anomalies);

    // تسجيل في DB
    if (anomalies.length > 0) {
      await this.logFraudDetection(goldId, anomalies, overallRisk, overallScore);
    }

    return {
      overallRisk,
      overallScore,
      anomalies,
      recommendation,
      disclaimer: this.getDisclaimer(),
    };
  }

  // ─── الفحوصات ───────────────────────────────────────────

  /** فحص انحراف الوزن */
  private async checkWeightDeviation(goldId: string): Promise<AnomalyResult | null> {
    // جلب آخر قياسين
    const asset = await prisma.goldAsset.findFirst({
      where: { goldId },
      orderBy: { createdAt: 'desc' },
    });

    if (!asset) return null;

    const expectedWeight = Number(asset.weightGross);
    const actualWeight = Number(asset.weightNet);
    const deviation = Math.abs(expectedWeight - actualWeight) / expectedWeight;

    if (deviation > ML_CONFIG.WEIGHT_DEVIATION_THRESHOLD) {
      return {
        anomalyType: AnomalyType.WEIGHT_DEVIATION,
        riskLevel: deviation > 0.1 ? RiskLevel.CRITICAL : RiskLevel.HIGH,
        confidence: 0.9,
        score: Math.min(100, deviation * 500),
        details: { expectedWeight, actualWeight, deviation: (deviation * 100).toFixed(2) + '%' },
        description: {
          AR: `انحراف الوزن: ${(deviation * 100).toFixed(2)}% — الوزن المتوقع ${expectedWeight}g، الفعلي ${actualWeight}g`,
          FR: `Déviation de poids: ${(deviation * 100).toFixed(2)}% — Attendu ${expectedWeight}g, Réel ${actualWeight}g`,
          EN: `Weight deviation: ${(deviation * 100).toFixed(2)}% — Expected ${expectedWeight}g, Actual ${actualWeight}g`,
        },
        requiresHumanReview: deviation > 0.05,
        timestamp: new Date(),
      };
    }

    return null;
  }

  /** فحص انحراف النقاوة */
  private async checkPurityDeviation(goldId: string): Promise<AnomalyResult | null> {
    const asset = await prisma.goldAsset.findFirst({
      where: { goldId },
      orderBy: { createdAt: 'desc' },
    });

    if (!asset?.karat || !asset.measuredPurity) return null;

    const expectedPurity = (asset.karat / 24) * 100;
    const actualPurity = Number(asset.measuredPurity);
    const deviation = Math.abs(expectedPurity - actualPurity) / expectedPurity;

    if (deviation > ML_CONFIG.PURITY_DEVIATION_THRESHOLD) {
      return {
        anomalyType: AnomalyType.PURITY_DEVIATION,
        riskLevel: deviation > 0.05 ? RiskLevel.CRITICAL : RiskLevel.HIGH,
        confidence: 0.85,
        score: Math.min(100, deviation * 300),
        details: { expectedPurity, actualPurity, karat: asset.karat, deviation: (deviation * 100).toFixed(2) + '%' },
        description: {
          AR: `انحراف النقاوة: ${(deviation * 100).toFixed(2)}% — النقاوة المتوقعة ${expectedPurity.toFixed(1)}%، الفعلية ${actualPurity}%`,
          FR: `Déviation de pureté: ${(deviation * 100).toFixed(2)}% — Attendue ${expectedPurity.toFixed(1)}%, Réelle ${actualPurity}%`,
          EN: `Purity deviation: ${(deviation * 100).toFixed(2)}% — Expected ${expectedPurity.toFixed(1)}%, Actual ${actualPurity}%`,
        },
        requiresHumanReview: true,
        timestamp: new Date(),
      };
    }

    return null;
  }

  /** فحص تكرار الرقم التسلسلي */
  private async checkSerialDuplicate(goldId: string): Promise<AnomalyResult | null> {
    const asset = await prisma.goldAsset.findFirst({
      where: { goldId },
      orderBy: { createdAt: 'desc' },
    });

    if (!asset) return null;

    const duplicates = await prisma.goldAsset.count({
      where: {
        serialNumber: asset.serialNumber,
        metalType: asset.metalType,
        id: { not: asset.id },
      },
    });

    if (duplicates > 0) {
      return {
        anomalyType: AnomalyType.SERIAL_DUPLICATE,
        riskLevel: RiskLevel.CRITICAL,
        confidence: 0.95,
        score: 95,
        details: { serialNumber: asset.serialNumber, duplicateCount: duplicates },
        description: {
          AR: `رقم تسلسلي مكرر: ${asset.serialNumber} — موجود في ${duplicates} أصل آخر`,
          FR: `Numéro de série dupliqué: ${asset.serialNumber} — trouvé dans ${duplicates} autre(s) actif(s)`,
          EN: `Duplicate serial: ${asset.serialNumber} — found in ${duplicates} other asset(s)`,
        },
        requiresHumanReview: true,
        timestamp: new Date(),
      };
    }

    return null;
  }

  /** فحص الشذوذ الجغرافي */
  private async checkGeoAnomaly(goldId: string): Promise<AnomalyResult | null> {
    // في الإنتاج: مقارنة مواقع آخر حركتين
    // إذا المسافة > 5000 كم في < 1 ساعة → شاذ
    return null;
  }

  /** فحص الشذوذ السلوكي (السرعة) */
  private async checkVelocityAnomaly(goldId: string): Promise<AnomalyResult | null> {
    // في الإنتاج: عدد المعاملات في آخر ساعة
    // إذا > 10 → شاذ
    return null;
  }

  // ─── أدوات مساعدة ────────────────────────────────────────

  /** حساب درجة المخاطر الإجمالية */
  private calculateOverallRiskScore(anomalies: AnomalyResult[]): number {
    if (anomalies.length === 0) return 0;
    const maxScore = Math.max(...anomalies.map((a) => a.score));
    return Math.round(maxScore);
  }

  /** تحويل درجة المخاطر إلى مستوى */
  private scoreToRiskLevel(score: number): RiskLevel {
    if (score >= 80) return RiskLevel.CRITICAL;
    if (score >= 60) return RiskLevel.HIGH;
    if (score >= 30) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  /** توليد التوصية */
  private generateRecommendation(risk: RiskLevel, anomalies: AnomalyResult[]): Record<string, string> {
    const needsReview = anomalies.some((a) => a.requiresHumanReview);
    const rec: Record<string, string> = {};

    if (risk === RiskLevel.CRITICAL) {
      rec.AR = 'خطر حرج — توقف فوري + مراجعة يدوية مطلوبة';
      rec.FR = 'Risque critique — arrêt immédiat + révision manuelle requise';
      rec.EN = 'Critical risk — immediate stop + manual review required';
    } else if (risk === RiskLevel.HIGH || needsReview) {
      rec.AR = 'خطر مرتفع — مراجعة يدوية مطلوبة قبل المتابعة';
      rec.FR = 'Risque élevé — révision manuelle requise';
      rec.EN = 'High risk — manual review required before proceeding';
    } else {
      rec.AR = 'المخاطر مقبولة — يمكن المتابعة';
      rec.FR = 'Risque acceptable — continuer';
      rec.EN = 'Acceptable risk — proceed';
    }

    return rec;
  }

  /** تسجيل في DB */
  private async logFraudDetection(
    goldId: string,
    anomalies: AnomalyResult[],
    overallRisk: RiskLevel,
    overallScore: number,
  ): Promise<void> {
    const asset = await prisma.goldAsset.findFirst({ where: { goldId } });
    if (!asset) return;

    await prisma.aiFraudLog.create({
      data: {
        assetId: asset.id,
        riskScore: overallRisk,
        riskScoreNumeric: overallScore / 100,
        anomalyType: anomalies[0]?.anomalyType as any,
        anomalyDetails: anomalies as any,
        serialDuplicate: anomalies.some((a) => a.anomalyType === AnomalyType.SERIAL_DUPLICATE),
        weightAnomaly: anomalies.some((a) => a.anomalyType === AnomalyType.WEIGHT_DEVIATION),
        weightDeviation: anomalies.find((a) => a.anomalyType === AnomalyType.WEIGHT_DEVIATION)?.details?.deviation,
        geoAnomaly: anomalies.some((a) => a.anomalyType === AnomalyType.GEO_ANOMALY),
        requiresHumanReview: anomalies.some((a) => a.requiresHumanReview),
      },
    });
  }

  /** AI Disclaimer */
  private getDisclaimer(): string {
    return 'AI-generated assessment is an analytical aid and does not replace legally required laboratory testing or professional appraisal.';
  }
}

export const mlAnomalyDetector = new MLAnomalyDetectionService();
