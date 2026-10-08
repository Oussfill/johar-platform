import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { supabase } from '../supabase';

export default function AIRiskPage() {
  const { t } = useTranslation();
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mockEntities, setMockEntities] = useState<any[]>([]);

  const fetchData = async () => {
    const { data } = await supabase.from('ai_risk_scores').select('*');
    if (data) setMockEntities(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('ai_risk_scores').update({ status: newStatus }).eq('id', id);
    if (error) { alert("Error: " + error.message); return; }
    fetchData();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('ai_risk_scores').delete().eq('id', id);
    if (error) { alert("Error: " + error.message); return; }
    fetchData();
    setIsModalOpen(false);
  };

  return (
    <div dir="rtl" className="p-6">
      <h1 className="text-2xl font-bold johar-gold mb-6">{t('ai_risk_assessment', 'تقييم المخاطر بالذكاء الاصطناعي')}</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-label">{t('average_risk', 'متوسط الخطر')}</div><div className="stat-value">34/100</div></div>
        <div className="stat-card"><div className="stat-label">{t('high_risk_entities', 'كيانات عالية الخطر')}</div><div className="stat-value">12</div></div>
        <div className="stat-card"><div className="stat-label">{t('new_assessments', 'تقييمات جديدة')}</div><div className="stat-value">45</div></div>
        <div className="stat-card"><div className="stat-label">{t('prediction_accuracy', 'دقة التنبؤ')}</div><div className="stat-value">91%</div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="col-span-1">
          <h2 className="text-xl font-bold mb-4">{t('risk_matrix', 'مصفوفة المخاطر')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-3 gap-1 h-64 text-center text-sm font-bold">
            <div className="bg-yellow-300 flex items-center justify-center">5</div>
            <div className="bg-orange-400 flex items-center justify-center">12</div>
            <div className="bg-red-500 flex items-center justify-center text-white">3</div>
            
            <div className="bg-green-300 flex items-center justify-center">18</div>
            <div className="bg-yellow-300 flex items-center justify-center">24</div>
            <div className="bg-orange-400 flex items-center justify-center">8</div>
            
            <div className="bg-green-400 flex items-center justify-center">45</div>
            <div className="bg-green-300 flex items-center justify-center">15</div>
            <div className="bg-yellow-300 flex items-center justify-center">4</div>
          </div>
        </div>

        <div className="col-span-2">
          <h2 className="text-xl font-bold mb-4">{t('entity_risk_scores', 'درجات مخاطر الكيانات')}</h2>
          <table className="table w-full">
            <thead><tr><th>{t('entity', 'الكيان')}</th><th>{t('score', 'الدرجة')}</th><th>{t('category', 'الفئة')}</th><th>{t('trend', 'الاتجاه')}</th><th>{t('risk_factors', 'عوامل الخطر')}</th><th>{t('action', 'إجراء')}</th></tr></thead>
            <tbody>
              {mockEntities.map(ent => (
                <tr key={ent.id}>
                  <td>{ent.name}</td>
                  <td className="font-bold">{ent.score}</td>
                  <td><span className={`badge ${ent.category === t('low', 'منخفض') ? 'badge-success' : ent.category === t('critical', 'حرج') ? 'badge-danger' : 'badge-warning'}`}>{ent.category}</span></td>
                  <td>{ent.trend}</td>
                  <td className="text-sm truncate max-w-xs">{ent.factors}</td>
                  <td><button className="btn-secondary text-sm" onClick={() => { setSelectedEntity(ent); setIsModalOpen(true); }}>{t('view_details', 'عرض التفاصيل')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('detailed_risk_profile', 'ملف المخاطر التفصيلي')}>
        {selectedEntity && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">{selectedEntity.name}</h3>
            <p><strong>{t('category', 'الفئة')}:</strong> {selectedEntity.category} ({selectedEntity.score}/100)</p>
            <p><strong>{t('key_contributing_factors', 'العوامل الرئيسية المساهمة')}:</strong></p>
            <ul className="list-disc list-inside">
              <li>{t('complex_ownership_structure', 'هيكلة ملكية معقدة')} (40%)</li>
              <li>{t('high_risk_geographic_location', 'موقع جغرافي عالي المخاطر')} (30%)</li>
              <li>{t('unjustified_transaction_volume', 'حجم معاملات غير مبرر')} (30%)</li>
            </ul>
            <p><strong>{t('recommended_action', 'الإجراء الموصى به')}:</strong> {t('recommended_action_desc', 'مراجعة معززة لـ KYC / حظر مؤقت للمعاملات الكبيرة.')}</p>
            <div className="flex space-x-2 space-x-reverse mt-4">
              <button className="btn-danger flex-1" onClick={() => handleUpdateStatus(selectedEntity.id, 'Action Applied')}>{t('apply_action', 'تطبيق الإجراء')}</button>
              <button className="btn-secondary flex-1" onClick={() => handleDelete(selectedEntity.id)}>{t('delete', 'حذف')}</button>
              <button className="btn-primary flex-1" onClick={() => setIsModalOpen(false)}>{t('close', 'إغلاق')}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

