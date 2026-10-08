import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';

import WarehousesPage from './WarehousesPage';
import CustodyPage from './CustodyPage';
import Modal from './Modal';

export default function LogisticsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(t('shipments', 'الشحنات'));
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    const { data } = await supabase!.from('shipments').select('*, profiles!from_user_id(full_name)').order('created_at', { ascending: false });
    if (data) setShipments(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, asset_id: string, newStatus: string) => {
    const { error } = await supabase!.from('shipments').update({ status: newStatus }).eq('id', id);
    if (error) { alert("Error: " + error.message); return; }
    if (newStatus === 'DELIVERED' && asset_id) {
      await supabase!.from('assets').update({ status: 'VERIFIED', custody_location: 'Delivered' }).eq('id', asset_id);
    }
    fetchShipments();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase!.from('shipments').delete().eq('id', id);
    if (error) { alert("Error: " + error.message); return; }
    fetchShipments();
  };

  const handleAddShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newShipment = {
      shipment_code: formData.get('shipment_code'),
      destination: formData.get('destination'),
      source: formData.get('source'),
      carrier: formData.get('carrier'),
      status: formData.get('status') || 'PENDING'
    };
    const { error } = await supabase!.from('shipments').insert([newShipment]);
    if (error) alert("Error: " + error.message);
    else {
      setIsAddModalOpen(false);
      fetchShipments();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t('logistics', 'الخدمات اللوجستية')}</h2>
        {activeTab === t('shipments', 'الشحنات') && (
          <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>{t('add_carrier', 'إضافة ناقل / شحنة')}</button>
        )}
      </div>
      
      <div className="flex gap-4 mb-6 border-b border-johar-gray-dark">
        {[t('shipments', 'الشحنات'), t('warehouses', 'المستودعات'), t('custody', 'العهد')].map(tab => (
          <button key={tab} className={`pb-2 px-4 ${activeTab === tab ? 'text-johar-gold border-b-2 border-johar-gold font-bold' : 'text-johar-gray-light hover:text-white'}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === t('shipments', 'الشحنات') && (
        <div className="card overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>رقم الشحنة</th>
                <th>طالب النقل</th>
                <th>الوجهة</th>
                <th>الناقل</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-4">جاري التحميل...</td></tr> : shipments.map(s => (
                <tr key={s.id}>
                  <td className="font-mono text-sm">{s.shipment_code}</td>
                  <td>{s.profiles?.full_name || 'غير معروف'}</td>
                  <td>{s.destination}</td>
                  <td>{s.carrier}</td>
                  <td><span className={`badge ${s.status === 'PENDING' ? 'badge-warning' : s.status === 'IN_TRANSIT' ? 'badge-info' : 'badge-success'}`}>{s.status}</span></td>
                  <td>{new Date(s.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2">
                      {s.status === 'PENDING' && <button className="text-johar-info hover:underline text-sm" onClick={() => handleUpdateStatus(s.id, s.asset_id, 'IN_TRANSIT')}>بدء النقل</button>}
                      {s.status === 'IN_TRANSIT' && <button className="text-johar-success hover:underline text-sm" onClick={() => handleUpdateStatus(s.id, s.asset_id, 'DELIVERED')}>تأكيد الوصول</button>}
                      <button className="text-red-500 hover:underline text-sm" onClick={() => handleDelete(s.id)}>{t('delete', 'حذف')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {activeTab === t('warehouses', 'المستودعات') && (
        <WarehousesPage />
      )}

      {activeTab === t('custody', 'العهد') && (
        <CustodyPage />
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('add_carrier', 'إضافة ناقل / شحنة')}>
        <form className="space-y-4" onSubmit={handleAddShipment}>
          <div>
            <label className="block mb-1 text-sm">{t('shipment_code', 'رقم الشحنة')}</label>
            <input name="shipment_code" type="text" required className="input w-full" />
          </div>
          <div>
            <label className="block mb-1 text-sm">{t('source', 'المصدر')}</label>
            <input name="source" type="text" required className="input w-full" />
          </div>
          <div>
            <label className="block mb-1 text-sm">{t('destination', 'الوجهة')}</label>
            <input name="destination" type="text" required className="input w-full" />
          </div>
          <div>
            <label className="block mb-1 text-sm">{t('carrier', 'الناقل')}</label>
            <input name="carrier" type="text" required className="input w-full" />
          </div>
          <div>
            <label className="block mb-1 text-sm">{t('status', 'الحالة')}</label>
            <select name="status" className="input w-full">
              <option value="PENDING">PENDING</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
            </select>
          </div>
          <div className="flex justify-end mt-4">
            <button type="submit" className="btn-primary">{t('save', 'حفظ')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
