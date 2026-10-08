// ============================================================================
// GOLD PLATFORM — ASSET CONTROLLER
// ============================================================================
// Controller الأساسي لإدارة الأصول الذهبية والمعادن الثمينة
// يتضمن: تسجيل أصل جديد، تحقق عام، جلب تفاصيل الأصل

import { Request, Response } from 'express';
import { Language, Currency, AssetStatus, NdefLockStatus, EvidenceEventType } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import {
  generateGoldId,
  hashNfcUid,
  generateReportNumber,
  sha256Hash,
} from '../utils/crypto';

// ============================================================================
// POST /api/v1/assets/register — تسجيل أصل جديد
// ============================================================================
/**
 * تسجيل أصل جديد في النظام
 *
 * خطوات التسجيل:
 * 1. التحقق من عدم تكرار الرقم التسلسلي
 * 2. توليد Gold ID فريد
 * 3. إنشاء سجل الأصل في قاعدة البيانات
 * 4. إنشاء سجل الهوية الرقمية (Layer 03)
 * 5. إنشاء الجواز الرقمي الأولي (Layer 04)
 * 6. تسجيل الأصل في ERP (Layer 05)
 * 7. قفل شريحة NFC بـ NDEF Write-Lock (الأمان الفيزيائي)
 * 8. تسجيل الإثبات على البلوكتشين (Layer 07)
 * 9. تسجيل الحدث في سجل التدقيق
 */
export async function registerAsset(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const {
      serialNumber,
      manufacturerSerial,
      productType,
      metalType,
      karat,
      weightGross,
      weightNet,
      dimensions,
      color,
      originEntityId,
      nfcUid,
      productImage,
      nameTranslations,
      descriptionTranslations,
    } = (req as any).validatedData;

    // 1. التحقق من عدم تكرار الرقم التسلسلي
    const existingAsset = await prisma.goldAsset.findFirst({
      where: { serialNumber, metalType },
    });

    if (existingAsset) {
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_SERIAL',
          message: `Asset with serial number ${serialNumber} already exists`,
        },
      });
      return;
    }

    // 2. توليد Gold ID فريد
    const goldId = generateGoldId();

    // 3. حساب النقاوة الأولية من karat
    const measuredPurity = karat ? (karat / 24) * 100 : null;

    // 4. تشفير NFC UID إذا كان متاحاً
    let nfcUidHash: string | null = null;
    if (nfcUid) {
      nfcUidHash = hashNfcUid(nfcUid);
    }

    // 5. إنشاء الأصل الأساسي
    const asset = await prisma.goldAsset.create({
      data: {
        goldId,
        serialNumber,
        manufacturerSerial,
        productType,
        metalType,
        karat,
        weightGross,
        weightNet,
        dimensions: dimensions || undefined,
        color,
        productImage: productImage || undefined,
        measuredPurity,
        purityKarat: karat,
        nfcUid,
        nfcUidHash,
        nameTranslations: nameTranslations,
        descriptionTranslations: descriptionTranslations || undefined,
        status: AssetStatus.RAW_MATERIAL,
        originEntityId,
        producedAt: new Date(),
      },
    });

    // 6. إنشاء الهوية الرقمية (Layer 03: Digital Gold Identity)
    const genesisHash = sha256Hash(
      `${goldId}|${serialNumber}|${metalType}|${weightGross}|${Date.now()}`,
    );

    await prisma.digitalIdentity.create({
      data: {
        goldId,
        assetId: asset.id,
        nfcUidHash,
        qrCodeHash: sha256Hash(`QR:${goldId}`),
        genesisHash,
        currentHash: genesisHash,
        hashChainLength: 1,
        isActive: true,
        isLocked: false,
      },
    });

    // 7. إنشاء الجواز الرقمي (Layer 04: Digital Passport)
    const passportNumber = `DP-${Date.now().toString(36).toUpperCase()}`;

    await prisma.digitalPassport.create({
      data: {
        assetId: asset.id,
        passportNumber,
        passportData: {
          ar: nameTranslations.ar || goldId,
          fr: nameTranslations.fr || goldId,
          en: nameTranslations.en || goldId,
        },
        totalWeight: weightNet,
        certifiedPurity: measuredPurity || 0,
        certifiedKarat: karat || 0,
        assayCount: 0,
        passportHash: sha256Hash(`${passportNumber}|${goldId}|${weightNet}`),
      },
    });

    // 8. تسجيل في ERP (Layer 05)
    const warehouseId = await getDefaultWarehouseId();

    await prisma.goldErpInventory.create({
      data: {
        itemId: `ERP-INV-${Date.now().toString(36).toUpperCase()}`,
        assetId: asset.id,
        warehouseId,
        custodianId: (req as any).userId,
        custodyStatus: 'SECURE',
        valuationCurrency: currency,
      },
    });

    // 9. تسجيل الإثبات على البلوكتشين (Layer 07)
    const previousEvidence = await prisma.blockchainEvidence.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { currentHash: true },
    });

    const evidenceData = {
      asset_gold_id: goldId,
      serial_number: serialNumber,
      metal_type: metalType,
      weight_gross: weightGross,
      weight_net: weightNet,
      purity: measuredPurity,
      action: 'REGISTRATION',
      timestamp: new Date().toISOString(),
    };

    await prisma.blockchainEvidence.create({
      data: {
        assetId: asset.id,
        eventType: 'ASSET_REGISTRATION',
        evidenceData,
        previousHash: previousEvidence?.currentHash || 'GENESIS',
        currentHash: sha256Hash(JSON.stringify(evidenceData)),
        sourceSystem: 'ERP',
        sourceAction: 'REGISTER',
      },
    });

    // 10. تسجيل الحدث في سجل التدقيق (ISO 27001)
    await prisma.auditLog.create({
      data: {
        userId: (req as any).userId,
        action: 'ASSET_REGISTERED',
        entityType: 'GoldAsset',
        entityId: asset.id,
        description: `New asset registered: ${goldId} (${metalType}, ${weightGross}g)`,
        newValues: {
          goldId,
          serialNumber,
          metalType,
          weightGross,
          nfcLocked: false,
        },
        severity: 'INFO',
        category: 'OPERATION',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    // 11. توليد رمز QR
    const qrCodeUrl = `/api/v1/assets/qr/${goldId}`;

    logger.info('Asset registered successfully', {
      goldId,
      assetId: asset.id,
      metalType,
      registeredBy: (req as any).userId,
    });

    const response: any = {
      success: true,
      data: {
        assetId: asset.id,
        goldId,
        serialNumber,
        metalType,
        weightGross,
        weightNet,
        karat,
        measuredPurity,
        productImage,
        passportNumber,
        nfcLocked: false,
        qrCodeUrl,
        nameTranslations,
        createdAt: asset.createdAt,
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Asset registration failed', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: getLocalizedError('internal_error', lang),
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// GET /api/v1/assets/verify/:passport_id — التحقق العام من الأصالة
// ============================================================================
/**
 * رحلة التحقق العامة للمستهلك (عند مسح NFC/QR)
 *
 * تُرجع:
 * 1. الجواز الرقمي الكامل
 * 2. سلسلة التوريد المعتمدة (Chain of Custody)
 * 3. نتائج الفحص المختبري
 * 4. حالة الـ NFC والـ QR
 * 5. التوقيع الرقمي للجهة المصدرة
 *
 * هذه الواجهة مفتوحة للعامة ولا تتطلب مصادقة
 */
export async function verifyAssetPublic(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const { passport_id } = req.params;

    // 1. جلب الجواز الرقمي
    const passport = await prisma.digitalPassport.findFirst({
      where: { passportNumber: passport_id },
      include: {
        asset: {
          include: {
            assayRecords: {
              where: { overallResult: 'PASS' },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
            chainOfCustody: {
              where: { status: 'COMPLETED' },
              orderBy: { eventTimestamp: 'desc' },
              take: 10,
            },
            digitalIdentity: true,
            erpInventory: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
    });

    if (!passport) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PASSPORT_NOT_FOUND',
          message: getLocalizedError('asset_not_found', lang),
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // 2. التحقق من عدم إلغاء الجواز
    if (passport.isRevoked) {
      res.status(410).json({
        success: false,
        error: {
          code: 'PASSPORT_REVOKED',
          message: 'This digital passport has been revoked',
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // 3. إرجاع البيانات بالتنسيق المناسب
    const assetName =
      lang === 'AR'
        ? (passport.asset.nameTranslations as any)?.ar || passport.passportNumber
        : lang === 'FR'
        ? (passport.asset.nameTranslations as any)?.fr || passport.passportNumber
        : (passport.asset.nameTranslations as any)?.en || passport.passportNumber;

    const response: any = {
      success: true,
      data: {
        verification: {
          status: 'VERIFIED',
          goldId: passport.asset.goldId,
          passportNumber: passport.passportNumber,
          digitalSignature: passport.digitalSignature,
        },
        asset: {
          name: assetName,
          goldId: passport.asset.goldId,
          serialNumber: passport.asset.serialNumber,
          metalType: passport.asset.metalType,
          karat: passport.asset.karat,
          weightGross: passport.asset.weightGross,
          weightNet: passport.asset.weightNet,
          measuredPurity: passport.asset.measuredPurity,
          productType: passport.asset.productType,
        },
        assay: {
          totalAssays: passport.assayCount,
          lastAssayDate: passport.lastAssayDate,
          certifiedPurity: passport.certifiedPurity,
          certifiedKarat: passport.certifiedKarat,
          recentResults: passport.asset.assayRecords.map((a) => ({
            reportNumber: a.reportNumber,
            purity: a.measuredPurity,
            karat: a.certifiedKarat,
            labId: a.labId,
            date: a.createdAt,
          })),
        },
        chainOfCustody: {
          totalEvents: passport.asset.chainOfCustody.length,
          history: passport.asset.chainOfCustody.map((c) => ({
            fromEntityId: c.fromEntityId,
            toEntityId: c.toEntityId,
            date: c.eventTimestamp,
            type: c.transferType,
          })),
        },
        custody: {
          status: passport.asset.erpInventory?.custodyStatus,
          warehouse:
            lang === 'AR'
              ? passport.asset.erpInventory?.warehouse.nameAr
              : lang === 'FR'
              ? passport.asset.erpInventory?.warehouse.nameFr
              : passport.asset.erpInventory?.warehouse.name,
        },
        digitalIdentity: passport.asset.digitalIdentity,
        disclaimer: getAiDisclaimer(lang),
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Asset verification failed', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'VERIFICATION_FAILED',
        message: getLocalizedError('internal_error', lang),
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getDefaultWarehouseId(): Promise<string> {
  const warehouse = await prisma.warehouse.findFirst({
    where: { isActive: true },
    select: { id: true },
  });

  if (!warehouse) {
    // إنشاء مخزن افتراضي إذا لم يكن موجوداً
    const newWarehouse = await prisma.warehouse.create({
      data: {
        warehouseCode: 'WH-DEFAULT-001',
        name: 'GOLD Primary Secure Vault',
        nameAr: 'خزينة GOLD الآمنة الرئيسية',
        nameFr: 'Coffre-fort principal GOLD',
        location: { country: 'DZ', city: 'Algiers', address: 'Main Facility' },
        facilityType: 'SECURE_VAULT',
        securityLevel: 'HIGH_SECURITY',
      },
    });
    return newWarehouse.id;
  }

  return warehouse.id;
}

function getLocalizedError(key: string, lang: Language): string {
  const errors: Record<Language, Record<string, string>> = {
    AR: {
      asset_not_found: 'الأصل غير موجود',
      internal_error: 'خطأ داخلي',
      duplicate_serial: 'الرقم التسلسلي مسجل بالفعل',
      passport_not_found: 'الجواز الرقمي غير موجود',
    },
    FR: {
      asset_not_found: 'Actif introuvable',
      internal_error: 'Erreur interne',
      duplicate_serial: 'Numéro de série déjà enregistré',
      passport_not_found: 'Passeport numérique introuvable',
    },
    EN: {
      asset_not_found: 'Asset Not Found',
      internal_error: 'Internal Error',
      duplicate_serial: 'Serial number already registered',
      passport_not_found: 'Digital passport not found',
    },
  };
  return errors[lang]?.[key] || errors[Language.EN][key] || key;
}

function getAiDisclaimer(lang: Language): string {
  const disclaimers: Record<Language, string> = {
    AR: 'تقييم الذكاء الاصطناعي هو مساعدة تحليلية ولا يحل محل الاختبار المختبري المطلوب قانوناً أو التقييم المهني.',
    FR: "L'évaluation par intelligence artificielle est une aide analytique et ne remplace pas les tests de laboratoire requis par la loi ni l'expertise professionnelle.",
    EN: 'AI-generated assessment is an analytical aid and does not replace legally required laboratory testing or professional appraisal.',
  };
  return disclaimers[lang];
}

// ============================================================================
// GET /api/v1/assets/gold/:gold_id — جلب تفاصيل أصل بالـ Gold ID
// ============================================================================

export async function getAssetByGoldId(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const { gold_id } = req.params;

    const asset = await prisma.goldAsset.findFirst({
      where: { goldId: gold_id },
      include: {
        digitalPassport: {
          select: {
            passportNumber: true,
            certifiedPurity: true,
            certifiedKarat: true,
            assayCount: true,
            lastAssayDate: true,
            isRevoked: true,
          },
        },
        digitalIdentity: {
          select: {
            goldId: true,
            isActive: true,
            isLocked: true,
            hashChainLength: true,
          },
        },
        erpInventory: {
          select: {
            itemId: true,
            custodyStatus: true,
            warehouse: {
              select: {
                warehouseCode: true,
                name: true,
                nameAr: true,
                nameFr: true,
                securityLevel: true,
              },
            },
          },
        },
        assayRecords: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            reportNumber: true,
            measuredPurity: true,
            certifiedKarat: true,
            overallResult: true,
            createdAt: true,
          },
        },
        chainOfCustody: {
          orderBy: { eventTimestamp: 'desc' },
          take: 10,
          select: {
            custodyId: true,
            fromEntity: {
              select: { name: true, nameAr: true, nameFr: true, entityType: true },
            },
            toEntity: {
              select: { name: true, nameAr: true, nameFr: true, entityType: true },
            },
            eventTimestamp: true,
            transferType: true,
            status: true,
          },
        },
      },
    });

    if (!asset) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: getLocalizedError('asset_not_found', lang),
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // ترجمة اسم الأصل
    const assetName =
      lang === 'AR'
        ? (asset.nameTranslations as any)?.ar || asset.goldId
        : lang === 'FR'
        ? (asset.nameTranslations as any)?.fr || asset.goldId
        : (asset.nameTranslations as any)?.en || asset.goldId;

    const response: any = {
      success: true,
      data: {
        assetId: asset.id,
        goldId: asset.goldId,
        serialNumber: asset.serialNumber,
        manufacturerSerial: asset.manufacturerSerial,
        productType: asset.productType,
        metalType: asset.metalType,
        karat: asset.karat,
        weightGross: asset.weightGross,
        weightNet: asset.weightNet,
        measuredPurity: asset.measuredPurity,
        color: asset.color,
        productImage: asset.productImage || null,
        status: asset.status,
        name: assetName,
        nfcStatus: asset.ndefLockStatus,
        producedAt: asset.producedAt,
        createdAt: asset.createdAt,
        digitalPassport: asset.digitalPassport,
        digitalIdentity: asset.digitalIdentity,
        inventory: asset.erpInventory
          ? {
              itemId: asset.erpInventory.itemId,
              custodyStatus: asset.erpInventory.custodyStatus,
              warehouse: asset.erpInventory.warehouse,
            }
          : null,
        recentAssays: asset.assayRecords.map((a) => ({
          reportNumber: a.reportNumber,
          purity: a.measuredPurity,
          karat: a.certifiedKarat,
          result: a.overallResult,
          date: a.createdAt,
        })),
        custodyHistory: asset.chainOfCustody.map((c) => ({
          custodyId: c.custodyId,
          from:
            lang === 'AR'
              ? c.fromEntity.nameAr
              : lang === 'FR'
              ? c.fromEntity.nameFr
              : c.fromEntity.name,
          to:
            lang === 'AR'
              ? c.toEntity.nameAr
              : lang === 'FR'
              ? c.toEntity.nameFr
              : c.toEntity.name,
          date: c.eventTimestamp,
          type: c.transferType,
          status: c.status,
        })),
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Get asset by Gold ID failed', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: getLocalizedError('internal_error', lang),
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// GET /api/v1/assets — قائمة جميع الأصول مع التصفية والبحث
// ============================================================================

export async function listAssets(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const {
      page = '1',
      limit = '20',
      metalType,
      status,
      karat,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // بناء شروط البحث
    const where: any = {};

    if (metalType) {
      where.metalType = metalType;
    }

    if (status) {
      where.status = status;
    }

    if (karat) {
      where.karat = parseInt(karat as string, 10);
    }

    if (search) {
      where.OR = [
        { goldId: { contains: search as string, mode: 'insensitive' } },
        { serialNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // بناء ترتيب العرض
    const orderBy: any = {};
    if (sortBy === 'weight') {
      orderBy.weightGross = sortOrder;
    } else if (sortBy === 'purity') {
      orderBy.measuredPurity = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [assets, total] = await Promise.all([
      prisma.goldAsset.findMany({
        where,
        include: {
          digitalPassport: {
            select: { passportNumber: true },
          },
          erpInventory: {
            select: {
              custodyStatus: true,
              warehouse: {
                select: { warehouseCode: true, name: true, nameAr: true, nameFr: true },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.goldAsset.count({ where }),
    ]);

    const response: any = {
      success: true,
      data: {
        assets: assets.map((a) => ({
          assetId: a.id,
          goldId: a.goldId,
          serialNumber: a.serialNumber,
          productType: a.productType,
          metalType: a.metalType,
          karat: a.karat,
          weightGross: a.weightGross,
          weightNet: a.weightNet,
          measuredPurity: a.measuredPurity,
          status: a.status,
          nfcStatus: a.ndefLockStatus,
          productImage: a.productImage || null,
          passportNumber: a.digitalPassport?.passportNumber,
          custodyStatus: a.erpInventory?.custodyStatus,
          warehouse:
            lang === 'AR'
              ? a.erpInventory?.warehouse.nameAr
              : lang === 'FR'
              ? a.erpInventory?.warehouse.nameFr
              : a.erpInventory?.warehouse.name,
          createdAt: a.createdAt,
        })),
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
          hasNext: pageNum * limitNum < total,
          hasPrevious: pageNum > 1,
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
    logger.error('List assets failed', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'LIST_FAILED',
        message: getLocalizedError('internal_error', lang),
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// PATCH /api/v1/assets/:asset_id/status — تحديث حالة الأصل
// ============================================================================

export async function updateAssetStatus(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const { asset_id } = req.params;
    const { status, reason } = req.body;

    // حارس المعرّف: أي معرّف غير UUID لا يصل إلى Prisma (400/404 بدل 500)
    if (typeof asset_id !== 'string' || asset_id.length !== 36) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: getLocalizedError('asset_not_found', lang),
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // التحقق من وجود الأصل
    const asset = await prisma.goldAsset.findUnique({
      where: { id: asset_id },
      select: { id: true, goldId: true, status: true },
    });

    if (!asset) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: getLocalizedError('asset_not_found', lang),
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // التحقق من أن الحالة الجديدة صالحة (الانتقال المنطقي)
    const validTransitions: Record<string, string[]> = {
      RAW_MATERIAL: ['IN_REFINING'],
      IN_REFINING: ['READY_FOR_ASSAY'],
      READY_FOR_ASSAY: ['IN_ASSAY'],
      IN_ASSAY: ['ASSAYED'],
      ASSAYED: ['CERTIFIED'],
      CERTIFIED: ['INVENTORY'],
      INVENTORY: ['LISTED', 'IN_CUSTODY', 'IN_TRANSIT', 'DECOMMISSIONED'],
      LISTED: ['SOLD', 'IN_CUSTODY', 'DECOMMISSIONED'],
      IN_CUSTODY: ['IN_TRANSIT', 'LISTED', 'DECOMMISSIONED'],
      IN_TRANSIT: ['DELIVERED', 'IN_CUSTODY'],
      DELIVERED: ['INVENTORY', 'SOLD'],
      SOLD: ['IN_SECONDARY_MARKET'],
      IN_SECONDARY_MARKET: ['RECYCLED', 'DECOMMISSIONED'],
      RECYCLED: ['RAW_MATERIAL'],
      DECOMMISSIONED: [],
    };

    if (!validTransitions[asset.status]?.includes(status)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition from ${asset.status} to ${status}`,
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // تحديث الحالة
    const updatedAsset = await prisma.goldAsset.update({
      where: { id: asset_id },
      data: { status },
    });

    // تسجيل الحدث في سجل التدقيق (ISO 27001)
    await prisma.auditLog.create({
      data: {
        userId: (req as any).userId,
        action: 'ASSET_STATUS_CHANGED',
        entityType: 'GoldAsset',
        entityId: asset_id,
        description: `Asset ${asset.goldId} status changed from ${asset.status} to ${status}`,
        oldValues: { status: asset.status },
        newValues: { status, reason },
        severity: 'INFO',
        category: 'OPERATION',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info('Asset status updated', {
      goldId: asset.goldId,
      oldStatus: asset.status,
      newStatus: status,
      updatedBy: (req as any).userId,
    });

    const response: any = {
      success: true,
      data: {
        assetId: asset.id,
        goldId: asset.goldId,
        previousStatus: asset.status,
        newStatus: status,
        updatedAt: updatedAsset.updatedAt,
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Update asset status failed', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: getLocalizedError('internal_error', lang),
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// MERGE / SPLIT — عمليات الدمج والتقسيم (عمليات الإغلاق والفتح)
// ============================================================================
// تنفّذ عمليات إعادة الهيكلة الفيزيائية مع الحفاظ على:
//   - مبدأ الحفظ: مجموع أوزان الأصول قبل وبعد متساوٍ (L = C + S)
//   - سلسلة الحيازة: سجل حركة لكل أصل مُستهلك وكل أصل جديد
//   - سجل التدقيق ISO 27001 وإثبات البلوكتشين

const OUTFLOW_STATUSES: AssetStatus[] = [
  AssetStatus.SOLD,
  AssetStatus.DELIVERED,
  AssetStatus.RECYCLED,
  AssetStatus.DECOMMISSIONED,
];

async function getReconciliationEntities(): Promise<[string, string]> {
  // جهة الإنشاء (منشأة التصفية/إعادة الهيكلة)
  let from = await prisma.externalEntity.findFirst({
    where: { entityCode: 'GOLD-PLATFORM-REFINERY' },
    select: { id: true },
  });
  if (!from) {
    from = await prisma.externalEntity.create({
      data: {
        entityCode: 'GOLD-PLATFORM-REFINERY',
        entityType: 'REFINERY',
        name: 'JOHAR Central Refinery',
        nameAr: 'مصفاة جوهر المركزية',
        nameFr: 'Raffinerie Centrale Johar',
        country: 'DZA',
        city: 'Algiers',
        registrationNumber: 'RC-GOLD-REF-0001',
        contactEmail: 'refinery@gold-platform.com',
        isVerified: true,
        verificationDate: new Date(),
      },
    });
  }

  // جهة الاستلام (عهدة التخزين الآمن)
  let to = await prisma.externalEntity.findFirst({
    where: { entityCode: 'GOLD-SECURE-CUSTODY' },
    select: { id: true },
  });
  if (!to) {
    to = await prisma.externalEntity.create({
      data: {
        entityCode: 'GOLD-SECURE-CUSTODY',
        entityType: 'CUSTODIAN',
        name: 'JOHAR Secure Custody',
        nameAr: 'عهدة جوهر الآمنة',
        nameFr: 'Dépôt sécurisé Johar',
        country: 'DZA',
        city: 'Algiers',
        registrationNumber: 'RC-GOLD-CUS-0001',
        contactEmail: 'custody@gold-platform.com',
        isVerified: true,
        verificationDate: new Date(),
      },
    });
  }

  return [from.id, to.id];
}

async function createAssetBundle(params: {
  goldId: string;
  serialNumber: string;
  productType: any;
  metalType: any;
  karat: number | null;
  weightGross: number;
  weightNet: number;
  measuredPurity: number | null;
  originEntityId: string | null;
  nameTranslations: any;
  descriptionTranslations?: any;
  status: AssetStatus;
  warehouseId: string;
  custodianId: string;
  currency: Currency;
  cocFromEntityId: string;
  cocToEntityId: string;
  cocNotes: string;
  action: 'MERGE' | 'SPLIT';
  sourceGoldIds: string[];
}): Promise<any> {
  const { goldId, serialNumber, productType, metalType, karat } = params;

  const asset = await prisma.goldAsset.create({
    data: {
      goldId,
      serialNumber,
      productType,
      metalType,
      karat,
      weightGross: params.weightGross,
      weightNet: params.weightNet,
      measuredPurity: params.measuredPurity,
      purityKarat: karat,
      nameTranslations: params.nameTranslations,
      descriptionTranslations: params.descriptionTranslations || undefined,
      status: params.status,
      originEntityId: params.originEntityId,
      producedAt: new Date(),
    },
  });

  // الهوية الرقمية + الجواز الرقمي
  const genesisHash = sha256Hash(
    `${goldId}|${serialNumber}|${metalType}|${params.weightGross}|${Date.now()}`,
  );
  await prisma.digitalIdentity.create({
    data: {
      goldId,
      assetId: asset.id,
      qrCodeHash: sha256Hash(`QR:${goldId}`),
      genesisHash,
      currentHash: genesisHash,
      hashChainLength: 1,
      isActive: true,
      isLocked: false,
    },
  });

  const passportNumber = `DP-${Date.now().toString(36).toUpperCase()}`;
  await prisma.digitalPassport.create({
    data: {
      assetId: asset.id,
      passportNumber,
      passportData: {
        ar: params.nameTranslations?.ar || goldId,
        fr: params.nameTranslations?.fr || goldId,
        en: params.nameTranslations?.en || goldId,
      },
      totalWeight: params.weightNet,
      certifiedPurity: params.measuredPurity || 0,
      certifiedKarat: karat || 0,
      assayCount: 0,
      passportHash: sha256Hash(`${passportNumber}|${goldId}|${params.weightNet}`),
    },
  });

  // سجل ERP
  await prisma.goldErpInventory.create({
    data: {
      itemId: `ERP-INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 999)}`,
      assetId: asset.id,
      warehouseId: params.warehouseId,
      custodianId: params.custodianId,
      custodyStatus: 'SECURE',
      valuationCurrency: params.currency,
    },
  });

  // إثبات البلوكتشين
  const previousEvidence = await prisma.blockchainEvidence.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { currentHash: true },
  });

  const evidenceData = {
    asset_gold_id: goldId,
    serial_number: serialNumber,
    metal_type: metalType,
    karat,
    weight_gross: params.weightGross,
    weight_net: params.weightNet,
    purity: params.measuredPurity,
    action: params.action,
    merged_from: params.sourceGoldIds,
    timestamp: new Date().toISOString(),
  };

await prisma.blockchainEvidence.create({
      data: {
        assetId: asset.id,
        eventType:
          params.action === 'MERGE'
            ? EvidenceEventType.RECYCLING_INITIATED
            : EvidenceEventType.OWNERSHIP_TRANSFER,
        evidenceData,
        previousHash: previousEvidence?.currentHash || 'GENESIS',
        currentHash: sha256Hash(JSON.stringify(evidenceData)),
        sourceSystem: 'ERP',
        sourceAction: params.action,
      },
    });

  // سلسلة الحيازة
  const newCoc = await prisma.chainOfCustody.create({
    data: {
      custodyId: `COC-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 999)}`,
      assetId: asset.id,
      fromEntityId: params.cocFromEntityId,
      toEntityId: params.cocToEntityId,
      transferType: 'INTERNAL',
      requiresDualAuth: false,
      initiatedBy: params.custodianId,
      approvedBy: params.custodianId,
      handoverNotes: params.cocNotes,
      status: 'COMPLETED',
    },
  });

  return {
    asset,
    passportNumber,
    erp: { custodyId: newCoc.custodyId },
  };
}

// ============================================================================
// POST /api/v1/assets/merge — دمج أصول متعددة في أصل واحد
// ============================================================================

export async function mergeAssets(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const body = (req as any).validatedData;
    const { assetIds, newSerialNumber, nameTranslations, descriptionTranslations, reason, productType } = body;

    // جلب الأصول
    const assets = await prisma.goldAsset.findMany({
      where: { id: { in: assetIds } },
      include: { erpInventory: { select: { warehouseId: true } }, originEntity: { select: { id: true } } },
    });

    if (assets.length !== assetIds.length) {
      res.status(404).json({
        success: false,
        error: { code: 'ASSET_NOT_FOUND', message: 'One or more assets not found' },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    const invalid = assets.filter((a) => OUTFLOW_STATUSES.includes(a.status));
    if (invalid.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NON_MERGEABLE_ASSET',
          message: `Assets in status ${invalid.map((a) => a.status).join(', ')} cannot be merged`,
          details: invalid.map((a) => a.goldId),
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    const metalTypes = new Set(assets.map((a) => a.metalType));
    const karats = new Set(assets.map((a) => a.karat));
    const first = assets[0];

    if (metalTypes.size > 1) {
      res.status(400).json({
        success: false,
        error: { code: 'METAL_TYPE_MISMATCH', message: 'Cannot merge different metal types' },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }
    if (karats.size > 1) {
      res.status(400).json({
        success: false,
        error: { code: 'KARAT_MISMATCH', message: 'Cannot merge assets with different karats' },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    const karat = first.karat ?? null;
    const metalType = first.metalType;
    const finalProductType: any = productType || first.productType || 'BULLION';
    const measuredPurity = karat ? (karat / 24) * 100 : first.measuredPurity ? Number(first.measuredPurity) : null;

    const weightGross = Number(assets.reduce((s, a) => s + Number(a.weightGross), 0));
    const weightNet = Number(assets.reduce((s, a) => s + Number(a.weightNet), 0));

    const goldId = generateGoldId();
    const serialNumber =
      newSerialNumber ||
      `MRG-${Date.now().toString(36).toUpperCase()}-${goldId.split('-')[1]}`;

    const [cocFromId, cocToId] = await getReconciliationEntities();

    const names = nameTranslations || {
      ar: goldId,
      fr: goldId,
      en: goldId,
    };

    const bundle = await createAssetBundle({
      goldId,
      serialNumber,
      productType: finalProductType,
      metalType,
      karat,
      weightGross,
      weightNet,
      measuredPurity,
      originEntityId: first.originEntityId || first.originEntity?.id || null,
      nameTranslations: names,
      descriptionTranslations,
      status: AssetStatus.CERTIFIED,
      warehouseId: first.erpInventory?.warehouseId || (await getDefaultWarehouseId()),
      custodianId: (req as any).userId,
      currency,
      cocFromEntityId: cocFromId,
      cocToEntityId: cocToId,
      cocNotes: `Merged assets: ${assets.map((a) => a.goldId).join(', ')}${reason ? ` — ${reason}` : ''}`,
      action: 'MERGE',
      sourceGoldIds: assets.map((a) => a.goldId),
    });

    // إنهاء الأصول المصدرية: سجلات خروج + تعطيل الهويات + حذف سجلات ERP
    const sourceIds = assets.map((a) => a.id);

    // COC لكل أصل مصدري (سجل الإغلاق)
    for (const a of assets) {
      await prisma.chainOfCustody.create({
        data: {
          custodyId: `COC-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 999)}`,
          assetId: a.id,
          fromEntityId: a.originEntityId || a.originEntity?.id || cocFromId,
          toEntityId: cocToId,
          transferType: 'DISPOSAL',
          requiresDualAuth: false,
          initiatedBy: (req as any).userId,
          approvedBy: (req as any).userId,
          handoverNotes: `Merged into ${goldId}${reason ? ` — ${reason}` : ''}`,
          status: 'COMPLETED',
        },
      });
    }

    await prisma.goldAsset.updateMany({
      where: { id: { in: sourceIds } },
      data: { status: AssetStatus.DECOMMISSIONED },
    });
    await prisma.goldErpInventory.deleteMany({ where: { assetId: { in: sourceIds } } });
    await prisma.digitalIdentity.updateMany({
      where: { assetId: { in: sourceIds } },
      data: { isActive: false },
    });

    // سجل التدقيق
    await prisma.auditLog.create({
      data: {
        userId: (req as any).userId,
        action: 'ASSETS_MERGED',
        entityType: 'GoldAsset',
        entityId: bundle.asset.id,
        description: `Merged ${assets.length} assets into ${goldId}`,
        oldValues: { sourceGoldIds: assets.map((a) => a.goldId), totalWeight: weightGross },
        newValues: { goldId, weightGross, serialNumber },
        severity: 'WARNING',
        category: 'OPERATION',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info('Assets merged', {
      sourceCount: assets.length,
      mergedInto: goldId,
      totalWeight: weightGross,
      by: (req as any).userId,
    });

    res.status(201).json({
      success: true,
      data: {
        operation: 'MERGE',
        assetsCreated: 1,
        assetsConsumed: assets.length,
        totalWeightGross: weightGross,
        totalWeightNet: weightNet,
        mergedAsset: {
          assetId: bundle.asset.id,
          goldId,
          serialNumber,
          metalType,
          karat,
          weightGross,
          weightNet,
          measuredPurity,
          status: AssetStatus.CERTIFIED,
          passportNumber: bundle.passportNumber,
        },
        sourceGoldIds: assets.map((a) => a.goldId),
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('Merge assets failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'MERGE_FAILED', message: getLocalizedError('internal_error', lang) },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// POST /api/v1/assets/:asset_id/split — تقسيم أصل واحد إلى عدة أصول
// ============================================================================

export async function splitAsset(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const { asset_id } = req.params;
    const body = (req as any).validatedData;
    const { splits, reason } = body;

    const source = await prisma.goldAsset.findUnique({
      where: { id: asset_id },
      include: {
        erpInventory: { select: { warehouseId: true } },
        originEntity: { select: { id: true } },
      },
    });

    if (!source) {
      res.status(404).json({
        success: false,
        error: { code: 'ASSET_NOT_FOUND', message: getLocalizedError('asset_not_found', lang) },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    if (OUTFLOW_STATUSES.includes(source.status)) {
      res.status(400).json({
        success: false,
        error: { code: 'NON_SPLITTABLE_ASSET', message: `${source.status} assets cannot be split` },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    const sourceGross = Number(source.weightGross);
    const splitSum = splits.reduce((s: number, sp: any) => s + Number(sp.weightGross), 0);

    if (splitSum > sourceGross + 0.5) {
      res.status(400).json({
        success: false,
        error: {
          code: 'WEIGHT_EXCEEDS_SOURCE',
          message: `Sum of split weights (${splitSum}g) exceeds source weight (${sourceGross}g)`,
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    const karat = source.karat;
    const measuredPurity = source.measuredPurity
      ? Number(source.measuredPurity)
      : karat
      ? (karat / 24) * 100
      : null;
    const warehouseId = source.erpInventory?.warehouseId || (await getDefaultWarehouseId());

    const [cocFromId, cocToId] = await getReconciliationEntities();

    const created: any[] = [];

    for (const sp of splits) {
      const goldId = generateGoldId();
      const splitSerial =
        sp.serialNumber ||
        `SPL-${Date.now().toString(36).toUpperCase()}-${goldId.split('-')[1]}${Math.floor(Math.random() * 99)}`;

      const names = sp.nameTranslations || {
        ar: goldId,
        fr: goldId,
        en: goldId,
      };

      const bundle = await createAssetBundle({
        goldId,
        serialNumber: splitSerial,
        productType: source.productType,
        metalType: source.metalType,
        karat,
        weightGross: Number(sp.weightGross),
        weightNet: Number(sp.weightNet ?? sp.weightGross),
        measuredPurity,
        originEntityId: source.originEntityId || source.originEntity?.id || null,
        nameTranslations: names,
        descriptionTranslations: sp.descriptionTranslations,
        status: AssetStatus.CERTIFIED,
        warehouseId,
        custodianId: (req as any).userId,
        currency,
        cocFromEntityId: cocFromId,
        cocToEntityId: cocToId,
        cocNotes: `Split from ${source.goldId}${reason ? ` — ${reason}` : ''}`,
        action: 'SPLIT',
        sourceGoldIds: [source.goldId],
      });

      created.push({
        assetId: bundle.asset.id,
        goldId,
        serialNumber: splitSerial,
        weightGross: Number(sp.weightGross),
        weightNet: Number(sp.weightNet ?? sp.weightGross),
        passportNumber: bundle.passportNumber,
      });
    }

    // إغلاق الأصل المصدر
    await prisma.chainOfCustody.create({
      data: {
        custodyId: `COC-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 999)}`,
        assetId: source.id,
        fromEntityId: source.originEntityId || source.originEntity?.id || cocFromId,
        toEntityId: cocToId,
        transferType: 'DISPOSAL',
        requiresDualAuth: false,
        initiatedBy: (req as any).userId,
        approvedBy: (req as any).userId,
        handoverNotes: `Split into ${created.map((c) => c.goldId).join(', ')}${reason ? ` — ${reason}` : ''}`,
        status: 'COMPLETED',
      },
    });

    await prisma.goldAsset.update({
      where: { id: source.id },
      data: { status: AssetStatus.DECOMMISSIONED },
    });
    await prisma.goldErpInventory.deleteMany({ where: { assetId: source.id } });
    await prisma.digitalIdentity.updateMany({
      where: { assetId: source.id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: (req as any).userId,
        action: 'ASSET_SPLIT',
        entityType: 'GoldAsset',
        entityId: source.id,
        description: `Split ${source.goldId} (${sourceGross}g) into ${created.length} assets`,
        oldValues: { goldId: source.goldId, weightGross: sourceGross },
        newValues: { created: created.map((c) => ({ goldId: c.goldId, weightGross: c.weightGross })) },
        severity: 'WARNING',
        category: 'OPERATION',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info('Asset split', {
      sourceGoldId: source.goldId,
      intoCount: created.length,
      totalWeight: splitSum,
      by: (req as any).userId,
    });

    res.status(201).json({
      success: true,
      data: {
        operation: 'SPLIT',
        source: { assetId: source.id, goldId: source.goldId, weightGross: sourceGross },
        assetsCreated: created.length,
        sumWeightsGross: splitSum,
        createdAssets: created,
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('Split asset failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'SPLIT_FAILED', message: getLocalizedError('internal_error', lang) },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}
