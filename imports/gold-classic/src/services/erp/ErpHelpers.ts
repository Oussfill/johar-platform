// ============================================================================
// JOHAR — ERP ADVANCED HELPERS (المعمارية §4)
// ============================================================================
// أدوات مشتركة لسلسلة المشتريات/المبيعات: سياق العضوية، ترقيم الوثائق، التدقيق.

import { Request } from 'express';
import { Prisma, OrgRole } from '@prisma/client';
import { prisma } from '../../config/database';
import { isValidUuid } from '../../utils/guards';

/// يقرأ العضوية النشطة للمستخدم داخل مؤسسة (ABAC السياقي)
export async function getActiveMembership(userId: string, orgId: string) {
  if (!isValidUuid(orgId)) return null;
  const membership = await prisma.orgMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });
  return membership && membership.isActive ? membership : null;
}

/// orgId النشط الحالي للمستخدم (سياق العمل المختار)
export async function getActiveOrgId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeOrgId: true },
  });
  return user?.activeOrgId ?? null;
}

const NUMBER_MODEL_MAP: Record<string, any> = {
  supplier: 'supplier',
  purchaseRequest: 'purchaseRequest',
  rfq: 'rfq',
  purchaseOrder: 'purchaseOrder',
  salesOrder: 'salesOrder',
  salesInvoice: 'salesInvoice',
};

/// يولّد رقم الوثيقة الترتيبي داخل المؤسسة: PREFIX-YYYY-NNN (الرقم فريد بين orgId+number)
export async function nextNumber(
  model: 'supplier' | 'purchaseRequest' | 'rfq' | 'purchaseOrder' | 'salesOrder' | 'salesInvoice',
  orgId: string,
): Promise<string> {
  const prefix: Record<string, string> = {
    supplier: 'SUP',
    purchaseRequest: 'PR',
    rfq: 'RFQ',
    purchaseOrder: 'PO',
    salesOrder: 'SO',
    salesInvoice: 'INV',
  };
  const year = new Date().getFullYear();
  const count = await (prisma as any)[NUMBER_MODEL_MAP[model]].count({
    where: { orgId },
  });
  return `${prefix[model]}-${year}-${String(count + 1).padStart(3, '0')}`;
}

/// سجل تدقيق موحّد لعمليات ERP (الحياة القابلة للتدقيق في المشتريات/المبيعات)
export async function writeErpAudit(entry: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  oldValues?: unknown;
  newValues?: unknown;
  req: Request;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
}) {
  return prisma.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      description: entry.description,
      oldValues: (entry.oldValues as Prisma.InputJsonValue) ?? undefined,
      newValues: (entry.newValues as Prisma.InputJsonValue) ?? undefined,
      ipAddress: entry.req.ip,
      userAgent: entry.req.headers['user-agent']?.slice(0, 500) ?? null,
      requestId: (entry.req as any).requestId ?? null,
      severity: (entry.severity as any) ?? 'INFO',
      category: 'OPERATION',
    },
  });
}

/// أذونات مرتبطة بأدوار المؤسسة — تُستخدم لفحوص SoD الإسلامية (فصل الصلاحيات)
export const ROLE_TIERS: Record<OrgRole, number> = {
  OWNER: 3,
  ADMIN: 3,
  SALES: 2,
  PROCUREMENT: 2,
  INVENTORY: 2,
  LOGISTICS: 2,
  FINANCE: 3,
  COMPLIANCE: 3,
  VIEWER: 1,
};