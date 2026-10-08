// ============================================================================
// GOLD PLATFORM â€” ASSET ROUTES
// ============================================================================
// Ù…Ø³Ø§Ø±Ø§Øª API Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£ØµÙˆÙ„ Ø§Ù„Ø°Ù‡Ø¨ÙŠØ© ÙˆØ§Ù„Ù…Ø¹Ø§Ø¯Ù† Ø§Ù„Ø«Ù…ÙŠÙ†Ø©

import { Router } from 'express';
import {
  registerAsset,
  verifyAssetPublic,
  getAssetByGoldId,
  listAssets,
  updateAssetStatus,
  mergeAssets,
  splitAsset,
} from '../controllers/AssetController';
import {
  validateRequest,
  assetRegistrationSchema,
  mergeAssetsSchema,
  splitAssetsSchema,
} from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { authz } from '../middleware/authorize';

const router = Router();

/**
 * POST /api/v1/assets/register
 * ØªØ³Ø¬ÙŠÙ„ Ø£ØµÙ„ Ø¬Ø¯ÙŠØ¯ ÙÙŠ Ø§Ù„Ù†Ø¸Ø§Ù…
 *
 * ÙŠØªØ·Ù„Ø¨ Ù…ØµØ§Ø¯Ù‚Ø© ÙˆØµÙ„Ø§Ø­ÙŠØ©: assets:register
 * Ø®Ø·ÙˆØ§Øª Ø§Ù„ØªØ³Ø¬ÙŠÙ„:
 *   1. Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø¹Ø¯Ù… ØªÙƒØ±Ø§Ø± Ø§Ù„Ø±Ù‚Ù… Ø§Ù„ØªØ³Ù„Ø³Ù„ÙŠ
 *   2. ØªÙˆÙ„ÙŠØ¯ Gold ID ÙØ±ÙŠØ¯
 *   3. Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù‡ÙˆÙŠØ© Ø§Ù„Ø±Ù‚Ù…ÙŠØ© (Layer 03)
 *   4. Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø¬ÙˆØ§Ø² Ø§Ù„Ø±Ù‚Ù…ÙŠ (Layer 04)
 *   5. ØªØ³Ø¬ÙŠÙ„ ÙÙŠ ERP (Layer 05)
 *   6. ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¥Ø«Ø¨Ø§Øª Ø¹Ù„Ù‰ Ø§Ù„Ø¨Ù„ÙˆÙƒØªØ´ÙŠÙ† (Layer 07)
 */
router.post(
  '/register',
  authenticateToken,
  authz('product:create', { scope: 'platform' }),
  validateRequest(assetRegistrationSchema, 'body'),
  registerAsset,
);

/**
 * GET /api/v1/assets/verify/:passport_id
 * Ø§Ù„ØªØ­Ù‚Ù‚ Ø§Ù„Ø¹Ø§Ù… Ù…Ù† Ø£ØµØ§Ù„Ø© Ø§Ù„Ø£ØµÙ„ (ÙˆØ§Ø¬Ù‡Ø© Ø§Ù„Ù…Ø³ØªÙ‡Ù„Ùƒ)
 *
 * Ù„Ø§ ÙŠØªØ·Ù„Ø¨ Ù…ØµØ§Ø¯Ù‚Ø© â€” ÙˆØ§Ø¬Ù‡Ø© Ø¹Ø§Ù…Ø© Ø¹Ù†Ø¯ Ù…Ø³Ø­ NFC/QR
 * ÙŠÙØ±Ø¬Ø¹: Ø§Ù„Ø¬ÙˆØ§Ø² Ø§Ù„Ø±Ù‚Ù…ÙŠ + Ø³Ù„Ø³Ù„Ø© Ø§Ù„ØªÙˆØ±ÙŠØ¯ + Ù†ØªØ§Ø¦Ø¬ Ø§Ù„ÙØ­Øµ + Ø§Ù„ØªÙˆÙ‚ÙŠØ¹ Ø§Ù„Ø±Ù‚Ù…ÙŠ
 */
router.get('/verify/:passport_id', verifyAssetPublic);

/**
 * GET /api/v1/assets/gold/:gold_id
 * Ø¬Ù„Ø¨ ØªÙØ§ØµÙŠÙ„ Ø£ØµÙ„ Ø¨Ø§Ù„Ù€ Gold ID
 *
 * ÙŠØªØ·Ù„Ø¨ Ù…ØµØ§Ø¯Ù‚Ø© ÙˆØµÙ„Ø§Ø­ÙŠØ©: assets:read
 */
router.get(
  '/gold/:gold_id',
  authenticateToken,
  authz('product:read', { scope: 'platform' }),
  getAssetByGoldId,
);

/**
 * GET /api/v1/assets
 * Ù‚Ø§Ø¦Ù…Ø© Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø£ØµÙˆÙ„ Ù…Ø¹ Ø§Ù„ØªØµÙÙŠØ© ÙˆØ§Ù„Ø¨Ø­Ø«
 *
 * ÙŠØªØ·Ù„Ø¨ Ù…ØµØ§Ø¯Ù‚Ø© ÙˆØµÙ„Ø§Ø­ÙŠØ©: assets:read
 * ÙŠØ¯Ø¹Ù…: pagination, filter by metalType, status, karat
 */
router.get(
  '/',
  authenticateToken,
  authz('product:read', { scope: 'platform' }),
  listAssets,
);

/**
 * POST /api/v1/assets/merge
 * Ø¯Ù…Ø¬ Ø¹Ø¯Ø© Ø£ØµÙˆÙ„ ÙÙŠ Ø£ØµÙ„ ÙˆØ§Ø­Ø¯ (Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„Ø¥ØºÙ„Ø§Ù‚) Ù…Ø¹ Ø§Ù„Ø­ÙØ§Ø¸ Ø¹Ù„Ù‰ Ù…Ø¨Ø¯Ø£ Ø§Ù„Ø­ÙØ¸
 *
 * ÙŠØªØ·Ù„Ø¨ Ù…ØµØ§Ø¯Ù‚Ø© ÙˆØµÙ„Ø§Ø­ÙŠØ©: assets:update
 */
router.post(
  '/merge',
  authenticateToken,
  authz('product:update', { scope: 'platform' }),
  validateRequest(mergeAssetsSchema, 'body'),
  mergeAssets,
);

/**
 * POST /api/v1/assets/:asset_id/split
 * ØªÙ‚Ø³ÙŠÙ… Ø£ØµÙ„ ÙˆØ§Ø­Ø¯ Ø¥Ù„Ù‰ Ø¹Ø¯Ø© Ø£ØµÙˆÙ„ Ù…Ø¹ Ø§Ù„Ø­ÙØ§Ø¸ Ø¹Ù„Ù‰ Ù…Ø¨Ø¯Ø£ Ø§Ù„Ø­ÙØ¸
 *
 * ÙŠØªØ·Ù„Ø¨ Ù…ØµØ§Ø¯Ù‚Ø© ÙˆØµÙ„Ø§Ø­ÙŠØ©: assets:update
 */
router.post(
  '/:asset_id/split',
  authenticateToken,
  authz('product:update', { scope: 'platform' }),
  validateRequest(splitAssetsSchema, 'body'),
  splitAsset,
);

/**
 * PATCH /api/v1/assets/:asset_id/status
 * ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ø§Ù„Ø£ØµÙ„
 *
 * ÙŠØªØ·Ù„Ø¨ Ù…ØµØ§Ø¯Ù‚Ø© ÙˆØµÙ„Ø§Ø­ÙŠØ©: assets:update
 */
router.patch(
  '/:asset_id/status',
  authenticateToken,
  authz('product:update', { scope: 'platform' }),
  updateAssetStatus,
);

export default router;
