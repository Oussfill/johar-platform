const fs = require("fs");
const file = "src/components/LabsPage.tsx";
let content = fs.readFileSync(file, "utf-8");

// State for Request modal
const stateRegex = /const \[labs, setLabs\] = useState<any\[\]>\(\[\]\);/;
content = content.replace(stateRegex, `const [labs, setLabs] = useState<any[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ asset_code: '', client: '', test_type: 'PURITY' });
  const [requestLab, setRequestLab] = useState<any>(null);`);

// handleSendRequest function
const fetchRegex = /const handleAddLab = async \(e: React.FormEvent\) => \{/;
content = content.replace(fetchRegex, `
  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestLab) return;
    const { error } = await supabase.from('lab_tests').insert([{
      asset_code: newRequest.asset_code,
      client: newRequest.client,
      test_type: newRequest.test_type,
      status: 'REQUESTED',
      passed: false
    }]);
    
    if (error) {
      alert('Error: ' + error.message);
    } else {
      setIsRequestModalOpen(false);
      setNewRequest({ asset_code: '', client: '', test_type: 'PURITY' });
      alert('تم إرسال الطلب بنجاح');
    }
  };

  const handleAddLab = async (e: React.FormEvent) => {`);

// Add onClick to send request button
content = content.replace(
  /<button className="btn-primary flex-1" disabled=\{lab.status !== t\('accredited', '.*?'\)\}>\{t\('send_request', '.*?'\)\}<\/button>/g,
  `<button className="btn-primary flex-1" disabled={lab.status !== t('accredited', 'معتمد') && lab.status !== 'معتمد'} onClick={() => { setRequestLab(lab); setIsRequestModalOpen(true); }}>{t('send_request', 'إرسال طلب')}</button>`
);

// Add Request Form Modal
const modalJSX = `
      <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title={t('send_request', 'إرسال طلب فحص')}>
        <form onSubmit={handleSendRequest} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">{t('asset_code', 'كود الأصل')}</label>
            <input type="text" className="input" required value={newRequest.asset_code} onChange={e => setNewRequest({...newRequest, asset_code: e.target.value})} placeholder="مثال: AST-1234" />
          </div>
          <div>
            <label className="block text-sm mb-1">{t('client', 'العميل')}</label>
            <input type="text" className="input" required value={newRequest.client} onChange={e => setNewRequest({...newRequest, client: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1">{t('test_type', 'نوع الفحص')}</label>
            <select className="input" value={newRequest.test_type} onChange={e => setNewRequest({...newRequest, test_type: e.target.value})}>
              <option value="PURITY">{t('purity_test', 'فحص نقاء (Purity)')}</option>
              <option value="JOHAR_ID">{t('johar_id_test', 'فحص Johar ID')}</option>
            </select>
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" className="btn-primary">{t('send', 'إرسال')}</button>
          </div>
        </form>
      </Modal>
`;

content = content.replace(/<\/form>\n      <\/Modal>\n/, `</form>\n      </Modal>\n${modalJSX}`);

fs.writeFileSync(file, content, "utf-8");
