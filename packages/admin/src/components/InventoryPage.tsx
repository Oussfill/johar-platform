import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';

export default function InventoryPage() {
  const { t } = useTranslation();

  const [inventory, setInventory] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newItem, setNewItem] = useState({ code: "", type: "GOLD", weight: 0, value: 0, location: "", status: "IN_STOCK" });

  const fetchData = () => {
    supabase.from('inventory').select('*').then(({ data }) => {
      if (data) setInventory(data);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    const { error } = await supabase.from('inventory').insert([newItem]);
    if (error) alert("Error: " + error.message);
    else { setIsCreateOpen(false); fetchData(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('inventory').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  return (
    <div className="p-6 space-y-6 min-h-screen johar-black-lighter text-johar-gray-light" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gold-text">{t('inventory_management', 'إدارة المخزون')}</h1>
        <div className="space-x-2 space-x-reverse">
          <button className="btn-secondary">{t('export', 'تصدير')}</button>
          <button className="btn-primary" onClick={() => setIsCreateOpen(true)}>{t('new_inventory_check', '+ جرد جديد')}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card card">
          <div className="stat-label">{t('total_value', 'إجمالي القيمة')}</div>
          <div className="stat-value text-johar-gold">$7.53M</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('number_of_asset_blocks', 'عدد كتل الأصول')}</div>
          <div className="stat-value">450</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('in_warehouses', 'في المستودعات')}</div>
          <div className="stat-value">425</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('in_transit', 'قيد النقل')}</div>
          <div className="stat-value text-johar-warning">25</div>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-4">{t('inventory_distribution_value', 'توزيع المخزون (بالقيمة)')}</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>{t('gold_asset', 'الذهب')}</span>
              <span>75% ($5.6M)</span>
            </div>
            <div className="w-full bg-johar-gray-dark rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>{t('silver_asset', 'الفضة')}</span>
              <span>15% ($1.2M)</span>
            </div>
            <div className="w-full bg-johar-gray-dark rounded-full h-2">
              <div className="bg-gray-400 h-2 rounded-full" style={{ width: '15%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>{t('diamond_asset', 'الألماس')}</span>
              <span>7% ($500K)</span>
            </div>
            <div className="w-full bg-johar-gray-dark rounded-full h-2">
              <div className="bg-blue-400 h-2 rounded-full" style={{ width: '7%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>{t('platinum_asset', 'البلاتين')}</span>
              <span>3% ($280K)</span>
            </div>
            <div className="w-full bg-johar-gray-dark rounded-full h-2">
              <div className="bg-slate-300 h-2 rounded-full" style={{ width: '3%' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 space-x-reverse mb-4">
        <select className="input w-48">
          <option>{t('all_locations', 'كل المواقع')}</option>
          <option>{t('dubai_warehouse_loc', 'مستودع دبي')}</option>
          <option>{t('riyadh_warehouse_loc', 'مستودع الرياض')}</option>
          <option>{t('in_transit_loc', 'قيد النقل')}</option>
        </select>
        <select className="input w-48">
          <option>{t('all_types', 'كل الأنواع')}</option>
          <option>{t('gold', 'ذهب')}</option>
          <option>{t('silver', 'فضة')}</option>
          <option>{t('diamond', 'ألماس')}</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full text-right">
          <thead>
            <tr className="border-b border-johar-gray-dark">
              <th className="p-4">{t('code', 'الكود')}</th>
              <th className="p-4">{t('type', 'النوع')}</th>
              <th className="p-4">{t('gross_weight', 'الوزن الإجمالي')}</th>
              <th className="p-4">{t('market_value', 'القيمة السوقية')}</th>
              <th className="p-4">{t('location', 'الموقع')}</th>
              <th className="p-4">{t('last_audit', 'آخر جرد')}</th>
              <th className="p-4">{t('status', 'الحالة')}</th>
              <th className="p-4">{t('actions', 'إجراءات')}</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.id} className="border-b border-johar-gray-dark hover:bg-johar-gray-dark/50">
                <td className="p-4 font-mono">{item.code}</td>
                <td className="p-4">{item.type}</td>
                <td className="p-4">{item.weight}</td>
                <td className="p-4">{item.value}</td>
                <td className="p-4">{item.location}</td>
                <td className="p-4">{item.last_audit || item.lastAudit}</td>
                <td className="p-4">
                  <span className={`badge ${item.status === t('available', 'متاح') ? 'badge-success' : item.status === t('in_transit', 'قيد النقل') ? 'badge-warning' : 'badge-info'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-4 space-x-2 space-x-reverse">
                  <button className="btn-secondary text-sm py-1 px-3" onClick={() => {
                    const newStatus = prompt("Enter new status:", item.status);
                    if (newStatus) handleUpdateStatus(item.id, newStatus);
                  }}>{t('edit_status', 'تعديل الحالة')}</button>
                  <button className="btn-danger text-sm py-1 px-3" onClick={() => handleDelete(item.id)}>{t('delete', 'حذف')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Required Modal component import at the top of file if not exists */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-johar-black border border-johar-gray-dark rounded-lg p-6 w-96 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-johar-gold">إضافة عنصر جديد</h2>
            <input className="input w-full p-2 bg-johar-black border border-johar-gray-dark text-white rounded" placeholder="الكود (Code)" value={newItem.code} onChange={e => setNewItem({...newItem, code: e.target.value})} />
            <input className="input w-full p-2 bg-johar-black border border-johar-gray-dark text-white rounded" placeholder="النوع (Type)" value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})} />
            <input className="input w-full p-2 bg-johar-black border border-johar-gray-dark text-white rounded" type="number" placeholder="الوزن (Weight)" value={newItem.weight || ""} onChange={e => setNewItem({...newItem, weight: Number(e.target.value)})} />
            <input className="input w-full p-2 bg-johar-black border border-johar-gray-dark text-white rounded" type="number" placeholder="القيمة (Value)" value={newItem.value || ""} onChange={e => setNewItem({...newItem, value: Number(e.target.value)})} />
            <input className="input w-full p-2 bg-johar-black border border-johar-gray-dark text-white rounded" placeholder="الموقع (Location)" value={newItem.location} onChange={e => setNewItem({...newItem, location: e.target.value})} />
            <div className="flex gap-2">
              <button className="btn-primary flex-1 p-2" onClick={handleCreate}>إضافة</button>
              <button className="btn-secondary flex-1 p-2" onClick={() => setIsCreateOpen(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

