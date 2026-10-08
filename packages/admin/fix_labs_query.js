const fs = require("fs");
const file = "src/components/LabsPage.tsx";
let content = fs.readFileSync(file, "utf-8");
content = content.replace(/supabase\.from\('equipment'\)/, "supabase.from('labs')");
fs.writeFileSync(file, content, "utf-8");
