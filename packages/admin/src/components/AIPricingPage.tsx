import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { supabase } from '../supabase';

export default function AIPricingPage() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [mockPrices, setMockPrices] = useState<any[]>([]);
  const [newAsset, setNewAsset] = useState('');
  const [newTimeframe, setNewTimeframe] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('ai_pricing').select('*');
    if (data) setMockPrices(data);
  };

  
  const handleDelete = async (id: any) => {
    const { error } = await supabase.from('ai_pricing').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleUpdateStatus = async (id: any, newStatus: string) => {
    const { error } = await supabase.from('ai_pricing').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleCreate = async () => {
    const { data, error } = await supabase.from('ai_pricing').insert([{ asset_type: newAsset || t('ai_gold', 'Ø°Ù‡Ø¨'), predicted_price: newTimeframe || t('ai_7_days', '7 Ø£ÙŠØ§Ù…'), confidence: 95 }]).select();
    if (error) { alert("Error: " + error.message); return; }
    if (data) {
      alert(t('ai_analysis_started', 'ØªÙ… ØªØ´ØºÙŠÙ„ Ø§Ù„ØªØ­Ù„ÙŠÙ„ Ø¨Ù†Ø¬Ø§Ø­'));
      setIsModalOpen(false);
      setNewAsset('');
      setNewTimeframe('');
      fetchData();
    }
  };

  return (
    <div dir="rtl" className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold johar-gold">{t('ai_pricing_title', 'ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø£Ø³Ø¹Ø§Ø± Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ')}</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>{t('ai_run_new_analysis', 'ØªØ´ØºÙŠÙ„ ØªØ­Ù„ÙŠÙ„ Ø¬Ø¯ÙŠØ¯')}</button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-label">{t('ai_model_accuracy', 'Ø¯Ù‚Ø© Ø§Ù„Ù†Ù…ÙˆØ°Ø¬')}</div><div className="stat-value">94.2%</div></div>
        <div className="stat-card"><div className="stat-label">{t('ai_todays_analysis', 'ØªØ­Ù„ÙŠÙ„Ø§Øª Ø§Ù„ÙŠÙˆÙ…')}</div><div className="stat-value">1,204</div></div>
        <div className="stat-card"><div className="stat-label">{t('ai_estimated_savings', 'ØªÙˆÙÙŠØ± Ù‚Ø¯Ø±Ù‡')}</div><div className="stat-value">25,000 $</div></div>
        <div className="stat-card"><div className="stat-label">{t('ai_active_predictions', 'Ø§Ù„ØªÙ†Ø¨Ø¤Ø§Øª Ø§Ù„Ù†Ø´Ø·Ø©')}</div><div className="stat-value">34</div></div>
      </div>

      <div className="bg-gray-900 text-white p-4 rounded mb-6 flex justify-between items-center">
        <div><span className="text-gray-400 text-sm block">GOLD/USD</span><span className="text-xl font-bold">1,950.40 <span className="text-green-500">â†‘ 1.2%</span></span></div>
        <div><span className="text-gray-400 text-sm block">GOLD/AED</span><span className="text-xl font-bold">7,163.80 <span className="text-green-500">â†‘ 1.2%</span></span></div>
        <div><span className="text-gray-400 text-sm block">GOLD/SAR</span><span className="text-xl font-bold">7,314.50 <span className="text-green-500">â†‘ 1.2%</span></span></div>
      </div>

      <h2 className="text-xl font-bold mb-4">{t('ai_price_predictions', 'ØªÙ†Ø¨Ø¤Ø§Øª Ø§Ù„Ø£Ø³Ø¹Ø§Ø±')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {mockPrices.map((p, i) => (
          <div key={p.id || i} className="card p-4">
            <h3 className="font-bold text-lg mb-2">{p.asset}</h3>
            <p><strong>{t('ai_current_price', 'Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ø­Ø§Ù„ÙŠ:')}</strong> {p.current} $</p>
            <p><strong>{t('ai_pred_7_days', 'ØªÙ†Ø¨Ø¤ 7 Ø£ÙŠØ§Ù…:')}</strong> {p.pred7} $</p>
            <p><strong>{t('ai_pred_30_days', 'ØªÙ†Ø¨Ø¤ 30 ÙŠÙˆÙ…:')}</strong> {p.pred30} $</p>
            <p><strong>{t('ai_confidence_level', 'Ù†Ø³Ø¨Ø© Ø§Ù„Ø«Ù‚Ø©:')}</strong> {p.conf}%</p>
            <div className="mt-4 h-10 w-full border-b-2 border-l-2 border-gray-300 relative flex items-end">
              <svg viewBox="0 0 100 40" className="w-full h-full stroke-current text-blue-500 fill-none" strokeWidth="2">
                <polyline points={`0,30 50,20 100,${p.conf > 90 ? 10 : 35}`} />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('ai_new_analysis_modal', 'ØªØ­Ù„ÙŠÙ„ Ø¬Ø¯ÙŠØ¯')}>
        <div className="space-y-4">
          <select className="input w-full" value={newAsset} onChange={(e) => setNewAsset(e.target.value)}><option value="">{t('ai_gold', 'Ø°Ù‡Ø¨')}</option><option value={t('ai_diamond', 'Ø£Ù„Ù…Ø§Ø³')}>{t('ai_diamond', 'Ø£Ù„Ù…Ø§Ø³')}</option></select>
          <select className="input w-full" value={newTimeframe} onChange={(e) => setNewTimeframe(e.target.value)}><option value="">{t('ai_7_days', '7 Ø£ÙŠØ§Ù…')}</option><option value={t('ai_30_days', '30 ÙŠÙˆÙ…')}>{t('ai_30_days', '30 ÙŠÙˆÙ…')}</option></select>
          <button className="btn-primary w-full" onClick={handleCreate}>{t('ai_run_btn', 'ØªØ´ØºÙŠÙ„')}</button>
        </div>
      </Modal>
    </div>
  );
}




