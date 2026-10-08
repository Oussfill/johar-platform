const fs = require("fs");
const file = "src/components/LabsPage.tsx";
let content = fs.readFileSync(file, "utf-8");

// State for modal
const stateRegex = /const \[labs, setLabs\] = useState<any\[\]>\(\[\]\);/;
content = content.replace(stateRegex, `const [labs, setLabs] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLab, setNewLab] = useState({ name: '', location: '', acc: '', expiry: '' });`);

// Fetch function
const fetchRegex = /useEffect\(\(\) => \{\s*supabase\.from\('labs'\)\.select\('\*'\)\.then\(\(\{ data \}\) => \{\s*if \(data\) setLabs\(data\);\s*\}\);\s*\}, \[\]\);/;
content = content.replace(fetchRegex, `const fetchLabs = async () => {
    const { data } = await supabase.from('labs').select('*');
    if (data) setLabs(data);
  };
  
  useEffect(() => {
    fetchLabs();
  }, []);
  
  const handleAddLab = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('labs').insert([{
      name: newLab.name,
      location: newLab.location,
      acc: newLab.acc,
      expiry: newLab.expiry,
      status: 'معتمد',
      requests: 0,
      rating: 5
    }]);
    
    if (error) {
      alert('Error: ' + error.message);
    } else {
      setIsAddModalOpen(false);
      setNewLab({ name: '', location: '', acc: '', expiry: '' });
      fetchLabs();
    }
  };`);

// Add onClick to button
content = content.replace(
  /<button className="btn-primary">\{t\('add_lab_btn',\s*'.*?'\)\}<\/button>/,
  `<button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>{t('add_lab_btn', '+ إضافة مختبر')}</button>`
);

// Dynamic Stats
content = content.replace(
  /<div className="stat-value">15<\/div>/,
  `<div className="stat-value">{labs.length}</div>`
);
content = content.replace(
  /<div className="stat-value text-johar-success">12<\/div>/,
  `<div className="stat-value text-johar-success">{labs.filter(l => l.status === 'معتمد' || l.status === 'Approved').length}</div>`
);
content = content.replace(
  /<div className="stat-value text-johar-warning">2<\/div>/,
  `<div className="stat-value text-johar-warning">{labs.filter(l => l.status === 'قيد التجديد' || l.status === 'Under Renewal').length}</div>`
);
content = content.replace(
  /<div className="stat-value text-johar-danger">1<\/div>/,
  `<div className="stat-value text-johar-danger">{labs.filter(l => l.status === 'موقوف' || l.status === 'Suspended').length}</div>`
);

// Add Form Modal
const modalJSX = `
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('add_lab_btn', 'إضافة مختبر جديد')}>
        <form onSubmit={handleAddLab} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">{t('lab_name', 'اسم المختبر')}</label>
            <input type="text" className="input" required value={newLab.name} onChange={e => setNewLab({...newLab, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1">{t('location', 'الموقع')}</label>
            <input type="text" className="input" required value={newLab.location} onChange={e => setNewLab({...newLab, location: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1">{t('accreditation_number', 'رقم الاعتماد')}</label>
            <input type="text" className="input" required value={newLab.acc} onChange={e => setNewLab({...newLab, acc: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1">{t('expiry_date', 'تاريخ الانتهاء')}</label>
            <input type="date" className="input" required value={newLab.expiry} onChange={e => setNewLab({...newLab, expiry: e.target.value})} />
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" className="btn-primary">{t('save', 'حفظ')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
`;

content = content.replace(/<\/div>\s*<Modal isOpen=\{!!selectedLab\}/, `</div>
${modalJSX}
      <Modal isOpen={!!selectedLab}`);

fs.writeFileSync(file, content, "utf-8");
