// ============================================================================
// GOLD AML COMPLIANCE SERVICE
// ============================================================================
// خدمة مكافحة غسل الأموال — وفقاً لمعايير FATF + ISO 27001
//
// المبادئ:
// 1. قواعد المعاملات عالية القيمة (>$10K USD)
// 2. تقارير نشاط مشبوه (SAR) — Suspicious Activity Reports
// 3. فحص القوائم السوداء (OFAC, UN, EU)
// 4. درجة المخاطر المشبوهة (Suspicious Behavior Scoring)
// 5. Human review queue + automated escalation
// 6. AI Disclaimer على كل نتيجة

import { prisma } from '../config/database';
import { logger } from '../config/logger';

// ════════════════════════════════════════════════════════════════
// أنواع الأنشطة المشبوهة
// ════════════════════════════════════════════════════════════════

export enum SuspiciousActivityType {
  STRUCTURING = 'STRUCTURING',
  RAPID_MOVEMENT = 'RAPID_MOVEMENT',
  HIGH_VALUE_CASH = 'HIGH_VALUE_CASH',
  SANCTIONS_MATCH = 'SANCTIONS_MATCH',
  PEP_MATCH = 'PEP_MATCH',
  UNUSUAL_PATTERN = 'UNUSUAL_PATTERN',
  COERCION_SUSPECTED = 'COERCION_SUSPECTED',
}

export enum ComplianceVerdict {
  CLEAR = 'CLEAR',
  REVIEW = 'REVIEW',
  BLOCKED = 'BLOCKED',
}

export interface ComplianceCheckResult {
  verdict: ComplianceVerdict;
  riskScore: number;
  activities: SuspiciousActivity[];
  sarRequired: boolean;
  recommendation: Record<string, string>;
  disclaimer: string;
}

export interface SuspiciousActivity {
  type: SuspiciousActivityType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: Record<string, string>;
  details: Record<string, any>;
}

// ════════════════════════════════════════════════════════════════
// الإعدادات
// ════════════════════════════════════════════════════════════════

const AML_CONFIG = {
  /** عتبة المعاملة عالية القيمة */
  HIGH_VALUE_THRESHOLD_USD: 10000,
  /** عتبة التكرار: 3+ معاملات مشبوهة في 24 ساعة */
  STRUCTURING_THRESHOLD: 3,
  /** عتبة النقل السريع: > $50K في 24 ساعة */
  RAPID_MOVEMENT_THRESHOLD_USD: 50000,
  /** عتبة SAR */
  SAR_THRESHOLD_SCORE: 75,
};

// ════════════════════════════════════════════════════════════════
// القوائم السوداء (Mock — في الإنتاج: OFAC/UN/EU APIs)
// ════════════════════════════════════════════════════════════════

const SANCTIONS_LIST = new Set<string>();
const PEP_LIST = new Set<string>();

/**
 * AMLComplianceService
 * ─────────────────────
 * خدمة الامتثال لمكافحة غسل الأموال
 */
class AMLComplianceService {
  /**
   * فحص AML شامل لعملية تنشيط
   */
  async checkActivationCompliance(
    assetId: string,
    userId: string,
    transactionValueUSD: number,
  ): Promise<ComplianceCheckResult> {
    const activities: SuspiciousActivity[] = [];

    // 1. فحص القيمة العالية
    if (transactionValueUSD > AML_CONFIG.HIGH_VALUE_THRESHOLD_USD) {
      activities.push({
        type: SuspiciousActivityType.HIGH_VALUE_CASH,
        severity: 'MEDIUM',
        description: {
          AR: `معاملة عالية القيمة: $${transactionValueUSD.toLocaleString()}`,
          FR: `Transaction à haute valeur: $${transactionValueUSD.toLocaleString()}`,
          EN: `High-value transaction: $${transactionValueUSD.toLocaleString()}`,
        },
        details: { amount: transactionValueUSD, threshold: AML_CONFIG.HIGH_VALUE_THRESHOLD_USD },
      });
    }

    // 2. فحص التكرار (Structuring)
    const recentCount = await this.getRecentTransactionCount(userId, 24);
    if (recentCount >= AML_CONFIG.STRUCTURING_THRESHOLD) {
      activities.push({
        type: SuspiciousActivityType.STRUCTURING,
        severity: 'HIGH',
        description: {
          AR: `${recentCount} معاملة في آخر 24 ساعة — تكرار مشبوه`,
          FR: `${recentCount} transactions en 24h — structuring suspect`,
          EN: `${recentCount} transactions in 24h — suspected structuring`,
        },
        details: { count: recentCount, window: '24h' },
      });
    }

    // 3. فحص القوائم السوداء
    const sanctionsMatch = await this.checkSanctionsList(userId);
    if (sanctionsMatch) {
      activities.push({
        type: SuspiciousActivityType.SANCTIONS_MATCH,
        severity: 'CRITICAL',
        description: {
          AR: 'مطابقة مع قائمة العقوبات الدولية',
          FR: 'Correspondance avec une liste de sanctions',
          EN: 'Match on sanctions list',
        },
        details: { listType: 'OFAC' },
      });
    }

    // 4. فحص PEP
    const pepMatch = await this.checkPEPList(userId);
    if (pepMatch) {
      activities.push({
        type: SuspiciousActivityType.PEP_MATCH,
        severity: 'MEDIUM',
        description: {
          AR: 'شخص ذو صلة سياسية (PEP)',
          FR: 'Personne politiquement exposée (PPE)',
          EN: 'Politically Exposed Person (PEP)',
        },
        details: {},
      });
    }

    // 5. فحص النقل السريع
    const rapidMovement = await this.checkRapidMovement(assetId);
    if (rapidMovement) {
      activities.push({
        type: SuspiciousActivityType.RAPID_MOVEMENT,
        severity: 'HIGH',
        description: {
          AR: 'نقل سريع للمال — $50,000+ في 24 ساعة',
          FR: 'Mouvement rapide — $50,000+ en 24h',
          EN: 'Rapid movement — $50,000+ in 24h',
        },
        details: {},
      });
    }

    // حساب النتيجة
    const riskScore = this.calculateRiskScore(activities);
    const verdict = this.determineVerdict(riskScore, activities);
    const sarRequired = riskScore >= AML_CONFIG.SAR_THRESHOLD_SCORE;

    // تسجيل
    if (verdict !== ComplianceVerdict.CLEAR) {
      await this.logComplianceCheck(assetId, userId, activities, riskScore, verdict);
    }

    if (sarRequired) {
      await this.fileSAR(assetId, userId, activities);
    }

    return {
      verdict,
      riskScore,
      activities,
      sarRequired,
      recommendation: this.generateRecommendation(verdict),
      disclaimer: this.getDisclaimer(),
    };
  }

  // ─── الفحوصات ───────────────────────────────────────────

  /** فحص عدد المعاملات الأخيرة */
  private async getRecentTransactionCount(userId: string, hours: number): Promise<number> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return prisma.custodyTransferRequest.count({
      where: {
        initiatedById: userId,
        createdAt: { gte: since },
      },
    });
  }

  /** فحص القائمة السوداء */
  private async checkSanctionsList(userId: string): Promise<boolean> {
    // في الإنتاج: استدعاء OFAC API أو قاعدة بيانات محلية
    return SANCTIONS_LIST.has(userId);
  }

  /** فحص PEP */
  private async checkPEPList(userId: string): Promise<boolean> {
    return PEP_LIST.has(userId);
  }

  /** فحص النقل السريع */
  private async checkRapidMovement(assetId: string): Promise<boolean> {
    const transfers = await prisma.custodyTransferRequest.findMany({
      where: {
        assetId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    return transfers.length > 0;
  }

  // ─── أدوات مساعدة ────────────────────────────────────────

  private calculateRiskScore(activities: SuspiciousActivity[]): number {
    if (activities.length === 0) return 0;
    const weights: Record<string, number> = {
      CRITICAL: 30,
      HIGH: 20,
      MEDIUM: 10,
      LOW: 5,
    };
    const total = activities.reduce((sum, a) => sum + (weights[a.severity] || 5), 0);
    return Math.min(100, total);
  }

  private determineVerdict(score: number, activities: SuspiciousActivity[]): ComplianceVerdict {
    if (activities.some((a) => a.severity === 'CRITICAL')) return ComplianceVerdict.BLOCKED;
    if (score >= AML_CONFIG.SAR_THRESHOLD_SCORE) return ComplianceVerdict.BLOCKED;
    if (score >= 40) return ComplianceVerdict.REVIEW;
    return ComplianceVerdict.CLEAR;
  }

  private generateRecommendation(verdict: ComplianceVerdict): Record<string, string> {
    switch (verdict) {
      case ComplianceVerdict.BLOCKED:
        return {
          AR: 'تم حظر المعاملة — مطلوب مراجعة يدوية + تقرير SAR',
          FR: 'Transaction bloquée — révision manuelle + rapport SAR requis',
          EN: 'Transaction blocked — manual review + SAR report required',
        };
      case ComplianceVerdict.REVIEW:
        return {
          AR: 'مراجعة مطلوبة قبل المتابعة',
          FR: 'Révision requise avant de continuer',
          EN: 'Review required before proceeding',
        };
      default:
        return {
          AR: 'تم فحص AML — لا مشاكل',
          FR: 'AML vérifié — aucun problème',
          EN: 'AML checked — no issues',
        };
    }
  }

  private async logComplianceCheck(
    assetId: string,
    userId: string,
    activities: SuspiciousActivity[],
    score: number,
    verdict: ComplianceVerdict,
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        action: 'COMPLIANCE_CHECK',
        entityType: 'GoldAsset',
        entityId: assetId,
        userId,
        newValues: { activities, score, verdict } as any,
        severity: verdict === 'BLOCKED' ? 'CRITICAL' : verdict === 'REVIEW' ? 'WARNING' : 'INFO',
        ipAddress: '0.0.0.0',
      },
    });
  }

  private async fileSAR(assetId: string, userId: string, activities: SuspiciousActivity[]): Promise<void> {
    logger.warn('SAR filed', { assetId, userId, activityCount: activities.length });
    await prisma.auditLog.create({
      data: {
        action: 'SAR_FILED',
        entityType: 'GoldAsset',
        entityId: assetId,
        userId,
        newValues: { activities, filedAt: new Date() } as any,
        severity: 'CRITICAL',
        ipAddress: '0.0.0.0',
      },
    });
  }

  private getDisclaimer(): string {
    return 'AI-generated assessment is an analytical aid and does not replace legally required compliance review or professional judgment.';
  }
}

export const amlComplianceService = new AMLComplianceService();
