import { Router } from 'express';
import * as DigitalIdentityController from '../controllers/DigitalIdentityController';
import { authenticateToken } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const router = Router();

router.get('/passports', authenticateToken, requireRoles('identity'), DigitalIdentityController.getDigitalPassports);
router.get('/nfc-status', authenticateToken, requireRoles('identity'), DigitalIdentityController.getNFCStatus);
router.get('/passport/:goldId', authenticateToken, requireRoles('identity'), DigitalIdentityController.getPassportDetails);
router.get('/qr-status', authenticateToken, requireRoles('identity'), DigitalIdentityController.getQRCodeStatus);

export default router;
