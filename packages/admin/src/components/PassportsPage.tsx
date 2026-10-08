import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import Modal from './Modal';

export default function PassportsPage() {
  const { t } = useTranslation();
  const [selectedPassport, setSelectedPassport] = useState<any>(null);

  const [passports, setPassports] = useState<any[]>([]);

  const fetchData = () => {
    supabase.from('johar_passports').select('*').then(({ data }) => {
      if (data) setPassports(data);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('johar_passports').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('johar_passports').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  return (
    <div className="p-6 space-y-6 min-h-screen johar-black-lighter text-johar-gray-light" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gold-text">{t('digital_passports_title', 'الجوازات الرقمية')}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card card">
          <div className="stat-label">{t('total_passports', 'إجمالي الجوازات')}</div>
          <div className="stat-value">12,500</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('active', 'نشط')}</div>
          <div className="stat-value text-johar-success">11,800</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('transfers_this_month', 'نقل ملكية هذا الشهر')}</div>
          <div className="stat-value">450</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('cancelled_melted_stat', 'مُلغى / مُذاب')}</div>
          <div className="stat-value text-johar-danger">250</div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full text-right">
          <thead>
            <tr className="border-b border-johar-gray-dark">
              <th className="p-4">{t('passport_number', 'رقم الجواز')}</th>
              <th className="p-4">{t('linked_asset', 'الأصل المرتبط')}</th>
              <th className="p-4">{t('issue_date', 'تاريخ الإصدار')}</th>
              <th className="p-4">{t('last_updated', 'آخر تحديث')}</th>
              <th className="p-4">{t('ownership_transfers', 'نقلات الملكية')}</th>
              <th className="p-4">{t('status', 'الحالة')}</th>
              <th className="p-4">{t('actions', 'إجراءات')}</th>
            </tr>
          </thead>
          <tbody>
            {passports.map((p) => (
              <tr key={p.id} className="border-b border-johar-gray-dark hover:bg-johar-gray-dark/50">
                <td className="p-4 font-mono text-johar-gold">{p.id}</td>
                <td className="p-4">{p.asset}</td>
                <td className="p-4">{p.issued}</td>
                <td className="p-4">{p.updated}</td>
                <td className="p-4">{p.transfers}</td>
                <td className="p-4">
                  <span className={`badge ${p.status?.includes?.(t('active', 'نشط')) ? 'badge-success' : p.status?.includes?.(t('cancelled_melted', 'ملغي')) ? 'badge-danger' : 'badge-warning'}`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-4 space-x-2 space-x-reverse">
                  <button className="btn-secondary text-sm py-1 px-3" onClick={() => setSelectedPassport(p)}>{t('view_passport', 'عرض الجواز')}</button>
                  <button className="btn-secondary text-sm py-1 px-3" onClick={() => {
                    const newStatus = prompt("Enter new status:", p.status);
                    if (newStatus) handleUpdateStatus(p.id, newStatus);
                  }}>{t('edit_status', 'تعديل الحالة')}</button>
                  <button className="btn-danger text-sm py-1 px-3" onClick={() => handleDelete(p.id)}>{t('delete', 'حذف')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!selectedPassport} onClose={() => setSelectedPassport(null)} title={t('digital_passport_for_asset', 'الجواز الرقمي للأصل')}>
        {selectedPassport && (
          <div className="bg-gradient-to-br from-johar-black to-johar-gray-dark p-6 rounded-lg border border-johar-gold shadow-2xl">
            <div className="flex justify-between items-start border-b border-johar-gold pb-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-johar-gold">JOHAR Digital Passport</h2>
                <div className="font-mono mt-1">{selectedPassport.id}</div>
              </div>
              <div className="w-20 h-20 bg-white rounded flex justify-center items-center">
                <span className="text-black text-xs font-mono text-center">QR<br/>{selectedPassport.id}</span>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="w-1/3 h-40 bg-johar-black-lighter rounded border border-johar-gray-dark flex items-center justify-center">
                <span className="text-johar-gray-mid">{t('asset_image', 'صورة الأصل')}</span>
              </div>
              <div className="w-2/3 space-y-2 text-sm">
                <div className="flex justify-between border-b border-johar-gray-dark pb-1">
                  <span className="text-johar-gray-mid">{t('description', 'الوصف')}</span>
                  <span className="font-semibold">{selectedPassport.asset}</span>
                </div>
                <div className="flex justify-between border-b border-johar-gray-dark pb-1">
                  <span className="text-johar-gray-mid">{t('net_weight', 'الوزن الصافي')}</span>
                  <span className="font-semibold">1000g</span>
                </div>
                <div className="flex justify-between border-b border-johar-gray-dark pb-1">
                  <span className="text-johar-gray-mid">{t('purity_grade', 'درجة النقاء')}</span>
                  <span className="font-semibold">99.99% (24K)</span>
                </div>
                <div className="flex justify-between border-b border-johar-gray-dark pb-1">
                  <span className="text-johar-gray-mid">{t('manufacturer', 'الشركة المصنعة')}</span>
                  <span className="font-semibold">Swiss Valcambi</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-johar-gold font-semibold border-b border-johar-gray-dark pb-1 mb-2">{t('lab_certificates', 'الشهادات المخبرية')}</h3>
                <ul className="text-sm space-y-1">
                  <li>✅ {t('purity_certificate', 'شهادة نقاوة - مختبر دبي (2023-01-05)')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-johar-gold font-semibold border-b border-johar-gray-dark pb-1 mb-2">{t('ownership_history', 'سجل الملكية (Timeline)')}</h3>
                <div className="text-sm space-y-2 border-r-2 border-johar-gold pr-4">
                  <div className="relative">
                    <div className="absolute -right-[21px] w-3 h-3 rounded-full bg-johar-gold"></div>
                    <span className="text-johar-gray-mid mr-2">{selectedPassport.updated}</span> - {t('transfer_to_private_investor', 'نقل ملكية إلى (مستثمر خاص)')}
                  </div>
                  <div className="relative">
                    <div className="absolute -right-[21px] w-3 h-3 rounded-full bg-johar-gray-mid"></div>
                    <span className="text-johar-gray-mid mr-2">{selectedPassport.issued}</span> - {t('initial_issuance', 'الإصدار الأولي (مصنع التكرير)')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

