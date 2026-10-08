import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { supabase } from '../supabase';

export default function ContractsPage() {
  const { t } = useTranslation();
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [newType, setNewType] = useState(t('contracts_type_asset_sale', 'بيع أصل'));
  const [newParties, setNewParties] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newTerms, setNewTerms] = useState('');

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    const { data } = await supabase.from('contracts').select('*');
    if (data) setContracts(data);
  };

  
  const handleDelete = async (id: any) => {
    const { error } = await supabase.from('contracts').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchContracts();
  };

  const handleUpdateStatus = async (id: any, newStatus: string) => {
    const { error } = await supabase.from('contracts').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchContracts();
  };

  const handleCreate = async () => {
    const { data, error } = await supabase.from('contracts').insert([{ contract_type: newType, party_a: newParties, status: t('contracts_status_active', 'نشط') }]).select();
    if (error) { alert("Error: " + error.message); return; }
    if (data) {
      setIsNewModalOpen(false);
      fetchContracts();
    }
  };

  return (
    <div dir="rtl" className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold johar-gold">{t('contracts_title', 'العقود القانونية')}</h1>
        <button className="btn-primary" onClick={() => setIsNewModalOpen(true)}>{t('contracts_new_contract_btn', '+ عقد جديد')}</button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-label">{t('contracts_total', 'الكلي')}</div><div className="stat-value">1,240</div></div>
        <div className="stat-card"><div className="stat-label">{t('contracts_active', 'نشط')}</div><div className="stat-value">980</div></div>
        <div className="stat-card"><div className="stat-label">{t('contracts_expired', 'منتهي')}</div><div className="stat-value">210</div></div>
        <div className="stat-card"><div className="stat-label">{t('contracts_under_review', 'قيد المراجعة')}</div><div className="stat-value">50</div></div>
      </div>

      <table className="table w-full mb-4">
        <thead>
          <tr>
            <th>{t('contracts_id', 'رقم العقد')}</th><th>{t('contracts_parties', 'الأطراف')}</th><th>{t('contracts_type', 'النوع')}</th><th>{t('contracts_sign_date', 'تاريخ التوقيع')}</th><th>{t('contracts_end_date', 'تاريخ الانتهاء')}</th><th>{t('contracts_status', 'الحالة')}</th><th>{t('contracts_actions', 'إجراءات')}</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((cnt) => (
            <tr key={cnt.id}>
              <td>{cnt.id}</td><td>{cnt.party_a || cnt.parties}</td><td>{cnt.contract_type || cnt.type}</td><td>{cnt.created_at ? new Date(cnt.created_at).toLocaleDateString() : cnt.signDate}</td><td>{cnt.endDate || '2027-12-31'}</td>
              <td><span className={`badge ${cnt.status === t('contracts_status_active', 'نشط') || cnt.status === 'SIGNED' ? 'badge-success' : cnt.status === t('contracts_status_expired', 'منتهي') ? 'badge-danger' : 'badge-warning'}`}>{cnt.status}</span></td>
              <td><button className="btn-secondary text-sm" onClick={() => { setSelectedContract(cnt); setIsDetailModalOpen(true); }}>{t('contracts_view', 'عرض')}</button>
    <button className="btn-danger ml-2" onClick={() => handleDelete(cnt.id)}>{t('delete', 'حذف')}</button>
    <button className="btn-primary ml-2" onClick={() => {
      const s = prompt(t('enter_status', 'أدخل الحالة الجديدة'));
      if(s) handleUpdateStatus(cnt.id, s);
    }}>{t('update_status', 'تحديث الحالة')}</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={t('contracts_viewer_title', 'عارض العقد')}>
        {selectedContract && (
          <div className="space-y-4">
            <div className="border p-4 h-64 overflow-y-auto text-justify">
              <h2 className="text-center font-bold mb-4">{selectedContract.contract_type || selectedContract.type}</h2>
              <p>{t('contracts_id_label', 'رقم العقد:')} {selectedContract.id}</p>
              <p>{t('contracts_between_label', 'بين كل من:')} {selectedContract.party_a || selectedContract.parties}</p>
              <p className="mt-4 text-gray-600">{selectedContract.terms || t('contracts_clause_1', 'بند 1: ... (نص العقد)')}</p>
            </div>
            <div className="bg-gray-100 p-2 rounded">
              <h3 className="font-bold">{t('contracts_digital_sign_status', 'حالة التوقيع الرقمي')}</h3>
              <p>{t('contracts_first_party_signed', 'الطرف الأول: ✔️ موقع')}</p>
              <p>{t('contracts_second_party_pending', 'الطرف الثاني: ⏳ قيد الانتظار')}</p>
            </div>
            <div className="flex space-x-2 space-x-reverse mt-4">
              <button className="btn-primary" onClick={() => alert(t('contracts_downloading', 'جاري التحميل'))}>{t('contracts_download_pdf', 'تحميل PDF')}</button>
              <button className="btn-secondary" onClick={() => alert(t('contracts_printing', 'جاري الطباعة'))}>{t('contracts_print', 'طباعة')}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title={t('contracts_new_contract_modal_title', 'عقد جديد')}>
        <div className="space-y-4">
          <select className="input w-full" value={newType} onChange={e => setNewType(e.target.value)}><option value={t('contracts_type_asset_sale', 'بيع أصل')}>{t('contracts_type_asset_sale', 'بيع أصل')}</option><option value={t('contracts_type_transfer_ownership', 'نقل ملكية')}>{t('contracts_type_transfer_ownership', 'نقل ملكية')}</option></select>
          <input className="input w-full" placeholder={t('contracts_parties_placeholder', 'الأطراف (مفصولين بفاصلة)')} value={newParties} onChange={e => setNewParties(e.target.value)} />
          <div className="flex space-x-2 space-x-reverse">
            <input className="input w-full" type="date" placeholder={t('contracts_start_date_placeholder', 'تاريخ البداية')} value={newStartDate} onChange={e => setNewStartDate(e.target.value)} />
            <input className="input w-full" type="date" placeholder={t('contracts_end_date_placeholder', 'تاريخ النهاية')} value={newEndDate} onChange={e => setNewEndDate(e.target.value)} />
          </div>
          <textarea className="input w-full h-32" placeholder={t('contracts_terms_placeholder', 'شروط العقد...')} value={newTerms} onChange={e => setNewTerms(e.target.value)}></textarea>
          <button className="btn-primary w-full" onClick={handleCreate}>{t('contracts_save_draft', 'حفظ المسودة')}</button>
        </div>
      </Modal>
    </div>
  );
}
