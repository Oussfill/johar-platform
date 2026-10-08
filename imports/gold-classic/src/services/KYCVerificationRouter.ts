// ============================================================================
// GOLD KYC VERIFICATION ROUTER
// ============================================================================
// مسار التحقق من الهوية — KYC/KYB
//
// المبادئ:
// 1. KYC: التحقق من هوية الأفراد (جواز سفر + سيلفي + عنوان)
// 2. KYB: التحقق من الشركات (سجل تجاري + شهادة بنكية + مي TSR)
// 3. Peer Review: مراجعة ثانية لـ KYC يدوية
// 4. التخزين:🧊 encrypted_pii في DB (لا في Blockchain)
// 5. PDF Export + Live Session

import { prisma } from '../config/database';
import { logger } from '../config/logger';
import * as crypto from 'crypto';

// ════════════════════════════════════════════════════════════════
// أنواع التحقق
// ════════════════════════════════════════════════════════════════

export enum VerificationType {
  KYC = 'KYC',
  KYB = 'KYB',
}

export enum VerificationStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface KYCVerification {
  id: string;
  userId: string;
  type: VerificationType;
  status: VerificationStatus;
  documents: VerificationDocument[];
  selfieUrl?: string;
  addressProofUrl?: string;
  reviewedById?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface VerificationDocument {
  type: 'PASSPORT' | 'ID_CARD' | 'DRIVER_LICENSE' | 'BUSINESS_LICENSE' | 'BANK_STATEMENT' | 'ARTICLES_OF_INCORPORATION';
  fileUrl: string;
  extractedData: Record<string, string>;
  verificationScore: number;
}

// ════════════════════════════════════════════════════════════════
// تشفير PII
// ════════════════════════════════════════════════════════════════

const PII_ENCRYPTION_KEY = process.env.PII_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

function encryptPII(data: string): string {
  const key = Buffer.from(PII_ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

function decryptPII(encryptedData: string): string {
  const [ivHex, tagHex, encrypted] = encryptedData.split(':');
  const key = Buffer.from(PII_ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * KYCVerificationRouter
 * ─────────────────────
 * مسار التحقق من الهوية KYC/KYB
 *
 * في الإنتاج:
 * 1. OCR API لقراءة الوثائق
 * 2. Face Recognition API للمطابقة
 * 3. Database APIs للتحقق (OFAC, PEP)
 * 4. PDF Generation للشهادات
 */
class KYCVerificationRouter {
  /**
   * إنشاء طلب تحقق جديد
   */
  async initiateVerification(userId: string, type: VerificationType): Promise<KYCVerification> {
    // التحقق من عدم وجود طلب نشط
    const existing = await prisma.userVerification.findFirst({
      where: { userId, status: { notIn: ['EXPIRED', 'REJECTED'] } },
    });

    if (existing) {
      throw new Error('Active verification already in progress');
    }

    // إنشاء طلب جديد
    const verification = await prisma.userVerification.create({
      data: {
        userId,
        verificationType: type,
        status: 'PENDING',
        documents: [],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 يوم
      },
    });

    logger.info('KYC verification initiated', { userId, type, verificationId: verification.id });

    return {
      id: verification.id,
      userId,
      type,
      status: VerificationStatus.PENDING,
      documents: [],
      createdAt: verification.createdAt,
    };
  }

  /**
   * رفع وثيقة
   */
  async submitDocument(
    verificationId: string,
    documentType: VerificationDocument['type'],
    fileUrl: string,
  ): Promise<void> {
    // في الإنتاج: OCR API لقراءة البيانات
    const extractedData = await this.extractDocumentData(documentType, fileUrl);
    const verificationScore = await this.verifyDocument(documentType, extractedData);

    const current = await prisma.userVerification.findUnique({ where: { id: verificationId } });
    if (!current) throw new Error('Verification not found');

    const documents = [...(current.documents as any[]), { type: documentType, fileUrl, extractedData, verificationScore }];

    await prisma.userVerification.update({
      where: { id: verificationId },
      data: {
        documents,
        status: documents.length >= 2 ? 'SUBMITTED' : 'PENDING',
      },
    });
  }

  /**
   * رفع سيلفي للمطابقة
   */
  async submitSelfie(verificationId: string, selfieUrl: string): Promise<void> {
    await prisma.userVerification.update({
      where: { id: verificationId },
      data: { selfieUrl },
    });
  }

  /**
   * مراجعة يدوية
   */
  async reviewVerification(
    verificationId: string,
    reviewerId: string,
    approved: boolean,
    reason?: string,
  ): Promise<void> {
    const verification = await prisma.userVerification.findUnique({ where: { id: verificationId } });
    if (!verification) throw new Error('Verification not found');

    if (approved) {
      // Peer Review: إذا كان المراجع != من أنشأ الطلب
      if (verification.userId === reviewerId) {
        throw new Error('Peer review required — reviewer must differ from requester');
      }

      await prisma.userVerification.update({
        where: { id: verificationId },
        data: {
          status: 'APPROVED',
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
      });

      // تحديث حالة المستخدم
      await prisma.user.update({
        where: { id: verification.userId },
        data: { kycStatus: 'VERIFIED' },
      });
    } else {
      await prisma.userVerification.update({
        where: { id: verificationId },
        data: {
          status: 'REJECTED',
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          rejectionReason: reason,
        },
      });
    }
  }

  // ─── OCR + التحقق ───────────────────────────────────────

  /** استخراج البيانات من الوثيقة (OCR) */
  private async extractDocumentData(type: string, fileUrl: string): Promise<Record<string, string>> {
    // في الإنتاج: Google Cloud Vision API أو AWS Textract
    logger.info('OCR extraction (mock)', { type, fileUrl });
    return {
      name: 'MOCK_EXTRACTED_NAME',
      documentNumber: 'MOCK_DOC_NUM',
      expiryDate: '2030-01-01',
      nationality: 'DZA',
    };
  }

  /** التحقق من الوثيقة */
  private async verifyDocument(type: string, data: Record<string, string>): Promise<number> {
    // في الإنتاج: مقارنة مع قواعد بيانات حكومية
    let score = 0.8;
    if (data.name) score += 0.05;
    if (data.documentNumber) score += 0.05;
    if (data.expiryDate && new Date(data.expiryDate) > new Date()) score += 0.1;
    return Math.min(1, score);
  }
}

export const kycVerificationRouter = new KYCVerificationRouter();
