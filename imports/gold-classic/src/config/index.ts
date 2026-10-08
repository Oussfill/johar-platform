// ============================================================================
// GOLD PLATFORM — APPLICATION CONFIGURATION
// ============================================================================

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// في الإنتاج نستخدم .env.production — في التطوير .env
const prodEnvPath = path.resolve(__dirname, '../../.env.production');
const envFile = process.env.NODE_ENV === 'production' && fs.existsSync(prodEnvPath)
  ? prodEnvPath
  : path.resolve(__dirname, '../../.env');

dotenv.config({ path: envFile });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiVersion: process.env.API_VERSION || 'v1',

  jwt: {
    secret: process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION_MIN_64_CHARS',
    expiry: process.env.JWT_EXPIRY || '24h',
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY || 'CHANGE_ME_IN_PRODUCTION_32_BYTES_HEX',
    nfcWriteKey: process.env.NFC_WRITE_KEY || 'CHANGE_ME_NFC_WRITE_SECRET',
  },

  ai: {
    modelVersion: process.env.AI_MODEL_VERSION || '1.0.0',
    confidenceThreshold: parseFloat(process.env.AI_CONFIDENCE_THRESHOLD || '0.85'),
  },

  blockchain: {
    network: process.env.BLOCKCHAIN_NETWORK || 'polygon',
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://polygon-rpc.com',
    contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  },

  i18n: {
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'EN',
    supportedLanguages: (process.env.SUPPORTED_LANGUAGES || 'AR,FR,EN').split(','),
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
    supportedCurrencies: (process.env.SUPPORTED_CURRENCIES || 'DZD,EUR,USD').split(','),
  },

  goldPrice: {
    apiUrl: process.env.GOLD_PRICE_API_URL || 'https://api.goldprice.org/v1',
    apiKey: process.env.GOLD_PRICE_API_KEY || 'CHANGE_ME',
  },

  mail: {
    // email provider: "resend" — إرسال فعلي عبر Resend REST API
    //               "demo" — وضع تجريبي (يعيد الكود في الاستجابة والسجلات)
    provider: process.env.EMAIL_PROVIDER || 'demo',
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'JOHAR <no-reply@gold-platform.com>',
  },

  oauth: {
    // تسجيل الدخول عبر Google (OAuth 2.0)
    // عند عدم ضبط الحقول يُوضَع الزر في وضع "غير مفعل"
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || '',
    defaultRoleCode: process.env.OAUTH_DEFAULT_ROLE || 'VIEWER',
  },

  custody: {
    dualAuthThresholdUsd: parseFloat(process.env.DUAL_AUTH_THRESHOLD_USD || '50000'),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  database: {
    url: process.env.DATABASE_URL,
  },
} as const;

export type Config = typeof config;
