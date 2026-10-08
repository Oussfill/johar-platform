import { Router } from 'express';
import * as AdminProductController from '../controllers/AdminProductController';
import * as NfcController from '../controllers/NfcController';
import { authenticateToken } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const router = Router();

// Products management
router.get('/products', authenticateToken, requireRoles('admin'), AdminProductController.getProducts);
router.post('/products', authenticateToken, requireRoles('admin'), AdminProductController.createProduct);
router.put('/products/:id', authenticateToken, requireRoles('admin'), AdminProductController.updateProduct);
router.delete('/products/:id', authenticateToken, requireRoles('admin'), AdminProductController.deleteProduct);

// Inquiries
router.get('/inquiries', authenticateToken, requireRoles('admin'), AdminProductController.getInquiries);

// NFC management (قراءة وكتابة وقفل البطاقات)
router.get('/nfc/stats', authenticateToken, requireRoles('admin'), NfcController.getNfcStats);
router.get('/nfc/cards', authenticateToken, requireRoles('admin'), NfcController.getNfcCards);
router.get('/nfc/read/:uid', authenticateToken, requireRoles('admin'), NfcController.readNfcCard);
router.post('/nfc/write', authenticateToken, requireRoles('admin'), NfcController.writeNfcCard);
router.post('/nfc/lock/:uid', authenticateToken, requireRoles('admin'), NfcController.lockNfcCard);
router.get('/nfc/history/:uid', authenticateToken, requireRoles('admin'), NfcController.getNfcHistory);

export default router;