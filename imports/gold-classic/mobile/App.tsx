// ============================================================================
// GOLD MOBILE — MAIN APP
// ============================================================================
// نقطة الدخول الرئيسية لتطبيق الموبايل الميداني
// يربط جميع الشاشات ببعضها مع التنقل

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { setDirection } from './services/LocalizationService';

// الشاشات
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import NfcScanScreen from './screens/NfcScanScreen';
import QrScanScreen from './screens/QrScanScreen';
import VerifyScreen from './screens/VerifyScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();

/** شاشة التحميل الأولية */
function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#c9a84c" />
    </View>
  );
}

/** التطبيق الرئيسي مع التنقل */
function AppNavigator() {
  const { user, language } = useAppContext();

  useEffect(() => {
    setDirection(language);
  }, [language]);

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0f' },
          animation: 'slide_from_right',
        }}
      >
        {!user ? (
          // شاشة تسجيل الدخول
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="NfcScan" component={NfcScanScreen} />
            <Stack.Screen name="QrScan" component={QrScanScreen} />
            <Stack.Screen name="Verify" component={VerifyScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/** التطبيق الرئيسي */
export default function App() {
  return (
    <AppProvider>
      <AppNavigator />
    </AppProvider>
  );
}
