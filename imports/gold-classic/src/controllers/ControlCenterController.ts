// ============================================================================
// JOHAR — CONTROL CENTER (لوحة التحكم المؤسسية §21 في BRD)
// ============================================================================
// يوفر نقاط تجميع للوحة JOHAR CONTROL CENTER: KPIs + معاملات حية + مخاطر
// + أدلة بلوكشين + نظرة مالية/لوجستيك/دعم — كلها قراءة فقط على مستوى المنصة.
// الوصول: صلاحية report:view بسياق platform (كما erp/dashboard)

import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

const DAY_MS = 24 * 3600 * 1000;

/// GET /api/v1/control-center/summary — ملخص لوحة التحكم المؤسسية
export async function getControlCenterSummary(req: Request, res: Response) {
  try {
    const now = new Date();
    const since24h = new Date(now.getTime() - DAY_MS);

    const [
      totalAssets,
      verifiedActiveAssets,
      registeredUsers,
      verifiedUsers,
      totalOrgs,
      verifiedOrgs,
      pendingAiResults,
      openFraudLogs,
      evidenceTotal,
      evidenceVerified,
      audit24h,
      activeEscrows,
      logisticsEvents,
      contactStats,
      assetStatus,
      databaseStatus,
    ] = await Promise.all([
      prisma.goldAsset.count(),
      prisma.goldAsset.count({
        where: {
          status: { notIn: ['DECOMMISSIONED', 'RECYCLED'] as any },
          digitalIdentity: { is: { isActive: true } },
          digitalPassport: { is: { isRevoked: false } },
        },
      }),
      prisma.user.count(),
      prisma.user.count({ where: { verificationLevel: { gte: 2 } } }),
      prisma.organization.count(),
      prisma.organization.count({ where: { kybStatus: 'VERIFIED' } }),
      prisma.aiAnalysisResult.count({ where: { humanReviewStatus: 'PENDING' } }),
      prisma.aiFraudLog.count({ where: { isResolved: false } }),
      prisma.blockchainEvidence.count(),
      prisma.blockchainEvidence.count({ where: { isVerified: true } }),
      prisma.auditLog.groupBy({
        by: ['severity'],
        where: { createdAt: { gte: since24h } },
        _count: { _all: true },
      }),
      prisma.escrowLedger.findMany({
        where: { status: { in: ['PENDING', 'HOLD', 'HELD'] as any } },
        select: { holdAmount: true, holdCurrency: true, status: true },
        take: 200,
      }),
      prisma.logisticsEvent.count(),
      prisma.contactMessage.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.goldAsset.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      verifyDatabase(),
    ]);

    // تجميع الضمانات النشطة حسب العملة (للتقرير)
    const escrowByCurrency: Record<string, { count: number; sum: number }> = {};
    for (const e of activeEscrows) {
      const c = e.holdCurrency;
      if (!escrowByCurrency[c]) escrowByCurrency[c] = { count: 0, sum: 0 };
      escrowByCurrency[c].count += 1;
      escrowByCurrency[c].sum += Number(e.holdAmount) || 0;
    }
    const escrowTotal = Object.values(escrowByCurrency).reduce((acc, v) => acc + v.sum, 0);

    const severityCounts: Record<string, number> = {};
    for (const s of audit24h) severityCounts[s.severity] = s._count._all;

    const assetByStatus: Record<string, number> = {};
    for (const s of assetStatus) assetByStatus[s.status] = s._count._all;

    const contactByStatus: Record<string, number> = {};
    for (const s of contactStats) contactByStatus[s.status] = s._count._all;

    const openFraudCritical = await prisma.aiFraudLog.count({
      where: {
        isResolved: false,
        riskScore: { in: ['HIGH', 'CRITICAL'] as any },
      },
    });

    const recentAudit = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        action: true,
        entityType: true,
        severity: true,
        category: true,
        description: true,
        createdAt: true,
      },
    });

    const recentEvidence = await prisma.blockchainEvidence.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        assetId: true,
        eventType: true,
        currentHash: true,
        sourceSystem: true,
        isVerified: true,
        createdAt: true,
      },
    });

    const recentLogistics = await prisma.logisticsEvent.groupBy({
      by: ['eventType'],
      _count: { _all: true },
    });

    return res.json({
      success: true,
      data: {
        generatedAt: now.toISOString(),
        database: databaseStatus,
        kpis: {
          vaa: {
            verifiedActiveAssets,
            totalAssets,
            verificationRate: totalAssets ? Number(((verifiedActiveAssets / totalAssets) * 100).toFixed(2)) : 0,
          },
          users: { verified: verifiedUsers, registered: registeredUsers },
          organizations: { verified: verifiedOrgs, total: totalOrgs },
          escrow: {
            openCount: activeEscrows.length,
            totalHeld: Number(escrowTotal.toFixed(2)),
            byCurrency: escrowByCurrency,
          },
          hitlQueue: {
            pendingAiResults,
            openFraudLogs,
          },
        },
        liveTransactions: recentAudit,
        auditLast24h: severityCounts,
        assetStatus: assetByStatus,
        contactByStatus,
        risk: {
          openFraudAlerts: openFraudLogs,
          openFraudCritical,
        },
        blockchain: {
          totalEvidence: evidenceTotal,
          verifiedEvidence: evidenceVerified,
          recent: recentEvidence,
        },
        logistics: {
          totalEvents: logisticsEvents,
          byType: recentLogistics
            .map((l) => ({ eventType: l.eventType, count: l._count?._all ?? 0 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6),
        },
      },
    });
  } catch (error: any) {
    logger.error('ControlCenter summary failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// GET /api/v1/control-center/live-transactions — آخر سجل التدقيق المنتظم
export async function getLiveTransactions(req: Request, res: Response) {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 40,
      select: {
        id: true,
        userId: true,
        action: true,
        entityType: true,
        entityId: true,
        severity: true,
        category: true,
        description: true,
        createdAt: true,
      },
    });
    return res.json({ success: true, data: { transactions: logs, count: logs.length } });
  } catch (error: any) {
    logger.error('ControlCenter live transactions failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// GET /api/v1/control-center/risk-monitor — عدادات المخاطر الملوّنة
export async function getRiskMonitor(req: Request, res: Response) {
  try {
    const [orgDistribution, users, fraudByRiskRows] = await Promise.all([
      prisma.organization.groupBy({ by: ['kybStatus'], _count: { _all: true } }),
      prisma.user.groupBy({
        by: ['verificationLevel', 'isActive'],
        _count: { _all: true },
      }),
      prisma.aiFraudLog.groupBy({
        by: ['riskScore'],
        where: { isResolved: false },
        _count: { _all: true },
      }),
    ]);

    // المؤسسات: VERIFIED → أخضر، PENDING/NOT_STARTED → أصفر، REJECTED → أحمر
    const org: Record<'green' | 'yellow' | 'red', number> = { green: 0, yellow: 0, red: 0 };
    for (const o of orgDistribution) {
      if (o.kybStatus === 'VERIFIED') org.green += o._count._all;
      else if (o.kybStatus === 'REJECTED') org.red += o._count._all;
      else org.yellow += o._count._all;
    }

    // المستخدمون: levels ≥2 أخضر، level 1 أصفر، غير فعّال أحمر
    const usersMap: Record<string, { green: number; yellow: number; red: number }> = {
      users: { green: 0, yellow: 0, red: 0 },
    };
    for (const u of users) {
      if (!u.isActive) usersMap.users.red += u._count._all;
      else if (u.verificationLevel >= 2) usersMap.users.green += u._count._all;
      else usersMap.users.yellow += u._count._all;
    }

    const fraudByRisk: Record<string, number> = {};
    for (const f of fraudByRiskRows) fraudByRisk[String(f.riskScore)] = f._count?._all ?? 0;
    const fraudCritical = (fraudByRisk['HIGH'] || 0) + (fraudByRisk['CRITICAL'] || 0);
    const fraudMedium = (fraudByRisk['MEDIUM'] || 0) + (fraudByRisk['LOW'] || 0);

    return res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        organizations: org,
        users: usersMap.users,
        fraud: { critical: fraudCritical, medium: fraudMedium, byRisk: fraudByRisk },
        colors: {
          green: org.green + usersMap.users.green,
          yellow: org.yellow + usersMap.users.yellow + fraudMedium,
          red: org.red + usersMap.users.red + fraudCritical,
        },
      },
    });
  } catch (error: any) {
    logger.error('ControlCenter risk monitor failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// GET /api/v1/control-center/blockchain-events — آخر الأدلة المثبتة
export async function getBlockchainEvents(req: Request, res: Response) {
  try {
    const [total, verified, recent] = await Promise.all([
      prisma.blockchainEvidence.count(),
      prisma.blockchainEvidence.count({ where: { isVerified: true } }),
      prisma.blockchainEvidence.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true,
          assetId: true,
          eventType: true,
          currentHash: true,
          previousHash: true,
          sourceSystem: true,
          sourceAction: true,
          isVerified: true,
          verifiedAt: true,
          createdAt: true,
        },
      }),
    ]);
    return res.json({
      success: true,
      data: {
        totalEvidence: total,
        verifiedEvidence: verified,
        integrityOk: total === verified || verified > 0,
        recent,
      },
    });
  } catch (error: any) {
    logger.error('ControlCenter blockchain events failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// GET /api/v1/control-center/trade-overview — تجميع المبيعات والمشتريات (قراءة-فقط، بلا migration)
export async function getTradeOverview(req: Request, res: Response) {
  try {
    const [
      salesOrdersByStatus,
      salesOrdersByCurrency,
      salesInvoicesByStatus,
      salesInvoicesByCurrency,
      purchaseRequestsByStatus,
      rfqsByStatus,
      purchaseOrdersByStatus,
      purchaseOrdersByCurrency,
      goodsReceiptsByInspection,
      suppliersByStatus,
      suppliersByCategory,
      opportunitiesByStage,
    ] = await Promise.all([
      prisma.salesOrder.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.salesOrder.groupBy({ by: ['currency'], _sum: { totalAmount: true } }),
      prisma.salesInvoice.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.salesInvoice.groupBy({ by: ['currency'], _sum: { totalAmount: true } }),
      prisma.purchaseRequest.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.rfq.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.purchaseOrder.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.purchaseOrder.groupBy({ by: ['currency'], _sum: { totalAmount: true } }),
      prisma.goodsReceipt.groupBy({ by: ['inspectionStatus'], _count: { _all: true } }),
      prisma.supplier.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.supplier.groupBy({ by: ['category'], _count: { _all: true } }),
      prisma.crmOpportunity.groupBy({ by: ['stage'], _count: { _all: true } }),
    ]);

    const toRecord = <T extends { _count: { _all: number } }>(rows: T[], key: keyof T) => {
      const out: Record<string, number> = {};
      for (const r of rows) out[String(r[key])] = r._count._all;
      return out;
    };
    const sumOf = (rows: { currency: string; _sum: { totalAmount: any } | null }[]) => {
      const total: Record<string, number> = {};
      rows.forEach((r) => {
        total[r.currency] = (total[r.currency] || 0) + Number(r._sum?.totalAmount || 0);
      });
      return total;
    };

    return res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        sales: {
          ordersByStatus: toRecord(salesOrdersByStatus, 'status'),
          ordersValueByCurrency: sumOf(salesOrdersByCurrency as any),
          invoicesByStatus: toRecord(salesInvoicesByStatus, 'status'),
          invoicesValueByCurrency: sumOf(salesInvoicesByCurrency as any),
          pipeline: toRecord(opportunitiesByStage, 'stage'),
        },
        procurement: {
          purchaseRequestsByStatus: toRecord(purchaseRequestsByStatus, 'status'),
          rfqsByStatus: toRecord(rfqsByStatus, 'status'),
          purchaseOrdersByStatus: toRecord(purchaseOrdersByStatus, 'status'),
          purchaseOrdersValueByCurrency: sumOf(purchaseOrdersByCurrency as any),
          goodsReceiptsByInspection: toRecord(goodsReceiptsByInspection, 'inspectionStatus'),
          suppliersByStatus: toRecord(suppliersByStatus, 'status'),
          suppliersByCategory: toRecord(suppliersByCategory, 'category'),
        },
      },
    });
  } catch (error: any) {
    logger.error('ControlCenter trade overview failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

async function verifyDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'connected';
  } catch {
    return 'disconnected';
  }
}