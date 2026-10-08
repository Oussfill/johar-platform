// ============================================================================
// JOHAR — ORGANIZATION & TEAM CONTROLLER (الشريحة 2 من المصفوفة)
// ============================================================================
// نقاط المؤسسة وحساب الأعمال القسمة 8-9 وقيادة الفريق القسمة 17-18.
// تعتمد على authz() للصلاحيات المقننة وعلى فحص العضوية (ABAC) للحد السياقي.

import { Request, Response } from 'express';
import { Prisma, OrgRole, AccountType } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { isValidUuid } from '../utils/guards';

// أنواع حسابات الأعمال المسموح إنشاؤها كمؤسسة (تُستثنى الحسابات الشخصية فقط)
const BUSINESS_ACCOUNT_TYPES: AccountType[] = [
  'PROFESSIONAL', 'COMPANY', 'MANUFACTURER', 'ARTISAN', 'TRADER',
  'IMPORTER_EXPORTER', 'SUPPLIER', 'DISTRIBUTOR_WHOLESALER', 'LABORATORY',
  'LOGISTICS_OPERATOR', 'SERVICE_PROVIDER', 'TECHNOLOGY_OPERATOR',
  'MINING_OPERATOR', 'INDUSTRIAL_OPERATOR', 'INSTITUTIONAL',
];

const ORG_ROLE_VALUES: OrgRole[] = [
  'OWNER', 'ADMIN', 'SALES', 'PROCUREMENT', 'INVENTORY',
  'LOGISTICS', 'FINANCE', 'COMPLIANCE', 'VIEWER',
];

const ALLOWED_ORG_FIELDS = [
  'tradeName', 'legalName', 'legalForm', 'registrationCountry',
  'registrationNumber', 'licenseNumber', 'address', 'contactInfo',
];

/// يحوّل جسم الطلب إلى بيانات قابلة للتحديث (يمنع تحديث الحقول الحسّاسة)
function sanitizeOrgBody(body: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const key of ALLOWED_ORG_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

/// يتحقق أن المستخدم عضو نشط في المؤسسة ويعيد العضوية
async function getActiveMembership(userId: string, orgId: string) {
  if (!isValidUuid(orgId)) return null;
  const membership = await prisma.orgMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
    include: { org: true },
  });
  return membership && membership.isActive ? membership : null;
}

/// سجل تدقيق موحّد لعمليات المؤسسات (الحياة القابلة للتدقيق كلها)
async function writeOrgAudit(entry: {
  userId: string;
  action: string;
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
      entityType: 'Organization',
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

/// POST /api/v1/orgs — إنشاء حساب أعمال + تمكين OWNER + تبديل للحساب الجديد
export async function createOrg(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  try {
    const {
      tradeName,
      legalName,
      legalForm,
      registrationCountry,
      accountType,
      address,
      contactInfo,
    } = req.body || {};

    if (!tradeName || typeof tradeName !== 'string' || !tradeName.trim()) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ORG_NAME', message: 'tradeName is required' },
      });
      return;
    }

    let orgAccountType: AccountType = 'COMPANY';
    if (accountType) {
      if (!BUSINESS_ACCOUNT_TYPES.includes(accountType as AccountType)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ACCOUNT_TYPE',
            message: `accountType must be one of: ${BUSINESS_ACCOUNT_TYPES.join(', ')}`,
          },
        });
        return;
      }
      orgAccountType = accountType as AccountType;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: { code: 'USER_INACTIVE', message: 'User account is inactive' },
      });
      return;
    }

    const org = await prisma.$transaction(async (tx) => {
      const created = await tx.organization.create({
        data: {
          tradeName: tradeName.trim(),
          legalName: legalName && String(legalName).trim() ? String(legalName).trim() : null,
          legalForm: legalForm && String(legalForm).trim() ? String(legalForm).trim() : null,
          registrationCountry: registrationCountry ? String(registrationCountry).toUpperCase() : null,
          address: (address as Prisma.InputJsonValue) ?? undefined,
          contactInfo: (contactInfo as Prisma.InputJsonValue) ?? undefined,
          accountType: orgAccountType,
          ownerId: userId,
        },
      });

      // تعطيل أي عضوية نشطة سابقة (قاعدة: عضوية نشطة واحدة فقط)
      await tx.orgMember.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });

      await tx.orgMember.create({
        data: { orgId: created.id, userId, orgRole: 'OWNER', isActive: true },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          activeOrgId: created.id,
          accountType: orgAccountType,
          verificationLevel: Math.max(user.verificationLevel, 2),
        },
      });

      return created;
    });

    await writeOrgAudit({
      userId,
      action: 'ORG_CREATE',
      entityId: org.id,
      description: `Created organization ${org.tradeName}`,
      newValues: {
        orgId: org.id,
        tradeName: org.tradeName,
        legalName: org.legalName,
        legalForm: org.legalForm,
        accountType: org.accountType,
      },
      req,
      severity: 'WARNING',
    });

    res.status(201).json({
      success: true,
      data: {
        orgId: org.id,
        tradeName: org.tradeName,
        legalName: org.legalName,
        accountType: org.accountType,
        ownerId: org.ownerId,
      },
    });
  } catch (error) {
    logger.error('Error creating organization', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ORG_CREATE_FAILED', message: 'Failed to create organization' },
    });
  }
}

/// GET /api/v1/orgs — قائمة عضوية المستخدم مع حالة العضوية النشطة
export async function listMyOrgs(_req: Request, res: Response) {
  const userId = (_req as any).userId as string;
  try {
    const memberships = await prisma.orgMember.findMany({
      where: { userId },
      include: {
        org: {
          select: {
            id: true, tradeName: true, legalName: true, accountType: true,
            verificationStatus: true, kybStatus: true, isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activeOrgId: true },
    });

    res.status(200).json({
      success: true,
      data: memberships
        .filter((m) => m.org && m.org.isActive)
        .map((m) => ({
          orgId: m.orgId,
          orgRole: m.orgRole,
          isActive: m.isActive,
          isCurrent: m.orgId === (user?.activeOrgId ?? null),
          org: m.org,
        })),
    });
  } catch (error) {
    logger.error('Error listing organizations', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ORG_LIST_FAILED', message: 'Failed to list organizations' },
    });
  }
}

/// PATCH /api/v1/orgs/:orgId — تحديث بيانات المؤسسة (مقنّنة: organization:update)
export async function updateOrg(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = req.params.orgId as string;
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      res.status(404).json({
        success: false,
        error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
      });
      return;
    }

    const ownerOrAdmin =
      membership.orgRole === 'OWNER' || membership.orgRole === 'ADMIN';
    if (!ownerOrAdmin) {
      res.status(403).json({
        success: false,
        error: {
          code: 'OWNER_OR_ADMIN_ONLY',
          message: 'Only OWNER or ADMIN can update the organization',
        },
      });
      return;
    }

    const data = sanitizeOrgBody(req.body || {});
    if (Object.keys(data).length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FIELDS', message: 'Nothing to update' },
      });
      return;
    }

    const old = {
      tradeName: membership.org.tradeName,
      legalName: membership.org.legalName,
      legalForm: membership.org.legalForm,
      registrationNumber: membership.org.registrationNumber,
      licenseNumber: membership.org.licenseNumber,
    };

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        ...data,
        registrationCountry: data.registrationCountry
          ? String(data.registrationCountry).toUpperCase()
          : undefined,
      } as Prisma.OrganizationUpdateInput,
    });

    await writeOrgAudit({
      userId,
      action: 'ORG_UPDATE',
      entityId: orgId,
      description: `Updated organization ${updated.tradeName}`,
      oldValues: old,
      newValues: {
        tradeName: updated.tradeName,
        legalName: updated.legalName,
        legalForm: updated.legalForm,
        registrationNumber: updated.registrationNumber,
        licenseNumber: updated.licenseNumber,
      },
      req,
      severity: 'WARNING',
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    logger.error('Error updating organization', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ORG_UPDATE_FAILED', message: 'Failed to update organization' },
    });
  }
}

/// GET /api/v1/orgs/:orgId/members — أعضاء فريق المؤسسة
export async function listMembers(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = req.params.orgId as string;
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      res.status(404).json({
        success: false,
        error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
      });
      return;
    }

    const members = await prisma.orgMember.findMany({
      where: { orgId },
      include: {
        user: {
          select: {
            id: true, firstName: true, lastName: true, email: true, isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: members.map((m) => ({
        userId: m.userId,
        orgRole: m.orgRole,
        isActive: m.isActive,
        user: m.user,
      })),
    });
  } catch (error) {
    logger.error('Error listing org members', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ORG_MEMBERS_FAILED', message: 'Failed to list members' },
    });
  }
}

/// POST /api/v1/orgs/:orgId/team — تعيين دور لموظف (مقنّنة: team:assignrole)
export async function assignRole(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = req.params.orgId as string;
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      res.status(404).json({
        success: false,
        error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
      });
      return;
    }

    if (membership.orgRole !== 'OWNER' && membership.orgRole !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: {
          code: 'OWNER_OR_ADMIN_ONLY',
          message: 'Only OWNER or ADMIN can manage the team',
        },
      });
      return;
    }

    const { email, orgRole } = req.body || {};
    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'EMAIL_REQUIRED', message: 'member email is required' },
      });
      return;
    }
    if (!orgRole || !ORG_ROLE_VALUES.includes(orgRole as OrgRole)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORG_ROLE',
          message: `orgRole must be one of: ${ORG_ROLE_VALUES.join(', ')}`,
        },
      });
      return;
    }
    if (orgRole === 'OWNER' && membership.orgRole !== 'OWNER') {
      res.status(403).json({
        success: false,
        error: {
          code: 'OWNER_ROLE_TRANSFER_FORBIDDEN',
          message: 'Only the OWNER can transfer ownership',
        },
      });
      return;
    }

    const target = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!target || !target.isActive) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found or inactive' },
      });
      return;
    }

    // الاتساق: عضوية نشطة واحدة فقط لكل مستخدم
    await prisma.$transaction(async (tx) => {
      await tx.orgMember.updateMany({
        where: { userId: target.id, isActive: true },
        data: { isActive: false },
      });
      await tx.orgMember.upsert({
        where: { orgId_userId: { orgId, userId: target.id } },
        update: { orgRole: orgRole as OrgRole, isActive: true },
        create: { orgId, userId: target.id, orgRole: orgRole as OrgRole, isActive: true },
      });
      await tx.user.update({
        where: { id: target.id },
        data: { activeOrgId: orgId },
      });
    });

    await writeOrgAudit({
      userId,
      action: 'ORG_TEAM_ASSIGN',
      entityId: orgId,
      description: `Assigned ${orgRole} to ${target.email}`,
      newValues: { memberId: target.id, assignedRole: orgRole, assignedBy: userId },
      req,
      severity: 'WARNING',
    });

    res.status(200).json({
      success: true,
      data: { orgId, memberId: target.id, orgRole },
    });
  } catch (error) {
    logger.error('Error assigning org role', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ORG_TEAM_FAILED', message: 'Failed to assign role' },
    });
  }
}

/// POST /api/v1/orgs/:orgId/switch — بدء العمل في سياق المؤسسة (حساب أعمال)
export async function switchOrg(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = req.params.orgId as string;
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      res.status(404).json({
        success: false,
        error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.orgMember.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
      await tx.orgMember.update({
        where: { orgId_userId: { orgId, userId } },
        data: { isActive: true },
      });
      await tx.user.update({
        where: { id: userId },
        data: { activeOrgId: orgId, accountType: membership.org.accountType },
      });
    });

    await writeOrgAudit({
      userId,
      action: 'ORG_SWITCH',
      entityId: orgId,
      description: `Switched active org to ${membership.org.tradeName}`,
      newValues: { orgId, accountType: membership.org.accountType, role: membership.orgRole },
      req,
    });

    res.status(200).json({
      success: true,
      data: {
        orgId,
        tradeName: membership.org.tradeName,
        orgRole: membership.orgRole,
        accountType: membership.org.accountType,
      },
    });
  } catch (error) {
    logger.error('Error switching org', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ORG_SWITCH_FAILED', message: 'Failed to switch organization' },
    });
  }
}

/// POST /api/v1/orgs/:orgId/kyb/approve — اعتماد KYB من قبل المنصة (kyb:approve)
/// يصادق: بيانات المؤسسة + المؤسس (البيولوجيا Tier 3) + تدقيق إلزامي.
export async function approveKyb(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = req.params.orgId as string;
  try {
    if (!isValidUuid(orgId)) {
      res.status(404).json({
        success: false,
        error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
      });
      return;
    }
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      res.status(404).json({
        success: false,
        error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
      });
      return;
    }
    if (org.kybStatus === 'VERIFIED') {
      res.status(409).json({
        success: false,
        error: { code: 'ALREADY_VERIFIED', message: 'Organization is already verified' },
      });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const up = await tx.organization.update({
        where: { id: orgId },
        data: {
          kybStatus: 'VERIFIED',
          verificationStatus: 'VERIFIED',
        },
      });
      // المؤسس يرتقي مع المؤسسة (اختتام الـ KYB يعادل تحقق Tier 3)
      await tx.user.updateMany({
        where: { id: org.ownerId, verificationLevel: { lt: 3 } },
        data: { verificationLevel: 3 },
      });
      return up;
    });

    await writeOrgAudit({
      userId,
      action: 'ORG_KYB_APPROVE',
      entityId: orgId,
      description: `KYB approved for ${updated.tradeName} (owner ${org.ownerId})`,
      oldValues: {
        kybStatus: org.kybStatus,
        verificationStatus: org.verificationStatus,
      },
      newValues: {
        kybStatus: updated.kybStatus,
        verificationStatus: updated.verificationStatus,
        approvedBy: userId,
      },
      req,
      severity: 'WARNING',
    });

    res.status(200).json({
      success: true,
      data: {
        orgId,
        kybStatus: updated.kybStatus,
        verificationStatus: updated.verificationStatus,
        ownerTier: 3,
      },
    });
  } catch (error) {
    logger.error('Error approving KYB', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ORG_KYB_APPROVE_FAILED', message: 'Failed to approve KYB' },
    });
  }
}

/// POST /api/v1/orgs/:orgId/kyb — إرسال الملف التعريفي لبدء تدقيق KYB
export async function startKyb(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const orgId = req.params.orgId as string;
  try {
    const membership = await getActiveMembership(userId, orgId);
    if (!membership) {
      res.status(404).json({
        success: false,
        error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
      });
      return;
    }
    if (membership.orgRole !== 'OWNER') {
      res.status(403).json({
        success: false,
        error: { code: 'OWNER_ONLY', message: 'Only the OWNER can submit KYB' },
      });
      return;
    }
    if (membership.org.kybStatus === 'VERIFIED') {
      res.status(409).json({
        success: false,
        error: { code: 'ALREADY_VERIFIED', message: 'Organization is already verified' },
      });
      return;
    }

    const docPackage = req.body?.documents;

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        kybStatus: 'PENDING',
        verificationStatus: 'PENDING',
        contactInfo: docPackage
          ? { ...((membership.org.contactInfo as Record<string, unknown>) ?? {}), kybDocuments: true }
          : ((membership.org.contactInfo as Prisma.InputJsonValue | null) ?? undefined),
      },
    });

    await writeOrgAudit({
      userId,
      action: 'ORG_KYB_SUBMIT',
      entityId: orgId,
      description: 'KYB submitted for review',
      newValues: {
        kybStatus: updated.kybStatus,
        verificationStatus: updated.verificationStatus,
        documentsProvided: Boolean(docPackage),
      },
      req,
      severity: 'WARNING',
    });

    res.status(200).json({
      success: true,
      data: { orgId, kybStatus: updated.kybStatus, verificationStatus: updated.verificationStatus },
    });
  } catch (error) {
    logger.error('Error submitting KYB', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ORG_KYB_FAILED', message: 'Failed to submit KYB' },
    });
  }
}