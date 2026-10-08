const fs = require('fs');
let code = fs.readFileSync('src/auth.ts', 'utf8');

code = code.replace(
  /const roles = profile\?\.role \? \[profile\.role\] : \["super_admin"\];/,
  'const roles = profile?.role ? [profile.role] : (isAdmin ? ["super_admin"] : ["consumer"]);'
);

fs.writeFileSync('src/auth.ts', code);
