// ============================================================================
// GOLD BLOCKCHAIN BRIDGE SERVICE
// ============================================================================
// خدمة الربط بين Express ERP والعقود الذكية على Polygon
//
// المبادئ:
// 1. كل حدث ERP → إثبات على السلسلة (.hash فقط، لا PII)
// 2. إرسال تلقائي عند: تسجيل أصل / فحص مختبري / نقل حيازة
// 3. التحقق من سلسلة الأدلة عبر العقد
// 4. Retry مع backoff على أخطاء الشبكة
// 5. تسجيل كل عملية blockchain في AuditLog

import { ethers, Contract, Wallet, JsonRpcProvider } from 'ethers';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { sha256Hash } from '../../utils/crypto';

// ════════════════════════════════════════════════════════════════
// ABI المختصر للعقود الذكية
// ════════════════════════════════════════════════════════════════

const GOLD_EVIDENCE_LEDGER_ABI = [
  'function recordEvidence(bytes32 goldIdHash, uint8 eventType, bytes32 evidenceHash) external returns (uint256)',
  'function verifyChain(bytes32 goldIdHash) external view returns (bool, uint256)',
  'function getEvidence(uint256 evidenceId) external view returns (tuple(uint256 id, bytes32 goldIdHash, uint8 eventType, bytes32 evidenceHash, bytes32 previousHash, uint256 blockNumber, uint256 timestamp, address recordedBy, bool exists))',
  'function getAssetStats(bytes32 goldIdHash) external view returns (uint256, uint256, bytes32)',
  'function getEventHistory(bytes32 goldIdHash) external view returns (uint256[])',
  'function isAuthorized(address recorder) external view returns (bool)',
  'function getTotalEvidence() external view returns (uint256)',
  'event EvidenceRecorded(uint256 indexed evidenceId, bytes32 indexed goldIdHash, uint8 eventType, bytes32 evidenceHash, bytes32 previousHash, uint256 timestamp, address recordedBy)',
];

// ════════════════════════════════════════════════════════════════
// إعدادات الربط
// ════════════════════════════════════════════════════════════════

interface BlockchainConfig {
  /** شبكة Polygon (mainnet أو mumbai testnet) */
  rpcUrl: string;
  /** عنوان العقد المسجل */
  contractAddress: string;
  /** مفتاح خاص للتوقيع (يُحفظ في env) */
  privateKey: string;
  /** Chain ID */
  chainId: number;
  /** هل الربط نشط؟ */
  enabled: boolean;
  /** عدد محاولات الإعادة */
  maxRetries: number;
  /** تأخير الإعادة (ms) */
  retryDelayMs: number;
}

const DEFAULT_CONFIG: BlockchainConfig = {
  rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
  contractAddress: process.env.GOLD_LEDGER_CONTRACT || '',
  privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || '',
  chainId: 137, // Polygon Mainnet
  enabled: process.env.BLOCKCHAIN_ENABLED === 'true',
  maxRetries: 3,
  retryDelayMs: 2000,
};

// ════════════════════════════════════════════════════════════════
// أنواع الأحداث
// ════════════════════════════════════════════════════════════════

/**
 * EventType enum — يطابق العقد الذكي
 * 0: ASSET_REGISTRATION
 * 1: ASSAY_RESULT
 * 2: CUSTODY_TRANSFER
 * 3: PASSPORT_ISSUED
 * 4: PASSPORT_REVOKED
 * 5: NFC_LOCKED
 * 6: MARKETPLACE_LISTED
 * 7: MARKETPLACE_SOLD
 */
enum BlockchainEventType {
  ASSET_REGISTRATION = 0,
  ASSAY_RESULT = 1,
  CUSTODY_TRANSFER = 2,
  PASSPORT_ISSUED = 3,
  PASSPORT_REVOKED = 4,
  NFC_LOCKED = 5,
  MARKETPLACE_LISTED = 6,
  MARKETPLACE_SOLD = 7,
}

/**
 * BlockchainBridgeService
 * ────────────────────────
 * يربط أحداث Express ERP بالعقود الذكية على Polygon
 *
 * Flow:
 * 1. حدث ERP (asset.register, assay.complete, custody.transfer)
 * 2. تجهيز البيانات: hash(Gold ID) + hash(evidence JSON)
 * 3. استدعاء العقد الذكي: recordEvidence()
 * 4. حفظ tx hash في BlockchainEvidence table
 * 5. تسجيل في AuditLog
 */
class BlockchainBridgeService {
  private provider: JsonRpcProvider | null = null;
  private wallet: Wallet | null = null;
  private contract: Contract | null = null;
  private config: BlockchainConfig;
  private isInitialized = false;

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  // ─── التهيئة ──────────────────────────────────────────────

  /** تهيئة الاتصال بالبلوكشين */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      logger.info('Blockchain bridge is disabled');
      return;
    }

    try {
      // إنشاء Provider
      this.provider = new JsonRpcProvider(this.config.rpcUrl, this.config.chainId);

      // إنشاء Wallet للتوقيع
      if (this.config.privateKey) {
        this.wallet = new Wallet(this.config.privateKey, this.provider);
      }

      // ربط بالعقد
      if (this.config.contractAddress && this.wallet) {
        this.contract = new Contract(
          this.config.contractAddress,
          GOLD_EVIDENCE_LEDGER_ABI,
          this.wallet,
        );
      }

      this.isInitialized = true;
      logger.info('Blockchain bridge initialized', {
        rpcUrl: this.config.rpcUrl,
        contract: this.config.contractAddress,
        chainId: this.config.chainId,
      });
    } catch (error) {
      logger.error('Blockchain bridge initialization failed', { error });
      // لا ن停下 الخادم إذا فشل البلوكشين
    }
  }

  // ─── تسجيل الأحداث ───────────────────────────────────────

  /**
   * تسجيل أصل جديد على البلوكشين
   *
   * @param goldId — Gold ID الأصلي
   * @param assetData — بيانات الأصل للإثبات
   * @returns tx hash أو null إذا كان الربط معطلاً
   */
  async recordAssetRegistration(
    goldId: string,
    assetData: {
      serialNumber: string;
      metalType: string;
      karat: number;
      weightGross: string;
      weightNet: string;
      measuredPurity: string;
      productType: string;
    },
  ): Promise<string | null> {
    return this.recordEvent(
      goldId,
      BlockchainEventType.ASSET_REGISTRATION,
      {
        action: 'ASSET_REGISTRATION',
        ...assetData,
        timestamp: new Date().toISOString(),
      },
    );
  }

  /**
   * تسجيل نتيجة فحص مختبري
   */
  async recordAssayResult(
    goldId: string,
    assayData: {
      reportNumber: string;
      measuredPurity: string;
      certifiedKarat: number;
      labId: string;
      assayMethod: string;
      overallResult: string;
    },
  ): Promise<string | null> {
    return this.recordEvent(
      goldId,
      BlockchainEventType.ASSAY_RESULT,
      {
        action: 'ASSAY_RESULT',
        ...assayData,
        timestamp: new Date().toISOString(),
      },
    );
  }

  /**
   * تسجيل نقل حيازة
   */
  async recordCustodyTransfer(
    goldId: string,
    transferData: {
      fromEntityId: string;
      toEntityId: string;
      transferType: string;
      custodyId: string;
    },
  ): Promise<string | null> {
    return this.recordEvent(
      goldId,
      BlockchainEventType.CUSTODY_TRANSFER,
      {
        action: 'CUSTODY_TRANSFER',
        ...transferData,
        timestamp: new Date().toISOString(),
      },
    );
  }

  /**
   * تسجيل إصدار جواز رقمي
   */
  async recordPassportIssued(
    goldId: string,
    passportData: {
      passportNumber: string;
      certifiedPurity: number;
      certifiedKarat: number;
    },
  ): Promise<string | null> {
    return this.recordEvent(
      goldId,
      BlockchainEventType.PASSPORT_ISSUED,
      {
        action: 'PASSPORT_ISSUED',
        ...passportData,
        timestamp: new Date().toISOString(),
      },
    );
  }

  /**
   * تسجيل قفل شريحة NFC
   */
  async recordNfcLocked(
    goldId: string,
    nfcData: {
      uidHash: string;
      lockedAt: string;
    },
  ): Promise<string | null> {
    return this.recordEvent(
      goldId,
      BlockchainEventType.NFC_LOCKED,
      {
        action: 'NFC_LOCKED',
        ...nfcData,
        timestamp: new Date().toISOString(),
      },
    );
  }

  // ─── الدالة الأساسية ─────────────────────────────────────

  /**
   * تسجيل حدث عام على البلوكشين
   *
   * الخطوات:
   * 1. حفظ في DB (BlockchainEvidence) أولاً (Optimistic)
   * 2. hash(Gold ID) + hash(evidence data)
   * 3. استدعاء العقد الذكي مع retry
   * 4. تحديث DB بـ tx hash و block number
   * 5. تسجيل في AuditLog
   */
  private async recordEvent(
    goldId: string,
    eventType: BlockchainEventType,
    evidenceData: Record<string, any>,
  ): Promise<string | null> {
    if (!this.isInitialized || !this.contract) {
      logger.warn('Blockchain bridge not initialized — skipping');
      return null;
    }

    // حساب الـ hashes
    const goldIdHash = sha256Hash(goldId);
    const evidenceJson = JSON.stringify(evidenceData);
    const evidenceHash = sha256Hash(evidenceJson);

    // حفظ في DB أولاً (Optimistic Write)
    let dbRecord: any;
    try {
      dbRecord = await prisma.blockchainEvidence.create({
        data: {
          assetId: goldIdHash, // ربط مؤقت بالهاش
          eventType: this.eventTypeToEvidenceType(eventType),
          evidenceData,
          previousHash: 'PENDING',
          currentHash: evidenceHash,
          sourceSystem: 'ERP',
          sourceAction: this.eventTypeToString(eventType),
          transactionHash: null,
          blockNumber: null,
        },
      });
    } catch (error) {
      logger.error('Failed to create blockchain evidence record', { error });
      return null;
    }

    // إرسال للبلوكشين مع retry
    let txHash: string | null = null;
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const tx = await this.contract.recordEvidence(
          goldIdHash,
          eventType,
          evidenceHash,
        );

        // انتظار التأكيد
        const receipt = await tx.wait();
        txHash = receipt.hash;

        // تحديث DB
        await prisma.blockchainEvidence.update({
          where: { id: dbRecord.id },
          data: {
            transactionHash: txHash,
            blockNumber: receipt.blockNumber,
          },
        });

        logger.info('Event recorded on blockchain', {
          goldId,
          eventType: this.eventTypeToString(eventType),
          txHash,
          blockNumber: receipt.blockNumber,
        });

        break; // نجح — نخرج من الحلقة
      } catch (error: any) {
        logger.warn(`Blockchain attempt ${attempt} failed`, {
          goldId,
          error: error.message,
        });

        if (attempt < this.config.maxRetries) {
          await this.sleep(this.config.retryDelayMs * attempt);
        }
      }
    }

    // تسجيل في AuditLog
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'BLOCKCHAIN_EVENT_RECORDED',
        entityType: 'BlockchainEvidence',
        entityId: dbRecord.id,
        description: `Blockchain event: ${this.eventTypeToString(eventType)} for ${goldId}`,
        newValues: {
          txHash,
          eventType: this.eventTypeToString(eventType),
          goldIdHash,
          evidenceHash,
        },
        severity: txHash ? 'INFO' : 'WARNING',
        category: 'OPERATION',
      },
    });

    return txHash;
  }

  // ─── التحقق ──────────────────────────────────────────────

  /**
   * التحقق من سلسلة الأدلة لأصل
   */
  async verifyChain(goldId: string): Promise<{
    isValid: boolean;
    totalEvents: number;
  }> {
    if (!this.isInitialized || !this.contract) {
      return { isValid: false, totalEvents: 0 };
    }

    try {
      const goldIdHash = sha256Hash(goldId);
      const [isValid, totalEvents] = await this.contract.verifyChain(goldIdHash);
      return { isValid, totalEvents: Number(totalEvents) };
    } catch (error) {
      logger.error('Chain verification failed', { goldId, error });
      return { isValid: false, totalEvents: 0 };
    }
  }

  /**
   * جلب إحصائيات أصل من السلسلة
   */
  async getAssetStats(goldId: string): Promise<{
    totalEvents: number;
    lastEventTime: number;
    lastHash: string;
  } | null> {
    if (!this.isInitialized || !this.contract) return null;

    try {
      const goldIdHash = sha256Hash(goldId);
      const [totalEvents, lastEventTime, lastHash] = await this.contract.getAssetStats(goldIdHash);
      return {
        totalEvents: Number(totalEvents),
        lastEventTime: Number(lastEventTime),
        lastHash,
      };
    } catch {
      return null;
    }
  }

  // ─── أدوات مساعدة ────────────────────────────────────────

  /** تحويل EventType إلى نص */
  private eventTypeToString(type: BlockchainEventType): string {
    const map: Record<number, string> = {
      0: 'ASSET_REGISTRATION',
      1: 'ASSAY_RESULT',
      2: 'CUSTODY_TRANSFER',
      3: 'PASSPORT_ISSUED',
      4: 'PASSPORT_REVOKED',
      5: 'NFC_LOCKED',
      6: 'MARKETPLACE_LISTED',
      7: 'MARKETPLACE_SOLD',
    };
    return map[type] || 'UNKNOWN';
  }

  /** تحويل BlockchainEventType إلى EvidenceEventType */
  private eventTypeToEvidenceType(type: BlockchainEventType): any {
    const map: Record<number, string> = {
      0: 'ASSET_REGISTRATION',
      1: 'ASSAY_COMPLETION',
      2: 'CUSTODY_CHANGE',
      3: 'CERTIFICATION_ISSUED',
      4: 'CERTIFICATION_ISSUED',
      5: 'CUSTODY_CHANGE',
      6: 'MARKETPLACE_LISTING',
      7: 'SALE_COMPLETED',
    };
    return map[type] || 'ASSET_REGISTRATION';
  }

  /** تأخير */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// نسخة واحدة (Singleton)
export const blockchainBridge = new BlockchainBridgeService();
export { BlockchainEventType };
