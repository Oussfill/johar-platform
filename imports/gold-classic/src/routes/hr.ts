import { Router } from 'express';
import * as HRController from '../controllers/HRController';
import { authenticateToken } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const router = Router();

router.get('/employees', authenticateToken, requireRoles('hr'), HRController.getEmployees);
router.get('/employees/:id', authenticateToken, requireRoles('hr'), HRController.getEmployee);
router.get('/attendance', authenticateToken, requireRoles('hr'), HRController.getAttendanceLogs);
router.post('/attendance', authenticateToken, requireRoles('hr'), HRController.recordAttendance);
router.get('/pending-approvals', authenticateToken, requireRoles('hr'), HRController.getPendingApprovals);
router.get('/staff-performance', authenticateToken, requireRoles('hr'), HRController.getStaffPerformance);

export default router;
