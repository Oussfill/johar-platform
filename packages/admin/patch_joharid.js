const fs = require("fs");
const file = "src/components/JoharIDPage.tsx";
let content = fs.readFileSync(file, "utf-8");

// 1. Add state for profiles
if (!content.includes("const [profiles, setProfiles]")) {
  content = content.replace(
    /const \[assets, setAssets\] = useState<any\[\]>\(\[\]\);/,
    `const [assets, setAssets] = useState<any[]>([]);\n  const [profiles, setProfiles] = useState<any[]>([]);`
  );
}

// 2. Fetch profiles
if (!content.includes("fetchProfiles()")) {
  content = content.replace(
    /fetchAssets\(\);/,
    `fetchAssets();\n    fetchProfiles();`
  );
  content = content.replace(
    /const fetchAssets = async \(\) => \{/,
    `const fetchProfiles = async () => {\n    const { data } = await supabase.from('profiles').select('id, full_name');\n    if (data) setProfiles(data);\n  };\n\n  const fetchAssets = async () => {`
  );
}

// 3. Replace input with select
content = content.replace(
  /<input type="text" className="input" required value=\{newItem\.owner\} onChange=\{e => setNewItem\(\{\.\.\.newItem, owner: e\.target\.value\}\)\} \/>/g,
  `<select className="input" required value={newItem.owner} onChange={e => setNewItem({...newItem, owner: e.target.value})}>\n              <option value="">اختر المالك...</option>\n              {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}\n            </select>`
);
// Also cover the case where the property is `current_owner_id` depending on what the subagent wrote.
content = content.replace(
  /<input type="text" className="input" required value=\{newItem\.current_owner_id\} onChange=\{e => setNewItem\(\{\.\.\.newItem, current_owner_id: e\.target\.value\}\)\} \/>/g,
  `<select className="input" required value={newItem.current_owner_id} onChange={e => setNewItem({...newItem, current_owner_id: e.target.value})}>\n              <option value="">اختر المالك...</option>\n              {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}\n            </select>`
);


fs.writeFileSync(file, content, "utf-8");
