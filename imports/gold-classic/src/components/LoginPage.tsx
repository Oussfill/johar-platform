// ============================================================================
// GOLD PLATFORM — LOGIN PAGE
// ============================================================================
// صفحة تسجيل الدخول — تدعم تسجيل الدخول بالبريد الإلكتروني وكلمة المرور + MFA

import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

type Language = 'AR' | 'FR' | 'EN';
type Currency = 'DZD' | 'EUR' | 'USD';

interface LoginPageProps {
  language: Language;
  currency: Currency;
  onLanguageChange: (lang: Language) => void;
  onCurrencyChange: (currency: Currency) => void;
}

const TRANSLATIONS: Record<Language, {
  title: string;
  subtitle: string;
  email: string;
  password: string;
  mfaCode: string;
  loginBtn: string;
  loggingIn: string;
  error: string;
  mfaRequired: string;
  language: string;
  currency: string;
  demoHint: string;
  demoUsers: Array<{ label: string; email: string; role: string }>;
  tabPassword: string;
  tabOtp: string;
  otpCode: string;
  sendCode: string;
  resendCode: string;
  verifyCode: string;
  codeSent: string;
  devCodeLabel: string;
  demoModeHint: string;
  continueWithGoogle: string;
  googleLoginError: string;
  googleNotConfigured: string;
}> = {
  AR: {
    title: 'جوهر',
    subtitle: 'تسجيل الدخول إلى منصة جوهر',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    mfaCode: 'رمز المصادقة الثنائية',
    loginBtn: 'تسجيل الدخول',
    loggingIn: 'جاري تسجيل الدخول...',
    error: 'خطأ في تسجيل الدخول',
    mfaRequired: 'أدخل رمز المصادقة الثنائية (TOTP)',
    language: 'اللغة',
    currency: 'العملة',
    demoHint: 'حساب تجريبي: admin@gold-platform.com',
    demoUsers: [
      { label: 'مدير النظام (SUPER_ADMIN)', email: 'admin@gold-platform.com', role: 'SUPER_ADMIN' },
      { label: 'مدير الحيازة (CUSTODY_MANAGER)', email: 'custody@gold-platform.com', role: 'CUSTODY_MANAGER' },
      { label: 'مدير المختبر (LAB_DIRECTOR)', email: 'lab@gold-platform.com', role: 'LAB_DIRECTOR' },
      { label: 'مفتتش (AUDITOR)', email: 'auditor@gold-platform.com', role: 'AUDITOR' },
    ],
    tabPassword: 'كلمة المرور',
    tabOtp: 'كود عبر البريد',
    otpCode: 'رمز الدخول',
    sendCode: 'إرسال الرمز',
    resendCode: 'إعادة إرسال الرمز',
    verifyCode: 'تأكيد الدخول',
    codeSent: 'تم إرسال الرمز إلى بريدك — أدخله أدناه',
    devCodeLabel: 'الرمز (وضع تجريبي — لا مزوّد بريد مفعل):',
    demoModeHint: 'المنصة تعمل بوضع تجريبي للبريد — سيظهر الرمز هنا مباشرةً',
    continueWithGoogle: 'المتابعة عبر Google',
    googleLoginError: 'تعذّر بدء تسجيل الدخول عبر Google',
    googleNotConfigured: 'تسجيل الدخول عبر Google غير مفعل بعد',
  },
  FR: {
    title: 'جوهر',
    subtitle: 'Connectez-vous à la plateforme mondiale de l\'or',
    email: 'E-mail',
    password: 'Mot de passe',
    mfaCode: 'Code d\'authentification',
    loginBtn: 'Se connecter',
    loggingIn: 'Connexion en cours...',
    error: 'Erreur de connexion',
    mfaRequired: 'Entrez le code d\'authentification (TOTP)',
    language: 'Langue',
    currency: 'Devise',
    demoHint: 'Compte démo: admin@jawhara.com',
    demoUsers: [
      { label: 'Admin (SUPER_ADMIN)', email: 'admin@gold-platform.com', role: 'SUPER_ADMIN' },
      { label: 'Gestionnaire Custody (CUSTODY_MANAGER)', email: 'custody@gold-platform.com', role: 'CUSTODY_MANAGER' },
      { label: 'Directeur Lab (LAB_DIRECTOR)', email: 'lab@gold-platform.com', role: 'LAB_DIRECTOR' },
      { label: 'Auditeur (AUDITOR)', email: 'auditor@gold-platform.com', role: 'AUDITOR' },
    ],
    tabPassword: 'Mot de passe',
    tabOtp: 'Code par email',
    otpCode: 'Code de connexion',
    sendCode: 'Envoyer le code',
    resendCode: 'Renvoyer le code',
    verifyCode: 'Confirmer',
    codeSent: 'Code envoyé — saisissez-le ci-dessous',
    devCodeLabel: 'Code (mode démo — aucun fournisseur de messagerie) :',
    demoModeHint: 'Le mode démo email est actif — le code apparaît ici',
    continueWithGoogle: 'Continuer avec Google',
    googleLoginError: 'Impossible de démarrer la connexion Google',
    googleNotConfigured: 'La connexion Google n\'est pas encore activée',
  },
  EN: {
    title: 'جوهر',
    subtitle: 'Sign in to JOHAR Platform',
    email: 'Email',
    password: 'Password',
    mfaCode: 'Authentication Code',
    loginBtn: 'Sign In',
    loggingIn: 'Signing in...',
    error: 'Login failed',
    mfaRequired: 'Enter TOTP authentication code',
    language: 'Language',
    currency: 'Currency',
    demoHint: 'Demo account: admin@jawhara.com',
    demoUsers: [
      { label: 'System Admin (SUPER_ADMIN)', email: 'admin@gold-platform.com', role: 'SUPER_ADMIN' },
      { label: 'Custody Manager', email: 'custody@gold-platform.com', role: 'CUSTODY_MANAGER' },
      { label: 'Lab Director', email: 'lab@gold-platform.com', role: 'LAB_DIRECTOR' },
      { label: 'Auditor', email: 'auditor@gold-platform.com', role: 'AUDITOR' },
    ],
    tabPassword: 'Password',
    tabOtp: 'Email code',
    otpCode: 'Login code',
    sendCode: 'Send code',
    resendCode: 'Resend code',
    verifyCode: 'Confirm login',
    codeSent: 'Code sent — enter it below',
    devCodeLabel: 'Code (demo mode — no mail provider):',
    demoModeHint: 'Email demo mode active — the code appears here',
    continueWithGoogle: 'Continue with Google',
    googleLoginError: 'Failed to start Google sign-in',
    googleNotConfigured: 'Google sign-in is not enabled yet',
  },
};

export const LoginPage: React.FC<LoginPageProps> = ({
  language,
  currency,
  onLanguageChange,
  onCurrencyChange,
}) => {
  const { login, requestEmailOtp, verifyEmailOtp } = useAuth();
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // قراءة أخطاء معاودة Google من رابط الصفحة (#/login?error=...) وتنظيف الرابط
  useEffect(() => {
    const match = window.location.hash.match(/[?&]error=([^&]+)/);
    if (match) {
      const code = decodeURIComponent(match[1]);
      setError(code === 'google_invalid_state' ? t.googleLoginError : t.googleLoginError);
      if (window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = TRANSLATIONS[language];

  const handleGoogleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (googleLoading) return;
    setError('');
    setGoogleLoading(true);
    try {
      const response = await fetch('/api/v1/auth/google/url', { headers: { Accept: 'application/json' } });
      const payload = await response.json();
      if (response.ok && payload.success && payload.data?.url) {
        window.location.href = payload.data.url;
      } else {
        const code = payload?.error?.code;
        setError(code === 'GOOGLE_OAUTH_NOT_CONFIGURED' ? t.googleNotConfigured : t.googleLoginError);
      }
    } catch (err) {
      setError(t.googleLoginError);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (mode === 'otp' && !otpSent) {
      // طلب إرسال رمز الدخول
      const result = await requestEmailOtp(email);
      if (result.success) {
        setOtpSent(true);
        setDevCode(result.devCode || '');
      } else {
        setError(result.error || t.error);
      }
      setIsLoading(false);
      return;
    }

    if (mode === 'otp') {
      // التحقق من الرمز وتسجيل الدخول
      const result = await verifyEmailOtp(email, otpCode, showMfa ? mfaCode : undefined);
      if (result.success) {
        // سيتم التوجيه تلقائياً عبر GoldApp
      } else if (result.mfaRequired) {
        setShowMfa(true);
        setError('');
      } else {
        setError(result.error || t.error);
      }
      setIsLoading(false);
      return;
    }

    // وضع كلمة المرور
    const result = await login(email, password, showMfa ? mfaCode : undefined);

    if (result.success) {
      // سيتم التوجيه تلقائياً عبر GoldApp
    } else if (result.mfaRequired) {
      setShowMfa(true);
      setError('');
    } else {
      setError(result.error || t.error);
    }
    setIsLoading(false);
  };

  const switchMode = (next: 'password' | 'otp') => {
    setMode(next);
    setError('');
    setOtpSent(false);
    setDevCode('');
    setOtpCode('');
    setShowMfa(false);
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('GOLD@Admin2024!');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'rgba(20, 20, 30, 0.95)',
          borderRadius: 16,
          border: '1px solid rgba(198, 169, 105, 0.2)',
          padding: '40px 32px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(198, 169, 105, 0.1)',
        }}
      >
        {/* الشعار */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="/johar-logo.jpeg"
            alt="جوهر"
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              objectFit: 'cover',
              display: 'block',
              margin: '0 auto 16px',
              border: '2px solid #c6a969',
            }}
          />
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #c6a969, #a67c00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
            }}
          >
            {t.title}
          </h1>
          <p style={{ color: '#8a8a9a', fontSize: 14, marginTop: 8 }}>{t.subtitle}</p>
        </div>

        {/* محوّل اللغة والعملة */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#8a8a9a', fontSize: 12, display: 'block', marginBottom: 4 }}>{t.language}</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['AR', 'FR', 'EN'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    border: `1px solid ${language === lang ? '#c6a969' : '#333'}`,
                    borderRadius: 6,
                    background: language === lang ? 'rgba(198, 169, 105, 0.15)' : 'transparent',
                    color: language === lang ? '#c6a969' : '#8a8a9a',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: language === lang ? 700 : 400,
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#8a8a9a', fontSize: 12, display: 'block', marginBottom: 4 }}>{t.currency}</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['USD', 'EUR', 'DZD'] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => onCurrencyChange(c)}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    border: `1px solid ${currency === c ? '#c6a969' : '#333'}`,
                    borderRadius: 6,
                    background: currency === c ? 'rgba(198, 169, 105, 0.15)' : 'transparent',
                    color: currency === c ? '#c6a969' : '#8a8a9a',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: currency === c ? 700 : 400,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* محوّل طريقة تسجيل الدخول */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 24,
            padding: 4,
            background: 'rgba(30, 30, 45, 0.6)',
            borderRadius: 10,
            border: '1px solid rgba(198, 169, 105, 0.15)',
          }}
        >
          {(['password', 'otp'] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                borderRadius: 8,
                background: mode === m ? 'linear-gradient(135deg, #c6a969, #a67c00)' : 'transparent',
                color: mode === m ? '#0a0a0f' : '#8a8a9a',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {m === 'password' ? t.tabPassword : t.tabOtp}
            </button>
          ))}
        </div>

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#c0c0d0', fontSize: 13, display: 'block', marginBottom: 6 }}>{t.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(30, 30, 45, 0.8)',
                border: '1px solid #333',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="admin@gold-platform.com"
            />
          </div>

          {mode === 'password' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#c0c0d0', fontSize: 13, display: 'block', marginBottom: 6 }}>{t.password}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(30, 30, 45, 0.8)',
                  border: '1px solid #333',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="••••••••"
              />
            </div>
          )}

          {/* وضع كود البريد: حقل الكود */}
          {mode === 'otp' && otpSent && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#c0c0d0', fontSize: 13, display: 'block', marginBottom: 6 }}>{t.otpCode}</label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                required
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(30, 30, 45, 0.8)',
                  border: '1px solid #333',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 18,
                  letterSpacing: 6,
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="000000"
              />
              <p style={{ color: '#8a8a9a', fontSize: 12, marginTop: 4 }}>{t.codeSent}</p>
              {devCode && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '10px 12px',
                    background: 'rgba(198, 169, 105, 0.08)',
                    border: '1px dashed rgba(198, 169, 105, 0.4)',
                    borderRadius: 8,
                  }}
                >
                  <p style={{ color: '#8a8a9a', fontSize: 11, marginBottom: 4 }}>{t.demoModeHint}</p>
                  <p style={{ color: '#c6a969', fontSize: 16, fontWeight: 700, letterSpacing: 4, margin: 0 }}>
                    {t.devCodeLabel} {devCode}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* حقل MFA */}
          {showMfa && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#c0c0d0', fontSize: 13, display: 'block', marginBottom: 6 }}>{t.mfaCode}</label>
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                required
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(30, 30, 45, 0.8)',
                  border: '1px solid #333',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 18,
                  letterSpacing: 6,
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="000000"
              />
              <p style={{ color: '#8a8a9a', fontSize: 12, marginTop: 4 }}>{t.mfaRequired}</p>
            </div>
          )}

          {/* رسالة الخطأ */}
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(220, 53, 69, 0.15)',
                border: '1px solid rgba(220, 53, 69, 0.3)',
                borderRadius: 8,
                color: '#dc3545',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {/* زر إرسال */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px 0',
              background: isLoading ? '#666' : 'linear-gradient(135deg, #c6a969, #a67c00)',
              border: 'none',
              borderRadius: 8,
              color: '#0a0a0f',
              fontSize: 15,
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              letterSpacing: 1,
              marginTop: 8,
            }}
          >
            {isLoading
              ? t.loggingIn
              : mode === 'otp'
              ? otpSent
                ? t.verifyCode
                : t.sendCode
              : t.loginBtn}
          </button>

          {/* فاصل وأيقونة قوقل */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 4px' }}>
            <span style={{ flex: 1, height: 1, background: '#2a2a3a' }} />
            <span style={{ color: '#8a8a9a', fontSize: 11 }}>OR</span>
            <span style={{ flex: 1, height: 1, background: '#2a2a3a' }} />
          </div>
          <button
            type="button"
            disabled={googleLoading}
            onClick={handleGoogleSignIn}
            style={{
              width: '100%',
              padding: '12px 0',
              background: googleLoading ? 'rgba(30,30,45,0.6)' : '#ffffff',
              border: '1px solid #444',
              borderRadius: 8,
              color: '#1f2937',
              fontSize: 14,
              fontWeight: 600,
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            {googleLoading ? t.loggingIn : t.continueWithGoogle}
          </button>
        </form>

        {/* حسابات تجريبية */}
        <div style={{ marginTop: 24, padding: '16px', background: 'rgba(198, 169, 105, 0.05)', borderRadius: 8, border: '1px solid rgba(198, 169, 105, 0.1)' }}>
          <p style={{ color: '#c6a969', fontSize: 12, fontWeight: 600, marginBottom: 10, textAlign: 'center' }}>
            {t.demoHint}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {t.demoUsers.map((demo) => (
              <button
                key={demo.email}
                onClick={() => fillDemo(demo.email)}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(30, 30, 45, 0.6)',
                  border: '1px solid #333',
                  borderRadius: 6,
                  color: '#c0c0d0',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: language === 'AR' ? 'right' : 'left',
                }}
              >
                <span style={{ color: '#c6a969', fontWeight: 600 }}>{demo.label}</span>
                <span style={{ margin: '0 6px', color: '#555' }}>|</span>
                <span style={{ color: '#8a8a9a' }}>{demo.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
