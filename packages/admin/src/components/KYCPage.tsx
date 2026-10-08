import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import Modal from './Modal';

export default function KYCPage() {
  const { t } = useTranslation();

  const [kycRequests, setKycRequests] = useState<any[]>([]);

  const fetchData = async () => {
    const { data, error } = await supabase.from('kyc_requests').select('*');
    if (error) {
      alert("Error: " + error.message);
    } else if (data) {
      setKycRequests(data);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [filter, setFilter] = useState(t('all', 'الكل'));
  
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newReq, setNewReq] = useState({ name: '', type: t('individual', 'فرد'), country: '' });

  const filteredReqs = kycRequests.filter(req => filter === t('all', 'الكل') || req.status === filter);

  const handleAction = async (id: string, newStatus: string) => {
    if (newStatus === t('rejected', 'مرفوض')) {
      const reason = prompt(t('rejection_reason', 'سبب الرفض:'));
      if (!reason) return;
    }
    const { error } = await supabase.from('kyc_requests').update({ status: newStatus }).eq('id', id);
    if (error) {
      alert("Error: " + error.message);
    } else {
      setViewModalOpen(false);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('kyc_requests').delete().eq('id', id);
    if (error) {
      alert("Error: " + error.message);
    } else {
      fetchData();
    }
  };

  const handleSaveNew = async () => {
    const req = {
      name: newReq.name,
      type: newReq.type,
      level: 'L1',
      status: t('under_review', 'قيد المراجعة'),
      country: newReq.country,
      submitted: new Date().toISOString().split('T')[0],
      risk: t('low_risk', 'منخفض'),
      docs: 0
    };
    const { error } = await supabase.from('kyc_requests').insert([req]);
    if (error) {
      alert("Error: " + error.message);
    } else {
      setNewModalOpen(false);
      setNewReq({ name: '', type: t('individual', 'فرد'), country: '' });
      fetchData();
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-johar-gold mb-6">{t('kyc_management', 'إدارة اعرف عميلك (KYC)')}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="stat-label">{t('total_requests', 'إجمالي الطلبات')}</div>
          <div className="stat-value">{kycRequests.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('under_review', 'قيد المراجعة')}</div>
          <div className="stat-value">{kycRequests.filter(r => r.status === t('under_review', 'قيد المراجعة')).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('completed', 'مكتمل')}</div>
          <div className="stat-value">{kycRequests.filter(r => r.status === t('completed', 'مكتمل')).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('rejected', 'مرفوض')}</div>
          <div className="stat-value">{kycRequests.filter(r => r.status === t('rejected', 'مرفوض')).length}</div>
        </div>
      </div>

      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          {[t('all', 'الكل'), t('under_review', 'قيد المراجعة'), t('completed', 'مكتمل'), t('rejected', 'مرفوض')].map(f => (
            <button key={f} className={`btn-secondary ${filter === f ? 'border-johar-gold text-johar-gold' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => setNewModalOpen(true)}>{t('new_verification_request', '+ طلب تحقق جديد')}</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>{t('id', 'ID')}</th>
              <th>{t('name', 'الاسم')}</th>
              <th>{t('type', 'النوع')}</th>
              <th>{t('level', 'المستوى')}</th>
              <th>{t('country', 'البلد')}</th>
              <th>{t('documents', 'المستندات')}</th>
              <th>{t('status', 'الحالة')}</th>
              <th>{t('submission_date', 'تاريخ التقديم')}</th>
              <th>{t('actions', 'إجراءات')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredReqs.map(req => (
              <tr key={req.id}>
                <td className="font-mono text-sm">{req.id}</td>
                <td>{req.name}</td>
                <td>{req.type}</td>
                <td>{req.level}</td>
                <td>{req.country}</td>
                <td>{req.docs}</td>
                <td>
                  <span className={`badge ${req.status === t('completed', 'مكتمل') ? 'badge-success' : req.status === t('rejected', 'مرفوض') ? 'badge-danger' : req.status === t('under_review', 'قيد المراجعة') ? 'badge-warning' : 'badge-info'}`}>
                    {req.status}
                  </span>
                </td>
                <td>{req.submitted}</td>
                <td>
                  <button className="btn-secondary text-sm px-2 py-1" onClick={() => { setSelectedReq(req); setViewModalOpen(true); }}>{t('review', 'مراجعة')}</button>
                  <button className="btn-danger text-sm px-2 py-1 ml-2" onClick={() => handleDelete(req.id)}>{t('delete', 'حذف')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title={t('review_verification_request', 'مراجعة طلب تحقق')} size="lg">
        {selectedReq && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-johar-black-lighter p-4 rounded-lg">
              <div><span className="text-johar-gray-light text-sm">{t('name', 'الاسم')}:</span> <div>{selectedReq.name}</div></div>
              <div><span className="text-johar-gray-light text-sm">{t('type', 'النوع')}:</span> <div>{selectedReq.type}</div></div>
              <div><span className="text-johar-gray-light text-sm">{t('country', 'البلد')}:</span> <div>{selectedReq.country}</div></div>
              <div><span className="text-johar-gray-light text-sm">{t('submission_date', 'تاريخ التقديم')}:</span> <div>{selectedReq.submitted}</div></div>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-2">{t('documents', 'المستندات')}</h4>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-johar-gray-light"><input type="checkbox" defaultChecked className="accent-johar-gold" /> {t('national_id', 'هوية وطنية')}</label>
                <label className="flex items-center gap-2 text-johar-gray-light"><input type="checkbox" defaultChecked className="accent-johar-gold" /> {t('commercial_register', 'سجل تجاري')}</label>
                <label className="flex items-center gap-2 text-johar-gray-light"><input type="checkbox" defaultChecked className="accent-johar-gold" /> {t('bank_statement', 'كشف حساب')}</label>
                <label className="flex items-center gap-2 text-johar-gray-light"><input type="checkbox" className="accent-johar-gold" /> {t('incorporation_contract', 'عقد تأسيس')}</label>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2">{t('risk_assessment', 'تقييم المخاطر')}</h4>
              <span className={`badge ${selectedReq.risk === t('low_risk', 'منخفض') ? 'badge-success' : selectedReq.risk === t('high_risk', 'عالي') ? 'badge-danger' : 'badge-warning'}`}>
                {selectedReq.risk}
              </span>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2">{t('reviewer_notes', 'ملاحظات المراجع')}</h4>
              <textarea className="input w-full h-24" placeholder={t('add_notes_placeholder', 'أضف ملاحظات هنا...')}></textarea>
            </div>

            <div className="flex gap-4 justify-end border-t border-johar-gray-dark pt-4">
              <button className="btn-danger" onClick={() => handleAction(selectedReq.id, t('rejected', 'مرفوض'))}>{t('reject_request', 'رفض الطلب')}</button>
              <button className="btn-primary" onClick={() => handleAction(selectedReq.id, t('completed', 'مكتمل'))}>{t('accept_request', 'قبول الطلب')}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={newModalOpen} onClose={() => setNewModalOpen(false)} title={t('new_verification_request_title', 'طلب تحقق جديد')}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-johar-gray-light mb-1">{t('name', 'الاسم')}</label>
            <input type="text" className="input w-full" value={newReq.name} onChange={(e) => setNewReq({...newReq, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-johar-gray-light mb-1">{t('type', 'النوع')}</label>
            <select className="input w-full" value={newReq.type} onChange={(e) => setNewReq({...newReq, type: e.target.value})}>
              <option value={t('individual', 'فرد')}>{t('individual', 'فرد')}</option>
              <option value={t('company', 'شركة')}>{t('company', 'شركة')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-johar-gray-light mb-1">{t('country', 'البلد')}</label>
            <input type="text" className="input w-full" value={newReq.country} onChange={(e) => setNewReq({...newReq, country: e.target.value})} />
          </div>
          <div className="flex justify-end mt-4">
            <button className="btn-primary" onClick={handleSaveNew}>{t('save', 'حفظ')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
