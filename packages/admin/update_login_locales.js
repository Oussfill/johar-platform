const fs = require('fs');
const path = require('path');

const loginEn = {
  title: "Login",
  subtitle: "JOHAR Gold Assets Management Platform",
  googleBtn: "Sign in with Google",
  email: "Email Address",
  password: "Password",
  hidePassword: "Hide Password",
  showPassword: "Show Password",
  submit: "Sign In",
  loggedInScope: "Logged in as:",
  browseAsGuest: "Browse as Guest"
};

const loginFr = {
  title: "Connexion",
  subtitle: "Plateforme de gestion des actifs en or JOHAR",
  googleBtn: "Se connecter avec Google",
  email: "Adresse e-mail",
  password: "Mot de passe",
  hidePassword: "Masquer le mot de passe",
  showPassword: "Afficher le mot de passe",
  submit: "Se connecter",
  loggedInScope: "Connecté en tant que:",
  browseAsGuest: "Naviguer en tant qu'invité"
};

const loginAr = {
  title: "تسجيل الدخول",
  subtitle: "منصة إدارة JOHAR للأصول الذهبية",
  googleBtn: "الدخول بـ Google",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  hidePassword: "إخفاء كلمة المرور",
  showPassword: "إظهار كلمة المرور",
  submit: "تسجيل الدخول",
  loggedInScope: "تم الدخول في نطاق:",
  browseAsGuest: "تصفح كضيف"
};

for (const [lang, translations] of Object.entries({ en: loginEn, fr: loginFr, ar: loginAr })) {
  const file = path.join('src', 'locales', `${lang}.json`);
  let json = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  json.login = translations;
  
  if (lang === 'en') json['common.or'] = "OR";
  if (lang === 'fr') json['common.or'] = "OU";
  if (lang === 'ar') json['common.or'] = "أو";
  
  fs.writeFileSync(file, JSON.stringify(json, null, 2));
}

console.log('Login translations updated.');
