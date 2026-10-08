import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import * as WorkerController from '../controllers/WorkerController';
import { authenticateToken } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { isValidUuid } from '../utils/guards';

const router = Router();

// حارس معرّف المسار: معرّف غير UUID → 404 (لا يصل إلى Prisma)
function validUuidParam(req: Request, res: Response, next: NextFunction) {
  const v = req.params.id ?? '';
  if (!isValidUuid(v)) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } });
    return;
  }
  next();
}

// أنواع العمال — إدارة كاملة (أدمن فقط)
router.get('/worker-types', authenticateToken, requireRoles('hr'), WorkerController.getWorkerTypes);
router.post('/worker-types', authenticateToken, requireRoles('hr'), WorkerController.createWorkerType);
router.patch('/worker-types/:id', authenticateToken, requireRoles('hr'), validUuidParam, WorkerController.updateWorkerType);
router.delete('/worker-types/:id', authenticateToken, requireRoles('hr'), validUuidParam, WorkerController.deleteWorkerType);

// سجل العمال
router.get('/workers', authenticateToken, requireRoles('hr'), WorkerController.listWorkers);
router.get('/workers/:id', authenticateToken, requireRoles('hr'), validUuidParam, WorkerController.getWorker);
router.post('/workers', authenticateToken, requireRoles('hr'), WorkerController.createWorker);
router.patch('/workers/:id', authenticateToken, requireRoles('hr'), validUuidParam, WorkerController.updateWorker);
router.delete('/workers/:id', authenticateToken, requireRoles('hr'), validUuidParam, WorkerController.deleteWorker);

// الرواتب — نظام مالية ديناميكي
router.get('/payroll', authenticateToken, requireRoles('finance', 'hr'), WorkerController.getPayroll);
router.post('/payroll/run', authenticateToken, requireRoles('finance', 'hr'), WorkerController.runPayroll);
router.get('/payroll/overview', authenticateToken, requireRoles('finance', 'hr'), WorkerController.getPayrollOverview);
router.post('/payroll/:id/pay', authenticateToken, requireRoles('finance', 'hr'), validUuidParam, WorkerController.paySalary);
router.post('/payroll/:id/cancel', authenticateToken, requireRoles('finance', 'hr'), validUuidParam, WorkerController.cancelSalary);

export default router;