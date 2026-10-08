const fs = require("fs");
const file = "src/components/LabPage.tsx";
let content = fs.readFileSync(file, "utf-8");

content = content.replace("import { supabase } from '../supabase';", "import { supabase } from '../supabase';\nimport LabsPage from './LabsPage';");

content = content.replace(
  /<div className="card text-center p-8 text-johar-gray-light">[\s\S]*?<\/div>/,
  "<LabsPage />"
);

fs.writeFileSync(file, content, "utf-8");
