// ============================================================================
// GOLD MOBILE — NFC SCAN SCREEN
// ============================================================================
// شاشة مسح شريحة NFC — قراءة + عرض النتائج + قفل

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { nfcManager, NFC_ERRORS } from '../services/NfcManagerService';
import { qrScanner } from '../services/QrScannerService';
import { apiService } from '../services/ApiService';
import { offlineSyncService } from '../services/OfflineSyncService';
import { useAppContext } from '../contexts/AppContext';
import {
  t,
  translateMetalType,
  translateProductType,
  translateAssetStatus,
  translateVerificationStatus,
  translateNfcStatus,
} from '../services/LocalizationService';
import { NfcScanResult, FieldVerification } from '../types';

interface NfcScanScreenProps {
  onBack: () => void;
}

type ScanStep = 'READY' | 'SCANNING' | 'READING' | 'RESULT' | 'ERROR';

export default function NfcScanScreen({ onBack }: NfcScanScreenProps) {
  const { language, currency, isOnline } = useAppContext();
  const [step, setStep] = useState<ScanStep>('READY');
  const [scanResult, setScanResult] = useState<NfcScanResult | null>(null);
  const [verification, setVerification] = useState<FieldVerification | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);

  // التحقق من دعم NFC
  useEffect(() => {
    (async () => {
      const { supported } = await nfcManager.initialize();
      setNfcSupported(supported);
    })();
    return () => {
      nfcManager.cancelScan();
    };
  }, []);

  /** بدء مسح NFC */
  const startNfcScan = useCallback(async () => {
    setStep('SCANNING');
    setScanResult(null);
    setVerification(null);
    setErrorMessage('');

    try {
      // 1. قراءة الشريحة
      const result = await nfcManager.readTag(language);
      setScanResult(result);
      setStep('READING');

      // 2. التحقق من الهوية عبر API أو حفظ محلياً
      if (isOnline) {
        try {
          const response = await apiService.get(`/api/v1/assets/verify/by-nfc-hash/${result.uidHash}?lang=${language}&currency=${currency}`);
          if (response.success) {
            setVerification(response.data as FieldVerification);
          }
        } catch {
          // إذا فشل API، نحفظ محلياً
          await offlineSyncService.saveOffline({
            type: 'NFC_SCAN',
            data: {
              uidHash: result.uidHash,
              isLocked: result.isLocked,
              ndefRecords: result.ndefRecords,
            },
            timestamp: Date.now(),
          });
        }
      } else {
        // وضع عدم الاتصال — حفظ محلياً
        await offlineSyncService.saveOffline({
          type: 'NFC_SCAN',
          data: {
            uidHash: result.uidHash,
            isLocked: result.isLocked,
            ndefRecords: result.ndefRecords,
          },
          timestamp: Date.now(),
        });
      }

      setStep('RESULT');
    } catch (error: any) {
      setErrorMessage(getErrorMessage(error.message, language));
      setStep('ERROR');
    }
  }, [language, currency, isOnline]);

  /** قفل الشريحة */
  const lockChip = useCallback(async () => {
    Alert.alert(
      language === 'AR' ? 'تأكيد القفل' : language === 'FR' ? 'Confirmer le verrouillage' : 'Confirm Lock',
      language === 'AR'
        ? 'سيتم قفل الشريحة نهائياً. لا يمكن التراجع عن هذا الإجراء.'
        : language === 'FR'
        ? 'La puce sera verrouillée définitivement. Cette action est irréversible.'
        : 'The chip will be permanently locked. This action cannot be undone.',
      [
        { text: t('common.cancel', language), style: 'cancel' },
        {
          text: language === 'AR' ? 'قفل' : language === 'FR' ? 'Verrouiller' : 'Lock',
          style: 'destructive',
          onPress: async () => {
            try {
              const locked = await nfcManager.lockChip(language);
              if (locked) {
                Alert.alert(t('common.success', language), t('scan.nfcLockSuccess', language));
                setScanResult((prev) => (prev ? { ...prev, isLocked: true } : null));
              }
            } catch (error: any) {
              Alert.alert(t('common.error', language), error.message);
            }
          },
        },
      ],
    );
  }, [language]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* زر الرجوع */}
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← {t('common.back', language)}</Text>
      </TouchableOpacity>

      {/* العنوان */}
      <Text style={styles.title}>{t('scan.nfcTitle', language)}</Text>
      <Text style={styles.subtitle}>{t('scan.nfcSubtitle', language)}</Text>

      {/* دعم NFC */}
      {nfcSupported === false && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            {language === 'AR'
              ? 'جهازك لا يدعم NFC'
              : language === 'FR'
              ? 'Votre appareil ne prend pas en charge le NFC'
              : 'Your device does not support NFC'}
          </Text>
        </View>
      )}

      {/* الخطوة الحالية */}
      {step === 'READY' && (
        <View style={styles.centerContent}>
          <View style={styles.nfcIcon}>
            <Text style={styles.nfcIconText}>📡</Text>
          </View>
          <Text style={styles.instructionText}>{t('scan.nfcInstructions', language)}</Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={startNfcScan}
            disabled={nfcSupported === false}
          >
            <Text style={styles.scanButtonText}>
              {language === 'AR' ? 'ابدأ المسح' : language === 'FR' ? 'Commencer le scan' : 'Start Scanning'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'SCANNING' && (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#c9a84c" />
          <Text style={styles.statusText}>{t('scan.scanning', language)}</Text>
          <Text style={styles.statusTextSub}>{t('scan.holdStill', language)}</Text>
        </View>
      )}

      {step === 'READING' && (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.statusText}>{language === 'AR' ? 'جاري قراءة البيانات...' : 'Reading data...'}</Text>
        </View>
      )}

      {/* النتائج */}
      {step === 'RESULT' && scanResult && (
        <View style={styles.resultContainer}>
          {/* حالة NFC */}
          <View style={[styles.statusBox, scanResult.isLocked ? styles.statusLocked : styles.statusActive]}>
            <Text style={styles.statusIcon}>{scanResult.isLocked ? '🔒' : '🔓'}</Text>
            <Text style={styles.statusText}>
              {translateNfcStatus(scanResult.isLocked, language)}
            </Text>
          </View>

          {/* معلومات الشريحة */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>UID Hash:</Text>
            <Text style={styles.infoValueMono}>{scanResult.uidHash.substring(0, 32)}...</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>NDEF Records:</Text>
            <Text style={styles.infoValue}>{scanResult.ndefRecords.length}</Text>
          </View>

          {/* بيانات التحقق */}
          {verification && (
            <>
              <View style={styles.verifyStatus}>
                <Text style={styles.verifyStatusText}>
                  {translateVerificationStatus(verification.status, language)}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>{t('verify.goldId', language)}</Text>
                <Text style={styles.infoValueMono}>{verification.asset.serialNumber}</Text>
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

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>{t('verify.totalAssays', language)}</Text>
                <Text style={styles.infoValue}>{verification.assay.totalAssays}</Text>
              </View>

              {/* AI Disclaimer */}
              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerIcon}>ℹ️</Text>
                <Text style={styles.disclaimerText}>{verification.disclaimer}</Text>
              </View>
            </>
          )}

          {/* أزرار الإجراءات */}
          <View style={styles.actions}>
            {!scanResult.isLocked && (
              <TouchableOpacity style={styles.lockButton} onPress={lockChip}>
                <Text style={styles.lockButtonText}>
                  {language === 'AR' ? 'قفل الشريحة' : language === 'FR' ? 'Verrouiller la puce' : 'Lock Chip'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.rescanButton} onPress={startNfcScan}>
              <Text style={styles.rescanButtonText}>
                {language === 'AR' ? 'مسح مرة أخرى' : language === 'FR' ? 'Rescanner' : 'Scan Again'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* خطأ */}
      {step === 'ERROR' && (
        <View style={styles.centerContent}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={startNfcScan}>
            <Text style={styles.retryButtonText}>{t('common.retry', language)}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* تنبيه عدم الاتصال */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>{t('scan.offline', language)}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function getErrorMessage(code: string, lang: Language): string {
  const messages: Record<Language, Record<string, string>> = {
    AR: {
      [NFC_ERRORS.NOT_SUPPORTED]: 'جهازك لا يدعم NFC',
      [NFC_ERRORS.NOT_ENABLED]: 'يرجى تفعيل NFC من الإعدادات',
      [NFC_ERRORS.CANCELLED]: 'تم إلغاء العملية',
      [NFC_ERRORS.TIMEOUT]: 'انتهت المهلة — حاول مرة أخرى',
      [NFC_ERRORS.TAG_LOST]: 'فقد الاتصال بالشريحة — اقترب أكثر',
      [NFC_ERRORS.READ_FAILED]: 'خطأ في قراءة الشريحة',
    },
    FR: {
      [NFC_ERRORS.NOT_SUPPORTED]: 'Votre appareil ne supporte pas le NFC',
      [NFC_ERRORS.NOT_ENABLED]: 'Veuillez activer le NFC dans les paramètres',
      [NFC_ERRORS.CANCELLED]: 'Opération annulée',
      [NFC_ERRORS.TIMEOUT]: 'Délai dépassé — réessayez',
      [NFC_ERRORS.TAG_LOST]: 'Connexion perdue — rapprochez l\'appareil',
      [NFC_ERRORS.READ_FAILED]: 'Erreur de lecture NFC',
    },
    EN: {
      [NFC_ERRORS.NOT_SUPPORTED]: 'Your device does not support NFC',
      [NFC_ERRORS.NOT_ENABLED]: 'Please enable NFC in Settings',
      [NFC_ERRORS.CANCELLED]: 'Operation cancelled',
      [NFC_ERRORS.TIMEOUT]: 'Timeout — please try again',
      [NFC_ERRORS.TAG_LOST]: 'Connection lost — bring device closer',
      [NFC_ERRORS.READ_FAILED]: 'NFC read error',
    },
  };
  return messages[lang]?.[code] || messages[EN][code] || 'Unknown error';
}

type Language = 'AR' | 'FR' | 'EN';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 20 },
  backButton: { marginBottom: 16 },
  backText: { color: '#c9a84c', fontSize: 16 },
  title: { color: '#c9a84c', fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#8888a0', fontSize: 14, marginBottom: 24 },
  centerContent: { alignItems: 'center', paddingVertical: 60 },
  nfcIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#c9a84c22', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  nfcIconText: { fontSize: 48 },
  instructionText: { color: '#b0b0c8', fontSize: 16, textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 },
  scanButton: { backgroundColor: '#c9a84c', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 16 },
  scanButtonText: { color: '#0a0a0f', fontSize: 16, fontWeight: '700' },
  statusText: { color: '#c9a84c', fontSize: 18, marginTop: 16 },
  statusTextSub: { color: '#8888a0', fontSize: 14, marginTop: 8 },
  resultContainer: { gap: 12 },
  statusBox: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, gap: 12 },
  statusLocked: { backgroundColor: '#451a0a22', borderWidth: 1, borderColor: '#f59e0b44' },
  statusActive: { backgroundColor: '#052e1622', borderWidth: 1, borderColor: '#22c55e44' },
  statusIcon: { fontSize: 24 },
  infoCard: { backgroundColor: '#12121a', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2a2a38' },
  infoLabel: { color: '#555568', fontSize: 12, marginBottom: 4 },
  infoValue: { color: '#b0b0c8', fontSize: 16, fontWeight: '600' },
  infoValueMono: { color: '#c9a84c', fontSize: 14, fontFamily: 'monospace' },
  verifyStatus: { backgroundColor: '#052e1622', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#22c55e44', alignItems: 'center' },
  verifyStatusText: { color: '#22c55e', fontSize: 18, fontWeight: '700' },
  disclaimerBox: { flexDirection: 'row', backgroundColor: '#17255422', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#3b82f644', gap: 12, alignItems: 'flex-start' },
  disclaimerIcon: { fontSize: 18 },
  disclaimerText: { color: '#8888a0', fontSize: 12, flex: 1, lineHeight: 18 },
  actions: { gap: 12, marginTop: 8 },
  lockButton: { backgroundColor: '#f59e0b', borderRadius: 12, padding: 16, alignItems: 'center' },
  lockButtonText: { color: '#0a0a0f', fontSize: 16, fontWeight: '700' },
  rescanButton: { backgroundColor: '#2a2a38', borderRadius: 12, padding: 16, alignItems: 'center' },
  rescanButtonText: { color: '#b0b0c8', fontSize: 16 },
  errorBox: { backgroundColor: '#450a0a22', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#ef444444', marginBottom: 16 },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorText: { color: '#ef4444', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#c9a84c', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  retryButtonText: { color: '#0a0a0f', fontSize: 16, fontWeight: '700' },
  offlineBanner: { backgroundColor: '#451a0a22', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f59e0b44', marginTop: 16 },
  offlineText: { color: '#f59e0b', fontSize: 14, textAlign: 'center' },
});
