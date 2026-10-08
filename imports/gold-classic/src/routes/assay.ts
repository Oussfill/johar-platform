import { Router } from 'express';
import * as AssayController from '../controllers/AssayController';
import { authenticateToken } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const router = Router();

router.get('/orders', authenticateToken, requireRoles('lab'), AssayController.getAssayOrders);
router.get('/instrument-logs', authenticateToken, requireRoles('labTech'), AssayController.getInstrumentLogs);
router.get('/result/:goldId', authenticateToken, requireRoles('lab'), AssayController.getAssayResult);
router.get('/lab-performance', authenticateToken, requireRoles('lab'), AssayController.getLabPerformance);

export default router;
