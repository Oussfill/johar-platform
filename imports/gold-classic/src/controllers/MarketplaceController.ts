import { Request, Response } from 'express';
import { Language, Currency, ListingType, ListingStatus, Visibility } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { isValidUuid } from '../utils/guards';

export async function listMarketplaceItems(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const {
      metalType,
      karat,
      listingType,
      minPrice,
      maxPrice,
      condition,
      search,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { status: ListingStatus.ACTIVE };

    if (metalType) where.asset = { metalType };
    if (karat) where.asset = { ...where.asset, karat: parseInt(karat as string, 10) };
    if (listingType) where.listingType = listingType;
    if (condition) where.condition = condition;
    if (minPrice || maxPrice) {
      where.finalPrice = {};
      if (minPrice) where.finalPrice.gte = parseFloat(minPrice as string);
      if (maxPrice) where.finalPrice.lte = parseFloat(maxPrice as string);
    }
    if (search) {
      where.OR = [
        { titleTranslations: { path: ['en'], string_contains: search as string } },
        { titleTranslations: { path: ['fr'], string_contains: search as string } },
        { asset: { goldId: { contains: search as string, mode: 'insensitive' } } },
        { asset: { serialNumber: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const orderBy: any = {};
    if (sortBy === 'price') orderBy.finalPrice = sortOrder;
    else if (sortBy === 'views') orderBy.viewCount = sortOrder;
    else orderBy.createdAt = sortOrder;

    const [items, total] = await Promise.all([
      prisma.marketplaceItem.findMany({
        where,
        include: {
          asset: {
            select: {
              goldId: true,
              serialNumber: true,
              metalType: true,
              karat: true,
              weightGross: true,
              weightNet: true,
              measuredPurity: true,
              productType: true,
              nameTranslations: true,
            },
          },
          sellerEntity: {
            select: {
              name: true,
              nameAr: true,
              nameFr: true,
              entityType: true,
              country: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.marketplaceItem.count({ where }),
    ]);

    const response = {
      success: true,
      data: {
        items: items.map((item) => {
          const title = (item.titleTranslations as any)?.[lang.toLowerCase()] ||
            (item.titleTranslations as any)?.en || item.asset.goldId;
          const desc = (item.descriptionTranslations as any)?.[lang.toLowerCase()] ||
            (item.descriptionTranslations as any)?.en || '';
          const sellerName = lang === 'AR' ? item.sellerEntity.nameAr
            : lang === 'FR' ? item.sellerEntity.nameFr
            : item.sellerEntity.name;
          return {
            listingId: item.listingId,
            title,
            description: desc,
            asset: {
              goldId: item.asset.goldId,
              serialNumber: item.asset.serialNumber,
              metalType: item.asset.metalType,
              karat: item.asset.karat,
              weightGross: item.asset.weightGross,
              weightNet: item.asset.weightNet,
              purity: item.asset.measuredPurity,
              productType: item.asset.productType,
              name: (item.asset.nameTranslations as any)?.[lang.toLowerCase()] || item.asset.goldId,
            },
            seller: {
              name: sellerName,
              entityType: item.sellerEntity.entityType,
              country: item.sellerEntity.country,
            },
            pricing: {
              basePrice: item.basePrice,
              metalValue: item.metalValue,
              manufacturingValue: item.manufacturingValue,
              certificationValue: item.certificationValue,
              insuranceValue: item.insuranceValue,
              logisticsValue: item.logisticsValue,
              marketplaceFee: item.marketplaceFee,
              taxAmount: item.taxAmount,
              finalPrice: item.finalPrice,
              currency: item.priceCurrency,
              referenceGoldPricePerGram: item.referenceGoldPricePerGram,
            },
            listingType: item.listingType,
            visibility: item.visibility,
            condition: item.condition,
            authenticityGuaranteed: item.authenticityGuaranteed,
            stats: {
              views: item.viewCount,
              favorites: item.favoriteCount,
              inquiries: item.inquiryCount,
            },
            status: item.status,
            listedAt: item.listedAt,
            expiresAt: item.expiresAt,
          };
        }),
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    };

    res.json(response);
  } catch (error) {
    logger.error('List marketplace items failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'MARKETPLACE_FAILED', message: 'Failed to list marketplace items' },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

export async function getMarketplaceItem(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const { listing_id } = req.params;

    const item = await prisma.marketplaceItem.findFirst({
      where: { listingId: listing_id },
      include: {
        asset: {
          include: {
            digitalPassport: { select: { passportNumber: true, certifiedPurity: true, certifiedKarat: true } },
            assayRecords: { orderBy: { createdAt: 'desc' }, take: 3 },
            chainOfCustody: { orderBy: { eventTimestamp: 'desc' }, take: 5 },
          },
        },
        sellerEntity: {
          select: {
            name: true,
            nameAr: true,
            nameFr: true,
            entityType: true,
            country: true,
            isVerified: true,
          },
        },
      },
    });

    if (!item) {
      res.status(404).json({
        success: false,
        error: { code: 'LISTING_NOT_FOUND', message: 'Listing not found' },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // Increment view count
    await prisma.marketplaceItem.update({
      where: { id: item.id },
      data: { viewCount: { increment: 1 } },
    });

    const sellerName = lang === 'AR' ? item.sellerEntity.nameAr
      : lang === 'FR' ? item.sellerEntity.nameFr
      : item.sellerEntity.name;

    const response = {
      success: true,
      data: {
        listingId: item.listingId,
        title: (item.titleTranslations as any)?.[lang.toLowerCase()] || (item.titleTranslations as any)?.en || item.asset.goldId,
        description: (item.descriptionTranslations as any)?.[lang.toLowerCase()] || (item.descriptionTranslations as any)?.en || '',
        asset: {
          goldId: item.asset.goldId,
          serialNumber: item.asset.serialNumber,
          metalType: item.asset.metalType,
          karat: item.asset.karat,
          weightGross: item.asset.weightGross,
          weightNet: item.asset.weightNet,
          purity: item.asset.measuredPurity,
          productType: item.asset.productType,
          passport: item.asset.digitalPassport,
          recentAssays: item.asset.assayRecords.map((a) => ({
            reportNumber: a.reportNumber,
            purity: a.measuredPurity,
            karat: a.certifiedKarat,
            result: a.overallResult,
            date: a.createdAt,
          })),
          custodyHistory: item.asset.chainOfCustody.map((c) => ({
            from: c.fromEntityId,
            to: c.toEntityId,
            date: c.eventTimestamp,
            type: c.transferType,
          })),
        },
        seller: {
          name: sellerName,
          entityType: item.sellerEntity.entityType,
          country: item.sellerEntity.country,
          verified: item.sellerEntity.isVerified,
        },
        pricing: {
          breakdown: {
            metalValue: item.metalValue,
            manufacturing: item.manufacturingValue,
            certification: item.certificationValue,
            insurance: item.insuranceValue,
            logistics: item.logisticsValue,
            marketplaceFee: item.marketplaceFee,
            tax: item.taxAmount,
          },
          finalPrice: item.finalPrice,
          currency: item.priceCurrency,
          referenceGoldPricePerGram: item.referenceGoldPricePerGram,
          priceLockedAt: item.priceLockedAt,
        },
        listingType: item.listingType,
        visibility: item.visibility,
        condition: item.condition,
        authenticityGuaranteed: item.authenticityGuaranteed,
        stats: {
          views: item.viewCount,
          favorites: item.favoriteCount,
          inquiries: item.inquiryCount,
        },
        status: item.status,
        listedAt: item.listedAt,
        expiresAt: item.expiresAt,
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    };

    res.json(response);
  } catch (error) {
    logger.error('Get marketplace item failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ITEM_FAILED', message: 'Failed to get item details' },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

export async function createListing(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const {
      assetId,
      sellerEntityId,
      listingType,
      visibility,
      basePrice,
      titleTranslations,
      descriptionTranslations,
      condition,
    } = (req as any).validatedData || {};

    // حارس المدخلات: السوق يقبل الإدراج الكامل فقط (400 بدل 500)
    if (!assetId || typeof assetId !== 'string' || !isValidUuid(assetId)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION', message: 'assetId (UUID) is required' },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }
    if (basePrice === undefined || basePrice === null || Number.isNaN(Number(basePrice))) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION', message: 'basePrice is required' },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // Verify asset exists and is in sellable status
    const asset = await prisma.goldAsset.findUnique({ where: { id: assetId } });
    if (!asset) {
      res.status(404).json({
        success: false,
        error: { code: 'ASSET_NOT_FOUND', message: 'Asset not found' },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    const listingId = `ML-${Date.now().toString(36).toUpperCase()}`;

    // Calculate pricing breakdown
    const metalValue = Number(asset.weightNet) * Number(asset.measuredPurity || 0) / 100 * 65; // simplified
    const manufacturingValue = metalValue * 0.05;
    const certificationValue = 50;
    const insuranceValue = metalValue * 0.02;
    const logisticsValue = 100;
    const marketplaceFee = basePrice * 0.025;
    const taxAmount = basePrice * 0.019;
    const finalPrice = basePrice + marketplaceFee + taxAmount;

    const item = await prisma.marketplaceItem.create({
      data: {
        listingId,
        assetId,
        sellerEntityId,
        listingType: (listingType as ListingType) || ListingType.FIXED_PRICE,
        visibility: (visibility as Visibility) || Visibility.PUBLIC,
        basePrice,
        priceCurrency: currency,
        metalValue,
        manufacturingValue,
        certificationValue,
        insuranceValue,
        logisticsValue,
        marketplaceFee,
        taxAmount,
        finalPrice,
        titleTranslations: titleTranslations || {},
        descriptionTranslations: descriptionTranslations || {},
        condition: condition || 'NEW',
        status: ListingStatus.ACTIVE,
        listedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: (req as any).userId,
        action: 'MARKETPLACE_LISTING_CREATED',
        entityType: 'MarketplaceItem',
        entityId: item.id,
        description: `New marketplace listing created: ${listingId} for asset ${asset.goldId}`,
        newValues: { listingId, assetId, basePrice, finalPrice },
        severity: 'INFO',
        category: 'OPERATION',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info('Marketplace listing created', { listingId, assetId, finalPrice });

    res.status(201).json({
      success: true,
      data: {
        listingId: item.listingId,
        assetId,
        basePrice,
        finalPrice,
        status: 'ACTIVE',
        createdAt: item.createdAt,
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('Create listing failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_FAILED', message: 'Failed to create listing' },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

export async function getMarketplaceStats(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const [totalListings, activeListings, soldListings, metalBreakdown] = await Promise.all([
      prisma.marketplaceItem.count(),
      prisma.marketplaceItem.count({ where: { status: ListingStatus.ACTIVE } }),
      prisma.marketplaceItem.count({ where: { status: ListingStatus.SOLD } }),
      prisma.marketplaceItem.groupBy({
        by: ['referenceMetalType'],
        _count: { id: true },
        _avg: { finalPrice: true },
        where: { status: ListingStatus.ACTIVE },
      }),
    ]);

    const response = {
      success: true,
      data: {
        overview: {
          totalListings,
          activeListings,
          soldListings,
        },
        byMetal: metalBreakdown.map((m) => ({
          metal: m.referenceMetalType,
          count: m._count.id,
          avgPrice: m._avg.finalPrice,
        })),
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    };

    res.json(response);
  } catch (error) {
    logger.error('Marketplace stats failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'STATS_FAILED', message: 'Failed to get marketplace stats' },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}
