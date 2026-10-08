import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import Modal from './Modal';

export default function WarehousesPage() {
  const { t } = useTranslation();
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [warehouses, setWarehouses] = useState<any[]>([]);

  const fetchData = async () => {
    const { data } = await supabase.from('warehouses').select('*');
    if (data) setWarehouses(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newWh = {
      name: formData.get('name'),
      location: formData.get('location'),
      capacity: formData.get('capacity'),
      status: formData.get('status'),
      manager: formData.get('manager')
    };
    const { error } = await supabase.from('warehouses').insert([newWh]);
    if (error) alert("Error: " + error.message);
    else {
      setIsAddModalOpen(false);
      fetchData();
    }
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('warehouses').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleUpdateStatus = async (id: any, newStatus: string) => {
    if (!newStatus) return;
    const { error } = await supabase.from('warehouses').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  return (
    <div className="p-6 space-y-6 min-h-screen johar-black-lighter text-johar-gray-light" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gold-text">{t('warehouses', 'المستودعات')}</h1>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>{t('add_warehouse', 'إضافة مستودع')}</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card card">
          <div className="stat-label">{t('total_warehouses', 'إجمالي المستودعات')}</div>
          <div className="stat-value">6</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('total_capacity', 'السعة الإجمالية')}</div>
          <div className="stat-value text-johar-gold">{t('kg_28500', '28,500 كجم')}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('occupied_space', 'المساحة المشغولة')}</div>
          <div className="stat-value">{t('kg_16550', '16,550 كجم')}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('total_stored_value', 'إجمالي القيمة المخزنة')}</div>
          <div className="stat-value text-johar-success">$6.82B</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {warehouses.map(wh => {
          const percentUsed = (wh.used / wh.capacity) * 100;
          return (
            <div key={wh.id} className="card p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-johar-gold">{wh.name}</h3>
                  <div className="text-johar-gray-mid">📍 {wh.location}</div>
                </div>
                <span className={`badge ${percentUsed > 90 ? 'badge-danger' : percentUsed > 75 ? 'badge-warning' : 'badge-success'}`}>
                  {wh.status}
                </span>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t('occupied_capacity', 'السعة المشغولة')}: {wh.used} / {wh.capacity} {t('kg', 'كجم')}</span>
                  <span>{percentUsed.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-johar-gray-dark rounded-full h-3">
                  <div className={`h-3 rounded-full ${percentUsed > 90 ? 'bg-johar-danger' : 'bg-johar-gold'}`} style={{ width: `${percentUsed}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm mt-4 bg-johar-black p-3 rounded">
                <div><span className="block text-johar-gray-mid text-xs">{t('stored_value', 'القيمة المخزنة')}</span>{wh.value}</div>
                <div><span className="block text-johar-gray-mid text-xs">{t('warehouse_manager', 'مدير المستودع')}</span>{wh.manager}</div>
                <div><span className="block text-johar-gray-mid text-xs">{t('last_security_inspection', 'آخر فحص أمني')}</span>{wh.lastInspection}</div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button className="btn-secondary flex-1" onClick={() => setSelectedWarehouse(wh)}>{t('view_details', 'عرض التفاصيل')}</button>
                <button className="btn-primary flex-1">{t('schedule_inspection', 'جدولة فحص')}</button>
                <button className="btn-primary flex-1 text-sm" onClick={() => handleUpdateStatus(wh.id, prompt(t('new_status', 'New Status?'), wh.status) || wh.status)}>{t('edit_status', 'تعديل الحالة')}</button>
                <button className="btn-danger flex-1 text-sm" onClick={() => handleDelete(wh.id)}>{t('delete', 'حذف')}</button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={!!selectedWarehouse} onClose={() => setSelectedWarehouse(null)} title={t('warehouse_details', 'تفاصيل المستودع')}>
        {selectedWarehouse && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-johar-gold">{selectedWarehouse.name}</h2>
            
            <div>
              <h4 className="font-semibold mb-3">{t('asset_distribution_by_weight', 'توزيع الأصول (بالوزن)')}</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="flex justify-between mb-1"><span>{t('gold', 'ذهب')}</span><span>70%</span></div>
                  <div className="w-full bg-johar-gray-dark rounded h-1"><div className="bg-yellow-500 h-1 rounded" style={{ width: '70%' }}></div></div>
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span>{t('silver', 'فضة')}</span><span>25%</span></div>
                  <div className="w-full bg-johar-gray-dark rounded h-1"><div className="bg-gray-400 h-1 rounded" style={{ width: '25%' }}></div></div>
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span>{t('platinum', 'بلاتين')}</span><span>5%</span></div>
                  <div className="w-full bg-johar-gray-dark rounded h-1"><div className="bg-slate-300 h-1 rounded" style={{ width: '5%' }}></div></div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{t('largest_stored_assets', 'أكبر الأصول المخزنة')}</h4>
              <ul className="text-sm border border-johar-gray-dark rounded divide-y divide-johar-gray-dark">
                <li className="p-2 flex justify-between"><span>INV-G-1001 ({t('gold_bar_10kg', 'سبيكة ذهب 10 كجم')})</span><span className="text-johar-gold">{t('gulf_bank', 'بنك الخليج')}</span></li>
                <li className="p-2 flex justify-between"><span>INV-G-1002 ({t('gold_bar_5kg', 'سبيكة ذهب 5 كجم')})</span><span className="text-johar-gold">{t('noor_jewelry', 'مجوهرات النور')}</span></li>
                <li className="p-2 flex justify-between"><span>INV-P-500 ({t('platinum_2kg', 'بلاتين 2 كجم')})</span><span className="text-johar-gold">{t('investment_fund', 'صندوق استثماري')}</span></li>
              </ul>
            </div>

                <div className="bg-johar-black p-3 rounded">
              <h4 className="font-semibold mb-1">{t('upcoming_inspections', 'الفحوصات القادمة')}</h4>
              <div className="text-sm text-johar-gray-mid">{t('security_inspection_scheduled_for', 'فحص أمني وجرد دوري مجدول بتاريخ:')} <span className="text-white">2023-11-01</span></div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('add_warehouse', 'إضافة مستودع')}>
        <form className="space-y-4" onSubmit={handleAddWarehouse}>
          <div>
            <label className="block mb-1 text-sm">{t('warehouse_name', 'اسم المستودع')}</label>
            <input name="name" type="text" required className="input w-full" />
          </div>
          <div>
            <label className="block mb-1 text-sm">{t('location', 'الموقع')}</label>
            <input name="location" type="text" required className="input w-full" />
          </div>
          <div>
            <label className="block mb-1 text-sm">{t('capacity', 'السعة')}</label>
            <input name="capacity" type="number" required className="input w-full" />
          </div>
          <div>
            <label className="block mb-1 text-sm">{t('status', 'الحالة')}</label>
            <select name="status" className="input w-full">
              <option value="ACTIVE">ACTIVE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm">{t('manager', 'المدير')}</label>
            <input name="manager" type="text" className="input w-full" />
          </div>
          <div className="flex justify-end mt-4">
            <button type="submit" className="btn-primary">{t('save', 'حفظ')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

