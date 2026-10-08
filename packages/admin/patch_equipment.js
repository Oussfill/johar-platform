const fs = require("fs");
const file = "src/components/EquipmentPage.tsx";
let content = fs.readFileSync(file, "utf-8");

if (!content.includes("const [labsList, setLabsList]")) {
  content = content.replace(
    /const \[equipment, setEquipment\] = useState<any\[\]>\(\[\]\);/,
    `const [equipment, setEquipment] = useState<any[]>([]);\n  const [labsList, setLabsList] = useState<any[]>([]);`
  );
  
  content = content.replace(
    /fetchEquipment\(\);/,
    `fetchEquipment();\n    fetchLabsList();`
  );
  
  content = content.replace(
    /const fetchEquipment = async \(\) => \{/,
    `const fetchLabsList = async () => {\n    const { data } = await supabase.from('labs').select('id, name');\n    if (data) setLabsList(data);\n  };\n\n  const fetchEquipment = async () => {`
  );
}

// Check how it asks for lab
content = content.replace(
  /<input type="text" className="input" required value=\{newItem\.lab\} onChange=\{e => setNewItem\(\{\.\.\.newItem, lab: e\.target\.value\}\)\} \/>/g,
  `<select className="input" required value={newItem.lab} onChange={e => setNewItem({...newItem, lab: e.target.value})}>\n              <option value="">اختر المختبر...</option>\n              {labsList.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}\n            </select>`
);

fs.writeFileSync(file, content, "utf-8");
