import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

export default function CompaniesPage() {
  const { t } = useTranslation();
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [companies, setCompanies] = useState<any[]>([]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newCompany = {
      name: formData.get('name'),
      registration_number: 'PENDING',
      industry: formData.get('type'),
      status: 'ACTIVE',
    };
    const { data, error } = await supabase.from('companies').insert([newCompany]).select();
    if (error) { alert("Error: " + error.message); return; }
    if (data) {
      setCompanies([...companies, data[0]]);
      setIsAddModalOpen(false);
    }
  };

  const fetchData = () => {
    supabase.from('companies').select('*').then(({ data }) => {
      if (data) setCompanies(data);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase.from('companies').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  return (
    <div className="p-6 space-y-6 min-h-screen johar-black-lighter text-johar-gray-light" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gold-text">{t('manage_companies', 'إدارة الشركات')}</h1>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>{t('add_company_btn', '+ إضافة شركة')}</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card card">
          <div className="stat-label">{t('total_companies', 'الشركات الكلية')}</div>
          <div className="stat-value">320</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('active_plural', 'نشطة')}</div>
          <div className="stat-value text-johar-success">295</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('under_verification', 'قيد التحقق')}</div>
          <div className="stat-value text-johar-warning">18</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('suspended_plural', 'موقوفة')}</div>
          <div className="stat-value text-johar-danger">7</div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full text-right">
          <thead>
            <tr className="border-b border-johar-gray-dark">
              <th className="p-4">{t('company_name', 'اسم الشركة')}</th>
              <th className="p-4">{t('country', 'البلد')}</th>
              <th className="p-4">{t('business_type', 'نوع الأعمال')}</th>
              <th className="p-4">{t('kyb_status', 'حالة KYB')}</th>
              <th className="p-4">{t('number_of_employees', 'عدد الموظفين')}</th>
              <th className="p-4">{t('transaction_volume', 'حجم المعاملات')}</th>
              <th className="p-4">{t('actions', 'إجراءات')}</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-b border-johar-gray-dark hover:bg-johar-gray-dark/50">
                <td className="p-4 font-semibold">{c.name}</td>
                <td className="p-4">{'UAE'}</td>
                <td className="p-4">{c.industry || 'N/A'}</td>
                <td className="p-4">
                  <span className={`badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                    {c.status || 'PENDING'}
                  </span>
                </td>
                <td className="p-4 text-johar-gray-mid">N/A</td>
                <td className="p-4">{c.registration_number || 'N/A'}</td>
                <td className="p-4 space-x-2 space-x-reverse">
                  <button className="btn-secondary text-sm py-1 px-3" onClick={() => setSelectedCompany(c)}>{t('view', 'عرض')}</button>
                  <button className="btn-secondary text-sm py-1 px-3 border border-johar-gray-mid" onClick={() => {
                    const newStatus = prompt("Enter new status:", c.status);
                    if (newStatus) handleUpdateStatus(c.id, newStatus);
                  }}>{t('edit_status', 'تعديل الحالة')}</button>
                  <button className="btn-danger text-sm py-1 px-3" onClick={() => handleDelete(c.id)}>{t('delete', 'حذف')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!selectedCompany} onClose={() => setSelectedCompany(null)} title={t('company_profile', 'ملف الشركة')}>
        {selectedCompany && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-johar-gold">{selectedCompany.name}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div><span className="text-johar-gray-mid block text-sm">{t('country', 'البلد')}</span>{selectedCompany.country}</div>
              <div><span className="text-johar-gray-mid block text-sm">{t('business_type', 'نوع الأعمال')}</span>{selectedCompany.type}</div>
              <div><span className="text-johar-gray-mid block text-sm">{t('kyb_status', 'حالة KYB')}</span>{selectedCompany.kyb}</div>
              <div><span className="text-johar-gray-mid block text-sm">{t('estimated_transaction_volume', 'حجم المعاملات التقديري')}</span>{selectedCompany.volume}</div>
            </div>
            <div className="border-t border-johar-gray-dark pt-4 space-y-2">
              <h3 className="font-semibold">{t('executive_directors', 'المدراء التنفيذيون (UBOs)')}</h3>
              <ul className="list-disc list-inside text-sm text-johar-gray-mid">
                <li>{t('mohammed_abdullah', 'محمد عبد الله (الرئيس التنفيذي)')}</li>
                <li>{t('sarah_jenkins', 'Sarah Jenkins (مدير مالي)')}</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('add_new_company', 'إضافة شركة جديدة')}>
        <form className="space-y-4" onSubmit={handleAddSubmit}>
          <div><label className="block mb-1 text-sm">{t('company_name', 'اسم الشركة')}</label><input name="name" type="text" className="input w-full" /></div>
          <div><label className="block mb-1 text-sm">{t('country', 'البلد')}</label><input name="country" type="text" className="input w-full" /></div>
          <div><label className="block mb-1 text-sm">{t('business_type', 'نوع الأعمال')}</label><input name="type" type="text" className="input w-full" /></div>
          <div className="flex justify-end mt-4"><button type="submit" className="btn-primary">{t('add', 'إضافة')}</button></div>
        </form>
      </Modal>
    </div>
  );
}

