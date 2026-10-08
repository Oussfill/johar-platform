const fs = require("fs");
const file = "src/components/LabsPage.tsx";
let content = fs.readFileSync(file, "utf-8");

if (!content.includes("const [profiles, setProfiles]")) {
  content = content.replace(
    /const \[labs, setLabs\] = useState<any\[\]>\(\[\]\);/,
    `const [labs, setLabs] = useState<any[]>([]);\n  const [profiles, setProfiles] = useState<any[]>([]);\n  const [assets, setAssets] = useState<any[]>([]);`
  );
  
  content = content.replace(
    /fetchLabs\(\);/,
    `fetchLabs();\n    fetchProfilesAndAssets();`
  );
  
  content = content.replace(
    /const fetchLabs = async \(\) => \{/,
    `const fetchProfilesAndAssets = async () => {\n    const { data: pData } = await supabase.from('profiles').select('id, full_name');\n    if (pData) setProfiles(pData);\n    const { data: aData } = await supabase.from('assets').select('id, asset_code');\n    if (aData) setAssets(aData);\n  };\n\n  const fetchLabs = async () => {`
  );
}

// Replace asset_code input with select
content = content.replace(
  /<input type="text" className="input" required value=\{newRequest\.asset_code\} onChange=\{e => setNewRequest\(\{\.\.\.newRequest, asset_code: e\.target\.value\}\)\} placeholder=".*?" \/>/g,
  `<select className="input" required value={newRequest.asset_code} onChange={e => setNewRequest({...newRequest, asset_code: e.target.value})}>\n              <option value="">اختر الأصل...</option>\n              {assets.map(a => <option key={a.id} value={a.asset_code}>{a.asset_code}</option>)}\n            </select>`
);

// Replace client input with select (but the database wants client name or id? `lab_tests` `client` is TEXT, we can just save `full_name` or save `id` if they changed it). Wait, the requested_by is the FK, which is profile ID!
content = content.replace(
  /<input type="text" className="input" required value=\{newRequest\.client\} onChange=\{e => setNewRequest\(\{\.\.\.newRequest, client: e\.target\.value\}\)\} \/>/g,
  `<select className="input" required value={newRequest.client} onChange={e => setNewRequest({...newRequest, client: e.target.value})}>\n              <option value="">اختر العميل...</option>\n              {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}\n            </select>`
);

// Also we need to make sure the insert actually maps `client` properly or `requested_by`.
// My previous patch in LabsPage was:
// client: newRequest.client, ...
// we can also pass requested_by: newRequest.client
content = content.replace(
  /client: newRequest\.client,/,
  `client: profiles.find(p => p.id === newRequest.client)?.full_name || '',\n      requested_by: newRequest.client,`
);

fs.writeFileSync(file, content, "utf-8");
