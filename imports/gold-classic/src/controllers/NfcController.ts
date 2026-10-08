// ============================================================================
// JOHAR PLATFORM — NFC CONTROLLER
// ============================================================================
// Controller إدارة تقنية NFC: قراءة البطاقات، الكتابة عليها، قفلها
// يتضمن:
//   1. GET  /nfc/read/:uid        — قراءة بطاقة NFC وبياناتها
//   2. GET  /nfc/cards             — قائمة كل بطاقات NFC المسجلة
//   3. POST /nfc/write             — كتابة بيانات على بطاقة NFC وربطها بأصل
//   4. POST /nfc/lock/:uid         — قفل بطاقة NFC نهائيًا (NDEF Write-Lock)
//   5. GET  /nfc/stats             — إحصائيات البطاقات
//   6. GET  /nfc/history/:uid      — سجل عمليات بطاقة معينة
// ============================================================================

import { Request, Response } from 'express';
import { Language, Currency, NdefLockStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { hashNfcUid, verifyNfcUid, sha256Hash } from '../utils/crypto';

// ============================================================================
// GET /api/v1/admin/nfc/stats — إحصائيات بطاقات NFC
// ============================================================================

export async function getNfcStats(_req: Request, res: Response): Promise<void> {
  try {
    const [total, linked, locked, tampered] = await Promise.all([
      prisma.goldAsset.count({ where: { nfcUid: { not: null } } }),
      prisma.goldAsset.count({ where: { nfcUid: { not: null }, nfcUidHash: { not: null } } }),
      prisma.goldAsset.count({ where: { ndefLockStatus: NdefLockStatus.LOCKED } }),
      prisma.goldAsset.count({ where: { ndefLockStatus: NdefLockStatus.TAMPERED } }),
    ]);

    res.json({
      success: true,
      data: {
        totalCards: total,
        linkedToAssets: linked,
        lockedCards: locked,
        tamperedCards: tampered,
        unlinkedCards: total - linked,
        unlockedCards: total - locked,
      },
    });
  } catch (error) {
    logger.error('NFC stats failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'NFC_STATS_FAILED', message: 'Failed to fetch NFC statistics' },
    });
  }
}

// ============================================================================
// GET /api/v1/admin/nfc/cards — قائمة بطاقات NFC
// ============================================================================

export async function getNfcCards(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const search = (req.query.search as string) || '';
    const filter = (req.query.filter as string) || 'all';

    const where: any = { nfcUid: { not: null } };

    if (filter === 'locked') {
      where.ndefLockStatus = NdefLockStatus.LOCKED;
    } else if (filter === 'unlocked') {
      where.ndefLockStatus = NdefLockStatus.UNLOCKED;
    } else if (filter === 'tampered') {
      where.ndefLockStatus = NdefLockStatus.TAMPERED;
    } else if (filter === 'linked') {
      where.nfcUidHash = { not: null };
    } else if (filter === 'unlinked') {
      where.nfcUidHash = null;
    }

    if (search) {
      where.OR = [
        { nfcUid: { contains: search, mode: 'insensitive' } },
        { goldId: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.goldAsset.findMany({
        where,
        select: {
          id: true,
          goldId: true,
          serialNumber: true,
          metalType: true,
          karat: true,
          productType: true,
          weightGross: true,
          nfcUid: true,
          nfcUidHash: true,
          ndefLockStatus: true,
          nfcLockedAt: true,
          nameTranslations: true,
          status: true,
          createdAt: true,
          digitalIdentity: {
            select: { qrCodeHash: true, genesisHash: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.goldAsset.count({ where }),
    ]);

    const cards = assets.map((a) => ({
      id: a.id,
      goldId: a.goldId,
      serialNumber: a.serialNumber,
      metalType: a.metalType,
      karat: a.karat,
      productType: a.productType,
      weightGross: a.weightGross,
      nfcUid: a.nfcUid,
      // نعرض أول 12 حرفًا من الهاش فقط لأمان
      nfcUidHashPreview: a.nfcUidHash ? a.nfcUidHash.substring(0, 12) + '…' : null,
      isLinked: !!a.nfcUidHash,
      lockStatus: a.ndefLockStatus,
      lockedAt: a.nfcLockedAt,
      assetName: (a.nameTranslations as any)?.ar || (a.nameTranslations as any)?.en || a.serialNumber,
      qrCodeHash: a.digitalIdentity?.qrCodeHash?.substring(0, 12) + '…' || null,
      assetStatus: a.status,
      createdAt: a.createdAt,
    }));

    res.json({
      success: true,
      data: {
        items: cards,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error('NFC cards list failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'NFC_LIST_FAILED', message: 'Failed to fetch NFC cards' },
    });
  }
}

// ============================================================================
// GET /api/v1/admin/nfc/read/:uid — قراءة بطاقة NFC محددة
// ============================================================================

export async function readNfcCard(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const uid = req.params.uid;

  try {
    const asset = await prisma.goldAsset.findFirst({
      where: { nfcUid: uid },
      include: {
        digitalIdentity: {
          select: { genesisHash: true, qrCodeHash: true, createdAt: true },
        },
        digitalPassport: {
          select: { passportNumber: true, passportHash: true },
        },
        assayRecords: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            lab: {
              select: {
                entity: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!asset) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NFC_CARD_NOT_FOUND',
          message:
            lang === Language.AR
              ? 'لم يتم العثور على بطاقة NFC بهذا المعرف'
              : lang === Language.FR
                ? 'Aucune carte NFC trouvée avec cet identifiant'
                : 'No NFC card found with this UID',
        },
      });
      return;
    }

    // التحقق من سلامة البطاقة (مقارنة الهاش)
    let integrityCheck: 'PASS' | 'FAIL' | 'NO_HASH' = 'NO_HASH';
    if (asset.nfcUidHash && asset.nfcUid) {
      integrityCheck = verifyNfcUid(uid, asset.nfcUidHash) ? 'PASS' : 'FAIL';
    }

    const cardData = {
      uid: asset.nfcUid,
      goldId: asset.goldId,
      serialNumber: asset.serialNumber,
      metalType: asset.metalType,
      karat: asset.karat,
      productType: asset.productType,
      weightGross: asset.weightGross,
      weightNet: asset.weightNet,
      measuredPurity: asset.measuredPurity,
      assetStatus: asset.status,
      nfcLockStatus: asset.ndefLockStatus,
      lockedAt: asset.nfcLockedAt,
      integrityCheck,
      assetName:
        (asset.nameTranslations as any)?.ar ||
        (asset.nameTranslations as any)?.fr ||
        (asset.nameTranslations as any)?.en ||
        asset.serialNumber,
      digitalIdentity: asset.digitalIdentity
        ? {
            genesisHash: asset.digitalIdentity.genesisHash,
            qrCodeHash: asset.digitalIdentity.qrCodeHash,
            issuedAt: asset.digitalIdentity.createdAt,
          }
        : null,
      lastAssay: asset.assayRecords?.[0]
        ? {
            reportNumber: asset.assayRecords[0].reportNumber,
            measuredPurity: String(asset.assayRecords[0].measuredPurity),
            labName: asset.assayRecords[0].lab?.entity?.name || '—',
          }
        : null,
      passport: asset.digitalPassport?.passportNumber || null,
    };

    // تسجيل عملية القراءة في التدقيق
    await prisma.auditLog.create({
      data: {
        userId: (req as any).userId,
        action: 'NFC_CARD_READ',
        entityType: 'GoldAsset',
        entityId: asset.id,
        description: `NFC card read: UID=${uid}, GoldID=${asset.goldId}, integrity=${integrityCheck}`,
        severity: 'INFO',
        category: 'OPERATION',
        newValues: { uid, integrityCheck },
      },
    });

    res.json({ success: true, data: cardData });
  } catch (error) {
    logger.error('NFC read failed', { error, uid });
    res.status(500).json({
      success: false,
      error: { code: 'NFC_READ_FAILED', message: 'Failed to read NFC card' },
    });
  }
}

// ============================================================================
// POST /api/v1/admin/nfc/write — كتابة بيانات على بطاقة NFC
// ============================================================================
/**
 * الكتابة على بطاقة NFC وربطها بأصل موجود
 * - يحدد الأصل بـ goldId أو serialNumber
 * - يخزن nfcUid + nfcUidHash (مشفّر SHA-256)
 * - يولد NDEF payload: رابط التحقق العام للبطاقة
 */

export async function writeNfcCard(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const { nfcUid, goldId, serialNumber } = req.body as {
    nfcUid: string;
    goldId?: string;
    serialNumber?: string;
  };

  try {
    // 1. البحث عن الأصل
    const assetWhere: any = {};
    if (goldId) assetWhere.goldId = goldId;
    else if (serialNumber) assetWhere.serialNumber = serialNumber;
    else {
      res.status(400).json({
        success: false,
        error: {
          code: 'ASSET_IDENTIFIER_REQUIRED',
          message: 'Provide goldId or serialNumber to link the NFC card',
        },
      });
      return;
    }

    const asset = await prisma.goldAsset.findFirst({ where: assetWhere });

    if (!asset) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: 'Asset not found — register the asset first',
        },
      });
      return;
    }

    // 2. التحقق من أن البطاقة غير مقيدة بأصل آخر
    if (asset.nfcUid && asset.nfcUid !== nfcUid) {
      res.status(409).json({
        success: false,
        error: {
          code: 'ASSET_ALREADY_HAS_NFC',
          message: 'This asset is already linked to another NFC card',
        },
      });
      return;
    }

    const existingCard = await prisma.goldAsset.findFirst({
      where: { nfcUid, id: { not: asset.id } },
    });
    if (existingCard) {
      res.status(409).json({
        success: false,
        error: {
          code: 'NFC_CARD_IN_USE',
          message: 'This NFC card is already linked to another asset',
        },
      });
      return;
    }

    // 3. تشفير UID وتحديث الأصل
    const nfcUidHash = hashNfcUid(nfcUid);
    const ndefPayload = JSON.stringify({
      v: 1,
      goldId: asset.goldId,
      verify: `/verify/${asset.goldId}`,
      ts: Date.now(),
      sig: sha256Hash(`${nfcUid}|${asset.goldId}`).substring(0, 16),
    });

    await prisma.goldAsset.update({
      where: { id: asset.id },
      data: { nfcUid, nfcUidHash },
    });

    // تحديث الهوية الرقمية أيضًا
    await prisma.digitalIdentity.updateMany({
      where: { assetId: asset.id },
      data: { nfcUidHash },
    });

    // 4. تسجيل العملية في التدقيق
    await prisma.auditLog.create({
      data: {
        userId: (req as any).userId,
        action: 'NFC_CARD_WRITTEN',
        entityType: 'GoldAsset',
        entityId: asset.id,
        description: `NFC card written and linked: UID=${nfcUid} → GoldID=${asset.goldId}`,
        severity: 'INFO',
        category: 'OPERATION',
        newValues: { nfcUid, goldId: asset.goldId, ndefPayloadSize: ndefPayload.length },
      },
    });

    res.json({
      success: true,
      data: {
        nfcUid,
        goldId: asset.goldId,
        assetName: asset.serialNumber,
        ndefPayload,
        payloadSize: ndefPayload.length,
        verifyUrl: `/verify/${asset.goldId}`,
        writtenAt: new Date().toISOString(),
        message:
          lang === Language.AR
            ? 'تمت الكتابة على البطاقة وربطها بالأصل بنجاح'
            : lang === Language.FR
              ? 'Carte NFC écrite et liée à l\'actif avec succès'
              : 'NFC card written and linked to asset successfully',
      },
    });
  } catch (error) {
    logger.error('NFC write failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'NFC_WRITE_FAILED', message: 'Failed to write NFC card' },
    });
  }
}

// ============================================================================
// POST /api/v1/admin/nfc/lock/:uid — قفل بطاقة NFC نهائيًا (NDEF Write-Lock)
// ============================================================================
/**
 * قفل نهائي不可逆 — بعد القفل لا يمكن الكتابة على البطاقة مرة أخرى
 * يجب أن تكون البطاقة مرتبطة بأصل وغير مقفلة سابقًا
 */

export async function lockNfcCard(req: Request, res: Response): Promise<void> {
  const lang = ((req as any).preferredLanguage as Language) || Language.EN;
  const uid = req.params.uid;

  try {
    const asset = await prisma.goldAsset.findFirst({ where: { nfcUid: uid } });

    if (!asset) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NFC_CARD_NOT_FOUND',
          message: 'NFC card not found — write data to it first',
        },
      });
      return;
    }

    if (asset.ndefLockStatus === NdefLockStatus.LOCKED) {
      res.status(409).json({
        success: false,
        error: {
          code: 'NFC_ALREADY_LOCKED',
          message: 'This NFC card is already permanently locked',
        },
      });
      return;
    }

    if (asset.ndefLockStatus === NdefLockStatus.TAMPERED) {
      res.status(409).json({
        success: false,
        error: {
          code: 'NFC_TAMPERED',
          message: 'This NFC card has been tampered with — cannot lock',
        },
      });
      return;
    }

    // القفل + طابع زمني
    await prisma.goldAsset.update({
      where: { id: asset.id },
      data: {
        ndefLockStatus: NdefLockStatus.LOCKED,
        nfcLockedAt: new Date(),
        nfcLockedBy: (req as any).userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: (req as any).userId,
        action: 'NFC_CARD_LOCKED',
        entityType: 'GoldAsset',
        entityId: asset.id,
        description: `NFC card permanently locked (NDEF Write-Lock): UID=${uid}, GoldID=${asset.goldId}`,
        severity: 'WARNING',
        category: 'OPERATION',
        newValues: { uid, lockStatus: 'LOCKED' },
      },
    });

    res.json({
      success: true,
      data: {
        nfcUid: uid,
        goldId: asset.goldId,
        lockStatus: 'LOCKED',
        lockedAt: new Date().toISOString(),
        irreversible: true,
        message:
          lang === Language.AR
            ? 'تم قفل البطاقة نهائيًا — لا يمكن الكتابة عليها بعد الآن'
            : lang === Language.FR
              ? 'Carte verrouillée définitivement — écriture impossible désormais'
              : 'Card permanently locked — write is no longer possible',
      },
    });
  } catch (error) {
    logger.error('NFC lock failed', { error, uid });
    res.status(500).json({
      success: false,
      error: { code: 'NFC_LOCK_FAILED', message: 'Failed to lock NFC card' },
    });
  }
}

// ============================================================================
// GET /api/v1/admin/nfc/history/:uid — سجل عمليات بطاقة
// ============================================================================

export async function getNfcHistory(req: Request, res: Response): Promise<void> {
  const uid = req.params.uid;

  try {
    const asset = await prisma.goldAsset.findFirst({
      where: { nfcUid: uid },
      select: { id: true, goldId: true },
    });

    if (!asset) {
      res.status(404).json({
        success: false,
        error: { code: 'NFC_CARD_NOT_FOUND', message: 'NFC card not found' },
      });
      return;
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        entityId: asset.id,
        action: {
          in: ['NFC_CARD_READ', 'NFC_CARD_WRITTEN', 'NFC_CARD_LOCKED'],
        },
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: {
        nfcUid: uid,
        goldId: asset.goldId,
        operations: logs.map((l) => ({
          id: l.id,
          action: l.action,
          description: l.description,
          severity: l.severity,
          user: l.user ? `${l.user.firstName} ${l.user.lastName}`.trim() || l.user.email : '—',
          timestamp: l.createdAt,
        })),
      },
    });
  } catch (error) {
    logger.error('NFC history failed', { error, uid });
    res.status(500).json({
      success: false,
      error: { code: 'NFC_HISTORY_FAILED', message: 'Failed to fetch NFC history' },
    });
  }
}
