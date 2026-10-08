import { Router } from 'express';
import * as LogisticsController from '../controllers/LogisticsController';
import { authenticateToken } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const router = Router();

router.get('/', authenticateToken, requireRoles('custody'), LogisticsController.getShipments);
router.get('/:id', authenticateToken, requireRoles('custody'), LogisticsController.getShipmentById);

export default router;