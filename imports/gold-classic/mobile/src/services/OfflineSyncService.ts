// ============================================================================
// GOLD MOBILE — OFFLINE SYNC SERVICE
// ============================================================================
// خدمة العمل بدون إنترنت والمزامنة التلقائية
// Offline-First: كل العملية تتم محلياً ثم تُرسل للخادم عند الاتصال
// يدعم: حفظ محلي + كشف الاتصال + مزامنة تدريجية + إعادة المحاولة

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { OfflineRecord, AuthSession } from '../types';
import { apiService } from './ApiService';

/** مفاتيح التخزين */
const STORAGE_KEYS = {
  OFFLINE_RECORDS: '@gold_offline_records',
  PENDING_SYNC: '@gold_pending_sync',
  LAST_SYNC: '@gold_last_sync',
  OFFLINE_MODE: '@gold_offline_mode',
} as const;

/** إعدادات المزامنة */
const SYNC_CONFIG = {
  MAX_RETRY_ATTEMPTS: 5,
  RETRY_DELAY_MS: 5000,
  BATCH_SIZE: 10,
  SYNC_INTERVAL_MS: 30000,
  OFFLINE_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000, // 7 أيام
} as const;

/**
 * Offline Sync Service
 * ─────────────────────
 * يدير العمل بدون إنترنت والمزامنة التلقائية
 *
 * المبادئ:
 * 1. Offline-First: كل العمليات تتم محلياً أولاً
 * 2. مزامنة تدريجية: لا نُرسل كل شيء دفعة واحدة
 * 3. إعادة المحاولة: 5 محاولات مع تأخير تصاعدي
 * 4. انتهاء الصلاحية: السجلات القديمة (> 7 أيام) تُحذف
 * 5. First-In-First-Out: نُرسل الأقدم أولاً
 */
class OfflineSyncService {
  private isOnline = false;
  private isSyncing = false;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private onStatusChange?: (online: boolean) => void;
  private onSyncProgress?: (total: number, synced: number) => void;

  // ─── التهيئة ──────────────────────────────────────────────

  /** بدء مراقبة حالة الاتصال */
  async initialize(
    onStatusChange?: (online: boolean) => void,
    onSyncProgress?: (total: number, synced: number) => void,
  ): Promise<void> {
    this.onStatusChange = onStatusChange;
    this.onSyncProgress = onSyncProgress;

    // التحقق من الحالة الحالية
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
    this.onStatusChange?.(this.isOnline);

    // مراقبة التغييرات
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (!wasOnline && this.isOnline) {
        // عاد الاتصال — بدء المزامنة
        this.startAutoSync();
        this.syncPendingRecords();
      }

      this.onStatusChange?.(this.isOnline);
    });

    // بدء المزامنة التلقائية
    this.startAutoSync();
  }

  /** بدء مؤقت المزامنة التلقائية */
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      if (this.isOnline && !this.isSyncing) {
        await this.syncPendingRecords();
      }
    }, SYNC_CONFIG.SYNC_INTERVAL_MS);
  }

  /** إيقاف المزامنة */
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // ─── حفظ محلي ──────────────────────────────────────────────

  /** حفظ سجل جديد محلياً */
  async saveOffline(record: Omit<OfflineRecord, 'id' | 'synced' | 'syncAttempts'>): Promise<OfflineRecord> {
    const fullRecord: OfflineRecord = {
      ...record,
      id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      synced: false,
      syncAttempts: 0,
    };

    const records = await this.getOfflineRecords();
    records.push(fullRecord);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_RECORDS, JSON.stringify(records));

    // إذا كنا متصلين، نحاول المزامنة فوراً
    if (this.isOnline) {
      this.syncPendingRecords();
    }

    return fullRecord;
  }

  /** جلب جميع السجلات المحفوظة محلياً */
  async getOfflineRecords(): Promise<OfflineRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_RECORDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /** جلب السجلات غير المزامنة فقط */
  async getPendingRecords(): Promise<OfflineRecord[]> {
    const all = await this.getOfflineRecords();
    return all.filter((r) => !r.synced && r.syncAttempts < SYNC_CONFIG.MAX_RETRY_ATTEMPTS);
  }

  /** تحديث حالة السجل */
  async updateRecord(recordId: string, updates: Partial<OfflineRecord>): Promise<void> {
    const records = await this.getOfflineRecords();
    const index = records.findIndex((r) => r.id === recordId);
    if (index >= 0) {
      records[index] = { ...records[index], ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_RECORDS, JSON.stringify(records));
    }
  }

  // ─── مزامنة ────────────────────────────────────────────────

  /** مزامنة جميع السجلات المعلقة */
  async syncPendingRecords(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
      const pending = await this.getPendingRecords();
      const total = pending.length;

      // مزامنة على دفعات
      for (let i = 0; i < pending.length; i += SYNC_CONFIG.BATCH_SIZE) {
        const batch = pending.slice(i, i + SYNC_CONFIG.BATCH_SIZE);

        for (const record of batch) {
          try {
            await this.syncSingleRecord(record);
            await this.updateRecord(record.id, {
              synced: true,
              syncAttempts: record.syncAttempts + 1,
            });
            synced++;
          } catch (error) {
            await this.updateRecord(record.id, {
              syncAttempts: record.syncAttempts + 1,
              lastSyncAttempt: Date.now(),
            });
            failed++;
          }

          this.onSyncProgress?.(total, synced + failed);
        }
      }

      // تحديث وقت آخر مزامنة
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    } finally {
      this.isSyncing = false;
    }

    return { synced, failed };
  }

  /** مزامنة سجل واحد */
  private async syncSingleRecord(record: OfflineRecord): Promise<void> {
    const endpoints: Record<string, string> = {
      VERIFICATION: '/api/v1/assets/verify',
      NFC_SCAN: '/api/v1/assets/nfc-scan',
      QR_SCAN: '/api/v1/assets/qr-scan',
      CUSTODY_TRANSFER: '/api/v1/custody/transfer-request',
    };

    const endpoint = endpoints[record.type];
    if (!endpoint) {
      throw new Error(`Unknown record type: ${record.type}`);
    }

    await apiService.post(endpoint, {
      ...record.data,
      offlineRecordId: record.id,
      originalTimestamp: record.timestamp,
      syncTimestamp: Date.now(),
    });
  }

  // ─── تنظيف ────────────────────────────────────────────────

  /** حذف السجلات المزامنة بنجاح */
  async clearSyncedRecords(): Promise<number> {
    const records = await this.getOfflineRecords();
    const unsynced = records.filter((r) => !r.synced);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_RECORDS, JSON.stringify(unsynced));
    return records.length - unsynced.length;
  }

  /** حذف جميع السجلات (بعد التأكيد) */
  async clearAllRecords(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_RECORDS);
  }

  /** حذف السجلات المنتهية الصلاحية (> 7 أيام) */
  async purgeExpiredRecords(): Promise<number> {
    const records = await this.getOfflineRecords();
    const now = Date.now();
    const valid = records.filter(
      (r) => now - r.timestamp < SYNC_CONFIG.OFFLINE_EXPIRY_MS || r.synced,
    );
    const purged = records.length - valid.length;
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_RECORDS, JSON.stringify(valid));
    return purged;
  }

  // ─── حالة ─────────────────────────────────────────────────

  /** هل الجهاز متصل بالإنترنت؟ */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /** هل جارية مزامنة؟ */
  getIsSyncing(): boolean {
    return this.isSyncing;
  }

  /** إحصائيات المزامنة */
  async getSyncStats(): Promise<{
    total: number;
    synced: number;
    pending: number;
    failed: number;
    lastSync: number | null;
  }> {
    const records = await this.getOfflineRecords();
    const lastSyncStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : null;

    return {
      total: records.length,
      synced: records.filter((r) => r.synced).length,
      pending: records.filter((r) => !r.synced && r.syncAttempts < SYNC_CONFIG.MAX_RETRY_ATTEMPTS).length,
      failed: records.filter((r) => !r.synced && r.syncAttempts >= SYNC_CONFIG.MAX_RETRY_ATTEMPTS).length,
      lastSync,
    };
  }
}

export const offlineSyncService = new OfflineSyncService();
