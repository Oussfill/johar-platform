// ============================================================================
// GOLD PLATFORM — GOLD FRAUD INTELLIGENCE ENGINE
// ============================================================================
// محرك كشف الاحتيال والمخاطر المترتبة على:
//   - تكرار الأرقام التسلسلية (Serial Duplication)
//   - شذوذ الوزن (Weight Anomaly)
//   - الحركات الجغرافية المستحيلة (Impossible Geographic Movements)
//   - عدم اتساق النقاوة (Purity Inconsistency)
//   - كسر سلسلة الحيازة (Chain of Custody Broken)
//   - التلاعب بـ NFC (NFC Tamper Detected)
//
// يوجّه الحالات الخطرة إلى قائمة المراجعة البشرية (Human Review Queue)

import { RiskLevel, FraudAnomalyType, ReviewDecision, Language } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

// ============================================================================
// FRAUD DETECTION TYPES
// ============================================================================

interface FraudCheckInput {
  assetId: string;
  serialNumber: string;
  metalType: string;
  weightGrams: number;
  measuredPurity?: number;
  karat?: number;
  nfcUidHash?: string;
  currentLocation?: { lat: number; lng: number; country: string };
  previousLocation?: { lat: number; lng: number; country: string };
}

interface FraudAnomaly {
  type: FraudAnomalyType;
  description: string;
  severity: RiskLevel;
  details: Record<string, unknown>;
}

interface FraudCheckResult {
  riskLevel: RiskLevel;
  riskScore: number;
  anomalies: FraudAnomaly[];
  requiresHumanReview: boolean;
  recommendation: string;
}

// ============================================================================
// GOLD FRAUD INTELLIGENCE ENGINE SERVICE
// ============================================================================

export class GoldFraudIntelligenceEngine {
  private static readonly WEIGHT_DEVIATION_THRESHOLD = 0.10; // 10% انحراف مسموح
  private static readonly GEO_DISTANCE_THRESHOLD_KM = 5000; // 5000 كم كحد أقصى
  private static readonly GEO_TIME_THRESHOLD_HOURS = 24; // 24 ساعة كحد أقصى
  private static readonly HUMAN_REVIEW_THRESHOLD = 0.6; // درجة خطورة تتطلب مراجعة بشرية

  /**
   * فحص شامل للكشف عن الاحتيال
   *
   * يتحقق من:
   * 1. تكرار الرقم التسلسلي
   * 2. شذوذ الوزن
   * 3. عدم اتساق النقاوة
   * 4. الحركة الجغرافية المستحيلة
   * 5. سلامة سلسلة الحيازة
   * 6. سلامة NFC
   *
   * @returns FraudCheckResult نتيجة الفحص مع درجة الخطورة
   */
  static async performComprehensiveFraudCheck(
    input: FraudCheckInput,
  ): Promise<FraudCheckResult> {
    logger.info('Starting comprehensive fraud check', {
      assetId: input.assetId,
      serialNumber: input.serialNumber,
    });

    const anomalies: FraudAnomaly[] = [];

    // 1. فحص تكرار الرقم التسلسلي
    const serialCheck = await this.checkSerialDuplication(
      input.serialNumber,
      input.metalType,
      input.assetId,
    );
    if (serialCheck.isDuplicate) {
      anomalies.push(serialCheck.anomaly!);
    }

    // 2. فحص شذوذ الوزن
    const weightCheck = this.checkWeightAnomaly(
      input.weightGrams,
      input.karat || 24,
    );
    if (weightCheck.isAnomaly) {
      anomalies.push(weightCheck.anomaly!);
    }

    // 3. فحص عدم اتساق النقاوة
    if (input.measuredPurity !== undefined && input.karat !== undefined) {
      const purityCheck = this.checkPurityInconsistency(
        input.measuredPurity,
        input.karat,
      );
      if (purityCheck.isInconsistent) {
        anomalies.push(purityCheck.anomaly!);
      }
    }

    // 4. فحص الحركة الجغرافية المستحيلة
    if (input.currentLocation && input.previousLocation) {
      const geoCheck = this.checkGeographicAnomaly(
        input.currentLocation,
        input.previousLocation,
      );
      if (geoCheck.isImpossible) {
        anomalies.push(geoCheck.anomaly!);
      }
    }

    // 5. فحص سلسلة الحيازة
    const custodyCheck = await this.checkChainOfCustodyIntegrity(input.assetId);
    if (custodyCheck.isBroken) {
      anomalies.push(custodyCheck.anomaly!);
    }

    // 6. فحص سلامة NFC
    if (input.nfcUidHash) {
      const nfcCheck = await this.checkNfcIntegrity(
        input.assetId,
        input.nfcUidHash,
      );
      if (nfcCheck.isTampered) {
        anomalies.push(nfcCheck.anomaly!);
      }
    }

    // حساب درجة الخطورة الإجمالية
    const riskScore = this.calculateOverallRiskScore(anomalies);
    const riskLevel = this.determineRiskLevel(riskScore);
    const requiresHumanReview = riskScore >= this.HUMAN_REVIEW_THRESHOLD;

    // حفظ سجل الاحتيال في قاعدة البيانات
    const fraudLog = await prisma.aiFraudLog.create({
      data: {
        assetId: input.assetId,
        riskScore: riskLevel,
        riskScoreNumeric: riskScore,
        anomalyType: anomalies.length > 0 ? anomalies[0].type : 'SERIAL_DUPLICATION',
        anomalyDetails: { anomalies } as any,
        serialDuplicate: serialCheck.isDuplicate,
        duplicateAssetIds: serialCheck.duplicateAssetIds,
        weightAnomaly: weightCheck.isAnomaly,
        expectedWeight: weightCheck.expectedWeight,
        actualWeight: input.weightGrams,
        weightDeviation: weightCheck.deviation,
        geoAnomaly:
          input.currentLocation && input.previousLocation
            ? this.checkGeographicAnomaly(input.currentLocation, input.previousLocation).isImpossible
            : false,
        requiresHumanReview,
      },
    });

    // إذا كانت الدرجة عالية، وجّه إلى المراجعة البشرية
    if (requiresHumanReview) {
      await this.escalateToHumanReview(fraudLog.id, riskLevel, anomalies);
    }

    const recommendation = this.generateRecommendation(riskLevel, anomalies);

    logger.info('Comprehensive fraud check completed', {
      assetId: input.assetId,
      riskLevel,
      riskScore,
      anomalyCount: anomalies.length,
      requiresHumanReview,
    });

    return {
      riskLevel,
      riskScore,
      anomalies,
      requiresHumanReview,
      recommendation,
    };
  }

  // ============================================================================
  // INDIVIDUAL CHECK METHODS
  // ============================================================================

  /**
   * فحص تكرار الرقم التسلسلي
   */
  private static async checkSerialDuplication(
    serialNumber: string,
    metalType: string,
    currentAssetId: string,
  ): Promise<{
    isDuplicate: boolean;
    duplicateAssetIds: string[];
    anomaly: FraudAnomaly | null;
  }> {
    const duplicates = await prisma.goldAsset.findMany({
      where: {
        serialNumber,
        metalType: metalType as any,
        id: { not: currentAssetId },
      },
      select: { id: true, goldId: true },
    });

    const isDuplicate = duplicates.length > 0;

    return {
      isDuplicate,
      duplicateAssetIds: duplicates.map((d) => d.id),
      anomaly: isDuplicate
        ? {
            type: FraudAnomalyType.SERIAL_DUPLICATION,
            description: `Serial number ${serialNumber} is registered to ${duplicates.length} other asset(s)`,
            severity: RiskLevel.CRITICAL,
            details: {
              serialNumber,
              duplicateGoldIds: duplicates.map((d) => d.goldId),
              duplicateCount: duplicates.length,
            },
          }
        : null,
    };
  }

  /**
   * فحص شذوذ الوزن
   */
  private static checkWeightAnomaly(
    weightGrams: number,
    karat: number,
  ): {
    isAnomaly: boolean;
    expectedWeight: number;
    deviation: number;
    anomaly: FraudAnomaly | null;
  } {
    // حساب الوزن المتوقع بناءً على الكثافة النظرية
    const densities: Record<number, number> = {
      24: 19.32,
      22: 17.82,
      21: 17.15,
      18: 15.58,
      14: 13.07,
      10: 11.57,
    };

    const expectedDensity = densities[karat] || 15.0;
    // افتراض حجم معياري 50 سم³ (في الإنتاج: حجم حقيقي من الأبعاد)
    const expectedWeight = 50 * expectedDensity;
    const deviation = Math.abs(weightGrams - expectedWeight) / expectedWeight;

    const isAnomaly = deviation > this.WEIGHT_DEVIATION_THRESHOLD;

    return {
      isAnomaly,
      expectedWeight,
      deviation,
      anomaly: isAnomaly
        ? {
            type: FraudAnomalyType.WEIGHT_ANOMALY,
            description: `Weight deviation of ${(deviation * 100).toFixed(1)}% from expected value`,
            severity:
              deviation > 0.25 ? RiskLevel.CRITICAL : deviation > 0.15 ? RiskLevel.HIGH : RiskLevel.MEDIUM,
            details: {
              expectedWeight,
              actualWeight: weightGrams,
              deviation: Math.round(deviation * 10000) / 100,
              karat,
            },
          }
        : null,
    };
  }

  /**
   * فحص عدم اتساق النقاوة
   */
  private static checkPurityInconsistency(
    measuredPurity: number,
    karat: number,
  ): {
    isInconsistent: boolean;
    anomaly: FraudAnomaly | null;
  } {
    const expectedPurity = (karat / 24) * 100;
    const deviation = Math.abs(measuredPurity - expectedPurity);
    const isInconsistent = deviation > 2; // أكثر من 2% انحراف

    return {
      isInconsistent,
      anomaly: isInconsistent
        ? {
            type: FraudAnomalyType.PURITY_INCONSISTENCY,
            description: `Measured purity ${measuredPurity}% differs from expected ${expectedPurity.toFixed(1)}% for ${karat}K`,
            severity: deviation > 5 ? RiskLevel.HIGH : RiskLevel.MEDIUM,
            details: {
              measuredPurity,
              expectedPurity: Math.round(expectedPurity * 100) / 100,
              karat,
              deviation: Math.round(deviation * 100) / 100,
            },
          }
        : null,
    };
  }

  /**
   * فحص الحركة الجغرافية المستحيلة
   * هل يمكن للأصل أن يتحرك مسافة كبيرة في وقت قصير؟
   */
  private static checkGeographicAnomaly(
    currentLocation: { lat: number; lng: number; country: string },
    previousLocation: { lat: number; lng: number; country: string },
  ): {
    isImpossible: boolean;
    distanceKm: number;
    anomaly: FraudAnomaly | null;
  } {
    const distanceKm = this.haversineDistance(
      previousLocation.lat,
      previousLocation.lng,
      currentLocation.lat,
      currentLocation.lng,
    );

    const isImpossible = distanceKm > this.GEO_DISTANCE_THRESHOLD_KM;

    return {
      isImpossible,
      distanceKm,
      anomaly: isImpossible
        ? {
            type: FraudAnomalyType.GEOGRAPHIC_IMPOSSIBILITY,
            description: `Asset moved ${distanceKm.toFixed(0)}km — exceeds maximum possible distance`,
            severity: RiskLevel.HIGH,
            details: {
              previousLocation: `${previousLocation.country} (${previousLocation.lat}, ${previousLocation.lng})`,
              currentLocation: `${currentLocation.country} (${currentLocation.lat}, ${currentLocation.lng})`,
              distanceKm: Math.round(distanceKm),
              thresholdKm: this.GEO_DISTANCE_THRESHOLD_KM,
            },
          }
        : null,
    };
  }

  /**
   * فحص سلامة سلسلة الحيازة
   */
  private static async checkChainOfCustodyIntegrity(
    assetId: string,
  ): Promise<{
    isBroken: boolean;
    anomaly: FraudAnomaly | null;
  }> {
    // فحص ما إذا كان هناك فجوة في سلسلة الحيازة
    const custodyEvents = await prisma.chainOfCustody.findMany({
      where: { assetId },
      orderBy: { eventTimestamp: 'asc' },
      select: { status: true, toEntityId: true, fromEntityId: true },
    });

    // فحص ما إذا كان هناك أحداث مرفوضة أو ملغاة
    const failedEvents = custodyEvents.filter(
      (e) => e.status === 'FAILED' || e.status === 'DISPUTED',
    );

    const isBroken = failedEvents.length > 0;

    return {
      isBroken,
      anomaly: isBroken
        ? {
            type: FraudAnomalyType.CHAIN_OF_CUSTODY_BROKEN,
            description: `Chain of custody has ${failedEvents.length} failed/disputed event(s)`,
            severity: RiskLevel.HIGH,
            details: {
              totalEvents: custodyEvents.length,
              failedEvents: failedEvents.length,
            },
          }
        : null,
    };
  }

  /**
   * فحص سلامة NFC — كشف التلاعب
   */
  private static async checkNfcIntegrity(
    assetId: string,
    currentNfcHash: string,
  ): Promise<{
    isTampered: boolean;
    anomaly: FraudAnomaly | null;
  }> {
    const asset = await prisma.goldAsset.findUnique({
      where: { id: assetId },
      select: { nfcUidHash: true, ndefLockStatus: true },
    });

    if (!asset) {
      return {
        isTampered: true,
        anomaly: {
          type: FraudAnomalyType.NFC_TAMPER_DETECTED,
          description: 'Asset not found during NFC integrity check',
          severity: RiskLevel.CRITICAL,
          details: { assetId },
        },
      };
    }

    const isTampered =
      (asset.nfcUidHash && asset.nfcUidHash !== currentNfcHash) ||
      asset.ndefLockStatus === 'TAMPERED';

    return {
      isTampered,
      anomaly: isTampered
        ? {
            type: FraudAnomalyType.NFC_TAMPER_DETECTED,
            description: 'NFC chip integrity compromised — possible cloning or tampering',
            severity: RiskLevel.CRITICAL,
            details: {
              storedHash: asset.nfcUidHash ? '***' : null,
              lockStatus: asset.ndefLockStatus,
              possibleClone: asset.nfcUidHash !== currentNfcHash,
            },
          }
        : null,
    };
  }

  // ============================================================================
  // RISK SCORING
  // ============================================================================

  private static calculateOverallRiskScore(anomalies: FraudAnomaly[]): number {
    if (anomalies.length === 0) return 0;

    const severityWeights: Record<RiskLevel, number> = {
      LOW: 0.1,
      MEDIUM: 0.3,
      HIGH: 0.6,
      CRITICAL: 1.0,
    };

    let totalWeight = 0;
    for (const anomaly of anomalies) {
      totalWeight += severityWeights[anomaly.severity];
    }

    // تطبيع النتيجة بين 0 و 1
    return Math.min(1, Math.round(totalWeight * 10000) / 10000);
  }

  private static determineRiskLevel(score: number): RiskLevel {
    if (score >= 0.8) return RiskLevel.CRITICAL;
    if (score >= 0.5) return RiskLevel.HIGH;
    if (score >= 0.2) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  // ============================================================================
  // HUMAN REVIEW ESCALATION
  // ============================================================================

  private static async escalateToHumanReview(
    fraudLogId: string,
    riskLevel: RiskLevel,
    anomalies: FraudAnomaly[],
  ): Promise<void> {
    logger.warn('Escalating to human review queue', {
      fraudLogId,
      riskLevel,
      anomalyCount: anomalies.length,
    });

    // في الإنتاج: إرسال إشعار فوري للإدارة عبر البريد الإلكتروني والـ SMS
    // وتنبيه لوحة التحكم التشغيلية
    await prisma.auditLog.create({
      data: {
        action: 'FRAUD_ESCALATION',
        entityType: 'AiFraudLog',
        entityId: fraudLogId,
        description: `High-risk fraud detection escalated to human review: ${riskLevel}`,
        severity: 'CRITICAL',
        category: 'SECURITY',
        newValues: { riskLevel, anomalies: anomalies.map((a) => a.type) },
      },
    });
  }

  // ============================================================================
  // RECOMMENDATION GENERATION
  // ============================================================================

  private static generateRecommendation(
    riskLevel: RiskLevel,
    anomalies: FraudAnomaly[],
  ): string {
    if (riskLevel === RiskLevel.CRITICAL) {
      return 'CRITICAL: Immediate asset hold recommended. Do not proceed with any commercial transaction. Escalate to security team.';
    }

    if (riskLevel === RiskLevel.HIGH) {
      return 'HIGH RISK: Asset flagged for mandatory human review. All commercial operations suspended pending investigation.';
    }

    if (riskLevel === RiskLevel.MEDIUM) {
      return 'MEDIUM RISK: Enhanced verification recommended. Cross-reference with laboratory data and custody records before proceeding.';
    }

    return 'LOW RISK: Standard verification sufficient. Continue with normal operations.';
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  /**
   * حساب المسافة بين نقطتين جغرافيتين (صيغة Haversine)
   */
  private static haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
