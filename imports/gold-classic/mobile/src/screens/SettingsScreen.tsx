// ============================================================================
// GOLD MOBILE — SETTINGS SCREEN
// ============================================================================
// شاشة الإعدادات

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import { t, getSupportedLanguages } from '../services/LocalizationService';
import { Language, Currency } from '../types';

interface SettingsScreenProps {
  onBack: () => void;
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const {
    language, currency, settings, isOnline,
    setLanguage, setCurrency, updateSettings, logout,
  } = useAppContext();

  const languages = getSupportedLanguages();
  const currencies: Array<{ code: Currency; symbol: string; name: string }> = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'DZD', symbol: 'د.ج', name: 'Dinar Algérien' },
  ];

  const handleLogout = () => {
    Alert.alert(
      t('common.confirm', language),
      language === 'AR' ? 'هل تريد تسجيل الخروج؟' : 'Sign out?',
      [
        { text: t('common.cancel', language), style: 'cancel' },
        {
          text: t('auth.logout', language),
          style: 'destructive',
          onPress: logout,
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← {t('common.back', language)}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('settings.title', language)}</Text>

      {/* اللغة */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language', language)}</Text>
        <View style={styles.optionRow}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.optionButton, language === lang.code && styles.optionButtonActive]}
              onPress={() => setLanguage(lang.code)}
            >
              <Text style={[styles.optionText, language === lang.code && styles.optionTextActive]}>
                {lang.nativeName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* العملة */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.currency', language)}</Text>
        <View style={styles.optionRow}>
          {currencies.map((curr) => (
            <TouchableOpacity
              key={curr.code}
              style={[styles.optionButton, currency === curr.code && styles.optionButtonActive]}
              onPress={() => setCurrency(curr.code)}
            >
              <Text style={[styles.optionText, currency === curr.code && styles.optionTextActive]}>
                {curr.symbol} {curr.code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* مفاتيح التبديل */}
      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t('settings.offlineMode', language)}</Text>
          <Switch
            value={settings.offlineMode}
            onValueChange={(v) => updateSettings({ offlineMode: v })}
            trackColor={{ false: '#2a2a38', true: '#c9a84c44' }}
            thumbColor={settings.offlineMode ? '#c9a84c' : '#555568'}
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t('settings.autoSync', language)}</Text>
          <Switch
            value={settings.autoSync}
            onValueChange={(v) => updateSettings({ autoSync: v })}
            trackColor={{ false: '#2a2a38', true: '#c9a84c44' }}
            thumbColor={settings.autoSync ? '#c9a84c' : '#555568'}
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t('settings.nfcWriteLock', language)}</Text>
          <Switch
            value={settings.nfcWriteLock}
            onValueChange={(v) => updateSettings({ nfcWriteLock: v })}
            trackColor={{ false: '#2a2a38', true: '#c9a84c44' }}
            thumbColor={settings.nfcWriteLock ? '#c9a84c' : '#555568'}
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t('settings.haptic', language)}</Text>
          <Switch
            value={settings.hapticFeedback}
            onValueChange={(v) => updateSettings({ hapticFeedback: v })}
            trackColor={{ false: '#2a2a38', true: '#c9a84c44' }}
            thumbColor={settings.hapticFeedback ? '#c9a84c' : '#555568'}
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t('settings.sound', language)}</Text>
          <Switch
            value={settings.soundFeedback}
            onValueChange={(v) => updateSettings({ soundFeedback: v })}
            trackColor={{ false: '#2a2a38', true: '#c9a84c44' }}
            thumbColor={settings.soundFeedback ? '#c9a84c' : '#555568'}
          />
        </View>
      </View>

      {/* معلومات */}
      <View style={styles.section}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('settings.version', language)}</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('common.status', language)}</Text>
          <Text style={[styles.infoValue, { color: isOnline ? '#22c55e' : '#ef4444' }]}>
            {isOnline ? t('common.online', language) : t('common.offline', language)}
          </Text>
        </View>
      </View>

      {/* تسجيل الخروج */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>{t('auth.logout', language)}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 20 },
  backButton: { marginBottom: 16 },
  backText: { color: '#c9a84c', fontSize: 16 },
  title: { color: '#c9a84c', fontSize: 24, fontWeight: '700', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#8888a0', fontSize: 14, marginBottom: 12 },
  optionRow: { flexDirection: 'row', gap: 8 },
  optionButton: { flex: 1, backgroundColor: '#12121a', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a38' },
  optionButtonActive: { borderColor: '#c9a84c', backgroundColor: '#c9a84c11' },
  optionText: { color: '#555568', fontSize: 14, fontWeight: '600' },
  optionTextActive: { color: '#c9a84c' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#12121a', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#2a2a38' },
  toggleLabel: { color: '#b0b0c8', fontSize: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#12121a', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#2a2a38' },
  infoLabel: { color: '#555568', fontSize: 14 },
  infoValue: { color: '#b0b0c8', fontSize: 14, fontWeight: '600' },
  logoutButton: { backgroundColor: '#ef444422', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#ef444444', marginTop: 16 },
  logoutButtonText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
});
