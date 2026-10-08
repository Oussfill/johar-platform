const fs = require('fs');
const fixes = [
  ['src/pages/consumerPages.tsx', 'plateforme Johar', 'plateforme JOHAR'],
  ['src/components/HomeDashboard.tsx', 'plateforme Johar', 'plateforme JOHAR'],
  ['src/controllers/AuthController.ts', "issuer: 'Johar'", "issuer: 'JOHAR'"],
];
let changed = 0;
for (const [file, from, to] of fixes) {
  let c = fs.readFileSync(file, 'utf8');
  if (c.includes(from)) {
    c = c.split(from).join(to);
    fs.writeFileSync(file, c);
    console.log('Fixed:', file, '-', from, '->', to);
    changed++;
  }
}
console.log(changed + ' files fixed');
