// ============================================================================
// GOLD MOBILE — VERIFY HISTORY SCREEN
// ============================================================================
// شاشة سجل التحقق

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import { offlineSyncService } from '../services/OfflineSyncService';
import { t } from '../services/LocalizationService';
import { OfflineRecord } from '../types';

interface HistoryScreenProps {
  onBack: () => void;
}

export default function HistoryScreen({ onBack }: HistoryScreenProps) {
  const { language } = useAppContext();
  const [records, setRecords] = useState<OfflineRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, synced: 0, pending: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allRecords = await offlineSyncService.getOfflineRecords();
    setRecords(allRecords.sort((a, b) => b.timestamp - a.timestamp));

    const syncStats = await offlineSyncService.getSyncStats();
    setStats(syncStats);
  };

  const handleSync = async () => {
    const result = await offlineSyncService.syncPendingRecords();
    Alert.alert(
      t('common.success', language),
      language === 'AR'
        ? `تمت مزامنة ${result.synced} سجل`
        : `${result.synced} records synced`,
    );
    loadData();
  };

  const handleClearAll = () => {
    Alert.alert(
      t('common.confirm', language),
      language === 'AR' ? 'هل تريد مسح جميع السجلات؟' : 'Clear all records?',
      [
        { text: t('common.cancel', language), style: 'cancel' },
        {
          text: t('common.delete', language),
          style: 'destructive',
          onPress: async () => {
            await offlineSyncService.clearAllRecords();
            loadData();
          },
        },
      ],
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'NFC_SCAN': return '📡';
      case 'QR_SCAN': return '📷';
      case 'VERIFICATION': return '✅';
      case 'CUSTODY_TRANSFER': return '🔄';
      default: return '📋';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, Record<string, string>> = {
      AR: { NFC_SCAN: 'مسح NFC', QR_SCAN: 'مسح QR', VERIFICATION: 'تحقق', CUSTODY_TRANSFER: 'نقل حيازة' },
      FR: { NFC_SCAN: 'Scan NFC', QR_SCAN: 'Scan QR', VERIFICATION: 'Vérification', CUSTODY_TRANSFER: 'Transfert de garde' },
      EN: { NFC_SCAN: 'NFC Scan', QR_SCAN: 'QR Scan', VERIFICATION: 'Verification', CUSTODY_TRANSFER: 'Custody Transfer' },
    };
    return labels[language]?.[type] || type;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← {t('common.back', language)}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('history.title', language)}</Text>

      {/* الإحصائيات */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>{t('history.total', language)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#22c55e' }]}>{stats.synced}</Text>
          <Text style={styles.statLabel}>{t('history.synced', language)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>{t('history.pending', language)}</Text>
        </View>
      </View>

      {/* أزرار */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
          <Text style={styles.syncButtonText}>
            {language === 'AR' ? 'مزامنة الآن' : 'Sync Now'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
          <Text style={styles.clearButtonText}>
            {language === 'AR' ? 'مسح الكل' : 'Clear All'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* القائمة */}
      {records.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>{t('history.empty', language)}</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.recordCard}>
              <Text style={styles.recordIcon}>{getTypeIcon(item.type)}</Text>
              <View style={styles.recordInfo}>
                <Text style={styles.recordType}>{getTypeLabel(item.type)}</Text>
                <Text style={styles.recordTime}>
                  {new Date(item.timestamp).toLocaleString()}
                </Text>
              </View>
              <View style={[styles.recordStatus, item.synced ? styles.synced : styles.pending]}>
                <Text style={styles.recordStatusText}>
                  {item.synced ? '✓' : '⏳'}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 20 },
  backButton: { marginBottom: 16 },
  backText: { color: '#c9a84c', fontSize: 16 },
  title: { color: '#c9a84c', fontSize: 24, fontWeight: '700', marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#12121a', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a38' },
  statNumber: { color: '#c9a84c', fontSize: 24, fontWeight: '700' },
  statLabel: { color: '#555568', fontSize: 12, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  syncButton: { flex: 1, backgroundColor: '#c9a84c', borderRadius: 12, padding: 14, alignItems: 'center' },
  syncButtonText: { color: '#0a0a0f', fontWeight: '700' },
  clearButton: { backgroundColor: '#2a2a38', borderRadius: 12, padding: 14, alignItems: 'center' },
  clearButtonText: { color: '#8888a0' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { color: '#555568', fontSize: 16 },
  recordCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12121a', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#2a2a38' },
  recordIcon: { fontSize: 24, marginRight: 12 },
  recordInfo: { flex: 1 },
  recordType: { color: '#b0b0c8', fontSize: 14, fontWeight: '600' },
  recordTime: { color: '#555568', fontSize: 12 },
  recordStatus: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  synced: { backgroundColor: '#22c55e22' },
  pending: { backgroundColor: '#f59e0b22' },
  recordStatusText: { fontSize: 14 },
});
