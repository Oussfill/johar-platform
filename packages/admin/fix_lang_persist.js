const fs = require('fs');

// Helper: the unified language changer to inject into pages
// It saves to localStorage key 'johar_lang' and updates HTML dir attribute
const changerCode = `(e) => {
                i18n.changeLanguage(e.target.value);
                document.documentElement.dir = e.target.value === 'ar' ? 'rtl' : 'ltr';
              }`;

const selectHtml = `<select 
              className="bg-transparent border border-johar-gray-dark rounded text-sm px-2 py-1 text-johar-gray-light hover:text-johar-white cursor-pointer focus:outline-none focus:border-johar-gold transition-colors"
              value={i18n.language.substring(0, 2)}
              onChange={${changerCode}}
            >
              <option value="ar" className="bg-johar-black text-white">العربية</option>
              <option value="en" className="bg-johar-black text-white">English</option>
              <option value="fr" className="bg-johar-black text-white">Français</option>
            </select>`;

// GuestLandingPage.tsx — the select is already there, just fix the onChange
let guest = fs.readFileSync('src/components/GuestLandingPage.tsx', 'utf8');
guest = guest.replace(
  /onChange=\{\(e\) => \{[\s\S]*?document\.documentElement\.dir[\s\S]*?\}\}/,
  `onChange={(e) => {
                i18n.changeLanguage(e.target.value);
                document.documentElement.dir = e.target.value === 'ar' ? 'rtl' : 'ltr';
              }}`
);
fs.writeFileSync('src/components/GuestLandingPage.tsx', guest);

// LoginPage.tsx — same fix
let login = fs.readFileSync('src/components/LoginPage.tsx', 'utf8');
login = login.replace(
  /onChange=\{\(e\) => \{[\s\S]*?i18n\.changeLanguage[\s\S]*?\}\}/,
  `onChange={(e) => {
                i18n.changeLanguage(e.target.value);
                document.documentElement.dir = e.target.value === 'ar' ? 'rtl' : 'ltr';
              }}`
);
fs.writeFileSync('src/components/LoginPage.tsx', login);

console.log('Language selectors updated.');
