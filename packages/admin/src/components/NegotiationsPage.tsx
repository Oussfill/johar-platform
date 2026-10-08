import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { supabase } from '../supabase';

export default function NegotiationsPage() {
  const { t } = useTranslation();
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [selectedNeg, setSelectedNeg] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');

  useEffect(() => {
    fetchNegotiations();
  }, []);

  const fetchNegotiations = async () => {
    const { data } = await supabase.from('negotiations').select('*');
    if (data) setNegotiations(data);
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('negotiations').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchNegotiations();
  };

  const handleUpdateStatus = async (id: any, newStatus: string) => {
    if (!newStatus) return;
    const { error } = await supabase.from('negotiations').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchNegotiations();
  };

  return (
    <div dir="rtl" className="p-6">
      <h1 className="text-2xl font-bold johar-gold mb-6">{t('negotiations', 'التفاوض')}</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-label">{t('active', 'نشط')}</div><div className="stat-value">{negotiations.filter(n => n.status === 'ACTIVE' || n.status === 'نشط').length}</div></div>
        <div className="stat-card"><div className="stat-label">{t('needs_decision', 'يحتاج قرار')}</div><div className="stat-value">{negotiations.filter(n => n.status === 'NEEDS_DECISION').length}</div></div>
        <div className="stat-card"><div className="stat-label">{t('completed', 'مكتمل')}</div><div className="stat-value">{negotiations.filter(n => n.status === 'COMPLETED' || n.status === 'مكتمل').length}</div></div>
        <div className="stat-card"><div className="stat-label">{t('failed', 'فاشل')}</div><div className="stat-value">{negotiations.filter(n => n.status === 'FAILED' || n.status === 'فاشل').length}</div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {negotiations.map((neg) => (
          <div key={neg.id} className="card p-4 card-hover">
            <div className="flex justify-between mb-2">
              <span className="font-bold">{neg.id.substring(0,8)}</span>
              <span className={`badge ${neg.status === t('completed', 'مكتمل') ? 'badge-success' : 'badge-warning'}`}>{neg.status}</span>
            </div>
            <p className="mb-2">{neg.buyer} ↔ {neg.seller}</p>
            <p><strong>{t('round_prefix', 'الجولة:')}</strong> {neg.current_round}</p>
            <p><strong>{t('last_price_prefix', 'آخر سعر:')}</strong> {neg.proposed_price} $</p>
            <p className="text-red-500 font-bold mb-4">⏳ {'23:59:59'}</p>
            <button className="btn-primary w-full mb-2" onClick={() => { setSelectedNeg(neg); setIsModalOpen(true); }}>{t('enter_negotiation_room', 'دخول غرفة التفاوض')}</button>
            <div className="flex gap-2">
              <button className="btn-primary flex-1 text-sm" onClick={() => handleUpdateStatus(neg.id, prompt(t('new_status', 'New Status?'), neg.status) || neg.status)}>{t('edit_status', 'تعديل الحالة')}</button>
              <button className="btn-danger flex-1 text-sm" onClick={() => handleDelete(neg.id)}>{t('delete', 'حذف')}</button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('negotiation_room', 'غرفة التفاوض')}>
        {selectedNeg && (
          <div className="space-y-4">
            <table className="table w-full">
              <thead><tr><th>{t('round', 'الجولة')}</th><th>{t('buyer_offer', 'عرض المشتري')}</th><th>{t('seller_reply', 'رد البائع')}</th><th>{t('date', 'التاريخ')}</th></tr></thead>
              <tbody>
                <tr><td>1</td><td>45,000 $</td><td>52,000 $</td><td>2026-09-18</td></tr>
                <tr><td>{selectedNeg.round}</td><td>{selectedNeg.lastPrice} $</td><td>-</td><td>{t('now', 'الآن')}</td></tr>
              </tbody>
            </table>
            <input className="input w-full" placeholder={t('new_offer_price', 'سعر العرض الجديد...')} value={counterPrice} onChange={e => setCounterPrice(e.target.value)} />
            <div className="flex space-x-2 space-x-reverse">
              <button className="btn-primary flex-1" onClick={() => alert(t('offer_sent', 'تم إرسال العرض'))}>{t('send_offer', 'إرسال العرض')}</button>
              <button className="btn-success flex-1" onClick={() => { handleUpdateStatus(selectedNeg.id, t('completed', 'مكتمل')); setIsModalOpen(false); }}>{t('accept_current_price', 'قبول السعر الحالي')}</button>
              <button className="btn-danger flex-1" onClick={() => { handleUpdateStatus(selectedNeg.id, t('failed', 'فاشل')); setIsModalOpen(false); }}>{t('end_negotiation', 'إنهاء التفاوض')}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

