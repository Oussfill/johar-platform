import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import Modal from './Modal';
import AssetIdentifiers from './AssetIdentifiers';
import {
  Package, Search, Plus, Filter, ChevronDown,
  Eye, Pencil, Trash2, CheckCircle, Clock, XCircle,
  Loader2, QrCode
} from 'lucide-react';

const ASSET_TYPES = ['GOLD', 'SILVER', 'DIAMOND', 'PLATINUM', 'JEWELRY'];
const ASSET_STATUSES = ['ALL', 'PENDING', 'VERIFIED', 'REJECTED', 'IN_CUSTODY'];

const STATUS_BADGE: Record<string, string> = {
  VERIFIED:   'badge-success',
  PENDING:    'badge-warning',
  REJECTED:   'badge-danger',
  IN_CUSTODY: 'badge-info',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  VERIFIED:   <CheckCircle className="w-3.5 h-3.5" />,
  PENDING:    <Clock className="w-3.5 h-3.5" />,
  REJECTED:   <XCircle className="w-3.5 h-3.5" />,
  IN_CUSTODY: <Package className="w-3.5 h-3.5" />,
};

export default function AssetsPage() {
  const { t } = useTranslation();

  // Data
  const [assets, setAssets]           = useState<any[]>([]);
  const [profiles, setProfiles]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);

  // Filters
  const [search, setSearch]           = useState('');
  const [filterType, setFilterType]   = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modals
  const [viewModal, setViewModal]     = useState(false);
  const [newModal, setNewModal]       = useState(false);
  const [editModal, setEditModal]     = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [identModal, setIdentModal]   = useState(false);

  const [selected, setSelected]       = useState<any>(null);
  const [saving, setSaving]           = useState(false);

  // Form state
  const emptyForm = {
    type: 'GOLD', name: '', weight: '', grade: '',
    owner_id: '', location: '', notes: '', purity: ''
  };
  const [form, setForm] = useState(emptyForm);

  // ── Data fetching ──────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    const [assetsRes, profilesRes] = await Promise.all([
      supabase.from('assets')
        .select('*, profiles:current_owner_id(full_name, id)')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name').order('full_name')
    ]);
    if (assetsRes.data)   setAssets(assetsRes.data);
    if (profilesRes.data) setProfiles(profilesRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Filtering ──────────────────────────────────────────────
  const filtered = assets.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || (
      a.asset_code?.toLowerCase().includes(q) ||
      a.name?.toLowerCase().includes(q) ||
      a.profiles?.full_name?.toLowerCase().includes(q)
    );
    const matchType   = filterType   === 'ALL' || a.asset_type === filterType;
    const matchStatus = filterStatus === 'ALL' || a.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  // ── CRUD ───────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const assetCode = `JOHAR-${form.type.substring(0,2)}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { error } = await supabase.from('assets').insert([{
      asset_code:       assetCode,
      asset_type:       form.type,
      name:             form.name || `${form.type} Bar`,
      weight_grams:     parseFloat(form.weight) || 0,
      grade:            form.grade || form.purity,
      status:           'PENDING',
      custody_location: form.location,
      current_owner_id: form.owner_id || null,
    }]);
    setSaving(false);
    if (error) { alert('خطأ: ' + error.message); return; }
    setNewModal(false);
    setForm(emptyForm);
    fetchAll();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from('assets').update({
      name:             form.name,
      weight_grams:     parseFloat(form.weight) || selected.weight_grams,
      grade:            form.grade,
      custody_location: form.location,
      current_owner_id: form.owner_id || selected.current_owner_id,
    }).eq('id', selected.id);
    setSaving(false);
    if (error) { alert('خطأ: ' + error.message); return; }
    setEditModal(false);
    fetchAll();
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from('assets').update({ status }).eq('id', id);
    if (error) { alert('خطأ: ' + error.message); return; }
    fetchAll();
    if (selected?.id === id) setSelected((prev: any) => ({ ...prev, status }));
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from('assets').delete().eq('id', selected.id);
    setSaving(false);
    if (error) { alert('خطأ: ' + error.message); return; }
    setDeleteModal(false);
    setSelected(null);
    fetchAll();
  };

  // ── Open modals helpers ────────────────────────────────────
  const openView = (a: any) => { setSelected(a); setViewModal(true); };
  const openEdit = (a: any) => {
    setSelected(a);
    setForm({
      type:     a.asset_type  || 'GOLD',
      name:     a.name        || '',
      weight:   String(a.weight_grams || ''),
      grade:    a.grade       || '',
      purity:   a.grade       || '',
      owner_id: a.current_owner_id || '',
      location: a.custody_location || '',
      notes:    '',
    });
    setEditModal(true);
  };
  const openDelete     = (a: any) => { setSelected(a); setDeleteModal(true); };
  const openIdentifiers = (a: any) => { setSelected(a); setIdentModal(true); };

  // ── Stats ──────────────────────────────────────────────────
  const total    = assets.length;
  const verified = assets.filter(a => a.status === 'VERIFIED').length;
  const pending  = assets.filter(a => a.status === 'PENDING').length;
  const totalWeight = assets.reduce((s, a) => s + (a.weight_grams || 0), 0);

  // ── Shared form fields ────────────────────────────────────
  const AssetFormFields = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-johar-gray-light">نوع الأصل *</label>
          <select
            required
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="input w-full"
          >
            {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-johar-gray-light">الاسم / الوصف *</label>
          <input
            required
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="input w-full"
            placeholder="مثال: سبيكة ذهب 24K - 100 جرام"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-johar-gray-light">الوزن (جرام) *</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.weight}
            onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
            className="input w-full"
            placeholder="100.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-johar-gray-light">العيار / النقاء</label>
          <input
            type="text"
            value={form.grade}
            onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
            className="input w-full"
            placeholder="999.9 أو 24K أو 18K"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-johar-gray-light">المالك</label>
        <select
          value={form.owner_id}
          onChange={e => setForm(f => ({ ...f, owner_id: e.target.value }))}
          className="input w-full"
        >
          <option value="">-- بدون مالك محدد --</option>
          {profiles.map(p => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-johar-gray-light">موقع التخزين / الحفظ</label>
        <input
          type="text"
          value={form.location}
          onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          className="input w-full"
          placeholder="مثال: مستودع دبي المركزي - خزينة A"
        />
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-johar-gold" />
            {t('assets', 'الأصول')}
          </h2>
          <p className="text-johar-gray-light text-sm mt-1">إدارة وتتبع جميع الأصول الذهبية والمجوهرات</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setNewModal(true); }}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          إضافة أصل جديد
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الأصول', value: total, color: 'text-johar-gold' },
          { label: 'موثقة', value: verified, color: 'text-green-400' },
          { label: 'معلقة', value: pending, color: 'text-yellow-400' },
          { label: 'الوزن الإجمالي', value: totalWeight.toFixed(1) + ' g', color: 'text-blue-400' },
        ].map((s, i) => (
          <div key={i} className="card py-4">
            <p className="text-xs text-johar-gray-light mb-1">{s.label}</p>
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
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="input ps-9 pr-8 appearance-none"
          >
            <option value="ALL">كل الأنواع</option>
            {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-johar-gray-mid pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="input pr-8 appearance-none"
          >
            {ASSET_STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'كل الحالات' : s}</option>)}
          </select>
          <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-johar-gray-mid pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-johar-gray-light bg-johar-black-lighter uppercase border-b border-johar-gray-dark/50">
            <tr>
              <th className="py-3 px-4 text-start">رمز الأصل</th>
              <th className="py-3 px-4 text-start">الاسم</th>
              <th className="py-3 px-4 text-start">النوع</th>
              <th className="py-3 px-4 text-start">الوزن</th>
              <th className="py-3 px-4 text-start">المالك</th>
              <th className="py-3 px-4 text-start">الحالة</th>
              <th className="py-3 px-4 text-start">هويات</th>
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
              <tr><td colSpan={8} className="text-center py-12 text-johar-gray-light">
                لا توجد أصول مطابقة للبحث
              </td></tr>
            )}
            {filtered.map(a => (
              <tr key={a.id} className="border-b border-johar-gray-dark/30 hover:bg-johar-black-lighter/50 transition-colors">
                <td className="py-3 px-4 font-mono text-xs text-johar-gold font-semibold">{a.asset_code}</td>
                <td className="py-3 px-4 max-w-[160px] truncate">{a.name || '—'}</td>
                <td className="py-3 px-4">
                  <span className="badge badge-info text-xs">{a.asset_type}</span>
                </td>
                <td className="py-3 px-4 text-johar-gray-light" dir="ltr">{a.weight_grams?.toFixed(2)} g</td>
                <td className="py-3 px-4 text-johar-gray-light max-w-[120px] truncate">
                  {a.profiles?.full_name || '—'}
                </td>
                <td className="py-3 px-4">
                  <span className={`badge ${STATUS_BADGE[a.status] || 'badge-info'} flex items-center gap-1 w-fit`}>
                    {STATUS_ICON[a.status]}
                    {a.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    {a.nfc_uid && <span title="NFC مسجّل" className="w-2 h-2 rounded-full bg-blue-400" />}
                    {a.fingerprint_hash && <span title="بصمة مسجّلة" className="w-2 h-2 rounded-full bg-purple-400" />}
                    <span title="QR متاح" className="w-2 h-2 rounded-full bg-johar-gold" />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => openIdentifiers(a)}
                      title="QR / NFC / بصمة"
                      className="p-1.5 rounded-lg text-johar-gold hover:bg-johar-gold/10 transition-colors"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openView(a)}
                      title="عرض"
                      className="p-1.5 rounded-lg text-johar-gray-light hover:text-johar-white hover:bg-johar-black-lighter transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEdit(a)}
                      title="تعديل"
                      className="p-1.5 rounded-lg text-johar-gray-light hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDelete(a)}
                      title="حذف"
                      className="p-1.5 rounded-lg text-johar-gray-light hover:text-red-400 hover:bg-red-400/10 transition-colors"
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
            عرض {filtered.length} من {total} أصل
          </div>
        )}
      </div>

      {/* ── Modal: Add New ── */}
      <Modal isOpen={newModal} onClose={() => setNewModal(false)} title="إضافة أصل جديد">
        <form onSubmit={handleCreate} className="space-y-4">
          <AssetFormFields />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setNewModal(false)} className="btn-secondary">إلغاء</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              حفظ الأصل
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Edit ── */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title={`تعديل: ${selected?.asset_code || ''}`}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <AssetFormFields />

          <div>
            <label className="block text-sm font-medium mb-2 text-johar-gray-light">تغيير الحالة</label>
            <div className="flex flex-wrap gap-2">
              {['PENDING', 'VERIFIED', 'REJECTED', 'IN_CUSTODY'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusChange(selected?.id, s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    selected?.status === s
                      ? 'bg-johar-gold text-black border-johar-gold'
                      : 'border-johar-gray-dark text-johar-gray-light hover:border-johar-gold hover:text-johar-gold'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditModal(false)} className="btn-secondary">إلغاء</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              حفظ التغييرات
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: View ── */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="تفاصيل الأصل">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-mono font-bold text-johar-gold">{selected.asset_code}</p>
                <p className="text-johar-gray-light text-sm mt-1">{selected.name}</p>
              </div>
              <span className={`badge ${STATUS_BADGE[selected.status] || 'badge-info'} flex items-center gap-1`}>
                {STATUS_ICON[selected.status]}
                {selected.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'النوع', value: selected.asset_type },
                { label: 'الوزن', value: `${selected.weight_grams?.toFixed(2)} g` },
                { label: 'العيار', value: selected.grade || '—' },
                { label: 'المالك', value: selected.profiles?.full_name || '—' },
                { label: 'موقع التخزين', value: selected.custody_location || '—' },
                { label: 'تاريخ الإضافة', value: new Date(selected.created_at).toLocaleDateString('ar-SA') },
              ].map((r, i) => (
                <div key={i} className="bg-johar-black-lighter rounded-lg p-3">
                  <p className="text-xs text-johar-gray-light mb-1">{r.label}</p>
                  <p className="font-medium">{r.value}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-johar-gray-dark/30 pt-4">
              <h4 className="text-sm font-semibold mb-3 text-johar-gray-light">تغيير الحالة</h4>
              <div className="flex flex-wrap gap-2">
                {['PENDING', 'VERIFIED', 'REJECTED', 'IN_CUSTODY'].map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(selected.id, s)}
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

            <div className="flex gap-3 pt-2">
              <button onClick={() => { setViewModal(false); openEdit(selected); }} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
                <Pencil className="w-4 h-4" /> تعديل
              </button>
              <button onClick={() => { setViewModal(false); openIdentifiers(selected); }} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm text-johar-gold">
                <QrCode className="w-4 h-4" /> QR / NFC / بصمة
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: Delete ── */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="تأكيد الحذف">
        <div className="space-y-4">
          <p className="text-johar-gray-light">
            هل أنت متأكد من حذف الأصل{' '}
            <span className="text-johar-gold font-mono font-bold">{selected?.asset_code}</span>؟
            هذا الإجراء لا يمكن التراجع عنه.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteModal(false)} className="btn-secondary">إلغاء</button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="btn-danger flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Trash2 className="w-4 h-4" />
              حذف نهائي
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Identifiers (QR/NFC/Fingerprint) ── */}
      <Modal
        isOpen={identModal}
        onClose={() => setIdentModal(false)}
        title={`هويات الأصل — ${selected?.asset_code || ''}`}
      >
        {selected && (
          <AssetIdentifiers
            asset={selected}
            onUpdate={() => { fetchAll(); setSelected((prev: any) => ({ ...prev })); }}
          />
        )}
      </Modal>
    </div>
  );
}
