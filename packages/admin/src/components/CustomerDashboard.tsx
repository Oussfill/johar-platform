import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Package, TrendingUp, AlertTriangle, Wallet, ArrowUpRight, ShieldCheck, Truck } from 'lucide-react';
import Modal from './Modal';
import { useTranslation } from 'react-i18next';

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const [holdings, setHoldings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [name, setName] = useState('');
  
  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);

  const [assetForm, setAssetForm] = useState({ type: 'GOLD', weight: '', grade: '', name: '', location: '' });
  const [marketForm, setMarketForm] = useState({ asset_id: '', price: '' });
  const [labForm, setLabForm] = useState({ asset_id: '', test_type: 'PURITY' });
  const [transportForm, setTransportForm] = useState({ asset_id: '', destination: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    if (profile) setName(profile.full_name);

    const { data: assets } = await supabase.from('assets').select('*').eq('owner_id', user.id);
    if (assets) setHoldings(assets);

    const [offers, labTests, shipments] = await Promise.all([
      supabase.from('marketplace_offers').select('id, asset_id, status').eq('seller_id', user.id),
      supabase.from('lab_tests').select('id, asset_id, status').eq('requester_id', user.id),
      supabase.from('shipments').select('id, asset_id, status').eq('origin_id', user.id) // simplistic
    ]);

    let ords: any[] = [];
    if (offers.data) offers.data.forEach(o => ords.push({ type: 'Market Offer', status: o.status, detail: 'Asset ID: ' + o.asset_id, id: o.id, table: 'marketplace_offers', dbId: o.id }));
    if (labTests.data) labTests.data.forEach(o => ords.push({ type: 'Lab Test', status: o.status, detail: 'Asset ID: ' + o.asset_id, id: o.id, table: 'lab_tests', dbId: o.id }));
    if (shipments.data) shipments.data.forEach(o => ords.push({ type: 'Transport', status: o.status, detail: 'Asset ID: ' + o.asset_id, id: o.id, table: 'shipments', dbId: o.id }));

    setOrders(ords);
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('assets').insert([{
      asset_code: 'JHR-' + Math.floor(Math.random() * 100000),
      asset_type: assetForm.type,
      name: assetForm.name,
      weight_grams: parseFloat(assetForm.weight),
      grade: assetForm.grade,
      status: 'PENDING',
      owner_id: user?.id
    }]);
    setIsNewAssetModalOpen(false);
    fetchData();
  };

  const handleCreateMarketOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('marketplace_offers').insert([{
      asset_id: marketForm.asset_id,
      seller_id: user?.id,
      asking_price: parseFloat(marketForm.price),
      status: 'OPEN'
    }]);
    setIsMarketModalOpen(false);
    fetchData();
  };

  const handleCreateLabTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('lab_tests').insert([{
      asset_id: labForm.asset_id,
      requester_id: user?.id,
      test_type: labForm.test_type,
      status: 'PENDING'
    }]);
    setIsLabModalOpen(false);
    fetchData();
  };

  const handleCreateTransport = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('shipments').insert([{
      asset_id: transportForm.asset_id,
      origin_id: user?.id,
      destination_id: user?.id, // mock
      status: 'PENDING'
    }]);
    setIsTransportModalOpen(false);
    fetchData();
  };

  const cancelOrder = async (table: string, id: string) => {
    await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  const deleteAsset = async (id: string) => {
    if(!confirm(t('customer.confirmDelete', 'Are you sure?'))) return;
    await supabase.from('assets').delete().eq('id', id);
    fetchData();
  };

  const badgeClass: Record<string, string> = {
    'PENDING': 'badge-warning',
    'VERIFIED': 'badge-success',
    'OPEN': 'badge-info',
    'IN_TRANSIT': 'badge-info',
    'COMPLETED': 'badge-success'
  };

  const totalValue = holdings.reduce((acc, h) => acc + (h.weight_grams * 80), 0); // Mock $80/g

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("customer.welcomeMsg", "Welcome")}, {name}</h2>
          <p className="text-sm text-johar-gray-light mt-1">{t("customer.dashboardTitle", "Customer Dashboard")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setIsMarketModalOpen(true)} className="btn-secondary text-xs flex items-center gap-2"><TrendingUp className="w-4 h-4"/> {t("customer.offerForSale", "Offer")}</button>
          <button onClick={() => setIsLabModalOpen(true)} className="btn-secondary text-xs flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> {t("customer.requestAssay", "Assay")}</button>
          <button onClick={() => setIsTransportModalOpen(true)} className="btn-secondary text-xs flex items-center gap-2"><Truck className="w-4 h-4"/> {t("customer.requestTransport", "Transport")}</button>
          <button onClick={() => setIsNewAssetModalOpen(true)} className="btn-primary text-xs flex items-center gap-2"><ArrowUpRight className="w-4 h-4"/> {t("customer.addNewAsset", "New Asset")}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-[#1a1a1a] to-black border-l-4 border-l-johar-gold">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-johar-gray-light">{t("customer.totalAssets", "Total Assets")}</h3>
            <Package className="w-5 h-5 text-johar-gold" />
          </div>
          <p className="text-3xl font-bold">{holdings.length}</p>
        </div>
        
        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-johar-gray-light">{t("customer.totalValue", "Total Value")}</h3>
            <Wallet className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold" dir="ltr">${totalValue.toLocaleString()}</p>
        </div>

        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-johar-gray-light">{t("customer.activeOrders", "Active Orders")}</h3>
            <AlertTriangle className="w-5 h-5 text-johar-gray-mid" />
          </div>
          <p className="text-3xl font-bold">{orders.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold flex items-center gap-2"><Package className="w-5 h-5 text-johar-gold" /> {t("customer.ownedAssets", "Owned Assets")}</h3>
          <div className="card p-0 overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right">
              <thead className="text-xs text-johar-gray-light bg-johar-black-lighter uppercase border-b border-johar-gray-dark/50">
                <tr>
                  <th className="py-3 px-3">{t("customer.code", "Code")}</th>
                  <th className="py-3 px-3">{t("customer.name", "Name")}</th>
                  <th className="py-3 px-3">{t("customer.weight", "Weight")}</th>
                  <th className="py-3 px-3">{t("customer.grade", "Grade")}</th>
                  <th className="py-3 px-3">{t("customer.status", "Status")}</th>
                  <th className="py-3 px-3 text-center">{t("customer.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {holdings.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-johar-gray-light">{t("customer.noAssets", "No Assets")}</td></tr>}
                {holdings.map((h) => (
                  <tr key={h.id} className="border-b border-johar-gray-dark/50">
                    <td className="py-3 px-3 font-mono text-xs text-johar-gold">{h.asset_code}</td>
                    <td className="py-3 px-3">{h.name}</td>
                    <td className="py-3 px-3">{h.weight_grams} g</td>
                    <td className="py-3 px-3" dir="ltr">{h.grade}</td>
                    <td className="py-3 px-3"><span className={`badge ${badgeClass[h.status] || 'badge-info'}`}>{h.status}</span></td>
                    <td className="py-3 px-3 text-center">
                        <button onClick={() => deleteAsset(h.id)} className="text-red-400 hover:text-red-300 transition-colors text-xs border border-red-500/30 px-2 py-1 rounded bg-red-500/10">{t("customer.deleteCancel", "Delete")}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-johar-gold" /> {t("customer.orderHistory", "Order History")}</h3>
            <div className="space-y-3">
              {orders.length === 0 && <p className="text-sm text-johar-gray-mid">{t("customer.noOrders", "No Orders")}</p>}
              {orders.map((o, i) => (
                <div key={i} className="p-3 bg-johar-black-lighter rounded-lg border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{o.type}</span>
                    <span className={`badge ${badgeClass[o.status] || 'badge-info'}`}>{o.status}</span>
                  </div>
                  <p className="text-xs text-johar-gray-light">{o.detail}</p>
                  
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                    <button onClick={() => cancelOrder(o.table, o.dbId)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition-colors">{t("customer.cancelOrder", "Cancel")}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isNewAssetModalOpen} onClose={() => setIsNewAssetModalOpen(false)} title={t("customer.addNewAssetTitle", "Add New Asset")}>
        <form onSubmit={handleCreateAsset} className="space-y-4">
          <div><label className="block text-sm text-johar-gray-light mb-1">{t("customer.assetType", "Type")}</label><select required value={assetForm.type} onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value })} className="input w-full"><option value="GOLD">{t("customer.gold", "Gold")}</option><option value="SILVER">{t("customer.silver", "Silver")}</option></select></div>
          <div><label className="block text-sm text-johar-gray-light mb-1">{t("customer.nameDesc", "Name")}</label><input required type="text" value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} className="input w-full" placeholder={t("customer.placeholderGold", "100g")} /></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div><label className="block text-sm text-johar-gray-light mb-1">{t("customer.weightGrams", "Weight")}</label><input required type="number" step="0.01" value={assetForm.weight} onChange={(e) => setAssetForm({ ...assetForm, weight: e.target.value })} className="input w-full" /></div>
            <div><label className="block text-sm text-johar-gray-light mb-1">{t("customer.grade", "Grade")}</label><input required type="text" value={assetForm.grade} onChange={(e) => setAssetForm({ ...assetForm, grade: e.target.value })} className="input w-full" placeholder="999.9" /></div>
          </div>
          <div><label className="block text-sm text-johar-gray-light mb-1">{t("customer.storageLoc", "Location")}</label><input type="text" value={assetForm.location} onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })} className="input w-full" /></div>
          <div className="flex justify-end gap-3 mt-6"><button type="button" onClick={() => setIsNewAssetModalOpen(false)} className="btn-secondary">{t("customer.cancelBtn", "Cancel")}</button><button type="submit" className="btn-primary">{t("customer.saveBtn", "Save")}</button></div>
        </form>
      </Modal>

      <Modal isOpen={isMarketModalOpen} onClose={() => setIsMarketModalOpen(false)} title={t("customer.marketOfferTitle", "Market Offer")}>
        <form onSubmit={handleCreateMarketOffer} className="space-y-4">
          <div><label className="block text-sm text-johar-gray-light mb-1">{t("customer.selectAsset", "Select")}</label>
            <select required value={marketForm.asset_id} onChange={(e) => setMarketForm({ ...marketForm, asset_id: e.target.value })} className="input w-full">
              <option value="">{t("customer.selectAssetPlaceholder", "-- Select --")}</option>
              {holdings.map(a => <option key={a.id} value={a.id}>{a.name} ({a.asset_code})</option>)}
            </select>
          </div>
          <div><label className="block text-sm text-johar-gray-light mb-1">{t("customer.askingPrice", "Price")}</label><input required type="number" value={marketForm.price} onChange={(e) => setMarketForm({ ...marketForm, price: e.target.value })} className="input w-full" /></div>
          <div className="flex justify-end gap-3 mt-6"><button type="button" onClick={() => setIsMarketModalOpen(false)} className="btn-secondary">{t("customer.cancelBtn", "Cancel")}</button><button type="submit" className="btn-primary">{t("customer.publishMarketBtn", "Publish")}</button></div>
        </form>
      </Modal>

      <Modal isOpen={isLabModalOpen} onClose={() => setIsLabModalOpen(false)} title={t("customer.labAssayTitle", "Assay Request")}>
        <form onSubmit={handleCreateLabTest} className="space-y-4">
          <div><label className="block text-sm text-johar-gray-light mb-1">{t("customer.selectAsset", "Select")}</label>
            <select required value={labForm.asset_id} onChange={(e) => setLabForm({ ...labForm, asset_id: e.target.value })} className="input w-full">
              <option value="">{t("customer.selectAssetPlaceholder", "-- Select --")}</option>
              {holdings.map(a => <option key={a.id} value={a.id}>{a.name} ({a.asset_code})</option>)}
            </select>
          </div>
          <div><label className="block text-sm text-johar-gray-light mb-1">{t("customer.testType", "Type")}</label>
            <select value={labForm.test_type} onChange={(e) => setLabForm({ ...labForm, test_type: e.target.value })} className="input w-full"><option value="PURITY">{t("customer.purityTest", "Purity")}</option><option value="AUTHENTICITY">{t("customer.issueJoharId", "Johar ID")}</option></select>
          </div>
          <div className="flex justify-end gap-3 mt-6"><button type="button" onClick={() => setIsLabModalOpen(false)} className="btn-secondary">{t("customer.cancelBtn", "Cancel")}</button><button type="submit" className="btn-primary">{t("customer.submitRequestBtn", "Submit")}</button></div>
        </form>
      </Modal>

      <Modal isOpen={isTransportModalOpen} onClose={() => setIsTransportModalOpen(false)} title={t("customer.transportTitle", "Transport")}>
        <form onSubmit={handleCreateTransport} className="space-y-4">
          <div><label className="block text-sm text-johar-gray-light mb-1">{t("customer.selectAsset", "Select")}</label>
            <select required value={transportForm.asset_id} onChange={(e) => setTransportForm({ ...transportForm, asset_id: e.target.value })} className="input w-full">
              <option value="">{t("customer.selectAssetPlaceholder", "-- Select --")}</option>
              {holdings.map(a => <option key={a.id} value={a.id}>{a.name} ({a.asset_code})</option>)}
            </select>
          </div>
          <div><label className="block text-sm text-johar-gray-light mb-1">{t("customer.destination", "Destination")}</label><input required type="text" value={transportForm.destination} onChange={(e) => setTransportForm({ ...transportForm, destination: e.target.value })} className="input w-full" placeholder={t("customer.destinationPlaceholder", "e.g., Central Vault")} /></div>
          <div className="flex justify-end gap-3 mt-6"><button type="button" onClick={() => setIsTransportModalOpen(false)} className="btn-secondary">{t("customer.cancelBtn", "Cancel")}</button><button type="submit" className="btn-primary">{t("customer.submitRequestBtn", "Submit")}</button></div>
        </form>
      </Modal>

    </div>
  );
}
