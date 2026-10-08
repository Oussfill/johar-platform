// ============================================================================
// GOLD MOBILE — LOGIN SCREEN
// ============================================================================
// شاشة تسجيل الدخول

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import { t } from '../services/LocalizationService';

export default function LoginScreen() {
  const { login, language } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error', language), t('auth.loginError', language));
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert(
        t('common.error', language),
        error.message || t('auth.loginError', language),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* الشعار */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>G</Text>
          </View>
          <Text style={styles.appName}>GOLD</Text>
          <Text style={styles.tagline}>{t('app.tagline', language)}</Text>
        </View>

        {/* حقول الإدخال */}
        <View style={styles.form}>
          <Text style={styles.label}>{t('auth.email', language)}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="admin@gold-platform.com"
            placeholderTextColor="#555568"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>{t('auth.password', language)}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#555568"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0a0a0f" />
            ) : (
              <Text style={styles.loginButtonText}>{t('auth.loginButton', language)}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* المعرفة */}
        <Text style={styles.footer}>
          GOLD Platform v1.0.0{'\n'}
          ISO/IEC 17025 | ISO 27001
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'linear-gradient(135deg, #c9a84c, #8c7120)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#c9a84c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: '#c9a84c',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0a0a0f',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#c9a84c',
    letterSpacing: 4,
    marginTop: 12,
  },
  tagline: {
    fontSize: 14,
    color: '#8888a0',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 360,
  },
  label: {
    color: '#b0b0c8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1a1a25',
    borderWidth: 1,
    borderColor: '#2a2a38',
    borderRadius: 12,
    color: '#b0b0c8',
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#c9a84c',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#0a0a0f',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    color: '#555568',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 48,
  },
});
