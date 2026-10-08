import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

export default function UBOPage() {
  const { t } = useTranslation();
  const [selectedUbo, setSelectedUbo] = useState<any>(null);

  const [ubos, setUbos] = useState<any[]>([]);

  const fetchData = async () => {
    const { data, error } = await supabase.from('ubo_details').select('*');
    if (error) {
      alert("Error: " + error.message);
    } else if (data) {
      setUbos(data);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('ubo_details').delete().eq('id', id);
    if (error) {
      alert("Error: " + error.message);
    } else {
      fetchData();
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('ubo_details').update({ status: newStatus }).eq('id', id);
    if (error) {
      alert("Error: " + error.message);
    } else {
      fetchData();
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen johar-black-lighter text-johar-gray-light" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gold-text">{t('ubo_title', 'المستفيد الحقيقي (UBO)')}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card card">
          <div className="stat-label">{t('total', 'الكلي')}</div>
          <div className="stat-value">{ubos.length}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('identified_and_verified', 'مُحدَّد ومُحقق')}</div>
          <div className="stat-value text-johar-success">{ubos.filter(u => u.status === t('verified', 'مُحقق') || u.status === 'مُحقق').length}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('under_verification', 'قيد التحقق')}</div>
          <div className="stat-value text-johar-warning">{ubos.filter(u => u.status === t('under_verification', 'قيد التحقق') || u.status === 'قيد التحقق').length}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('potential_suspicious', 'محتمل مشبوه')}</div>
          <div className="stat-value text-johar-danger">{ubos.filter(u => u.status === t('potential_suspicious', 'محتمل مشبوه') || u.status === 'محتمل مشبوه').length}</div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full text-right">
          <thead>
            <tr className="border-b border-johar-gray-dark">
              <th className="p-4">{t('beneficiary_name', 'اسم المستفيد')}</th>
              <th className="p-4">{t('nationality', 'الجنسية')}</th>
              <th className="p-4">{t('ownership_percentage', 'نسبة الملكية')}</th>
              <th className="p-4">{t('company_name', 'اسم الشركة')}</th>
              <th className="p-4">{t('verification_status', 'حالة التحقق')}</th>
              <th className="p-4">{t('actions', 'إجراءات')}</th>
            </tr>
          </thead>
          <tbody>
            {ubos.map((ubo) => (
              <tr key={ubo.id} className="border-b border-johar-gray-dark hover:bg-johar-gray-dark/50">
                <td className="p-4 font-semibold">{ubo.name}</td>
                <td className="p-4">{ubo.nationality}</td>
                <td className="p-4">{ubo.ownership}</td>
                <td className="p-4">{ubo.company}</td>
                <td className="p-4">
                  <span className={`badge ${ubo.status === t('verified', 'مُحقق') ? 'badge-success' : ubo.status === t('potential_suspicious', 'محتمل مشبوه') ? 'badge-danger' : 'badge-warning'}`}>
                    {ubo.status}
                  </span>
                </td>
                <td className="p-4">
                  <button className="btn-secondary text-sm py-1 px-3" onClick={() => setSelectedUbo(ubo)}>{t('view', 'عرض')}</button>
                  <button className="btn-secondary text-sm py-1 px-3 ml-2" onClick={() => {
                    const newStatus = prompt("Enter new status:", ubo.status);
                    if (newStatus) handleUpdateStatus(ubo.id, newStatus);
                  }}>{t('edit_status', 'تعديل الحالة')}</button>
                  <button className="btn-danger text-sm py-1 px-3 ml-2" onClick={() => handleDelete(ubo.id)}>{t('delete', 'حذف')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!selectedUbo} onClose={() => setSelectedUbo(null)} title={t('ubo_profile', 'ملف المستفيد الحقيقي (UBO)')}>
        {selectedUbo && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">{selectedUbo.name}</h2>
            
            <div className="bg-johar-gray-dark p-4 rounded text-center">
              <h3 className="font-semibold text-johar-gold mb-4">{t('ownership_structure', 'هيكل الملكية')}</h3>
              <div className="inline-block border border-johar-gray-mid p-3 rounded mb-2 bg-johar-black">
                {selectedUbo.company}
              </div>
              <div className="text-johar-gray-mid">|</div>
              <div className="text-johar-gray-mid">| ({selectedUbo.ownership})</div>
              <div className="text-johar-gray-mid">v</div>
              <div className="inline-block border border-johar-gold p-3 rounded mt-2 bg-johar-black text-johar-gold font-bold">
                {selectedUbo.name}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border border-johar-gray-dark p-3 rounded">
                <h4 className="font-semibold mb-2">{t('pep_check', 'فحص PEP (شخصية سياسية)')}</h4>
                <span className="badge badge-success">{t('negative_no_matches', 'سلبي (لا توجد تطابقات)')}</span>
              </div>
              <div className="border border-johar-gray-dark p-3 rounded">
                <h4 className="font-semibold mb-2">{t('sanctions_check', 'فحص قوائم العقوبات')}</h4>
                {selectedUbo.status === t('potential_suspicious', 'محتمل مشبوه') ? (
                  <span className="badge badge-danger">{t('partial_match_needs_review', 'تطابق جزئي - يتطلب مراجعة')}</span>
                ) : (
                  <span className="badge badge-success">{t('clear', 'سليم')}</span>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">{t('verification_documents', 'مستندات التحقق')}</h4>
              <ul className="text-sm text-blue-400 space-y-1">
                <li className="cursor-pointer hover:underline">📄 {t('passport_copy_pdf', 'صورة جواز السفر.pdf')}</li>
                <li className="cursor-pointer hover:underline">📄 {t('ubo_declaration_pdf', 'إقرار المستفيد الحقيقي.pdf')}</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
