const fs = require("fs");
const file = "src/components/NegotiationsPage.tsx";
let content = fs.readFileSync(file, "utf-8");

// Fix db mappings
content = content.replace(/neg\.offerId/g, "neg.id.substring(0,8)");
content = content.replace(/neg\.round/g, "neg.current_round");
content = content.replace(/neg\.lastPrice/g, "neg.proposed_price");
content = content.replace(/neg\.timer/g, "'23:59:59'"); // mock timer

// Dynamic stats
content = content.replace(
  /<div className="stat-value">12<\/div>/,
  `<div className="stat-value">{negotiations.filter(n => n.status === 'ACTIVE' || n.status === 'نشط').length}</div>`
);
content = content.replace(
  /<div className="stat-value">5<\/div>/,
  `<div className="stat-value">{negotiations.filter(n => n.status === 'NEEDS_DECISION').length}</div>`
);
content = content.replace(
  /<div className="stat-value">34<\/div>/,
  `<div className="stat-value">{negotiations.filter(n => n.status === 'COMPLETED' || n.status === 'مكتمل').length}</div>`
);
content = content.replace(
  /<div className="stat-value">8<\/div>/,
  `<div className="stat-value">{negotiations.filter(n => n.status === 'FAILED' || n.status === 'فاشل').length}</div>`
);

// We need to also patch MarketplacePage.tsx to use NegotiationsPage
const file2 = "src/components/MarketplacePage.tsx";
let content2 = fs.readFileSync(file2, "utf-8");
content2 = content2.replace("import { supabase } from '../supabase';", "import { supabase } from '../supabase';\nimport NegotiationsPage from './NegotiationsPage';");
content2 = content2.replace(
  /<div className="card text-center p-8 text-johar-gray-light">\s*[\s\S]*?\s*<\/div>/,
  "<NegotiationsPage />"
);

fs.writeFileSync(file, content, "utf-8");
fs.writeFileSync(file2, content2, "utf-8");
