const fs = require("fs");
const file = "src/components/AssetsPage.tsx";
let content = fs.readFileSync(file, "utf-8");
content = content.replace(/\.single\(\)/g, ".maybeSingle()");
fs.writeFileSync(file, content, "utf-8");
