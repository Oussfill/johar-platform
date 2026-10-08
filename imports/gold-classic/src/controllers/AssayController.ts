import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

// جلب طلبات التحليل من المعمل
export const getAssayOrders = async (req: Request, res: Response): Promise<void> => {
  const lang = ((req as any).preferredLanguage as string) || 'ar';
  const currency = ((req as any).preferredCurrency as string) || 'USD';
  try {
    const { status, labId, page = '1', limit = '10' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // بناء شروط البحث
    const where: any = {};
    if (status) where.status = status;
    if (labId) where.labId = labId;

    const [orders, total] = await Promise.all([
      prisma.goldAsset.findMany({
        where,
        include: {
          assayRecords: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.goldAsset.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('خطأ في جلب طلبات التحليل:', error);
    res.status(500).json({
      success: false,
      message: lang === 'ar' ? 'خطأ في جلب طلبات التحليل' : 'Error fetching assay orders',
    });
  }
};

// جلب سجلات اختبار الأجهزة
export const getInstrumentLogs = async (req: Request, res: Response): Promise<void> => {
  const lang = ((req as any).preferredLanguage as string) || 'ar';
  const currency = ((req as any).preferredCurrency as string) || 'USD';
  try {

    // بيانات تجريبية لسجلات اختبار الأجهزة
    const instrumentLogs = [
      {
        id: 'XRF-001',
        instrumentType: 'XRF',
        goldId: 'GOLD-2024-001',
        reading: { purity: 99.5, weight: 100.2 },
        confidenceScore: 0.98,
        timestamp: '2024-03-15T10:30:00Z',
        status: 'completed',
      },
      {
        id: 'DENS-001',
        instrumentType: 'Density',
        goldId: 'GOLD-2024-002',
        reading: { density: 19.32, volume: 5.18 },
        confidenceScore: 0.95,
        timestamp: '2024-03-15T11:00:00Z',
        status: 'completed',
      },
      {
        id: 'ULTRA-001',
        instrumentType: 'Ultrasonic',
        goldId: 'GOLD-2024-003',
        reading: { thickness: 2.5, velocity: 6420 },
        confidenceScore: 0.92,
        timestamp: '2024-03-15T11:30:00Z',
        status: 'completed',
      },
      {
        id: 'FIRE-001',
        instrumentType: 'Fire Assay',
        goldId: 'GOLD-2024-004',
        reading: { purity: 99.9, yield: 99.8 },
        confidenceScore: 0.99,
        timestamp: '2024-03-15T12:00:00Z',
        status: 'completed',
      },
    ];

    res.json({
      success: true,
      data: {
        instrumentLogs,
        summary: {
          totalTests: instrumentLogs.length,
          averageConfidence:
            instrumentLogs.reduce((acc, log) => acc + log.confidenceScore, 0) /
            instrumentLogs.length,
        },
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('خطأ في جلب سجلات الأجهزة:', error);
    res.status(500).json({
      success: false,
      message: lang === 'ar' ? 'خطأ في جلب سجلات الأجهزة' : 'Error fetching instrument logs',
    });
  }
};

// جلب نتيجة التحليل حسب معرف الذهب
export const getAssayResult = async (req: Request, res: Response): Promise<void> => {
  const lang = ((req as any).preferredLanguage as string) || 'ar';
  const currency = ((req as any).preferredCurrency as string) || 'USD';
  try {
    const { goldId } = req.params;

    const asset = await prisma.goldAsset.findUnique({
      where: { goldId },
      include: {
        assayRecords: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!asset) {
      res.status(404).json({
        success: false,
        message: lang === 'ar' ? 'الذهب غير موجود' : 'Gold asset not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        asset,
        recentAssays: asset.assayRecords,
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('خطأ في جلب نتيجة التحليل:', error);
    res.status(500).json({
      success: false,
      message: lang === 'ar' ? 'خطأ في جلب نتيجة التحليل' : 'Error fetching assay result',
    });
  }
};

// جلب أداء المعمل
export const getLabPerformance = async (req: Request, res: Response): Promise<void> => {
  const lang = ((req as any).preferredLanguage as string) || 'ar';
  const currency = ((req as any).preferredCurrency as string) || 'USD';
  try {

    // بيانات أداء المعمل التجريبية
    const labPerformance = {
      labId: 'LAB-001',
      labName: lang === 'ar' ? 'معمل التحليل الرئيسي' : 'Main Analysis Lab',
      metrics: {
        testsCompleted: 1250,
        averageConfidence: 0.96,
        averageTurnaroundTime: '2.5 hours',
        successRate: 0.98,
        monthlyTrend: [
          { month: 'Jan', tests: 180 },
          { month: 'Feb', tests: 210 },
          { month: 'Mar', tests: 195 },
        ],
      },
      instruments: [
        { type: 'XRF', status: 'operational', lastCalibration: '2024-03-10' },
        { type: 'Density Meter', status: 'operational', lastCalibration: '2024-03-12' },
        { type: 'Ultrasonic', status: 'maintenance', lastCalibration: '2024-03-08' },
      ],
    };

    res.json({
      success: true,
      data: labPerformance,
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('خطأ في جلب أداء المعمل:', error);
    res.status(500).json({
      success: false,
      message: lang === 'ar' ? 'خطأ في جلب أداء المعمل' : 'Error fetching lab performance',
    });
  }
};
