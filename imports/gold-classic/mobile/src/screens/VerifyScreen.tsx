// ============================================================================
// GOLD MOBILE — VERIFY SCREEN (MANUAL)
// ============================================================================
// شاشة التحقق اليدوي — إدخال Gold ID أو Passport Number

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import { apiService } from '../services/ApiService';
import { offlineSyncService } from '../services/OfflineSyncService';
import { qrScanner } from '../services/QrScannerService';
import {
  t,
  translateMetalType,
  translateProductType,
  translateVerificationStatus,
} from '../services/LocalizationService';
import { FieldVerification } from '../types';

interface VerifyScreenProps {
  onBack: () => void;
}

export default function VerifyScreen({ onBack }: VerifyScreenProps) {
  const { language, currency, isOnline } = useAppContext();
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<FieldVerification | null>(null);
  const [error, setError] = useState<string>('');

  const handleVerify = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      Alert.alert(t('common.error', language), t('common.fillRequired', language) || 'Please enter a value');
      return;
    }

    setLoading(true);
    setError('');
    setVerification(null);

    try {
      const isPassport = qrScanner.isValidPassportNumber(trimmed);
      const isGoldId = qrScanner.isValidGoldId(trimmed);

      if (!isPassport && !isGoldId) {
        setError(
          language === 'AR'
            ? 'صيغة غير صالحة — أدخل Gold ID (GOLD-XXXX-XXXX-XXXX) أو Passport (DP-...)'
            : language === 'FR'
            ? 'Format invalide — entrez Gold ID ou Passport Number'
            : 'Invalid format — enter Gold ID (GOLD-XXXX-XXXX-XXXX) or Passport (DP-...)'
        );
        setLoading(false);
        return;
      }

      if (isOnline) {
        const endpoint = isPassport
          ? `/api/v1/assets/verify/${trimmed}?lang=${language}&currency=${currency}`
          : `/api/v1/assets/gold/${trimmed}?lang=${language}&currency=${currency}`;

        const response = await apiService.get(endpoint);
        if (response.success) {
          setVerification(response.data as FieldVerification);
        } else {
          setError(response.error?.message || 'Verification failed');
        }
      } else {
        // Offline: حفظ محلياً
        await offlineSyncService.saveOffline({
          type: 'VERIFICATION',
          data: { input: trimmed, isPassport, isGoldId },
          timestamp: Date.now(),
        });
        setError(t('scan.offline', language));
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [inputValue, language, currency, isOnline]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← {t('common.back', language)}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('verify.title', language)}</Text>

      {/* حقل الإدخال */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {language === 'AR' ? 'Gold ID أو Passport Number' : 'Gold ID or Passport Number'}
        </Text>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="GOLD-XXXX-XXXX-XXXX"
          placeholderTextColor="#555568"
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0a0a0f" />
          ) : (
            <Text style={styles.verifyButtonText}>
              {language === 'AR' ? 'تحقق' : language === 'FR' ? 'Vérifier' : 'Verify'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* خطأ */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* النتائج */}
      {verification && (
        <View style={styles.resultContainer}>
          <View style={[styles.statusBox, verification.status === 'VERIFIED' ? styles.statusVerified : styles.statusFailed]}>
            <Text style={styles.statusIcon}>
              {verification.status === 'VERIFIED' ? '✅' : '❌'}
            </Text>
            <Text style={styles.statusText}>
              {translateVerificationStatus(verification.status, language)}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{t('verify.goldId', language)}</Text>
            <Text style={styles.infoValueMono}>{verification.goldId}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{t('verify.serialNumber', language)}</Text>
            <Text style={styles.infoValue}>{verification.asset.serialNumber}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{t('verify.metalType', language)}</Text>
            <Text style={styles.infoValue}>
              {translateMetalType(verification.asset.metalType, language)} {verification.asset.karat}K
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{t('verify.weightNet', language)}</Text>
            <Text style={styles.infoValue}>{verification.asset.weightNet}g</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{t('verify.purity', language)}</Text>
            <Text style={styles.infoValue}>{verification.asset.measuredPurity}%</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{t('verify.productType', language)}</Text>
            <Text style={styles.infoValue}>
              {translateProductType(verification.asset.productType, language)}
            </Text>
          </View>

          {verification.custody && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>{t('verify.warehouse', language)}</Text>
              <Text style={styles.infoValue}>{verification.custody.warehouse}</Text>
            </View>
          )}

          {/* AI Disclaimer */}
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerIcon}>ℹ️</Text>
            <Text style={styles.disclaimerText}>{verification.disclaimer}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 20 },
  backButton: { marginBottom: 16 },
  backText: { color: '#c9a84c', fontSize: 16 },
  title: { color: '#c9a84c', fontSize: 24, fontWeight: '700', marginBottom: 24 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { color: '#8888a0', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: '#12121a', borderWidth: 1, borderColor: '#2a2a38', borderRadius: 12, color: '#c9a84c', padding: 16, fontSize: 18, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 12 },
  verifyButton: { backgroundColor: '#c9a84c', borderRadius: 12, padding: 16, alignItems: 'center' },
  verifyButtonDisabled: { opacity: 0.6 },
  verifyButtonText: { color: '#0a0a0f', fontSize: 16, fontWeight: '700' },
  errorBox: { backgroundColor: '#450a0a22', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#ef444444', marginBottom: 16 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  resultContainer: { gap: 12 },
  statusBox: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, gap: 12 },
  statusVerified: { backgroundColor: '#052e1622', borderWidth: 1, borderColor: '#22c55e44' },
  statusFailed: { backgroundColor: '#450a0a22', borderWidth: 1, borderColor: '#ef444444' },
  statusIcon: { fontSize: 24 },
  statusText: { color: '#22c55e', fontSize: 18, fontWeight: '700' },
  infoCard: { backgroundColor: '#12121a', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2a2a38' },
  infoLabel: { color: '#555568', fontSize: 12, marginBottom: 4 },
  infoValue: { color: '#b0b0c8', fontSize: 16, fontWeight: '600' },
  infoValueMono: { color: '#c9a84c', fontSize: 16, fontFamily: 'monospace', fontWeight: '700' },
  disclaimerBox: { flexDirection: 'row', backgroundColor: '#17255422', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#3b82f644', gap: 12, alignItems: 'flex-start', marginTop: 8 },
  disclaimerIcon: { fontSize: 18 },
  disclaimerText: { color: '#8888a0', fontSize: 12, flex: 1, lineHeight: 18 },
});
