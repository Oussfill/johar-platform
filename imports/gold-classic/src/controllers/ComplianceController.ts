import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

// جدول انتظار التحقق من KYC/KYB
export const getKYCQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type, page = '1', limit = '20' } = req.query;
    const lang = (req.query.lang as string) || 'ar';
    const currency = (req.query.currency as string) || 'XAU';

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [verifications, total] = await Promise.all([
      prisma.userVerification.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userVerification.count({ where }),
    ]);

    logger.info(`تم جلب جدول انتظار KYC: ${verifications.length} سجل`);

    res.json({
      success: true,
      data: {
        verifications,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('خطأ في جلب جدول KYC:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب جدول انتظار KYC',
    });
  }
};

// نتائج فحص AML
export const getAMLScreening = async (req: Request, res: Response): Promise<void> => {
  try {
    const { riskLevel, dateFrom, dateTo } = req.query;
    const lang = (req.query.lang as string) || 'ar';
    const currency = (req.query.currency as string) || 'XAU';

    const where: any = {};
    if (riskLevel) where.riskScore = { gte: parseInt(riskLevel as string) };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    const screenings = await prisma.aiFraudLog.findMany({
      where,
      include: {
        asset: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    logger.info(`تم جلب فحوصات AML: ${screenings.length} سجل`);

    res.json({
      success: true,
      data: { screenings },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('خطأ في جلب فحوصات AML:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب نتائج فحص AML',
    });
  }
};

// سجلات المراجعة ISO 27001
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, entityType, severity, dateFrom, dateTo, page = '1', limit = '50' } = req.query;
    const lang = (req.query.lang as string) || 'ar';
    const currency = (req.query.currency as string) || 'XAU';

    const where: any = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (severity) where.severity = severity;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    logger.info(`تم جلب سجلات المراجعة: ${logs.length} سجل`);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('خطأ في جلب سجلات المراجعة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب سجلات المراجعة',
    });
  }
};

// إحصائيات الامتثال
export const getComplianceStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const lang = (req.query.lang as string) || 'ar';
    const currency = (req.query.currency as string) || 'XAU';

    const [kycStats, riskStats, sarFilings, auditSeverity] = await Promise.all([
      prisma.userVerification.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.aiFraudLog.groupBy({
        by: ['riskScore'],
        _count: true,
      }),
      prisma.auditLog.findMany({
        where: { action: 'SAR_FILED' },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.groupBy({
        by: ['severity'],
        _count: true,
      }),
    ]);

    logger.info('تم جلب إحصائيات الامتثال');

    res.json({
      success: true,
      data: {
        kycByStatus: kycStats,
        riskDistribution: riskStats,
        recentSARFilings: sarFilings,
        auditSeverityDistribution: auditSeverity,
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('خطأ في جلب إحصائيات الامتثال:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات الامتثال',
    });
  }
};
