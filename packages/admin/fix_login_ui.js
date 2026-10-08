const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf8');

// Replace Gem with logo.jpeg
code = code.replace(
  /<div className="w-12 h-12 rounded-lg gold-gradient flex items-center justify-center">\s*<Gem className="w-6 h-6 text-johar-black" \/>\s*<\/div>/,
  '<div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg shadow-johar-gold/20 flex items-center justify-center bg-white border border-white/10">\n            <img src="/logo.jpeg" alt="JOHAR" className="w-full h-full object-cover" />\n          </div>'
);

// Add some nice glassmorphism and layout improvements
code = code.replace(
  /className="card p-8"/,
  'className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden"\n          style={{ boxShadow: "0 0 40px rgba(212, 175, 55, 0.05), inset 0 1px 0 rgba(255,255,255,0.1)" }}'
);

// Better inputs
code = code.replace(
  /className="input pr-10"/,
  'className="w-full bg-johar-black border border-johar-gray-dark focus:border-johar-gold rounded-xl py-3 pr-11 pl-4 text-sm text-johar-white placeholder:text-johar-gray-mid transition-colors outline-none"'
);
code = code.replace(
  /className="input pr-10 pl-10"/,
  'className="w-full bg-johar-black border border-johar-gray-dark focus:border-johar-gold rounded-xl py-3 pr-11 pl-11 text-sm text-johar-white placeholder:text-johar-gray-mid transition-colors outline-none"'
);

// Update heading
code = code.replace(
  /<h1 className="text-2xl font-bold text-center mb-2">/,
  '<h1 className="text-3xl font-extrabold text-center mb-2 tracking-wide gold-text">'
);

fs.writeFileSync('src/components/LoginPage.tsx', code);
