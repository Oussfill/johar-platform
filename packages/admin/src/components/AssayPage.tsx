import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import Modal from './Modal';

export default function AssayPage() {
  const { t } = useTranslation();
  const [selectedAssay, setSelectedAssay] = useState<any>(null);

  const [assays, setAssays] = useState<any[]>([]);

  const fetchData = async () => {
    const { data } = await supabase.from('assay_results').select('*');
    if (data) setAssays(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: any) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('assay_results').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleUpdateStatus = async (id: any, newStatus: string) => {
    if (!newStatus) return;
    const { error } = await supabase.from('assay_results').update({ result: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  return (
    <div className="p-6 space-y-6 min-h-screen johar-black-lighter text-johar-gray-light" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gold-text">{t('assay_results', 'نتائج الفحوصات')}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card card">
          <div className="stat-label">{t('total_assays', 'إجمالي الفحوصات')}</div>
          <div className="stat-value">8,450</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('passed_this_month', 'ناجح (هذا الشهر)')}</div>
          <div className="stat-value text-johar-success">312</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('failed_this_month', 'فاشل (هذا الشهر)')}</div>
          <div className="stat-value text-johar-danger">14</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('under_testing', 'قيد الفحص')}</div>
          <div className="stat-value text-johar-warning">45</div>
        </div>
      </div>

      <div className="flex space-x-4 space-x-reverse mb-4">
        <select className="input w-48">
          <option>{t('all_results', 'كل النتائج')}</option>
          <option>{t('pass', 'ناجح')}</option>
          <option>{t('fail', 'فاشل')}</option>
        </select>
        <select className="input w-48">
          <option>{t('all_labs', 'كل المختبرات')}</option>
          <option>{t('dubai_lab', 'مختبر دبي')}</option>
          <option>London Assay</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full text-right">
          <thead>
            <tr className="border-b border-johar-gray-dark">
              <th className="p-4">{t('assay_id', 'رقم الفحص')}</th>
              <th className="p-4">{t('asset', 'الأصل')}</th>
              <th className="p-4">{t('lab', 'المختبر')}</th>
              <th className="p-4">{t('assay_type', 'نوع الفحص')}</th>
              <th className="p-4">{t('result', 'النتيجة')}</th>
              <th className="p-4">{t('purity', 'درجة النقاء')}</th>
              <th className="p-4">{t('date', 'التاريخ')}</th>
              <th className="p-4">{t('actions', 'إجراءات')}</th>
            </tr>
          </thead>
          <tbody>
            {assays.map((a) => (
              <tr key={a.id} className="border-b border-johar-gray-dark hover:bg-johar-gray-dark/50">
                <td className="p-4 font-mono">{a.id}</td>
                <td className="p-4">{a.asset_code}</td>
                <td className="p-4">{a.lab}</td>
                <td className="p-4">{a.test_type}</td>
                <td className="p-4">
                  <span className={`badge ${a.result === 'PASS' || a.result === t('pass', 'ناجح') ? 'badge-success' : 'badge-danger'}`}>
                    {a.result}
                  </span>
                </td>
                <td className="p-4 font-semibold">{a.purity}</td>
                <td className="p-4">{new Date(a.tested_at || a.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button className="btn-secondary text-sm py-1 px-3" onClick={() => setSelectedAssay(a)}>{t('view_report', 'عرض التقرير')}</button>
                    <button className="btn-primary text-sm py-1 px-3" onClick={() => handleUpdateStatus(a.id, prompt(t('new_status', 'New Status?'), a.result) || a.result)}>{t('edit_status', 'تعديل الحالة')}</button>
                    <button className="btn-danger text-sm py-1 px-3" onClick={() => handleDelete(a.id)}>{t('delete', 'حذف')}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!selectedAssay} onClose={() => setSelectedAssay(null)} title={t('lab_assay_report', 'تقرير الفحص المخبري')}>
        {selectedAssay && (
          <div className="bg-white text-black p-8 rounded border-8 border-double border-gray-300 relative print:m-0">
            <div className="text-center mb-6 border-b-2 border-gray-400 pb-4">
              <h1 className="text-3xl font-serif font-bold text-yellow-700">JOHAR ASSAY CERTIFICATE</h1>
              <p className="text-sm text-gray-500 mt-2">{selectedAssay.lab}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4 text-sm mb-6">
              <div><strong>{t('certificate_no', 'رقم الشهادة')}:</strong> {selectedAssay.id}</div>
              <div><strong>{t('date', 'التاريخ')}:</strong> {new Date(selectedAssay.tested_at || selectedAssay.created_at).toLocaleDateString()}</div>
              <div><strong>{t('asset_desc', 'وصف الأصل')}:</strong> {selectedAssay.asset_code}</div>
              <div><strong>{t('assay_type', 'نوع الفحص')}:</strong> {selectedAssay.test_type}</div>
            </div>

            <table className="w-full text-left border-collapse mb-6 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">{t('element', 'العنصر')}</th>
                  <th className="border p-2">{t('result', 'النتيجة')}</th>
                  <th className="border p-2">{t('allowed_standards', 'المعايير المسموحة')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2">{t('gold_au', 'الذهب (Au)')}</td>
                  <td className="border p-2 font-bold">{selectedAssay.purity}</td>
                  <td className="border p-2">&ge; 99.5%</td>
                </tr>
                <tr>
                  <td className="border p-2">{t('silver_ag', 'الفضة (Ag)')}</td>
                  <td className="border p-2">0.005%</td>
                  <td className="border p-2">-</td>
                </tr>
                <tr>
                  <td className="border p-2">{t('copper_cu', 'النحاس (Cu)')}</td>
                  <td className="border p-2">0.002%</td>
                  <td className="border p-2">-</td>
                </tr>
              </tbody>
            </table>

            <div className="mb-8">
              <strong className="block mb-1">{t('conclusion', 'الخلاصة')}:</strong>
              <p className={`p-2 border rounded ${selectedAssay.result === 'PASS' || selectedAssay.result === t('pass', 'ناجح') ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
                {selectedAssay.result === 'PASS' || selectedAssay.result === t('pass', 'ناجح') ? t('sample_meets_standards', 'العينة مطابقة لمعايير النقاء العالمية.') : t('sample_fails_standards', 'العينة غير مطابقة لمعايير النقاء المطلوبة.')}
              </p>
            </div>

            <div className="flex justify-between items-end mt-12 pt-4 border-t border-gray-300">
              <div className="text-center w-40 border-t border-black pt-2">
                {t('assayer_signature', 'توقيع الفاحص')}
              </div>
              <div className="w-24 h-24 border-4 border-yellow-600 rounded-full flex items-center justify-center text-yellow-600 font-bold opacity-50 transform -rotate-12">
                {t('lab_stamp_1', 'ختم')}<br/>{t('lab_stamp_2', 'المختبر')}
              </div>
            </div>

            <button className="absolute top-4 left-4 btn-primary text-xs print:hidden" onClick={() => window.print()}>{t('print', 'طباعة')}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

