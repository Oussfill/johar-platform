import { Router } from 'express';
import * as OwnershipController from '../controllers/OwnershipController';
import { authenticateToken } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const router = Router();

router.post('/request', authenticateToken, requireRoles('ownership'), OwnershipController.requestPurchase);

router.post('/certify-notary', authenticateToken, requireRoles('notary'), OwnershipController.certifyNotary);

router.post('/activate-passport', authenticateToken, requireRoles('ownership'), OwnershipController.activatePassport);

router.get('/process/:processId', authenticateToken, requireRoles('ownership'), OwnershipController.getProcessStatus);

router.get('/my-processes', authenticateToken, requireRoles('ownership'), OwnershipController.getCustomerProcesses);

router.get('/auditor-overview', authenticateToken, requireRoles('security'), OwnershipController.getAuditorOverview);

// تفاصيل الضمان المالي
router.get('/escrow/:processId', authenticateToken, requireRoles('ownership'), OwnershipController.getEscrowDetails);

export default router;
