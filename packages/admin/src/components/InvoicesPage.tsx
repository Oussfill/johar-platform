import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import Modal from './Modal';

export default function InvoicesPage() {
  const { t } = useTranslation();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [page, setPage] = useState(1);

  const [mockInvoices, setMockInvoices] = useState<any[]>([]);

  const fetchData = async () => {
    const { data } = await supabase.from('invoices').select('*');
    if (data) setMockInvoices(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: any) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleUpdateStatus = async (id: any, newStatus: string) => {
    if (!newStatus) return;
    const { error } = await supabase.from('invoices').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleView = (inv: any) => {
    setSelectedInvoice(inv);
    setIsDetailModalOpen(true);
  };

  const handleCollect = async (inv: any) => {
    handleUpdateStatus(inv.id, 'PAID');
  };

  return (
    <div dir="rtl" className="p-6">
      <h1 className="text-2xl font-bold johar-gold mb-6">{t('invoices', 'الفواتير')}</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-label">{t('total_invoices', 'إجمالي الفواتير')}</div><div className="stat-value">1,250,000 $</div></div>
        <div className="stat-card"><div className="stat-label">{t('paid', 'مدفوعة')}</div><div className="stat-value">950,000 $</div></div>
        <div className="stat-card"><div className="stat-label">{t('unpaid', 'غير مدفوعة')}</div><div className="stat-value">200,000 $</div></div>
        <div className="stat-card"><div className="stat-label">{t('overdue', 'متأخرة')}</div><div className="stat-value">100,000 $</div></div>
      </div>

      <div className="flex justify-between mb-4">
        <input type="text" placeholder={t('search_placeholder', 'بحث...')} className="input w-1/3" />
        <button className="btn-primary" onClick={() => setIsNewModalOpen(true)}>+ {t('new_invoice', 'فاتورة جديدة')}</button>
      </div>

      <table className="table w-full mb-4">
        <thead>
          <tr>
            <th>{t('invoice_number', 'رقم الفاتورة')}</th><th>{t('transaction_id', 'المعاملة')}</th><th>{t('service', 'الخدمة')}</th><th>{t('amount', 'المبلغ')}</th><th>{t('currency', 'العملة')}</th><th>{t('issue_date', 'تاريخ الإصدار')}</th><th>{t('due_date', 'الاستحقاق')}</th><th>{t('status', 'الحالة')}</th><th>{t('actions', 'إجراءات')}</th>
          </tr>
        </thead>
        <tbody>
          {mockInvoices.slice((page - 1) * 10, page * 10).map((inv) => (
            <tr key={inv.id}>
              <td>{inv.invoice_number || inv.id.substring(0,8)}</td><td>{inv.transaction_id || '-'}</td><td>-</td><td>{inv.amount}</td><td>{inv.currency}</td><td>{new Date(inv.created_at).toLocaleDateString()}</td><td>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}</td>
              <td><span className={`badge ${inv.status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>{inv.status}</span></td>
              <td className="space-x-2 space-x-reverse">
                <button className="btn-secondary text-sm" onClick={() => handleView(inv)}>{t('view', 'عرض')}</button>
                {inv.status !== 'PAID' && <button className="btn-primary text-sm" onClick={() => handleCollect(inv)}>{t('collect', 'تحصيل')}</button>}
                <button className="btn-danger text-sm" onClick={() => handleDelete(inv.id)}>{t('delete', 'حذف')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center">
        <button className="btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))}>{t('previous', 'السابق')}</button>
        <span>{t('page', 'صفحة')} {page} {t('of', 'من')} {Math.ceil((mockInvoices.length || 1) / 10)}</span>
        <button className="btn-secondary" onClick={() => setPage(p => Math.min(Math.ceil((mockInvoices.length || 1) / 10), p + 1))}>{t('next', 'التالي')}</button>
      </div>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={t('invoice_details', 'تفاصيل الفاتورة')}>
        {selectedInvoice && (
          <div className="p-4">
            <h2 className="text-xl font-bold text-center mb-4">JOHAR</h2>
            <div className="flex justify-between mb-4">
              <div><p>{t('number_prefix', 'رقم:')} {selectedInvoice.invoice_number}</p><p>{t('transaction_prefix', 'المعاملة:')} {selectedInvoice.transaction_id || '-'}</p></div>
              <div><p>{t('date_prefix', 'التاريخ:')} {selectedInvoice.created_at ? new Date(selectedInvoice.created_at).toLocaleDateString() : '-'}</p></div>
            </div>
            <table className="table w-full mb-4">
              <thead><tr><th>{t('item', 'البند')}</th><th>{t('price', 'السعر')}</th></tr></thead>
              <tbody><tr><td>-</td><td>{selectedInvoice.amount} {selectedInvoice.currency}</td></tr></tbody>
            </table>
            <div className="text-left font-bold">{t('total_prefix', 'الإجمالي:')} {selectedInvoice.amount} {selectedInvoice.currency}</div>
            <div className="mt-4 flex justify-end"><button className="btn-primary">{t('download_pdf', 'تحميل PDF')}</button></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title={t('new_invoice', 'فاتورة جديدة')}>
        <div className="space-y-4">
          <input id="invClient" className="input w-full" placeholder={t('client_name', 'اسم العميل')} />
          <input id="invAmount" className="input w-full" placeholder={t('amount', 'المبلغ')} type="number" />
          <button className="btn-primary w-full" onClick={async () => {
            const amount = (document.getElementById('invAmount') as HTMLInputElement).value;
            const { data, error } = await supabase.from('invoices').insert([{ 
              invoice_number: `INV-${Date.now()}`, 
              amount: parseFloat(amount) || 0, 
              due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), 
              status: 'PENDING'
            }]).select();
            if (error) { alert("Error: " + error.message); return; }
            if (data) {
              setMockInvoices([data[0], ...mockInvoices]);
              setIsNewModalOpen(false);
            }
          }}>{t('save_invoice', 'حفظ الفاتورة')}</button>
        </div>
      </Modal>
    </div>
  );
}


