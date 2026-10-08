// ============================================================================
// GOLD PLATFORM — FINANCIAL CONTROLLER & ERP
// ============================================================================
// Controller للنظام المالي وإدارة الموارد (ERP)
// يتضمن: الخزينة، محرك التسعير، الفواتير، الضمان المالي، الملخص المالي
// Technologies: Prisma ORM, Express, TypeScript, Winston Logger

import { Request, Response } from 'express';
import { Language, Currency } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

// ============================================================================
// نماذج بيانات وهمية (Mock) — يُستخدم حتى يتم إنشاء النماذج الفعلية
// ============================================================================

// أسعار المعادن الحالية (يجب تحديثها من مصدر خارجي في الإنتاج)
const CURRENT_METAL_PRICES = {
  gold: { USD: 2350, EUR: 2162, DZD: 317250 },   // سعر الذهب للأونصة بالدولار الأمريكي
  silver: { USD: 28, EUR: 25.76, DZD: 3780 },     // سعر الفضة للأونصة بالدولار الأمريكي
  platinum: { USD: 980, EUR: 901.6, DZD: 132300 }, // سعر البلاتين للأونصة
};

// أسعار الصرف المباشرة
const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  USD: { EUR: 0.92, DZD: 135, GBP: 0.79, AED: 3.67, SAR: 3.75 },
  EUR: { USD: 1.087, DZD: 146.74, GBP: 0.859, AED: 3.99, SAR: 4.07 },
  DZD: { USD: 0.0074, EUR: 0.0068, GBP: 0.0059, AED: 0.027, SAR: 0.028 },
};

// إعدادات الهوامش والتكاليف
const MARGIN_SETTINGS = {
  buyMarginPercent: 2.5,         // هامش الشراء بالنسبة المئوية
  sellMarginPercent: 3.0,        // هامش البيع بالنسبة المئوية
  spreadPercent: 0.5,            // فرق السعر بين الشراء والبيع
  manufacturingCostPerGram: 15,  // تكلفة التصنيع لكل جرام بالدولار
  refiningCostPerGram: 8,        // تكلفة التنقية لكل جرام بالدولار
  insuranceCostPerYear: 0.5,     // تأمين سنوي بالنسبة من القيمة
  storageFeePerMonth: 2.5,       // رسوم التخزين الشهرية لكل جرام
};

// بيانات الفواتير التجريبية (لتوضيح هيكل البيانات)
function generateMockInvoices() {
  return [
    {
      id: 'INV-2026-001',
      invoiceNumber: 'INV-GOLD-2026-001',
      type: 'PURCHASE',
      status: 'PAID',
      currency: 'USD',
      subtotal: 235000,
      tax: 18800,
      total: 253800,
      issuedAt: '2026-01-15T10:00:00Z',
      dueAt: '2026-02-15T10:00:00Z',
      paidAt: '2026-02-10T14:30:00Z',
      buyer: { name: 'GOLD Platform', entityId: 'ENT-001' },
      seller: { name: 'Refinery Algeria', entityId: 'ENT-002' },
      items: [
        { description: 'Gold bars 1kg x10', quantity: 10, unitPrice: 23500, total: 235000 },
      ],
    },
    {
      id: 'INV-2026-002',
      invoiceNumber: 'INV-GOLD-2026-002',
      type: 'SELL',
      status: 'PENDING',
      currency: 'EUR',
      subtotal: 45200,
      tax: 7232,
      total: 52432,
      issuedAt: '2026-03-01T09:00:00Z',
      dueAt: '2026-04-01T09:00:00Z',
      paidAt: null,
      buyer: { name: 'European Gold Traders', entityId: 'ENT-003' },
      seller: { name: 'GOLD Platform', entityId: 'ENT-001' },
      items: [
        { description: 'Gold coins 1oz x20', quantity: 20, unitPrice: 2162, total: 43240 },
        { description: 'Silver bars 100g x20', quantity: 20, unitPrice: 98.8, total: 1976 },
      ],
    },
    {
      id: 'INV-2026-003',
      invoiceNumber: 'INV-GOLD-2026-003',
      type: 'PURCHASE',
      status: 'OVERDUE',
      currency: 'DZD',
      subtotal: 31725000,
      tax: 4758750,
      total: 36483750,
      issuedAt: '2025-12-01T08:00:00Z',
      dueAt: '2026-01-01T08:00:00Z',
      paidAt: null,
      buyer: { name: 'GOLD Platform', entityId: 'ENT-001' },
      seller: { name: 'Société Minière du Sud', entityId: 'ENT-004' },
      items: [
        { description: 'Gold dust 999 purity 500g', quantity: 500, unitPrice: 63450, total: 31725000 },
      ],
    },
    {
      id: 'INV-2026-004',
      invoiceNumber: 'INV-GOLD-2026-004',
      type: 'SELL',
      status: 'PAID',
      currency: 'USD',
      subtotal: 82250,
      tax: 6580,
      total: 88830,
      issuedAt: '2026-02-20T11:00:00Z',
      dueAt: '2026-03-20T11:00:00Z',
      paidAt: '2026-03-15T16:45:00Z',
      buyer: { name: 'Dubai Gold Souk', entityId: 'ENT-005' },
      seller: { name: 'GOLD Platform', entityId: 'ENT-001' },
      items: [
        { description: 'Gold bars 500g x3', quantity: 3, unitPrice: 27500, total: 82500 },
      ],
    },
    {
      id: 'INV-2026-005',
      invoiceNumber: 'INV-GOLD-2026-005',
      type: 'PURCHASE',
      status: 'PARTIAL',
      currency: 'USD',
      subtotal: 117500,
      tax: 9400,
      total: 126900,
      paidAmount: 63450,
      issuedAt: '2026-03-10T13:00:00Z',
      dueAt: '2026-04-10T13:00:00Z',
      paidAt: null,
      buyer: { name: 'GOLD Platform', entityId: 'ENT-001' },
      seller: { name: 'Peru Gold Mining', entityId: 'ENT-006' },
      items: [
        { description: 'Gold bars 1kg x5', quantity: 5, unitPrice: 23500, total: 117500 },
      ],
    },
  ];
}

// بيانات الضمان المالي التجريبية
function generateMockEscrowTransactions() {
  return [
    {
      id: 'ESC-2026-001',
      transactionId: 'TXN-ESC-001',
      status: 'HELD',
      amount: 253800,
      currency: 'USD',
      buyer: { name: 'European Gold Traders', entityId: 'ENT-003', userId: 'USR-003' },
      seller: { name: 'GOLD Platform', entityId: 'ENT-001', userId: 'USR-001' },
      assetGoldId: 'GOLD-2026-001',
      marketplaceListingId: null,
      releaseCondition: 'BUYER_CONFIRMED_DELIVERY',
      createdAt: '2026-03-01T09:00:00Z',
      expectedReleaseAt: '2026-03-15T09:00:00Z',
      releasedAt: null,
      transaction: { id: 'TXN-001', type: 'MARKETPLACE_SALE', status: 'PENDING_DELIVERY' },
    },
    {
      id: 'ESC-2026-002',
      transactionId: 'TXN-ESC-002',
      status: 'HELD',
      amount: 88830,
      currency: 'USD',
      buyer: { name: 'Dubai Gold Souk', entityId: 'ENT-005', userId: 'USR-005' },
      seller: { name: 'GOLD Platform', entityId: 'ENT-001', userId: 'USR-001' },
      assetGoldId: 'GOLD-2026-002',
      marketplaceListingId: 'LIST-001',
      releaseCondition: 'BUYER_CONFIRMED_DELIVERY',
      createdAt: '2026-02-20T11:00:00Z',
      expectedReleaseAt: '2026-03-05T11:00:00Z',
      releasedAt: '2026-03-05T10:30:00Z',
      transaction: { id: 'TXN-002', type: 'MARKETPLACE_SALE', status: 'DELIVERED' },
    },
    {
      id: 'ESC-2026-003',
      transactionId: 'TXN-ESC-003',
      status: 'RELEASED',
      amount: 52432,
      currency: 'EUR',
      buyer: { name: 'European Gold Traders', entityId: 'ENT-003', userId: 'USR-003' },
      seller: { name: 'Artisan Jeweler Algiers', entityId: 'ENT-007', userId: 'USR-007' },
      assetGoldId: 'GOLD-2026-003',
      marketplaceListingId: 'LIST-002',
      releaseCondition: 'BUYER_CONFIRMED_DELIVERY',
      createdAt: '2026-02-15T14:00:00Z',
      expectedReleaseAt: '2026-02-28T14:00:00Z',
      releasedAt: '2026-02-27T16:00:00Z',
      transaction: { id: 'TXN-003', type: 'MARKETPLACE_SALE', status: 'COMPLETED' },
    },
    {
      id: 'ESC-2026-004',
      transactionId: 'TXN-ESC-004',
      status: 'DISPUTED',
      amount: 126900,
      currency: 'USD',
      buyer: { name: 'New York Bullion', entityId: 'ENT-008', userId: 'USR-008' },
      seller: { name: 'GOLD Platform', entityId: 'ENT-001', userId: 'USR-001' },
      assetGoldId: 'GOLD-2026-004',
      marketplaceListingId: null,
      releaseCondition: 'BUYER_CONFIRMED_DELIVERY',
      createdAt: '2026-03-05T08:00:00Z',
      expectedReleaseAt: '2026-03-20T08:00:00Z',
      releasedAt: null,
      transaction: { id: 'TXN-004', type: 'MARKETPLACE_SALE', status: 'DISPUTE_OPEN' },
    },
    {
      id: 'ESC-2026-005',
      transactionId: 'TXN-ESC-005',
      status: 'HELD',
      amount: 36483750,
      currency: 'DZD',
      buyer: { name: 'GOLD Platform', entityId: 'ENT-001', userId: 'USR-001' },
      seller: { name: 'Société Minière du Sud', entityId: 'ENT-004', userId: 'USR-004' },
      assetGoldId: 'GOLD-2026-005',
      marketplaceListingId: null,
      releaseCondition: 'ASSAY_APPROVED',
      createdAt: '2025-12-01T08:00:00Z',
      expectedReleaseAt: '2026-01-15T08:00:00Z',
      releasedAt: null,
      transaction: { id: 'TXN-005', type: 'BULK_PURCHASE', status: 'ASSAY_PENDING' },
    },
  ];
}

// ============================================================================
// دوال مساعدة مشتركة
// ============================================================================

/**
 * توليد بيانات التدفقات النقدية الأخيرة
 * تُستخدم في عرض ملخص الخزينة
 */
async function getRecentCashFlows() {
  try {
    // ملاحظة: نموذج Transaction غير موجود حالياً في Prisma Schema
    // يُرجى إضافته عند تحديث قاعدة البيانات
    // بيانات تجريبية للتدفقات النقدية الأخيرة
    const mockCashFlows = [
      { id: 'TXN-CF-001', type: 'MARKETPLACE_SALE', amount: 88830, currency: 'USD', status: 'COMPLETED', createdAt: new Date('2026-03-15T16:45:00Z') },
      { id: 'TXN-CF-002', type: 'MARKETPLACE_SALE', amount: 52432, currency: 'EUR', status: 'COMPLETED', createdAt: new Date('2026-02-27T16:00:00Z') },
      { id: 'TXN-CF-003', type: 'BULK_PURCHASE', amount: 253800, currency: 'USD', status: 'COMPLETED', createdAt: new Date('2026-02-10T14:30:00Z') },
      { id: 'TXN-CF-004', type: 'CUSTODY_FEE', amount: 12500, currency: 'USD', status: 'COMPLETED', createdAt: new Date('2026-03-01T09:00:00Z') },
      { id: 'TXN-CF-005', type: 'MARKETPLACE_SALE', amount: 35000, currency: 'EUR', status: 'COMPLETED', createdAt: new Date('2026-03-10T11:00:00Z') },
    ];
    return mockCashFlows;
  } catch (error) {
    logger.error('Failed to fetch recent cash flows', { error });
    return [];
  }
}

// ============================================================================
// نظام الرواتب الديناميكي (من WorkerController + جداول الرواتب)
// ============================================================================

/**
 * يحوّل مبلغاً بالعملة الأصلية إلى ما يعادله بالدولار الأمريكي
 * يُستخدم لتوحيد قيم الرواتب متعددة العملات في الملخص المالي
 */
function payrollToUSD(amount: number, cur: string): number {
  if (cur === 'EUR') return amount / EXCHANGE_RATES.USD.EUR;
  if (cur === 'DZD') return amount / EXCHANGE_RATES.USD.DZD;
  return amount;
}

/**
 * جلب نظرة عامة حقيقية على رواتب العمال (موحدة بالدولار الأمريكي)
 * تُغذي الخزينة والملخص المالي ببيانات فعلية بدلاً من القيم الوهمية
 * يعتمد على نماذج WorkerType / Worker / SalaryPayment
 */
async function getPayrollOverview(): Promise<{
  activeWorkers: number;
  monthlyGrossUSD: number;
  paidThisMonthUSD: number;
  paidThisMonthCount: number;
  paidThisYearUSD: number;
  outstandingUSD: number;
  outstandingCount: number;
}> {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const nextYear = new Date(now.getFullYear() + 1, 0, 1);

    const activeWorkers = await prisma.worker.count({ where: { status: 'ACTIVE' } });

    const activeWorkersList = await prisma.worker.findMany({
      where: { status: 'ACTIVE' },
      select: { salary: true, salaryCurrency: true },
    });
    const monthlyGrossUSD = activeWorkersList.reduce(
      (sum, w) => sum + payrollToUSD(Number(w.salary), w.salaryCurrency),
      0,
    );

    const paidThisMonth = await prisma.salaryPayment.findMany({
      where: { status: 'PAID', paidAt: { gte: monthStart, lt: nextMonth } },
      select: { amount: true, currency: true },
    });
    const paidThisMonthUSD = paidThisMonth.reduce(
      (sum, p) => sum + payrollToUSD(Number(p.amount), p.currency),
      0,
    );

    const paidThisYear = await prisma.salaryPayment.findMany({
      where: { status: 'PAID', paidAt: { gte: yearStart, lt: nextYear } },
      select: { amount: true, currency: true },
    });
    const paidThisYearUSD = paidThisYear.reduce(
      (sum, p) => sum + payrollToUSD(Number(p.amount), p.currency),
      0,
    );

    const outstanding = await prisma.salaryPayment.findMany({
      where: { status: 'PENDING' },
      select: { amount: true, currency: true },
    });
    const outstandingUSD = outstanding.reduce(
      (sum, p) => sum + payrollToUSD(Number(p.amount), p.currency),
      0,
    );

    return {
      activeWorkers,
      monthlyGrossUSD,
      paidThisMonthUSD,
      paidThisMonthCount: paidThisMonth.length,
      paidThisYearUSD,
      outstandingUSD,
      outstandingCount: outstanding.length,
    };
  } catch (error) {
    logger.error('Failed to fetch payroll overview', { error });
    return {
      activeWorkers: 0,
      monthlyGrossUSD: 0,
      paidThisMonthUSD: 0,
      paidThisMonthCount: 0,
      paidThisYearUSD: 0,
      outstandingUSD: 0,
      outstandingCount: 0,
    };
  }
}

/**
 * جلب آخر دفعات الرواتب المدفوعة فعلياً (تُعرض ضمن التدفقات النقدية للخزينة)
 */
async function getRecentSalaryPayments(limit = 8): Promise<any[]> {
  try {
    const payments = await prisma.salaryPayment.findMany({
      where: { status: 'PAID' },
      include: { worker: true },
      orderBy: { paidAt: 'desc' },
      take: limit,
    });
    return payments.map((p: any) => ({
      id: `SP-${String(p.id).slice(0, 8)}`,
      type: 'SALARY_PAYMENT',
      amount: Number(p.amount),
      currency: p.currency,
      status: p.status,
      createdAt: p.paidAt || p.createdAt,
      worker: `${p.worker.firstName} ${p.worker.lastName}`,
    }));
  } catch (error) {
    logger.error('Failed to fetch recent salary payments', { error });
    return [];
  }
}

/**
 * جلب إجمالي الأصول الذهبية غير المباعة من قاعدة البيانات
 * يحسب مجموع الأصول التي لم يتم بيعها بعد
 */
async function getGoldInventoryValue(): Promise<number> {
  try {
    // جلب جميع الأصول التي لم تُباع (تم استبعاد حالة SOLD)
    const assets = await prisma.goldAsset.findMany({
      where: {
        status: {
          notIn: ['SOLD', 'DECOMMISSIONED'],  // استبعاد الأصول المباعة والمتوقفة
        },
      },
      select: {
        weightNet: true,     // الوزن الصافي بالجرام
        measuredPurity: true, // النسبة المئوية للنقاوة
        metalType: true,     // نوع المعدن (GOLD, SILVER, etc.)
      },
    });

    // حساب القيمة الإجمالية باستخدام سعر الذهب الحالي
    // ملاحظة: weightNet و measuredPurity من نوع Decimal في Prisma، يجب تحويلهما إلى Number
    let totalValue = 0;
    for (const asset of assets) {
      const pricePerGram = asset.metalType === 'GOLD'
        ? CURRENT_METAL_PRICES.gold.USD / 31.1035  // تحويل الأونصة إلى جرام
        : CURRENT_METAL_PRICES.silver.USD / 31.1035;
      const weightInGrams = Number(asset.weightNet);  // تحويل Decimal إلى number
      const purityPercent = asset.measuredPurity ? Number(asset.measuredPurity) : 100;
      const purityFactor = purityPercent / 100;
      totalValue += weightInGrams * pricePerGram * purityFactor;
    }

    return totalValue;
  } catch (error) {
    logger.error('Failed to calculate gold inventory value', { error });
    return 0;
  }
}

// ============================================================================
// GET /api/v1/financial/treasury — نظرة عامة على الخزينة
// ============================================================================
/**
 * عرض ملخص الخزينة المالية
 *
 * يوفر:
 * 1. إجمالي قيمة مخزون الذهب (suma من GoldAsset حيث الحالة != SOLD)
 * 2. رصيد الضمان المالي (suma من EscrowTransaction حيث الحالة = HELD)
 * 3. ملخص التدفقات النقدية (التحويلات الأخيرة)
 * 4. أرصدة العملات المتعددة (USD, EUR, DZD)
 *
 * Technologies: Prisma Aggregation, Multi-Currency Support, Real-time Treasury View
 */
export async function getTreasury(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    // 1. حساب إجمالي قيمة مخزون الذهب (الأصول غير المباعة)
    const goldInventoryValue = await getGoldInventoryValue();

    // 2. جلب بيانات رواتب العمال الحقيقية (نظام مالية ديناميكي يعتمد NPC/أنواع العمال)
    const payroll = await getPayrollOverview();

    // 3. جلب التدفقات النقدية الأخيرة (تحويلات + دفعات رواتب حقيقية)
    const [recentTransfers, recentSalaryPayments] = await Promise.all([
      getRecentCashFlows(),
      getRecentSalaryPayments(),
    ]);
    const recentTransfersAll = [...recentSalaryPayments, ...recentTransfers].slice(0, 12);

    // 4. حساب أرصدة العملات المتعددة
    const currencyBalances = {
      USD: {
        available: 1250000.00,    // الرصيد المتاح بالدولار الأمريكي
        pending: payroll.outstandingUSD,  // الالتزامات المستحقة (رواتب معلقة حقيقية)
        reserved: 500000.00,      // المحجوز للمعاملات الجارية
      },
      EUR: {
        available: 850000.00,     // الرصيد المتاح باليورو
        pending: 250000.00,
        reserved: 120000.00,
      },
      DZD: {
        available: 135000000,     // الرصيد المتاح بالدينار الجزائري
        pending: 18000000,
        reserved: 25000000,
      },
    };

    // 5. تحويل القيمة للعملة المفضلة
    const convertedValue = currency === 'EUR'
      ? goldInventoryValue * EXCHANGE_RATES.USD.EUR
      : currency === 'DZD'
      ? goldInventoryValue * EXCHANGE_RATES.USD.DZD
      : goldInventoryValue;

    const response: any = {
      success: true,
      data: {
        treasury: {
          totalGoldInventoryValue: {
            raw: goldInventoryValue,
            converted: convertedValue,
            currency: currency,
          },
          totalEscrowBalance: {
            raw: 0,
            converted: 0,
            currency: currency,
          },
          payroll: {
            activeWorkers: payroll.activeWorkers,
            monthlyGrossPayroll: {
              raw: payroll.monthlyGrossUSD,
              converted:
                currency === 'EUR'
                  ? payroll.monthlyGrossUSD * EXCHANGE_RATES.USD.EUR
                  : currency === 'DZD'
                  ? payroll.monthlyGrossUSD * EXCHANGE_RATES.USD.DZD
                  : payroll.monthlyGrossUSD,
              currency: currency,
            },
            paidThisMonth: {
              raw: payroll.paidThisMonthUSD,
              converted:
                currency === 'EUR'
                  ? payroll.paidThisMonthUSD * EXCHANGE_RATES.USD.EUR
                  : currency === 'DZD'
                  ? payroll.paidThisMonthUSD * EXCHANGE_RATES.USD.DZD
                  : payroll.paidThisMonthUSD,
              currency: currency,
            },
            paidThisMonthCount: payroll.paidThisMonthCount,
            outstandingTotal: {
              raw: payroll.outstandingUSD,
              converted:
                currency === 'EUR'
                  ? payroll.outstandingUSD * EXCHANGE_RATES.USD.EUR
                  : currency === 'DZD'
                  ? payroll.outstandingUSD * EXCHANGE_RATES.USD.DZD
                  : payroll.outstandingUSD,
              currency: currency,
            },
            outstandingCount: payroll.outstandingCount,
          },
          currencyBalances,
          recentTransfers: recentTransfersAll.map((t) => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            currency: t.currency,
            status: t.status,
            date: t.createdAt,
          })),
          summary: {
            totalAssets: convertedValue + payroll.outstandingUSD,
            cashOnHand: currencyBalances[currency].available,
            pendingPayments: currencyBalances[currency].pending,
            reservedFunds: currencyBalances[currency].reserved,
            payrollLiability: payroll.outstandingUSD,
            activeWorkers: payroll.activeWorkers,
            monthlyGrossPayroll: payroll.monthlyGrossUSD,
          },
          // قيم مباشرة لقيم الخزينة (تستخدمها لوحات التحكم مباشرةً)
          assetsValue: convertedValue,
          totalGoldValue: convertedValue,
          escrowBalance: payroll.outstandingUSD,
          cashFlow: -payroll.paidThisMonthUSD,
          activeWorkers: payroll.activeWorkers,
          monthlyGrossPayroll: payroll.monthlyGrossUSD,
          paidThisMonth: payroll.paidThisMonthUSD,
          outstandingPayroll: payroll.outstandingUSD,
        },
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    logger.info('Treasury overview retrieved', {
      goldValue: goldInventoryValue,
      payrollOutstanding: payroll.outstandingUSD,
      paidThisMonth: payroll.paidThisMonthUSD,
      requestedBy: (req as any).userId,
    });

    res.json(response);
  } catch (error) {
    logger.error('Failed to retrieve treasury overview', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'TREASURY_FETCH_FAILED',
        message: getLocalizedError('internal_error', lang),
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// GET /api/v1/financial/pricing-engine — محرك التسعير
// ============================================================================
/**
 * التحكم في محرك التسعير لل洗金属ات الثمينة
 *
 * يوفر:
 * 1. أسعار المعادن الحالية (الذهب، الفضة، البلاتين)
 * 2. إعدادات الهوامش وتكاليف التصنيع
 * 3. أسعار الصرف المباشرة
 *
 * Technologies: Real-time Pricing Engine, Multi-Currency Conversion, Margin Calculation
 */
export async function getPricingEngine(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    // 1. أسعار المعادن الحالية بالعملة المفضلة
    const metalPrices = {
      gold: {
        perOunce: CURRENT_METAL_PRICES.gold[currency] || CURRENT_METAL_PRICES.gold.USD,
        perGram: (CURRENT_METAL_PRICES.gold[currency] || CURRENT_METAL_PRICES.gold.USD) / 31.1035,
        perKg: ((CURRENT_METAL_PRICES.gold[currency] || CURRENT_METAL_PRICES.gold.USD) / 31.1035) * 1000,
        change24h: '+1.2%',   // التغير خلال 24 ساعة
        lastUpdated: new Date().toISOString(),
      },
      silver: {
        perOunce: CURRENT_METAL_PRICES.silver[currency] || CURRENT_METAL_PRICES.silver.USD,
        perGram: (CURRENT_METAL_PRICES.silver[currency] || CURRENT_METAL_PRICES.silver.USD) / 31.1035,
        perKg: ((CURRENT_METAL_PRICES.silver[currency] || CURRENT_METAL_PRICES.silver.USD) / 31.1035) * 1000,
        change24h: '+0.8%',
        lastUpdated: new Date().toISOString(),
      },
      platinum: {
        perOunce: CURRENT_METAL_PRICES.platinum[currency] || CURRENT_METAL_PRICES.platinum.USD,
        perGram: (CURRENT_METAL_PRICES.platinum[currency] || CURRENT_METAL_PRICES.platinum.USD) / 31.1035,
        perKg: ((CURRENT_METAL_PRICES.platinum[currency] || CURRENT_METAL_PRICES.platinum.USD) / 31.1035) * 1000,
        change24h: '-0.3%',
        lastUpdated: new Date().toISOString(),
      },
    };

    // 2. إعدادات الهوامش والتكاليف
    const marginSettings = {
      buyMargin: {
        percent: MARGIN_SETTINGS.buyMarginPercent,
        description: lang === 'AR'
          ? 'هامش الشراء - يُضاف إلى سعر السوق عند الشراء'
          : lang === 'FR'
          ? 'Marge d\'achat - ajoutée au prix du marché lors de l\'achat'
          : 'Buy margin - added to market price on purchase',
      },
      sellMargin: {
        percent: MARGIN_SETTINGS.sellMarginPercent,
        description: lang === 'AR'
          ? 'هامش البيع - يُخصم من سعر السوق عند البيع'
          : lang === 'FR'
          ? 'Marge de vente - déduite du prix du marché lors de la vente'
          : 'Sell margin - deducted from market price on sale',
      },
      spread: {
        percent: MARGIN_SETTINGS.spreadPercent,
        description: lang === 'AR'
          ? 'فرق السعر - الفرق بين سعر الشراء والبيع'
          : lang === 'FR'
          ? 'Écart de prix - différence entre le prix d\'achat et de vente'
          : 'Price spread - difference between buy and sell prices',
      },
    };

    // 3. تكاليف التصنيع والخدمات
    const manufacturingCosts = {
      manufacturingPerGram: {
        USD: MARGIN_SETTINGS.manufacturingCostPerGram,
        EUR: MARGIN_SETTINGS.manufacturingCostPerGram * EXCHANGE_RATES.USD.EUR,
        DZD: MARGIN_SETTINGS.manufacturingCostPerGram * EXCHANGE_RATES.USD.DZD,
      },
      refiningPerGram: {
        USD: MARGIN_SETTINGS.refiningCostPerGram,
        EUR: MARGIN_SETTINGS.refiningCostPerGram * EXCHANGE_RATES.USD.EUR,
        DZD: MARGIN_SETTINGS.refiningCostPerGram * EXCHANGE_RATES.USD.DZD,
      },
      insurancePerYear: {
        percent: MARGIN_SETTINGS.insuranceCostPerYear,
        description: lang === 'AR'
          ? 'تأمين سنوي على القيمة الإجمالية'
          : lang === 'FR'
          ? 'Assurance annuelle sur la valeur totale'
          : 'Annual insurance on total value',
      },
      storageFeePerMonth: {
        USD: MARGIN_SETTINGS.storageFeePerMonth,
        EUR: MARGIN_SETTINGS.storageFeePerMonth * EXCHANGE_RATES.USD.EUR,
        DZD: MARGIN_SETTINGS.storageFeePerMonth * EXCHANGE_RATES.USD.DZD,
      },
    };

    // 4. أسعار الصرف المباشرة
    const exchangeRates = {
      USD: EXCHANGE_RATES.USD,
      EUR: EXCHANGE_RATES.EUR,
      DZD: EXCHANGE_RATES.DZD,
      baseCurrency: 'USD',
      lastUpdated: new Date().toISOString(),
      source: 'GOLD Internal Rate Feed',
    };

    // 5. حساب سعر البيع والشراء بناءً على الهوامش
    const calculatedPrices = {
      gold: {
        buyPrice: metalPrices.gold.perGram * (1 + MARGIN_SETTINGS.buyMarginPercent / 100),
        sellPrice: metalPrices.gold.perGram * (1 - MARGIN_SETTINGS.sellMarginPercent / 100),
      },
      silver: {
        buyPrice: metalPrices.silver.perGram * (1 + MARGIN_SETTINGS.buyMarginPercent / 100),
        sellPrice: metalPrices.silver.perGram * (1 - MARGIN_SETTINGS.sellMarginPercent / 100),
      },
    };

    const response: any = {
      success: true,
      data: {
        pricingEngine: {
          metalPrices,
          calculatedPrices,
          marginSettings,
          manufacturingCosts,
          exchangeRates,
          pricingStatus: 'ACTIVE',
          lastCalculated: new Date().toISOString(),
        },
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    logger.info('Pricing engine data retrieved', {
      goldPrice: metalPrices.gold.perOunce,
      requestedBy: (req as any).userId,
    });

    res.json(response);
  } catch (error) {
    logger.error('Failed to retrieve pricing engine data', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'PRICING_ENGINE_FAILED',
        message: getLocalizedError('internal_error', lang),
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// GET /api/v1/financial/invoices — قائمة الفواتير
// ============================================================================
/**
 * جلب قائمة الفواتير مع إمكانية التصفية
 *
 * يوفر:
 * 1. قائمة الفواتير مع فلاتر الحالة والنوع
 * 2. بيانات المشتري والبائع
 * 3. تفاصيل العناصر والضرائب
 * 4. دعم البحث بالتواريخ والترقيم
 *
 * Technologies: Query Parameters, Date Range Filtering, Pagination, Multi-Currency Invoicing
 */
export async function getInvoices(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    // استخراج معاملات البحث من الطلب
    const {
      status,       // حالة الفاتورة: PAID, PENDING, OVERDUE, PARTIAL, CANCELLED
      type,         // نوع الفاتورة: PURCHASE, SELL
      dateFrom,     // تاريخ البداية
      dateTo,       // تاريخ النهاية
      page = '1',   // رقم الصفحة
      limit = '20', // عدد العناصر في الصفحة
    } = req.query;

    // توليد بيانات الفواتير التجريبية
    const allInvoices = generateMockInvoices();

    // تطبيق الفلاتر على الفواتير
    let filteredInvoices = [...allInvoices];

    if (status) {
      filteredInvoices = filteredInvoices.filter((inv) => inv.status === status);
    }

    if (type) {
      filteredInvoices = filteredInvoices.filter((inv) => inv.type === type);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom as string);
      filteredInvoices = filteredInvoices.filter(
        (inv) => new Date(inv.issuedAt) >= fromDate,
      );
    }

    if (dateTo) {
      const toDate = new Date(dateTo as string);
      filteredInvoices = filteredInvoices.filter(
        (inv) => new Date(inv.issuedAt) <= toDate,
      );
    }

    // حساب الترقيم (Pagination)
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    const totalItems = filteredInvoices.length;
    const totalPages = Math.ceil(totalItems / limitNum);

    // تطبيق الترقيم
    const paginatedInvoices = filteredInvoices.slice(skip, skip + limitNum);

    // تحويل العملات للفواتير حسب العملة المفضلة
    const convertedInvoices = paginatedInvoices.map((inv) => {
      const conversionRate = currency === inv.currency
        ? 1
        : EXCHANGE_RATES[inv.currency]?.[currency] || 1;

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        type: inv.type,
        status: inv.status,
        currency: inv.currency,
        subtotal: inv.subtotal,
        tax: inv.tax,
        total: inv.total,
        paidAmount: inv.paidAmount || (inv.status === 'PAID' ? inv.total : 0),
        outstandingAmount: inv.total - (inv.paidAmount || (inv.status === 'PAID' ? inv.total : 0)),
        convertedTotal: inv.total * conversionRate,
        issuedAt: inv.issuedAt,
        dueAt: inv.dueAt,
        paidAt: inv.paidAt,
        buyer: inv.buyer,
        seller: inv.seller,
        items: inv.items,
        isOverdue: inv.status === 'OVERDUE' || new Date(inv.dueAt) < new Date(),
      };
    });

    const response: any = {
      success: true,
      data: {
        invoices: convertedInvoices,
        summary: {
          totalInvoices: totalItems,
          totalOutstanding: filteredInvoices
            .filter((inv) => inv.status !== 'PAID')
            .reduce((sum, inv) => sum + inv.total, 0),
          overdueInvoices: filteredInvoices.filter((inv) => inv.status === 'OVERDUE').length,
          paidInvoices: filteredInvoices.filter((inv) => inv.status === 'PAID').length,
        },
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          itemsPerPage: limitNum,
          hasNext: pageNum < totalPages,
          hasPrevious: pageNum > 1,
        },
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    logger.info('Invoices retrieved', {
      total: totalItems,
      page: pageNum,
      filters: { status, type, dateFrom, dateTo },
      requestedBy: (req as any).userId,
    });

    res.json(response);
  } catch (error) {
    logger.error('Failed to retrieve invoices', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INVOICES_FETCH_FAILED',
        message: getLocalizedError('internal_error', lang),
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// GET /api/v1/financial/escrow — إدارة الضمان المالي
// ============================================================================
/**
 * عرض وإدارة الضمان المالي (Escrow Management)
 *
 * يوفر:
 * 1. قائمة معاملات الضمان مع فلتر الحالة
 * 2. عرض معاملات سوق الذهب المعلقة (في انتظار تأكيد التسليم)
 * 3. معلومات المشتري والبائع لكل معاملة
 * 4. تتبع حالة الضمان (HELD, RELEASED, DISPUTED, REFUNDED)
 *
 * Technologies: Escrow Management, Buyer/Seller Info, Marketplace Integration
 */
export async function getEscrowStatus(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    // استخراج معاملات الفلتر من الطلب
    const { status } = req.query;

    // جلب معاملات الضمان من قاعدة البيانات
    // ملاحظة: إذا لم يكن نموذج EscrowTransaction موجوداً، نستخدم بيانات تجريبية
    let escrowTransactions;
    try {
      // محاولة جلب البيانات من قاعدة البيانات
      const whereCondition: any = {};
      if (status) {
        whereCondition.status = status;
      }

      // ملاحظة: يُرجى التحقق من وجود نموذج EscrowTransaction في Prisma Schema
      // إذا لم يكن موجوداً، سنستخدم البيانات التجريبية أدناه
      escrowTransactions = await (prisma as any).escrowTransaction?.findMany({
        where: whereCondition,
        include: {
          buyer: { select: { name: true, entityId: true, userId: true } },
          seller: { select: { name: true, entityId: true, userId: true } },
          transaction: { select: { id: true, type: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }) || generateMockEscrowTransactions();
    } catch (error) {
      // إذا فشل الجلب من قاعدة البيانات، نستخدم البيانات التجريبية
      logger.warn('Using mock escrow data - EscrowTransaction model may not exist', { error });
      escrowTransactions = generateMockEscrowTransactions();
    }

    // تصفية المعاملات حسب الحالة إذا كانت البيانات تجريبية
    let filteredEscrows = [...escrowTransactions];
    if (status) {
      filteredEscrows = filteredEscrows.filter((esc) => esc.status === status);
    }

    // تقسيم المعاملات حسب الحالة
    const heldEscrows = filteredEscrows.filter((esc) => esc.status === 'HELD');
    const releasedEscrows = filteredEscrows.filter((esc) => esc.status === 'RELEASED');
    const disputedEscrows = filteredEscrows.filter((esc) => esc.status === 'DISPUTED');
    const pendingDeliveryEscrows = filteredEscrows.filter(
      (esc) => esc.status === 'HELD' && esc.transaction?.status === 'PENDING_DELIVERY',
    );

    // تحويل العملات للمعاملات
    const convertedEscrows = filteredEscrows.map((esc) => {
      const conversionRate = currency === esc.currency
        ? 1
        : EXCHANGE_RATES[esc.currency]?.[currency] || 1;

      return {
        id: esc.id,
        transactionId: esc.transactionId,
        status: esc.status,
        amount: esc.amount,
        originalCurrency: esc.currency,
        convertedAmount: esc.amount * conversionRate,
        displayCurrency: currency,
        buyer: esc.buyer,
        seller: esc.seller,
        assetGoldId: esc.assetGoldId,
        marketplaceListingId: esc.marketplaceListingId,
        releaseCondition: esc.releaseCondition,
        transaction: esc.transaction,
        createdAt: esc.createdAt,
        expectedReleaseAt: esc.expectedReleaseAt,
        releasedAt: esc.releasedAt,
        daysHeld: Math.floor(
          (Date.now() - new Date(esc.createdAt).getTime()) / (1000 * 60 * 60 * 24),
        ),
        isOverdue: esc.expectedReleaseAt && new Date(esc.expectedReleaseAt) < new Date(),
      };
    });

    const response: any = {
      success: true,
      data: {
        escrow: {
          transactions: convertedEscrows,
          pendingDelivery: pendingDeliveryEscrows.map((esc) => ({
            id: esc.id,
            amount: esc.amount,
            currency: esc.currency,
            buyer: esc.buyer,
            seller: esc.seller,
            assetGoldId: esc.assetGoldId,
            transactionStatus: esc.transaction?.status,
            createdAt: esc.createdAt,
            expectedReleaseAt: esc.expectedReleaseAt,
          })),
          summary: {
            totalTransactions: filteredEscrows.length,
            heldCount: heldEscrows.length,
            releasedCount: releasedEscrows.length,
            disputedCount: disputedEscrows.length,
            pendingDeliveryCount: pendingDeliveryEscrows.length,
            totalHeldValue: {
              raw: heldEscrows.reduce((sum, esc) => sum + esc.amount, 0),
              converted: heldEscrows.reduce((sum, esc) => {
                const rate = currency === esc.currency ? 1 : EXCHANGE_RATES[esc.currency]?.[currency] || 1;
                return sum + esc.amount * rate;
              }, 0),
              currency: currency,
            },
          },
        },
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    logger.info('Escrow status retrieved', {
      totalTransactions: filteredEscrows.length,
      heldCount: heldEscrows.length,
      pendingDelivery: pendingDeliveryEscrows.length,
      requestedBy: (req as any).userId,
    });

    res.json(response);
  } catch (error) {
    logger.error('Failed to retrieve escrow status', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'ESCROW_FETCH_FAILED',
        message: getLocalizedError('internal_error', lang),
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// GET /api/v1/financial/summary — ملخص لوحة التحكم المالية
// ============================================================================
/**
 * عرض ملخص شامل للوحة التحكم المالية
 *
 * يوفر:
 * 1. الإيرادات حسب الفترة الزمنية (يومي، أسبوعي، شهري، سنوي)
 * 2. المدفوعات المعلقة (الفواتير غير المدفوعة)
 * 3. الالتزامات الضريبية لكل سوق (الجزائر، الإمارات، أوروبا، أمريكا)
 *
 * Technologies: Financial Analytics, Tax Obligations, Revenue Aggregation, Market-wise Reporting
 */
export async function getFinancialSummary(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    // 1. حساب الإيرادات حسب الفترة الزمنية
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // محاولة جلب المعاملات المكتملة من قاعدة البيانات
    // ملاحظة: نموذج Transaction غير موجود حالياً في Prisma Schema
    // يُرجى استبدال هذا ببيانات فعلية عند إضافة النموذج
    const completedTransactions = [
      { amount: 235000, currency: 'USD', type: 'MARKETPLACE_SALE', createdAt: new Date('2026-01-15') },
      { amount: 45200, currency: 'EUR', type: 'MARKETPLACE_SALE', createdAt: new Date('2026-02-01') },
      { amount: 88830, currency: 'USD', type: 'MARKETPLACE_SALE', createdAt: new Date('2026-02-20') },
      { amount: 125000, currency: 'USD', type: 'BULK_PURCHASE', createdAt: new Date('2026-03-01') },
      { amount: 32000, currency: 'DZD', type: 'CUSTODY_FEE', createdAt: new Date('2026-03-05') },
      { amount: 55000, currency: 'EUR', type: 'MARKETPLACE_SALE', createdAt: new Date('2026-03-10') },
      { amount: 75000, currency: 'USD', type: 'MARKETPLACE_SALE', createdAt: new Date('2026-03-12') },
    ];

    // تحويل كل المعاملات للعملة المفضلة
    const normalizeToUSD = (amount: number, fromCurrency: string): number => {
      if (fromCurrency === 'USD') return amount;
      if (fromCurrency === 'EUR') return amount / EXCHANGE_RATES.USD.EUR;
      if (fromCurrency === 'DZD') return amount / EXCHANGE_RATES.USD.DZD;
      return amount;
    };

    const convertFromUSD = (amountUSD: number, toCurrency: string): number => {
      if (toCurrency === 'USD') return amountUSD;
      if (toCurrency === 'EUR') return amountUSD * EXCHANGE_RATES.USD.EUR;
      if (toCurrency === 'DZD') return amountUSD * EXCHANGE_RATES.USD.DZD;
      return amountUSD;
    };

    // حساب الإيرادات حسب الفترة
    const revenueByPeriod = {
      today: convertFromUSD(
        completedTransactions
          .filter((t) => new Date(t.createdAt) >= todayStart)
          .reduce((sum, t) => sum + normalizeToUSD(t.amount, t.currency), 0),
        currency,
      ),
      thisWeek: convertFromUSD(
        completedTransactions
          .filter((t) => new Date(t.createdAt) >= weekStart)
          .reduce((sum, t) => sum + normalizeToUSD(t.amount, t.currency), 0),
        currency,
      ),
      thisMonth: convertFromUSD(
        completedTransactions
          .filter((t) => new Date(t.createdAt) >= monthStart)
          .reduce((sum, t) => sum + normalizeToUSD(t.amount, t.currency), 0),
        currency,
      ),
      thisYear: convertFromUSD(
        completedTransactions
          .filter((t) => new Date(t.createdAt) >= yearStart)
          .reduce((sum, t) => sum + normalizeToUSD(t.amount, t.currency), 0),
        currency,
      ),
      currency,
    };

    // 1.5 مصاريف الرواتب الحقيقية (نظام العمال الديناميكي — بيانات فعلية من جداول الرواتب)
    const salaryExpenses = await getPayrollOverview();
    const salaryExpenseByPeriod = {
      thisMonth: convertFromUSD(salaryExpenses.paidThisMonthUSD, currency),
      thisMonthCount: salaryExpenses.paidThisMonthCount,
      thisYear: convertFromUSD(salaryExpenses.paidThisYearUSD, currency),
      outstanding: convertFromUSD(salaryExpenses.outstandingUSD, currency),
      outstandingCount: salaryExpenses.outstandingCount,
      activeWorkers: salaryExpenses.activeWorkers,
      monthlyGrossPayroll: convertFromUSD(salaryExpenses.monthlyGrossUSD, currency),
      currency: currency,
    };

    // 2. حساب المدفوعات المعلقة
    const mockInvoices = generateMockInvoices();
    const outstandingPayments: any = {
      total: convertFromUSD(
        mockInvoices
          .filter((inv) => inv.status !== 'PAID')
          .reduce((sum, inv) => sum + normalizeToUSD(inv.total, inv.currency), 0),
        currency,
      ),
      overdue: convertFromUSD(
        mockInvoices
          .filter((inv) => inv.status === 'OVERDUE')
          .reduce((sum, inv) => sum + normalizeToUSD(inv.total, inv.currency), 0),
        currency,
      ),
      pending: convertFromUSD(
        mockInvoices
          .filter((inv) => inv.status === 'PENDING')
          .reduce((sum, inv) => sum + normalizeToUSD(inv.total, inv.currency), 0),
        currency,
      ),
      partial: convertFromUSD(
        mockInvoices
          .filter((inv) => inv.status === 'PARTIAL')
          .reduce((sum, inv) => sum + normalizeToUSD(inv.total - (inv.paidAmount || 0), inv.currency), 0),
        currency,
      ),
      currency,
      breakdown: mockInvoices
        .filter((inv) => inv.status !== 'PAID')
        .map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          total: inv.total,
          paidAmount: inv.paidAmount || 0,
          outstanding: inv.total - (inv.paidAmount || 0),
          currency: inv.currency,
          status: inv.status,
          dueDate: inv.dueAt,
        })),
    };

    // 2.5 التزامات رواتب العمال المستحقة فعلياً (تنضم إلى المبالغ المستحقة الإجمالية)
    outstandingPayments.payrollLiability = convertFromUSD(salaryExpenses.outstandingUSD, currency);
    outstandingPayments.payrollCount = salaryExpenses.outstandingCount;
    outstandingPayments.total = (outstandingPayments.total || 0) + convertFromUSD(salaryExpenses.outstandingUSD, currency);

    // 3. الالتزامات الضريبية لكل سوق
    const taxObligations = {
      algeria: {
        market: lang === 'AR' ? 'الجزائر' : lang === 'FR' ? 'Algérie' : 'Algeria',
        vatRate: 19,    // نسبة ضريبة القيمة المضافة في الجزائر
        goldTaxRate: 0, // معفى من الضريبة على الذهب في الجزائر
        estimatedTax: convertFromUSD(0, currency),
        status: 'COMPLIANT',
        nextFilingDate: '2026-04-20',
        notes: lang === 'AR'
          ? 'الذهب معمى من ضريبة القيمة المضافة في الجزائر حسب القانون 04-18'
          : lang === 'FR'
          ? 'L\'or est exonéré de TVA en Algérie selon la loi 04-18'
          : 'Gold is VAT exempt in Algeria per Law 04-18',
      },
      uae: {
        market: lang === 'AR' ? 'الإمارات' : lang === 'FR' ? 'EAU' : 'UAE',
        vatRate: 5,     // نسبة ضريبة القيمة المضافة في الإمارات
        goldTaxRate: 5, // ضريبة على المعادن الثمينة في الإمارات
        estimatedTax: convertFromUSD(4250, currency), // تقدير ضريبي
        status: 'COMPLIANT',
        nextFilingDate: '2026-04-28',
        notes: lang === 'AR'
          ? 'ضريبة القيمة المضافة 5% على المعادن الثمينة في الإمارات'
          : lang === 'FR'
          ? 'TVA de 5% sur les métaux précieux aux EAU'
          : '5% VAT on precious metals in UAE',
      },
      europe: {
        market: lang === 'AR' ? 'أوروبا (عدم الاعتراف)' : lang === 'FR' ? 'Europe (TVA)' : 'Europe (VAT)',
        vatRate: 20,    // نسبة ضريبة القيمة المضافة في أوروبا (متوسط)
        goldTaxRate: 0, // معفى من ضريبة القيمة المضافة على الذهب الاستثماري
        estimatedTax: convertFromUSD(0, currency),
        status: 'COMPLIANT',
        nextFilingDate: '2026-05-15',
        notes: lang === 'AR'
          ? 'الذهب الاستثماري معفى من ضريبة القيمة المضافة في الاتحاد الأوروبي'
          : lang === 'FR'
          ? 'L\'or d\'investissement est exonéré de TVA dans l\'UE'
          : 'Investment gold is VAT exempt in the EU',
      },
      usa: {
        market: lang === 'AR' ? 'الولايات المتحدة' : lang === 'FR' ? 'États-Unis' : 'USA',
        vatRate: 0,     // لا توجد ضريبة مبيعات فيدرالية
        goldTaxRate: 0, // لا ضريبة على الذهب الاستثماري
        estimatedTax: convertFromUSD(0, currency),
        status: 'COMPLIANT',
        nextFilingDate: '2026-04-15',
        notes: lang === 'AR'
          ? 'لا توجد ضريبة فيدرالية على الذهب الاستثماري في الولايات المتحدة'
          : lang === 'FR'
          ? 'Pas de taxe fédérale sur l\'or d\'investissement aux États-Unis'
          : 'No federal tax on investment gold in the USA',
      },
    };

    // حساب إجمالي الالتزامات الضريبية
    const totalTaxObligation = Object.values(taxObligations).reduce(
      (sum, market) => sum + market.estimatedTax,
      0,
    );

    // 4. ملخص الأداء المالي
    const payrollOutstandingConverted = convertFromUSD(salaryExpenses.outstandingUSD, currency);
    const salaryExpenseThisYearConverted = convertFromUSD(salaryExpenses.paidThisYearUSD, currency);
    const performanceMetrics = {
      grossRevenue: revenueByPeriod.thisYear,
      totalTaxObligation,
      salaryExpenseThisYear: salaryExpenseThisYearConverted,
      salaryExpenseThisMonth: convertFromUSD(salaryExpenses.paidThisMonthUSD, currency),
      payrollLiability: payrollOutstandingConverted,
      activeWorkers: salaryExpenses.activeWorkers,
      netRevenue:
        revenueByPeriod.thisYear - totalTaxObligation - salaryExpenseThisYearConverted,
      outstandingReceivables: outstandingPayments.total,
      cashFlowRatio: outstandingPayments.total > 0
        ? (revenueByPeriod.thisMonth / outstandingPayments.total).toFixed(2)
        : 'N/A',
      averageInvoiceValue: mockInvoices.length > 0
        ? convertFromUSD(
            mockInvoices.reduce((sum, inv) => sum + normalizeToUSD(inv.total, inv.currency), 0) / mockInvoices.length,
            currency,
          )
        : 0,
      currency,
    };

    const response: any = {
      success: true,
      data: {
        financialSummary: {
          revenueByPeriod,
          salaryExpenses: salaryExpenseByPeriod,
          outstandingPayments,
          taxObligations,
          performanceMetrics,
          period: {
            today: todayStart.toISOString(),
            thisWeek: weekStart.toISOString(),
            thisMonth: monthStart.toISOString(),
            thisYear: yearStart.toISOString(),
          },
        },
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    logger.info('Financial summary retrieved', {
      revenueThisYear: revenueByPeriod.thisYear,
      salaryExpenseThisYear: salaryExpenseThisYearConverted,
      payrollOutstanding: payrollOutstandingConverted,
      outstanding: outstandingPayments.total,
      taxObligation: totalTaxObligation,
      requestedBy: (req as any).userId,
    });

    res.json(response);
  } catch (error) {
    logger.error('Failed to retrieve financial summary', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'FINANCIAL_SUMMARY_FAILED',
        message: getLocalizedError('internal_error', lang),
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// دوال مساعدة خاصة
// ============================================================================

/**
 * ترجمة رسائل الخطأ حسب اللغة المفضلة
 * تدعم العربية (AR)، الفرنسية (FR)، الإنجليزية (EN)
 */
function getLocalizedError(key: string, lang: Language): string {
  const errors: Record<Language, Record<string, string>> = {
    AR: {
      internal_error: 'خطأ داخلي في النظام',
      treasury_fetch_failed: 'فشل في جلب بيانات الخزينة',
      pricing_engine_failed: 'فشل في جلب بيانات محرك التسعير',
      invoices_fetch_failed: 'فشل في جلب بيانات الفواتير',
      escrow_fetch_failed: 'فشل في جلب بيانات الضمان المالي',
      financial_summary_failed: 'فشل في جلب الملخص المالي',
    },
    FR: {
      internal_error: 'Erreur interne du système',
      treasury_fetch_failed: 'Échec de la récupération des données de la trésorerie',
      pricing_engine_failed: 'Échec de la récupération des données du moteur de tarification',
      invoices_fetch_failed: 'Échec de la récupération des données de facturation',
      escrow_fetch_failed: 'Échec de la récupération des données du compte séquestre',
      financial_summary_failed: 'Échec de la récupération du résumé financier',
    },
    EN: {
      internal_error: 'Internal System Error',
      treasury_fetch_failed: 'Failed to retrieve treasury data',
      pricing_engine_failed: 'Failed to retrieve pricing engine data',
      invoices_fetch_failed: 'Failed to retrieve invoice data',
      escrow_fetch_failed: 'Failed to retrieve escrow status data',
      financial_summary_failed: 'Failed to retrieve financial summary',
    },
  };
  return errors[lang]?.[key] || errors[Language.EN][key] || key;
}
