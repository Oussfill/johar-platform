const fs = require("fs");
const file = "src/components/LabsPage.tsx";
let content = fs.readFileSync(file, "utf-8");

content = content.replace("</form>\n      </Modal>\n    </div>\n  );\n\n      <Modal isOpen={!!selectedLab}", "</form>\n      </Modal>\n\n      <Modal isOpen={!!selectedLab}");

fs.writeFileSync(file, content, "utf-8");
