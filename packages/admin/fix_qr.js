const fs = require("fs");
const file = "src/components/JoharIDPage.tsx";
let content = fs.readFileSync(file, "utf-8");

// Fix the "View QR" button
content = content.replace(
  /<button className="text-johar-gold hover:underline text-sm">\{t\('view_qr', '.*?'\)\}<\/button>/g,
  `<button className="text-johar-gold hover:underline text-sm" onClick={() => setSelectedId(item)}>{t('view_qr', 'عرض QR')}</button>`
);

// Fix the QR Code placeholder in the modal
content = content.replace(
  /<div className="w-full h-full border border-black flex items-center justify-center bg-gray-200 text-black text-xs text-center">[\s\S]*?QR Code<br\/>\{selectedId\.id\}[\s\S]*?<\/div>/g,
  `<img src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://johar.com/verify/\${selectedId.id}\`} alt="QR Code" className="w-full h-full object-contain" />`
);

fs.writeFileSync(file, content, "utf-8");
