import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import Modal from './Modal';

export default function EquipmentPage() {
  const { t } = useTranslation();
  const [selectedEq, setSelectedEq] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [equipment, setEquipment] = useState<any[]>([]);
  const [labsList, setLabsList] = useState<any[]>([]);

  const fetchData = async () => {
    const { data } = await supabase.from('equipment').select('*');
    if (data) setEquipment(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newEq = {
      name: formData.get('name'),
      model: formData.get('model'),
      lab: formData.get('lab'),
      status: formData.get('status'),
      last_cal: formData.get('last_cal'),
      next_maint: formData.get('next_maint')
    };
    const { error } = await supabase.from('equipment').insert([newEq]);
    if (error) alert("Error: " + error.message);
    else {
      setIsAddModalOpen(false);
      fetchData();
    }
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('equipment').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleUpdateStatus = async (id: any, newStatus: string) => {
    if (!newStatus) return;
    const { error } = await supabase.from('equipment').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  return (
    <div className="p-6 space-y-6 min-h-screen johar-black-lighter text-johar-gray-light" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gold-text">{t('equipment_and_tools', 'الأجهزة والمعدات')}</h1>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>{t('add_equipment', 'إضافة جهاز')}</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card card">
          <div className="stat-label">{t('total_equipment', 'إجمالي الأجهزة')}</div>
          <div className="stat-value">12</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('working', 'يعمل')}</div>
          <div className="stat-value text-johar-success">9</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('maintenance', 'صيانة')}</div>
          <div className="stat-value text-johar-warning">2</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('broken', 'معطل')}</div>
          <div className="stat-value text-johar-danger">1</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {equipment.map(eq => (
          <div key={eq.id} className="card p-4 space-y-3">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-johar-gold">{eq.name}</h3>
              <span className={`badge ${eq.status === t('working', 'يعمل') ? 'badge-success' : eq.status === t('maintenance', 'صيانة') ? 'badge-warning' : 'badge-danger'}`}>
                {eq.status}
              </span>
            </div>
            <div className="text-sm text-johar-gray-mid">{eq.model}</div>
            <div className="text-sm font-semibold">{t('location', 'الموقع')}: {eq.lab}</div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-sm mt-4 border-t border-johar-gray-dark pt-2">
              <div>
                <span className="block text-xs text-johar-gray-mid">{t('last_calibration', 'آخر معايرة')}</span>
                {eq.last_cal}
              </div>
              <div>
                <span className="block text-xs text-johar-gray-mid">{t('next_maintenance', 'الصيانة القادمة')}</span>
                <span className={new Date(eq.next_maint) < new Date() ? 'text-johar-danger' : ''}>{eq.next_maint}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              <button className="btn-primary flex-1 text-sm" onClick={() => setSelectedEq(eq)}>{t('schedule_maintenance', 'جدولة صيانة')}</button>
              <button className="btn-secondary flex-1 text-sm">{t('view_log', 'عرض السجل')}</button>
              <button className="btn-primary flex-1 text-sm" onClick={() => handleUpdateStatus(eq.id, prompt(t('new_status', 'New Status?'), eq.status) || eq.status)}>{t('edit_status', 'تعديل الحالة')}</button>
              <button className="btn-danger flex-1 text-sm" onClick={() => handleDelete(eq.id)}>{t('delete', 'حذف')}</button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!selectedEq} onClose={() => setSelectedEq(null)} title={t('schedule_maintenance_modal', 'جدولة صيانة للمعدات')}>
        {selectedEq && (
          <form className="space-y-4">
            <div className="bg-johar-gray-dark p-3 rounded mb-4">
              <strong>{t('equipment', 'الجهاز')}:</strong> {selectedEq.name} - {selectedEq.model}<br/>
              <strong>{t('location', 'الموقع')}:</strong> {selectedEq.lab}
            </div>

            <div>
              <label className="block mb-1 text-sm">{t('maintenance_type', 'نوع الصيانة')}</label>
              <select className="input w-full">
                <option>{t('periodic_maintenance', 'صيانة دورية')}</option>
                <option>{t('repair_fault', 'إصلاح عطل')}</option>
                <option>{t('calibration', 'معايرة')}</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm">{t('scheduled_date', 'التاريخ المجدول')}</label>
              <input type="date" className="input w-full" defaultValue={selectedEq.next_maint} />
            </div>

            <div>
              <label className="block mb-1 text-sm">{t('technician_name', 'اسم الفني')}</label>
              <input type="text" className="input w-full" placeholder={t('enter_technician_name', 'أدخل اسم الفني المسؤول')} />
            </div>

            <div>
              <label className="block mb-1 text-sm">{t('notes', 'ملاحظات')}</label>
              <textarea className="input w-full h-24" placeholder={t('maintenance_details_placeholder', 'تفاصيل الصيانة المطلوبة...')}></textarea>
            </div>

            <div className="flex justify-end mt-4">
              <button type="button" className="btn-primary" onClick={() => setSelectedEq(null)}>{t('confirm_schedule', 'تأكيد الجدولة')}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('add_equipment', 'إضافة جهاز')}>
        <form className="space-y-4" onSubmit={handleAddEquipment}>
          <div>
            <label className="block mb-1 text-sm">{t('equipment_name', 'اسم الجهاز')}</label>
            <input name="name" type="text" required className="input w-full" />
          </div>
          <div>
            <label className="block mb-1 text-sm">{t('model', 'الموديل')}</label>
            <input name="model" type="text" required className="input w-full" />
          </div>
          <div>
            <label className="block mb-1 text-sm">{t('lab_location', 'المختبر')}</label>
            <input name="lab" type="text" required className="input w-full" />
          </div>
          <div>
            <label className="block mb-1 text-sm">{t('status', 'الحالة')}</label>
            <select name="status" className="input w-full">
              <option value="ACTIVE">ACTIVE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm">{t('last_cal', 'آخر معايرة')}</label>
            <input name="last_cal" type="date" className="input w-full" />
          </div>
          <div>
            <label className="block mb-1 text-sm">{t('next_maint', 'الصيانة القادمة')}</label>
            <input name="next_maint" type="date" className="input w-full" />
          </div>
          <div className="flex justify-end mt-4">
            <button type="submit" className="btn-primary">{t('save', 'حفظ')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

