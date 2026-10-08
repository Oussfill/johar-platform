// ============================================================================
// GOLD MOBILE — QR SCAN SCREEN
// ============================================================================
// شاشة مسح رمز QR

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import { qrScanner } from '../services/QrScannerService';
import { apiService } from '../services/ApiService';
import { offlineSyncService } from '../services/OfflineSyncService';
import { t } from '../services/LocalizationService';
import { QrScanResult, FieldVerification } from '../types';

interface QrScanScreenProps {
  onBack: () => void;
}

export default function QrScanScreen({ onBack }: QrScanScreenProps) {
  const { language, currency, isOnline } = useAppContext();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<QrScanResult | null>(null);
  const [verification, setVerification] = useState<FieldVerification | null>(null);

  /** معالجة نتيجة المسح */
  const handleQrData = useCallback(async (rawData: string) => {
    setScanning(true);
    try {
      const parsed = qrScanner.parseQrData(rawData);
      setResult(parsed);

      // البحث عن التحقق
      if (parsed.goldId || parsed.passportNumber) {
        if (isOnline) {
          const verifyId = parsed.passportNumber || parsed.goldId;
          const endpoint = parsed.passportNumber
            ? `/api/v1/assets/verify/${verifyId}?lang=${language}&currency=${currency}`
            : `/api/v1/assets/gold/${verifyId}?lang=${language}&currency=${currency}`;

          try {
            const response = await apiService.get(endpoint);
            if (response.success) {
              setVerification(response.data as FieldVerification);
            }
          } catch {
            // حفظ محلياً
            await offlineSyncService.saveOffline({
              type: 'QR_SCAN',
              data: { goldId: parsed.goldId, passportNumber: parsed.passportNumber },
              timestamp: Date.now(),
            });
          }
        } else {
          await offlineSyncService.saveOffline({
            type: 'QR_SCAN',
            data: { goldId: parsed.goldId, passportNumber: parsed.passportNumber },
            timestamp: Date.now(),
          });
        }
      }
    } catch (error: any) {
      Alert.alert(t('common.error', language), error.message);
    } finally {
      setScanning(false);
    }
  }, [language, currency, isOnline]);

  // في التطبيق الفعلي هنا会被 react-native-camera أو react-native-qrcode-scanner يستبدل
  // سنستخدم واجهة بسيطة لإدخال يدوي كعرض توضيحي

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← {t('common.back', language)}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('scan.qrTitle', language)}</Text>
      <Text style={styles.subtitle}>{t('scan.qrSubtitle', language)}</Text>

      {/* منطقة الكاميرا (محاكاة) */}
      <View style={styles.cameraPlaceholder}>
        <Text style={styles.cameraIcon}>📷</Text>
        <Text style={styles.cameraText}>
          {scanning ? t('scan.scanning', language) : t('scan.qrSubtitle', language)}
        </Text>
      </View>

      {/* إدخال يدوي كبديل */}
      <View style={styles.manualInput}>
        <Text style={styles.manualLabel}>
          {language === 'AR' ? 'أو أدخل Gold ID يدوياً' : 'Or enter Gold ID manually'}
        </Text>
        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => {
            Alert.prompt(
              language === 'AR' ? 'Gold ID' : 'Gold ID',
              language === 'AR' ? 'أدخل Gold ID' : 'Enter Gold ID',
              (text) => {
                if (text) handleQrData(text);
              },
            );
          }}
        >
          <Text style={styles.manualButtonText}>
            {language === 'AR' ? 'إدخال يدوي' : 'Manual Entry'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* النتائج */}
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultType}>Type: {result.type}</Text>
          {result.goldId && <Text style={styles.resultGoldId}>{result.goldId}</Text>}
          {result.passportNumber && <Text style={styles.resultPassport}>{result.passportNumber}</Text>}
        </View>
      )}

      {verification && (
        <View style={styles.verifyCard}>
          <Text style={styles.verifyStatus}>
            {verification.status === 'VERIFIED' ? '✅' : '❌'} {verification.status}
          </Text>
          <Text style={styles.verifyName}>{verification.asset?.name}</Text>
          <Text style={styles.verifyDetails}>
            {verification.asset?.metalType} {verification.asset?.karat}K — {verification.asset?.weightNet}g
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 20 },
  backButton: { marginBottom: 16 },
  backText: { color: '#c9a84c', fontSize: 16 },
  title: { color: '#c9a84c', fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#8888a0', fontSize: 14, marginBottom: 24 },
  cameraPlaceholder: { height: 300, backgroundColor: '#12121a', borderRadius: 16, borderWidth: 2, borderColor: '#2a2a38', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  cameraIcon: { fontSize: 64, marginBottom: 16 },
  cameraText: { color: '#555568', fontSize: 16 },
  manualInput: { marginBottom: 24 },
  manualLabel: { color: '#8888a0', fontSize: 14, marginBottom: 8 },
  manualButton: { backgroundColor: '#2a2a38', borderRadius: 12, padding: 16, alignItems: 'center' },
  manualButtonText: { color: '#c9a84c', fontSize: 16, fontWeight: '600' },
  resultCard: { backgroundColor: '#12121a', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2a2a38', marginBottom: 12 },
  resultType: { color: '#555568', fontSize: 12 },
  resultGoldId: { color: '#c9a84c', fontSize: 18, fontWeight: '700', fontFamily: 'monospace' },
  resultPassport: { color: '#3b82f6', fontSize: 16, fontFamily: 'monospace' },
  verifyCard: { backgroundColor: '#052e1622', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#22c55e44' },
  verifyStatus: { color: '#22c55e', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  verifyName: { color: '#b0b0c8', fontSize: 16, marginBottom: 4 },
  verifyDetails: { color: '#8888a0', fontSize: 14 },
});
