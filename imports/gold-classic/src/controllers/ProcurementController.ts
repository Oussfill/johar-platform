// ============================================================================
// JOHAR — PROCUREMENT CONTROLLER (المعمارية §4)
// ============================================================================
// سلسلة المشتريات: PR → RFQ → Offers → PO → Receipt/Inspection.
// الموافقات (purchase:approve, rfq:choose) فصل مهام Tier 3 لا يملكها PROCUREMENT.

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { getActiveMembership, nextNumber, writeErpAudit } from '../services/erp/ErpHelpers';

/// POST /api/v1/erp/procurement/purchase-requests — إنشاء طلب شراء (purchase:request)
export async function createPurchaseRequest(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? '');
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'items array is required' } });
    }
    const number = await nextNumber('purchaseRequest', orgId);
    const pr_ = await prisma.purchaseRequest.create({
      data: {
        orgId,
        number,
        department: req.body.department ? String(req.body.department) : undefined,
        items: req.body.items as Prisma.InputJsonValue,
        status: 'DRAFT',
        requestedBy: userId,
        notes: req.body.notes ? String(req.body.notes) : undefined,
      },
    });
    await writeErpAudit({
      userId, action: 'ERP_PR_CREATE', entityType: 'PurchaseRequest', entityId: pr_.id,
      description: `Drafted purchase request ${pr_.number}`,
      newValues: { number: pr_.number, items: pr_.items }, req,
    });
    return res.status(201).json({ success: true, data: pr_ });
  } catch (error: any) {
    logger.error('createPurchaseRequest failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/erp/procurement/purchase-requests/:id/submit — إرسال للاعتماد (purchase:request)
export async function submitPurchaseRequest(req: Request, res: Response) {
  return transitionPurchaseRequest(req, res, 'SUBMITTED');
}

/// POST /api/v1/erp/procurement/purchase-requests/:id/approve — اعتماد (purchase:approve, Tier 3)
export async function approvePurchaseRequest(req: Request, res: Response) {
  return transitionPurchaseRequest(req, res, 'APPROVED');
}

async function transitionPurchaseRequest(req: Request, res: Response, status: string) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? req.query.orgId ?? '');
  const id = req.params.id;
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const existing = await prisma.purchaseRequest.findFirst({ where: { id, orgId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Purchase request not found' } });
    }
    const ALLOWED = ['SUBMMITTED_SKIP', 'DRAFT', 'SUBMITTED', 'REJECTED'] as const;
    if (!(ALLOWED as readonly string[]).includes(existing.status)) {
      return res.status(409).json({ success: false, error: { code: 'STATUS_CONFLICT', message: `Cannot transition from ${existing.status}` } });
    }
    if (status === 'SUBMITTED' && existing.status !== 'DRAFT') {
      return res.status(409).json({ success: false, error: { code: 'STATUS_CONFLICT', message: 'Only DRAFT requests can be submitted' } });
    }
    if (status === 'APPROVED' && existing.status !== 'SUBMITTED') {
      return res.status(409).json({ success: false, error: { code: 'STATUS_CONFLICT', message: 'Only SUBMITTED requests can be approved' } });
    }
    const updated = await prisma.purchaseRequest.update({
      where: { id },
      data: { status, approvedBy: status === 'APPROVED' ? userId : undefined, approvedAt: status === 'APPROVED' ? new Date() : undefined },
    });
    await writeErpAudit({
      userId, action: status === 'APPROVED' ? 'ERP_PR_APPROVE' : 'ERP_PR_SUBMIT',
      entityType: 'PurchaseRequest', entityId: id,
      description: `Purchase request ${existing.number} -> ${status}`,
      oldValues: { status: existing.status }, newValues: { status }, req,
      severity: status === 'APPROVED' ? 'WARNING' : 'INFO',
    });
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('transitionPurchaseRequest failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/erp/procurement/rfqs — إنشاء RFQ (rfq:create) — خيارياً من PR معتمد
export async function createRfq(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? '');
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    let items = req.body.items;
    let purchaseRequestId = req.body.purchaseRequestId ? String(req.body.purchaseRequestId) : undefined;
    if (purchaseRequestId) {
      const pr_ = await prisma.purchaseRequest.findFirst({ where: { id: purchaseRequestId, orgId } });
      if (!pr_) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Purchase request not found' } });
      if (pr_.status !== 'APPROVED') {
        return res.status(409).json({ success: false, error: { code: 'PR_NOT_APPROVED', message: 'RFQ requires an APPROVED purchase request' } });
      }
      items = items ?? pr_.items;
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'items array is required (or reference an approved PR)' } });
    }
    const deadline = req.body.deadline ? new Date(String(req.body.deadline) + 'T00:00:00.000Z') : new Date(Date.now() + 7 * 864e5);
    const number = await nextNumber('rfq', orgId);
    const rfq = await prisma.rfq.create({
      data: {
        orgId, number, items: items as Prisma.InputJsonValue, deadline,
        status: 'DRAFT', issuedBy: userId, purchaseRequestId,
      },
    });
    await writeErpAudit({
      userId, action: 'ERP_RFQ_CREATE', entityType: 'Rfq', entityId: rfq.id,
      description: `Drafted RFQ ${rfq.number}${purchaseRequestId ? ' (from PR)' : ''}`,
      newValues: { number: rfq.number, deadline: rfq.deadline }, req,
    });
    return res.status(201).json({ success: true, data: rfq });
  } catch (error: any) {
    logger.error('createRfq failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/erp/procurement/rfqs/:id/send — إرسال للموردين (rfq:create)
export async function sendRfq(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? req.query.orgId ?? '');
  const id = req.params.id;
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const existing = await prisma.rfq.findFirst({ where: { id, orgId } });
    if (!existing) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'RFQ not found' } });
    if (existing.status !== 'DRAFT') {
      return res.status(409).json({ success: false, error: { code: 'STATUS_CONFLICT', message: 'Only DRAFT RFQs can be sent' } });
    }
    const rfq = await prisma.rfq.update({ where: { id }, data: { status: 'SENT' } });
    await writeErpAudit({
      userId, action: 'ERP_RFQ_SEND', entityType: 'Rfq', entityId: id,
      description: `RFQ ${existing.number} sent to suppliers`, oldValues: { status: 'DRAFT' }, newValues: { status: 'SENT' }, req,
    });
    return res.json({ success: true, data: rfq });
  } catch (error: any) {
    logger.error('sendRfq failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/erp/procurement/rfqs/:id/offers — إضافة عرض مورد (rfq:create)
export async function addRfqOffer(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? '');
  const rfqId = req.params.id;
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const rfq = await prisma.rfq.findFirst({ where: { id: rfqId, orgId } });
    if (!rfq) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'RFQ not found' } });
    const supplierId = String(req.body.supplierId ?? '');
    const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, orgId } });
    if (!supplier) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
    const totalAmount = Number(req.body.totalAmount);
    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'totalAmount is required and must be >= 0' } });
    }
    const offer = await prisma.rfqOffer.create({
      data: {
        rfqId,
        supplierId,
        items: (req.body.items ?? rfq.items) as Prisma.InputJsonValue,
        totalAmount,
        currency: req.body.currency ?? 'USD',
        leadTimeDays: req.body.leadTimeDays !== undefined ? Number(req.body.leadTimeDays) : undefined,
        validUntil: req.body.validUntil ? new Date(String(req.body.validUntil) + 'T00:00:00.000Z') : undefined,
        submittedBy: userId,
      },
    });
    if (rfq.status !== 'RECEIVING') await prisma.rfq.update({ where: { id: rfqId }, data: { status: 'RECEIVING' } });
    await writeErpAudit({
      userId, action: 'ERP_RFQ_OFFER', entityType: 'RfqOffer', entityId: offer.id,
      description: `Offer from ${supplier.legalName} for ${rfq.number} — ${totalAmount}`,
      newValues: { supplierId, totalAmount, currency: offer.currency }, req,
    });
    return res.status(201).json({ success: true, data: offer });
  } catch (error: any) {
    logger.error('addRfqOffer failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/erp/procurement/rfqs/:id/choose/:offerId — قصوى: اختيار العرض (rfq:choose, Tier 3)
export async function chooseRfqOffer(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? req.query.orgId ?? '');
  const rfqId = req.params.id;
  const offerId = req.params.offerId;
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const rfq = await prisma.rfq.findFirst({ where: { id: rfqId, orgId }, include: { offers: true } });
    if (!rfq) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'RFQ not found' } });
    const offer = rfq.offers.find((o: any) => o.id === offerId);
    if (!offer) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Offer not found' } });
    await prisma.$transaction([
      prisma.rfqOffer.updateMany({ where: { rfqId }, data: { status: offerId === offerId ? 'REJECTED' : 'REJECTED' } }),
      prisma.rfqOffer.update({ where: { id: offerId }, data: { status: 'SELECTED' } }),
      prisma.rfq.update({ where: { id: rfqId }, data: { status: 'SHORTLISTED' } }),
    ]);
    await writeErpAudit({
      userId, action: 'ERP_RFQ_CHOOSE', entityType: 'Rfq', entityId: rfqId,
      description: `Selected winning offer (${offer.currency} ${offer.totalAmount}) for RFQ ${rfq.number}`,
      oldValues: { status: rfq.status }, newValues: { status: 'SHORTLISTED' }, req,
      severity: 'WARNING',
    });
    return res.json({ success: true, data: { rfqStatus: 'SHORTLISTED', selectedOfferId: offerId } });
  } catch (error: any) {
    logger.error('chooseRfqOffer failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/erp/procurement/purchase-orders — إصدار أمر شراء PO (purchase:order)
export async function createPurchaseOrder(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? '');
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const supplierId = String(req.body.supplierId ?? '');
    const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, orgId } });
    if (!supplier) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
    const totalAmount = Number(req.body.totalAmount);
    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'totalAmount is required and must be >= 0' } });
    }
    const number = await nextNumber('purchaseOrder', orgId);
    const po = await prisma.purchaseOrder.create({
      data: {
        orgId, number, supplierId,
        rfqOfferId: req.body.rfqOfferId ? String(req.body.rfqOfferId) : undefined,
        items: req.body.items as Prisma.InputJsonValue,
        totalAmount, currency: req.body.currency ?? 'USD',
        status: 'ISSUED', placedBy: userId,
        notes: req.body.notes ? String(req.body.notes) : undefined,
      },
    });
    await writeErpAudit({
      userId, action: 'ERP_PO_ISSUE', entityType: 'PurchaseOrder', entityId: po.id,
      description: `Issued PO ${po.number} to ${supplier.legalName} — ${totalAmount}`,
      newValues: { number: po.number, totalAmount }, req, severity: 'WARNING',
    });
    return res.status(201).json({ success: true, data: po });
  } catch (error: any) {
    logger.error('createPurchaseOrder failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/erp/procurement/purchase-orders/:id/receive — استلام بضاعة (purchase:receive)
export async function receivePurchaseOrder(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? '');
  const id = req.params.id;
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const po = await prisma.purchaseOrder.findFirst({ where: { id, orgId } });
    if (!po) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Purchase order not found' } });
    if (!['ISSUED', 'ACCEPTED', 'RECEIVING', 'INSPECTION'].includes(po.status)) {
      return res.status(409).json({ success: false, error: { code: 'STATUS_CONFLICT', message: `Cannot receive PO in status ${po.status}` } });
    }
    const receipt = await prisma.$transaction(async (tx) => {
      const created = await tx.goodsReceipt.create({
        data: {
          poId: id,
          receivedBy: userId,
          items: (req.body.items ?? po.items) as Prisma.InputJsonValue,
          notes: req.body.notes ? String(req.body.notes) : undefined,
        },
      });
      await tx.purchaseOrder.update({ where: { id }, data: { status: 'INSPECTION' } });
      return created;
    });
    await writeErpAudit({
      userId, action: 'ERP_GOODS_RECEIPT', entityType: 'GoodsReceipt', entityId: receipt.id,
      description: `Goods received for PO ${po.number} — inspection pending`,
      newValues: { poId: id, receiptId: receipt.id }, req,
    });
    return res.status(201).json({ success: true, data: receipt });
  } catch (error: any) {
    logger.error('receivePurchaseOrder failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/erp/procurement/goods-receipts/:id/inspect — فحص + إغلاق PO (purchase:receive)
export async function inspectGoodsRequest(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? req.query.orgId ?? '');
  const id = req.params.id;
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const receipt = await prisma.goodsReceipt.findFirst({
      where: { id, po: { orgId } },
    });
    if (!receipt) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Goods receipt not found' } });
    const decision = String(req.body.decision ?? 'ACCEPTED');
    if (!['INSPECTED', 'ACCEPTED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'decision must be INSPECTED|ACCEPTED|REJECTED' } });
    }
    const result = await prisma.$transaction(async (tx) => {
      const updatedReceipt = await tx.goodsReceipt.update({
        where: { id },
        data: { inspectionStatus: decision, inspectorId: userId, inspectedAt: new Date() },
      });
      const closed = decision === 'ACCEPTED' || decision === 'INSPECTED';
      const po = await tx.purchaseOrder.update({
        where: { id: receipt.poId },
        data: { status: decision === 'REJECTED' ? 'INSPECTION' : 'COMPLETED', receivedAt: closed ? new Date() : undefined },
      });
      return { updatedReceipt, po };
    });
    await writeErpAudit({
      userId, action: decision === 'REJECTED' ? 'ERP_INSPECTION_REJECT' : 'ERP_INSPECTION_ACCEPT',
      entityType: 'GoodsReceipt', entityId: id,
      description: `Inspection ${decision} for PO ${result.po.number}`,
      oldValues: { inspectionStatus: receipt.inspectionStatus }, newValues: { inspectionStatus: decision }, req,
      severity: decision === 'REJECTED' ? 'CRITICAL' : 'INFO',
    });
    return res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('inspectGoodsRequest failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// GET /api/v1/erp/procurement/purchase-requests?orgId=&status= (purchase:request)
export async function listPurchaseRequests(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.query.orgId ?? '');
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const data = await prisma.purchaseRequest.findMany({ where: { orgId }, orderBy: { updatedAt: 'desc' } });
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error('listPurchaseRequests failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// GET /api/v1/erp/procurement/rfqs?orgId=&status= (rfq:read)
export async function listRfqs(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.query.orgId ?? '');
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const data = await prisma.rfq.findMany({
      where: { orgId },
      include: { offers: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error('listRfqs failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// GET /api/v1/erp/procurement/purchase-orders?orgId=&status= (purchase:read)
export async function listPurchaseOrders(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.query.orgId ?? '');
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const data = await prisma.purchaseOrder.findMany({
      where: { orgId },
      include: { supplier: { select: { id: true, legalName: true, code: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error('listPurchaseOrders failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}