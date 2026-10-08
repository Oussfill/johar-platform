// ============================================================================
// JOHAR — SALES CONTROLLER (المعمارية §4: المبيعات والفوترة)
// ============================================================================
// SO: اقتباس → أمر → تحقق (فصل مهام: المُتحقِّق ≠ المُصدر) → تنفيذ → فاتورة → دفع.

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { getActiveMembership, nextNumber, writeErpAudit } from '../services/erp/ErpHelpers';

/// POST /api/v1/erp/sales/orders — إصدار أمر مبيعات (order:create)
export async function createSalesOrder(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? '');
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const customerId = String(req.body.customerId ?? '');
    const customer = await prisma.crmCustomer.findFirst({ where: { id: customerId, orgId } });
    if (!customer) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'items array is required' } });
    }
    const totalAmount = Number(req.body.totalAmount);
    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'totalAmount is required and must be >= 0' } });
    }
    const number = await nextNumber('salesOrder', orgId);
    const so = await prisma.salesOrder.create({
      data: {
        orgId, number, customerId,
        opportunityId: req.body.opportunityId ? String(req.body.opportunityId) : undefined,
        items: req.body.items as Prisma.InputJsonValue,
        totalAmount, currency: req.body.currency ?? 'USD',
        status: 'ISSUED', placedBy: userId,
        notes: req.body.notes ? String(req.body.notes) : undefined,
      },
    });
    await writeErpAudit({
      userId, action: 'ERP_SO_ISSUE', entityType: 'SalesOrder', entityId: so.id,
      description: `Issued SO ${so.number} to ${customer.name} — ${totalAmount}`,
      newValues: { number: so.number, totalAmount }, req, severity: 'WARNING',
    });
    return res.status(201).json({ success: true, data: so });
  } catch (error: any) {
    logger.error('createSalesOrder failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/erp/sales/orders/:id/verify — تحقق، فصل مهام (order:update)
export async function verifySalesOrder(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? req.query.orgId ?? '');
  const id = req.params.id;
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const so = await prisma.salesOrder.findFirst({ where: { id, orgId } });
    if (!so) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sales order not found' } });
    if (so.status !== 'ISSUED') {
      return res.status(409).json({ success: false, error: { code: 'STATUS_CONFLICT', message: 'Only ISSUED orders can be verified' } });
    }
    if (so.placedBy === userId) {
      return res.status(409).json({ success: false, error: { code: 'SOD_CONFLICT', message: 'Verifier must differ from the order placer (segregation of duties)' } });
    }
    const updated = await prisma.salesOrder.update({
      where: { id },
      data: { status: 'VERIFIED', verifiedBy: userId },
    });
    await writeErpAudit({
      userId, action: 'ERP_SO_VERIFY', entityType: 'SalesOrder', entityId: id,
      description: `SO ${so.number} verified`, oldValues: { status: 'ISSUED' }, newValues: { status: 'VERIFIED' }, req,
    });
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('verifySalesOrder failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/erp/sales/orders/:id/fulfill — تنفيذ الشحنة/التسليم (order:fulfill)
export async function fulfillSalesOrder(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? req.query.orgId ?? '');
  const id = req.params.id;
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const so = await prisma.salesOrder.findFirst({ where: { id, orgId } });
    if (!so) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sales order not found' } });
    const target = req.body.stage ? String(req.body.stage).toUpperCase() : 'FULFILLED';
    const ALLOWED_NEXT: Record<string, string[]> = {
      VERIFIED: ['FULFILLED', 'SHIPPED', 'DELIVERED'],
      FULFILLED: ['SHIPPED', 'DELIVERED'],
      SHIPPED: ['DELIVERED'],
    };
    const allowed = ALLOWED_NEXT[so.status];
    if (!allowed || !allowed.includes(target)) {
      return res.status(409).json({ success: false, error: { code: 'STATUS_CONFLICT', message: `Cannot move to ${target} from ${so.status}` } });
    }
    const updated = await prisma.salesOrder.update({
      where: { id },
      data: { status: target, fulfilledBy: target === 'FULFILLED' ? userId : so.fulfilledBy },
    });
    await writeErpAudit({
      userId, action: 'ERP_SO_FULFILL', entityType: 'SalesOrder', entityId: id,
      description: `SO ${so.number} -> ${target}`,
      oldValues: { status: so.status }, newValues: { status: target }, req,
    });
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('fulfillSalesOrder failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/erp/sales/invoices — إصدار فاتورة (finance:invoice:create) — من SO أو يدوياً
export async function createSalesInvoice(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? '');
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    let customerId = req.body.customerId ? String(req.body.customerId) : undefined;
    let items = req.body.items;
    let soSubtotal: number | undefined;
    if (req.body.salesOrderId) {
      const so = await prisma.salesOrder.findFirst({ where: { id: String(req.body.salesOrderId), orgId } });
      if (!so) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sales order not found' } });
      customerId = so.customerId;
      items = items ?? so.items;
      soSubtotal = Number(so.totalAmount);
    }
    if (!customerId) return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'customerId or salesOrderId is required' } });
    const customer = await prisma.crmCustomer.findFirst({ where: { id: customerId, orgId } });
    if (!customer) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'items array is required' } });
    }
    const subtotal = Number(req.body.subtotal ?? req.body.totalAmount ?? soSubtotal);
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'subtotal is required and must be >= 0' } });
    }
    const taxAmount = Number(req.body.taxAmount ?? 0);
    const number = await nextNumber('salesInvoice', orgId);
    const invoice = await prisma.salesInvoice.create({
      data: {
        orgId, number,
        salesOrderId: req.body.salesOrderId ? String(req.body.salesOrderId) : undefined,
        customerId,
        items: items as Prisma.InputJsonValue,
        subtotal, taxAmount, totalAmount: subtotal + taxAmount,
        currency: req.body.currency ?? 'USD',
        status: 'SENT',
        issuedAt: req.body.issuedAt ? new Date(String(req.body.issuedAt)) : new Date(),
        dueAt: req.body.dueAt ? new Date(String(req.body.dueAt)) : undefined,
        issuedBy: userId,
      },
    });
    await writeErpAudit({
      userId, action: 'ERP_INVOICE_ISSUE', entityType: 'SalesInvoice', entityId: invoice.id,
      description: `Issued invoice ${invoice.number} to ${customer.name} — ${invoice.totalAmount}`,
      newValues: { number: invoice.number, totalAmount: invoice.totalAmount }, req, severity: 'WARNING',
    });
    return res.status(201).json({ success: true, data: invoice });
  } catch (error: any) {
    logger.error('createSalesInvoice failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/erp/sales/invoices/:id/pay — تسجيل دفع (finance:invoice:create)
export async function paySalesInvoice(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? req.query.orgId ?? '');
  const id = req.params.id;
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const invoice = await prisma.salesInvoice.findFirst({ where: { id, orgId } });
    if (!invoice) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
    if (invoice.status === 'PAID') return res.status(409).json({ success: false, error: { code: 'ALREADY_PAID', message: 'Invoice already paid' } });
    const paymentRef = req.body.paymentRef ? String(req.body.paymentRef) : undefined;
    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.salesInvoice.update({
        where: { id },
        data: { status: 'PAID', paidAt: new Date(), paymentRef: paymentRef ?? invoice.paymentRef },
      });
      if (invoice.salesOrderId) {
        await tx.salesOrder.update({
          where: { id: invoice.salesOrderId },
          data: { status: 'PAID', paymentRef: paymentRef ?? invoice.paymentRef },
        });
      }
      return inv;
    });
    await writeErpAudit({
      userId, action: 'ERP_INVOICE_PAY', entityType: 'SalesInvoice', entityId: id,
      description: `Invoice ${invoice.number} paid (${invoice.currency} ${invoice.totalAmount})`,
      oldValues: { status: invoice.status }, newValues: { status: 'PAID' }, req,
      severity: 'WARNING',
    });
    return res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('paySalesInvoice failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// GET /api/v1/erp/sales/orders?orgId=&status= (order:read)
export async function listSalesOrders(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.query.orgId ?? '');
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const data = await prisma.salesOrder.findMany({
      where: { orgId },
      include: { customer: { select: { id: true, name: true, type: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error('listSalesOrders failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// GET /api/v1/erp/sales/invoices?orgId=&status= (finance:invoice:read)
export async function listSalesInvoices(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.query.orgId ?? '');
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const data = await prisma.salesInvoice.findMany({
      where: { orgId },
      include: { customer: { select: { id: true, name: true, type: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error('listSalesInvoices failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}