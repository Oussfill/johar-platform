// ============================================================================
// JOHAR — TRUST CONTROLLER (المستويات المعيارية §12 — Levels 4–6)
// ============================================================================
// الترقية الصاعدة: عامل = مستوى. التقدّم متسلسل (لا قفز). الاعتماد عمل منصة
// (trust:evaluate, scope platform) يُدوَّن بسجل CRITICAL ويقع على مؤسسة.

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { getActiveMembership, getActiveOrgId, writeErpAudit } from '../services/erp/ErpHelpers';

/// عامل → المستوى المعياري الذي يفتحه
const FACTOR_LEVEL: Record<string, number> = {
  PHYSICAL_DATA: 4,
  LAB_RESULT: 5,
  CERTIFICATION: 6,
};

const FACTORS = Object.keys(FACTOR_LEVEL);

/// يكمل orgId من مسار الاستعلام، ثم يقع افتراضياً على المؤسسة النشطة للمستخدم
/// حتى لا تُمرَّر قيمة فارغة إلى استعلامات UUID (إلزامي: لا '' في where).
async function resolveOrgId(req: Request): Promise<string> {
  const userId = (req as any).userId as string;
  const queried = String(req.query.orgId ?? '').trim();
  if (queried) return queried;
  const active = await getActiveOrgId(userId);
  return active ?? '';
}

function missingOrg(res: Response) {
  return res.status(400).json({
    success: false,
    error: { code: 'ORG_PARAM_REQUIRED', message: 'orgId query parameter is required' },
  });
}

/// GET /api/v1/trust/status?orgId= — حالة ثقة المؤسسة (trust:view)
export async function getTrustStatus(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) return missingOrg(res);
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, trustLevel: true, trustLevelUpdatedAt: true, kybStatus: true },
    });
    if (!org) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } });

    const factors = await prisma.trustVerification.findMany({
      where: { orgId },
      orderBy: { updatedAt: 'desc' },
    });
    const current = org.trustLevel ?? 0;
    const next = FACTORS.find((f) => FACTOR_LEVEL[f] > current);
    return res.json({
      success: true,
      data: {
        orgId,
        trustLevel: current,
        trustLevelUpdatedAt: org.trustLevelUpdatedAt,
        kybStatus: org.kybStatus,
        factors: factors.map((f) => ({
          factor: f.factor,
          status: f.status,
          evidence: f.evidence,
          rejectionReason: f.rejectionReason,
          reviewedById: f.reviewedById,
          reviewedAt: f.reviewedAt,
          createdAt: f.createdAt,
        })),
        nextLevel: next ? { factor: next, level: FACTOR_LEVEL[next] } : null,
      },
    });
  } catch (error: any) {
    logger.error('getTrustStatus failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/trust/apply — طلب ترقية عامل (trust:apply) — تقدم متسلسل
export async function applyTrustFactor(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const factor = String(req.body.factor ?? '').toUpperCase();
  try {
    let orgId = String(req.body.orgId ?? '').trim();
    if (!orgId) orgId = (await getActiveOrgId(userId)) ?? '';
    if (!orgId) return missingOrg(res);
    if (!FACTORS.includes(factor)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: `factor must be one of: ${FACTORS.join(', ')}` } });
    }
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'ABAC_MEMBERSHIP_REQUIRED', message: 'Active membership in this organization is required' } });
    }
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { trustLevel: true, kybStatus: true },
    });
    if (!org) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } });

    // قاعدة التقدم المتسلسل (§12): لا قفز بين المستويات
    const level = FACTOR_LEVEL[factor];
    if (level === 4 && org.kybStatus !== 'VERIFIED') {
      return res.status(409).json({ success: false, error: { code: 'TRUST_REQUIRES_KYB', message: 'Level 4 requires a verified KYB first' } });
    }
    if (level === 5 && (org.trustLevel ?? 0) < 4) {
      return res.status(409).json({ success: false, error: { code: 'TRUST_SEQUENCE', message: 'Level 5 requires Level 4 (PHYSICAL_DATA) first' } });
    }
    if (level === 6 && (org.trustLevel ?? 0) < 5) {
      return res.status(409).json({ success: false, error: { code: 'TRUST_SEQUENCE', message: 'Level 6 requires Level 5 (LAB_RESULT) first' } });
    }

    const existing = await prisma.trustVerification.findUnique({
      where: { orgId_factor: { orgId, factor } },
    });
    if (existing?.status === 'APPROVED') {
      return res.status(409).json({ success: false, error: { code: 'TRUST_ALREADY_APPROVED', message: 'This factor is already approved' } });
    }
    const row = await prisma.trustVerification.upsert({
      where: { orgId_factor: { orgId, factor } },
      update: { status: 'PENDING', rejectionReason: null, reviewedById: null, reviewedAt: null },
      create: { orgId, factor },
    });

    await writeErpAudit({
      userId, action: 'TRUST_FACTOR_APPLY', entityType: 'TrustVerification', entityId: row.id,
      description: `Requested trust factor ${factor} (Level ${level}) for ${orgId}`,
      newValues: { factor, level }, req,
    });
    return res.status(existing ? 200 : 201).json({ success: true, data: row });
  } catch (error: any) {
    logger.error('applyTrustFactor failed', { error: error.message, userId });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/trust/:orgId/factors/:factor/approve — اعتماد عامل (trust:evaluate, منصة)
export async function approveTrustFactor(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = req.params.orgId;
  const factor = String(req.params.factor ?? '').toUpperCase();
  try {
    if (!FACTORS.includes(factor)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: `factor must be one of: ${FACTORS.join(', ')}` } });
    }
    const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true, trustLevel: true } });
    if (!org) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } });

    const targetLevel = FACTOR_LEVEL[factor];
    const evidence = req.body.evidence ?? {};
    const row = await prisma.trustVerification.upsert({
      where: { orgId_factor: { orgId, factor } },
      update: { status: 'APPROVED', evidence: evidence as Prisma.InputJsonValue, reviewedById: userId, reviewedAt: new Date(), rejectionReason: null },
      create: { orgId, factor, status: 'APPROVED', evidence: evidence as Prisma.InputJsonValue, reviewedById: userId, reviewedAt: new Date() },
    });

    // الترقية: لا تراجُع أبداً + مزامنة مالك المؤسسة مع مساره الفردي
    const nextTrust = Math.max(org.trustLevel ?? 0, targetLevel);
    const ownerMember = await prisma.orgMember.findFirst({ where: { orgId, orgRole: 'OWNER' } });
    await prisma.$transaction([
      prisma.organization.update({ where: { id: orgId }, data: { trustLevel: nextTrust, trustLevelUpdatedAt: new Date() } }),
      ...(ownerMember
        ? [prisma.user.update({ where: { id: ownerMember.userId }, data: { verificationLevel: Math.max(3, targetLevel) } })]
        : []),
    ]);

    await writeErpAudit({
      userId, action: 'TRUST_FACTOR_APPROVE', entityType: 'TrustVerification', entityId: row.id,
      description: `Approved trust factor ${factor} for ${orgId} — trust now Level ${nextTrust}`,
      oldValues: { trustLevel: org.trustLevel }, newValues: { trustLevel: nextTrust }, req,
      severity: 'CRITICAL',
    });

    const factors = await prisma.trustVerification.findMany({ where: { orgId }, orderBy: { updatedAt: 'desc' } });
    return res.json({
      success: true,
      data: { orgId, trustLevel: nextTrust, factor, factorStatus: 'APPROVED', factors },
    });
  } catch (error: any) {
    logger.error('approveTrustFactor failed', { error: error.message, userId });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/trust/:orgId/factors/:factor/reject — رفض عامل (trust:evaluate, منصة)
export async function rejectTrustFactor(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = req.params.orgId;
  const factor = String(req.params.factor ?? '').toUpperCase();
  const reason = String(req.body.reason ?? 'Evidence insufficient');
  try {
    if (!FACTORS.includes(factor)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: `factor must be one of: ${FACTORS.join(', ')}` } });
    }
    const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true } });
    if (!org) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } });

    const row = await prisma.trustVerification.upsert({
      where: { orgId_factor: { orgId, factor } },
      update: { status: 'REJECTED', rejectionReason: reason, reviewedById: userId, reviewedAt: new Date() },
      create: { orgId, factor, status: 'REJECTED', rejectionReason: reason, reviewedById: userId, reviewedAt: new Date() },
    });
    await writeErpAudit({
      userId, action: 'TRUST_FACTOR_REJECT', entityType: 'TrustVerification', entityId: row.id,
      description: `Rejected trust factor ${factor} for ${orgId}: ${reason}`,
      newValues: { factor, reason }, req, severity: 'WARNING',
    });
    return res.json({ success: true, data: row });
  } catch (error: any) {
    logger.error('rejectTrustFactor failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// GET /api/v1/trust/entitlements/trusted-network — ميزة Tier 4 (supplier:trustedNetwork)
/// البوابة تُثبت سياقياً: يصل إلى المضبط فقط من تجاوز `minTier=4` بالثقة المؤسسية.
export async function getTrustedNetwork(req: Request, res: Response) {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) return missingOrg(res);
    const suppliers = await prisma.supplier.findMany({
      where: { orgId, status: 'ACTIVE', rating: { gte: 4.5 } },
      orderBy: { rating: 'desc' },
    });
    return res.json({ success: true, data: { allowed: true, permission: 'supplier:trustedNetwork', trustedSuppliers: suppliers } });
  } catch (error: any) {
    logger.error('getTrustedNetwork failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// GET /api/v1/trust/entitlements/premium-certified — ميزة Tier 6 (product:premiumCertified)
export async function getPremiumCertified(req: Request, res: Response) {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) return missingOrg(res);
    const certified = await prisma.trustVerification.count({
      where: { orgId, factor: 'CERTIFICATION', status: 'APPROVED' },
    });
    return res.json({ success: true, data: { allowed: true, permission: 'product:premiumCertified', certificationRecords: certified } });
  } catch (error: any) {
    logger.error('getPremiumCertified failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}