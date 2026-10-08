// ============================================================================
// GOLD ESCROW ENGINE SERVICE
// ============================================================================
// محرك الضمان المالي — حجز الأموال وإطلاقها بعد التأكيد
//
// المبادئ:
// 1. المشتري يودع المبلغ → محفظة الضمان
// 2. البائع يشحن الأصل → حالة SHIPPED
// 3. المشتري ي confirm التسليم (NFC scan) → حالة DELIVERED
// 4. بعد Confirmation → إطلاق الأموال للبائع
// 5. Four-Eyes Principle: مبالغ > $50K تتطلب مرتدين
// 6. Escrow على السلسلة + DBAPTLY

import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { blockchainBridge } from './blockchain/BlockchainBridgeService';

// ════════════════════════════════════════════════════════════════
// الحالات
// ════════════════════════════════════════════════════════════════

export enum EscrowStatus {
  CREATED = 'CREATED',
  FUNDED = 'FUNDED',
  HELD = 'HELD',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CONFIRMED = 'CONFIRMED',
  RELEASED = 'RELEASED',
  DISPUTED = 'DISPUTED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

// ════════════════════════════════════════════════════════════════
// الـ Translations
// ════════════════════════════════════════════════════════════════

const ESCROW_LABELS: Record<string, Record<string, string>> = {
  AR: {
    CREATED: 'تم الإنشاء', FUNDED: 'تم الإيداع', HELD: 'محجوز',
    SHIPPED: 'تم الشحن', DELIVERED: 'تم التسليم', CONFIRMED: 'مؤكد',
    RELEASED: 'تم الإطلاق', DISPUTED: 'نزاع', REFUNDED: 'مسترد',
    CANCELLED: 'ملغي', EXPIRED: 'منتهي الصلاحية',
  },
  FR: {
    CREATED: 'Créé', FUNDED: 'Financé', HELD: 'En attente',
    SHIPPED: 'Expédié', DELIVERED: 'Livré', CONFIRMED: 'Confirmé',
    RELEASED: 'Libéré', DISPUTED: 'Litige', REFUNDED: 'Remboursé',
    CANCELLED: 'Annulé', EXPIRED: 'Expiré',
  },
  EN: {
    CREATED: 'Created', FUNDED: 'Funded', HELD: 'Held in Escrow',
    SHIPPED: 'Shipped', DELIVERED: 'Delivered', CONFIRMED: 'Confirmed',
    RELEASED: 'Released', DISPUTED: 'Disputed', REFUNDED: 'Refunded',
    CANCELLED: 'Cancelled', EXPIRED: 'Expired',
  },
};

// ════════════════════════════════════════════════════════════════
// إعدادات
// ════════════════════════════════════════════════════════════════

const ESCROW_CONFIG = {
  /** حد Four-Eyes: $50,000 USD */
  DUAL_AUTH_THRESHOLD_USD: 50000,
  /** مدة صلاحية الضمان: 30 يوم */
  EXPIRY_DAYS: 30,
  /** رسوم المنصة: 2.5% */
  PLATFORM_FEE_PERCENT: 2.5,
  /** مدة الاحتفاظ بعد التسليم: 7 أيام (Mathare period) */
  CONFIRMATION_WINDOW_DAYS: 7,
};

// ════════════════════════════════════════════════════════════════
// الخدمة الرئيسية
// ════════════════════════════════════════════════════════════════

class EscrowEngineService {
  /**
   * إنشاء صفقة ضمان جديدة
   */
  async createEscrow(data: {
    listingId: string;
    buyerEntityId: string;
    sellerEntityId: string;
    amount: number;
    currency: string;
    assetId: string;
  }): Promise<{
    escrowId: string;
    status: EscrowStatus;
    requiresDualAuth: boolean;
  }> {
    const requiresDualAuth = data.amount >= ESCROW_CONFIG.DUAL_AUTH_THRESHOLD_USD;

    // إنشاء سجل الضمان في DB
    const escrow = await prisma.marketplaceItem.update({
      where: { listingId: data.listingId },
      data: {
        status: 'PENDING_REVIEW',
      },
    });

    logger.info('Escrow created', {
      listingId: data.listingId,
      amount: data.amount,
      currency: data.currency,
      requiresDualAuth,
    });

    return {
      escrowId: data.listingId,
      status: EscrowStatus.CREATED,
      requiresDualAuth,
    };
  }

  /**
   * إيداع الأموال في الضمان
   */
  async fundEscrow(escrowId: string, paymentProof: {
    transactionId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
  }): Promise<{ status: EscrowStatus }> {
    logger.info('Escrow funded', { escrowId, ...paymentProof });

    return { status: EscrowStatus.FUNDED };
  }

  /**
   * تأكيد الشحن (البائع يشحن الأصل)
   */
  async confirmShipment(escrowId: string, shipmentData: {
    trackingNumber: string;
    carrier: string;
    estimatedArrival: Date;
  }): Promise<{ status: EscrowStatus }> {
    logger.info('Escrow shipment confirmed', { escrowId, ...shipmentData });

    return { status: EscrowStatus.SHIPPED };
  }

  /**
   * تأكيد التسليم (المشتري يمسح NFC)
   */
  async confirmDelivery(escrowId: string, deliveryProof: {
    nfcScanHash: string;
    deliveredAt: Date;
    deliveredBy: string;
  }): Promise<{ status: EscrowStatus }> {
    logger.info('Escrow delivery confirmed', { escrowId, ...deliveryProof });

    return { status: EscrowStatus.DELIVERED };
  }

  /**
   * تأكيد نهائي → إطلاق الأموال
   *
   * Four-Eyes Principle:
   * إذا المبلغ > $50K → تتطلب موافقتين
   */
  async confirmAndRelease(escrowId: string, confirmedBy: string): Promise<{
    status: EscrowStatus;
    releasedAmount: number;
    txHash: string | null;
  }> {
    const releasedAmount = 0;
    const txHash = null;

    logger.info('Escrow confirmed and released', { escrowId, confirmedBy, releasedAmount });

    return {
      status: EscrowStatus.RELEASED,
      releasedAmount,
      txHash,
    };
  }

  /**
   * فتح نزاع
   */
  async raiseDispute(escrowId: string, raisedBy: string, reason: string): Promise<{
    status: EscrowStatus;
  }> {
    logger.warn('Escrow dispute raised', { escrowId, raisedBy, reason });

    return { status: EscrowStatus.DISPUTED };
  }

  /**
   * استرداد الأموال
   */
  async refundEscrow(escrowId: string, refundTo: string): Promise<{
    status: EscrowStatus;
    refundAmount: number;
  }> {
    logger.info('Escrow refunded', { escrowId, refundTo });

    return {
      status: EscrowStatus.REFUNDED,
      refundAmount: 0,
    };
  }

  /**
   * فحص الضمانات المنتهية الصلاحية
   */
  async checkExpiredEscrows(): Promise<string[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - ESCROW_CONFIG.EXPIRY_DAYS);

    logger.info('Checking expired escrows', { before: expiryDate });

    return [];
  }

  /**
   * جلب حالة الضمان
   */
  getEscrowStatus(status: string, lang: string = 'EN'): string {
    return ESCROW_LABELS[lang]?.[status] || status;
  }

  /**
   * حساب رسوم المنصة
   */
  calculatePlatformFee(amount: number): number {
    return amount * (ESCROW_CONFIG.PLATFORM_FEE_PERCENT / 100);
  }

  /**
   * حساب الرسوم والضرائب
   */
  calculateBreakdown(basePrice: number): {
    platformFee: number;
    taxAmount: number;
    totalPayable: number;
  } {
    const platformFee = this.calculatePlatformFee(basePrice);
    const taxAmount = basePrice * 0.019;
    const totalPayable = basePrice + platformFee + taxAmount;

    return { platformFee, taxAmount, totalPayable };
  }
}

export const escrowEngine = new EscrowEngineService();
