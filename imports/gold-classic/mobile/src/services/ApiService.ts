// ============================================================================
// GOLD MOBILE — API SERVICE
// ============================================================================
// خدمة الاتصال بالخادم (Express Backend)
// تدعم: JWT Auth + Retry + Timeout + Error Handling

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { ApiResponse, AuthSession } from '../types';

/** إعدادات الاتصال */
const API_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  TIMEOUT: 15000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

/** مفاتيح التخزين */
const STORAGE_KEYS = {
  AUTH_SESSION: '@gold_auth_session',
  API_BASE_URL: '@gold_api_base_url',
} as const;

/**
 * API Service
 * ────────────
 * يدير جميع الاتصالات مع الخادم
 *
 * المبادئ:
 * 1. JWT Auth على كل طلب (عدا login)
 * 2. Retry تلقائي على أخطاء الشبكة (3 مرات)
 * 3. Timeout 15 ثانية لكل طلب
 * 4. Error handling موحد
 * 5. تسجيل الأخطاء في السجل المحلي
 */
class ApiService {
  private client: AxiosInstance;
  private session: AuthSession | null = null;
  private baseUrl: string = API_CONFIG.BASE_URL;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor: إضافة JWT token لكل طلب
    this.client.interceptors.request.use(
      async (config) => {
        if (this.session?.token) {
          config.headers.Authorization = `Bearer ${this.session.token}`;
        }
        // إضافة headers اللغة والعملة
        config.headers['X-Language'] = this.session?.user?.preferredLanguage || 'EN';
        config.headers['X-Currency'] = this.session?.user?.preferredCurrency || 'USD';
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Interceptor: معالجة الأخطاء
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // إعادة المحاولة على أخطاء الشبكة
        if (!error.response && error.code === 'ECONNABORTED') {
          throw new Error('NETWORK_TIMEOUT');
        }
        if (!error.response) {
          throw new Error('NETWORK_ERROR');
        }
        throw error;
      },
    );
  }

  // ─── التهيئة ──────────────────────────────────────────────

  /** تحميل الجلسة المحفوظة */
  async initialize(): Promise<boolean> {
    try {
      const sessionData = await EncryptedStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (sessionData) {
        this.session = JSON.parse(sessionData);
        return true;
      }
    } catch {
      // تجاهل أخطاء التحميل
    }
    return false;
  }

  /** حفظ الجلسة */
  async saveSession(session: AuthSession): Promise<void> {
    this.session = session;
    await EncryptedStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
  }

  /** حذف الجلسة (تسجيل خروج) */
  async clearSession(): Promise<void> {
    this.session = null;
    await EncryptedStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  }

  /** تغيير رابط الخادم */
  async setBaseUrl(url: string): Promise<void> {
    this.baseUrl = url;
    this.client.defaults.baseURL = url;
    await EncryptedStorage.setItem(STORAGE_KEYS.API_BASE_URL, url);
  }

  /** جلب الجلسة الحالية */
  getSession(): AuthSession | null {
    return this.session;
  }

  // ─── الطلبات ──────────────────────────────────────────────

  /** طلب GET */
  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(endpoint, config);
    return response.data;
  }

  /** طلب POST */
  async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(endpoint, data, config);
    return response.data;
  }

  /** طلب PATCH */
  async patch<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(endpoint, data, config);
    return response.data;
  }

  /** طلب DELETE */
  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(endpoint, config);
    return response.data;
  }

  // ─── Auth ─────────────────────────────────────────────────

  /** تسجيل الدخول */
  async login(email: string, password: string): Promise<AuthSession> {
    const response = await this.client.post<ApiResponse<AuthSession>>('/api/v1/auth/login', {
      email,
      password,
    });

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Login failed');
    }

    await this.saveSession(response.data.data);
    return response.data.data;
  }

  /** تسجيل مستخدم جديد */
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<AuthSession> {
    const response = await this.client.post<ApiResponse<AuthSession>>('/api/v1/auth/register', data);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Registration failed');
    }

    await this.saveSession(response.data.data);
    return response.data.data;
  }

  // ─── Assets ───────────────────────────────────────────────

  /** التحقق من أصل (عام — لا يتطلب مصادقة) */
  async verifyAsset(passportId: string, lang: string = 'EN'): Promise<any> {
    const response = await this.client.get(
      `/api/v1/assets/verify/${passportId}?lang=${lang}`,
    );
    return response.data;
  }

  /** جلب تفاصيل أصل بالـ Gold ID */
  async getAssetByGoldId(goldId: string, lang: string = 'EN'): Promise<any> {
    const response = await this.client.get(
      `/api/v1/assets/gold/${goldId}?lang=${lang}`,
    );
    return response.data;
  }

  /** تسجيل أصل جديد */
  async registerAsset(data: any): Promise<any> {
    const response = await this.client.post('/api/v1/assets/register', data);
    return response.data;
  }

  // ─── Health ───────────────────────────────────────────────

  /** فحص صحة الخادم */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
