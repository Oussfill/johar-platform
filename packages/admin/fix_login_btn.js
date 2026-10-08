const fs = require('fs');
let code = fs.readFileSync('src/components/GuestLandingPage.tsx', 'utf8');

code = code.replace(
  /\{t\("login\.title", "تسجيل الدخول"\)\}/,
  '{t("landing.loginBtn", "تسجيل الدخول")}'
);

fs.writeFileSync('src/components/GuestLandingPage.tsx', code);

// Now update en.json, fr.json, ar.json
const path = require('path');
for (const lang of ['en', 'fr', 'ar']) {
  const file = path.join('src', 'locales', `${lang}.json`);
  let json = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  if (lang === 'en') json.landing.loginBtn = "Login";
  if (lang === 'fr') json.landing.loginBtn = "Connexion";
  if (lang === 'ar') json.landing.loginBtn = "تسجيل الدخول";
  
  fs.writeFileSync(file, JSON.stringify(json, null, 2));
}

console.log('Fixed button translation key and updated locales.');
