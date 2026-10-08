import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import LabsPage from './LabsPage';

export default function LabPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(t('lab_requests', 'طلبات الفحص'));
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    const { data } = await supabase!.from('lab_tests').select('*, profiles(full_name)').order('created_at', { ascending: false });
    if (data) setTests(data);
    setLoading(false);
  };

  const handleCompleteTest = async (id: string, asset_id: string, passed: boolean) => {
    const { error } = await supabase!.from('lab_tests').update({ status: 'COMPLETED', passed, completed_at: new Date() }).eq('id', id);
    if (!error) {
      await supabase!.from('assets').update({ status: passed ? 'VERIFIED' : 'REJECTED' }).eq('id', asset_id);
      fetchTests();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t('lab_management', 'إدارة المختبرات')}</h2>
      
      <div className="flex gap-4 mb-6 border-b border-johar-gray-dark">
        {[t('lab_requests', 'طلبات الفحص'), t('approved_labs', 'المختبرات المعتمدة')].map(tab => (
          <button key={tab} className={`pb-2 px-4 ${activeTab === tab ? 'text-johar-gold border-b-2 border-johar-gold font-bold' : 'text-johar-gray-light hover:text-white'}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === t('lab_requests', 'طلبات الفحص') && (
        <div className="card overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>الأصل</th>
                <th>طالب الفحص</th>
                <th>نوع الفحص</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th>النتيجة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-4">جاري التحميل...</td></tr> : tests.map(t => (
                <tr key={t.id}>
                  <td className="font-mono text-sm">{t.asset_code}</td>
                  <td>{t.profiles?.full_name || 'غير معروف'}</td>
                  <td>{t.test_type === 'PURITY' ? 'فحص نقاء' : 'توثيق Johar ID'}</td>
                  <td><span className={`badge ${t.status === 'REQUESTED' ? 'badge-warning' : 'badge-success'}`}>{t.status}</span></td>
                  <td>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td>{t.status === 'COMPLETED' ? (t.passed ? '✓ مطابق' : '✗ غير مطابق') : '-'}</td>
                  <td>
                    {t.status === 'REQUESTED' && (
                      <div className="flex gap-2">
                        <button className="text-johar-success hover:underline text-sm" onClick={() => handleCompleteTest(t.id, t.asset_id, true)}>تأكيد المطابقة</button>
                        <button className="text-johar-danger hover:underline text-sm" onClick={() => handleCompleteTest(t.id, t.asset_id, false)}>رفض</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {activeTab === t('approved_labs', 'المختبرات المعتمدة') && (
        <LabsPage />
      )}
    </div>
  );
}
