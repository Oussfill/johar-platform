import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import Modal from './Modal';
import AssetIdentifiers from './AssetIdentifiers';
import {
  Fingerprint, Plus, Search, Eye, Trash2, Shield,
  CheckCircle, Clock, XCircle, QrCode, Loader2, Filter
} from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  VERIFIED:  'badge-success',
  PENDING:   'badge-warning',
  REJECTED:  'badge-danger',
  ACTIVE:    'badge-info',
};

export default function JoharIDPage() {
  const { t } = useTranslation();
  const [assets, setAssets]         = useState<any[]>([]);
  const [profiles, setProfiles]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [selected, setSelected]     = useState<any>(null);
  const [viewModal, setViewModal]   = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [identModal, setIdentModal] = useState(false);

  const [saving, setSaving]         = useState(false);
  const [newAsset, setNewAsset]     = useState({
    asset_code: '', asset_type: 'GOLD', name: '', owner_id: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const [assetRes, profilesRes] = await Promise.all([
      supabase.from('assets')
        .select('*, profiles:current_owner_id(full_name)')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name').order('full_name'),
    ]);
    if (assetRes.data)   setAssets(assetRes.data);
    if (profilesRes.data) setProfiles(profilesRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = assets.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !q || (
      a.asset_code?.toLowerCase().includes(q) ||
      a.name?.toLowerCase().includes(q) ||
      a.profiles?.full_name?.toLowerCase().includes(q)
    );
    const matchS = filterStatus === 'ALL' || a.status === filterStatus;
    return matchQ && matchS;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const code = newAsset.asset_code ||
      `JOHAR-${newAsset.asset_type.substring(0,2)}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { error } = await supabase.from('assets').insert([{
      asset_code:       code,
      asset_type:       newAsset.asset_type,
      name:             newAsset.name || newAsset.asset_type + ' Asset',
      status:           'PENDING',
      current_owner_id: newAsset.owner_id || null,
    }]);
    setSaving(false);
    if (error) { alert('خطأ: ' + error.message); return; }
    setCreateModal(false);
    setNewAsset({ asset_code: '', asset_type: 'GOLD', name: '', owner_id: '' });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا الأصل نهائياً؟')) return;
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) { alert('خطأ: ' + error.message); return; }
    setViewModal(false);
    fetchData();
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('assets').update({ status }).eq('id', id);
    if (error) { alert('خطأ: ' + error.message); return; }
    setSelected((prev: any) => prev ? { ...prev, status } : prev);
    fetchData();
  };

  // Stats
  const total    = assets.length;
  const verified = assets.filter(a => a.status === 'VERIFIED').length;
  const pending  = assets.filter(a => a.status === 'PENDING').length;
  const withNfc  = assets.filter(a => a.nfc_uid).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Fingerprint className="w-6 h-6 text-johar-gold" />
            {t('johar_id', 'هويات JOHAR')}
          </h2>
          <p className="text-johar-gray-light text-sm mt-1">
            إدارة الهويات الرقمية وبروتوكولات التحقق لجميع الأصول
          </p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          إصدار هوية جديدة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الهويات', value: total, icon: <Shield className="w-5 h-5" />, color: 'text-johar-gold' },
          { label: 'موثقة وفعّالة', value: verified, icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-400' },
          { label: 'قيد المراجعة', value: pending, icon: <Clock className="w-5 h-5" />, color: 'text-yellow-400' },
          { label: 'مسجّلة NFC', value: withNfc, icon: <QrCode className="w-5 h-5" />, color: 'text-blue-400' },
        ].map((s, i) => (
          <div key={i} className="card py-4">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs text-johar-gray-light">{s.label}</p>
              <span className={s.color}>{s.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-johar-gray-mid" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث برقم الأصل، الاسم، أو المالك..."
            className="input w-full ps-9"
          />
        </div>
        <div className="relative">
          <Filter className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-johar-gray-mid" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="input ps-9"
          >
            <option value="ALL">كل الحالات</option>
            <option value="PENDING">PENDING</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-johar-gray-light bg-johar-black-lighter uppercase border-b border-johar-gray-dark/50">
            <tr>
              <th className="py-3 px-4 text-start">JOHAR ID</th>
              <th className="py-3 px-4 text-start">الاسم</th>
              <th className="py-3 px-4 text-start">النوع</th>
              <th className="py-3 px-4 text-start">المالك</th>
              <th className="py-3 px-4 text-start">الحالة</th>
              <th className="py-3 px-4 text-center">NFC</th>
              <th className="py-3 px-4 text-center">QR</th>
              <th className="py-3 px-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="text-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-johar-gold mx-auto" />
              </td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-johar-gray-light">لا توجد هويات</td></tr>
            )}
            {filtered.map(item => (
              <tr key={item.id} className="border-b border-johar-gray-dark/30 hover:bg-johar-black-lighter/50 transition-colors">
                <td className="py-3 px-4 font-mono text-xs text-johar-gold font-semibold">
                  {item.asset_code || item.id.split('-')[0]}
                </td>
                <td className="py-3 px-4 max-w-[140px] truncate">{item.name || '—'}</td>
                <td className="py-3 px-4">
                  <span className="badge badge-info text-xs">{item.asset_type}</span>
                </td>
                <td className="py-3 px-4 text-johar-gray-light max-w-[120px] truncate">
                  {item.profiles?.full_name || '—'}
                </td>
                <td className="py-3 px-4">
                  <span className={`badge ${STATUS_BADGE[item.status] || 'badge-info'}`}>{item.status}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  {item.nfc_uid
                    ? <span title={item.nfc_uid}><CheckCircle className="w-4 h-4 text-green-400 mx-auto" /></span>
                    : <XCircle className="w-4 h-4 text-johar-gray-dark mx-auto" />}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => { setSelected(item); setIdentModal(true); }}
                    className="p-1 rounded text-johar-gold hover:bg-johar-gold/10 transition-colors"
                    title="عرض QR"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => { setSelected(item); setViewModal(true); }}
                      className="p-1.5 rounded-lg text-johar-gray-light hover:text-johar-white hover:bg-johar-black-lighter transition-colors"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-johar-gray-light hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && (
          <div className="px-4 py-3 border-t border-johar-gray-dark/30 text-xs text-johar-gray-light">
            عرض {filtered.length} من {total} هوية
          </div>
        )}
      </div>

      {/* ── Modal: View Details ── */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="تفاصيل الهوية الرقمية">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-mono font-bold text-johar-gold">{selected.asset_code}</h3>
                <p className="text-sm text-johar-gray-light mt-1">{selected.name}</p>
              </div>
              <span className={`badge ${STATUS_BADGE[selected.status] || 'badge-info'}`}>{selected.status}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'النوع',         value: selected.asset_type },
                { label: 'الوزن',         value: selected.weight_grams ? `${selected.weight_grams} g` : '—' },
                { label: 'المالك',        value: selected.profiles?.full_name || '—' },
                { label: 'تاريخ الإصدار',value: new Date(selected.created_at).toLocaleDateString('ar-SA') },
              ].map((r, i) => (
                <div key={i} className="bg-johar-black-lighter rounded-lg p-3">
                  <p className="text-xs text-johar-gray-light mb-1">{r.label}</p>
                  <p className="font-medium">{r.value}</p>
                </div>
              ))}
            </div>

            {/* Blockchain Hash mock */}
            <div className="bg-johar-black border border-johar-gray-dark/50 rounded-lg p-3">
              <p className="text-xs text-johar-gray-light mb-1 font-semibold">Blockchain Hash</p>
              <p className="font-mono text-xs text-green-400 break-all">
                0x{Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}
              </p>
            </div>

            {/* Status controls */}
            <div>
              <p className="text-sm font-medium text-johar-gray-light mb-2">تغيير الحالة</p>
              <div className="flex flex-wrap gap-2">
                {['PENDING', 'VERIFIED', 'REJECTED'].map(s => (
                  <button
                    key={s}
                    onClick={() => handleUpdateStatus(selected.id, s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selected.status === s
                        ? 'bg-johar-gold text-black border-johar-gold'
                        : 'border-johar-gray-dark text-johar-gray-light hover:border-johar-gold hover:text-johar-gold'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setViewModal(false); setIdentModal(true); }}
                className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm text-johar-gold"
              >
                <QrCode className="w-4 h-4" />
                QR / NFC / بصمة
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                className="btn-danger text-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                حذف
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: Create ── */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="إصدار هوية JOHAR جديدة">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-johar-gray-light">كود الأصل (اختياري — سيُولّد تلقائياً)</label>
            <input
              type="text"
              value={newAsset.asset_code}
              onChange={e => setNewAsset(f => ({ ...f, asset_code: e.target.value }))}
              className="input w-full font-mono"
              placeholder="JOHAR-AU-2026-XXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-johar-gray-light">نوع الأصل *</label>
            <select
              required
              value={newAsset.asset_type}
              onChange={e => setNewAsset(f => ({ ...f, asset_type: e.target.value }))}
              className="input w-full"
            >
              {['GOLD', 'SILVER', 'DIAMOND', 'PLATINUM', 'JEWELRY'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-johar-gray-light">الاسم / الوصف</label>
            <input
              type="text"
              value={newAsset.name}
              onChange={e => setNewAsset(f => ({ ...f, name: e.target.value }))}
              className="input w-full"
              placeholder="سبيكة ذهب 24K — 100 جرام"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-johar-gray-light">المالك</label>
            <select
              value={newAsset.owner_id}
              onChange={e => setNewAsset(f => ({ ...f, owner_id: e.target.value }))}
              className="input w-full"
            >
              <option value="">-- بدون مالك محدد --</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">إلغاء</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              إصدار الهوية
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: QR/NFC/Fingerprint ── */}
      <Modal
        isOpen={identModal}
        onClose={() => setIdentModal(false)}
        title={`هويات الأصل — ${selected?.asset_code || ''}`}
      >
        {selected && (
          <AssetIdentifiers
            asset={selected}
            onUpdate={fetchData}
          />
        )}
      </Modal>
    </div>
  );
}
