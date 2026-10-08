import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

export default function SuppliersPage() {
  const { t } = useTranslation();
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [suppliers, setSuppliers] = useState<any[]>([]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newSupplier = {
      name: formData.get('name'),
      contact_person: formData.get('contact_person'),
      supply_type: formData.get('supply_type'),
      rating: parseFloat(formData.get('rating') as string) || 0,
    };
    const { data, error } = await supabase.from('suppliers').insert([newSupplier]).select();
    if (error) { alert("Error: " + error.message); return; }
    if (data) {
      setSuppliers([...suppliers, data[0]]);
      setIsAddModalOpen(false);
    }
  };

  const fetchData = () => {
    supabase.from('suppliers').select('*').then(({ data }) => {
      if (data) setSuppliers(data);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase.from('suppliers').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex text-johar-gold">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>{star <= Math.round(rating) ? '★' : '☆'}</span>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 min-h-screen johar-black-lighter text-johar-gray-light" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gold-text">{t('suppliers', 'الموردون')}</h1>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>{t('add_new_supplier_btn', '+ مورد جديد')}</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card card">
          <div className="stat-label">{t('total_suppliers', 'إجمالي الموردين')}</div>
          <div className="stat-value">45</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('active_suppliers', 'موردين نشطين')}</div>
          <div className="stat-value text-johar-success">38</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('average_rating', 'متوسط التقييم')}</div>
          <div className="stat-value text-johar-gold">4.6/5</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('under_monitoring', 'تحت المراقبة')}</div>
          <div className="stat-value text-johar-warning">3</div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full text-right">
          <thead>
            <tr className="border-b border-johar-gray-dark">
              <th className="p-4">{t('supplier_name', 'اسم المورد')}</th>
              <th className="p-4">{t('contact_person', 'جهة الاتصال')}</th>
              <th className="p-4">{t('supply_type', 'نوع التوريد')}</th>
              <th className="p-4">{t('rating', 'التقييم')}</th>
              <th className="p-4">{t('actions', 'إجراءات')}</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-b border-johar-gray-dark hover:bg-johar-gray-dark/50">
                <td className="p-4 font-semibold">{s.name}</td>
                <td className="p-4">{s.contact_person || 'N/A'}</td>
                <td className="p-4">{s.supply_type || 'N/A'}</td>
                <td className="p-4">{renderStars(s.rating || 0)}</td>
                <td className="p-4 space-x-2 space-x-reverse">
                  <button className="btn-secondary text-sm py-1 px-3" onClick={() => setSelectedSupplier(s)}>{t('view', 'عرض')}</button>
                  <button className="btn-primary text-sm py-1 px-3">{t('request_quote', 'طلب عرض سعر')}</button>
                  <button className="btn-danger text-sm py-1 px-3" onClick={() => handleDelete(s.id)}>{t('delete', 'حذف')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!selectedSupplier} onClose={() => setSelectedSupplier(null)} title={t('supplier_details', 'تفاصيل المورد')}>
        {selectedSupplier && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-johar-gold">{selectedSupplier.name}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div><span className="text-johar-gray-mid block text-sm">{t('contact_person', 'جهة الاتصال')}</span>{selectedSupplier.contact_person}</div>
              <div><span className="text-johar-gray-mid block text-sm">{t('supplied_material_type', 'نوع المواد الموردة')}</span>{selectedSupplier.supply_type}</div>
              <div><span className="text-johar-gray-mid block text-sm">{t('overall_rating', 'التقييم العام')}</span>{renderStars(selectedSupplier.rating || 0)}</div>
            </div>
            <div className="border-t border-johar-gray-dark pt-4">
              <h3 className="font-semibold mb-2">{t('recent_supply_history', 'سجل التوريد الأخير')}</h3>
              <p className="text-sm text-johar-gray-mid">{t('no_recent_shipments', 'لا توجد شحنات حديثة مسجلة في النظام.')}</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('add_new_supplier_btn', '+ مورد جديد')}>
        <form className="space-y-4" onSubmit={handleAddSubmit}>
          <div><label className="block mb-1 text-sm">{t('supplier_name', 'اسم المورد')}</label><input name="name" type="text" className="input w-full" required /></div>
          <div><label className="block mb-1 text-sm">{t('contact_person', 'جهة الاتصال')}</label><input name="contact_person" type="text" className="input w-full" required /></div>
          <div><label className="block mb-1 text-sm">{t('supply_type', 'نوع التوريد')}</label><input name="supply_type" type="text" className="input w-full" required /></div>
          <div><label className="block mb-1 text-sm">{t('rating', 'التقييم')}</label><input name="rating" type="number" min="0" max="5" step="0.1" className="input w-full" defaultValue="5" /></div>
          <div className="flex justify-end mt-4"><button type="submit" className="btn-primary">{t('add', 'إضافة')}</button></div>
        </form>
      </Modal>
    </div>
  );
}

