import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { supabase } from '../supabase';

export default function NotaryPage() {
  const { t } = useTranslation();
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewOpen, setIsNewOpen] = useState(false);
  
  const [mockNotary, setMockNotary] = useState<any[]>([]);
  const [newType, setNewType] = useState('');
  const [newParties, setNewParties] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('notary_records').select('*');
    if (data) setMockNotary(data);
  };

  
  const handleDelete = async (id: any) => {
    const { error } = await supabase.from('notary_records').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleUpdateStatus = async (id: any, newStatus: string) => {
    const { error } = await supabase.from('notary_records').update({ stamp_hash: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleCreate = async () => {
    const { data, error } = await supabase.from('notary_records').insert([{ document_type: newType, parties: newParties, stamp_hash: t('notary_pending', 'قيد التوثيق') }]).select();
    if (error) { alert("Error: " + error.message); return; }
    if (data) {
      setIsNewOpen(false);
      setNewType('');
      setNewParties('');
      fetchData();
    }
  };

  return (
    <div dir="rtl" className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold johar-gold">{t('notary_title', 'كاتب العدل الرقمي')}</h1>
        <button className="btn-primary" onClick={() => setIsNewOpen(true)}>{t('notary_new_request_btn', '+ طلب توثيق')}</button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-label">{t('notary_notarized_docs', 'الوثائق الموثقة')}</div><div className="stat-value">5,420</div></div>
        <div className="stat-card"><div className="stat-label">{t('notary_pending', 'قيد التوثيق')}</div><div className="stat-value">145</div></div>
        <div className="stat-card"><div className="stat-label">{t('notary_rejected', 'مرفوض')}</div><div className="stat-value">32</div></div>
        <div className="stat-card"><div className="stat-label">{t('notary_total_fees', 'إجمالي الرسوم')}</div><div className="stat-value">120,000 $</div></div>
      </div>

      <table className="table w-full mb-4">
        <thead>
          <tr>
            <th>{t('notary_id', 'رقم التوثيق')}</th><th>{t('notary_doc_type', 'نوع الوثيقة')}</th><th>{t('notary_parties', 'الأطراف')}</th><th>{t('notary_req_date', 'تاريخ الطلب')}</th><th>{t('notary_status', 'الحالة')}</th><th>{t('notary_actions', 'إجراءات')}</th>
          </tr>
        </thead>
        <tbody>
          {mockNotary.map((doc) => (
            <tr key={doc.id}>
              <td>{doc.id}</td><td>{doc.document_type || doc.type}</td><td>{doc.parties}</td><td>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : doc.reqDate}</td>
              <td><span className={`badge ${(doc.stamp_hash || doc.status) === t('notary_status_notarized', 'موثق') ? 'badge-success' : (doc.stamp_hash || doc.status) === t('notary_status_rejected', 'مرفوض') ? 'badge-danger' : 'badge-warning'}`}>{doc.stamp_hash || doc.status}</span></td>
              <td><button className="btn-secondary text-sm" onClick={() => { setSelectedDoc(doc); setIsModalOpen(true); }}>{t('notary_review_btn', 'مراجعة')}</button>
    <button className="btn-danger ml-2" onClick={() => handleDelete(doc.id)}>{t('delete', 'حذف')}</button>
    <button className="btn-primary ml-2" onClick={() => {
      const s = prompt(t('enter_status', 'أدخل الحالة الجديدة'));
      if(s) handleUpdateStatus(doc.id, s);
    }}>{t('update_status', 'تحديث الحالة')}</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('notary_review_modal_title', 'مراجعة كاتب العدل')}>
        {selectedDoc && (
          <div className="space-y-4">
            <div className="h-48 bg-gray-200 flex items-center justify-center rounded">[{t('notary_doc_preview', 'معاينة الوثيقة')}]</div>
            <div className="bg-gray-100 p-2 rounded">
              <p>{t('notary_parties_verification_status', 'حالة التحقق من الأطراف: ✔️ مكتمل')}</p>
              <p>{t('notary_digital_sign_req', 'طلب التوقيع الرقمي: مُرسل')}</p>
            </div>
            <div className="flex space-x-2 space-x-reverse mt-4">
              <button className="btn-success flex-1" onClick={() => { handleUpdateStatus(selectedDoc.id, t('notary_status_notarized', 'موثق')); setIsModalOpen(false); }}>{t('notary_approve_btn', 'موافقة وتوثيق')}</button>
              <button className="btn-danger flex-1" onClick={() => { handleUpdateStatus(selectedDoc.id, t('notary_status_rejected', 'مرفوض')); setIsModalOpen(false); }}>{t('notary_reject_btn', 'رفض التوثيق')}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title={t('notary_new_req_modal_title', 'طلب توثيق جديد')}>
        <div className="space-y-4">
          <input className="input w-full" placeholder={t('notary_doc_type_placeholder', 'نوع الوثيقة')} value={newType} onChange={(e) => setNewType(e.target.value)} />
          <input className="input w-full" placeholder={t('notary_parties_placeholder', 'الأطراف')} value={newParties} onChange={(e) => setNewParties(e.target.value)} />
          <button className="btn-primary w-full" onClick={handleCreate}>{t('notary_submit_req_btn', 'تقديم الطلب')}</button>
        </div>
      </Modal>
    </div>
  );
}
