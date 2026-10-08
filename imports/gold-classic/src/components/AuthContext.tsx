// ============================================================================
// GOLD PLATFORM — AUTH CONTEXT
// ============================================================================
// سياق المصادقة — يدير حالة المستخدم (تسجيل الدخول/الخروج) والصلاحيات

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type Language = 'AR' | 'FR' | 'EN';
type Currency = 'DZD' | 'EUR' | 'USD';
type RoleCode = 'SUPER_ADMIN' | 'ADMIN' | 'CUSTODY_MANAGER' | 'LAB_DIRECTOR' | 'AUDITOR' | 'LAB_TECHNICIAN' | 'CUSTODIAN' | 'MARKETPLACE_SELLER' | 'VIEWER';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleCode: RoleCode;
  hierarchy: number;
  preferredLanguage: Language;
  preferredCurrency: Currency;
  mfaEnabled: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, mfaCode?: string) => Promise<{ success: boolean; error?: string; mfaRequired?: boolean }>;
  requestEmailOtp: (email: string) => Promise<{ success: boolean; error?: string; devCode?: string; delivery?: string }>;
  verifyEmailOtp: (email: string, code: string, mfaCode?: string) => Promise<{ success: boolean; error?: string; mfaRequired?: boolean }>;
  logout: () => void;
  hasRole: (...roles: RoleCode[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

// ============================================================================
// ROLE → PERMISSIONS MAP
// ============================================================================

const ROLE_PERMISSIONS: Record<RoleCode, string[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: ['hr:read', 'hr:write', 'financial:read', 'financial:write', 'assets:read', 'assets:write', 'assay:read', 'assay:write', 'digital:read', 'digital:write', 'marketplace:read', 'marketplace:write', 'custody:read', 'custody:write', 'custody:transfer', 'custody:approve', 'compliance:read', 'compliance:write', 'system:read', 'system:write', 'erp:dashboard', 'audit:read', 'ai:analyze', 'ownership:read', 'ownership:write'],
  CUSTODY_MANAGER: ['custody:read', 'custody:write', 'custody:transfer', 'custody:approve', 'assets:read', 'vaults:read', 'vaults:write', 'erp:dashboard', 'ownership:read', 'ownership:write'],
  LAB_DIRECTOR: ['assay:read', 'assay:write', 'assets:read', 'hr:read', 'digital:read', 'ai:analyze', 'erp:dashboard'],
  AUDITOR: ['assets:read', 'assay:read', 'custody:read', 'erp:dashboard', 'audit:read', 'compliance:read', 'financial:read', 'system:read'],
  LAB_TECHNICIAN: ['assay:read', 'assay:write', 'assets:read'],
  CUSTODIAN: ['assets:read', 'custody:read', 'vaults:read'],
  MARKETPLACE_SELLER: ['marketplace:read', 'marketplace:write', 'assets:read'],
  VIEWER: ['assets:read'],
};

// ============================================================================
// PAGE → REQUIRED PERMISSIONS MAP
// ============================================================================

const PAGE_PERMISSIONS: Record<string, string[]> = {
  home: [],
  assets: ['assets:read'],
  verify: [],
  marketplace: ['marketplace:read'],
  vaults: ['vaults:read'],
  erp: ['erp:dashboard'],
  ai_assistant: ['ai:analyze'],
  ownership: ['ownership:read'],
  hr: ['hr:read'],
  financial: ['financial:read'],
  assay: ['assay:read'],
  digital: ['digital:read'],
  custody: ['custody:read'],
  compliance: ['compliance:read'],
  system: ['system:read'],
};

// ============================================================================
// AUTH CONTEXT
// ============================================================================

const AuthContext = createContext<AuthState | undefined>(undefined);

// ============================================================================
// AUTH PROVIDER
// ============================================================================

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // تطبيق بيانات الدخول الناجح على الحالة (مشترك بين كلمة المرور و OTP)
  const applyAuthSuccess = (data: any): boolean => {
    try {
      const userData: User = {
        id: data.data.user.id,
        email: data.data.user.email,
        firstName: data.data.user.firstName || '',
        lastName: data.data.user.lastName || '',
        roleCode: (typeof data.data.user.role === 'string' ? data.data.user.role : data.data.user.role?.code || 'VIEWER') as RoleCode,
        hierarchy: data.data.user.hierarchy || 1,
        preferredLanguage: data.data.user.preferredLanguage || 'EN',
        preferredCurrency: data.data.user.preferredCurrency || 'USD',
        mfaEnabled: data.data.user.mfaEnabled || false,
      };

      setUser(userData);
      setToken(data.data.token);
      localStorage.setItem('gold-token', data.data.token);
      localStorage.setItem('gold-user', JSON.stringify(userData));
      return true;
    } catch (error) {
      return false;
    }
  };

  // معالجة استجابة مصادقة موحّدة
  const applyAuthResponse = useCallback(async (data: any): Promise<{ success: boolean; error?: string; mfaRequired?: boolean }> => {
    if (!data.success) {
      if (data.error?.code === 'MFA_REQUIRED') {
        return { success: false, mfaRequired: true };
      }
      return { success: false, error: data.error?.message || 'Login failed' };
    }

    if (data.data?.mfaRequired) {
      return { success: false, mfaRequired: true };
    }

    const applied = applyAuthSuccess(data);
    if (!applied) return { success: false, error: 'Login failed' };
    return { success: true };
  }, []);

  // تحميل بيانات المستخدم من localStorage عند بدء التشغيل
  useEffect(() => {
    const savedToken = localStorage.getItem('gold-token');
    const savedUser = localStorage.getItem('gold-user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('gold-token');
        localStorage.removeItem('gold-user');
      }
    }
    setIsLoading(false);
  }, []);

  // تسجيل الدخول
  const login = useCallback(async (email: string, password: string, mfaCode?: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const body: Record<string, string> = { email, password };
      if (mfaCode) body.mfaCode = mfaCode;

      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      return applyAuthResponse(await response.json());
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [applyAuthResponse]);

  // طلب كود دخول عبر البريد الإلكتروني
  const requestEmailOtp = useCallback(async (email: string) => {
    try {
      const response = await fetch('/api/v1/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.success) {
        return { success: false, error: data.error?.message || 'Failed to send code' };
      }

      return {
        success: true,
        devCode: data.data?.devCode,
        delivery: data.data?.delivery,
      };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  // التحقق من كود الدخول وتسجيل الدخول
  const verifyEmailOtp = useCallback(async (email: string, code: string, mfaCode?: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const body: Record<string, string> = { email, code };
      if (mfaCode) body.mfaCode = mfaCode;

      const response = await fetch('/api/v1/auth/otp/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      return applyAuthResponse(await response.json());
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [applyAuthResponse]);

  // تسجيل الخروج
  const logout = useCallback(() => {
    if (token) {
      fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('gold-token');
    localStorage.removeItem('gold-user');
  }, [token]);

  // التحقق من الدور
  const hasRole = useCallback((...roles: RoleCode[]) => {
    if (!user) return false;
    return roles.includes(user.roleCode);
  }, [user]);

  // التحقق من الصلاحية
  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    const perms = ROLE_PERMISSIONS[user.roleCode] || [];
    if (perms.includes('*')) return true;
    return perms.includes(permission);
  }, [user]);

  const value: AuthState = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    requestEmailOtp,
    verifyEmailOtp,
    logout,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================================================
// USE AUTH HOOK
// ============================================================================

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================================
// HELPER: CHECK PAGE ACCESS
// ============================================================================

export function canAccessPage(roleCode: RoleCode, page: string): boolean {
  const requiredPermissions = PAGE_PERMISSIONS[page];
  if (!requiredPermissions || requiredPermissions.length === 0) return true; // public page
  const userPermissions = ROLE_PERMISSIONS[roleCode] || [];
  if (userPermissions.includes('*')) return true;
  return requiredPermissions.every(p => userPermissions.includes(p));
}

// ============================================================================
// HELPER: GET VISIBLE PAGES FOR ROLE
// ============================================================================

export function getVisiblePages(roleCode: RoleCode): string[] {
  const allPages = ['home', 'assets', 'verify', 'marketplace', 'vaults', 'erp', 'ai_assistant', 'ownership'];
  return allPages.filter(page => canAccessPage(roleCode, page));
}
