// ============================================================================
// GOLD PLATFORM — GOOGLE OAUTH SERVICE
// ============================================================================
// تسجيل الدخول عبر Google (OAuth 2.0 — Authorization Code Flow)
//
//  الدفق:
//   1) buildAuthUrl: توليد رابط تفويض + state موقّع (HMAC) ضد CSRF
//   2) exchangeCode: استبدال الكود بـ access_token عبر نقطة Google
//   3) fetchProfile: جلب البريد/الاسم/الصورة من Google UserInfo
//   4) verifyState:  التحقق من حالة الطلب وإن كانت ضمن النافذة الزمنية
//
//  لا يحتاج SDK — يستخدم fetch المدمج في Node 18+.

import crypto from 'crypto';
import { config } from '../config';
import { logger } from '../config/logger';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const SCOPE = 'openid email profile';
const STATE_TTL_SECONDS = 10 * 60;

function hmacSecret(): string {
  return config.encryption.key || 'CHANGE_ME_IN_PRODUCTION_32_BYTES_HEX';
}

export interface GoogleProfile {
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
  googleId: string;
}

// ============================================================================
// STATE — حماية CSRF بدون تخزين (stateless)
// ============================================================================

export function issueState(): string {
  const ts = Math.floor(Date.now() / 1000).toString(36);
  const nonce = crypto.randomBytes(18).toString('base64url');
  const sig = crypto
    .createHmac('sha256', hmacSecret())
    .update(`${ts}.${nonce}`)
    .digest('base64url');
  return `${ts}.${nonce}.${sig}`;
}

export function verifyState(state: string): boolean {
  try {
    const parts = (state || '').split('.');
    if (parts.length !== 3) return false;
    const [ts, nonce, sig] = parts;
    const expected = crypto
      .createHmac('sha256', hmacSecret())
      .update(`${ts}.${nonce}`)
      .digest('base64url');
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
    const issued = parseInt(ts, 36) * 1000;
    if (Number.isNaN(issued)) return false;
    return Date.now() - issued < STATE_TTL_SECONDS * 1000;
  } catch (error) {
    logger.error('State verification error', { error });
    return false;
  }
}

// ============================================================================
// ENABLED CHECK
// ============================================================================

export function googleOAuthEnabled(): boolean {
  return Boolean(
    config.oauth.googleClientId &&
      config.oauth.googleClientSecret &&
      config.oauth.googleRedirectUri,
  );
}

// ============================================================================
// BUILD AUTH URL
// ============================================================================

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.oauth.googleClientId,
    redirect_uri: config.oauth.googleRedirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'online',
    prompt: 'select_account',
    state,
    include_granted_scopes: 'true',
  });
  return `${AUTH_URL}?${params.toString()}`;
}

// ============================================================================
// EXCHANGE CODE → TOKENS
// ============================================================================

async function exchangeCode(code: string): Promise<string> {
  const body = new URLSearchParams({
    code,
    client_id: config.oauth.googleClientId,
    client_secret: config.oauth.googleClientSecret,
    redirect_uri: config.oauth.googleRedirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    logger.error('Google token exchange failed', { status: response.status, error: errText.slice(0, 300) });
    throw new Error(`Google token exchange error ${response.status}`);
  }

  const data: any = await response.json();
  return data.access_token;
}

// ============================================================================
// FETCH PROFILE
// ============================================================================

async function fetchProfile(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errText = await response.text();
    logger.error('Google userinfo failed', { status: response.status, error: errText.slice(0, 300) });
    throw new Error(`Google userinfo error ${response.status}`);
  }

  const data: any = await response.json();

  if (!data.email) {
    throw new Error('Google account has no email address');
  }

  return {
    email: data.email.toLowerCase(),
    emailVerified: Boolean(data.email_verified),
    name: data.name || data.given_name || '',
    picture: data.picture || undefined,
    googleId: data.sub || '',
  };
}

// ============================================================================
// ONE-CALL: exchange + profile
// ============================================================================

export async function getGoogleProfile(code: string): Promise<GoogleProfile> {
  const accessToken = await exchangeCode(code);
  return fetchProfile(accessToken);
}