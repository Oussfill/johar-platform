import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

// إدارة مفاتيح API
export const getAPIKeys = async (req: Request, res: Response): Promise<void> => {
  try {
    const lang = (req.query.lang as string) || 'ar';
    const currency = (req.query.currency as string) || 'XAU';

    const apiKeys = await prisma.apiKey.findMany({
      include: {
        entity: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const safeKeys = apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      prefix: key.keyPrefix,
      isActive: key.isActive,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
    }));

    logger.info(`تم جلب مفاتيح API: ${safeKeys.length} مفتاح`);

    res.json({
      success: true,
      data: { apiKeys: safeKeys },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('خطأ في جلب مفاتيح API:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب مفاتيح API',
    });
  }
};

// نظرة عامة على أدلة البلوكتشين
export const getBlockchainEvidence = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventType, verified, page = '1', limit = '20' } = req.query;
    const lang = (req.query.lang as string) || 'ar';
    const currency = (req.query.currency as string) || 'XAU';

    const where: any = {};
    if (eventType) where.eventType = eventType;
    if (verified !== undefined) where.verified = verified === 'true';

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [evidence, total] = await Promise.all([
      prisma.blockchainEvidence.findMany({
        where,
        include: {
          asset: true,
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.blockchainEvidence.count({ where }),
    ]);

    logger.info(`تم جلب أدلة البلوكتشين: ${evidence.length} سجل`);

    res.json({
      success: true,
      data: {
        evidence,
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
    logger.error('خطأ في جلب أدلة البلوكتشين:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب أدلة البلوكتشين',
    });
  }
};

// فحص صحة النظام
export const getSystemHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const lang = (req.query.lang as string) || 'ar';
    const currency = (req.query.currency as string) || 'XAU';

    let dbStatus = 'connected';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'disconnected';
    }

    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    logger.info('تم فحص صحة النظام');

    res.json({
      success: true,
      data: {
        database: {
          status: dbStatus,
        },
        uptime: {
          seconds: Math.floor(uptime),
          formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
        },
        memory: {
          rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        },
        activeConnections: 1,
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('خطأ في فحص صحة النظام:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في فحص صحة النظام',
    });
  }
};

// حالة التكاملات الخارجية
export const getIntegrations = async (req: Request, res: Response): Promise<void> => {
  try {
    const lang = (req.query.lang as string) || 'ar';
    const currency = (req.query.currency as string) || 'XAU';

    const integrations = [
      {
        name: 'Banking API',
        nameAr: 'واجهة البرمجة المصرفية',
        status: 'active',
        lastChecked: new Date().toISOString(),
      },
      {
        name: 'Customs API',
        nameAr: 'واجهة البرمجة الجمركية',
        status: 'active',
        lastChecked: new Date().toISOString(),
      },
      {
        name: 'Shipping API',
        nameAr: 'واجهة البرمجة الشحن',
        status: 'active',
        lastChecked: new Date().toISOString(),
      },
    ];

    logger.info('تم جلب حالة التكاملات');

    res.json({
      success: true,
      data: { integrations },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('خطأ في جلب حالة التكاملات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب حالة التكاملات',
    });
  }
};
