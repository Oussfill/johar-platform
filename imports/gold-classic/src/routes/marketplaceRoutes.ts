import { Router } from 'express';
import {
  listMarketplaceItems,
  getMarketplaceItem,
  createListing,
  getMarketplaceStats,
} from '../controllers/MarketplaceController';
import { authenticateToken } from '../middleware/auth';
import { authz } from '../middleware/authorize';

const router = Router();

// Public browsing
router.get('/', listMarketplaceItems);
router.get('/stats', authenticateToken, getMarketplaceStats);
router.get('/:listing_id', getMarketplaceItem);

// Authenticated actions
router.post(
  '/create',
  authenticateToken,
  authz('listing:create', { scope: 'own' }),
  createListing,
);

export default router;
