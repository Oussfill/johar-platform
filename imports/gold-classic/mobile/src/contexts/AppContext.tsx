// ============================================================================
// GOLD MOBILE — APP CONTEXT
// ============================================================================
// سياق التطبيق — إدارة الحالة العامة (المستخدم، اللغة، الاتصال)

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Language, Currency, AuthUser, AppSettings } from '../types';
import { authService } from '../services/AuthService';
import { offlineSyncService } from '../services/OfflineSyncService';
import { setDirection } from '../services/LocalizationService';

/** نوع السياق */
interface AppContextType {
  user: AuthUser | null;
  language: Language;
  currency: Currency;
  isOnline: boolean;
  isSyncing: boolean;
  settings: AppSettings;
  pendingSyncCount: number;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setLanguage: (lang: Language) => void;
  setCurrency: (currency: Currency) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  refreshSyncCount: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/** مزود السياق */
export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [language, setLanguageState] = useState<Language>('EN');
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [settings, setSettings] = useState<AppSettings>({
    language: 'EN',
    currency: 'USD',
    apiBaseUrl: 'http://localhost:3000',
    offlineMode: false,
    autoSync: true,
    nfcWriteLock: true,
    hapticFeedback: true,
    soundFeedback: true,
    theme: 'dark',
  });

  // تهيئة التطبيق
  useEffect(() => {
    (async () => {
      // تحميل الجلسة المحفوظة
      const session = await authService.loadSession();
      if (session?.user) {
        setUser(session.user);
        setLanguageState(session.user.preferredLanguage);
        setCurrencyState(session.user.preferredCurrency);
        setDirection(session.user.preferredLanguage);
      }

      // تهيئة المزامنة
      await offlineSyncService.initialize(
        (online) => setIsOnline(online),
        (total, synced) => {
          refreshSyncCount();
        },
      );

      // جلب عدد السجلات المعلقة
      await refreshSyncCount();
    })();
  }, []);

  /** تسجيل الدخول */
  const login = useCallback(async (email: string, password: string) => {
    const session = await authService.login(email, password);
    setUser(session.user);
    setLanguageState(session.user.preferredLanguage);
    setCurrencyState(session.user.preferredCurrency);
    setDirection(session.user.preferredLanguage);
  }, []);

  /** تسجيل الخروج */
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  /** تغيير اللغة */
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    setDirection(lang);
    setSettings((prev) => ({ ...prev, language: lang }));
  }, []);

  /** تغيير العملة */
  const setCurrency = useCallback((curr: Currency) => {
    setCurrencyState(curr);
    setSettings((prev) => ({ ...prev, currency: curr }));
  }, []);

  /** تحديث الإعدادات */
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  /** تحديث عدد السجلات المعلقة */
  const refreshSyncCount = useCallback(async () => {
    const stats = await offlineSyncService.getSyncStats();
    setPendingSyncCount(stats.pending);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        language,
        currency,
        isOnline,
        isSyncing,
        settings,
        pendingSyncCount,
        login,
        logout,
        setLanguage,
        setCurrency,
        updateSettings,
        refreshSyncCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

/** هوك لاستخدام السياق */
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
