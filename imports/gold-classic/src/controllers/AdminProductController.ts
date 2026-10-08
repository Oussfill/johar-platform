import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { isValidUuid } from '../utils/guards';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const lang = (req.query.lang as string) || 'EN';
    const currency = (req.query.currency as string) || 'USD';

    const items = await prisma.marketplaceItem.findMany({
      include: {
        asset: {
          select: {
            goldId: true,
            metalType: true,
            karat: true,
            weightGross: true,
            productType: true,
            nameTranslations: true,
          },
        },
        sellerEntity: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = items.map((item) => ({
      id: item.id,
      listingId: item.listingId,
      title: (item.titleTranslations as any)?.[lang.toLowerCase()] || (item.titleTranslations as any)?.en || 'Product',
      description: (item.descriptionTranslations as any)?.[lang.toLowerCase()] || (item.descriptionTranslations as any)?.en || '',
      asset: {
        goldId: item.asset?.goldId || '',
        metalType: item.asset?.metalType || 'GOLD',
        karat: item.asset?.karat || 0,
        weightGross: item.asset?.weightGross || 0,
        productType: item.asset?.productType || 'BAR',
        name: (item.asset?.nameTranslations as any)?.[lang.toLowerCase()] || (item.asset?.nameTranslations as any)?.en || '',
      },
      pricing: {
        basePrice: item.basePrice,
        finalPrice: item.finalPrice,
        currency: item.priceCurrency,
      },
      seller: {
        name: item.sellerEntity?.name || 'Unknown',
      },
      status: item.status,
      condition: item.condition,
      authenticityGuaranteed: item.authenticityGuaranteed,
      viewCount: item.viewCount,
      favoriteCount: item.favoriteCount,
      inquiryCount: item.inquiryCount,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    res.json({
      success: true,
      data: { items: formatted, total: formatted.length },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('Failed to get admin products', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL', message: 'Failed to fetch products' },
    });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, metalType, karat, weightGross, price, currency, condition, imageUrl } = req.body;
    const lang = (req.query.lang as string) || 'EN';

    // Find or create a gold asset
    const goldId = `GOLD-${Date.now().toString(36).toUpperCase()}`;
    const asset = await prisma.goldAsset.create({
      data: {
        goldId,
        serialNumber: `SN-${Date.now().toString(36).toUpperCase()}`,
        productType: 'BAR',
        metalType: metalType || 'GOLD',
        karat: karat || 24,
        weightGross: weightGross || 0,
        weightNet: weightGross || 0,
        measuredPurity: metalType === 'GOLD' ? (karat / 24) * 100 : 99.99,
        status: 'CERTIFIED',
        nameTranslations: { en: title, ar: title, fr: title },
        descriptionTranslations: { en: description, ar: description, fr: description },
      },
    });

    // Find seller entity (refinery)
    const seller = await prisma.externalEntity.findFirst({
      where: { entityType: 'REFINERY', isActive: true },
    });

    const listingId = `ML-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const basePrice = parseFloat(price) || 0;
    const finalPrice = basePrice * 1.05;

    const item = await prisma.marketplaceItem.create({
      data: {
        listingId,
        assetId: asset.id,
        sellerEntityId: seller?.id || '',
        listingType: 'FIXED_PRICE',
        visibility: 'PUBLIC',
        basePrice,
        priceCurrency: currency || 'USD',
        metalValue: basePrice * 0.85,
        manufacturingValue: basePrice * 0.05,
        gemstoneValue: 0,
        certificationValue: basePrice * 0.02,
        insuranceValue: basePrice * 0.01,
        logisticsValue: basePrice * 0.02,
        marketplaceFee: basePrice * 0.03,
        taxAmount: basePrice * 0.05,
        finalPrice,
        titleTranslations: { en: title, ar: title, fr: title },
        descriptionTranslations: { en: description, ar: description, fr: description },
        condition: condition || 'NEW',
        status: 'ACTIVE',
        authenticityGuaranteed: true,
      },
    });

    logger.info('Admin created product', { listingId, title });

    res.json({
      success: true,
      data: { item },
      meta: { language: lang, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('Failed to create product', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL', message: 'Failed to create product' },
    });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, metalType, karat, weightGross, price, currency, condition, imageUrl } = req.body;
    const lang = (req.query.lang as string) || 'EN';

    if (!isValidUuid(id)) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
      return;
    }

    const item = await prisma.marketplaceItem.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!item) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
      return;
    }

    const basePrice: number = parseFloat(price) || Number(item.basePrice) || 0;
    const finalPrice = basePrice * 1.05;

    await prisma.marketplaceItem.update({
      where: { id },
      data: {
        basePrice,
        priceCurrency: currency || item.priceCurrency,
        finalPrice,
        titleTranslations: { en: title, ar: title, fr: title },
        descriptionTranslations: { en: description, ar: description, fr: description },
        condition: condition || item.condition,
        metalValue: basePrice * 0.85,
        manufacturingValue: basePrice * 0.05,
        gemstoneValue: 0,
        certificationValue: basePrice * 0.02,
        insuranceValue: basePrice * 0.01,
        logisticsValue: basePrice * 0.02,
        marketplaceFee: basePrice * 0.03,
        taxAmount: basePrice * 0.05,
      },
    });

    if (item.assetId) {
      await prisma.goldAsset.update({
        where: { id: item.assetId },
        data: {
          metalType: metalType || 'GOLD',
          karat: karat || 24,
          weightGross: weightGross || 0,
          weightNet: weightGross || 0,
          nameTranslations: { en: title, ar: title, fr: title },
          descriptionTranslations: { en: description, ar: description, fr: description },
        },
      });
    }

    logger.info('Admin updated product', { id });

    res.json({
      success: true,
      data: { updated: true },
      meta: { language: lang, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('Failed to update product', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL', message: 'Failed to update product' },
    });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const lang = (req.query.lang as string) || 'EN';

    if (!isValidUuid(id)) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
      return;
    }

    const item = await prisma.marketplaceItem.findUnique({
      where: { id },
    });

    if (!item) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
      return;
    }

    await prisma.marketplaceItem.delete({
      where: { id },
    });

    logger.info('Admin deleted product', { id });

    res.json({
      success: true,
      data: { deleted: true },
      meta: { language: lang, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('Failed to delete product', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL', message: 'Failed to delete product' },
    });
  }
};

export const getInquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    const lang = (req.query.lang as string) || 'EN';
    const currency = (req.query.currency as string) || 'USD';

    // For now, return mock data since we don't have a dedicated inquiry table yet
    // In production, this would read from a ContactInquiry model
    const mockInquiries = [
      {
        id: 'inq-1',
        name: 'Ahmed Benali',
        email: 'ahmed@example.com',
        product: '1 kg Gold Bar',
        message: 'I am interested in purchasing the 1 kg gold bar. Please send me more details about certification and delivery.',
        status: 'NEW',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'inq-2',
        name: 'Fatima Zohra',
        email: 'fatima@example.com',
        product: '500g Gold Bar',
        message: 'Do you offer financing options for bulk purchases? I need 5 bars of 500g.',
        status: 'READ',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'inq-3',
        name: 'Yacine M.',
        email: 'yacine@example.com',
        product: '1/2 oz Gold Coin',
        message: 'Is this coin available for immediate delivery to Algiers? What is the shipping cost?',
        status: 'NEW',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'inq-4',
        name: 'Samira K.',
        email: 'samira@example.com',
        product: '1 kg Silver Bar',
        message: 'I am looking for investment-grade silver. Do you have a buyback program?',
        status: 'NEW',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'inq-5',
        name: 'Mohamed L.',
        email: 'mohamed@example.com',
        product: '100g Platinum Bar',
        message: 'Please provide the assay certificate for the platinum bar. Also interested in your pricing for 10 units.',
        status: 'READ',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
    ];

    res.json({
      success: true,
      data: { items: mockInquiries, total: mockInquiries.length },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('Failed to get inquiries', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL', message: 'Failed to fetch inquiries' },
    });
  }
};