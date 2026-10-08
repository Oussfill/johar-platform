const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf8');

// Add language selector to LoginPage.tsx
const langSelect = `
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
`;

if (!code.includes('absolute top-4 right-4 z-50')) {
  // Need to import i18n
  if (!code.includes('import { useTranslation }')) {
     code = code.replace('import React', 'import { useTranslation } from "react-i18next";\nimport React');
  }

  code = code.replace(
    /<div className="w-full max-w-md">/,
    `<div className="w-full max-w-md relative">\n${langSelect}`
  );
  
  // ensure i18n is destructured
  if (!code.includes('const { t, i18n } = useTranslation()')) {
    code = code.replace('const { t } = useTranslation();', 'const { t, i18n } = useTranslation();');
  }

  // update dir attribute
  code = code.replace(
    /dir=\{t\("direction", "rtl"\)\}/,
    'dir={i18n.language.startsWith("ar") ? "rtl" : "ltr"}'
  );
}

fs.writeFileSync('src/components/LoginPage.tsx', code);
