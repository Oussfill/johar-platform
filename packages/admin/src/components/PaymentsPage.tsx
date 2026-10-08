import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { supabase } from '../supabase';

export default function PaymentsPage() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const { data } = await supabase.from('payments').select('*');
    if (data) setPayments(data);
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchPayments();
  };

  const handleUpdateStatus = async (id: any, newStatus: string) => {
    if (!newStatus) return;
    const { error } = await supabase.from('payments').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchPayments();
  };

  return (
    <div dir="rtl" className="p-6">
      <h1 className="text-2xl font-bold johar-gold mb-6">{t('payments', 'المدفوعات')}</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-label">{t('total_payments', 'إجمالي المدفوعات')}</div><div className="stat-value">500,000 $</div></div>
        <div className="stat-card"><div className="stat-label">{t('completed', 'مكتمل')}</div><div className="stat-value">400,000 $</div></div>
        <div className="stat-card"><div className="stat-label">{t('processing', 'قيد المعالجة')}</div><div className="stat-value">90,000 $</div></div>
        <div className="stat-card"><div className="stat-label">{t('failed', 'فاشل')}</div><div className="stat-value">10,000 $</div></div>
      </div>

      <div className="mb-4">
        <select className="input w-1/4">
          <option value="">{t('all_methods', 'جميع الطرق')}</option>
          <option value="SWIFT">SWIFT</option>
          <option value="ACH">ACH</option>
          <option value={t('bank_transfer', 'تحويل بنكي')}>{t('bank_transfer', 'تحويل بنكي')}</option>
          <option value={t('check', 'شيك')}>{t('check', 'شيك')}</option>
        </select>
      </div>

      <table className="table w-full mb-4">
        <thead>
          <tr>
            <th>{t('payment_number', 'رقم الدفع')}</th><th>{t('invoice', 'الفاتورة')}</th><th>{t('client', 'العميل')}</th><th>{t('payment_method', 'طريقة الدفع')}</th><th>{t('amount', 'المبلغ')}</th><th>{t('payment_date', 'تاريخ الدفع')}</th><th>{t('status', 'الحالة')}</th><th>{t('actions', 'إجراءات')}</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((pay) => (
            <tr key={pay.id}>
              <td>{pay.id}</td><td>{pay.invoiceId}</td><td>{pay.client}</td><td>{pay.method}</td><td>{pay.amount} $</td><td>{pay.date}</td>
              <td>
                <span className={`badge ${pay.status === t('completed', 'مكتمل') ? 'badge-success' : pay.status === t('failed', 'فاشل') ? 'badge-danger' : 'badge-warning'}`}>{pay.status}</span>
              </td>
              <td className="space-x-2 space-x-reverse">
                <button className="btn-secondary text-sm" onClick={() => { setSelectedPayment(pay); setIsDetailModalOpen(true); }}>{t('details', 'تفاصيل')}</button>
                {pay.status === t('processing', 'قيد المعالجة') && <button className="btn-primary text-sm" onClick={() => handleUpdateStatus(pay.id, t('completed', 'مكتمل'))}>{t('confirm', 'تأكيد')}</button>}
                {pay.status === t('failed', 'فاشل') && <button className="btn-danger text-sm" onClick={() => handleUpdateStatus(pay.id, t('processing', 'قيد المعالجة'))}>{t('retry', 'إعادة محاولة')}</button>}
                <button className="btn-danger text-sm" onClick={() => handleDelete(pay.id)}>{t('delete', 'حذف')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={t('payment_details', 'تفاصيل الدفع')}>
        {selectedPayment && (
          <div className="space-y-2">
            <p><strong>{t('payment_number_prefix', 'رقم الدفع:')}</strong> {selectedPayment.id}</p>
            <p><strong>{t('bank_reference_prefix', 'المرجع البنكي:')}</strong> REF-{Math.floor(Math.random() * 1000000)}</p>
            <p><strong>{t('timeline_prefix', 'الجدول الزمني:')}</strong> {t('received', 'تم الاستلام')} {'→'} {t('under_review', 'قيد المراجعة')} {'→'} {selectedPayment.status}</p>
            <button className="btn-secondary w-full mt-4" onClick={() => setIsDetailModalOpen(false)}>{t('close', 'إغلاق')}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

