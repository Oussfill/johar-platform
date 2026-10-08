import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { supabase } from '../supabase';
import NegotiationsPage from './NegotiationsPage';

export default function MarketplacePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(t('offers', 'العروض'));
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    const { data } = await supabase!.from('marketplace_offers').select('*, profiles!seller_id(full_name)').order('created_at', { ascending: false });
    if (data) setOffers(data);
    setLoading(false);
  };

  const handleUpdateOffer = async (id: string, newStatus: string) => {
    const { error } = await supabase!.from('marketplace_offers').update({ status: newStatus }).eq('id', id);
    if (!error) fetchOffers();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t('marketplace', 'السوق')}</h2>
      
      <div className="flex gap-4 mb-6 border-b border-johar-gray-dark">
        {[t('offers', 'العروض'), t('negotiations', 'التفاوض')].map(tab => (
          <button key={tab} className={`pb-2 px-4 ${activeTab === tab ? 'text-johar-gold border-b-2 border-johar-gold font-bold' : 'text-johar-gray-light hover:text-white'}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === t('offers', 'العروض') && (
        <div className="card overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>معرف العرض</th>
                <th>الأصل</th>
                <th>النوع</th>
                <th>السعر</th>
                <th>البائع</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="text-center py-4">جاري التحميل...</td></tr> : offers.map(o => (
                <tr key={o.id}>
                  <td className="font-mono text-sm">{o.offer_code}</td>
                  <td>{o.asset_code}</td>
                  <td>{o.type === 'SELL' ? 'بيع' : 'شراء'}</td>
                  <td>${o.asking_price}</td>
                  <td>{o.profiles?.full_name || 'غير معروف'}</td>
                  <td><span className={`badge ${o.status === 'OPEN' ? 'badge-success' : 'badge-warning'}`}>{o.status}</span></td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>
                    {o.status === 'OPEN' && (
                      <div className="flex gap-2">
                        <button className="text-johar-success hover:underline text-sm" onClick={() => handleUpdateOffer(o.id, 'ACCEPTED')}>قبول</button>
                        <button className="text-johar-danger hover:underline text-sm" onClick={() => handleUpdateOffer(o.id, 'REJECTED')}>رفض</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {activeTab === t('negotiations', 'التفاوض') && (
        <NegotiationsPage />
      )}
    </div>
  );
}

