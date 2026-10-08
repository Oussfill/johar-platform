import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

export default function LabsPage() {
  const { t } = useTranslation();
  const [selectedLab, setSelectedLab] = useState<any>(null);

  const [labs, setLabs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ asset_code: '', client: '', test_type: 'PURITY' });
  const [requestLab, setRequestLab] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLab, setNewLab] = useState({ name: '', location: '', acc: '', expiry: '' });

  const fetchProfilesAndAssets = async () => {
    const { data: pData } = await supabase.from('profiles').select('id, full_name');
    if (pData) setProfiles(pData);
    const { data: aData } = await supabase.from('assets').select('id, asset_code');
    if (aData) setAssets(aData);
  };

  const fetchLabs = async () => {
    const { data } = await supabase.from('labs').select('*');
    if (data) setLabs(data);
  };
  
  useEffect(() => {
    fetchLabs();
    fetchProfilesAndAssets();
  }, []);
  
  
  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestLab) return;
    const { error } = await supabase.from('lab_tests').insert([{
      asset_code: newRequest.asset_code,
      client: profiles.find(p => p.id === newRequest.client)?.full_name || '',
      requested_by: newRequest.client,
      test_type: newRequest.test_type,
      status: 'REQUESTED',
      passed: false,
      lab_id: requestLab.id
    }]);
    
    if (error) {
      alert('Error: ' + error.message);
    } else {
      setIsRequestModalOpen(false);
      setNewRequest({ asset_code: '', client: '', test_type: 'PURITY' });
      alert('تم إرسال الطلب بنجاح');
    }
  };

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
  };

  const renderStars = (rating: number) => {
    return (
      <span className="text-johar-gold text-sm">
        {'★'.repeat(Math.round(rating || 0)) + '☆'.repeat(5 - Math.round(rating || 0))}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 min-h-screen johar-black-lighter text-johar-gray-light" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gold-text">{t('accredited_labs', 'المختبرات المعتمدة')}</h1>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>{t('add_lab_btn', '+ إضافة مختبر')}</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card card">
          <div className="stat-label">{t('total', 'الكلي')}</div>
          <div className="stat-value">{labs.length}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('accredited', 'معتمد')}</div>
          <div className="stat-value text-johar-success">{labs.filter(l => l.status === 'معتمد' || l.status === 'Approved').length}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('under_renewal', 'قيد التجديد')}</div>
          <div className="stat-value text-johar-warning">{labs.filter(l => l.status === 'قيد التجديد' || l.status === 'Under Renewal').length}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('suspended', 'موقوف')}</div>
          <div className="stat-value text-johar-danger">{labs.filter(l => l.status === 'موقوف' || l.status === 'Suspended').length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {labs.map((lab) => (
          <div key={lab.id} className="card p-5 space-y-3">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg">{lab.name}</h3>
              <span className={`badge ${lab.status === t('accredited', 'معتمد') ? 'badge-success' : lab.status === t('suspended', 'موقوف') ? 'badge-danger' : 'badge-warning'}`}>
                {lab.status}
              </span>
            </div>
            <div className="text-sm text-johar-gray-mid flex items-center gap-1">
               📍 {lab.location}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 text-sm gap-2">
              <div><span className="text-johar-gray-dark text-xs block">{t('accreditation_number', 'رقم الاعتماد')}</span>{lab.acc}</div>
              <div><span className="text-johar-gray-dark text-xs block">{t('expiry_date', 'تاريخ الانتهاء')}</span>{lab.expiry}</div>
              <div><span className="text-johar-gray-dark text-xs block">{t('active_requests', 'الطلبات النشطة')}</span>{lab.requests}</div>
              <div><span className="text-johar-gray-dark text-xs block">{t('rating', 'التقييم')}</span>{renderStars(lab.rating)}</div>
            </div>
            <div className="flex space-x-2 space-x-reverse pt-2 border-t border-johar-gray-dark mt-2">
              <button className="btn-secondary flex-1" onClick={() => setSelectedLab(lab)}>{t('view_details', 'عرض التفاصيل')}</button>
              <button className="btn-primary flex-1" disabled={lab.status !== t('accredited', 'معتمد') && lab.status !== 'معتمد'} onClick={() => { setRequestLab(lab); setIsRequestModalOpen(true); }}>{t('send_request', 'إرسال طلب')}</button>
            </div>
          </div>
        ))}
      </div>

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

      <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title={t('send_request', 'إرسال طلب فحص')}>
        <form onSubmit={handleSendRequest} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">{t('asset_code', 'كود الأصل')}</label>
            <select className="input" required value={newRequest.asset_code} onChange={e => setNewRequest({...newRequest, asset_code: e.target.value})}>
              <option value="">اختر الأصل...</option>
              {assets.map(a => <option key={a.id} value={a.asset_code}>{a.asset_code}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">{t('client', 'العميل')}</label>
            <select className="input" required value={newRequest.client} onChange={e => setNewRequest({...newRequest, client: e.target.value})}>
              <option value="">اختر العميل...</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
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

      <Modal isOpen={!!selectedLab} onClose={() => setSelectedLab(null)} title={t('lab_profile', 'ملف المختبر')}>
        {selectedLab && (
          <div className="space-y-4">
            <h2 className="text-2xl text-johar-gold font-bold">{selectedLab.name}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-johar-gray-dark p-4 rounded">
              <div><strong>{t('location_label', 'الموقع:')}</strong> {selectedLab.location}</div>
              <div><strong>{t('accreditation_number_label', 'رقم الاعتماد:')}</strong> {selectedLab.acc}</div>
              <div><strong>{t('expiry_date_label', 'تاريخ انتهاء الاعتماد:')}</strong> {selectedLab.expiry}</div>
              <div><strong>{t('rating_label', 'التقييم:')}</strong> {renderStars(selectedLab.rating)}</div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t('technical_capabilities', 'القدرات الفنية')}</h3>
              <ul className="list-disc list-inside text-sm text-johar-gray-mid">
                <li>{t('gold_purity_testing', 'فحص نقاوة الذهب (XRF & Fire Assay)')}</li>
                <li>{t('silver_other_metals_testing', 'فحص الفضة والمعادن الثمينة الأخرى')}</li>
                <li>{t('issue_internationally_certified_certificates', 'إصدار شهادات معتمدة دولياً')}</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

