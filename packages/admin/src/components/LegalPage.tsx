import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { supabase } from '../supabase';

export default function LegalPage() {
  const { t } = useTranslation();
  const [selectedVer, setSelectedVer] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewOpen, setIsNewOpen] = useState(false);

  const [mockLegal, setMockLegal] = useState<any[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [newAuthority, setNewAuthority] = useState('');
  const [newType, setNewType] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('legal_cases').select('*');
    if (data) setMockLegal(data);
  };

  
  const handleDelete = async (id: any) => {
    const { error } = await supabase.from('legal_cases').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleUpdateStatus = async (id: any, newStatus: string) => {
    const { error } = await supabase.from('legal_cases').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleCreate = async () => {
    const { data, error } = await supabase.from('legal_cases').insert([{ case_number: newSubject, description: newAuthority, status: newType || t('legal_trade_license', 'ترخيص تجاري') }]).select();
    if (error) { alert("Error: " + error.message); return; }
    if (data) {
      setIsNewOpen(false);
      setNewSubject('');
      setNewAuthority('');
      setNewType('');
      fetchData();
    }
  };

  return (
    <div dir="rtl" className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold johar-gold">{t('legal_title', 'التحقق القانوني')}</h1>
        <button className="btn-primary" onClick={() => setIsNewOpen(true)}>{t('legal_new_verification_btn', '+ تحقق جديد')}</button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-label">{t('legal_total', 'الإجمالي')}</div><div className="stat-value">8,400</div></div>
        <div className="stat-card"><div className="stat-label">{t('legal_accepted', 'مقبول')}</div><div className="stat-value">7,900</div></div>
        <div className="stat-card"><div className="stat-label">{t('legal_under_verification', 'قيد التحقق')}</div><div className="stat-value">450</div></div>
        <div className="stat-card"><div className="stat-label">{t('legal_rejected', 'مرفوض')}</div><div className="stat-value">50</div></div>
      </div>

      <table className="table w-full mb-4">
        <thead>
          <tr>
            <th>{t('legal_verification_id', 'رقم التحقق')}</th><th>{t('legal_subject', 'الموضوع')}</th><th>{t('legal_issuing_authority', 'الجهة المُصدِّرة')}</th><th>{t('legal_country', 'البلد')}</th><th>{t('legal_type', 'النوع')}</th><th>{t('legal_status', 'الحالة')}</th><th>{t('legal_actions', 'إجراءات')}</th>
          </tr>
        </thead>
        <tbody>
          {mockLegal.map((leg) => (
            <tr key={leg.id}>
              <td>{leg.id}</td><td>{leg.case_number || leg.subject}</td><td>{leg.description || leg.authority}</td><td>{leg.country || 'موريتانيا'}</td><td>{leg.type || 'ترخيص تجاري'}</td>
              <td><span className={`badge ${leg.status === t('legal_status_accepted', 'مقبول') ? 'badge-success' : leg.status === t('legal_status_rejected', 'مرفوض') ? 'badge-danger' : 'badge-warning'}`}>{leg.status}</span></td>
              <td><button className="btn-secondary text-sm" onClick={() => { setSelectedVer(leg); setIsModalOpen(true); }}>{t('legal_view_btn', 'عرض')}</button>
    <button className="btn-danger ml-2" onClick={() => handleDelete(leg.id)}>{t('delete', 'حذف')}</button>
    <button className="btn-primary ml-2" onClick={() => {
      const s = prompt(t('enter_status', 'أدخل الحالة الجديدة'));
      if(s) handleUpdateStatus(leg.id, s);
    }}>{t('update_status', 'تحديث الحالة')}</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('legal_details_modal_title', 'تفاصيل التحقق القانوني')}>
        {selectedVer && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">{selectedVer.case_number || selectedVer.subject}</h3>
            <p><strong>{t('legal_chain', 'سلسلة التحقق:')}</strong> {t('legal_chain_flow', 'مصدر الوثيقة → التوثيق المحلي → التحقق النهائي')}</p>
            <p><strong>{t('legal_issuing_authority_label', 'الجهة المُصدِّرة:')}</strong> {selectedVer.description || selectedVer.authority} ({selectedVer.country || 'موريتانيا'})</p>
            <p><strong>{t('legal_validation_result', 'نتيجة المصادقة:')}</strong> {selectedVer.status}</p>
            <p><strong>{t('legal_expiration_date', 'تاريخ الانتهاء:')}</strong> 2027-12-31</p>
            <button className="btn-secondary w-full" onClick={() => setIsModalOpen(false)}>{t('legal_close_btn', 'إغلاق')}</button>
          </div>
        )}
      </Modal>

      <Modal isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title={t('legal_new_request_modal_title', 'طلب تحقق جديد')}>
        <div className="space-y-4">
          <input className="input w-full" placeholder={t('legal_subject_placeholder', 'الموضوع')} value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
          <input className="input w-full" placeholder={t('legal_authority_placeholder', 'الجهة المصدرة')} value={newAuthority} onChange={(e) => setNewAuthority(e.target.value)} />
          <select className="input w-full" value={newType} onChange={(e) => setNewType(e.target.value)}><option>{t('legal_trade_license', 'ترخيص تجاري')}</option><option>{t('legal_ownership_record', 'سجل ملكية')}</option></select>
          <button className="btn-primary w-full" onClick={handleCreate}>{t('legal_submit_request', 'إرسال الطلب')}</button>
        </div>
      </Modal>
    </div>
  );
}
