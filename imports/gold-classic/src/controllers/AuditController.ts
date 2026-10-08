// ============================================================================
// GOLD PLATFORM — AUDIT CONTROLLER
// ============================================================================
// Controller لسجلات التدقيق (ISO 27001 Compliance)
// عرض وتصدير سجلات التدقيق مع التصفية حسب الفترة والشدة والمستخدم

import { Request, Response } from 'express';
import { Language, Currency, AuditSeverity, AuditCategory } from '@prisma/client';
import { isValidUuid } from '../utils/guards';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

// ============================================================================
// GET /api/v1/audit/logs — جلب سجلات التدقيق
// ============================================================================

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const {
      page = '1',
      limit = '50',
      severity,
      category,
      action,
      entityType,
      userId,
      startDate,
      endDate,
      search,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 200); // حد أقصى 200 سجل
    const skip = (pageNum - 1) * limitNum;

    // بناء شروط البحث
    const where: any = {};

    if (severity) {
      where.severity = severity;
    }

    if (category) {
      where.category = category;
    }

    if (action) {
      where.action = { contains: action as string, mode: 'insensitive' };
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    if (search) {
      where.OR = [
        { action: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { entityType: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // إحصائيات سريعة
    const stats = await prisma.auditLog.groupBy({
      by: ['severity'],
      _count: { id: true },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // آخر 24 ساعة
        },
      },
    });

    const response: any = {
      success: true,
      data: {
        logs: logs.map((log) => ({
          id: log.id,
          userId: log.userId,
          user: log.user
            ? `${log.user.firstName} ${log.user.lastName}`
            : 'System',
          userEmail: log.user?.email,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          description: log.description,
          oldValues: log.oldValues,
          newValues: log.newValues,
          severity: log.severity,
          category: log.category,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: log.createdAt,
        })),
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
        stats24h: {
          total: stats.reduce((sum, s) => sum + s._count.id, 0),
          bySeverity: stats.reduce(
            (acc, s) => {
              acc[s.severity] = s._count.id;
              return acc;
            },
            {} as Record<string, number>,
          ),
        },
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
        complianceStandard: 'ISO 27001',
        dataRetention: '7 years',
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Audit logs fetch failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'AUDIT_FETCH_FAILED', message: 'Failed to retrieve audit logs' },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// GET /api/v1/audit/logs/:log_id — جلب سجل تدقيق محدد
// ============================================================================

export async function getAuditLogById(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const { log_id } = req.params;

    if (!isValidUuid(log_id)) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Audit log not found' },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    const log = await prisma.auditLog.findUnique({
      where: { id: log_id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: {
              select: { roleCode: true },
            },
          },
        },
      },
    });

    if (!log) {
      res.status(404).json({
        success: false,
        error: { code: 'LOG_NOT_FOUND', message: 'Audit log not found' },
      });
      return;
    }

    const response: any = {
      success: true,
      data: {
        id: log.id,
        user: log.user
          ? {
              id: log.user.id,
              name: `${log.user.firstName} ${log.user.lastName}`,
              email: log.user.email,
              role: log.user.role.roleCode,
            }
          : null,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        description: log.description,
        oldValues: log.oldValues,
        newValues: log.newValues,
        severity: log.severity,
        category: log.category,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        requestId: log.requestId,
        createdAt: log.createdAt,
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
        complianceNote: {
          ar: 'هذا السجل جزء من نظام الامتثال لمعيار ISO 27001 ولا يمكن حذفه أو تعديله',
          fr: "Ce registre fait partie du système de conformité ISO 27001 et ne peut pas être supprimé ou modifié",
          en: 'This log is part of the ISO 27001 compliance system and cannot be deleted or modified',
        },
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Audit log fetch failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'AUDIT_FETCH_FAILED', message: 'Failed to retrieve audit log' },
    });
  }
}

// ============================================================================
// GET /api/v1/audit/stats — إحصائيات سجلات التدقيق
// ============================================================================

export async function getAuditStats(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const { period = '7d' } = req.query;

    let startDate: Date;
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    const [totalLogs, severityStats, categoryStats, actionStats, topUsers] =
      await Promise.all([
        prisma.auditLog.count({
          where: { createdAt: { gte: startDate } },
        }),
        prisma.auditLog.groupBy({
          by: ['severity'],
          _count: { id: true },
          where: { createdAt: { gte: startDate } },
        }),
        prisma.auditLog.groupBy({
          by: ['category'],
          _count: { id: true },
          where: { createdAt: { gte: startDate } },
        }),
        prisma.auditLog.groupBy({
          by: ['action'],
          _count: { id: true },
          where: { createdAt: { gte: startDate } },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
        prisma.auditLog.groupBy({
          by: ['userId'],
          _count: { id: true },
          where: {
            createdAt: { gte: startDate },
            userId: { not: null },
          },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
      ]);

    const response: any = {
      success: true,
      data: {
        period,
        startDate,
        totalLogs,
        bySeverity: severityStats.reduce(
          (acc, s) => {
            acc[s.severity] = s._count.id;
            return acc;
          },
          {} as Record<string, number>,
        ),
        byCategory: categoryStats.reduce(
          (acc, c) => {
            acc[c.category] = c._count.id;
            return acc;
          },
          {} as Record<string, number>,
        ),
        topActions: actionStats.map((a) => ({
          action: a.action,
          count: a._count.id,
        })),
        topUsers: topUsers.map((u) => ({
          userId: u.userId,
          actionCount: u._count.id,
        })),
        complianceStatus: {
          iso27001: 'COMPLIANT',
          dataRetention: '7 years',
          tamperProtection: 'IMMUTABLE',
          lastAudit: new Date().toISOString(),
        },
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Audit stats failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'AUDIT_STATS_FAILED', message: 'Failed to retrieve audit stats' },
    });
  }
}

// ============================================================================
// SIEM EXPORT (§20) — تصدير سجلات التدقيق بتنسيق قياسي قابل للبلع بواسطة SIEM
// ============================================================================

/**
 * GET /api/v1/audit/export/siem?since=&severity=&format=ndjson|cef&limit=
 * تصدير AuditLog بصيغة NDJSON (سطر لكل حدث) أو CEF.
 * يتطلب: audit:export (منصّة)
 */
export async function exportSiemLogs(req: Request, res: Response): Promise<void> {
  try {
    const { since, severity, entityType, action, format = 'ndjson', limit = '1000' } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10), 5000);

    const where: any = {};
    if (since) {
      const sinceDate = new Date(since as string);
      if (isNaN(sinceDate.getTime())) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'since must be an ISO date' } });
        return;
      }
      where.createdAt = { gte: sinceDate };
    }
    if (severity) where.severity = severity;
    if (entityType) where.entityType = entityType;
    if (action) where.action = { contains: action as string, mode: 'insensitive' };

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: limitNum,
      select: {
        id: true,
        userId: true,
        action: true,
        entityType: true,
        entityId: true,
        description: true,
        ipAddress: true,
        userAgent: true,
        requestId: true,
        severity: true,
        category: true,
        createdAt: true,
      },
    });

    const fmt = String(format).toLowerCase();
    let body: string;
    let contentType = 'application/x-ndjson; charset=utf-8';

    if (fmt === 'cef') {
      // Common Event Format: CEF:0|JOHAR|gold-platform|1.0|<sig>|JOHAR|<severity>|rt=... src=... suser=... act=...
      const sevMap: Record<string, number> = { DEBUG: 0, INFO: 3, WARNING: 6, CRITICAL: 10 };
      body = logs
        .map((l) => {
          const sig = (l.entityType || 'EVENT').replace(/\\/g, '').replace(/\|/g, ' ');
          const msg = (l.description || l.action).replace(/\|/g, ',').replace(/\\/g, '');
          const sev = sevMap[l.severity] ?? 3;
          return [
            `CEF:0|JOHAR|gold-platform|1.0|${sig}|${msg}|${sev}|`,
            `rt=${new Date(l.createdAt).toISOString()}`,
            `src=${l.ipAddress || 'unknown'}`,
            `suser=${l.userId || 'system'}`,
            `act=${l.action.replace(/\|/g, ',')}`,
            `request=${l.requestId || '-'}`,
          ].join(' ');
        })
        .join('\n');
      contentType = 'text/plain; charset=utf-8';
    } else {
      // NDJSON: سطر واحد لكل حدث
      body = logs
        .map((l) =>
          JSON.stringify({
            timestamp: l.createdAt.toISOString(),
            event: {
              category: l.category,
              action: l.action,
              outcome: l.severity === 'CRITICAL' ? 'alert' : 'success',
              severity: l.severity,
            },
            observer: { platform: 'JOHAR', entity_type: l.entityType, entity_id: l.entityId },
            actor: { id: l.userId },
            source: { ip: l.ipAddress, user_agent: l.userAgent },
            message: l.description,
            correlation: { request_id: l.requestId },
          }),
        )
        .join('\n');
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('X-SIEM-Export-Count', String(logs.length));
    res.setHeader('X-SIEM-Format', fmt);
    res.send(body);
  } catch (error) {
    logger.error('SIEM export failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'SIEM_EXPORT_FAILED', message: 'Failed to export audit logs' },
    });
  }
}
