const fs = require("fs");
const file = "src/components/InvoicesPage.tsx";
let content = fs.readFileSync(file, "utf-8");

if (!content.includes("const [profiles, setProfiles]")) {
  content = content.replace(
    /const \[invoices, setInvoices\] = useState<any\[\]>\(\[\]\);/,
    `const [invoices, setInvoices] = useState<any[]>([]);\n  const [profiles, setProfiles] = useState<any[]>([]);`
  );
  
  content = content.replace(
    /fetchInvoices\(\);/,
    `fetchInvoices();\n    fetchProfiles();`
  );
  
  content = content.replace(
    /const fetchInvoices = async \(\) => \{/,
    `const fetchProfiles = async () => {\n    const { data } = await supabase.from('profiles').select('id, full_name');\n    if (data) setProfiles(data);\n  };\n\n  const fetchInvoices = async () => {`
  );
}

content = content.replace(
  /<input type="text" className="input" required value=\{newInvoice\.client\} onChange=\{e => setNewInvoice\(\{\.\.\.newInvoice, client: e\.target\.value\}\)\} \/>/g,
  `<select className="input" required value={newInvoice.client} onChange={e => setNewInvoice({...newInvoice, client: e.target.value})}>\n              <option value="">اختر العميل...</option>\n              {profiles.map(p => <option key={p.id} value={p.full_name}>{p.full_name}</option>)}\n            </select>`
);

fs.writeFileSync(file, content, "utf-8");
