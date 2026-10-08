// ============================================================================
// JOHAR — CRM CONTROLLER (المعمارية §4: العملاء والفرص)
// ============================================================================
// العملاء يخصّون المؤسسة (ABAC) عبر فحص العضوية؛ التعامل/الفرص تُدوَّن للتدقيق.

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { getActiveMembership, writeErpAudit } from '../services/erp/ErpHelpers';

/// POST /api/v1/erp/crm/customers — تسجيل عميل/فرصة (crm:create)
export async function createCustomer(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? '');
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const name = String(req.body.name ?? '');
    if (!name) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'name is required' } });
    }
    const customer = await prisma.crmCustomer.create({
      data: {
        orgId,
        name,
        type: String(req.body.type ?? 'PROSPECT'),
        email: req.body.email ? String(req.body.email) : undefined,
        phone: req.body.phone ? String(req.body.phone) : undefined,
        country: req.body.country ? String(req.body.country) : undefined,
        source: req.body.source ? String(req.body.source) : undefined,
        about: req.body.about ? (req.body.about as Prisma.InputJsonValue) : undefined,
        assignedTo: req.body.assignedTo ? String(req.body.assignedTo) : undefined,
        createdById: userId,
      },
    });
    await writeErpAudit({
      userId, action: 'ERP_CRM_CUSTOMER_CREATE', entityType: 'CrmCustomer', entityId: customer.id,
      description: `Registered CRM customer ${customer.name} (${customer.type})`,
      newValues: { name: customer.name, type: customer.type }, req,
    });
    return res.status(201).json({ success: true, data: customer });
  } catch (error: any) {
    logger.error('createCustomer failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// GET /api/v1/erp/crm/customers?orgId=&type= — قائمة العملاء (crm:view)
export async function listCustomers(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.query.orgId ?? '');
  const type = String(req.query.type ?? '');
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const customers = await prisma.crmCustomer.findMany({
      where: { orgId, ...(type ? { type } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: customers });
  } catch (error: any) {
    logger.error('listCustomers failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/erp/crm/interactions — تسجيل تفاعل مع عميل (crm:update)
export async function addInteraction(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? '');
  const customerId = String(req.body.customerId ?? '');
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const customer = await prisma.crmCustomer.findFirst({ where: { id: customerId, orgId } });
    if (!customer) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    }
    const summary = String(req.body.summary ?? '');
    if (!summary) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'summary is required' } });
    }
    const interaction = await prisma.crmInteraction.create({
      data: {
        customerId,
        type: String(req.body.type ?? 'NOTE'),
        summary,
        conductedBy: userId,
        happenedAt: req.body.happenedAt ? new Date(String(req.body.happenedAt)) : new Date(),
      },
    });
    await writeErpAudit({
      userId, action: 'ERP_CRM_INTERACTION', entityType: 'CrmCustomer', entityId: customerId,
      description: `Logged ${interaction.type} interaction with ${customer.name}`,
      newValues: { type: interaction.type, summary: interaction.summary }, req,
    });
    return res.status(201).json({ success: true, data: interaction });
  } catch (error: any) {
    logger.error('addInteraction failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/erp/crm/opportunities — فتح خط مبيعات (crm:create)
export async function createOpportunity(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? '');
  const customerId = String(req.body.customerId ?? '');
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const customer = await prisma.crmCustomer.findFirst({ where: { id: customerId, orgId } });
    if (!customer) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    }
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'amount is required and must be >= 0' } });
    }
    const opportunity = await prisma.crmOpportunity.create({
      data: {
        customerId,
        amount,
        currency: req.body.currency ?? 'USD',
        stage: 'QUOTATION',
        probability: Math.max(0, Math.min(100, Number(req.body.probability ?? 10))),
        expectedCloseAt: new Date(String(req.body.expectedCloseAt ?? new Date().toISOString().slice(0, 10)) + 'T00:00:00.000Z'),
        assignedTo: req.body.assignedTo ? String(req.body.assignedTo) : undefined,
        notes: req.body.notes ? String(req.body.notes) : undefined,
      },
    });
    await writeErpAudit({
      userId, action: 'ERP_CRM_OPPORTUNITY_CREATE', entityType: 'CrmOpportunity', entityId: opportunity.id,
      description: `Opened opportunity for ${customer.name} — ${opportunity.amount}`,
      newValues: { amount: opportunity.amount, stage: opportunity.stage }, req,
    });
    return res.status(201).json({ success: true, data: opportunity });
  } catch (error: any) {
    logger.error('createOpportunity failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// PATCH /api/v1/erp/crm/opportunities/:id — تقدم خط المبيعات (crm:update)
export async function updateOpportunity(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.body.orgId ?? '');
  const id = req.params.id;
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const existing = await prisma.crmOpportunity.findFirst({
      where: { id, customer: { orgId } },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Opportunity not found' } });
    }
    const data: Record<string, unknown> = {};
    if (req.body.stage) {
      const stage = String(req.body.stage);
      if (!['QUOTATION', 'NEGOTIATION', 'WON', 'LOST'].includes(stage)) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Invalid stage' } });
      }
      data.stage = stage;
      if (stage === 'WON') data.probability = 100;
      if (stage === 'LOST') data.probability = 0;
    }
    if (req.body.probability !== undefined) {
      data.probability = Math.max(0, Math.min(100, Number(req.body.probability)));
    }
    if (req.body.amount !== undefined) data.amount = Number(req.body.amount);
    if (req.body.notes !== undefined) data.notes = String(req.body.notes);
    const opportunity = await prisma.crmOpportunity.update({ where: { id }, data: data as any });
    await writeErpAudit({
      userId, action: 'ERP_CRM_OPPORTUNITY_UPDATE', entityType: 'CrmOpportunity', entityId: opportunity.id,
      description: `Opportunity ${existing.stage} -> ${opportunity.stage} (prob ${opportunity.probability})`,
      oldValues: { stage: existing.stage }, newValues: { stage: opportunity.stage }, req,
    });
    return res.json({ success: true, data: opportunity });
  } catch (error: any) {
    logger.error('updateOpportunity failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// GET /api/v1/erp/crm/opportunities?orgId= — قائمة الفرص (crm:view)
export async function listOpportunities(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = String(req.query.orgId ?? '');
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const opportunities = await prisma.crmOpportunity.findMany({
      where: { customer: { orgId } },
      include: { customer: { select: { id: true, name: true, type: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json({ success: true, data: opportunities });
  } catch (error: any) {
    logger.error('listOpportunities failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}