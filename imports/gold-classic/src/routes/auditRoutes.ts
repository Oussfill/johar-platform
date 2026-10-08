// ============================================================================
// GOLD PLATFORM — AUDIT ROUTES
// ============================================================================
// مسارات API لسجلات التدقيق (ISO 27001 Compliance)

import { Router } from 'express';
import { getAuditLogs, getAuditLogById, getAuditStats, exportSiemLogs } from '../controllers/AuditController';
import { authenticateToken } from '../middleware/auth';
import { authz } from '../middleware/authorize';

const router = Router();

/**
 * GET /api/v1/audit/logs
 * جلب سجلات التدقيق مع التصفية
 *
 * يتطلب مصادقة وصلاحية: audit:read
 * يدعم: pagination, filter by severity/category/action/user/date
 */
router.get(
  '/logs',
  authenticateToken,
  authz('audit:read', { scope: 'platform' }),
  getAuditLogs,
);

/**
 * GET /api/v1/audit/stats
 * إحصائيات سجلات التدقيق
 *
 * يتطلب مصادقة وصلاحية: audit:read
 * يدعم: period (24h, 7d, 30d, 90d)
 */
router.get(
  '/stats',
  authenticateToken,
  authz('audit:read', { scope: 'platform' }),
  getAuditStats,
);

/**
 * GET /api/v1/audit/logs/:log_id
 * جلب سجل تدقيق محدد بالتفصيل
 *
 * يتطلب مصادقة وصلاحية: audit:read
 */
router.get(
  '/logs/:log_id',
  authenticateToken,
  authz('audit:read', { scope: 'platform' }),
  getAuditLogById,
);

/**
 * GET /api/v1/audit/export/siem?since=&severity=&format=ndjson|cef
 * تصدير سجلات التدقيق لصالح SIEM (NDJSON / CEF)
 *
 * يتطلب مصادقة وصلاحية: audit:export
 */
router.get(
  '/export/siem',
  authenticateToken,
  authz('audit:export', { scope: 'platform' }),
  exportSiemLogs,
);

export default router;
