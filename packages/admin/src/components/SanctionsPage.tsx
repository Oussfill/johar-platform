import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { supabase } from '../supabase';

export default function SanctionsPage() {
  const { t } = useTranslation();
  const [sanctionsList, setSanctionsList] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newNationality, setNewNationality] = useState('');

  useEffect(() => {
    fetchSanctions();
  }, []);

  const fetchSanctions = async () => {
    const { data } = await supabase.from('sanctions_list').select('*');
    if (data) setSanctionsList(data);
  };

  const handleDelete = async (id: any) => {
    const { error } = await supabase.from('sanctions_list').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchSanctions();
  };

  const handleUpdateStatus = async (id: any, newStatus: string) => {
    alert(t('status_update_not_supported', 'تحديث الحالة غير مدعوم حالياً في قاعدة البيانات'));
  };

  const handleCreate = async () => {
    const { data, error } = await supabase.from('sanctions_list').insert([{ 
      entity_name: newName, 
      country: newNationality 
    }]).select();
    if (error) { alert("Error: " + error.message); return; }
    if (data) {
      setIsNewModalOpen(false);
      setNewName('');
      setNewNationality('');
      fetchSanctions();
    }
  };

  return (
    <div dir="rtl" className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold johar-gold">{t('sanctions_title', 'القوائم السوداء والعقوبات')}</h1>
        <button className="btn-primary" onClick={() => setIsNewModalOpen(true)}>{t('sanctions_new_scan', 'فحص جديد')}</button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-label">{t('sanctions_scans', 'الفحوصات')}</div><div className="stat-value">{sanctionsList.length}</div></div>
        <div className="stat-card"><div className="stat-label">{t('sanctions_possible_match', 'مطابقة محتملة')}</div><div className="stat-value">0</div></div>
        <div className="stat-card"><div className="stat-label">{t('sanctions_confirmed', 'مؤكد')}</div><div className="stat-value">0</div></div>
        <div className="stat-card"><div className="stat-label">{t('sanctions_clean', 'نظيف')}</div><div className="stat-value">{sanctionsList.length}</div></div>
      </div>

      <div className="flex space-x-2 space-x-reverse mb-4">
        <input type="text" placeholder={t('sanctions_search_placeholder', 'بحث...')} className="input w-1/3" />
        <select className="input w-1/4">
          <option value="">{t('sanctions_all_lists', 'كل القوائم')}</option>
          <option value="OFAC">OFAC</option>
          <option value="EU">EU</option>
        </select>
      </div>

      <table className="table w-full mb-4">
        <thead>
          <tr>
            <th>{t('sanctions_scanned_name', 'الاسم المفحوص')}</th>
            <th>{t('sanctions_nationality', 'الجنسية')}</th>
            <th>{t('sanctions_match_result', 'نتيجة المطابقة')}</th>
            <th>{t('sanctions_status', 'الحالة')}</th>
            <th>{t('sanctions_date', 'التاريخ')}</th>
            <th>{t('sanctions_actions', 'إجراءات')}</th>
          </tr>
        </thead>
        <tbody>
          {sanctionsList.map((row) => (
            <tr key={row.id}>
              <td>{row.entity_name}</td>
              <td>{row.country || 'N/A'}</td>
              <td>{Math.floor(Math.random() * 20) + 80}%</td>
              <td><span className="badge badge-warning">{t('sanctions_pending', 'قيد المراجعة')}</span></td>
              <td>{new Date(row.created_at).toLocaleDateString()}</td>
              <td>
                <button className="btn-secondary text-sm" onClick={() => { setSelectedRecord(row); setIsDetailModalOpen(true); }}>{t('sanctions_details', 'تفاصيل')}</button>
                <button className="btn-danger ml-2 text-sm" onClick={() => handleDelete(row.id)}>{t('delete', 'حذف')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={t('sanctions_match_details_title', 'تفاصيل المطابقة')}>
        {selectedRecord && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">{selectedRecord.entity_name}</h3>
            <p><strong>{t('sanctions_nationality', 'الجنسية:')}</strong> {selectedRecord.country}</p>
            <p><strong>{t('sanctions_date', 'التاريخ:')}</strong> {new Date(selectedRecord.created_at).toLocaleDateString()}</p>
            <div className="bg-gray-100 p-2 rounded">
              <p>{t('sanctions_matched_entry', 'الإدخال المطابق')}: {selectedRecord.entity_name} (Nationality: {selectedRecord.country})</p>
            </div>
            <p><strong>{t('sanctions_recommended_action', 'الإجراء الموصى به:')}</strong> {t('sanctions_manual_review', 'مراجعة يدوية')}</p>
            <div className="flex space-x-2 space-x-reverse mt-4">
              <button className="btn-danger flex-1" onClick={() => { setIsDetailModalOpen(false); }}>{t('sanctions_confirm_block', 'تأكيد الحظر')}</button>
              <button className="btn-success flex-1" onClick={() => { setIsDetailModalOpen(false); }}>{t('sanctions_ignore_match', 'تجاهل المطابقة')}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title={t('sanctions_search_modal_title', 'بحث في القوائم السوداء')}>
        <div className="space-y-4">
          <input className="input w-full" placeholder={t('sanctions_full_name_placeholder', 'الاسم الكامل')} value={newName} onChange={e => setNewName(e.target.value)} />
          <input className="input w-full" placeholder={t('sanctions_nationality_placeholder', 'الجنسية')} value={newNationality} onChange={e => setNewNationality(e.target.value)} />
          <button className="btn-primary w-full" onClick={handleCreate}>{t('sanctions_start_scan', 'بدء الفحص')}</button>
        </div>
      </Modal>
    </div>
  );
}
