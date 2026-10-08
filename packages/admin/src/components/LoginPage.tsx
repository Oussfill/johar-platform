import { useState } from "react";
import {
  Gem,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { AccessScope, inferScope, JoharMe } from "../auth";
import { useTranslation } from "react-i18next";

interface LoginPageProps {
  onGoGuest: () => void;
}

/** مسار بدء OAuth — يُفعَّل عندما تُهيّأ Google Credentials في الـ backend */
function GoogleG({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

// ============================================================================
// شاشة الدخول الموحّدة — مساران:
//   1) متابعة بحساب Google (OAuth) — يُفعَّل حين تُهيّأ creds في الـ backend
//   2) بريد إلكتروني + كلمة مرور → JWT → /auth/me → توجيه حسب الدور
// ============================================================================
export default function LoginPage({ onGoGuest }: LoginPageProps) {
  const { signIn, signUp, signInWithGoogle, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scope, setScope] = useState<AccessScope | null>(null);
  const [me, setMe] = useState<JoharMe | null>(null);

  const SCOPE_LABELS: Record<AccessScope, string> = {
    super_admin: t("scope.superAdmin", "Super Admin"),
    platform: t("scope.platform", "منصة"),
    tenant: t("scope.tenant", "منظّمة / عميل أعمال"),
    consumer: t("scope.consumer", "عميل / مستهلك"),
    guest: t("scope.guest", "زائر"),
  };

  const handleGoogle = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const m = await signInWithGoogle();
      setMe(m);
      setScope((m.scope as AccessScope | null) ?? inferScope(m.roles ?? []));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("login.googleError", "تعذّر الدخول بحساب Google")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t("login.emptyFieldsError", "أدخل البريد الإلكتروني وكلمة المرور"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      let m;
        if (isRegister) {
          m = await signUp(email, password);
          if (!m) {
            setError(t("login.checkEmail", "Please check your email for the verification link."));
            setSubmitting(false);
            return;
          }
        } else {
          m = await signIn(email, password);
        }
      setMe(m);
      setScope((m.scope as AccessScope | null) ?? inferScope(m.roles ?? []));
    } catch (err) {
      let msg = err instanceof Error ? err.message : t("login.defaultError", "حدث خطأ غير متوقع");
        if (msg.includes("device clock for skew") || msg.includes("issued in the future")) {
          msg = "فشل التحقق من الجلسة بسبب اختلاف الوقت. يرجى ضبط ساعة جهازك (الوقت والتاريخ) وتحديث الصفحة.";
        }
        if (msg.includes("Invalid login credentials")) {
          msg = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
        }
        setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-johar-black text-johar-white flex items-center justify-center px-6 py-10" dir={i18n.language.startsWith("ar") ? "rtl" : "ltr"}>
      <div className="w-full max-w-md relative">

          <div className="absolute top-4 right-4 z-50">
            <select 
              className="bg-transparent border border-johar-gray-dark rounded text-sm px-2 py-1 text-johar-gray-light hover:text-johar-white cursor-pointer focus:outline-none focus:border-johar-gold transition-colors appearance-none"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
              value={i18n.language.substring(0, 2)}
              onChange={(e) => {
                i18n.changeLanguage(e.target.value);
                document.documentElement.dir = e.target.value === 'ar' ? 'rtl' : 'ltr';
              }}
            >
              <option value="ar" className="bg-johar-black text-white">العربية</option>
              <option value="en" className="bg-johar-black text-white">English</option>
              <option value="fr" className="bg-johar-black text-white">Français</option>
            </select>
          </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg shadow-johar-gold/20 flex items-center justify-center bg-white border border-white/10">
            <img src="/logo.jpeg" alt="JOHAR" className="w-full h-full object-cover" />
          </div>
          <span className="text-3xl font-bold gold-text">JOHAR</span>
        </div>

        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
          style={{ boxShadow: "0 0 40px rgba(212, 175, 55, 0.05), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
          <h1 className="text-3xl font-extrabold text-center mb-2 tracking-wide gold-text">{t("login.title", "تسجيل الدخول")}</h1>
          <p className="text-center text-sm text-johar-gray-light mb-8">
            {t("login.subtitle", "لوحة تحكم JOHAR — إدارة سلسلة الذهب والمجوهرات")}
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting || loading}
            className="w-full flex items-center justify-center gap-2 border border-johar-gray-mid/40 hover:border-johar-gray-mid bg-johar-white text-johar-black rounded-xl py-3 mb-1 transition-colors disabled:opacity-50"
          >
            <GoogleG className="w-5 h-5" />
            {t("login.googleBtn", "المتابعة بحساب Google")}
          </button>

          <div className="flex items-center gap-3 my-4">
            <span className="flex-1 h-px bg-johar-gray-mid/30" />
            <span className="text-xs text-johar-gray-mid">{t("common.or", "أو")}</span>
            <span className="flex-1 h-px bg-johar-gray-mid/30" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium mb-2">{t("login.email", "البريد الإلكتروني")}</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-johar-gray-mid" />
                <input
                  id="login-email"
                  type="email"
                  dir="ltr"
                  className="w-full bg-johar-black border border-johar-gray-dark focus:border-johar-gold rounded-xl py-3 pr-11 pl-4 text-sm text-johar-white placeholder:text-johar-gray-mid transition-colors outline-none"
                  placeholder="admin@johar.gold"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium mb-2">{t("login.password", "كلمة المرور")}</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-johar-gray-mid" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  className="w-full bg-johar-black border border-johar-gray-dark focus:border-johar-gold rounded-xl py-3 pr-11 pl-11 text-sm text-johar-white placeholder:text-johar-gray-mid transition-colors outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-johar-gray-mid hover:text-johar-gold"
                  aria-label={showPassword ? t("login.hidePassword", "إخفاء كلمة المرور") : t("login.showPassword", "إظهار كلمة المرور")}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-johar-danger bg-johar-danger/10 border border-johar-danger/30 rounded-lg px-4 py-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting || loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {t("login.submit", "دخول")}
            </button>
          </form>

          {scope && (
            <div className="mt-6 badge-success w-full flex items-center justify-center gap-2">
              <span className="text-sm">{t("login.loggedInScope", "تم الدخول — النطاق:")}</span>
              <span className="font-bold">{SCOPE_LABELS[scope] ?? scope}</span>
            </div>
          )}
          {me && (
            <div className="mt-2 badge-success w-full flex items-center justify-center gap-2" dir="ltr">
              <span className="font-mono text-xs">{me.email}</span>
            </div>
          )}
        </div>

        <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="mt-4 w-full text-center text-sm text-johar-gold hover:text-johar-white transition-colors"
          >
            {isRegister ? "لديك حساب بالفعل؟ تسجيل الدخول" : "ليӡ لديك حساب؟ إنشاء حساب حديد"}
          </button>

          <button
            onClick={onGoGuest}
          className="mt-6 w-full text-center text-sm text-johar-gray-light hover:text-johar-gold transition-colors"
        >
          {t("login.browseAsGuest", "تصفّح الموقع كزائر")}
        </button>
      </div>
    </div>
  );
}
