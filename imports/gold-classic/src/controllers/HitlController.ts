// ============================================================================
// JOHAR — HITL CONTROLLER (Human-in-the-Loop §26)
// ============================================================================
// AI → توصية → اعتماد بشري/Mختبر → قرار → ERP → إثبات. كل قرار حساس تنفذه
// منصّة فقط (compliance:review, scope platform) ويُدوَّن CRITICAL + إثبات.

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { writeErpAudit } from '../services/erp/ErpHelpers';
import { sha256Hash } from '../utils/crypto';
import { isValidUuid } from '../utils/guards';

const VALID_DECISIONS = ['APPROVED', 'REJECTED', 'ESCALATED', 'FLAGGED', 'BLOCKED'];
const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'ESCALATED'];

/// يكتب إثبات البلوكشين (سجل فقط — Tamper-Evident Evidence Layer)
async function writeHitlEvidence(assetId: string, payload: Record<string, any>) {
  try {
    const evidenceHash = sha256Hash(JSON.stringify(payload));
    await prisma.blockchainEvidence.create({
      data: {
        assetId,
        eventType: 'AI_DECISION_HITL',
        evidenceData: payload as Prisma.InputJsonValue,
        previousHash: 'GENESIS',
        currentHash: evidenceHash,
        sourceSystem: 'HITL',
        sourceAction: 'REVIEW_DECISION',
      },
    });
  } catch (error: any) {
    logger.error('writeHitlEvidence failed', { error: error.message });
  }
}

/// GET /api/v1/ai/results — قائمة نتائج AI (قابلة للتصفية بحالة المراجعة)
export async function listAnalysisResults(req: Request, res: Response) {
  const status = String(req.query.status ?? 'PENDING').toUpperCase();
  const analysisType = String(req.query.analysisType ?? '');
  const limit = Math.min(100, Number(req.query.limit ?? 50) || 50);
  const offset = Math.max(0, Number(req.query.offset ?? 0) || 0);
  try {
    if (status !== 'ALL' && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: `status must be one of: ALL, ${VALID_STATUSES.join(', ')}` } });
    }
    const where: Prisma.AiAnalysisResultWhereInput = {
      ...(status !== 'ALL' ? { humanReviewStatus: status as Prisma.EnumHumanReviewStatusFilter['equals'] } : {}),
      ...(analysisType ? { analysisType: analysisType as any } : {}),
    };
    const [total, rows] = await Promise.all([
      prisma.aiAnalysisResult.count({ where }),
      prisma.aiAnalysisResult.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
        include: { asset: { select: { goldId: true, productType: true, status: true } } },
      }),
    ]);
    return res.json({ success: true, data: { total, pending: await prisma.aiAnalysisResult.count({ where: { humanReviewStatus: 'PENDING' } }), results: rows } });
  } catch (error: any) {
    logger.error('listAnalysisResults failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// GET /api/v1/ai/results/:id — تفاصيل نتيجة
export async function getAnalysisResult(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!isValidUuid(id)) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'AI analysis result not found' } });
    const row = await prisma.aiAnalysisResult.findUnique({
      where: { id: req.params.id },
      include: { asset: { select: { goldId: true, productType: true, status: true, metalType: true } } },
    });
    if (!row) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'AI analysis result not found' } });
    return res.json({ success: true, data: row });
  } catch (error: any) {
    logger.error('getAnalysisResult failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/ai/results/:id/review — قرار بشري صريح (compliance:review, منصة)
export async function reviewAnalysisResult(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const decision = String(req.body.decision ?? '').toUpperCase();
  const notes = String(req.body.notes ?? '');
  try {
    if (!VALID_DECISIONS.includes(decision)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: `decision must be one of: ${VALID_DECISIONS.join(', ')}` } });
    }
    const row = await prisma.aiAnalysisResult.findUnique({ where: { id: req.params.id } });
    if (!row) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'AI analysis result not found' } });
    if (row.reviewedAt) {
      return res.status(409).json({ success: false, error: { code: 'HITL_ALREADY_REVIEWED', message: 'This result already reviewed' } });
    }

    const status = decision === 'APPROVED' ? 'APPROVED' : decision === 'REJECTED' ? 'REJECTED' : 'ESCALATED';
    const reviewed = await prisma.aiAnalysisResult.update({
      where: { id: row.id },
      data: { humanReviewStatus: status as any, reviewDecision: decision as any, reviewedBy: userId, reviewedAt: new Date(), reviewNotes: notes || null },
    });
    await writeErpAudit({
      userId, action: 'HITL_RESULT_REVIEW', entityType: 'AiAnalysisResult', entityId: row.id,
      description: `Human decision on AI ${row.analysisType}: ${decision} for asset ${row.assetId}`,
      oldValues: { confidence: row.confidenceScore, recommendation: row.recommendation },
      newValues: { decision, status, notes }, req, severity: 'CRITICAL',
    });
    await writeHitlEvidence(row.assetId, {
      asset_id: row.assetId,
      analysis_type: row.analysisType,
      model_version: row.modelVersion,
      confidence: row.confidenceScore,
      decision,
      reviewed_by: userId,
      notes,
      timestamp: new Date().toISOString(),
    });
    return res.json({ success: true, data: reviewed });
  } catch (error: any) {
    logger.error('reviewAnalysisResult failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// GET /api/v1/ai/fraud — طابور مراجعة الاحتيال (المعلقة فقط)
export async function listFraudQueue(req: Request, res: Response) {
  const status = String(req.query.status ?? 'PENDING').toUpperCase();
  const limit = Math.min(100, Number(req.query.limit ?? 50) || 50);
  const offset = Math.max(0, Number(req.query.offset ?? 0) || 0);
  try {
    const where: Prisma.AiFraudLogWhereInput = status !== 'ALL'
      ? { humanReviewStatus: status as Prisma.EnumHumanReviewStatusFilter['equals'] }
      : {};
    const [total, rows] = await Promise.all([
      prisma.aiFraudLog.count({ where }),
      prisma.aiFraudLog.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
        include: { asset: { select: { goldId: true, productType: true, status: true } } },
      }),
    ]);
    return res.json({ success: true, data: { total, queue: rows } });
  } catch (error: any) {
    logger.error('listFraudQueue failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/// POST /api/v1/ai/fraud/:id/review — قرار بشري على سجل احتيال (compliance:review)
export async function reviewFraudLog(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const decision = String(req.body.decision ?? '').toUpperCase();
  const notes = String(req.body.notes ?? '');
  const resolved = req.body.resolved === true;
  try {
    if (!VALID_DECISIONS.includes(decision)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: `decision must be one of: ${VALID_DECISIONS.join(', ')}` } });
    }
    const row = await prisma.aiFraudLog.findUnique({ where: { id: req.params.id } });
    if (!row) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'AI fraud log not found' } });
    if (row.reviewedAt) {
      return res.status(409).json({ success: false, error: { code: 'HITL_ALREADY_REVIEWED', message: 'This fraud log already reviewed' } });
    }

    const status = decision === 'APPROVED' ? 'APPROVED' : decision === 'REJECTED' ? 'REJECTED' : 'ESCALATED';
    const reviewed = await prisma.aiFraudLog.update({
      where: { id: row.id },
      data: {
        humanReviewStatus: status as any,
        reviewDecision: decision as any,
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes: notes || null,
        isResolved: resolved || decision === 'REJECTED' || decision === 'BLOCKED',
        ...(resolved || decision === 'REJECTED' || decision === 'BLOCKED' ? { resolvedAt: new Date(), actionTaken: `HITL: ${decision}` } : {}),
      },
    });
    await writeErpAudit({
      userId, action: 'HITL_FRAUD_REVIEW', entityType: 'AiFraudLog', entityId: row.id,
      description: `Human decision on fraud log ${row.anomalyType} (risk ${row.riskScore}): ${decision}`,
      oldValues: { riskScore: row.riskScoreNumeric, anomalyType: row.anomalyType },
      newValues: { decision, status, notes, resolved }, req, severity: 'CRITICAL',
    });
    await writeHitlEvidence(row.assetId, {
      asset_id: row.assetId,
      anomaly_type: row.anomalyType,
      risk_score: row.riskScoreNumeric,
      decision,
      reviewed_by: userId,
      notes,
      timestamp: new Date().toISOString(),
    });
    return res.json({ success: true, data: reviewed });
  } catch (error: any) {
    logger.error('reviewFraudLog failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}