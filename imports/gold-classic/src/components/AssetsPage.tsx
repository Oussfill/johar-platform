import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/apiFetch';

type Language = 'AR' | 'FR' | 'EN';
type Currency = 'DZD' | 'EUR' | 'USD';

interface AssetsPageProps {
  language: Language;
  currency: Currency;
}

interface Asset {
  assetId: string;
  goldId: string;
  serialNumber: string;
  productType: string;
  metalType: string;
  karat: number;
  weightGross: string;
  weightNet: string;
  measuredPurity: string;
  status: string;
  nfcStatus: string;
  productImage: string | null;
  passportNumber: string | null;
  custodyStatus: string | null;
  warehouse: string | null;
  createdAt: string;
}

const t: Record<Language, Record<string, string>> = {
  AR: {
    title: 'إدارة الأصول',
    subtitle: 'عرض وإدارة جميع الأصول الذهبية والمعادن الثمينة',
    search: 'بحث بالـ Gold ID أو الرقم التسلسلي...',
    filterMetal: 'filter by Metal',
    filterStatus: 'filter by Status',
    all: 'الكل',
    goldId: 'Gold ID',
    serial: 'الرقم التسلسلي',
    metal: 'المعدن',
    karat: 'القيراط',
    weight: 'الوزن',
    netWeight: 'الوزن الصافي',
    purity: 'النقاوة',
    status: 'الحالة',
    nfc: 'NFC',
    passport: 'الجواز',
    custody: 'الحوزة',
    warehouse: 'المخزن',
    created: 'تاريخ التسجيل',
    actions: 'إجراءات',
    details: 'التفاصيل',
    noAssets: 'لا توجد أصول',
    image: 'الصورة',
    page: 'صفحة',
    of: 'من',
    previous: 'السابق',
    next: 'التالي',
    total: 'الإجمالي',
    asset: 'أصل',
  },
  FR: {
    title: 'Gestion des Actifs',
    subtitle: 'Afficher et gérer tous les actifs en or et métaux précieux',
    search: 'Rechercher par Gold ID ou numéro de série...',
    filterMetal: 'Filtrer par Métal',
    filterStatus: 'Filtrer par Statut',
    all: 'Tous',
    goldId: 'Gold ID',
    serial: 'Numéro de série',
    metal: 'Métal',
    karat: 'Carat',
    weight: 'Poids',
    netWeight: 'Poids net',
    purity: 'Pureté',
    status: 'Statut',
    nfc: 'NFC',
    passport: 'Passeport',
    custody: 'Garde',
    warehouse: 'Entrepôt',
    created: 'Date de création',
    actions: 'Actions',
    details: 'Détails',
    noAssets: 'Aucun actif trouvé',
    image: 'Photo',
    page: 'Page',
    of: 'sur',
    previous: 'Précédent',
    next: 'Suivant',
    total: 'Total',
    asset: 'actif',
  },
  EN: {
    title: 'Assets Management',
    subtitle: 'View and manage all gold and precious metal assets',
    search: 'Search by Gold ID or serial number...',
    filterMetal: 'Filter by Metal',
    filterStatus: 'Filter by Status',
    all: 'All',
    goldId: 'Gold ID',
    serial: 'Serial Number',
    metal: 'Metal',
    karat: 'Karat',
    weight: 'Weight',
    netWeight: 'Net Weight',
    purity: 'Purity',
    status: 'Status',
    nfc: 'NFC',
    passport: 'Passport',
    custody: 'Custody',
    warehouse: 'Warehouse',
    created: 'Created',
    actions: 'Actions',
    details: 'Details',
    noAssets: 'No assets found',
    image: 'Photo',
    page: 'Page',
    of: 'of',
    previous: 'Previous',
    next: 'Next',
    total: 'Total',
    asset: 'asset',
  },
};

const statusColors: Record<string, string> = {
  RAW_MATERIAL: 'var(--color-info)',
  IN_REFINING: 'var(--color-warning)',
  READY_FOR_ASSAY: 'var(--color-warning)',
  IN_ASSAY: 'var(--color-warning)',
  ASSAYED: 'var(--color-info)',
  CERTIFIED: 'var(--color-success)',
  INVENTORY: 'var(--color-success)',
  LISTED: 'var(--color-gold-400)',
  IN_CUSTODY: 'var(--color-success)',
  IN_TRANSIT: 'var(--color-warning)',
  DELIVERED: 'var(--color-success)',
  SOLD: 'var(--color-gold-400)',
  DECOMMISSIONED: 'var(--color-risk-red)',
};

const AssetsPage: React.FC<AssetsPageProps> = ({ language, currency }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [filterMetal, setFilterMetal] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
        lang: language,
        currency: currency,
      });
      if (search) params.set('search', search);
      if (filterMetal) params.set('metalType', filterMetal);
      if (filterStatus) params.set('status', filterStatus);

      const res = await apiFetch(`/api/v1/assets?${params}`);
      const data = await res.json();
      if (data.success) {
        setAssets(data.data.assets);
        setTotalPages(data.data.pagination.totalPages);
        setTotalItems(data.data.pagination.totalItems);
      }
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  }, [page, search, filterMetal, filterStatus, language, currency]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const tx = t[language];

  return (
    <div style={{ padding: 'var(--space-xl)' }}>
      <h1 style={{ color: 'var(--color-gold-400)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>{tx.title}</h1>
      <p style={{ color: 'var(--color-primary-200)', marginBottom: 'var(--space-xl)' }}>{tx.subtitle}</p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
        <input
          className="gold-input"
          placeholder={tx.search}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: '1 1 250px', minWidth: 0 }}
        />
        <select className="gold-select" value={filterMetal} onChange={(e) => { setFilterMetal(e.target.value); setPage(1); }} style={{ flex: '1 1 150px', minWidth: 0 }}>
          <option value="">{tx.filterMetal}</option>
          <option value="GOLD">GOLD</option>
          <option value="SILVER">SILVER</option>
          <option value="PLATINUM">PLATINUM</option>
          <option value="PALLADIUM">PALLADIUM</option>
        </select>
        <select className="gold-select" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} style={{ flex: '1 1 180px', minWidth: 0 }}>
          <option value="">{tx.filterStatus}</option>
          <option value="RAW_MATERIAL">RAW_MATERIAL</option>
          <option value="IN_REFINING">IN_REFINING</option>
          <option value="CERTIFIED">CERTIFIED</option>
          <option value="INVENTORY">INVENTORY</option>
          <option value="IN_CUSTODY">IN_CUSTODY</option>
          <option value="LISTED">LISTED</option>
          <option value="SOLD">SOLD</option>
        </select>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', color: 'var(--color-primary-300)', fontSize: '0.85rem' }}>
        <span>{tx.total}: <strong style={{ color: 'var(--color-gold-400)' }}>{totalItems}</strong> {tx.asset}</span>
        <span>{tx.page} {page} {tx.of} {totalPages}</span>
      </div>

      {loading && <div className="gold-spinner" style={{ margin: 'var(--space-3xl) auto' }} />}

      {!loading && assets.length === 0 && (
        <p style={{ color: 'var(--color-primary-300)', textAlign: 'center', padding: 'var(--space-3xl)' }}>{tx.noAssets}</p>
      )}

      {!loading && assets.length > 0 && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="gold-table gold-table--cards">
              <thead>
                <tr>
                  <th style={{ width: 64 }}>{tx.image}</th>
                  <th>{tx.goldId}</th>
                  <th>{tx.serial}</th>
                  <th>{tx.metal}</th>
                  <th>{tx.karat}</th>
                  <th>{tx.weight}</th>
                  <th>{tx.netWeight}</th>
                  <th>{tx.purity}</th>
                  <th>{tx.status}</th>
                  <th>{tx.nfc}</th>
                  <th className="gold-t-hide-1300">{tx.passport}</th>
                  <th className="gold-t-hide-1300">{tx.custody}</th>
                  <th className="gold-t-hide-1300">{tx.warehouse}</th>
                  <th>{tx.created}</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.assetId}>
                    <td data-th={tx.image} style={{ padding: '6px 10px', width: 64 }}>
                      {a.productImage
                        ? <img src={a.productImage} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', border: '1px solid rgba(198,169,105,0.15)' }} />
                        : <span style={{ display: 'inline-flex', width: 48, height: 48, borderRadius: 6, background: 'rgba(198,169,105,0.06)', border: '1px dashed rgba(198,169,105,0.15)', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--color-primary-500)' }}>🪙</span>
                      }
                    </td>
                    <td data-th={tx.goldId} style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-gold-400)', fontWeight: 600 }}>{a.goldId}</td>
                    <td data-th={tx.serial} style={{ fontFamily: 'var(--font-mono)' }}>{a.serialNumber}</td>
                    <td data-th={tx.metal}><span className="gold-badge gold-badge--gold">{a.metalType}</span></td>
                    <td data-th={tx.karat}>{a.karat}K</td>
                    <td data-th={tx.weight}>{a.weightGross}g</td>
                    <td data-th={tx.netWeight}>{a.weightNet}g</td>
                    <td data-th={tx.purity}>{a.measuredPurity}%</td>
                    <td data-th={tx.status}>
                      <span className="gold-badge" style={{ backgroundColor: (statusColors[a.status] || 'var(--color-info)') + '22', color: statusColors[a.status] || 'var(--color-info)', border: `1px solid ${statusColors[a.status] || 'var(--color-info)'}44` }}>
                        {a.status}
                      </span>
                    </td>
                    <td data-th={tx.nfc}>
                      <span className={`gold-badge gold-badge--${a.nfcStatus === 'LOCKED' ? 'success' : a.nfcStatus === 'TAMPERED' ? 'danger' : 'warning'}`}>
                        {a.nfcStatus || 'NONE'}
                      </span>
                    </td>
                    <td data-th={tx.passport} className="gold-t-hide-1300" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{a.passportNumber || '—'}</td>
                    <td data-th={tx.custody} className="gold-t-hide-1300">
                      <span className={`gold-badge gold-badge--${a.custodyStatus === 'SECURE' ? 'success' : 'warning'}`}>
                        {a.custodyStatus || '—'}
                      </span>
                    </td>
                    <td data-th={tx.warehouse} className="gold-t-hide-1300" style={{ fontSize: '0.8rem' }}>{a.warehouse || '—'}</td>
                    <td data-th={tx.created} style={{ fontSize: '0.8rem' }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-xl)' }}>
            <button
              className="gold-btn gold-btn--ghost gold-btn--sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← {tx.previous}
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  className={`gold-btn gold-btn--sm ${p === page ? 'gold-btn--primary' : 'gold-btn--ghost'}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              );
            })}
            <button
              className="gold-btn gold-btn--ghost gold-btn--sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {tx.next} →
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AssetsPage;
