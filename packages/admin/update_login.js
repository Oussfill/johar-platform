const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf8');

code = code.replace(
  'const { signIn, signInWithGoogle, loading } = useAuth();',
  'const { signIn, signUp, signInWithGoogle, loading } = useAuth();\n  const [isRegister, setIsRegister] = useState(false);'
);

code = code.replace(
  'const m = await signIn(email, password);',
  `let m;
        if (isRegister) {
          m = await signUp(email, password);
          if (!m) {
            setError(t("login.checkEmail", "Please check your email for the verification link."));
            setSubmitting(false);
            return;
          }
        } else {
          m = await signIn(email, password);
        }`
);

code = code.replace(
  '{t("login.title", "تسجيل الدخول إلى JOHAR")}',
  '{isRegister ? t("login.registerTitle", "إنشاء حساب جديد") : t("login.title", "تسجيل الدخول إلى JOHAR")}'
);

code = code.replace(
  '{t("login.submit", "تسجيل الدخول")}',
  '{isRegister ? t("login.registerSubmit", "إنشاء حساب") : t("login.submit", "تسجيل الدخول")}'
);

const buttonAdd = `<button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="mt-4 w-full text-center text-sm text-johar-gold hover:text-johar-white transition-colors"
          >
            {isRegister ? t("login.haveAccount", "لديك حساب بالفعل؟ تسجيل الدخول") : t("login.noAccount", "ليس لديك حساب؟ إنشاء حساب جديد")}
          </button>

          <button
            onClick={onGoGuest}`;
code = code.replace('<button\n            onClick={onGoGuest}', buttonAdd);

fs.writeFileSync('src/components/LoginPage.tsx', code);
