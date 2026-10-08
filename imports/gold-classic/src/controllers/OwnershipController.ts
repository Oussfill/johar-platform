// ============================================================================
// GOLD PLATFORM — OWNERSHIP TRANSFER CONTROLLER
// ============================================================================
// Controller لإدارة عملية التمليك الأربعة الخطوات مع فصل الصلاحيات
//
// الخطوات:
// 1. طلب الشراء (الزبون)
// 2. توثيق كاتب العدل (Notary)
// 3. تسليم المفتاح (Notary → الزبون)
// 4. تفعيل السجل الرقمي (الزبون)
//
// مبدأ فصل الصلاحيات:
// - الزبون: يطلب الشراء ويفعّل المفتاح
// - كاتب العدل: يوثق ويصدر المفتاح
// - السجل الرقمي: يتحقق ويُنشئ السجل
// - المراقب: يراقب الامتثال

import { Request, Response } from 'express';
import {
  Language,
  Currency,
  OwnershipStep,
  OwnershipProcessStatus,
  OwnershipKeyStatus,
  DigitalRecordStatus,
} from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { OwnershipKeyService } from '../services/OwnershipKeyService';
import { sha256Hash } from '../utils/crypto';
import { isValidUuid } from '../utils/guards';

// ============================================================================
// دوال مساعدة
// ============================================================================

/**
 * استخراج اللغة والعملية من الطلب
 */
function extractLanguageAndCurrency(req: Request): {
  lang: Language;
  currency: Currency;
} {
  const lang =
    ((req as any).preferredLanguage as Language) || Language.EN;
  const currency =
    ((req as any).preferredCurrency as Currency) || Currency.USD;
  return { lang, currency };
}

/**
 * إنشاء استجابة ناجحة بالتنسيق الموحد
 */
function createSuccessResponse(
  data: any,
  lang: Language,
  currency: Currency,
  meta: Record<string, any> = {},
) {
  return {
    success: true,
    data,
    meta: {
      language: lang,
      currency,
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

// ============================================================================
// الخطوة 1: طلب الشراء — الزبون يطلب شراء الأصل
// ============================================================================

/**
 * POST /api/v1/ownership/request-purchase
 * ─────────────────────────────────────────
 * الزبون يطلب شراء أصل ذهبي
 * الحالة: INITIATED → PURCHASE_SUBMITTED
 * الخطوة: → PURCHASE_REQUEST
 */

export async function requestPurchase(
  req: Request,
  res: Response,
): Promise<void> {
  const { lang, currency } = extractLanguageAndCurrency(req);

  try {
    const { assetId, salePrice, saleCurrency } = req.body as any;
    const customerId = (req as any).userId;

    // حارس المدخلات: مطلوبة (UUID أو goldId عام)
    let resolvedAssetId: string | null = null;
    if (assetId && typeof assetId === 'string' && assetId.trim()) {
      const candidate = assetId.trim();
      if (isValidUuid(candidate)) {
        resolvedAssetId = candidate;
      } else {
        let matched = await prisma.goldAsset.findUnique({
          where: { goldId: candidate },
          select: { id: true },
        });
        if (!matched) {
          matched = await prisma.goldAsset.findFirst({
            where: { goldId: { equals: candidate, mode: 'insensitive' } },
            select: { id: true },
          });
        }
        if (!matched) {
          matched = await prisma.goldAsset.findFirst({
            where: { serialNumber: { equals: candidate, mode: 'insensitive' } },
            select: { id: true },
          });
        }
        if (!matched) {
          matched = await prisma.goldAsset.findFirst({
            where: { manufacturerSerial: { equals: candidate, mode: 'insensitive' } },
            select: { id: true },
          });
        }
        resolvedAssetId = matched?.id ?? null;
      }
    }
    if (!resolvedAssetId) {
      const unrecognizedMessage: Record<Language, string> = {
        AR: 'رقم الأصل غير معروف — استخدم معرّف الذهب (GOLD-…)، أو الرقم التسلسلي (SN-…)، أو المعرّف الداخلي (UUID)',
        FR: "Numéro d'actif inconnu — utilisez l'ID or (GOLD-…), le numéro de série (SN-…) ou l'UUID interne",
        EN: 'Unknown asset number — use goldId (GOLD-…), serial number (SN-…), or internal UUID',
      };
      await prisma.auditLog.create({
        data: {
          userId: customerId,
          action: 'OWNERSHIP_REQUEST_REJECTED',
          entityType: 'ownership_request',
          description: 'Purchase request rejected: assetId not resolvable (missing, invalid, or unknown)',
          newValues: { assetId, salePrice, saleCurrency, lang },
          severity: 'WARNING',
          category: 'OPERATION',
        },
      }).catch(() => undefined);
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION', message: unrecognizedMessage[lang] },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }
    if (salePrice === undefined || salePrice === null || Number.isNaN(Number(salePrice))) {
      await prisma.auditLog.create({
        data: {
          userId: customerId,
          action: 'OWNERSHIP_REQUEST_REJECTED',
          entityType: 'ownership_request',
          description: 'Purchase request rejected: salePrice invalid',
          newValues: { assetId, salePrice, saleCurrency, lang },
          severity: 'WARNING',
          category: 'OPERATION',
        },
      }).catch(() => undefined);
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION', message: 'salePrice is required' },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // التحقق من وجود الأصل
    const asset = await prisma.goldAsset.findUnique({
      where: { id: resolvedAssetId },
      select: { id: true, goldId: true, status: true, originEntityId: true },
    });

    if (!asset) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message:
            lang === Language.AR
              ? 'الأصل المطلوب غير موجود'
              : lang === Language.FR
                ? 'Actif non trouvé'
                : 'Asset not found',
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // توليد معرّف العملية الفريد
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = require('crypto').randomBytes(2).toString('hex').toUpperCase();
    const processId = `OTP-${timestamp}-${random}`;

    // إنشاء عملية التمليك
    const process = await prisma.ownershipTransferProcess.create({
      data: {
        processId,
        assetId: resolvedAssetId,
        customerId,
        salePrice,
        saleCurrency: saleCurrency as Currency,
        currentStep: OwnershipStep.PURCHASE_REQUEST,
        status: OwnershipProcessStatus.PURCHASE_SUBMITTED,
        step1CompletedAt: new Date(),
      },
    });

    // إنشاء سجل الضمان المالي
    const escrowCode = `ESC-${Date.now().toString(36).toUpperCase()}`;
    const platformFee = Number(salePrice) * 0.025; // 2.5% platform fee

    const escrow = await prisma.escrowLedger.create({
      data: {
        escrowCode,
        processId: process.id,
        buyerId: customerId,
        sellerId: asset.originEntityId || customerId, // fallback
        holdAmount: salePrice,
        holdCurrency: saleCurrency as Currency,
        platformFee,
        status: 'HOLD',
        heldAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // تسجيل حدث الحجز
    await prisma.escrowEvent.create({
      data: {
        escrowId: escrow.id,
        eventType: 'HOLD_placed',
        amount: salePrice,
        currency: saleCurrency as Currency,
        performedBy: customerId,
        notes: 'Escrow hold placed on purchase request',
      },
    });

    logger.info('Purchase request submitted', {
      processId: process.processId,
      customerId,
      assetId,
      salePrice,
      escrowCode: escrow.escrowCode,
    });

    const messages: Record<Language, string> = {
      AR: 'تم تقديم طلب الشراء بنجاح — بانتظار توثيق كاتب العدل',
      FR: "Demande d'achat soumise avec succès — en attente de la certification du notaire",
      EN: 'Purchase request submitted successfully — awaiting notary certification',
    };

    res.status(201).json(
      createSuccessResponse(
        {
          processId: process.processId,
          assetId,
          salePrice,
          saleCurrency,
          status: process.status,
          currentStep: process.currentStep,
          escrow: {
            escrowCode: escrow.escrowCode,
            holdAmount: escrow.holdAmount,
            holdCurrency: escrow.holdCurrency,
            platformFee: escrow.platformFee,
            status: escrow.status,
            heldAt: escrow.heldAt,
            expiresAt: escrow.expiresAt,
          },
          message: messages[lang],
        },
        lang,
        currency,
      ),
    );
  } catch (error) {
    logger.error('Failed to submit purchase request', {
      error: error instanceof Error ? error.message : 'Unknown error',
      customerId: (req as any).userId,
    });

    const messages: Record<Language, string> = {
      AR: 'حدث خطأ أثناء تقديم طلب الشراء',
      FR: "Erreur lors de la soumission de la demande d'achat",
      EN: 'Failed to submit purchase request',
    };

    res.status(500).json({
      success: false,
      error: {
        code: 'PURCHASE_REQUEST_FAILED',
        message: messages[lang],
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// الخطوة 2: توثيق كاتب العدل — إصدار المفتاح
// ============================================================================

/**
 * POST /api/v1/ownership/certify-notary
 * ──────────────────────────────────────
 * كاتب العدل يوثق الصفقة ويُصدر المفتاح
 * الحالة: PURCHASE_SUBMITTED → KEY_ISSUED
 * الخطوة: → KEY_ISSUANCE
 */

export async function certifyNotary(
  req: Request,
  res: Response,
): Promise<void> {
  const { lang, currency } = extractLanguageAndCurrency(req);

  try {
    const { processId, contractDocumentHash, saleAgreementHash, witnessSignatures } =
      req.body;
    const notaryUserId = (req as any).userId;

    // 1. التحقق من وجود حساب كاتب العدل ونشاطه
    const notaryAccount = await prisma.notaryAccount.findUnique({
      where: { userId: notaryUserId },
      select: {
        id: true,
        userId: true,
        isActive: true,
        isSuspended: true,
        licenseExpiry: true,
      },
    });

    if (!notaryAccount) {
      res.status(403).json({
        success: false,
        error: {
          code: 'NOTARY_ACCOUNT_NOT_FOUND',
          message:
            lang === Language.AR
              ? 'حساب كاتب العدل غير موجود'
              : lang === Language.FR
                ? 'Compte de notaire non trouvé'
                : 'Notary account not found',
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    if (!notaryAccount.isActive || notaryAccount.isSuspended) {
      res.status(403).json({
        success: false,
        error: {
          code: 'NOTARY_ACCOUNT_INACTIVE',
          message:
            lang === Language.AR
              ? 'حساب كاتب العدل غير نشط أو معلّق'
              : lang === Language.FR
                ? 'Compte de notaire inactif ou suspendu'
                : 'Notary account is inactive or suspended',
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // التحقق من انتهاء الصلاحية
    if (new Date(notaryAccount.licenseExpiry) < new Date()) {
      res.status(403).json({
        success: false,
        error: {
          code: 'NOTARY_LICENSE_EXPIRED',
          message:
            lang === Language.AR
              ? 'رخصة كاتب العدل منتهية الصلاحية'
              : lang === Language.FR
                ? 'Licence de notaire expirée'
                : 'Notary license has expired',
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // 2. البحث عن عملية التمليك
    const process = await prisma.ownershipTransferProcess.findUnique({
      where: { processId },
    });

    if (!process) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PROCESS_NOT_FOUND',
          message:
            lang === Language.AR
              ? 'عملية التمليك غير موجودة'
              : lang === Language.FR
                ? 'Processus de propriété non trouvé'
                : 'Ownership process not found',
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // التحقق من حالة العملية
    if (process.status !== OwnershipProcessStatus.PURCHASE_SUBMITTED) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROCESS_STATUS',
          message:
            lang === Language.AR
              ? 'حالة العملية غير صالحة للتوثيق'
              : lang === Language.FR
                ? 'Statut du processus non valide pour la certification'
                : 'Process status is not valid for certification',
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // 3. التحقق من فصل الصلاحيات: الزبون لا يمكن أن يكون كاتب العدل
    if (process.customerId === notaryUserId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'SOD_VIOLATION',
          message:
            lang === Language.AR
              ? ' violation مبدأ فصل الصلاحيات: الزبون لا يمكن أن يكون كاتب العدل لنفسه'
              : lang === Language.FR
                ? "Violation du principe de séparation des fonctions : le client ne peut pas être notaire pour lui-même"
                : 'Separation of Duties violation: customer cannot be notary for themselves',
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // 4. توليد مفتاح التمليك
    const keyResult = await OwnershipKeyService.generateOwnershipKey(
      process.id,
      process.customerId,
      process.assetId,
    );

    // 5. إنشاء سجل التوثيق
    const legalCertHash = sha256Hash(
      `${contractDocumentHash}|${saleAgreementHash}|${notaryAccount.id}|${Date.now()}`,
    );

    const notaryRecord = await prisma.notaryRecord.create({
      data: {
        processId: process.id,
        notaryId: notaryAccount.id,
        contractDocumentHash,
        saleAgreementHash,
        witnessSignatures: witnessSignatures || [],
        keyGeneratedForOwner: true,
        keyHandoverMethod: 'DIGITAL_SECURED',
        keyHandoverTimestamp: new Date(),
        legalCertificationHash: legalCertHash,
        certifiedAt: new Date(),
      },
    });

    // 6. إنشاء سجل المفتاح الرقمي
    await prisma.ownershipKey.create({
      data: {
        processId: process.id,
        keyHash: keyResult.keyHash,
        keyPrefix: keyResult.keyPrefix,
        encryptedPayload: keyResult.encryptedPayload,
        iv: keyResult.iv,
        authTag: keyResult.authTag,
        status: OwnershipKeyStatus.ISSUED_TO_OWNER,
        generatedAt: new Date(),
        issuedAt: new Date(),
        ownerId: process.customerId,
      },
    });

    // 7. تحديث حالة العملية
    const updatedProcess = await prisma.ownershipTransferProcess.update({
      where: { id: process.id },
      data: {
        status: OwnershipProcessStatus.KEY_ISSUED,
        currentStep: OwnershipStep.KEY_ISSUANCE,
        notaryId: notaryAccount.id,
        contractHash: legalCertHash,
        step2CompletedAt: new Date(),
      },
    });

    // 8. تحديث إحصائيات كاتب العدل
    await prisma.notaryAccount.update({
      where: { id: notaryAccount.id },
      data: {
        totalCertifications: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });

    // تحديث حالة الضمان: HOLD → HELD
    await prisma.escrowLedger.update({
      where: { processId: process.id },
      data: { status: 'HELD' },
    });

    const escrow = await prisma.escrowLedger.findUnique({
      where: { processId: process.id },
    });

    if (escrow) {
      await prisma.escrowEvent.create({
        data: {
          escrowId: escrow.id,
          eventType: 'HOLD_confirmed',
          amount: escrow.holdAmount,
          currency: escrow.holdCurrency,
          performedBy: notaryAccount.userId,
          notes: 'Notary certification complete — escrow confirmed',
        },
      });
    }

    logger.info('Notary certification completed', {
      processId,
      notaryId: notaryAccount.id,
      keyPrefix: keyResult.keyPrefix,
    });

    const messages: Record<Language, string> = {
      AR: 'تم التوثيق بنجاح — تم إصدار المفتاح للزبون',
      FR: 'Certification réussie — Clé émise au propriétaire',
      EN: 'Certification completed — Key issued to owner',
    };

    res.status(200).json(
      createSuccessResponse(
        {
          processId,
          keyGivenToOwner: true,
          message: messages[lang],
        },
        lang,
        currency,
      ),
    );
  } catch (error) {
    logger.error('Failed to certify notary', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processId: req.body?.processId,
    });

    const messages: Record<Language, string> = {
      AR: 'حدث خطأ أثناء التوثيق',
      FR: 'Erreur lors de la certification',
      EN: 'Failed to complete notary certification',
    };

    res.status(500).json({
      success: false,
      error: {
        code: 'NOTARY_CERTIFICATION_FAILED',
        message: messages[lang],
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// الخطوة 4: تفعيل الجواز الرقمي — الزبون يفعّل المفتاح
// ============================================================================

/**
 * POST /api/v1/ownership/activate-passport
 * ──────────────────────────────────────────
 * الزبون يُدخّل المفتاح لتفعيل السجل الرقمي
 * الحالة: KEY_ISSUED → COMPLETED
 * الخطوة: → REGISTRAR_ACTIVATION
 */

export async function activatePassport(
  req: Request,
  res: Response,
): Promise<void> {
  const { lang, currency } = extractLanguageAndCurrency(req);

  try {
    const { processId, providedKey } = req.body;
    const customerId = (req as any).userId;

    // حارس المدخلات: عملية ومفتاح مطلوبان (400 عوض 500)
    if (!processId || typeof processId !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION', message: 'processId is required' },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }
    if (!providedKey || typeof providedKey !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION', message: 'providedKey is required' },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // 1. البحث عن عملية التمليك
    const process = await prisma.ownershipTransferProcess.findUnique({
      where: { processId },
      include: { key: true },
    });

    if (!process) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PROCESS_NOT_FOUND',
          message:
            lang === Language.AR
              ? 'عملية التمليك غير موجودة'
              : lang === Language.FR
                ? 'Processus de propriété non trouvé'
                : 'Ownership process not found',
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // التحقق من ملكية العملية
    if (process.customerId !== customerId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'NOT_PROCESS_OWNER',
          message:
            lang === Language.AR
              ? 'غير مصرح لك بتفعيل هذه العملية'
              : lang === Language.FR
                ? "Non autorisé à activer ce processus"
                : 'Not authorized to activate this process',
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // التحقق من حالة العملية
    if (process.status !== OwnershipProcessStatus.KEY_ISSUED) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROCESS_STATUS',
          message:
            lang === Language.AR
              ? 'حالة العملية غير صالحة للتفعيل — يجب إصدار المفتاح أولاً'
              : lang === Language.FR
                ? "Statut du processus non valide pour l'activation — la clé doit d'abord être émise"
                : 'Process status not valid for activation — key must be issued first',
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // التحقق من وجود المفتاح
    if (!process.key) {
      res.status(400).json({
        success: false,
        error: {
          code: 'KEY_NOT_FOUND',
          message:
            lang === Language.AR
              ? 'لم يتم إصدار مفتاح لهذه العملية بعد'
              : lang === Language.FR
                ? "Aucune clé n'a encore été émise pour ce processus"
                : 'No key has been issued for this process yet',
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // 2. التحقق من صحة المفتاح
    const isKeyValid = await OwnershipKeyService.verifyOwnershipKey(
      providedKey,
      process.key.keyHash,
    );

    if (!isKeyValid) {
      logger.warn('Invalid ownership key attempt', {
        processId,
        customerId,
        keyPrefix: providedKey.substring(0, 12),
      });

      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_KEY',
          message:
            lang === Language.AR
              ? 'المفتاح المقدم غير صالح'
              : lang === Language.FR
                ? 'Clé fournie invalide'
                : 'Provided key is invalid',
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // 3. تحديث حالة المفتاح
    await prisma.ownershipKey.update({
      where: { id: process.key.id },
      data: {
        status: OwnershipKeyStatus.ACTIVATED,
        activatedAt: new Date(),
      },
    });

    // 4. إنشاء سجل السجل الرقمي
    const registrar = await prisma.digitalRegistrar.findFirst({
      where: { isActive: true },
    });

    if (!registrar) {
      res.status(500).json({
        success: false,
        error: {
          code: 'REGISTRAR_UNAVAILABLE',
          message:
            lang === Language.AR
              ? 'خدمة السجل الرقمي غير متاحة حالياً'
              : lang === Language.FR
                ? "Service de registre numérique indisponible"
                : 'Digital registrar service is currently unavailable',
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    // توليد معرّف交易 وهمي للبلوكتشين
    const mockBlockchainTxHash = sha256Hash(
      `BLOCKCHAIN_TX_${process.id}_${Date.now()}`,
    );

    const registrarLog = await prisma.digitalRegistrarLog.create({
      data: {
        processId: process.id,
        registrarId: registrar.id,
        keyVerificationResult: true,
        keyVerificationTimestamp: new Date(),
        verificationEngineUsed: 'SHA256+AES256GCM',
        recordMatchResult: true,
        contractMatchHash: process.contractHash,
        notaryCertMatchHash: process.contractHash,
        digitalRecordStatus: DigitalRecordStatus.ACTIVATED,
        blockchainTxHash: mockBlockchainTxHash,
        blockchainBlockNumber: BigInt(Math.floor(Math.random() * 1000000)),
        activationResult: 'SUCCESS',
        activationTimestamp: new Date(),
      },
    });

    // 5. تحديث حالة العملية
    const updatedProcess = await prisma.ownershipTransferProcess.update({
      where: { id: process.id },
      data: {
        status: OwnershipProcessStatus.COMPLETED,
        currentStep: OwnershipStep.REGISTRAR_ACTIVATION,
        step4CompletedAt: new Date(),
        completedAt: new Date(),
      },
    });

    // تحرير المبلغ من الضمان
    const escrow = await prisma.escrowLedger.findUnique({
      where: { processId: process.id },
    });

    if (escrow) {
      const releasedAmount = Number(escrow.holdAmount) - Number(escrow.platformFee);

      await prisma.escrowLedger.update({
        where: { processId: process.id },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
          releasedAmount,
          releaseAuthorization: sha256Hash(`${escrow.escrowCode}|${Date.now()}|RELEASED`),
        },
      });

      await prisma.escrowEvent.create({
        data: {
          escrowId: escrow.id,
          eventType: 'RELEASED',
          amount: releasedAmount,
          currency: escrow.holdCurrency,
          performedBy: customerId,
          notes: 'Digital record activated — payment released to seller',
          metadata: { platformFee: escrow.platformFee, netAmount: releasedAmount },
        },
      });
    }

    logger.info('Ownership passport activated successfully', {
      processId,
      customerId,
      blockchainTxHash: mockBlockchainTxHash,
    });

    const messages: Record<Language, string> = {
      AR: 'تم تفعيل جواز التمليك الرقمي بنجاح — العملية مكتملة',
      FR: 'Passeport de propriété numérique activé avec succès — Processus terminé',
      EN: 'Digital ownership passport activated successfully — Process completed',
    };

    res.status(200).json(
      createSuccessResponse(
        {
          processId,
          recordStatus: 'ACTIVATED',
          completed: true,
          message: messages[lang],
        },
        lang,
        currency,
      ),
    );
  } catch (error) {
    logger.error('Failed to activate passport', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processId: req.body?.processId,
    });

    const messages: Record<Language, string> = {
      AR: 'حدث خطأ أثناء تفعيل الجواز الرقمي',
      FR: "Erreur lors de l'activation du passeport numérique",
      EN: 'Failed to activate digital passport',
    };

    res.status(500).json({
      success: false,
      error: {
        code: 'PASSPORT_ACTIVATION_FAILED',
        message: messages[lang],
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// الحصول على حالة العملية
// ============================================================================

/**
 * GET /api/v1/ownership/process/:processId
 * ─────────────────────────────────────────
 * عرض حالة عملية التمليك مع جميع العلاقات
 */

export async function getProcessStatus(
  req: Request,
  res: Response,
): Promise<void> {
  const { lang, currency } = extractLanguageAndCurrency(req);

  try {
    const { processId } = req.params;

    const process: any = await prisma.ownershipTransferProcess.findUnique({
      where: { processId },
      include: {
        key: {
          select: {
            id: true,
            keyPrefix: true,
            keyAlgorithm: true,
            status: true,
            generatedAt: true,
            issuedAt: true,
            activatedAt: true,
          },
        },
        notaryRecord: {
          select: {
            id: true,
            contractDocumentHash: true,
            saleAgreementHash: true,
            witnessSignatures: true,
            keyGeneratedForOwner: true,
            keyHandoverMethod: true,
            keyHandoverTimestamp: true,
            legalCertificationHash: true,
            certifiedAt: true,
          },
        },
        registrarLog: {
          select: {
            id: true,
            keyVerificationResult: true,
            keyVerificationTimestamp: true,
            recordMatchResult: true,
            digitalRecordStatus: true,
            blockchainTxHash: true,
            blockchainBlockNumber: true,
            activationResult: true,
            activationTimestamp: true,
          },
        },
        asset: {
          select: {
            id: true,
            goldId: true,
            weightGross: true,
            weightNet: true,
            measuredPurity: true,
            karat: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        escrow: {
          select: {
            escrowCode: true,
            holdAmount: true,
            holdCurrency: true,
            platformFee: true,
            releasedAmount: true,
            status: true,
            heldAt: true,
            releasedAt: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!process) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PROCESS_NOT_FOUND',
          message:
            lang === Language.AR
              ? 'عملية التمليك غير موجودة'
              : lang === Language.FR
                ? 'Processus de propriété non trouvé'
                : 'Ownership process not found',
        },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    res.status(200).json(
      createSuccessResponse(
        {
          processId: process.processId,
          asset: process.asset,
          customer: process.customer,
          salePrice: process.salePrice,
          saleCurrency: process.saleCurrency,
          currentStep: process.currentStep,
          status: process.status,
          startedAt: process.startedAt,
          completedAt: process.completedAt,
          key: process.key,
          notaryRecord: process.notaryRecord,
          registrarLog: process.registrarLog,
          escrow: process.escrow,
          steps: {
            step1: {
              name: 'PURCHASE_REQUEST',
              completedAt: process.step1CompletedAt,
              label:
                lang === Language.AR
                  ? 'طلب الشراء'
                  : lang === Language.FR
                    ? "Demande d'achat"
                    : 'Purchase Request',
            },
            step2: {
              name: 'NOTARY_CERTIFICATION',
              completedAt: process.step2CompletedAt,
              label:
                lang === Language.AR
                  ? 'توثيق كاتب العدل'
                  : lang === Language.FR
                    ? 'Certification du notaire'
                    : 'Notary Certification',
            },
            step3: {
              name: 'KEY_ISSUANCE',
              completedAt: process.step3CompletedAt,
              label:
                lang === Language.AR
                  ? 'إصدار المفتاح'
                  : lang === Language.FR
                    ? 'Émission de la clé'
                    : 'Key Issuance',
            },
            step4: {
              name: 'REGISTRAR_ACTIVATION',
              completedAt: process.step4CompletedAt,
              label:
                lang === Language.AR
                  ? 'تفعيل السجل الرقمي'
                  : lang === Language.FR
                    ? 'Activation du registre numérique'
                    : 'Registrar Activation',
            },
          },
        },
        lang,
        currency,
      ),
    );
  } catch (error) {
    logger.error('Failed to get process status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processId: req.params.processId,
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'PROCESS_STATUS_FAILED',
        message:
          lang === Language.AR
            ? 'حدث خطأ أثناء جلب حالة العملية'
            : lang === Language.FR
              ? 'Erreur lors de la récupération du statut du processus'
              : 'Failed to retrieve process status',
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// عرض عمليات الزبون
// ============================================================================

/**
 * GET /api/v1/ownership/my-processes
 * ────────────────────────────────────
 * عرض جميع عمليات التمليك الخاصة بالزبون مع Paginate
 */

export async function getCustomerProcesses(
  req: Request,
  res: Response,
): Promise<void> {
  const { lang, currency } = extractLanguageAndCurrency(req);

  try {
    const customerId = (req as any).userId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status as OwnershipProcessStatus | undefined;

    const where: any = { customerId };
    if (statusFilter) {
      where.status = statusFilter;
    }

    const [processes, total] = await Promise.all([
      prisma.ownershipTransferProcess.findMany({
        where,
        include: {
          key: {
            select: {
              keyPrefix: true,
              status: true,
              generatedAt: true,
              activatedAt: true,
            },
          },
          asset: {
            select: {
              goldId: true,
              weightGross: true,
              weightNet: true,
              measuredPurity: true,
              karat: true,
            },
          },
          escrow: {
            select: {
              escrowCode: true,
              holdAmount: true,
              holdCurrency: true,
              status: true,
              heldAt: true,
              expiresAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.ownershipTransferProcess.count({ where }),
    ]);

    res.status(200).json(
      createSuccessResponse(
        {
          processes,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
        lang,
        currency,
      ),
    );
  } catch (error) {
    logger.error('Failed to get customer processes', {
      error: error instanceof Error ? error.message : 'Unknown error',
      customerId: (req as any).userId,
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'CUSTOMER_PROCESSES_FAILED',
        message:
          lang === Language.AR
            ? 'حدث خطأ أثناء جلب عمليات الزبون'
            : lang === Language.FR
              ? 'Erreur lors de la récupération des processus client'
              : 'Failed to retrieve customer processes',
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// نظرة عامة للمراقب
// ============================================================================

/**
 * GET /api/v1/ownership/auditor-overview
 * ────────────────────────────────────────
 * نظرة عامة لعمليات التمليك مع إحصائيات فصل الصلاحيات
 */

export async function getAuditorOverview(
  req: Request,
  res: Response,
): Promise<void> {
  const { lang, currency } = extractLanguageAndCurrency(req);

  try {
    // 1. عدد العمليات حسب الحالة
    const statusCounts = await prisma.ownershipTransferProcess.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const statusDistribution = statusCounts.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));

    // 2. العمليات مع انتهاكات فصل الصلاحيات
    const sodViolations = await prisma.auditorWatchLog.findMany({
      where: { separationOfDutiesViolated: true },
      include: {
        process: {
          select: {
            processId: true,
            customerId: true,
            currentStep: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // 3. النشاط الأخير (آخر 10 عمليات)
    const recentActivity = await prisma.ownershipTransferProcess.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        processId: true,
        status: true,
        currentStep: true,
        updatedAt: true,
        customer: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    // 4. إحصائيات عامة
    const totalProcesses = await prisma.ownershipTransferProcess.count();
    const completedProcesses = await prisma.ownershipTransferProcess.count({
      where: { status: OwnershipProcessStatus.COMPLETED },
    });
    const activeProcesses = await prisma.ownershipTransferProcess.count({
      where: {
        status: {
          in: [
            OwnershipProcessStatus.PURCHASE_SUBMITTED,
            OwnershipProcessStatus.NOTARY_REVIEWING,
            OwnershipProcessStatus.KEY_ISSUED,
          ],
        },
      },
    });

    res.status(200).json(
      createSuccessResponse(
        {
          summary: {
            totalProcesses,
            completedProcesses,
            activeProcesses,
            completionRate:
              totalProcesses > 0
                ? ((completedProcesses / totalProcesses) * 100).toFixed(2) + '%'
                : '0%',
          },
          statusDistribution,
          sodViolations: {
            count: sodViolations.length,
            details: sodViolations,
          },
          recentActivity,
        },
        lang,
        currency,
      ),
    );
  } catch (error) {
    logger.error('Failed to get auditor overview', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'AUDITOR_OVERVIEW_FAILED',
        message:
          lang === Language.AR
            ? 'حدث خطأ أثناء جلب نظرة عامة للمراقب'
            : lang === Language.FR
              ? 'Erreur lors de la récupération de la vue densemble'
              : 'Failed to retrieve auditor overview',
      },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}

// ============================================================================
// تفاصيل الضمان المالي
// ============================================================================

/**
 * GET /api/v1/ownership/escrow/:processId
 * ────────────────────────────────────────
 * عرض تفاصيل الضمان المالي لعملية التمليك
 */

export async function getEscrowDetails(
  req: Request,
  res: Response,
): Promise<void> {
  const { lang, currency } = extractLanguageAndCurrency(req);
  try {
    const { processId } = req.params;

    if (!isValidUuid(processId)) {
      res.status(404).json({
        success: false,
        error: { code: 'ESCROW_NOT_FOUND', message: 'Escrow not found' },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    const escrow = await prisma.escrowLedger.findUnique({
      where: { processId },
      include: {
        events: { orderBy: { createdAt: 'desc' } },
        buyer: { select: { firstName: true, lastName: true, email: true } },
        seller: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!escrow) {
      res.status(404).json({
        success: false,
        error: { code: 'ESCROW_NOT_FOUND', message: 'Escrow not found' },
        meta: { language: lang, currency, timestamp: new Date().toISOString() },
      });
      return;
    }

    res.status(200).json(
      createSuccessResponse(escrow, lang, currency)
    );
  } catch (error) {
    logger.error('Failed to get escrow details', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ESCROW_FETCH_FAILED', message: 'Failed to fetch escrow details' },
      meta: { language: lang, currency, timestamp: new Date().toISOString() },
    });
  }
}
