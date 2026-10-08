import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

export default function KYBPage() {
  const { t } = useTranslation();
  const [selectedKyb, setSelectedKyb] = useState<any>(null);

  const [kybRequests, setKybrequests] = useState<any[]>([]);

  const fetchData = async () => {
    const { data, error } = await supabase.from('kyb_requests').select('*');
    if (error) {
      alert("Error: " + error.message);
    } else if (data) {
      setKybrequests(data);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('kyb_requests').delete().eq('id', id);
    if (error) {
      alert("Error: " + error.message);
    } else {
      setSelectedKyb(null);
      fetchData();
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('kyb_requests').update({ status: newStatus }).eq('id', id);
    if (error) {
      alert("Error: " + error.message);
    } else {
      setSelectedKyb(null);
      fetchData();
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen johar-black-lighter text-johar-gray-light" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gold-text">{t('company_verification_kyb', 'التحقق من الشركات (KYB)')}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card card">
          <div className="stat-label">{t('total_requests', 'إجمالي الطلبات')}</div>
          <div className="stat-value">{kybRequests.length}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('under_review', 'قيد المراجعة')}</div>
          <div className="stat-value text-johar-warning">{kybRequests.filter(r => r.status === t('under_review', 'قيد المراجعة') || r.status === 'قيد المراجعة').length}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('approved_this_month', 'تمت الموافقة هذا الشهر')}</div>
          <div className="stat-value text-johar-success">{kybRequests.filter(r => r.status === t('approved', 'معتمد') || r.status === 'معتمد').length}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('rejected', 'مرفوض')}</div>
          <div className="stat-value text-johar-danger">{kybRequests.filter(r => r.status === t('rejected', 'مرفوض') || r.status === 'مرفوض').length}</div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full text-right">
          <thead>
            <tr className="border-b border-johar-gray-dark">
              <th className="p-4">{t('company_name', 'اسم الشركة')}</th>
              <th className="p-4">{t('type', 'النوع')}</th>
              <th className="p-4">{t('level', 'المستوى')}</th>
              <th className="p-4">{t('country', 'البلد')}</th>
              <th className="p-4">{t('status', 'الحالة')}</th>
              <th className="p-4">{t('submission_date', 'تاريخ التقديم')}</th>
              <th className="p-4">{t('actions', 'إجراءات')}</th>
            </tr>
          </thead>
          <tbody>
            {kybRequests.map((req) => (
              <tr key={req.id} className="border-b border-johar-gray-dark hover:bg-johar-gray-dark/50">
                <td className="p-4 font-semibold">{req.company}</td>
                <td className="p-4">{req.type}</td>
                <td className="p-4"><span className="bg-johar-gray-dark px-2 py-1 rounded text-xs">{req.level}</span></td>
                <td className="p-4">{req.country}</td>
                <td className="p-4">
                  <span className={`badge ${req.status === t('approved', 'معتمد') ? 'badge-success' : req.status === t('rejected', 'مرفوض') ? 'badge-danger' : 'badge-warning'}`}>
                    {req.status}
                  </span>
                </td>
                <td className="p-4 text-sm text-johar-gray-mid">{req.submitted}</td>
                <td className="p-4">
                  <button className="btn-secondary text-sm py-1 px-3" onClick={() => setSelectedKyb(req)}>{t('review', 'مراجعة')}</button>
                  <button className="btn-danger text-sm py-1 px-3 ml-2" onClick={() => handleDelete(req.id)}>{t('delete', 'حذف')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!selectedKyb} onClose={() => setSelectedKyb(null)} title={t('review_kyb_profile', 'مراجعة ملف KYB')}>
        {selectedKyb && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">{selectedKyb.company} <span className="text-sm font-normal text-johar-gray-mid ml-2">({selectedKyb.country})</span></h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-johar-black p-3 rounded">
                <h4 className="font-semibold text-sm mb-2 text-johar-gold">{t('directors_and_beneficiaries', 'المدراء والمستفيدون (UBO)')}</h4>
                <ul className="text-sm space-y-1">
                  <li>- {t('ahmed_mohammed_founder', 'أحمد محمد (مؤسس - 60%)')}</li>
                  <li>- {t('holding_company', 'شركة قابضة (40%)')}</li>
                </ul>
              </div>
              <div className="bg-johar-black p-3 rounded">
                <h4 className="font-semibold text-sm mb-2 text-johar-gold">{t('attached_documents', 'المستندات المرفقة')}</h4>
                <ul className="text-sm space-y-1 text-blue-400">
                  <li className="cursor-pointer hover:underline">📄 {t('commercial_license_pdf', 'الرخصة التجارية.pdf')}</li>
                  <li className="cursor-pointer hover:underline">📄 {t('proof_of_address_pdf', 'إثبات العنوان.pdf')}</li>
                  <li className="cursor-pointer hover:underline">📄 {t('ownership_structure_pdf', 'هيكل الملكية.pdf')}</li>
                </ul>
              </div>
            </div>

            <div className="bg-johar-gray-dark p-3 rounded text-sm">
              <strong className="text-johar-danger">{t('risk_assessment_automated', 'تقييم المخاطر (مؤتمت):')}</strong> {t('low_risk_no_sanctions_match', 'مخاطر منخفضة - لم يتم العثور على تطابق في قوائم العقوبات.')}
            </div>

            <div className="flex space-x-2 space-x-reverse mt-6">
              <button className="btn-success bg-johar-success text-white px-4 py-2 rounded" onClick={() => handleUpdateStatus(selectedKyb.id, t('approved', 'معتمد'))}>{t('approve_and_certify', 'موافقة واعتماد')}</button>
              <button className="btn-danger" onClick={() => handleUpdateStatus(selectedKyb.id, t('rejected', 'مرفوض'))}>{t('reject', 'رفض')}</button>
              <button className="btn-secondary" onClick={() => handleUpdateStatus(selectedKyb.id, 'Requested Docs')}>{t('request_additional_documents', 'طلب مستندات إضافية')}</button>
              <button className="btn-danger ml-2" onClick={() => handleDelete(selectedKyb.id)}>{t('delete', 'حذف')}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
