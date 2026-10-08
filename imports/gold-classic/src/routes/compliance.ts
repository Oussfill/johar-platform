import { Router } from 'express';
import * as ComplianceController from '../controllers/ComplianceController';
import { authenticateToken } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const router = Router();

router.get('/kyc-queue', authenticateToken, requireRoles('compliance'), ComplianceController.getKYCQueue);
router.get('/aml-screening', authenticateToken, requireRoles('compliance'), ComplianceController.getAMLScreening);
router.get('/audit-logs', authenticateToken, requireRoles('compliance'), ComplianceController.getAuditLogs);
router.get('/stats', authenticateToken, requireRoles('compliance'), ComplianceController.getComplianceStats);

export default router;
