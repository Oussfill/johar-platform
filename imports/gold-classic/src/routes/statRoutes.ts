// ============================================================================
// GOLD PLATFORM — STATISTICS ROUTES
// ============================================================================

import { Router } from 'express';
import { analyzeStats } from '../controllers/StatController';
import { getVaaReport } from '../controllers/VaaController';
import { authenticateToken } from '../middleware/auth';
import { authz } from '../middleware/authorize';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// ─── schemas ────────────────────────────────────────────────────────────────
const numberArray = z.array(z.coerce.number()).min(1);
const nestedNumberArray = z.array(z.array(z.coerce.number()).min(1)).min(2);

const descriptiveSchema = z.object({
  test: z.literal('descriptive'),
  data: z.object({ data: numberArray }),
  alpha: z.number().min(0.001).max(0.5).optional(),
});
const ttestSchema = z.object({
  test: z.literal('t-test'),
  data: z.object({ groupA: numberArray.min(2), groupB: numberArray.min(2) }),
  alpha: z.number().min(0.001).max(0.5).optional(),
});
const anovaSchema = z.object({
  test: z.literal('anova'),
  data: z.object({ groups: nestedNumberArray }),
  alpha: z.number().min(0.001).max(0.5).optional(),
});
const corrSchema = z.object({
  test: z.literal('correlation'),
  data: z.object({ x: numberArray.min(3), y: numberArray.min(3) }),
  alpha: z.number().min(0.001).max(0.5).optional(),
});
const regressionSchema = z.object({
  test: z.literal('regression'),
  data: z.object({ x: numberArray.min(3), y: numberArray.min(3) }),
  alpha: z.number().min(0.001).max(0.5).optional(),
});
const cronbachSchema = z.object({
  test: z.literal('cronbach'),
  data: z.object({ items: nestedNumberArray }),
  alpha: z.number().min(0.001).max(0.5).optional(),
});

/**
 * POST /api/v1/stats/analyze
 * تشغيل اختبار إحصائي
 *
 * يتطلب مصادقة وصلاحية: assets:read
 */
router.post(
  '/analyze',
  authenticateToken,
  authz('product:read', { scope: 'platform' }),
  // تحديد الـ schema حسب حقل "test" في الطلب
  (req, res, next) => {
    const { test } = req.body || {};
    const schemas: Record<string, z.ZodTypeAny> = {
      descriptive: descriptiveSchema,
      't-test': ttestSchema,
      anova: anovaSchema,
      correlation: corrSchema,
      regression: regressionSchema,
      cronbach: cronbachSchema,
    };
    const schema = schemas[test];
    if (!schema) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TEST',
          message: `Unknown test "${test}". Valid: descriptive, t-test, anova, correlation, regression, cronbach`,
        },
      });
      return;
    }
    validateRequest(schema, 'body')(req, res, next);
  },
  analyzeStats,
);

/**
 * GET /api/v1/stats/vaa
 * لوحة NORTH STAR §37 — Verified Active Assets + المؤشرات الثانوية
 *
 * يتطلب مصادقة وصلاحية: audit:read (منصّة)
 */
router.get(
  '/vaa',
  authenticateToken,
  authz('audit:read', { scope: 'platform' }),
  getVaaReport,
);

export default router;