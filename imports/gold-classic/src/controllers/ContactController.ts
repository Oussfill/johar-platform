import { Request, Response } from 'express';
import { Language } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

export const submitInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, product, message } = req.body;
    const lang = ((req as any).preferredLanguage as Language) || Language.EN;

    if (!name || !email) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Name and email are required' },
      });
      return;
    }

    await prisma.contactMessage.create({
      data: {
        name: String(name).slice(0, 150),
        email: String(email).trim().toLowerCase().slice(0, 255),
        product: product ? String(product).slice(0, 300) : null,
        message: message ? String(message).slice(0, 5000) : null,
        language: lang,
        status: 'NEW',
      },
    });

    logger.info('Public product inquiry stored', { name, email, product });

    res.status(200).json({
      success: true,
      data: { received: true },
      meta: { language: lang, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('Failed to process inquiry', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL', message: 'Failed to process inquiry' },
    });
  }
};

export const listInquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
    const status = (req.query.status as string) || undefined;
    const where = status ? { status } : {};
    const [rows, total] = await Promise.all([
      prisma.contactMessage.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.contactMessage.count({ where }),
    ]);
    res.json({
      success: true,
      data: { items: rows, pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total } },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('List inquiries failed', { error });
    res.status(500).json({ success: false, error: { code: 'LIST_FAILED', message: 'Failed to list inquiries' } });
  }
};

export const updateInquiryStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!['NEW', 'READ', 'CLOSED'].includes(String(status || ''))) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Status must be NEW, READ or CLOSED' },
      });
      return;
    }
    const msg = await prisma.contactMessage.update({ where: { id }, data: { status } });
    res.json({ success: true, data: { id: msg.id, status: msg.status } });
  } catch (error) {
    logger.error('Update inquiry status failed', { error });
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Message not found' } });
  }
};