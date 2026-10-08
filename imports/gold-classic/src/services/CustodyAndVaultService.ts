// ============================================================================
// GOLD PLATFORM — CUSTODY & VAULT SERVICE
// ============================================================================
// خدمة إدارة الخزائن وحركة الأصول مع تطبيق نظام الاعتماد الثنائي
// (Four-Eyes Principle) للأعمليات عالية القيمة
//
// مبدأ العيون الأربعة (Four-Eyes Principle):
//   أي عملية نقل أو إخراج بقيمة تتجاوز الحد المحدد (50,000 USD)
//   تتطلب موافقة شخصين معتمدين بشكل مستقل
//
// ISO 27001 Compliance:
//   - جميع العمليات مسجلة في سجل التدقيق
//   - لا يمكن لأي شخص واحد تنفيذ عملية عالية القيمة بمفرده
//   - جميع التوقيعات مشفرة رقمياً

import {
  DualAuthStatus,
  CustodyEventStatus,
  TransferRequestStatus,
  RiskLevel,
  Language,
  Currency,
} from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { generateRequestId, sha256Hash } from '../utils/crypto';
import { config } from '../config';

// ============================================================================
// CUSTODY & VAULT SERVICE
// ============================================================================

export class CustodyAndVaultService {
  private static readonly DUAL_AUTH_THRESHOLD_USD = config.custody.dualAuthThresholdUsd;

  /**
   * طلب نقل أصل من الخزينة
   *
   * آلية العمل:
   * 1. التحقق من وجود الأصل في الخزينة
   * 2. حساب قيمة الأصل
   * 3. التحقق مما إذا كان يتطلب اعتماداً ثنائياً
   * 4. إنشاء طلب النقل
   * 5. تطبيق نظام الاعتماد الثنائي إذا لزم الأمر
   * 6. تسجيل الحدث في سجل التدقيق
   *
   * @returns طلب النقل مع حالة الاعتماد
   */
  static async createTransferRequest(params: {
    assetId: string;
    initiatedBy: string;
    toEntityId: string;
    reason: string;
    estimatedValue: number;
    valueCurrency: Currency;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    transportMethod?: string;
  }): Promise<{
    requestId: string;
    requiresDualAuth: boolean;
    status: TransferRequestStatus;
    message: string;
  }> {
    const {
      assetId,
      initiatedBy,
      toEntityId,
      reason,
      estimatedValue,
      valueCurrency,
      priority = 'NORMAL',
      transportMethod,
    } = params;

    // 1. التحقق من وجود الأصل
    const asset = await prisma.goldAsset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        goldId: true,
        status: true,
        erpInventory: {
          select: {
            custodyStatus: true,
            warehouseId: true,
            custodianId: true,
          },
        },
      },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    if (asset.status === 'IN_TRANSIT' || asset.status === 'SOLD') {
      throw new Error('Asset is not available for transfer');
    }

    if (!asset.erpInventory || asset.erpInventory.custodyStatus !== 'SECURE') {
      throw new Error('Asset must be in SECURE custody status for transfer');
    }

    // 2. التحقق من صلاحية المستخدم
    const user = await prisma.user.findUnique({
      where: { id: initiatedBy },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid or inactive user');
    }

    const hasPermission = this.checkTransferPermission(user.role.hierarchy);
    if (!hasPermission) {
      throw new Error('Insufficient permissions for transfer');
    }

    // 3. تحديد ما إذا كان يتطلب اعتماداً ثنائياً
    const requiresDualAuth = estimatedValue >= this.DUAL_AUTH_THRESHOLD_USD;

    // 4. تحديد الحالة الأولية
    let status: TransferRequestStatus;
    if (requiresDualAuth) {
      status = TransferRequestStatus.PENDING;
    } else {
      status = TransferRequestStatus.APPROVED;
    }

    // 5. إنشاء طلب النقل
    const requestId = generateRequestId('CTR');

    const transferRequest = await prisma.custodyTransferRequest.create({
      data: {
        requestId,
        assetId,
        fromEntityId: asset.erpInventory.custodyStatus === 'SECURE'
          ? (await this.getEntityForWarehouse(asset.erpInventory.warehouseId)).id
          : initiatedBy,
        toEntityId,
        initiatedById: initiatedBy,
        reason,
        priority,
        estimatedValue,
        valueCurrency,
        requiresDualAuth,
        status,
      },
    });

    // 6. تسجيل الحدث في سجل التدقيق (ISO 27001)
    await this.logAuditEvent({
      userId: initiatedBy,
      action: 'TRANSFER_REQUEST_CREATED',
      entityType: 'CustodyTransferRequest',
      entityId: transferRequest.id,
      description: `Transfer request created for asset ${asset.goldId}: ${reason}`,
      newValues: {
        requestId,
        assetId,
        toEntityId,
        estimatedValue,
        requiresDualAuth,
      },
    });

    logger.info('Transfer request created', {
      requestId,
      assetId: asset.goldId,
      estimatedValue,
      requiresDualAuth,
    });

    return {
      requestId,
      requiresDualAuth,
      status,
      message: requiresDualAuth
        ? 'Transfer request created. Dual authorization required — awaiting first approval.'
        : 'Transfer request approved. Ready for execution.',
    };
  }

  /**
   * الموافقة على طلب نقل (العتماد الأول أو الثاني)
   *
   * نظام الاعتماد الثنائي (Four-Eyes Principle):
   * - الطرف الأول: يراجع ويُوقف العملية
   * - الطرف الثاني: يراجع ويُفعّل العملية
   * - لا يمكن لأي طرف أن يُنفّذ العملية بمفرده
   *
   * @returns نتيجة الاعتماد
   */
  static async approveTransferRequest(params: {
    requestId: string;
    approverId: string;
    approvalNote?: string;
  }): Promise<{
    status: TransferRequestStatus;
    message: string;
  }> {
    const { requestId, approverId, approvalNote } = params;

    // 1. جلب طلب النقل
    const transferRequest = await prisma.custodyTransferRequest.findUnique({
      where: { requestId },
    });

    if (!transferRequest) {
      throw new Error('Transfer request not found');
    }

    // التحقق من حالة الطلب
    if (
      transferRequest.status === TransferRequestStatus.COMPLETED ||
      transferRequest.status === TransferRequestStatus.CANCELLED
    ) {
      throw new Error('Transfer request is already completed or cancelled');
    }

    // 2. التحقق من صلاحية المُوَقِّع
    const approver = await prisma.user.findUnique({
      where: { id: approverId },
      include: { role: true },
    });

    if (!approver || !approver.isActive) {
      throw new Error('Invalid or inactive approver');
    }

    // التحقق من أن المُوَقِّف ليس نفس المبادر (مبدأ العيون الأربعة)
    if (approverId === transferRequest.initiatedById) {
      throw new Error(
        'Four-Eyes Principle violation: Approver cannot be the same as initiator',
      );
    }

    // 3. تطبيق نظام الاعتماد الثنائي
    if (transferRequest.requiresDualAuth) {
      return this.processDualAuthApproval(
        transferRequest,
        approverId,
        approvalNote,
      );
    }

    // 4. للمعاملات الصغيرة: اعتماد مباشر
    await prisma.custodyTransferRequest.update({
      where: { requestId },
      data: {
        firstApproverId: approverId,
        firstApprovalAt: new Date(),
        firstApprovalNote: approvalNote,
        status: TransferRequestStatus.APPROVED,
      },
    });

    // تسجيل الحدث
    await this.logAuditEvent({
      userId: approverId,
      action: 'TRANSFER_APPROVED',
      entityType: 'CustodyTransferRequest',
      entityId: transferRequest.id,
      description: `Transfer request ${requestId} approved`,
      newValues: { status: 'APPROVED', approverId },
    });

    return {
      status: TransferRequestStatus.APPROVED,
      message: 'Transfer request approved successfully.',
    };
  }

  /**
   * معالجة الاعتماد الثنائي
   */
  private static async processDualAuthApproval(
    transferRequest: any,
    approverId: string,
    approvalNote?: string,
  ): Promise<{
    status: TransferRequestStatus;
    message: string;
  }> {
    // الحالة الأولى: بانتظار الاعتماد الأول (PENDING + no firstApproverId)
    if (transferRequest.status === 'PENDING' && !transferRequest.firstApproverId) {
      await prisma.custodyTransferRequest.update({
        where: { requestId: transferRequest.requestId },
        data: {
          firstApproverId: approverId,
          firstApprovalAt: new Date(),
          firstApprovalNote: approvalNote,
          status: TransferRequestStatus.FIRST_APPROVED,
        },
      });

      await this.logAuditEvent({
        userId: approverId,
        action: 'DUAL_AUTH_FIRST_APPROVAL',
        entityType: 'CustodyTransferRequest',
        entityId: transferRequest.id,
        description: `First approval granted for transfer request ${transferRequest.requestId}`,
        newValues: { status: 'FIRST_APPROVED', approverId },
      });

      return {
        status: TransferRequestStatus.FIRST_APPROVED,
        message: 'First approval granted. Awaiting second authorization.',
      };
    }

    // الحالة الثانية: بانتظار الاعتماد الثاني (FIRST_APPROVED + has firstApproverId)
    if (transferRequest.status === 'FIRST_APPROVED' && transferRequest.firstApproverId) {
      if (approverId === transferRequest.firstApproverId) {
        throw new Error(
          'Four-Eyes Principle violation: Second approver must be different from first approver',
        );
      }

      await prisma.custodyTransferRequest.update({
        where: { requestId: transferRequest.requestId },
        data: {
          secondApproverId: approverId,
          secondApprovalAt: new Date(),
          secondApprovalNote: approvalNote,
          status: TransferRequestStatus.APPROVED,
        },
      });

      await this.logAuditEvent({
        userId: approverId,
        action: 'DUAL_AUTH_SECOND_APPROVAL',
        entityType: 'CustodyTransferRequest',
        entityId: transferRequest.id,
        description: `Second approval granted — transfer request ${transferRequest.requestId} fully authorized`,
        newValues: {
          status: 'APPROVED',
          approverId,
        },
      });

      return {
        status: TransferRequestStatus.APPROVED,
        message: 'Second approval granted. Transfer request fully authorized and ready for execution.',
      };
    }

    throw new Error(`Unexpected transfer request status: ${transferRequest.status}`);
  }

  /**
   * رفض طلب نقل
   */
  static async rejectTransferRequest(params: {
    requestId: string;
    rejectorId: string;
    rejectionReason: string;
  }): Promise<void> {
    const { requestId, rejectorId, rejectionReason } = params;

    const transferRequest = await prisma.custodyTransferRequest.findUnique({
      where: { requestId },
    });

    if (!transferRequest) {
      throw new Error('Transfer request not found');
    }

    // التحقق من الصلاحية
    const rejector = await prisma.user.findUnique({
      where: { id: rejectorId },
      include: { role: true },
    });

    if (!rejector || !rejector.isActive) {
      throw new Error('Invalid or inactive rejector');
    }

    await prisma.custodyTransferRequest.update({
      where: { requestId },
      data: {
        status: TransferRequestStatus.REJECTED,
        rejectionReason,
      },
    });

    await this.logAuditEvent({
      userId: rejectorId,
      action: 'TRANSFER_REJECTED',
      entityType: 'CustodyTransferRequest',
      entityId: transferRequest.id,
      description: `Transfer request ${requestId} rejected: ${rejectionReason}`,
      newValues: { status: 'REJECTED', rejectionReason, rejectorId },
    });
  }

  /**
   * تنفيذ النقل الفعلي بعد الحصول على الاعتماد
   */
  static async executeTransfer(params: {
    requestId: string;
    executedBy: string;
    trackingNumber?: string;
    transportMethod?: string;
    handoverNotes?: string;
  }): Promise<{
    custodyId: string;
    status: string;
  }> {
    const { requestId, executedBy, trackingNumber, transportMethod, handoverNotes } = params;

    const transferRequest = await prisma.custodyTransferRequest.findUnique({
      where: { requestId },
    });

    if (!transferRequest) {
      throw new Error('Transfer request not found');
    }

    if (transferRequest.status !== TransferRequestStatus.APPROVED) {
      throw new Error('Transfer request must be approved before execution');
    }

    // إنشاء سجل الحيازة الجديد
    const custodyId = `COC-${Date.now().toString(36).toUpperCase()}`;

    const chainOfCustody = await prisma.chainOfCustody.create({
      data: {
        custodyId,
        assetId: transferRequest.assetId,
        fromEntityId: transferRequest.fromEntityId,
        toEntityId: transferRequest.toEntityId,
        transferType: 'EXTERNAL',
        requiresDualAuth: transferRequest.requiresDualAuth,
        dualAuthStatus: TransferRequestStatus.APPROVED,
        initiatedBy: transferRequest.initiatedById || '',
        approvedBy: transferRequest.secondApproverId || transferRequest.firstApproverId,
        transportMethod: transportMethod as any,
        trackingNumber,
        handoverNotes,
        status: CustodyEventStatus.PENDING,
        eventTimestamp: new Date(),
      },
    });

    // تحديث حالة الأصل
    await prisma.goldAsset.update({
      where: { id: transferRequest.assetId },
      data: { status: 'IN_TRANSIT' },
    });

    // تحديث طلب النقل
    await prisma.custodyTransferRequest.update({
      where: { requestId },
      data: {
        status: TransferRequestStatus.IN_TRANSIT,
        custodyId: chainOfCustody.id,
      },
    });

    // تسجيل الحدث
    await this.logAuditEvent({
      userId: executedBy,
      action: 'TRANSFER_EXECUTED',
      entityType: 'ChainOfCustody',
      entityId: chainOfCustody.id,
      description: `Transfer executed for request ${requestId}`,
      newValues: { custodyId, trackingNumber, transportMethod },
    });

    logger.info('Transfer executed', {
      requestId,
      custodyId,
      assetId: transferRequest.assetId,
    });

    return {
      custodyId: chainOfCustody.id,
      status: 'IN_TRANSIT',
    };
  }

  /**
   * استلام الأصل في وجهته
   */
  static async confirmDelivery(params: {
    custodyId: string;
    receivedBy: string;
    receivedAt: Date;
    condition: string;
    photoEvidenceUrl?: string;
    sealVerified?: boolean;
    sealNumber?: string;
  }): Promise<void> {
    const { custodyId, receivedBy, receivedAt, condition, photoEvidenceUrl, sealVerified, sealNumber } = params;

    const custody = await prisma.chainOfCustody.findFirst({
      where: { custodyId },
    });

    if (!custody) {
      throw new Error('Custody record not found');
    }

    // تحديث سجل الحيازة
    await prisma.chainOfCustody.update({
      where: { id: custody.id },
      data: {
        status: CustodyEventStatus.COMPLETED,
        actualArrival: receivedAt,
        photoEvidenceUrl,
        signatureHash: sha256Hash(`${custodyId}|${receivedBy}|${receivedAt.toISOString()}`),
      },
    });

    // تحديث حالة الأصل
    await prisma.goldAsset.update({
      where: { id: custody.assetId },
      data: { status: 'DELIVERED' },
    });

    // تحديث المخزون في الخزينة الجديدة
    await prisma.goldErpInventory.updateMany({
      where: { assetId: custody.assetId },
      data: {
        custodyStatus: 'SECURE',
        lastMovementType: 'RECEIPT',
        lastMovementAt: receivedAt,
      },
    });

    // تسجيل الحدث
    await this.logAuditEvent({
      userId: receivedBy,
      action: 'DELIVERY_CONFIRMED',
      entityType: 'ChainOfCustody',
      entityId: custody.id,
      description: `Delivery confirmed for custody ${custodyId}`,
      newValues: { condition, sealVerified, photoEvidenceUrl },
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static checkTransferPermission(hierarchy: number): boolean {
    // فقط المستخدمون من المستوى 3 فما فوق يمكنهم طلب النقل
    return hierarchy >= 3;
  }

  private static async getEntityForWarehouse(warehouseId: string) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: { id: true },
    });
    return warehouse || { id: warehouseId };
  }

  private static async logAuditEvent(params: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    description: string;
    newValues?: Record<string, unknown>;
  }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        newValues: params.newValues as any,
        severity: 'INFO',
        category: 'OPERATION',
      },
    });
  }
}
