const fs = require("fs");
const files = ["src/components/KYCPage.tsx", "src/components/KYBPage.tsx", "src/components/UBOPage.tsx"];

for (const file of files) {
  let content = fs.readFileSync(file, "utf-8");
  content = content.replace(/id: number/g, "id: string");
  
  // also, in KYCPage, if it has a hardcoded ID for insert, remove it.
  if (file.includes("KYCPage")) {
     content = content.replace(/id: `KYC-NEW-\${Math.floor\(Math.random\(\) \* 10000\)}`,/g, "");
  }
  
  fs.writeFileSync(file, content, "utf-8");
}
