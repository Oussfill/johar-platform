import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { supabase } from '../supabase';

export default function CompliancePage() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState(t('checks_tab', 'Ø§Ù„ÙØ­ÙˆØµØ§Øª'));
  const [checks, setChecks] = useState<any[]>([]);

  const [rules, setRules] = useState([
    { id: 1, name: t('block_sanctioned', 'Ø­Ø¸Ø± Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø§Øª Ù…Ø¹ Ø¯ÙˆÙ„ Ø®Ø§Ø¶Ø¹Ø© Ù„Ø¹Ù‚ÙˆØ¨Ø§Øª'), active: true, violations: 0 },
    { id: 2, name: t('freeze_banned', 'ØªØ¬Ù…ÙŠØ¯ Ø§Ù„Ø£ØµÙˆÙ„ Ù„Ù„ÙƒÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø¯Ø±Ø¬Ø© ÙÙŠ Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø­Ø¸Ø±'), active: true, violations: 2 },
    { id: 3, name: t('require_doc_100k', 'Ø·Ù„Ø¨ Ù…Ø³ØªÙ†Ø¯ Ø¥Ø¶Ø§ÙÙŠ Ù„Ù„Ù…Ø¨Ø§Ù„Øº ÙÙˆÙ‚ $100K'), active: false, violations: 15 },
  ]);

  const [reports] = useState([
    { id: 'REP-1', title: t('str_q3', 'ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø§Ø´ØªØ¨Ø§Ù‡ (STR) Q3 2026'), date: '2026-09-01' },
    { id: 'REP-2', title: t('compliance_aug', 'ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø§Ù…ØªØ«Ø§Ù„ Ø§Ù„Ø´Ù‡Ø±ÙŠ - Ø£ØºØ³Ø·Ø³ 2026'), date: '2026-08-31' },
  ]);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<any>(null);

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newCheck, setNewCheck] = useState({ entity: '', entityType: t('company', 'Ø´Ø±ÙƒØ©'), checkType: 'AML', notes: '' });

  useEffect(() => {
    fetchChecks();
  }, []);

  
  const handleDelete = async (id: any) => {
    const { error } = await supabase.from('compliance_cases').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchChecks();
  };

  const handleUpdateStatus = async (id: any, newStatus: string) => {
    const { error } = await supabase.from('compliance_cases').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchChecks();
  };

  const fetchChecks = async () => {
    const { data } = await supabase.from('compliance_cases').select('*');
    if (data) setChecks(data);
  };

  const handleSaveCheck = async () => {
    const chk = {
      entity_id: newCheck.entity,
      entity_type: newCheck.entityType,
      risk_level: t('low_risk', 'Ù…Ù†Ø®ÙØ¶'),
      status: t('open', 'Ù…ÙØªÙˆØ­')
    };
    const { data, error } = await supabase.from('compliance_cases').insert([chk]).select();
    if (error) { alert("Error: " + error.message); return; }
    if (data) {
      setNewModalOpen(false);
      setNewCheck({ entity: '', entityType: t('company', 'Ø´Ø±ÙƒØ©'), checkType: 'AML', notes: '' });
      fetchChecks();
    }
  };

  const toggleRule = (id: number) => {
    setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const handleAction = (action: string) => {
    if (action === 'Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù‚Ø¶ÙŠØ©') {
      setChecks(checks.map(c => c.id === selectedCheck.id ? { ...c, status: t('closed', 'Ù…ØºÙ„Ù‚') } : c));
    } else {
      alert(t('action_executed', 'ØªÙ… ØªÙ†ÙÙŠØ°: ') + action);
    }
    setViewModalOpen(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-johar-gold mb-6">{t('compliance_aml_title', 'Ø§Ù„Ø§Ù…ØªØ«Ø§Ù„ ÙˆÙ…ÙƒØ§ÙØ­Ø© ØºØ³Ù„ Ø§Ù„Ø£Ù…ÙˆØ§Ù„')}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="stat-label">{t('open_cases', 'Ù‚Ø¶Ø§ÙŠØ§ Ù…ÙØªÙˆØ­Ø©')}</div>
          <div className="stat-value">{checks.filter(c => c.status === t('open', 'Ù…ÙØªÙˆØ­')).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('high_risk_alerts', 'ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø¹Ø§Ù„ÙŠØ© Ø§Ù„Ø®Ø·ÙˆØ±Ø©')}</div>
          <div className="stat-value text-johar-danger">{checks.filter(c => c.risk === t('high_risk', 'Ø¹Ø§Ù„ÙŠ')).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('active_rules', 'Ù‚ÙˆØ§Ø¹Ø¯ ÙØ¹Ø§Ù„Ø©')}</div>
          <div className="stat-value">{rules.filter(r => r.active).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('available_reports', 'ØªÙ‚Ø§Ø±ÙŠØ± Ù…ØªØ§Ø­Ø©')}</div>
          <div className="stat-value">{reports.length}</div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-johar-gray-dark mb-6">
        {[t('checks_tab', 'Ø§Ù„ÙØ­ÙˆØµØ§Øª'), t('rules_tab', 'Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø§Ù…ØªØ«Ø§Ù„'), t('reports_tab', 'ØªÙ‚Ø§Ø±ÙŠØ±')].map(tab => (
          <button 
            key={tab}
            className={`pb-2 px-4 ${activeTab === tab ? 'border-b-2 border-johar-gold text-johar-gold' : 'text-johar-gray-light hover:text-white'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === t('checks_tab', 'Ø§Ù„ÙØ­ÙˆØµØ§Øª') && (
        <>
          <div className="flex justify-end mb-4">
            <button className="btn-primary" onClick={() => setNewModalOpen(true)}>{t('new_check', '+ ÙØ­Øµ Ø¬Ø¯ÙŠØ¯')}</button>
          </div>
          <div className="card overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>{t('id', 'Ø§Ù„Ø±Ù‚Ù…')}</th>
                  <th>{t('entity', 'Ø§Ù„ÙƒÙŠØ§Ù†')}</th>
                  <th>{t('type', 'Ø§Ù„Ù†ÙˆØ¹')}</th>
                  <th>{t('check_type', 'Ù†ÙˆØ¹ Ø§Ù„ÙØ­Øµ')}</th>
                  <th>{t('risk_level', 'Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø®Ø·Ø±')}</th>
                  <th>{t('status', 'Ø§Ù„Ø­Ø§Ù„Ø©')}</th>
                  <th>{t('actions', 'Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª')}</th>
                </tr>
              </thead>
              <tbody>
                {checks.map(check => (
                  <tr key={check.id}>
                    <td>{check.id}</td>
                    <td>{check.entity}</td>
                    <td>{check.entityType}</td>
                    <td>{check.checkType}</td>
                    <td><span className={`badge ${check.risk === t('high_risk', 'Ø¹Ø§Ù„ÙŠ') ? 'badge-danger' : check.risk === t('medium_risk', 'Ù…ØªÙˆØ³Ø·') ? 'badge-warning' : 'badge-success'}`}>{check.risk}</span></td>
                    <td>{check.status}</td>
                    <td><button className="btn-secondary text-sm px-2 py-1" onClick={() => { setSelectedCheck(check); setViewModalOpen(true); }}>{t('take_action', 'Ø¥Ø¬Ø±Ø§Ø¡')}</button>
    <button className="btn-danger ml-2" onClick={() => handleDelete(check.id)}>{t('delete', 'Ø­Ø°Ù')}</button>
    <button className="btn-primary ml-2" onClick={() => {
      const s = prompt(t('enter_status', 'Ø£Ø¯Ø®Ù„ Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©'));
      if(s) handleUpdateStatus(check.id, s);
    }}>{t('update_status', 'ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø­Ø§Ù„Ø©')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === t('rules_tab', 'Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø§Ù…ØªØ«Ø§Ù„') && (
        <div className="flex flex-col gap-4">
          {rules.map(rule => (
            <div key={rule.id} className="card flex justify-between items-center">
              <div>
                <h4 className="font-bold text-white mb-1">{rule.name}</h4>
                <p className="text-sm text-johar-gray-light">{t('violations', 'Ø§Ù„Ù…Ø®Ø§Ù„ÙØ§Øª:')} {rule.violations}</p>
              </div>
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-bold ${rule.active ? 'bg-johar-success text-black' : 'bg-johar-gray-dark text-johar-gray-light'}`}
                onClick={() => toggleRule(rule.id)}
              >
                {rule.active ? t('enabled', 'Ù…ÙØ¹Ù„') : t('disabled', 'Ù…Ø¹Ø·Ù„')}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === t('reports_tab', 'ØªÙ‚Ø§Ø±ÙŠØ±') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reports.map(rep => (
            <div key={rep.id} className="card">
              <h4 className="font-bold text-johar-gold mb-2">{rep.title}</h4>
              <p className="text-sm text-johar-gray-light mb-4">{t('date', 'Ø§Ù„ØªØ§Ø±ÙŠØ®:')} {rep.date}</p>
              <button className="btn-secondary w-full" onClick={() => alert(t('downloading', 'Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...'))}>{t('download_pdf', 'ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØªÙ‚Ø±ÙŠØ± (PDF)')}</button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title={t('check_details', 'ØªÙØ§ØµÙŠÙ„ Ø§Ù„ÙØ­Øµ')}>
        {selectedCheck && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div><span className="text-johar-gray-light">{t('entity', 'Ø§Ù„ÙƒÙŠØ§Ù†')}:</span> <div>{selectedCheck.entity}</div></div>
              <div><span className="text-johar-gray-light">{t('risk_level', 'Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø®Ø·Ø±')}:</span> <div className={selectedCheck.risk === t('high_risk', 'Ø¹Ø§Ù„ÙŠ') ? 'text-johar-danger font-bold' : ''}>{selectedCheck.risk}</div></div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">{t('flags', 'Ø§Ù„Ø¹Ù„Ø§Ù…Ø§Øª (Flags):')}</h4>
              <ul className="list-disc list-inside text-sm text-johar-gray-light">
                {selectedCheck.flags && selectedCheck.flags.length > 0 ? selectedCheck.flags.map((f: string, i: number) => <li key={i}>{f}</li>) : <li>{t('no_flags', 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¹Ù„Ø§Ù…Ø§Øª')}</li>}
              </ul>
            </div>
            <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-johar-gray-dark">
              <button className="btn-danger" onClick={() => handleUpdateStatus(selectedCheck.id, t('escalated', 'Ù…ØµØ¹Ø¯'))}>{t('escalate_case', 'ØªØµØ¹ÙŠØ¯ Ø§Ù„Ø­Ø§Ù„Ø©')}</button>
              <button className="btn-secondary" onClick={() => handleUpdateStatus(selectedCheck.id, t('info_requested', 'Ù…Ø·Ù„ÙˆØ¨ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª'))}>{t('request_info', 'Ø·Ù„Ø¨ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª')}</button>
              <button className="btn-primary" onClick={() => handleUpdateStatus(selectedCheck.id, t('closed', 'Ù…ØºÙ„Ù‚'))}>{t('close_case', 'Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù‚Ø¶ÙŠØ©')}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={newModalOpen} onClose={() => setNewModalOpen(false)} title={t('new_check_title', 'ÙØ­Øµ Ø¬Ø¯ÙŠØ¯')}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-johar-gray-light mb-1">{t('entity_name', 'Ø§Ø³Ù… Ø§Ù„ÙƒÙŠØ§Ù†')}</label>
            <input type="text" className="input w-full" value={newCheck.entity} onChange={(e) => setNewCheck({...newCheck, entity: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-johar-gray-light mb-1">{t('entity_type', 'Ù†ÙˆØ¹ Ø§Ù„ÙƒÙŠØ§Ù†')}</label>
            <select className="input w-full" value={newCheck.entityType} onChange={(e) => setNewCheck({...newCheck, entityType: e.target.value})}>
              <option value={t('company', 'Ø´Ø±ÙƒØ©')}>{t('company', 'Ø´Ø±ÙƒØ©')}</option>
              <option value={t('individual', 'ÙØ±Ø¯')}>{t('individual', 'ÙØ±Ø¯')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-johar-gray-light mb-1">{t('check_type', 'Ù†ÙˆØ¹ Ø§Ù„ÙØ­Øµ')}</label>
            <select className="input w-full" value={newCheck.checkType} onChange={(e) => setNewCheck({...newCheck, checkType: e.target.value})}>
              <option value="AML">AML ({t('aml_desc', 'ØºØ³Ù„ Ø§Ù„Ø£Ù…ÙˆØ§Ù„')})</option>
              <option value="Sanctions">Sanctions ({t('sanctions_desc', 'Ø§Ù„Ø¹Ù‚ÙˆØ¨Ø§Øª')})</option>
              <option value="PEP">PEP ({t('pep_desc', 'Ø´Ø®ØµÙŠØ§Øª Ø³ÙŠØ§Ø³ÙŠØ©')})</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-johar-gray-light mb-1">{t('notes', 'Ù…Ù„Ø§Ø­Ø¸Ø§Øª')}</label>
            <textarea className="input w-full" value={newCheck.notes} onChange={(e) => setNewCheck({...newCheck, notes: e.target.value})}></textarea>
          </div>
          <div className="flex justify-end mt-4">
            <button className="btn-primary" onClick={handleSaveCheck}>{t('save_check', 'Ø­ÙØ¸ Ø§Ù„ÙØ­Øµ')}</button>
          </div>
        </div>
      </Modal>

    </div>
  );
}




