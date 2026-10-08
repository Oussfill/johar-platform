import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { supabase } from '../supabase';

export default function AIFraudPage() {
  const { t } = useTranslation();
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mockAlerts, setMockAlerts] = useState<any[]>([]);

  const fetchData = async () => {
    const { data } = await supabase.from('ai_fraud_alerts').select('*');
    if (data) setMockAlerts(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getScoreColor = (score: number) => score > 80 ? 'text-red-500' : score > 50 ? 'text-yellow-500' : 'text-green-500';

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('ai_fraud_alerts').update({ status: newStatus }).eq('id', id);
    if (error) { alert("Error: " + error.message); return; }
    fetchData();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('ai_fraud_alerts').delete().eq('id', id);
    if (error) { alert("Error: " + error.message); return; }
    fetchData();
    setIsModalOpen(false);
  };

  return (
    <div dir="rtl" className="p-6">
      <h1 className="text-2xl font-bold johar-gold mb-6">{t('ai_fraud_detection', 'كشف الاحتيال بالذكاء الاصطناعي')}</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-label">{t('incidents_detected', 'حوادث مكتشفة')}</div><div className="stat-value text-red-500">24</div></div>
        <div className="stat-card"><div className="stat-label">{t('false_positives', 'خطأ إيجابي')}</div><div className="stat-value">5</div></div>
        <div className="stat-card"><div className="stat-label">{t('model_accuracy', 'دقة النموذج')}</div><div className="stat-value">98.5%</div></div>
        <div className="stat-card"><div className="stat-label">{t('saved_amount', 'موفّر')}</div><div className="stat-value">150,000 $</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-xl font-bold mb-4">{t('suspicious_transaction_alerts', 'تنبيهات المعاملات المشبوهة')}</h2>
          <div className="space-y-4">
            {mockAlerts.map(alt => (
              <div key={alt.id} className="card p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold">{alt.entity} - {alt.id}</p>
                  <p className="text-sm">{t('amount', 'المبلغ')}: {alt.amount} $</p>
                  <p className="text-sm text-gray-500">{alt.reason}</p>
                </div>
                <div className="text-center">
                  <p className={`font-bold text-2xl ${getScoreColor(alt.score)}`}>{alt.score}%</p>
                  <button className="btn-secondary text-sm mt-2" onClick={() => { setSelectedAlert(alt); setIsModalOpen(true); }}>{t('review', 'مراجعة')}</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">{t('risk_heatmap', 'خريطة المخاطر الحرارية (Heatmap)')}</h2>
          <table className="table w-full text-center">
            <thead><tr><th>{t('time_day', 'الوقت / اليوم')}</th><th>{t('saturday', 'السبت')}</th><th>{t('sunday', 'الأحد')}</th><th>{t('monday', 'الإثنين')}</th></tr></thead>
            <tbody>
              <tr><td>{t('morning', 'الصباح')}</td><td className="bg-green-200">{t('low', 'منخفض')}</td><td className="bg-yellow-200">{t('medium', 'متوسط')}</td><td className="bg-green-200">{t('low', 'منخفض')}</td></tr>
              <tr><td>{t('evening', 'المساء')}</td><td className="bg-red-200">{t('high', 'عالي')}</td><td className="bg-yellow-200">{t('medium', 'متوسط')}</td><td className="bg-green-200">{t('low', 'منخفض')}</td></tr>
              <tr><td>{t('night', 'الليل')}</td><td className="bg-red-500 text-white">{t('critical', 'حرج')}</td><td className="bg-red-200">{t('high', 'عالي')}</td><td className="bg-yellow-200">{t('medium', 'متوسط')}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('fraud_review', 'مراجعة الاحتيال')}>
        {selectedAlert && (
          <div className="space-y-4">
            <p><strong>{t('transaction', 'المعاملة')}:</strong> {selectedAlert.id}</p>
            <p><strong>{t('ai_explanation', 'تفسير الذكاء الاصطناعي')}:</strong> {t('ai_explanation_desc', 'تم اكتشاف نمط مشابه لحالة احتيال سابقة (FRD-092) حيث تم تقسيم مبلغ كبير إلى تحويلات صغيرة متتالية.')}</p>
            <p><strong>{t('risk_score', 'درجة الخطر')}:</strong> <span className={getScoreColor(selectedAlert.score)}>{selectedAlert.score}%</span></p>
            <div className="flex space-x-2 space-x-reverse mt-4">
              <button className="btn-danger flex-1" onClick={() => handleUpdateStatus(selectedAlert.id, 'Confirmed')}>{t('confirm_fraud', 'تأكيد احتيال')}</button>
              <button className="btn-success flex-1" onClick={() => handleUpdateStatus(selectedAlert.id, 'Dismissed')}>{t('dismiss_alert', 'رفض التنبيه')}</button>
              <button className="btn-secondary flex-1" onClick={() => handleDelete(selectedAlert.id)}>{t('delete', 'حذف')}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

