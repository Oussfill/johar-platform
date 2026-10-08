import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

// جلب جوازات السفر الرقمية
export const getDigitalPassports = async (req: Request, res: Response): Promise<void> => {
  const lang = ((req as any).preferredLanguage as string) || 'ar';
  const currency = ((req as any).preferredCurrency as string) || 'USD';
  try {
    const { status, page = '1', limit = '10' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;

    const [passports, total] = await Promise.all([
      prisma.digitalPassport.findMany({
        where,
        include: {
          asset: {
            select: {
              goldId: true,
              serialNumber: true,
              weightGross: true,
              weightNet: true,
              measuredPurity: true,
              karat: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.digitalPassport.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        passports,
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
    logger.error('خطأ في جلب جوازات السفر الرقمية:', error);
    res.status(500).json({
      success: false,
      message:
        lang === 'ar' ? 'خطأ في جلب جوازات السفر الرقمية' : 'Error fetching digital passports',
    });
  }
};

// جلب حالة قفل NFC
export const getNFCStatus = async (req: Request, res: Response): Promise<void> => {
  const lang = ((req as any).preferredLanguage as string) || 'ar';
  const currency = ((req as any).preferredCurrency as string) || 'USD';
  try {

    // بيانات تجريبية لحالة أجهزة NFC
    const nfcChips = [
      {
        chipId: 'NFC-CHIP-001',
        goldId: 'GOLD-2024-001',
        lockStatus: 'locked',
        lastScanTime: '2024-03-15T14:30:00Z',
        tamperAlert: false,
        batteryLevel: 87,
        firmwareVersion: '2.1.4',
      },
      {
        chipId: 'NFC-CHIP-002',
        goldId: 'GOLD-2024-002',
        lockStatus: 'unlocked',
        lastScanTime: '2024-03-15T13:15:00Z',
        tamperAlert: false,
        batteryLevel: 92,
        firmwareVersion: '2.1.4',
      },
      {
        chipId: 'NFC-CHIP-003',
        goldId: 'GOLD-2024-003',
        lockStatus: 'locked',
        lastScanTime: '2024-03-15T12:00:00Z',
        tamperAlert: true,
        batteryLevel: 45,
        firmwareVersion: '2.1.3',
      },
      {
        chipId: 'NFC-CHIP-004',
        goldId: 'GOLD-2024-004',
        lockStatus: 'locked',
        lastScanTime: '2024-03-15T11:45:00Z',
        tamperAlert: false,
        batteryLevel: 78,
        firmwareVersion: '2.1.4',
      },
    ];

    const summary = {
      totalChips: nfcChips.length,
      locked: nfcChips.filter((c) => c.lockStatus === 'locked').length,
      unlocked: nfcChips.filter((c) => c.lockStatus === 'unlocked').length,
      tamperAlerts: nfcChips.filter((c) => c.tamperAlert).length,
    };

    res.json({
      success: true,
      data: {
        nfcChips,
        summary,
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('خطأ في جلب حالة NFC:', error);
    res.status(500).json({
      success: false,
      message: lang === 'ar' ? 'خطأ في جلب حالة NFC' : 'Error fetching NFC status',
    });
  }
};

// جلب تفاصيل جواز السفر حسب معرف الذهب
export const getPassportDetails = async (req: Request, res: Response): Promise<void> => {
  const lang = ((req as any).preferredLanguage as string) || 'ar';
  const currency = ((req as any).preferredCurrency as string) || 'USD';
  try {
    const { goldId } = req.params;

    const passport = await prisma.digitalPassport.findFirst({
      where: {
        asset: { goldId },
      },
      include: {
        asset: {
          include: {
            chainOfCustody: {
              orderBy: { eventTimestamp: 'desc' },
              take: 10,
            },
          },
        },
      },
    });

    if (!passport) {
      res.status(404).json({
        success: false,
        message: lang === 'ar' ? 'الجواز غير موجود' : 'Passport not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        passport,
        chainOfCustody: (passport as any).asset?.chainOfCustody || [],
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('خطأ في جلب تفاصيل الجواز:', error);
    res.status(500).json({
      success: false,
      message:
        lang === 'ar' ? 'خطأ في جلب تفاصيل الجواز' : 'Error fetching passport details',
    });
  }
};

// جلب حالة توليد رمز QR
export const getQRCodeStatus = async (req: Request, res: Response): Promise<void> => {
  const lang = ((req as any).preferredLanguage as string) || 'ar';
  const currency = ((req as any).preferredCurrency as string) || 'USD';
  try {

    // بيانات تجريبية لحالة رموز QR
    const qrCodes = [
      {
        goldId: 'GOLD-2024-001',
        qrCodeId: 'QR-001',
        status: 'generated',
        generatedAt: '2024-03-15T10:00:00Z',
        scanCount: 15,
        lastScannedAt: '2024-03-15T14:20:00Z',
        expiryDate: '2025-03-15T10:00:00Z',
      },
      {
        goldId: 'GOLD-2024-002',
        qrCodeId: 'QR-002',
        status: 'generated',
        generatedAt: '2024-03-15T10:30:00Z',
        scanCount: 8,
        lastScannedAt: '2024-03-15T13:45:00Z',
        expiryDate: '2025-03-15T10:30:00Z',
      },
      {
        goldId: 'GOLD-2024-003',
        qrCodeId: 'QR-003',
        status: 'pending',
        generatedAt: null,
        scanCount: 0,
        lastScannedAt: null,
        expiryDate: null,
      },
      {
        goldId: 'GOLD-2024-004',
        qrCodeId: 'QR-004',
        status: 'generated',
        generatedAt: '2024-03-15T11:00:00Z',
        scanCount: 22,
        lastScannedAt: '2024-03-15T14:10:00Z',
        expiryDate: '2025-03-15T11:00:00Z',
      },
    ];

    const summary = {
      total: qrCodes.length,
      generated: qrCodes.filter((q) => q.status === 'generated').length,
      pending: qrCodes.filter((q) => q.status === 'pending').length,
      totalScans: qrCodes.reduce((acc, q) => acc + q.scanCount, 0),
    };

    res.json({
      success: true,
      data: {
        qrCodes,
        summary,
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('خطأ في جلب حالة رمز QR:', error);
    res.status(500).json({
      success: false,
      message: lang === 'ar' ? 'خطأ في جلب حالة رمز QR' : 'Error fetching QR code status',
    });
  }
};
