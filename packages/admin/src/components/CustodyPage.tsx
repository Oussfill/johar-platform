import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import Modal from './Modal';

export default function CustodyPage() {
  const { t } = useTranslation();
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const [custodyRecords, setCustodyRecords] = useState<any[]>([]);

  const fetchData = async () => {
    const { data } = await supabase.from('custody_records').select('*');
    if (data) setCustodyRecords(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: any) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('custody_records').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleUpdateStatus = async (id: any, newStatus: string) => {
    if (!newStatus) return;
    const { error } = await supabase.from('custody_records').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  return (
    <div className="p-6 space-y-6 min-h-screen johar-black-lighter text-johar-gray-light" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gold-text">{t('custody_management', 'إدارة الحيازة')}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card card">
          <div className="stat-label">{t('total_assets_in_custody', 'الأصول في الحيازة كلياً')}</div>
          <div className="stat-value">12,450</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('deposited_in_warehouses', 'مُودَعة في المستودعات')}</div>
          <div className="stat-value text-johar-success">12,300</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('in_transit', 'قيد النقل')}</div>
          <div className="stat-value text-johar-warning">125</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('loaned_to_labs', 'معارة للمختبرات')}</div>
          <div className="stat-value text-johar-info">25</div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full text-right">
          <thead>
            <tr className="border-b border-johar-gray-dark">
              <th className="p-4">{t('asset', 'الأصل')}</th>
              <th className="p-4">{t('from_party', 'من (الجهة المُسلّمة)')}</th>
              <th className="p-4">{t('to_party', 'إلى (الجهة المُستلِمة)')}</th>
              <th className="p-4">{t('custody_location', 'موقع الحيازة')}</th>
              <th className="p-4">{t('received_date', 'تاريخ الاستلام')}</th>
              <th className="p-4">{t('status', 'الحالة')}</th>
              <th className="p-4">{t('actions', 'إجراءات')}</th>
            </tr>
          </thead>
          <tbody>
            {custodyRecords.map((r) => (
              <tr key={r.id} className="border-b border-johar-gray-dark hover:bg-johar-gray-dark/50">
                <td className="p-4 font-mono">{r.asset_code}</td>
                <td className="p-4">{r.from_party}</td>
                <td className="p-4">{r.to_party}</td>
                <td className="p-4">{r.location}</td>
                <td className="p-4">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={`badge ${r.status === 'ACTIVE' || r.status === t('in_custody', 'في الحيازة') ? 'badge-success' : 'badge-info'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button className="btn-primary text-sm py-1 px-3" onClick={() => setIsTransferModalOpen(true)}>{t('transfer_custody', 'نقل الحيازة')}</button>
                    <button className="btn-primary text-sm py-1 px-3" onClick={() => handleUpdateStatus(r.id, prompt(t('new_status', 'New Status?'), r.status) || r.status)}>{t('edit_status', 'تعديل الحالة')}</button>
                    <button className="btn-danger text-sm py-1 px-3" onClick={() => handleDelete(r.id)}>{t('delete', 'حذف')}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title={t('chain_of_custody_form', 'نموذج نقل الحيازة (Chain of Custody)')}>
        <form className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">{t('asset_number', 'رقم الأصل')}</label>
            <input type="text" className="input w-full bg-johar-gray-dark" defaultValue="INV-G-001" disabled />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">{t('from_sender', 'من (الجهة المُسلّمة)')}</label>
              <input type="text" className="input w-full bg-johar-gray-dark" defaultValue={t('dubai_main_warehouse', 'مستودع دبي الرئيسي')} disabled />
            </div>
            <div>
              <label className="block mb-1 text-sm">{t('to_receiver', 'إلى (الجهة المُستلِمة)')}</label>
              <select className="input w-full">
                <option>{t('armored_truck_1', 'سيارة نقل مصفحة #1')}</option>
                <option>{t('dubai_testing_lab', 'مختبر دبي للفحص')}</option>
                <option>{t('client_final_delivery', 'العميل (تسليم نهائي)')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm">{t('transfer_reason', 'سبب النقل')}</label>
            <input type="text" className="input w-full" placeholder={t('transfer_reason_placeholder', 'مثال: نقل لإجراء فحص مخبري...')} />
          </div>
          
          <div className="border border-johar-gold p-4 rounded bg-johar-black mt-6">
            <h4 className="font-semibold text-johar-gold mb-2">{t('digital_signature', 'توقيع رقمي للموافقة')}</h4>
            <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
              <input type="checkbox" className="form-checkbox w-5 h-5 text-johar-gold" />
              <span>{t('i_confirm_identity', 'أقر بأني الموظف المسؤول وتم التحقق من هوية المُستلِم.')}</span>
            </label>
          </div>

          <div className="flex justify-end mt-4">
            <button type="button" className="btn-primary" onClick={() => setIsTransferModalOpen(false)}>{t('execute_transfer_blockchain', 'تنفيذ النقل وتسجيل في البلوكشين')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

