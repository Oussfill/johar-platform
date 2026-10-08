import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

export default function CustomersPage() {
  const { t } = useTranslation();
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const getKycStatus = (status: string) => {
    switch (status) {
      case 'completed': return t('kyc_completed', 'مكتمل');
      case 'under_review': return t('kyc_under_review', 'قيد المراجعة');
      case 'rejected': return t('kyc_rejected', 'مرفوض');
      default: return status;
    }
  };

  const getCountry = (country: string) => {
    switch (country) {
      case 'UAE': return t('country_uae', 'الإمارات');
      case 'KSA': return t('country_ksa', 'السعودية');
      case 'UK': return t('country_uk', 'UK');
      case 'Egypt': return t('country_egypt', 'مصر');
      case 'Qatar': return t('country_qatar', 'قطر');
      case 'Kuwait': return t('country_kuwait', 'الكويت');
      case 'Singapore': return t('country_singapore', 'Singapore');
      case 'Bahrain': return t('country_bahrain', 'البحرين');
      case 'USA': return t('country_usa', 'USA');
      default: return country;
    }
  };

  const [customers, setCustomers] = useState<any[]>([]);

  const fetchData = () => {
    supabase.from('profiles').select('*').then(({ data }) => {
      if (data) setCustomers(data);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  return (
    <div className="p-6 space-y-6 min-h-screen johar-black-lighter text-johar-gray-light" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gold-text">{t('manage_customers', 'إدارة العملاء')}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card card">
          <div className="stat-label">{t('total_customers', 'إجمالي العملاء')}</div>
          <div className="stat-value">12,450</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('active_customers', 'نشط')}</div>
          <div className="stat-value text-johar-success">11,200</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('new_this_month', 'جديد هذا الشهر')}</div>
          <div className="stat-value">340</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('pending_verification', 'معلق التحقق')}</div>
          <div className="stat-value text-johar-warning">156</div>
        </div>
      </div>

      <div className="flex space-x-4 space-x-reverse mb-4">
        <input type="text" placeholder={t('search_placeholder', 'بحث بالاسم أو البريد...')} className="input flex-1" />
        <select className="input w-48">
          <option>{t('all_statuses', 'كل الحالات')}</option>
          <option>{t('kyc_completed', 'مكتمل')}</option>
          <option>{t('kyc_under_review', 'قيد المراجعة')}</option>
          <option>{t('kyc_rejected', 'مرفوض')}</option>
        </select>
        <select className="input w-48">
          <option>{t('all_countries', 'كل الدول')}</option>
          <option>{t('country_uae', 'الإمارات')}</option>
          <option>{t('country_ksa', 'السعودية')}</option>
          <option>{t('country_uk', 'UK')}</option>
          <option>{t('country_egypt', 'مصر')}</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full text-right">
          <thead>
            <tr className="border-b border-johar-gray-dark">
              <th className="p-4">{t('name_col', 'الاسم')}</th>
              <th className="p-4">{t('email_col', 'البريد')}</th>
              <th className="p-4">{t('country_col', 'البلد')}</th>
              <th className="p-4">{t('kyc_status_col', 'حالة KYC')}</th>
              <th className="p-4">{t('assets_balance_col', 'رصيد الأصول')}</th>
              <th className="p-4">{t('join_date_col', 'تاريخ الانضمام')}</th>
              <th className="p-4">{t('actions_col', 'إجراءات')}</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-johar-gray-dark hover:bg-johar-gray-dark/50">
                <td className="p-4">{c.full_name || 'N/A'}</td>
                <td className="p-4 text-johar-gray-mid">{c.email}</td>
                <td className="p-4">{getCountry('UAE')}</td>
                <td className="p-4">
                  <span className={`badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                    {c.status || 'PENDING'}
                  </span>
                </td>
                <td className="p-4">{'0'}</td>
                <td className="p-4">{new Date(c.created_at).toLocaleDateString()}</td>
                <td className="p-4 space-x-2 space-x-reverse">
                  <button className="btn-secondary text-sm py-1 px-3" onClick={() => setSelectedCustomer(c)}>{t('view_profile', 'عرض الملف')}</button>
                  <button className="btn-warning text-sm py-1 px-3" onClick={() => handleUpdateStatus(c.id, 'SUSPENDED')}>{t('suspend', 'تعليق')}</button>
                  <button className="btn-secondary text-sm py-1 px-3" onClick={() => {
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

      <Modal isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title={t('customer_profile_modal', 'ملف العميل')}>
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div><span className="text-johar-gray-mid block text-sm">{t('name_col', 'الاسم')}</span>{selectedCustomer.name}</div>
              <div><span className="text-johar-gray-mid block text-sm">{t('email_col', 'البريد')}</span>{selectedCustomer.email}</div>
              <div><span className="text-johar-gray-mid block text-sm">{t('country_col', 'البلد')}</span>{getCountry(selectedCustomer.country)}</div>
              <div><span className="text-johar-gray-mid block text-sm">{t('join_date_col', 'تاريخ الانضمام')}</span>{selectedCustomer.joined}</div>
            </div>
            
            <div className="border-t border-johar-gray-dark pt-4">
              <h3 className="font-semibold mb-2">{t('assets_and_transactions', 'الأصول والمعاملات')}</h3>
              <div className="bg-johar-gray-dark p-4 rounded">
                <div>{t('total_balance_label', 'الرصيد الإجمالي:')} {selectedCustomer.balance}</div>
                <div className="text-sm text-johar-gray-mid mt-2">{t('no_recent_transactions', 'لا توجد معاملات حديثة.')}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

