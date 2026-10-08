// ============================================================================
// GOLD PLATFORM — STATISTICS CONTROLLER
// ============================================================================
// وحدة التحكم في التحليل الإحصائي — نقطة الخدمة خلف قسم "SPSS"

import { Request, Response } from 'express';
import { Language, Currency } from '@prisma/client';
import { logger } from '../config/logger';
import {
  descriptiveStats,
  independentTTest,
  oneWayAnova,
  pearsonCorrelation,
  linearRegression,
  cronbachAlpha,
} from '../services/StatisticsService';

type StatTest =
  | 'descriptive'
  | 't-test'
  | 'anova'
  | 'correlation'
  | 'regression'
  | 'cronbach';

// ============================================================================
// POST /api/v1/stats/analyze — تشغيل اختبار إحصائي
// ============================================================================

export async function analyzeStats(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const { test, data, alpha } = (req as any).validatedData as {
      test: StatTest;
      data: Record<string, any>;
      alpha: number;
    };
    const alphaValue = alpha ?? 0.05;

    let result: any = null;

    switch (test) {
      case 'descriptive': {
        const r = descriptiveStats(data.data as number[]);
        if (!r) {
          res.status(400).json({
            success: false,
            error: { code: 'INSUFFICIENT_DATA', message: 'At least one numeric value is required' },
            meta: { language: lang, currency, timestamp: new Date().toISOString() },
          });
          return;
        }
        result = r;
        break;
      }
      case 't-test': {
        const r = independentTTest(data.groupA as number[], data.groupB as number[], alphaValue);
        if (!r) {
          res.status(400).json({
            success: false,
            error: { code: 'INSUFFICIENT_DATA', message: 'Both groups must have at least 2 values' },
            meta: { language: lang, currency, timestamp: new Date().toISOString() },
          });
          return;
        }
        result = r;
        break;
      }
      case 'anova': {
        const r = oneWayAnova((data.groups as number[][]) ?? [], alphaValue);
        if (!r) {
          res.status(400).json({
            success: false,
            error: { code: 'INSUFFICIENT_DATA', message: 'At least 2 non-empty groups are required' },
            meta: { language: lang, currency, timestamp: new Date().toISOString() },
          });
          return;
        }
        result = r;
        break;
      }
      case 'correlation': {
        const r = pearsonCorrelation(data.x as number[], data.y as number[], alphaValue);
        if (!r) {
          res.status(400).json({
            success: false,
            error: { code: 'INSUFFICIENT_DATA', message: 'X and Y must have ≥3 matching pairs' },
            meta: { language: lang, currency, timestamp: new Date().toISOString() },
          });
          return;
        }
        result = r;
        break;
      }
      case 'regression': {
        const r = linearRegression(data.x as number[], data.y as number[], alphaValue);
        if (!r) {
          res.status(400).json({
            success: false,
            error: { code: 'INSUFFICIENT_DATA', message: 'X and Y must have ≥3 matching pairs' },
            meta: { language: lang, currency, timestamp: new Date().toISOString() },
          });
          return;
        }
        result = r;
        break;
      }
      case 'cronbach': {
        const r = cronbachAlpha((data.items as number[][]) ?? []);
        if (!r) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_DATA',
              message: 'At least 2 items with equal respondent counts are required',
            },
            meta: { language: lang, currency, timestamp: new Date().toISOString() },
          });
          return;
        }
        result = r;
        break;
      }
      default: {
        res.status(400).json({
          success: false,
          error: { code: 'UNKNOWN_TEST', message: `Unsupported test: ${test}` },
          meta: { language: lang, currency, timestamp: new Date().toISOString() },
        });
        return;
      }
    }

    logger.info('Statistics analysis completed', {
      test,
      by: (req as any).userId,
    });

    res.json({
      success: true,
      data: {
        test,
        alpha: alphaValue,
        result,
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Statistics analysis failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ANALYSIS_FAILED', message: 'Failed to run statistical analysis' },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}