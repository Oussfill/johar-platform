// ============================================================================
// JOHAR — SUPPLIER CONTROLLER (المعمارية §4: إدارة الموردين)
// ============================================================================
// سلسلة مشتريات نقية: كل عملية تعبر authz() وتُدوَّن. التقييم (supplier:evaluate)
// عمل مسؤول عالي (Tier 3) ولا يملكه PROCUREMENT (فصل مهام).

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { getActiveMembership, nextNumber, writeErpAudit } from '../services/erp/ErpHelpers';

const ALLOWED_SUPPLIER_FIELDS = [
  'legalName', 'tradeName', 'category', 'country',
  'contactInfo', 'vatNumber', 'paymentTerms', 'documents',
];

function sanitizeSupplierBody(body: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const key of ALLOWED_SUPPLIER_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

/// POST /api/v1/erp/suppliers — تسجيل مورد (supplier:create)
export async function createSupplier(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? '');
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const body = sanitizeSupplierBody(req.body);
    if (!body.legalName || typeof body.legalName !== 'string') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'legalName is required' } });
    }
    const code = await nextNumber('supplier', orgId);
    const supplier = await prisma.supplier.create({
      data: {
        orgId,
        code,
        status: 'ACTIVE',
        createdById: userId,
        ...(body as any),
        contactInfo: (body.contactInfo as Prisma.InputJsonValue) ?? undefined,
        documents: (body.documents as Prisma.InputJsonValue) ?? undefined,
      },
    });
    await writeErpAudit({
      userId, action: 'ERP_SUPPLIER_CREATE', entityType: 'Supplier', entityId: supplier.id,
      description: `Registered supplier ${supplier.code} — ${supplier.legalName}`,
      newValues: { code: supplier.code, legalName: supplier.legalName }, req,
    });
    return res.status(201).json({ success: true, data: supplier });
  } catch (error: any) {
    logger.error('createSupplier failed', { error: error.message, userId });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// GET /api/v1/erp/suppliers?orgId=&status= — قائمة الموردين (supplier:read)
export async function listSuppliers(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.query.orgId ?? '');
  const status = String(req.query.status ?? '');
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const suppliers = await prisma.supplier.findMany({
      where: { orgId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: suppliers });
  } catch (error: any) {
    logger.error('listSuppliers failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// GET /api/v1/erp/suppliers/:id — مورد واحد (supplier:read)
export async function getSupplier(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.query.orgId ?? req.body.orgId ?? '');
  const id = req.params.id;
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const supplier = await prisma.supplier.findFirst({ where: { id, orgId } });
    if (!supplier) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
    }
    return res.json({ success: true, data: supplier });
  } catch (error: any) {
    logger.error('getSupplier failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// PATCH /api/v1/erp/suppliers/:id — تحديث بيانات المورد (supplier:update)
export async function updateSupplier(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? req.query.orgId ?? '');
  const id = req.params.id;
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const existing = await prisma.supplier.findFirst({ where: { id, orgId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
    }
    const body = sanitizeSupplierBody(req.body);
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(body as any),
        contactInfo: body.contactInfo !== undefined ? (body.contactInfo as Prisma.InputJsonValue) : undefined,
        documents: body.documents !== undefined ? (body.documents as Prisma.InputJsonValue) : undefined,
      },
    });
    await writeErpAudit({
      userId, action: 'ERP_SUPPLIER_UPDATE', entityType: 'Supplier', entityId: supplier.id,
      description: `Updated supplier ${supplier.code}`,
      oldValues: { legalName: existing.legalName }, newValues: { legalName: supplier.legalName }, req,
    });
    return res.json({ success: true, data: supplier });
  } catch (error: any) {
    logger.error('updateSupplier failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/erp/suppliers/:id/evaluate — تقييم/حظر مورد (supplier:evaluate, Tier 3)
export async function evaluateSupplier(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? req.query.orgId ?? '');
  const id = req.params.id;
  const rating = Number(req.body.rating);
  const status = String(req.body.status ?? '');
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const existing = await prisma.supplier.findFirst({ where: { id, orgId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
    }
    if (status && !['ACTIVE', 'PAUSED', 'BLACKLISTED'].includes(status)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Invalid supplier status' } });
    }
    const data: Record<string, unknown> = {};
    if (Number.isFinite(rating)) data.rating = rating;
    if (status) data.status = status;
    const supplier = await prisma.supplier.update({ where: { id }, data: data as any });
    await writeErpAudit({
      userId, action: 'ERP_SUPPLIER_EVALUATE', entityType: 'Supplier', entityId: supplier.id,
      description: `Evaluated supplier ${supplier.code} — rating=${rating ?? existing.rating} status=${supplier.status}`,
      oldValues: { rating: existing.rating, status: existing.status }, newValues: { rating: supplier.rating, status: supplier.status }, req,
      severity: status === 'BLACKLISTED' ? 'CRITICAL' : 'INFO',
    });
    return res.json({ success: true, data: supplier });
  } catch (error: any) {
    logger.error('evaluateSupplier failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}