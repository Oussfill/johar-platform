import { Router } from 'express';
import { listVaults, getVaultDetails, listWarehouses } from '../controllers/VaultController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/warehouses', authenticateToken, listWarehouses);
router.get('/', authenticateToken, listVaults);
router.get('/:vault_id', authenticateToken, getVaultDetails);

export default router;
