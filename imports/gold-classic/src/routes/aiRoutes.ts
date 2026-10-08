// ============================================================================
// GOLD PLATFORM — AI ROUTES
// ============================================================================
// مسارات API لمحركات الذكاء الاصطناعي

import { Router } from 'express';
import { analyseJewellery, fraudCheck } from '../controllers/AIController';
import {
  listAnalysisResults,
  getAnalysisResult,
  reviewAnalysisResult,
  listFraudQueue,
  reviewFraudLog,
} from '../controllers/HitlController';
import { validateRequest, aiJewelleryAnalysisSchema } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { authz } from '../middleware/authorize';

const router = Router();

/**
 * POST /api/v1/ai/analyze-jewellery
 * تحليل المجوهرات بالذكاء الاصطناعي
 *
 * يتطلب مصادقة وصلاحية: ai:analyze
 * المدخلات: نوع المعدن + الوزن + karat + الصور (اختياري) + الأحجار الكريمة (اختياري)
 * المخرجات: تقييم القيمة + تفكيك السعر + توصيات + AI Disclaimer
 */
router.post(
  '/analyze-jewellery',
  authenticateToken,
  authz('product:classify', { scope: 'platform' }),
  validateRequest(aiJewelleryAnalysisSchema, 'body'),
  analyseJewellery,
);

/**
 * POST /api/v1/ai/fraud-check
 * فحص الاحتيال الشامل لأصل معين
 *
 * يتطلب مصادقة وصلاحية: ai:fraud-check
 * المدخلات: معرّف الأصل (assetId)
 * المخرجات: درجة الخطورة + الشذوذات المكتشفة + التوصيات
 */
router.post(
  '/fraud-check',
  authenticateToken,
  authz('compliance:read', { scope: 'platform' }),
  fraudCheck,
);

// ============================================================================
// HITL (§26) — اعتماد بشري صريح لنتائج AI (compliance:review, منصة)
// ============================================================================

/**
 * GET /api/v1/ai/results?status=PENDING
 * طابور نتائج AI بانتظار مراجعة بشرية
 */
router.get(
  '/results',
  authenticateToken,
  authz('compliance:review', { scope: 'platform' }),
  listAnalysisResults,
);

/**
 * GET /api/v1/ai/results/:id
 * تفاصيل نتيجة AI
 */
router.get(
  '/results/:id',
  authenticateToken,
  authz('compliance:review', { scope: 'platform' }),
  getAnalysisResult,
);

/**
 * POST /api/v1/ai/results/:id/review
 * قرار بشري صريح: APPROVED | REJECTED | ESCALATED | FLAGGED | BLOCKED + ملاحظات
 */
router.post(
  '/results/:id/review',
  authenticateToken,
  authz('compliance:review', { scope: 'platform' }),
  reviewAnalysisResult,
);

/**
 * GET /api/v1/ai/fraud?status=PENDING
 * طابور مراجعة سجلات الاحتيال
 */
router.get(
  '/fraud',
  authenticateToken,
  authz('compliance:review', { scope: 'platform' }),
  listFraudQueue,
);

/**
 * POST /api/v1/ai/fraud/:id/review
 * قرار بشري على سجل احتيال + إغلاق/اعتماد
 */
router.post(
  '/fraud/:id/review',
  authenticateToken,
  authz('compliance:review', { scope: 'platform' }),
  reviewFraudLog,
);

export default router;
