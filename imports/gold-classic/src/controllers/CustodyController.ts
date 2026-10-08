// ============================================================================
// GOLD PLATFORM — CUSTODY CONTROLLER
// ============================================================================
// Controller لإدارة الخزائن وعمليات النقل مع نظام الاعتماد الثنائي

import { Request, Response } from 'express';
import { Language, Currency, TransferRequestStatus, DualAuthStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { CustodyAndVaultService } from '../services/CustodyAndVaultService';

// ============================================================================
// POST /api/v1/custody/transfer-request — طلب نقل أصل من الخزينة
// ============================================================================

export async function createTransferRequest(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const {
      assetId,
      toEntityId,
      reason,
      estimatedValue,
      valueCurrency,
      priority,
      transportMethod,
    } = (req as any).validatedData;

    const initiatedBy = (req as any).userId;

    // تنفيذ طلب النقل مع تطبيق نظام الاعتماد الثنائي
    const result = await CustodyAndVaultService.createTransferRequest({
      assetId,
      initiatedBy,
      toEntityId,
      reason,
      estimatedValue,
      valueCurrency: valueCurrency as Currency,
      priority,
      transportMethod,
    });

    const messages: Record<Language, Record<string, string>> = {
      AR: {
        PENDING: 'طلب النقل قيد المراجعة — بانتظار الاعتماد الأول',
        FIRST_APPROVED: 'تم الاعتماد الأول — بانتظار الاعتماد الثاني',
        APPROVED: 'تمت الموافقة على طلب النقل — جاهز للتنفيذ',
        REJECTED: 'تم رفض طلب النقل',
      },
      FR: {
        PENDING: 'Demande de transfert en cours de révision — en attente de la première approbation',
        FIRST_APPROVED: 'Première approbation accordée — en attente de la deuxième approbation',
        APPROVED: 'Demande de transfert approuvée — prête pour exécution',
        REJECTED: 'Demande de transfert rejetée',
      },
      EN: {
        PENDING: 'Transfer request under review — awaiting first approval',
        FIRST_APPROVED: 'First approval granted — awaiting second authorization',
        APPROVED: 'Transfer request approved — ready for execution',
        REJECTED: 'Transfer request rejected',
      },
    };

    const statusMessage =
      messages[lang][result.status] || messages[lang]['PENDING'];

    const response: any = {
      success: true,
      data: {
        requestId: result.requestId,
        requiresDualAuth: result.requiresDualAuth,
        status: result.status,
        message: statusMessage,
        dualAuthExplanation: result.requiresDualAuth
          ? {
              ar: 'هذه العملية تتطلب اعتماداً ثنائياً (مبدأ العيون الأربعة) لأن قيمتها تتجاوز الحد المحدد. يجب أن يوافق شخصان مختلفان بشكل مستقل.',
              fr: "Cette opération nécessite une double autorisation (principe des quatre yeux) car sa valeur dépasse le seuil défini. Deux personnes différentes doivent approuver indépendamment.",
              en: 'This operation requires dual authorization (Four-Eyes Principle) because its value exceeds the threshold. Two different persons must independently approve.',
            }
          : null,
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(201).json(response);
  } catch (error: any) {
    logger.error('Transfer request creation failed', { error });

    const errorMsg =
      lang === 'AR'
        ? 'فشل في إنشاء طلب النقل'
        : lang === 'FR'
        ? 'Échec de la création de la demande de transfert'
        : 'Failed to create transfer request';

    res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      error: {
        code: 'TRANSFER_REQUEST_FAILED',
        message: error.message || errorMsg,
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// POST /api/v1/custody/approve — الموافقة على طلب نقل
// ============================================================================

export async function approveTransfer(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const { requestId, approvalNote } = req.body;
    const approverId = (req as any).userId;

    const result = await CustodyAndVaultService.approveTransferRequest({
      requestId,
      approverId,
      approvalNote,
    });

    const messages: Record<Language, Record<string, string>> = {
      AR: {
        APPROVED: 'تمت الموافقة على طلب النقل بنجاح',
        FIRST_APPROVED: 'تم الاعتماد الأول — بانتظار الاعتماد الثاني',
        PENDING_SECOND: 'الاعتماد الثاني مطلوب — بانتظار مراجعة الطرف الثاني',
      },
      FR: {
        APPROVED: 'Demande de transfert approuvée avec succès',
        FIRST_APPROVED: 'Première approbation accordée',
        PENDING_SECOND: 'Deuxième approbation requise',
      },
      EN: {
        APPROVED: 'Transfer request approved successfully',
        FIRST_APPROVED: 'First approval granted',
        PENDING_SECOND: 'Second authorization required',
      },
    };

    const statusMessage =
      messages[lang][result.status] || messages[lang]['APPROVED'];

    const response: any = {
      success: true,
      data: {
        status: result.status,
        message: statusMessage,
        explanation: {
          ar: `الحالة: ${result.status}. ${result.status === 'FIRST_APPROVED' ? 'بانتظار الاعتماد الثاني.' : 'تمت الموافقة الكاملة.'}`,
          fr: `Statut: ${result.status}. ${result.status === 'FIRST_APPROVED' ? 'En attente de la deuxième approbation.' : 'Approbation complète accordée.'}`,
          en: `Status: ${result.status}. ${result.status === 'FIRST_APPROVED' ? 'Awaiting second authorization.' : 'Full approval granted.'}`,
        },
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Transfer approval failed', { error });

    res.status(400).json({
      success: false,
      error: {
        code: 'APPROVAL_FAILED',
        message: error.message || 'Approval failed',
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// GET /api/v1/custody/pending-approvals — الطلبات المعلقة للموافقة
// ============================================================================

export async function getPendingApprovals(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const currency = ((req as any).preferredCurrency as Currency) || Currency.USD;

  try {
    const userId = (req as any).userId;
    const userHierarchy = (req as any).hierarchy;

    // جلب الطلبات التي تحتاج اعتماد من هذا المستخدم
    const pendingRequests = await prisma.custodyTransferRequest.findMany({
      where: {
        OR: [
          { status: 'PENDING', requiresDualAuth: true, firstApproverId: null },
          { status: 'FIRST_APPROVED', requiresDualAuth: true },
        ],
        initiatedById: { not: userId },
      },
      include: {
        asset: {
          select: {
            goldId: true,
            serialNumber: true,
            metalType: true,
            weightGross: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const response: any = {
      success: true,
      data: {
        pendingApprovals: pendingRequests.map((r) => ({
          requestId: r.requestId,
          asset: (r as any).asset,
          status: r.status,
          estimatedValue: r.estimatedValue,
          valueCurrency: r.valueCurrency,
          priority: r.priority,
          reason: r.reason,
          createdAt: r.createdAt,
          requiresMyApproval: userHierarchy >= 4,
        })),
        totalPending: pendingRequests.length,
      },
      meta: {
        language: lang,
        currency,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to fetch pending approvals', { error });
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to retrieve pending approvals' },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}
