const fs = require("fs");
const file = "src/components/LabsPage.tsx";
let content = fs.readFileSync(file, "utf-8");

content = content.replace(
  /asset_code: newRequest\.asset_code,\s*client: newRequest\.client,\s*test_type: newRequest\.test_type,\s*status: 'REQUESTED',\s*passed: false/,
  `asset_code: newRequest.asset_code,
      client: newRequest.client,
      test_type: newRequest.test_type,
      status: 'REQUESTED',
      passed: false,
      lab_id: requestLab.id`
);

fs.writeFileSync(file, content, "utf-8");
