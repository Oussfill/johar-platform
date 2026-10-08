import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { supabase } from '../supabase';

export default function OffersPage() {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<any[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState(false);
  const [negotiationPrice, setNegotiationPrice] = useState('');

  const [newAsset, setNewAsset] = useState('');
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    const { data } = await supabase.from('marketplace_offers').select('*');
    if (data) setOffers(data);
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('marketplace_offers').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchOffers();
  };

  const handleUpdateStatus = async (id: any, newStatus: string) => {
    if (!newStatus) return;
    const { error } = await supabase.from('marketplace_offers').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchOffers();
  };

  const handleCreate = async () => {
    const { data, error } = await supabase.from('marketplace_offers').insert([{ asset_id: newAsset, asking_price: newPrice }]).select();
    if (error) { alert("Error: " + error.message); return; }
    if (data) {
      setIsNewModalOpen(false);
      fetchOffers();
    }
  };

  const handleStartNegotiation = async () => {
    if (!selectedOffer) return;
    const { error } = await supabase.from('negotiations').insert([{ 
      offer_id: selectedOffer.id,
      asset_id: selectedOffer.asset_id,
      asset_code: selectedOffer.asset_code,
      buyer_id: selectedOffer.buyer_id,
      seller_id: selectedOffer.seller_id,
      current_price: parseFloat(negotiationPrice) || 0,
      currency: selectedOffer.currency || 'USD',
      status: 'OPEN',
      last_offer_by: 'BUYER'
    }]);
    
    if (error) { 
      alert("Error: " + error.message); 
      return; 
    }
    
    setIsNegotiationModalOpen(false);
    fetchOffers();
  };

  return (
    <div dir="rtl" className="p-6">
      <h1 className="text-2xl font-bold johar-gold mb-6">{t('offers', 'العروض')}</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-label">{t('total', 'الكلي')}</div><div className="stat-value">120</div></div>
        <div className="stat-card"><div className="stat-label">{t('active', 'نشط')}</div><div className="stat-value">45</div></div>
        <div className="stat-card"><div className="stat-label">{t('under_negotiation', 'قيد التفاوض')}</div><div className="stat-value">15</div></div>
        <div className="stat-card"><div className="stat-label">{t('expired', 'منتهي')}</div><div className="stat-value">60</div></div>
      </div>

      <div className="flex justify-between mb-4">
        <div className="space-x-2 space-x-reverse">
          <select className="input"><option value="">{t('all_types', 'كل الأنواع')}</option><option value={t('sell', 'بيع')}>{t('sell', 'بيع')}</option><option value={t('buy', 'شراء')}>{t('buy', 'شراء')}</option></select>
          <select className="input"><option value="">{t('all_statuses', 'كل الحالات')}</option><option value={t('active', 'نشط')}>{t('active', 'نشط')}</option><option value={t('expired', 'منتهي')}>{t('expired', 'منتهي')}</option></select>
        </div>
        <button className="btn-primary" onClick={() => setIsNewModalOpen(true)}>+ {t('new_offer', 'عرض جديد')}</button>
      </div>

      <table className="table w-full mb-4">
        <thead>
          <tr>
            <th>{t('offer_number', 'رقم العرض')}</th><th>{t('asset', 'الأصل')}</th><th>{t('type', 'النوع')}</th><th>{t('seller_label', 'البائع')}</th><th>{t('buyer_label', 'المشتري')}</th><th>{t('price', 'السعر')}</th><th>{t('status', 'الحالة')}</th><th>{t('date', 'التاريخ')}</th><th>{t('actions', 'إجراءات')}</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr key={offer.id}>
              <td>{offer.offer_code || offer.id.substring(0,8)}</td><td>{offer.asset_code}</td><td>{offer.type}</td><td>{offer.seller_id?.substring(0,8) || '-'}</td><td>{offer.buyer_id?.substring(0,8) || '-'}</td><td>{offer.asking_price} $</td>
              <td><span className={`badge ${offer.status === 'OPEN' ? 'badge-success' : offer.status === 'EXPIRED' ? 'badge-danger' : 'badge-warning'}`}>{offer.status}</span></td>
              <td>{offer.created_at ? new Date(offer.created_at).toLocaleDateString() : '-'}</td>
              <td>
                <div className="flex gap-2">
                  <button className="btn-secondary text-sm" onClick={() => { setSelectedOffer(offer); setIsDetailModalOpen(true); }}>{t('view', 'عرض')}</button>
                  <button className="btn-primary text-sm" onClick={() => handleUpdateStatus(offer.id, prompt(t('new_status', 'New Status?'), offer.status) || offer.status)}>{t('edit_status', 'تعديل الحالة')}</button>
                  <button className="btn-danger text-sm" onClick={() => handleDelete(offer.id)}>{t('delete', 'حذف')}</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={t('offer_details', 'تفاصيل العرض')}>
        {selectedOffer && (
          <div className="space-y-4">
            <p><strong>{t('offer_number_prefix', 'رقم العرض:')}</strong> {selectedOffer.offer_code || selectedOffer.id}</p>
            <p><strong>{t('asset_prefix', 'الأصل:')}</strong> {selectedOffer.asset_code}</p>
            <p><strong>{t('timeline_prefix', 'السجل الزمني:')}</strong> {t('created', 'تم الإنشاء')} {'→'} {selectedOffer.status}</p>
            <div className="flex space-x-2 space-x-reverse mt-4">
              <button className="btn-success" onClick={() => { handleUpdateStatus(selectedOffer.id, 'ACCEPTED'); setIsDetailModalOpen(false); }}>{t('accept', 'قبول')}</button>
              <button className="btn-danger" onClick={() => { handleUpdateStatus(selectedOffer.id, 'REJECTED'); setIsDetailModalOpen(false); }}>{t('reject', 'رفض')}</button>
              <button className="btn-warning" onClick={() => { setIsDetailModalOpen(false); setIsNegotiationModalOpen(true); }}>{t('negotiate', 'تفاوض')}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title={t('new_offer', 'عرض جديد')}>
        <div className="space-y-4">
          <input className="input w-full" placeholder={t('asset_placeholder', 'الأصل')} value={newAsset} onChange={e => setNewAsset(e.target.value)} />
          <input className="input w-full" placeholder={t('price_placeholder', 'السعر')} type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
          <button className="btn-primary w-full" onClick={handleCreate}>{t('save_offer', 'حفظ العرض')}</button>
        </div>
      </Modal>

      <Modal isOpen={isNegotiationModalOpen} onClose={() => setIsNegotiationModalOpen(false)} title={t('start_negotiation', 'فتح تفاوض')}>
        <div className="space-y-4">
          <input className="input w-full" placeholder={t('price_placeholder', 'السعر')} type="number" value={negotiationPrice} onChange={e => setNegotiationPrice(e.target.value)} />
          <button className="btn-primary w-full" onClick={handleStartNegotiation}>{t('save_negotiation', 'حفظ التفاوض')}</button>
        </div>
      </Modal>
    </div>
  );
}

