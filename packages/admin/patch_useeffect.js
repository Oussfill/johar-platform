const fs = require("fs");
['src/components/AuditPage.tsx', 'src/components/SecurityPage.tsx'].forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  if(!content.includes("useEffect,")) {
    content = content.replace("import { useState }", "import { useState, useEffect }");
    // Just in case it was "import React, { useState }"
    content = content.replace("import React, { useState }", "import React, { useState, useEffect }");
  }
  fs.writeFileSync(file, content);
});
