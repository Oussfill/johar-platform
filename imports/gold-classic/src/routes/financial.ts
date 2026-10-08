import { Router } from 'express';
import * as FinancialController from '../controllers/FinancialController';
import { authenticateToken } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const router = Router();

router.get('/treasury', authenticateToken, requireRoles('finance'), FinancialController.getTreasury);
router.get('/pricing-engine', authenticateToken, requireRoles('finance', 'financeReadOnly'), FinancialController.getPricingEngine);
router.get('/invoices', authenticateToken, requireRoles('finance', 'financeReadOnly'), FinancialController.getInvoices);
router.get('/escrow', authenticateToken, requireRoles('finance'), FinancialController.getEscrowStatus);
router.get('/summary', authenticateToken, requireRoles('finance'), FinancialController.getFinancialSummary);

export default router;
