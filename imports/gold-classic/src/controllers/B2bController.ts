import { Request, Response } from 'express';
import { Language, EntityType } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { isValidUuid } from '../utils/guards';

// ============================================================================
// GOLD PLATFORM — PUBLIC & B2B SERVICES CONTROLLER
// Newsletter | Articles (Blog/Academy) | Exhibitors | Buyer Program | Contact
// ============================================================================

const DEFAULT_LANGS = ['en', 'ar', 'fr'] as const;

function langOf(req: Request): Language {
  return ((req as any).preferredLanguage as Language) || Language.EN;
}

function pickLocalized(o: any, lang: string): string {
  if (!o) return '';
  if (typeof o === 'string') return o;
  const l = lang.toLowerCase();
  return o[l] || o.en || o.ar || o.fr || '';
}

function slugify(s: string): string {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function emailValid(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function meta(lang: Language) {
  return { language: lang, timestamp: new Date().toISOString() };
}

function fail(res: Response, code: string, message: string, status = 400, m: any = null) {
  res.status(status).json({ success: false, error: { code, message }, meta: m || meta(Language.EN) });
}

// ============================================================================
// NEWSLETTER
// ============================================================================

export async function subscribeNewsletter(req: Request, res: Response): Promise<void> {
  const lang = langOf(req);
  try {
    const { email, name } = req.body || {};
    const emailNorm = String(email || '').trim().toLowerCase();
    if (!emailValid(emailNorm)) {
      fail(res, 'INVALID_EMAIL', 'A valid email address is required', 400, meta(lang));
      return;
    }

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: emailNorm } });
    if (existing) {
      if (existing.status !== 'ACTIVE') {
        await prisma.newsletterSubscriber.update({
          where: { id: existing.id },
          data: { status: 'ACTIVE', name: name || existing.name, language: lang },
        });
      }
      res.json({ success: true, data: { alreadySubscribed: true }, meta: meta(lang) });
      return;
    }

    await prisma.newsletterSubscriber.create({
      data: { email: emailNorm, name: name || null, language: lang, status: 'ACTIVE' },
    });
    logger.info('Newsletter subscription created', { email: emailNorm });
    res.status(201).json({ success: true, data: { subscribed: true }, meta: meta(lang) });
  } catch (error) {
    logger.error('Newsletter subscribe failed', { error });
    res.status(500).json({ success: false, error: { code: 'SUBSCRIBE_FAILED', message: 'Failed to subscribe' }, meta: meta(lang) });
  }
}

export async function unsubscribeNewsletter(req: Request, res: Response): Promise<void> {
  const lang = langOf(req);
  try {
    const { email } = req.body || {};
    const emailNorm = String(email || '').trim().toLowerCase();
    if (!emailValid(emailNorm)) {
      fail(res, 'INVALID_EMAIL', 'A valid email address is required', 400, meta(lang));
      return;
    }
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: emailNorm } });
    if (!existing) {
      res.json({ success: true, data: { unsubscribed: true } });
      return;
    }
    await prisma.newsletterSubscriber.update({
      where: { id: existing.id },
      data: { status: 'UNSUBSCRIBED' },
    });
    logger.info('Newsletter subscription removed', { email: emailNorm });
    res.json({ success: true, data: { unsubscribed: true }, meta: meta(lang) });
  } catch (error) {
    logger.error('Newsletter unsubscribe failed', { error });
    res.status(500).json({ success: false, error: { code: 'UNSUBSCRIBE_FAILED', message: 'Failed to unsubscribe' }, meta: meta(lang) });
  }
}

export async function listNewsletter(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
    const status = req.query.status as string | undefined;
    const where = status ? { status } : {};
    const [rows, total] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.newsletterSubscriber.count({ where }),
    ]);
    res.json({
      success: true,
      data: { items: rows, pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total } },
      meta: meta(Language.EN),
    });
  } catch (error) {
    logger.error('List newsletter failed', { error });
    res.status(500).json({ success: false, error: { code: 'NEWSLETTER_LIST_FAILED', message: 'Failed to list subscribers' } });
  }
}

export async function deleteNewsletter(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.newsletterSubscriber.delete({ where: { id } });
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    logger.error('Delete newsletter failed', { error });
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Subscriber not found' } });
  }
}

// ============================================================================
// ARTICLES — BLOG / NEWS / ACADEMY / WORKSHOP
// ============================================================================

export async function listArticles(req: Request, res: Response): Promise<void> {
  const lang = langOf(req);
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 12, 50);
    const type = (req.query.type as string) || undefined;
    const where: any = { status: 'PUBLISHED' };
    if (type) where.type = type;

    const [rows, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          type: true,
          title: true,
          excerpt: true,
          imageUrl: true,
          author: true,
          publishedAt: true,
        },
      }),
      prisma.article.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: rows.map((a) => ({
          id: a.id,
          slug: a.slug,
          type: a.type,
          title: pickLocalized(a.title, lang),
          excerpt: pickLocalized(a.excerpt, lang),
          imageUrl: a.imageUrl,
          author: a.author,
          publishedAt: a.publishedAt,
        })),
        pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total },
      },
      meta: meta(lang),
    });
  } catch (error) {
    logger.error('List articles failed', { error });
    res.status(500).json({ success: false, error: { code: 'ARTICLES_FAILED', message: 'Failed to list articles' }, meta: meta(lang) });
  }
}

export async function getArticleBySlug(req: Request, res: Response): Promise<void> {
  const lang = langOf(req);
  try {
    const { slug } = req.params;
    const article = await prisma.article.findFirst({ where: { slug, status: 'PUBLISHED' } });
    if (!article) {
      fail(res, 'ARTICLE_NOT_FOUND', 'Article not found', 404, meta(lang));
      return;
    }
    res.json({
      success: true,
      data: {
        id: article.id,
        slug: article.slug,
        type: article.type,
        title: pickLocalized(article.title, lang),
        excerpt: pickLocalized(article.excerpt, lang),
        content: pickLocalized(article.content, lang),
        imageUrl: article.imageUrl,
        author: article.author,
        publishedAt: article.publishedAt,
      },
      meta: meta(lang),
    });
  } catch (error) {
    logger.error('Get article failed', { error });
    res.status(500).json({ success: false, error: { code: 'ARTICLE_FAILED', message: 'Failed to get article' }, meta: meta(lang) });
  }
}

export async function adminListArticles(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
    const [rows, total] = await Promise.all([
      prisma.article.findMany({ orderBy: { updatedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.article.count(),
    ]);
    res.json({
      success: true,
      data: {
        items: rows.map((a) => ({
          id: a.id,
          slug: a.slug,
          type: a.type,
          title: a.title,
          status: a.status,
          author: a.author,
          publishedAt: a.publishedAt,
          updatedAt: a.updatedAt,
        })),
        pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total },
      },
      meta: meta(Language.EN),
    });
  } catch (error) {
    logger.error('Admin list articles failed', { error });
    res.status(500).json({ success: false, error: { code: 'ARTICLES_FAILED', message: 'Failed to list articles' } });
  }
}

export async function createArticle(req: Request, res: Response): Promise<void> {
  try {
    const b = req.body || {};
    const title = b.title && typeof b.title === 'object' ? b.title : { en: String(b.title || '') };
    const slug = b.slug || slugify(title.en || title.ar || '');
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (existing) {
      fail(res, 'SLUG_EXISTS', 'An article with this slug already exists', 409);
      return;
    }
    const article = await prisma.article.create({
      data: {
        slug,
        type: String(b.type || 'BLOG').toUpperCase().slice(0, 20),
        title,
        excerpt: b.excerpt || null,
        content: b.content || { en: '' },
        imageUrl: b.imageUrl || null,
        author: b.author || null,
        status: String(b.status || 'DRAFT').toUpperCase().slice(0, 20),
        publishedAt: b.status === 'PUBLISHED' ? new Date() : undefined,
      },
    });
    logger.info('Article created', { slug, id: article.id, userId: (req as any).userId });
    res.status(201).json({ success: true, data: { id: article.id, slug: article.slug, status: article.status } });
  } catch (error) {
    logger.error('Create article failed', { error });
    res.status(500).json({ success: false, error: { code: 'CREATE_FAILED', message: 'Failed to create article' } });
  }
}

export async function updateArticle(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) { fail(res, 'ARTICLE_NOT_FOUND', 'Article not found', 404); return; }
    const b = req.body || {};
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) {
      fail(res, 'ARTICLE_NOT_FOUND', 'Article not found', 404);
      return;
    }
    const data: any = {};
    if (b.title !== undefined) data.title = b.title;
    if (b.excerpt !== undefined) data.excerpt = b.excerpt;
    if (b.content !== undefined) data.content = b.content;
    if (b.imageUrl !== undefined) data.imageUrl = b.imageUrl;
    if (b.author !== undefined) data.author = b.author;
    if (b.type !== undefined) data.type = String(b.type).toUpperCase().slice(0, 20);
    if (b.slug !== undefined) data.slug = slugify(b.slug);
    if (b.status !== undefined) {
      data.status = String(b.status).toUpperCase().slice(0, 20);
      if (data.status === 'PUBLISHED' && article.status !== 'PUBLISHED') data.publishedAt = new Date();
    }
    const updated = await prisma.article.update({ where: { id }, data });
    res.json({ success: true, data: { id: updated.id, slug: updated.slug, status: updated.status } });
  } catch (error) {
    logger.error('Update article failed', { error });
    res.status(500).json({ success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update article' } });
  }
}

export async function deleteArticle(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } }); return; }
    await prisma.article.delete({ where: { id } });
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    logger.error('Delete article failed', { error });
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } });
  }
}

// ============================================================================
// EXHIBITORS — DIRECTOR OF VERIFIED SELLERS
// ============================================================================

const EXHIBITOR_TYPES: EntityType[] = ['JEWELLERY_MANUFACTURER', 'RETAILER', 'REFINERY', 'MINT'];

export async function listExhibitors(req: Request, res: Response): Promise<void> {
  const lang = langOf(req);
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const search = (req.query.search as string) || undefined;

    const where: any = { isActive: true, entityType: { in: EXHIBITOR_TYPES } };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [rows, total, listingCounts] = await Promise.all([
      prisma.externalEntity.findMany({
        where,
        orderBy: [{ isVerified: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          entityCode: true,
          entityType: true,
          name: true,
          nameAr: true,
          nameFr: true,
          country: true,
          city: true,
          contactEmail: true,
          contactPhone: true,
          isVerified: true,
          verificationDate: true,
          createdAt: true,
        },
      }),
      prisma.externalEntity.count({ where }),
      prisma.marketplaceItem.groupBy({
        by: ['sellerEntityId'],
        where: { sellerEntity: { entityType: { in: EXHIBITOR_TYPES } }, status: 'ACTIVE' },
        _count: { _all: true },
      }),
    ]);

    const countBySeller: Record<string, number> = {};
    (listingCounts as any[]).forEach((g) => {
      countBySeller[g.sellerEntityId] = g._count._all;
    });

    res.json({
      success: true,
      data: {
        items: rows.map((e) => ({
          id: e.id,
          entityCode: e.entityCode,
          entityType: e.entityType,
          name: lang === 'AR' ? e.nameAr || e.name : lang === 'FR' ? e.nameFr || e.name : e.name,
          country: e.country,
          city: e.city,
          email: e.contactEmail,
          phone: e.contactPhone,
          verified: e.isVerified,
          verificationDate: e.verificationDate,
          memberSince: e.createdAt,
          activeListings: countBySeller[e.id] || 0,
        })),
        pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total },
      },
      meta: meta(lang),
    });
  } catch (error) {
    logger.error('List exhibitors failed', { error });
    res.status(500).json({ success: false, error: { code: 'EXHIBITORS_FAILED', message: 'Failed to list exhibitors' }, meta: meta(lang) });
  }
}

export async function getExhibitor(req: Request, res: Response): Promise<void> {
  const lang = langOf(req);
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) { fail(res, 'EXHIBITOR_NOT_FOUND', 'Exhibitor not found', 404, meta(lang)); return; }
    const entity = await prisma.externalEntity.findUnique({
      where: { id },
      include: {
        marketplaceItem: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 12,
          include: { asset: { select: { goldId: true, metalType: true, karat: true, weightGross: true, nameTranslations: true } } },
        },
      },
    });
    if (!entity || !EXHIBITOR_TYPES.includes(entity.entityType)) {
      fail(res, 'EXHIBITOR_NOT_FOUND', 'Exhibitor not found', 404, meta(lang));
      return;
    }
    res.json({
      success: true,
      data: {
        id: entity.id,
        entityCode: entity.entityCode,
        entityType: entity.entityType,
        name: lang === 'AR' ? entity.nameAr || entity.name : lang === 'FR' ? entity.nameFr || entity.name : entity.name,
        country: entity.country,
        city: entity.city,
        email: entity.contactEmail,
        phone: entity.contactPhone,
        verified: entity.isVerified,
        memberSince: entity.createdAt,
        featured: entity.marketplaceItem.map((item) => ({
          listingId: item.listingId,
          title: (item.titleTranslations as any)?.[lang.toLowerCase()] || (item.titleTranslations as any)?.en || item.asset.goldId,
          asset: {
            goldId: item.asset.goldId,
            metalType: item.asset.metalType,
            karat: item.asset.karat,
            weightGross: item.asset.weightGross,
            name: (item.asset.nameTranslations as any)?.[lang.toLowerCase()] || item.asset.goldId,
          },
          finalPrice: item.finalPrice,
          currency: item.priceCurrency,
        })),
      },
      meta: meta(lang),
    });
  } catch (error) {
    logger.error('Get exhibitor failed', { error });
    res.status(500).json({ success: false, error: { code: 'EXHIBITOR_FAILED', message: 'Failed to get exhibitor' }, meta: meta(lang) });
  }
}

// ============================================================================
// BUYER PROGRAM — REGISTRATION & APPROVAL WORKFLOW
// ============================================================================

export async function submitBuyerProgram(req: Request, res: Response): Promise<void> {
  const lang = langOf(req);
  try {
    const b = req.body || {};
    if (!b.companyName || !b.contactName || !b.email || !emailValid(String(b.email))) {
      fail(res, 'MISSING_FIELDS', 'companyName, contactName and a valid email are required', 400, meta(lang));
      return;
    }
    const reg = await prisma.buyerProgramRegistration.create({
      data: {
        companyName: String(b.companyName).slice(0, 255),
        contactName: String(b.contactName).slice(0, 150),
        email: String(b.email).trim().toLowerCase().slice(0, 255),
        phone: b.phone ? String(b.phone).slice(0, 50) : null,
        country: b.country ? String(b.country).slice(0, 150) : null,
        companyType: b.companyType ? String(b.companyType).slice(0, 100) : null,
        interests: b.interests || null,
        message: b.message ? String(b.message).slice(0, 5000) : null,
        status: 'PENDING',
      },
    });
    logger.info('Buyer program registration', { id: reg.id, email: reg.email });
    res.status(201).json({ success: true, data: { id: reg.id, status: reg.status }, meta: meta(lang) });
  } catch (error) {
    logger.error('Buyer program submit failed', { error });
    res.status(500).json({ success: false, error: { code: 'SUBMIT_FAILED', message: 'Failed to submit registration' }, meta: meta(lang) });
  }
}

export async function listBuyerProgram(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
    const status = (req.query.status as string) || undefined;
    const where = status ? { status } : {};
    const [rows, total] = await Promise.all([
      prisma.buyerProgramRegistration.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.buyerProgramRegistration.count({ where }),
    ]);
    res.json({
      success: true,
      data: { items: rows, pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total } },
      meta: meta(Language.EN),
    });
  } catch (error) {
    logger.error('List buyer program failed', { error });
    res.status(500).json({ success: false, error: { code: 'LIST_FAILED', message: 'Failed to list registrations' } });
  }
}

export async function updateBuyerProgramStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Registration not found' } }); return; }
    const { status } = req.body || {};
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(String(status || ''))) {
      fail(res, 'INVALID_STATUS', 'Status must be PENDING, APPROVED or REJECTED', 400);
      return;
    }
    const reg = await prisma.buyerProgramRegistration.update({ where: { id }, data: { status } });
    logger.info('Buyer program status updated', { id, status, userId: (req as any).userId });
    res.json({ success: true, data: { id: reg.id, status: reg.status } });
  } catch (error) {
    logger.error('Update buyer program status failed', { error });
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Registration not found' } });
  }
}