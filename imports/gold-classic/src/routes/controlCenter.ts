// ============================================================================
// JOHAR — CONTROL CENTER ROUTES (قسم 21 في BRD)
// ============================================================================
// لوحة التحكم المؤسسية — قراءة فقط، صلاحية report:view بسياق platform.
// الحماية: نفس بوابة erp/dashboard حتى لا نحتاج تحديث بيانات أدوار حية.

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { authz } from '../middleware/authorize';
import {
  getControlCenterSummary,
  getLiveTransactions,
  getRiskMonitor,
  getBlockchainEvents,
  getTradeOverview,
} from '../controllers/ControlCenterController';

const router = Router();

/// GET /api/v1/control-center/summary
/// ملخص KPIs + معاملات حية + مخاطر + أدلة + مالية + لوجستيك + دعم
router.get(
  '/summary',
  authenticateToken,
  authz('report:view', { scope: 'platform' }),
  getControlCenterSummary,
);

/// GET /api/v1/control-center/live-transactions
/// آخر 40 سجلاً من سجل التدقيق المركزي
router.get(
  '/live-transactions',
  authenticateToken,
  authz('report:view', { scope: 'platform' }),
  getLiveTransactions,
);

/// GET /api/v1/control-center/risk-monitor
/// عدادات GREEN / YELLOW / RED (مستخدمون، مؤسسات، احتيال مفتوح)
router.get(
  '/risk-monitor',
  authenticateToken,
  authz('report:view', { scope: 'platform' }),
  getRiskMonitor,
);

/// GET /api/v1/control-center/blockchain-events
/// آخر الأدلة المثبتة + حالات النزاهة
router.get(
  '/blockchain-events',
  authenticateToken,
  authz('report:view', { scope: 'platform' }),
  getBlockchainEvents,
);

/// GET /api/v1/control-center/trade-overview
/// تجميع المبيعات/المشتريات (§31.3) — قراءة-فقط بلا migration
router.get(
  '/trade-overview',
  authenticateToken,
  authz('report:view', { scope: 'platform' }),
  getTradeOverview,
);

export default router;