import { Router } from 'express';
import * as SystemController from '../controllers/SystemController';
import { authenticateToken } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const router = Router();

router.get('/api-keys', authenticateToken, requireRoles('admin'), SystemController.getAPIKeys);
router.get('/blockchain-evidence', authenticateToken, requireRoles('admin', 'security'), SystemController.getBlockchainEvidence);
router.get('/health', authenticateToken, SystemController.getSystemHealth);
router.get('/integrations', authenticateToken, requireRoles('admin'), SystemController.getIntegrations);

export default router;
