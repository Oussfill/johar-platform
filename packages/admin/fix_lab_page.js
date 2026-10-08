const fs = require("fs");
const file = "src/components/LabPage.tsx";
let content = fs.readFileSync(file, "utf-8");

content = content.replace("import { supabase } from '../supabase';", "import { supabase } from '../supabase';\nimport LabsPage from './LabsPage';");

content = content.replace(
  /<div className="card text-center p-8 text-johar-gray-light">\s*قائمة المختبرات قيد التطوير...\s*<\/div>/,
  "<LabsPage />"
);

// Also let's fix the translation texts if they are malformed, but they look okay as literal Arabic strings since I use Regex replacing exact structure.
// Actually, in the file it has Arabic text inside: "قائمة المختبرات قيد التطوير...". My regex might fail due to encoding.

// Let's just use string replace without regex.
