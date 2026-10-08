// ============================================================================
// JOHAR — TRUST ROUTES (المستويات المعيارية §12 — Levels 4–6)
// ============================================================================
// الترقية الصاعدة للمؤسسات: طلب من العضو (trust:apply)، اعتماد منصّة (trust:evaluate).
// مزايا البوابة (Tier 4 / Tier 6) تُثبت عبر endpoints صريحة لقراءة الحقوق.

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { authz } from '../middleware/authorize';
import {
  getTrustStatus,
  applyTrustFactor,
  approveTrustFactor,
  rejectTrustFactor,
  getTrustedNetwork,
  getPremiumCertified,
} from '../controllers/TrustController';

const router = Router();

// حالة ثقة المؤسسة + قائمة العوامل (trust:view)
router.get('/status', authenticateToken, authz('trust:view', { scope: 'org' }), getTrustStatus);

// طلب ترقية عامل — التقدم متسلسل (trust:apply)
router.post('/apply', authenticateToken, authz('trust:apply', { scope: 'org' }), applyTrustFactor);

// ميزات بوابة الثقة: أصحابها فقط يصلون إلى المضبط
router.get('/entitlements/trusted-network', authenticateToken, authz('supplier:trustedNetwork', { scope: 'org' }), getTrustedNetwork);
router.get('/entitlements/premium-certified', authenticateToken, authz('product:premiumCertified', { scope: 'org' }), getPremiumCertified);

// قرارات الاعتماد — أهلية منصّة فقط (trust:evaluate) — تُدوَّن CRITICAL
router.post('/:orgId/factors/:factor/approve', authenticateToken, authz('trust:evaluate', { scope: 'platform' }), approveTrustFactor);
router.post('/:orgId/factors/:factor/reject', authenticateToken, authz('trust:evaluate', { scope: 'platform' }), rejectTrustFactor);

export default router;