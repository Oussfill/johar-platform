// ============================================================================
// GOLD PLATFORM — ERP CONTROLLER
// ============================================================================
// Controller للـ ERP — لوحة التحكم التشغيلية
// يتضمن: مطابقة المخزون، عرض التنبيهات، تتبع الخزائن

import { Request, Response } from 'express';
import { Language, Currency, AssetStatus, RiskLevel } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import {
  descriptiveStats,
} from '../services/StatisticsService';

// ============================================================================
// GET /api/v1/erp/inventory/reconciliation — مطابقة بيانات الـ ERP
// ============================================================================

export async function getInventoryReconciliation(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    // جلب جميع الأصول من ERP مع مقارنتها بالحالة الفعلية
    const inventory = await prisma.goldErpInventory.findMany({
      include: {
        asset: {
          select: {
            id: true,
            goldId: true,
            serialNumber: true,
            metalType: true,
            karat: true,
            weightGross: true,
            weightNet: true,
            measuredPurity: true,
            status: true,
            producedAt: true,
          },
        },
        warehouse: {
          select: {
            warehouseCode: true,
            name: true,
            nameAr: true,
            nameFr: true,
            securityLevel: true,
          },
        },
        vault: {
          select: {
            vaultCode: true,
            name: true,
            securityGrade: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // حساب إحصائيات المطابقة
    const totalAssets = inventory.length;
    const matchedAssets = inventory.filter(
      (i) => i.asset.status !== 'DECOMMISSIONED',
    ).length;
    const discrepancies = inventory.filter(
      (i) => i.lastMovementAt && i.lastMovementAt < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    ).length;

    // إجمالي القيمة
    const totalValue = inventory.reduce(
      (sum, i) => sum + (i.currentValue ? Number(i.currentValue) : 0),
      0,
    );

    // إحصائيات حسب الحالة
    const statusBreakdown = inventory.reduce(
      (acc, i) => {
        const status = i.custodyStatus;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // إحصائيات حسب نوع المعدن
    const metalBreakdown = inventory.reduce(
      (acc, i) => {
        const metal = i.asset.metalType;
        acc[metal] = (acc[metal] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const response: any = {
      success: true,
      data: {
        summary: {
          totalAssets,
          matchedAssets,
          discrepancies,
          matchRate: totalAssets > 0 ? ((matchedAssets / totalAssets) * 100).toFixed(2) : 0,
          totalValue: {
            amount: totalValue,
            currency,
            formatted: new Intl.NumberFormat(
              lang === 'AR' ? 'ar-DZ' : lang === 'FR' ? 'fr-FR' : 'en-US',
              { style: 'currency', currency },
            ).format(totalValue),
          },
        },
        breakdown: {
          byStatus: statusBreakdown,
          byMetal: metalBreakdown,
        },
        items: inventory.map((i) => ({
          itemId: i.itemId,
          assetId: i.asset.id,
          goldId: i.asset.goldId,
          serialNumber: i.asset.serialNumber,
          metalType: i.asset.metalType,
          karat: i.asset.karat,
          weight: i.asset.weightNet,
          purity: i.asset.measuredPurity,
          erpStatus: i.custodyStatus,
          assetStatus: i.asset.status,
          warehouse: {
            code: i.warehouse.warehouseCode,
            name:
              lang === 'AR'
                ? i.warehouse.nameAr
                : lang === 'FR'
                ? i.warehouse.nameFr
                : i.warehouse.name,
            securityLevel: i.warehouse.securityLevel,
          },
          vault: i.vault
            ? { code: i.vault.vaultCode, name: i.vault.name }
            : null,
          compartmentRef: i.compartmentRef,
          currentValue: i.currentValue,
          lastMovementType: i.lastMovementType,
          lastMovementAt: i.lastMovementAt,
          discrepancy:
            i.lastMovementAt &&
            i.lastMovementAt < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        })),
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
        reconciliationDate: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Inventory reconciliation failed', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'RECONCILIATION_FAILED',
        message: 'Failed to perform inventory reconciliation',
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// GET /api/v1/erp/dashboard — لوحة التحكم الرئيسية
// ============================================================================

export async function getERPDashboard(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    // إحصائيات الأصول
    const totalAssets = await prisma.goldAsset.count();
    const activeAssets = await prisma.goldAsset.count({
      where: { status: { not: 'DECOMMISSIONED' } },
    });

    // إحصائيات حسب الحالة
    const statusCounts = await prisma.goldAsset.groupBy({
      by: ['status'],
      _count: { id: true },
      where: { status: { not: 'DECOMMISSIONED' } },
    });

    // إحصائيات حسب نوع المعدن
    const metalCounts = await prisma.goldAsset.groupBy({
      by: ['metalType'],
      _count: { id: true },
    });

    // إحصائيات الخزائن
    const totalVaults = await prisma.custodyVault.count({
      where: { isActive: true },
    });

    const totalWarehouses = await prisma.warehouse.count({
      where: { isActive: true },
    });

    // إحصائيات التنبيهات الأمنية (آخر 7 أيام)
    const recentFraudAlerts = await prisma.aiFraudLog.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        riskScore: { in: ['HIGH', 'CRITICAL'] },
      },
    });

    // إحصائيات طلبات النقل المعلقة
    const pendingTransfers = await prisma.custodyTransferRequest.count({
      where: {
        status: { in: ['PENDING', 'FIRST_APPROVED'] },
      },
    });

    // إحصائيات الفحوصات المختبرية
    const completedAssays = await prisma.assayRecord.count({
      where: {
        overallResult: 'PASS',
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    // آخر الأحداث
    const recentEvents = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        action: true,
        description: true,
        severity: true,
        createdAt: true,
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    const dashboardLabels: Record<Language, Record<string, string>> = {
      AR: {
        total_assets: 'إجمالي الأصول',
        active_assets: 'الأصول النشطة',
        total_vaults: 'إجمالي الخزائن',
        total_warehouses: 'إجمالي المخازن',
        fraud_alerts: 'تنبيهات الاحتيال (7 أيام)',
        pending_transfers: 'طلبات نقل معلقة',
        completed_assays: 'فحوصات ناجحة (30 يوم)',
        recent_events: 'آخر الأحداث',
      },
      FR: {
        total_assets: "Total des actifs",
        active_assets: "Actifs actifs",
        total_vaults: "Total des coffres-forts",
        total_warehouses: "Total des entrepôts",
        fraud_alerts: "Alertes de fraude (7 jours)",
        pending_transfers: "Transferts en attente",
        completed_assays: "Analyses réussies (30 jours)",
        recent_events: "Derniers événements",
      },
      EN: {
        total_assets: 'Total Assets',
        active_assets: 'Active Assets',
        total_vaults: 'Total Vaults',
        total_warehouses: 'Total Warehouses',
        fraud_alerts: 'Fraud Alerts (7 days)',
        pending_transfers: 'Pending Transfers',
        completed_assays: 'Completed Assays (30 days)',
        recent_events: 'Recent Events',
      },
    };

    const labels = dashboardLabels[lang];

    const response: any = {
      success: true,
      data: {
        overview: {
          totalAssets,
          activeAssets,
          totalVaults,
          totalWarehouses,
          fraudAlerts7d: recentFraudAlerts,
          pendingTransfers,
          completedAssays30d: completedAssays,
          [labels.total_assets]: totalAssets,
          [labels.active_assets]: activeAssets,
          [labels.total_vaults]: totalVaults,
          [labels.total_warehouses]: totalWarehouses,
          [labels.fraud_alerts]: recentFraudAlerts,
          [labels.pending_transfers]: pendingTransfers,
          [labels.completed_assays]: completedAssays,
        },
        assetsByStatus: statusCounts.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
        assetsByMetal: metalCounts.map((m) => ({
          metal: m.metalType,
          count: m._count.id,
        })),
        recentEvents: recentEvents.map((e) => ({
          action: e.action,
          description: e.description,
          severity: e.severity,
          user: e.user ? `${e.user.firstName} ${e.user.lastName}` : 'System',
          timestamp: e.createdAt,
        })),
        systemOfRecord: {
          ar: 'نقطة التسجيل المركزي — ERP هو السجل التشغيلي الأساسي للنظام',
          fr: "Point d'enregistrement principal — L'ERP est le registre opérationnel principal",
          en: 'System of Record — ERP is the primary operational register',
        },
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('ERP dashboard failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'DASHBOARD_FAILED', message: 'Failed to load dashboard' },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// GET /api/v1/erp/fraud-alerts — تنبيهات الاحتيال
// ============================================================================

export async function getFraudAlerts(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const { status, riskLevel, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status === 'pending') {
      where.requiresHumanReview = true;
      where.isResolved = false;
    } else if (status === 'resolved') {
      where.isResolved = true;
    }

    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    const [alerts, total] = await Promise.all([
      prisma.aiFraudLog.findMany({
        where,
        include: {
          asset: {
            select: {
              goldId: true,
              serialNumber: true,
              metalType: true,
              weightGross: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.aiFraudLog.count({ where }),
    ]);

    const response: any = {
      success: true,
      data: {
        alerts: alerts.map((a) => ({
          logId: a.id,
          asset: a.asset,
          riskLevel: a.riskScore,
          anomalyType: a.anomalyType,
          anomalyDetails: a.anomalyDetails,
          serialDuplicate: a.serialDuplicate,
          weightAnomaly: a.weightAnomaly,
          weightDeviation: a.weightDeviation,
          geoAnomaly: a.geoAnomaly,
          requiresHumanReview: a.requiresHumanReview,
          isResolved: a.isResolved,
          reviewDecision: a.reviewDecision,
          createdAt: a.createdAt,
        })),
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Fraud alerts fetch failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'FRAUD_ALERTS_FAILED', message: 'Failed to retrieve fraud alerts' },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// GET /api/v1/erp/invariant-check — فحص ثبات الحفظ (مبدأ الحفظ L(t)=C(t)+S(t))
// ============================================================================
// مبدأ الحفظ: الوزن المسجّل في السجل (L) يساوي دائماً الوزن المحفوظ (C)
// مضافاً إليه الوزن الخارج من المنصة (S) — لا يمكن لأصل أن "يختفي" أو "يُخلق"
//
// الفحص يتحقق من:
//   1. انحفاظ الكتلة: L(t) = C(t) + S(t) ضمن حدّ التسامح
//   2. تغطية السجل (ERP): كل أصل "مقتنَى" يجب أن يكون له سجل مخزون
//   3. عدم وجود سجلات يتيمة: الأصول المبيعة/المصفّاة لا يجوز أن يبقى لها سجل مخزون

export async function getInvariantCheck(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const assets = await prisma.goldAsset.findMany({
      select: {
        id: true,
        goldId: true,
        serialNumber: true,
        metalType: true,
        karat: true,
        status: true,
        weightGross: true,
        weightNet: true,
      },
    });

    const inventory = await prisma.goldErpInventory.findMany({
      select: {
        assetId: true,
        custodyStatus: true,
        currentValue: true,
      },
    });

    const invCounters = new Set(inventory.map((i) => i.assetId));

    // حالات الحفظ (في عهدة المنصة فيزيائياً)
    const HELD: AssetStatus[] = [
      AssetStatus.RAW_MATERIAL,
      AssetStatus.IN_REFINING,
      AssetStatus.READY_FOR_ASSAY,
      AssetStatus.IN_ASSAY,
      AssetStatus.ASSAYED,
      AssetStatus.CERTIFIED,
      AssetStatus.INVENTORY,
      AssetStatus.LISTED,
      AssetStatus.IN_CUSTODY,
      AssetStatus.IN_TRANSIT,
      AssetStatus.IN_SECONDARY_MARKET,
    ];

    // حالات الخروج (أخرجت من المنصة)
    const OUTFLOW: AssetStatus[] = [
      AssetStatus.SOLD,
      AssetStatus.DELIVERED,
      AssetStatus.RECYCLED,
      AssetStatus.DECOMMISSIONED,
    ];

    const toGrams = (a: any) => Number(a.weightGross) || 0;

    const all = assets;
    const heldGlobal = all.filter((a) => HELD.includes(a.status));
    const outflowGlobal = all.filter((a) => OUTFLOW.includes(a.status));
    const ledgerPool = all.filter((a) => !OUTFLOW.includes(a.status) && a.status !== AssetStatus.RECYCLED);

    const sumWeight = (arr: typeof assets) => arr.reduce((s, a) => s + toGrams(a as any), 0);

    // L(t): السجل الكلي = كل الأصول غير المصفّاة (المعاد تدويرها حذفاً)
    const ledgerWeight = sumWeight(ledgerPool);
    const ledgerCount = ledgerPool.length;

    // C(t): الأصول المحفوظة في عهدة المنصة
    const custodyWeight = sumWeight(heldGlobal);
    const custodyCount = heldGlobal.length;

    // S(t): الأصول المباعة/المسلّمة (خرجت من المنصة)
    const outflowWeight = sumWeight(outflowGlobal);
    const outflowCount = outflowGlobal.length;

    const TOLERANCE = 0.5; // التسامح بالغرام لحسابات التقريب العشري
    const conservationDelta = Math.abs(custodyWeight + outflowWeight - ledgerWeight);
    const conservationHolds = conservationDelta <= TOLERANCE;

    // فحص تغطية ERP
    const heldWithoutInventory = heldGlobal.filter((a) => !invCounters.has(a.id));
    const outflowWithOrphanInventory = outflowGlobal.filter((a) => invCounters.has(a.id));

    const violations: Array<{
      code: string;
      goldId: string;
      serialNumber: string;
      status: string;
      weightGross: number;
      detail: string;
    }> = [];

    // أصول محفوظة بلا سجل مخزون → كسر في سلسلة الحيازة
    for (const a of heldWithoutInventory) {
      violations.push({
        code: 'HELD_WITHOUT_INVENTORY',
        goldId: a.goldId,
        serialNumber: a.serialNumber,
        status: a.status,
        weightGross: toGrams(a as any),
        detail: 'Asset held but missing ERP inventory record',
      });
    }

    // أصول خارجة ما زالت لها سجل مخزون → سجل يتيم
    for (const a of outflowWithOrphanInventory) {
      violations.push({
        code: 'ORPHANED_INVENTORY',
        goldId: a.goldId,
        serialNumber: a.serialNumber,
        status: a.status,
        weightGross: toGrams(a as any),
        detail: 'Sold/delivered asset still has an ERP inventory record',
      });
    }

    if (!conservationHolds) {
      violations.push({
        code: 'CONSERVATION_BREACH',
        goldId: 'LEDGER',
        serialNumber: '',
        status: '',
        weightGross: conservationDelta,
        detail: `|C+S - L| = ${conservationDelta.toFixed(4)}g exceeds tolerance ${TOLERANCE}g`,
      });
    }

    // توزيع حسب المعدن والقيراط والوزن الإحصائي
    const byMetal = heldGlobal.reduce(
      (acc, a) => {
        acc[a.metalType] = (acc[a.metalType] || 0) + toGrams(a as any);
        return acc;
      },
      {} as Record<string, number>,
    );

    const byKarat = heldGlobal.reduce(
      (acc, a) => {
        const key = a.karat ? `${a.karat}k` : 'MIXED';
        acc[key] = (acc[key] || 0) + toGrams(a as any);
        return acc;
      },
      {} as Record<string, number>,
    );

    const byStatus = all.reduce(
      (acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // إحصاءات الوزن لأسطول الأصل المحفوظ (إحصائيات وصفية)
    const weightStats = descriptiveStats(heldGlobal.map((a) => toGrams(a as any)));

    const assetWeights = assets
      .filter((a) => a.status !== 'DECOMMISSIONED')
      .map((a) => toGrams(a as any));

    // تحليل تركيبة الأوزان تجريبياً ضمن فحص الحفظ: انحراف متوسط الوزن عن الوسيط
    const weightSkewStats = descriptiveStats(assetWeights);

    const response: any = {
      success: true,
      data: {
        theorem: {
          formula: 'L(t) = C(t) + S(t)',
          L: { weight: ledgerWeight, count: ledgerCount },
          C: { weight: custodyWeight, count: custodyCount },
          S: { weight: outflowWeight, count: outflowCount },
          conservationDelta,
          toleranceGrams: TOLERANCE,
          invariantHolds: conservationHolds,
        },
        ledger: {
          totalRegisteredGrams: ledgerWeight,
          totalRegisteredAssets: ledgerCount,
          byStatus,
          byMetal,
          byKarat,
          weightDistribution: weightSkewStats
            ? {
                min: weightSkewStats.min,
                max: weightSkewStats.max,
                mean: weightSkewStats.mean,
                median: weightSkewStats.median,
                stdDev: weightSkewStats.stdDev,
              }
            : null,
        },
        custody: {
          weightGrams: custodyWeight,
          assetCount: custodyCount,
          withInventory: custodyCount - heldWithoutInventory.length,
          missingInventoryCount: heldWithoutInventory.length,
          missingInventory: heldWithoutInventory.map((a) => ({
            goldId: a.goldId,
            status: a.status,
            weightGross: toGrams(a as any),
          })),
        },
        outflow: {
          weightGrams: outflowWeight,
          assetCount: outflowCount,
          orphanedInventoryCount: outflowWithOrphanInventory.length,
          orphanedInventory: outflowWithOrphanInventory.map((a) => ({
            goldId: a.goldId,
            status: a.status,
            weightGross: toGrams(a as any),
          })),
        },
        heldWeights: weightStats
          ? {
              n: weightStats.n,
              min: weightStats.min,
              max: weightStats.max,
              mean: weightStats.mean,
              median: weightStats.median,
              stdDev: weightStats.stdDev,
              cv: weightStats.cv,
              skewness: weightStats.skewness,
            }
          : null,
        violations,
        result: violations.length === 0 ? 'PASS' : 'FAIL',
        checkedAt: new Date().toISOString(),
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Invariant check failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INVARIANT_CHECK_FAILED', message: 'Failed to run invariant check' },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}
