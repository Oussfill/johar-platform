import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import Modal from './Modal';

export default function FinancePage() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState(t('invoices_tab', 'الفواتير'));
  
  const [invoices, setInvoices] = useState<any[]>([]);

  const fetchData = async () => {
    const { data } = await supabase.from('finance_transactions').select('*');
    if (data) setInvoices(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: any) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('finance_transactions').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleUpdateStatus = async (id: any, newStatus: string) => {
    if (!newStatus) return;
    const { error } = await supabase.from('finance_transactions').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const [payments, setPayments] = useState([
    { id: 'PAY-001', invId: 'INV-2026-001', amount: '1,500', method: t('bank_transfer', 'حوالة بنكية'), date: '2026-09-16', status: t('under_review', 'قيد المراجعة') },
  ]);

  const [viewInvOpen, setViewInvOpen] = useState(false);
  const [selectedInv, setSelectedInv] = useState<any>(null);

  const [newInvOpen, setNewInvOpen] = useState(false);
  const [newInv, setNewInv] = useState({ client: '', service: '', amount: '', currency: 'USD', dueDate: '', notes: '' });

  const handleSaveInv = async () => {
    const inv = {
      transaction_type: newInv.service,
      amount: newInv.amount,
      currency: newInv.currency,
      status: t('pending_payment', 'بانتظار الدفع')
    };
    const { data, error } = await supabase.from('finance_transactions').insert([inv]).select();
    if (error) { alert("Error: " + error.message); return; }
    if (data) {
      setInvoices([data[0], ...invoices]);
      setNewInvOpen(false);
      setNewInv({ client: '', service: '', amount: '', currency: 'USD', dueDate: '', notes: '' });
    }
  };

  const handleCollect = (id: string) => {
    handleUpdateStatus(id, t('paid', 'مدفوع'));
  };

  const confirmPayment = (id: string) => {
    setPayments(payments.map(p => p.id === id ? { ...p, status: t('confirmed', 'مؤكد') } : p));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-johar-gold mb-6">{t('finance_management_title', 'الإدارة المالية')}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="stat-label">{t('revenue_month', 'الإيرادات (الشهر)')}</div>
          <div className="stat-value">$145,000</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('overdue_invoices', 'فواتير متأخرة')}</div>
          <div className="stat-value text-johar-danger">{invoices.filter(i => i.status === t('overdue', 'متأخر')).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('payments_for_review', 'مدفوعات للمراجعة')}</div>
          <div className="stat-value">{payments.filter(p => p.status === t('under_review', 'قيد المراجعة')).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('platform_balance', 'رصيد المنصة')}</div>
          <div className="stat-value">$2.4M</div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-johar-gray-dark mb-6">
        <button 
          className={`pb-2 px-4 ${activeTab === t('invoices_tab', 'الفواتير') ? 'border-b-2 border-johar-gold text-johar-gold' : 'text-johar-gray-light hover:text-white'}`}
          onClick={() => setActiveTab(t('invoices_tab', 'الفواتير'))}
        >
          {t('invoices_tab', 'الفواتير')}
        </button>
        <button 
          className={`pb-2 px-4 ${activeTab === t('payments_tab', 'المدفوعات') ? 'border-b-2 border-johar-gold text-johar-gold' : 'text-johar-gray-light hover:text-white'}`}
          onClick={() => setActiveTab(t('payments_tab', 'المدفوعات'))}
        >
          {t('payments_tab', 'المدفوعات')}
        </button>
      </div>

      {activeTab === t('invoices_tab', 'الفواتير') && (
        <>
          <div className="flex justify-end mb-4">
            <button className="btn-primary" onClick={() => setNewInvOpen(true)}>{t('new_invoice', '+ فاتورة جديدة')}</button>
          </div>
          <div className="card overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>{t('invoice_number', 'رقم الفاتورة')}</th>
                  <th>{t('client', 'العميل')}</th>
                  <th>{t('service', 'الخدمة')}</th>
                  <th>{t('amount', 'المبلغ')}</th>
                  <th>{t('due_date', 'تاريخ الاستحقاق')}</th>
                  <th>{t('status', 'الحالة')}</th>
                  <th>{t('actions', 'إجراءات')}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.id}</td>
                    <td>{inv.client}</td>
                    <td>{inv.service}</td>
                    <td>{inv.amount} {inv.currency}</td>
                    <td>{inv.dueDate}</td>
                    <td>
                      <span className={`badge ${inv.status === t('paid', 'مدفوع') ? 'badge-success' : inv.status === t('overdue', 'متأخر') ? 'badge-danger' : 'badge-warning'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-secondary text-sm px-2 py-1" onClick={() => { setSelectedInv(inv); setViewInvOpen(true); }}>{t('view', 'عرض')}</button>
                        {inv.status !== t('paid', 'مدفوع') && (
                          <button className="btn-primary text-sm px-2 py-1" onClick={() => handleCollect(inv.id)}>{t('collect', 'تحصيل')}</button>
                        )}
                        <button className="btn-danger text-sm px-2 py-1" onClick={() => handleDelete(inv.id)}>{t('delete', 'حذف')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === t('payments_tab', 'المدفوعات') && (
        <div className="card overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>{t('payment_number', 'رقم الدفعة')}</th>
                <th>{t('invoice_number', 'الفاتورة')}</th>
                <th>{t('amount', 'المبلغ')}</th>
                <th>{t('method', 'الطريقة')}</th>
                <th>{t('date', 'التاريخ')}</th>
                <th>{t('status', 'الحالة')}</th>
                <th>{t('actions', 'إجراءات')}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(pay => (
                <tr key={pay.id}>
                  <td>{pay.id}</td>
                  <td>{pay.invId}</td>
                  <td>{pay.amount}</td>
                  <td>{pay.method}</td>
                  <td>{pay.date}</td>
                  <td>
                    <span className={`badge ${pay.status === t('confirmed', 'مؤكد') ? 'badge-success' : 'badge-warning'}`}>
                      {pay.status}
                    </span>
                  </td>
                  <td>
                    {pay.status === t('under_review', 'قيد المراجعة') && (
                      <button className="btn-primary text-sm px-2 py-1" onClick={() => confirmPayment(pay.id)}>{t('confirm', 'تأكيد')}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={viewInvOpen} onClose={() => setViewInvOpen(false)} title={t('invoice_details', 'تفاصيل الفاتورة')}>
        {selectedInv && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div><span className="text-johar-gray-light">{t('client', 'العميل')}:</span> <div>{selectedInv.client}</div></div>
              <div><span className="text-johar-gray-light">{t('service', 'الخدمة')}:</span> <div>{selectedInv.service}</div></div>
              <div><span className="text-johar-gray-light">{t('amount', 'المبلغ')}:</span> <div>{selectedInv.amount} {selectedInv.currency}</div></div>
              <div><span className="text-johar-gray-light">{t('due_date', 'تاريخ الاستحقاق')}:</span> <div>{selectedInv.dueDate}</div></div>
              <div><span className="text-johar-gray-light">{t('status', 'الحالة')}:</span> <div>{selectedInv.status}</div></div>
            </div>
            <div className="mt-4 pt-4 border-t border-johar-gray-dark flex justify-end">
              <button className="btn-secondary" onClick={() => alert(t('printing', 'جاري الطباعة...'))}>{t('print_invoice_pdf', 'طباعة الفاتورة (PDF)')}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={newInvOpen} onClose={() => setNewInvOpen(false)} title={t('new_invoice', 'فاتورة جديدة')}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-johar-gray-light mb-1">{t('client', 'العميل')}</label>
            <input type="text" className="input w-full" value={newInv.client} onChange={(e) => setNewInv({...newInv, client: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-johar-gray-light mb-1">{t('service_type', 'نوع الخدمة')}</label>
            <input type="text" className="input w-full" value={newInv.service} onChange={(e) => setNewInv({...newInv, service: e.target.value})} />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-johar-gray-light mb-1">{t('amount', 'المبلغ')}</label>
              <input type="text" className="input w-full" value={newInv.amount} onChange={(e) => setNewInv({...newInv, amount: e.target.value})} />
            </div>
            <div className="w-1/3">
              <label className="block text-sm text-johar-gray-light mb-1">{t('currency', 'العملة')}</label>
              <select className="input w-full" value={newInv.currency} onChange={(e) => setNewInv({...newInv, currency: e.target.value})}>
                <option value="USD">USD</option>
                <option value="AED">AED</option>
                <option value="SAR">SAR</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-johar-gray-light mb-1">{t('due_date', 'تاريخ الاستحقاق')}</label>
            <input type="date" className="input w-full" value={newInv.dueDate} onChange={(e) => setNewInv({...newInv, dueDate: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-johar-gray-light mb-1">{t('notes', 'ملاحظات')}</label>
            <textarea className="input w-full" value={newInv.notes} onChange={(e) => setNewInv({...newInv, notes: e.target.value})}></textarea>
          </div>
          <div className="flex justify-end mt-4">
            <button className="btn-primary" onClick={handleSaveInv}>{t('create_invoice', 'إنشاء الفاتورة')}</button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

