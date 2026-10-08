// ============================================================================
// GOLD MOBILE — HOME SCREEN
// ============================================================================
// الشاشة الرئيسية — عرض الخيارات المتاحة

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import { t } from '../services/LocalizationService';
import { useNavigation } from '@react-navigation/native';

interface HomeScreenProps {
  navigation?: any;
}

export default function HomeScreen({ navigation: navProp }: HomeScreenProps) {
  const { user, language, isOnline, pendingSyncCount } = useAppContext();
  const navigation = navProp || useNavigation();

  const navigateTo = (screen: string) => {
    navigation.navigate(screen);
  };

  const menuItems = [
    {
      id: 'nfc_scan',
      icon: '📡',
      title: language === 'AR' ? 'مسح NFC' : language === 'FR' ? 'Scan NFC' : 'NFC Scan',
      desc: language === 'AR' ? 'قراءة شريحة الأصل' : language === 'FR' ? 'Lire la puce de l\'actif' : 'Read asset chip',
      color: '#c9a84c',
    },
    {
      id: 'qr_scan',
      icon: '📷',
      title: language === 'AR' ? 'مسح QR' : language === 'FR' ? 'Scan QR' : 'QR Scan',
      desc: language === 'AR' ? 'مسح رمز التحقق' : language === 'FR' ? 'Scanner le code de vérification' : 'Scan verification code',
      color: '#22c55e',
    },
    {
      id: 'verify',
      icon: '✅',
      title: language === 'AR' ? 'تحقق يدوي' : language === 'FR' ? 'Vérification manuelle' : 'Manual Verify',
      desc: language === 'AR' ? 'إدخال Gold ID يدوياً' : language === 'FR' ? 'Saisir le Gold ID manuellement' : 'Enter Gold ID manually',
      color: '#3b82f6',
    },
    {
      id: 'history',
      icon: '📋',
      title: language === 'AR' ? 'السجل' : language === 'FR' ? 'Historique' : 'History',
      desc: language === 'AR' ? 'سجل التحقق السابق' : language === 'FR' ? 'Historique de vérification' : 'Previous verifications',
      color: '#8b5cf6',
    },
    {
      id: 'settings',
      icon: '⚙️',
      title: t('settings.title', language),
      desc: language === 'AR' ? 'إعدادات التطبيق' : language === 'FR' ? 'Paramètres de l\'application' : 'App settings',
      color: '#555568',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* حالة الاتصال */}
      <View style={[styles.statusBar, !isOnline && styles.statusBarOffline]}>
        <Text style={styles.statusText}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </Text>
        {pendingSyncCount > 0 && (
          <Text style={styles.syncBadge}>
            {pendingSyncCount} {language === 'AR' ? 'بانتظار' : 'pending'}
          </Text>
        )}
      </View>

      {/* مرحباً */}
      <Text style={styles.greeting}>
        {language === 'AR' ? 'مرحباً' : language === 'FR' ? 'Bonjour' : 'Hello'},{' '}
        {user?.firstName || 'User'}
      </Text>
      <Text style={styles.subtitle}>
        {language === 'AR' ? 'اختر العملية المطلوبة' : language === 'FR' ? 'Sélectionnez une opération' : 'Select an operation'}
      </Text>

      {/* القائمة */}
      <View style={styles.menuGrid}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuCard}
            onPress={() => navigateTo(item.id)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuDesc}>{item.desc}</Text>
            <View style={[styles.menuIndicator, { backgroundColor: item.color }]} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  content: {
    padding: 20,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#12121a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#22c55e33',
  },
  statusBarOffline: {
    borderColor: '#ef444433',
    backgroundColor: '#450a0a22',
  },
  statusText: {
    color: '#b0b0c8',
    fontSize: 14,
  },
  syncBadge: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
  },
  greeting: {
    color: '#c9a84c',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#8888a0',
    fontSize: 16,
    marginBottom: 32,
  },
  menuGrid: {
    gap: 12,
  },
  menuCard: {
    backgroundColor: '#12121a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a38',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  menuIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  menuTitle: {
    color: '#b0b0c8',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  menuDesc: {
    color: '#555568',
    fontSize: 12,
    flex: 2,
  },
  menuIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
});
