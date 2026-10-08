// ============================================================================
// GOLD PLATFORM — CUSTODY ROUTES
// ============================================================================
// مسارات API لإدارة الخزائن وعمليات النقل

import { Router } from 'express';
import {
  createTransferRequest,
  approveTransfer,
  getPendingApprovals,
} from '../controllers/CustodyController';
import { validateRequest, transferRequestSchema } from '../middleware/validation';
import { authenticateToken, requireHierarchy } from '../middleware/auth';
import { authz } from '../middleware/authorize';

const router = Router();

/**
 * POST /api/v1/custody/transfer-request
 * طلب نقل أصل من الخزينة
 *
 * يتطلب مصادقة وصلاحية: custody:transfer
 * يتطلب مستوى سلطة >= 3
 * للقيم العالية (>50,000 USD): يُفعّل نظام الاعتماد الثنائي (Four-Eyes Principle)
 */
router.post(
  '/transfer-request',
  authenticateToken,
  authz('transaction:create', { scope: 'platform' }),
  requireHierarchy(3),
  validateRequest(transferRequestSchema, 'body'),
  createTransferRequest,
);

/**
 * POST /api/v1/custody/approve
 * الموافقة على طلب نقل (العتماد الأول أو الثاني)
 *
 * يتطلب مصادقة وصلاحية: custody:approve
 * يتطلب مستوى سلطة >= 4
 * مبدأ العيون الأربعة: لا يمكن للموافقة أن يكون نفسه المبادر
 */
router.post(
  '/approve',
  authenticateToken,
  authz('custody:approve', { scope: 'platform' }),
  requireHierarchy(4),
  approveTransfer,
);

/**
 * GET /api/v1/custody/pending-approvals
 * جلب الطلبات المعلقة للموافقة
 *
 * يتطلب مصادقة وصلاحية: custody:approve
 */
router.get(
  '/pending-approvals',
  authenticateToken,
  authz('custody:approve', { scope: 'platform' }),
  getPendingApprovals,
);

export default router;
