import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { supabase } from '../supabase';

export default function AuctionsPage() {
  const { t } = useTranslation();
  const [auctions, setAuctions] = useState<any[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [newItem, setNewItem] = useState('');
  const [newStartPrice, setNewStartPrice] = useState('');
  const [newMinIncrement, setNewMinIncrement] = useState('');

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    const { data } = await supabase.from('auctions').select('*');
    if (data) setAuctions(data);
  };

  
  const handleDelete = async (id: any) => {
    const { error } = await supabase.from('auctions').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchAuctions();
  };

  const handleUpdateStatus = async (id: any, newStatus: string) => {
    const { error } = await supabase.from('auctions').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchAuctions();
  };

  const handleCreate = async () => {
    const { data, error } = await supabase.from('auctions').insert([{ asset_id: newItem, start_price: newStartPrice }]).select();
    if (error) { alert("Error: " + error.message); return; }
    if (data) {
      setIsNewModalOpen(false);
      fetchAuctions();
    }
  };

  return (
    <div dir="rtl" className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold johar-gold">{t('auctions', 'المزادات')}</h1>
        <button className="btn-primary" onClick={() => setIsNewModalOpen(true)}>+ {t('new_auction', 'مزاد جديد')}</button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-label">{t('active', 'نشط')}</div><div className="stat-value">5</div></div>
        <div className="stat-card"><div className="stat-label">{t('upcoming', 'قادم')}</div><div className="stat-value">3</div></div>
        <div className="stat-card"><div className="stat-label">{t('completed', 'مكتمل')}</div><div className="stat-value">42</div></div>
        <div className="stat-card"><div className="stat-label">{t('cancelled', 'ملغي')}</div><div className="stat-value">1</div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {auctions.map((auc) => (
          <div key={auc.id} className="card p-4">
            <div className="h-32 bg-gray-200 rounded mb-4 flex items-center justify-center text-gray-500">{t('item_image', 'صورة العنصر')}</div>
            <h3 className="font-bold text-lg mb-2">{auc.item}</h3>
            <p><strong>{t('start_price_prefix', 'سعر البداية:')}</strong> {auc.startPrice} $</p>
            <p><strong>{t('highest_bid_prefix', 'أعلى مزايدة:')}</strong> {auc.currentBid} $</p>
            <p><strong>{t('bidders_prefix', 'المزايدين:')}</strong> {auc.biddersCount}</p>
            <p className="text-red-500 font-bold mb-4">⏳ {auc.timer}</p>
            <div className="flex justify-between items-center">
              <span className={`badge ${auc.status === t('active', 'نشط') ? 'badge-success' : 'badge-info'}`}>{auc.status}</span>
              <button className="btn-secondary" onClick={() => { setSelectedAuction(auc); setIsDetailModalOpen(true); }}>{t('view_auction', 'عرض المزاد')}</button>
    <button className="btn-danger ml-2" onClick={() => handleDelete(auc.id)}>{t('delete', 'حذف')}</button>
    <button className="btn-primary ml-2" onClick={() => {
      const s = prompt(t('enter_status', 'أدخل الحالة الجديدة'));
      if(s) handleUpdateStatus(auc.id, s);
    }}>{t('update_status', 'تحديث الحالة')}</button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={t('auction_details', 'تفاصيل المزاد')}>
        {selectedAuction && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{selectedAuction.item}</h2>
            <table className="table w-full">
              <thead><tr><th>{t('bidder', 'المزايد')}</th><th>{t('amount', 'المبلغ')}</th><th>{t('time', 'الوقت')}</th></tr></thead>
              <tbody>
                <tr><td>{t('bidder_1', 'مزايد 1')}</td><td>{selectedAuction.currentBid} $</td><td>{t('now', 'الآن')}</td></tr>
                <tr><td>{t('bidder_2', 'مزايد 2')}</td><td>{selectedAuction.startPrice} $</td><td>{t('hour_ago', 'قبل ساعة')}</td></tr>
              </tbody>
            </table>
            <p><strong>{t('minimum_next_bid_prefix', 'أدنى مزايدة تالية:')}</strong> {(parseFloat(selectedAuction.currentBid) + 500).toFixed(2)} $</p>
            <div className="flex space-x-2 space-x-reverse">
              <input type="number" className="input flex-1" placeholder={t('amount_placeholder', 'المبلغ...')} />
              <button className="btn-primary" onClick={() => alert(t('bid_placed', 'تمت المزايدة'))}>{t('place_bid', 'المزايدة')}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title={t('new_auction', 'مزاد جديد')}>
        <div className="space-y-4">
          <input className="input w-full" placeholder={t('item_name', 'اسم العنصر')} value={newItem} onChange={e => setNewItem(e.target.value)} />
          <input className="input w-full" placeholder={t('start_price', 'سعر البداية')} type="number" value={newStartPrice} onChange={e => setNewStartPrice(e.target.value)} />
          <input className="input w-full" placeholder={t('min_increment', 'أدنى زيادة')} type="number" value={newMinIncrement} onChange={e => setNewMinIncrement(e.target.value)} />
          <input className="input w-full" type="datetime-local" />
          <button className="btn-primary w-full" onClick={handleCreate}>{t('create_auction', 'إنشاء المزاد')}</button>
        </div>
      </Modal>
    </div>
  );
}

