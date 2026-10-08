const fs = require('fs');
let code = fs.readFileSync('src/components/GuestLandingPage.tsx', 'utf8');

// Replace the language button with a dropdown
const oldButton = `<button
              onClick={() => i18n.changeLanguage(isRTL ? 'en' : 'ar')}
              className="text-sm font-medium text-johar-gray-light hover:text-johar-white transition-colors"
            >
              {isRTL ? 'English' : 'عربي'}
            </button>`;

const newDropdown = `<select 
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
            </select>`;

code = code.replace(oldButton, newDropdown);

// Fix the dir attribute on the root div to update dynamically
code = code.replace(
  /dir=\{t\("direction", "rtl"\)\}/,
  'dir={i18n.language.startsWith("ar") ? "rtl" : "ltr"}'
);

fs.writeFileSync('src/components/GuestLandingPage.tsx', code);
