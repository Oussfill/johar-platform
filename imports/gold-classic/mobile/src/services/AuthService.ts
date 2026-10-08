// ============================================================================
// GOLD MOBILE — AUTH SERVICE
// ============================================================================
// خدمة المصادقة — تسجيل دخول + JWT + جلسات مؤقتة

import { AuthSession, AuthUser } from '../types';
import { apiService } from './ApiService';
import EncryptedStorage from 'react-native-encrypted-storage';

const SESSION_KEY = '@gold_auth_session';

/**
 * Auth Service
 * ─────────────
 * يدير عملية تسجيل الدخول والخروج والجلسات
 *
 * 1. تسجيل الدخول عبر API → JWT token
 * 2. حفظ الجلسة في EncryptedStorage
 * 3. التحقق من الجلسة عند بدء التطبيق
 * 4. تسجيل الخروج ومسح الجلسة
 */
class AuthService {
  private session: AuthSession | null = null;

  /** تحميل الجلسة المحفوظة */
  async loadSession(): Promise<AuthSession | null> {
    try {
      const data = await EncryptedStorage.getItem(SESSION_KEY);
      if (data) {
        this.session = JSON.parse(data);
        // التحقق من صلاحية الـ token
        if (this.isTokenExpired()) {
          await this.logout();
          return null;
        }
        return this.session;
      }
    } catch {
      // تجاهل
    }
    return null;
  }

  /** تسجيل الدخول */
  async login(email: string, password: string): Promise<AuthSession> {
    const session = await apiService.login(email, password);
    this.session = session;
    await EncryptedStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  /** تسجيل الخروج */
  async logout(): Promise<void> {
    this.session = null;
    await apiService.clearSession();
    await EncryptedStorage.removeItem(SESSION_KEY);
  }

  /** هل المستخدم مسجل الدخول؟ */
  isLoggedIn(): boolean {
    return this.session !== null && !this.isTokenExpired();
  }

  /** جلب المستخدم الحالي */
  getCurrentUser(): AuthUser | null {
    return this.session?.user || null;
  }

  /** جلب الـ token */
  getToken(): string | null {
    return this.session?.token || null;
  }

  /** التحقق من انتهاء صلاحية الـ token */
  private isTokenExpired(): boolean {
    if (!this.session?.token) return true;

    try {
      const payload = JSON.parse(
        Buffer.from(this.session.token.split('.')[1], 'base64').toString()
      );
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return true;
    }
  }
}

export const authService = new AuthService();
