// ============================================================================
// GOLD PLATFORM — ERP ROUTES
// ============================================================================
// مسارات API للـ ERP — لوحة التحكم التشغيلية

import { Router } from 'express';
import {
  getInventoryReconciliation,
  getERPDashboard,
  getFraudAlerts,
  getInvariantCheck,
} from '../controllers/ERPController';
import { authenticateToken } from '../middleware/auth';
import { authz } from '../middleware/authorize';

const router = Router();

/**
 * GET /api/v1/erp/inventory/reconciliation
 * مطابقة بيانات الـ ERP مع السجلات الميدانية والخزائن
 *
 * يتطلب مصادقة وصلاحية: erp:reconciliation
 */
router.get(
  '/inventory/reconciliation',
  authenticateToken,
  authz('inventory:adjust', { scope: 'platform' }),
  getInventoryReconciliation,
);

/**
 * GET /api/v1/erp/dashboard
 * لوحة التحكم الرئيسية للـ ERP
 *
 * يتطلب مصادقة وصلاحية: erp:dashboard
 */
router.get(
  '/dashboard',
  authenticateToken,
  authz('report:view', { scope: 'platform' }),
  getERPDashboard,
);

/**
 * GET /api/v1/erp/fraud-alerts
 * سجل تنبيهات الاحتيال
 *
 * يتطلب مصادقة وصلاحية: erp:fraud-alerts
 */
router.get(
  '/fraud-alerts',
  authenticateToken,
  authz('compliance:read', { scope: 'platform' }),
  getFraudAlerts,
);

/**
 * GET /api/v1/erp/invariant-check
 * فحص ثبات الحفظ — مبدأ الحفظ L(t) = C(t) + S(t)
 *
 * يتطلب مصادقة وصلاحية: erp:reconciliation
 */
router.get(
  '/invariant-check',
  authenticateToken,
  authz('inventory:adjust', { scope: 'platform' }),
  getInvariantCheck,
);

export default router;
