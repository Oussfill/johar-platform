import React, { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';
import {
  PageShell, Card, Loading, ErrorBox, GoldButton, TextField,
  fmtNum, fmtDate, normalizeNumber,
} from '../components/UiKit';
import type { Language, Currency } from '../components/UiKit';
import AssetsPage from '../components/AssetsPage';
import VaultsPage from '../components/VaultsPage';

const T: Record<Language, Record<string, string>> = {
  AR: {
    titleAssets: 'سجل الأصول',
    subtitleAssets: 'قائمة بجميع الأصول المسجلة',
    titleAssetsRegister: 'تسجيل أصل جديد',
    subtitleAssetsRegister: 'إضافة أصل جديد إلى السجل',
    titleVaults: 'الخزائن والمخازن',
    subtitleVaults: 'إدارة الخزائن والمخازن',
    titleReconciliation: 'مطابقة المخزون',
    subtitleReconciliation: 'مقارنة بيانات المخزون والتحقق من التطابق',
    serialNumber: 'الرقم التسلسلي',
    productType: 'نوع المنتج',
    metalType: 'نوع المعدن',
    karat: 'القيراط',
    weightGross: 'الوزن الإجمالي',
    weightNet: 'الوزن الصافي',
    origin: 'الأصل',
    register: 'تسجيل',
    totalAssets: 'إجمالي الأصول',
    activeVaults: 'الخزائن النشطة',
    mismatches: 'ال اختلافات',
    metal: 'المعدن',
    quantity: 'الكمية',
    status: 'الحالة',
    date: 'التاريخ',
    difference: 'الفرق',
    vault: 'الخزينة',
    successTitle: 'تم التسجيل بنجاح',
    errorTitle: 'خطأ في التسجيل',
    goldId: 'معرّف الذهب',
    passportNumber: 'رقم الجواز',
    assetId: 'معرّف الأصل',
  },
  EN: {
    titleAssets: 'Assets Registry',
    subtitleAssets: 'List of all registered assets',
    titleAssetsRegister: 'Register New Asset',
    subtitleAssetsRegister: 'Add a new asset to the registry',
    titleVaults: 'Vaults & Warehouses',
    subtitleVaults: 'Manage vaults and warehouses',
    titleReconciliation: 'Inventory Reconciliation',
    subtitleReconciliation: 'Compare inventory data and verify consistency',
    serialNumber: 'Serial Number',
    productType: 'Product Type',
    metalType: 'Metal Type',
    karat: 'Karat',
    weightGross: 'Gross Weight',
    weightNet: 'Net Weight',
    origin: 'Origin',
    register: 'Register',
    totalAssets: 'Total Assets',
    activeVaults: 'Active Vaults',
    mismatches: 'Mismatches',
    metal: 'Metal',
    quantity: 'Quantity',
    status: 'Status',
    date: 'Date',
    difference: 'Difference',
    vault: 'Vault',
    successTitle: 'Registered Successfully',
    errorTitle: 'Registration Error',
    goldId: 'Gold ID',
    passportNumber: 'Passport Number',
    assetId: 'Asset ID',
  },
  FR: {
    titleAssets: "Registre des Actifs",
    subtitleAssets: 'Liste de tous les actifs enregistrés',
    titleAssetsRegister: 'Enregistrer un Nouvel Actif',
    subtitleAssetsRegister: 'Ajouter un nouvel actif au registre',
    titleVaults: 'Coffres et Entrepôts',
    subtitleVaults: 'Gérer les coffres et entrepôts',
    titleReconciliation: 'Réconciliation des Stocks',
    subtitleReconciliation: 'Comparer les données de stock et vérifier la cohérence',
    serialNumber: 'Numéro de Série',
    productType: 'Type de Produit',
    metalType: 'Type de Métal',
    karat: 'Karat',
    weightGross: 'Poids Brut',
    weightNet: 'Poids Net',
    origin: 'Origine',
    register: 'Enregistrer',
    totalAssets: 'Total des Actifs',
    activeVaults: 'Coffres Actifs',
    mismatches: 'Différences',
    metal: 'Métal',
    quantity: 'Quantité',
    status: 'Statut',
    date: 'Date',
    difference: 'Différence',
    vault: 'Coffre',
    successTitle: 'Enregistré avec Succès',
    errorTitle: "Erreur d'Enregistrement",
    goldId: 'ID Or',
    passportNumber: 'Numéro de Passeport',
    assetId: "ID de l'Actif",
  },
};

function t(lang: Language, key: string): string {
  return (T[lang] && T[lang][key]) || T.EN[key] || key;
}

/* ─────────────────────────────── ErpAssetsPage ──────────────────────────── */

export function ErpAssetsPage({ language, currency }: { language: Language; currency: Currency }) {
  return <AssetsPage language={language} currency={currency} />;
}

/* ───────────────────────────── ErpAssetsRegisterPage ────────────────────── */

export function ErpAssetsRegisterPage({ language }: { language: Language; currency: Currency }) {
  const [form, setForm] = useState({
    serialNumber: '',
    productType: '',
    metalType: 'GOLD',
    karat: '',
    weightGross: '',
    weightNet: '',
    origin: '',
  });
  const [productImage, setProductImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; assetId: string; goldId: string; passportNumber: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setError(null);
    setResult(null);
  }, []);

  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      const dataUri = await compressImage(file, 900, 0.82);
      setProductImage(dataUri);
    } catch {
      setError(language === 'AR' ? 'تعذّر قراءة الصورة' : language === 'FR' ? 'Impossible de lire le fichier' : 'Could not read image');
    }
  }, [language]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiFetch('/api/v1/assets/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serialNumber: form.serialNumber,
          productType: form.productType,
          metalType: form.metalType,
          karat: normalizeNumber(form.karat),
          weightGross: normalizeNumber(form.weightGross),
          weightNet: form.weightNet ? normalizeNumber(form.weightNet) : undefined,
          origin: form.origin,
          productImage: productImage || undefined,
          nameTranslations: { ar: form.serialNumber, fr: form.serialNumber, en: form.serialNumber },
        }),
      });
      const json = await res.json();
      if (json.data) {
        setResult({
          ok: true,
          assetId: json.data.assetId || '',
          goldId: json.data.goldId || '',
          passportNumber: json.data.passportNumber || '',
        });
        setForm({ serialNumber: '', productType: '', metalType: 'GOLD', karat: '', weightGross: '', weightNet: '', origin: '' });
        setProductImage(null);
      } else {
        setError(json.error?.message || json.error || json.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  }, [form, productImage]);

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,215,0,0.15)',
    borderRadius: 8,
    color: '#e0d5c1',
    fontSize: 14,
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 6,
    color: '#b8a88a',
    fontSize: 13,
  };

  return (
    <PageShell title={t(language, 'titleAssetsRegister')} subtitle={t(language, 'subtitleAssetsRegister')} language={language}>
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, maxWidth: 1100 }}>
          {/* معلومات الأصل الأساسية */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div>
              <label style={labelStyle}>{t(language, 'serialNumber')}</label>
              <TextField value={form.serialNumber} onChange={set('serialNumber')} />
            </div>
            <div>
              <label style={labelStyle}>{t(language, 'productType')}</label>
              <TextField value={form.productType} onChange={set('productType')} />
            </div>
            <div>
              <label style={labelStyle}>{t(language, 'metalType')}</label>
              <select value={form.metalType} onChange={set('metalType')} style={selectStyle}>
                <option value="GOLD">GOLD</option>
                <option value="SILVER">SILVER</option>
                <option value="PLATINUM">PLATINUM</option>
                <option value="PALLADIUM">PALLADIUM</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t(language, 'karat')}</label>
              <TextField value={form.karat} onChange={set('karat')} />
            </div>
            <div>
              <label style={labelStyle}>{t(language, 'weightGross')}</label>
              <TextField value={form.weightGross} onChange={set('weightGross')} />
            </div>
            <div>
              <label style={labelStyle}>{t(language, 'weightNet')}</label>
              <TextField value={form.weightNet} onChange={set('weightNet')} />
            </div>
            <div>
              <label style={labelStyle}>{t(language, 'origin')}</label>
              <TextField value={form.origin} onChange={set('origin')} />
            </div>
          </div>

          {/* صورة المنتج */}
          <div style={{ borderTop: '1px solid rgba(255,215,0,0.08)', paddingTop: 16 }}>
            <label style={{ ...labelStyle, marginBottom: 10 }}>
              {language === 'AR' ? 'صورة المنتج (اختياري)' : language === 'FR' ? 'Photo du produit (facultatif)' : 'Product Photo (optional)'}
            </label>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <label style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 20px',
                background: productImage ? 'rgba(198,169,105,0.08)' : 'rgba(255,255,255,0.03)',
                border: '2px dashed rgba(255,215,0,0.25)',
                borderRadius: 10,
                color: productImage ? '#c6a969' : '#8a8a9a',
                fontSize: 14,
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}>
                <span style={{ fontSize: 22 }}>{productImage ? '✔' : '📷'}</span>
                <span>{productImage
                  ? (language === 'AR' ? 'تغيير الصورة' : language === 'FR' ? 'Changer' : 'Change photo')
                  : (language === 'AR' ? 'اختر صورة' : language === 'FR' ? 'Choisir une photo' : 'Choose photo')
                }</span>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
              {productImage && (
                <div style={{
                  position: 'relative',
                  width: 140,
                  height: 140,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '2px solid rgba(198,169,105,0.3)',
                  flex: '0 0 auto',
                }}>
                  <img
                    src={productImage}
                    alt="preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    onClick={() => setProductImage(null)}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(0,0,0,0.7)',
                      color: '#dc3545',
                      fontSize: 14,
                      lineHeight: 1,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label="remove image"
                  >×</button>
                </div>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <GoldButton onClick={handleSubmit} disabled={submitting}>
              {submitting ? '...' : t(language, 'register')}
            </GoldButton>
          </div>
        </div>

        {result && (
          <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(60,185,126,0.1)', border: '1px solid rgba(60,185,126,0.3)', borderRadius: 8, color: '#3cb97e', fontSize: 13, maxWidth: 1100 }}>
            <strong>{t(language, 'successTitle')}</strong>
            <div style={{ marginTop: 6 }}>
              {t(language, 'assetId')}: {result.assetId} &nbsp;|&nbsp;
              {t(language, 'goldId')}: {result.goldId} &nbsp;|&nbsp;
              {t(language, 'passportNumber')}: {result.passportNumber}
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.3)', borderRadius: 8, color: '#dc3545', fontSize: 13, maxWidth: 1100 }}>
            <strong>{t(language, 'errorTitle')}</strong>
            <div style={{ marginTop: 6 }}>{error}</div>
          </div>
        )}
      </Card>
    </PageShell>
  );
}

function compressImage(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      let { width: w, height: h } = img;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      c.width = w;
      c.height = h;
      c.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', quality));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => { reject(new Error('load failed')); URL.revokeObjectURL(img.src); };
    img.src = URL.createObjectURL(file);
  });
}

/* ─────────────────────────────── ErpVaultsPage ──────────────────────────── */

export function ErpVaultsPage({ language, currency }: { language: Language; currency: Currency }) {
  return <VaultsPage language={language} currency={currency} />;
}

/* ─────────────────────── ErpInventoryReconciliationPage ─────────────────── */

export function ErpInventoryReconciliationPage({ language, currency }: { language: Language; currency: Currency }) {
  const [rec, setRec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch('/api/v1/erp/inventory/reconciliation')
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) {
          setRec(j?.data ?? j);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Failed to load reconciliation data');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <PageShell title={t(language, 'titleReconciliation')} subtitle={t(language, 'subtitleReconciliation')} language={language}><Loading /></PageShell>;
  if (error) return <PageShell title={t(language, 'titleReconciliation')} subtitle={t(language, 'subtitleReconciliation')} language={language}><ErrorBox message={error} /></PageShell>;
  if (!rec) return <PageShell title={t(language, 'titleReconciliation')} subtitle={t(language, 'subtitleReconciliation')} language={language}><ErrorBox message="No data" /></PageShell>;

  const keys = Object.keys(rec);

  const totalAssets = normalizeNumber(rec.totalAssets ?? rec.total ?? rec.assetCount);
  const activeVaults = normalizeNumber(rec.activeVaults ?? rec.vaultCount);
  const mismatchesCount = normalizeNumber(rec.mismatchesCount ?? (Array.isArray(rec.mismatches) ? rec.mismatches.length : 0));
  const lastRun = rec.lastRun ?? rec.lastReconciliation ?? rec.updatedAt;

  const arraysInData: { key: string; items: any[] }[] = [];
  keys.forEach((k) => {
    if (Array.isArray(rec[k]) && rec[k].length > 0) {
      arraysInData.push({ key: k, items: rec[k] });
    }
  });

  const cardBg: React.CSSProperties = {
    padding: 20,
    background: 'rgba(255,215,0,0.03)',
    border: '1px solid rgba(255,215,0,0.1)',
    borderRadius: 10,
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: '1px solid rgba(255,215,0,0.15)',
    color: '#b8a88a',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    color: '#e0d5c1',
    fontSize: 13,
  };

  return (
    <PageShell title={t(language, 'titleReconciliation')} subtitle={t(language, 'subtitleReconciliation')} language={language}>
      {lastRun && (
        <div style={{ marginBottom: 16, color: '#8a7e6b', fontSize: 12 }}>
          {t(language, 'date')}: {fmtDate(lastRun, language)}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={cardBg}>
          <div style={{ color: '#8a7e6b', fontSize: 12, marginBottom: 4 }}>{t(language, 'totalAssets')}</div>
          <div style={{ color: '#ffd700', fontSize: 24, fontWeight: 700 }}>{fmtNum(totalAssets)}</div>
        </div>
        <div style={cardBg}>
          <div style={{ color: '#8a7e6b', fontSize: 12, marginBottom: 4 }}>{t(language, 'activeVaults')}</div>
          <div style={{ color: '#ffd700', fontSize: 24, fontWeight: 700 }}>{fmtNum(activeVaults)}</div>
        </div>
        <div style={cardBg}>
          <div style={{ color: '#8a7e6b', fontSize: 12, marginBottom: 4 }}>{t(language, 'mismatches')}</div>
          <div style={{ color: mismatchesCount > 0 ? '#dc3545' : '#3cb97e', fontSize: 24, fontWeight: 700 }}>{fmtNum(mismatchesCount)}</div>
        </div>
      </div>

      {rec.mismatches && Array.isArray(rec.mismatches) && rec.mismatches.length > 0 && (
        <Card>
          <h3 style={{ color: '#dc3545', fontSize: 15, marginBottom: 12 }}>{t(language, 'mismatches')}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {Object.keys(rec.mismatches[0]).map((col) => (
                  <th key={col} style={thStyle}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rec.mismatches.map((row: any, i: number) => (
                <tr key={i}>
                  {Object.values(row).map((val: any, j: number) => (
                    <td key={j} style={tdStyle}>{String(val ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {rec.metalCounts && typeof rec.metalCounts === 'object' && !Array.isArray(rec.metalCounts) && (
        <Card>
          <h3 style={{ color: '#ffd700', fontSize: 15, marginBottom: 12 }}>{t(language, 'metal')}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>{t(language, 'metal')}</th>
                <th style={thStyle}>{t(language, 'quantity')}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(rec.metalCounts).map(([metal, qty]) => (
                <tr key={metal}>
                  <td style={tdStyle}>{metal}</td>
                  <td style={tdStyle}>{String(qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {rec.vaultCounts && typeof rec.vaultCounts === 'object' && !Array.isArray(rec.vaultCounts) && (
        <Card>
          <h3 style={{ color: '#ffd700', fontSize: 15, marginBottom: 12 }}>{t(language, 'vault')}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>{t(language, 'vault')}</th>
                <th style={thStyle}>{t(language, 'quantity')}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(rec.vaultCounts).map(([v, qty]) => (
                <tr key={v}>
                  <td style={tdStyle}>{v}</td>
                  <td style={tdStyle}>{String(qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {rec.assetsByStatus && typeof rec.assetsByStatus === 'object' && !Array.isArray(rec.assetsByStatus) && (
        <Card>
          <h3 style={{ color: '#ffd700', fontSize: 15, marginBottom: 12 }}>{t(language, 'status')}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>{t(language, 'status')}</th>
                <th style={thStyle}>{t(language, 'quantity')}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(rec.assetsByStatus).map(([status, qty]) => (
                <tr key={status}>
                  <td style={tdStyle}>{status}</td>
                  <td style={tdStyle}>{String(qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {arraysInData.filter((a) => !['mismatches'].includes(a.key)).map(({ key, items }) => (
        <Card key={key}>
          <h3 style={{ color: '#ffd700', fontSize: 15, marginBottom: 12 }}>{key}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {Object.keys(items[0]).map((col) => (
                  <th key={col} style={thStyle}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row: any, i: number) => (
                <tr key={i}>
                  {Object.values(row).map((val: any, j: number) => (
                    <td key={j} style={tdStyle}>{String(val ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}
    </PageShell>
  );
}

/* ─────────────────────── ErpInvariantCheckPage ──────────────────────────── */
// فحص ثبات الحفظ — مبدأ الحفظ L(t) = C(t) + S(t)

export function ErpInvariantCheckPage({ language, currency }: { language: Language; currency: Currency }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch('/api/v1/erp/invariant-check')
      .then((r) => r.json())
      .then((j) => {
        setData(j?.data ?? j);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load invariant check');
        setLoading(false);
      });
  }, []);

  useEffect(load, []);

  const title = language === 'AR' ? 'فحص ثبات الحفظ' : language === 'FR' ? 'Vérification d\u2019Invariance' : 'Conservation Invariant Check';
  const subtitle = language === 'AR'
    ? 'تحقق من مبدأ الحفظ: الوزن المسجّل = الوزن المحفوظ + الوزن الخارج'
    : language === 'FR'
    ? 'Vérifiez le principe de conservation: L(t) = C(t) + S(t)'
    : 'Verify conservation: registered weight = held weight + outflow weight';

  if (loading) return <PageShell title={title} subtitle={subtitle} language={language}><Loading /></PageShell>;
  if (error) return <PageShell title={title} subtitle={subtitle} language={language}><ErrorBox message={error} /></PageShell>;
  if (!data) return <PageShell title={title} subtitle={subtitle} language={language}><ErrorBox message="No data" /></PageShell>;

  const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid rgba(255,215,0,0.15)', color: '#b8a88a', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const };
  const td: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#e0d5c1', fontSize: 13 };
  const card: React.CSSProperties = { padding: 20, background: 'rgba(255,215,0,0.03)', border: '1px solid rgba(255,215,0,0.1)', borderRadius: 10 };

  const pass = data.result === 'PASS';
  const violations = data.violations || [];

  return (
    <PageShell title={title} subtitle={subtitle} language={language}>
      <div dir="ltr" style={{ textAlign: 'center', marginBottom: 24 }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: '#c6a969', letterSpacing: 1 }}>
          L(t) = C(t) + S(t)
        </span>
      </div>

      {/* نتيجة عامة */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ ...card, borderColor: pass ? 'rgba(60,185,126,0.4)' : 'rgba(220,53,69,0.4)' }}>
          <div style={{ color: '#8a7e6b', fontSize: 12, marginBottom: 4 }}>{language === 'AR' ? 'الحالة' : language === 'FR' ? 'Statut' : 'Status'}</div>
          <div style={{ color: pass ? '#3cb97e' : '#dc3545', fontSize: 26, fontWeight: 800 }}>{data.result}</div>
        </div>
        <div style={card}>
          <div style={{ color: '#8a7e6b', fontSize: 12, marginBottom: 4 }}>L(t)</div>
          <div style={{ color: '#ffd700', fontSize: 24, fontWeight: 700 }}>{fmtNum(data.theorem?.L?.weight ?? 0)} g</div>
          <div style={{ color: '#7a7a88', fontSize: 11 }}>{data.theorem?.L?.count} {language === 'AR' ? 'أصل' : language === 'FR' ? 'actifs' : 'assets'}</div>
        </div>
        <div style={card}>
          <div style={{ color: '#8a7e6b', fontSize: 12, marginBottom: 4 }}>C(t)</div>
          <div style={{ color: '#5b8ff9', fontSize: 24, fontWeight: 700 }}>{fmtNum(data.theorem?.C?.weight ?? 0)} g</div>
          <div style={{ color: '#7a7a88', fontSize: 11 }}>{data.theorem?.C?.count}</div>
        </div>
        <div style={card}>
          <div style={{ color: '#8a7e6b', fontSize: 12, marginBottom: 4 }}>S(t)</div>
          <div style={{ color: '#f5a623', fontSize: 24, fontWeight: 700 }}>{fmtNum(data.theorem?.S?.weight ?? 0)} g</div>
          <div style={{ color: '#7a7a88', fontSize: 11 }}>{data.theorem?.S?.count}</div>
        </div>
      </div>

      {/* Δ الحفظ */}
      <div style={{ ...card, marginBottom: 24, borderColor: data.theorem?.invariantHolds ? 'rgba(60,185,126,0.3)' : 'rgba(220,53,69,0.3)' }}>
        <div style={{ color: '#8a7e6b', fontSize: 12, marginBottom: 6 }}>
          {language === 'AR' ? 'انحراف الحفظ' : language === 'FR' ? 'Écart de conservation' : 'Conservation delta'}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: data.theorem?.invariantHolds ? '#3cb97e' : '#dc3545' }}>
          |C + S − L| = {fmtNum(data.theorem?.conservationDelta ?? 0)} g
          <span style={{ fontSize: 13, color: '#8a8a9a', fontWeight: 400 }}> / tolerance {fmtNum(data.theorem?.toleranceGrams ?? 0)} g</span>
        </div>
      </div>

      {/* المخالفات */}
      {violations.length > 0 && (
        <Card>
          <h3 style={{ color: '#dc3545', fontSize: 15, marginBottom: 12 }}>{language === 'AR' ? 'مخالفات الثبات' : language === 'FR' ? 'Violations' : 'Invariant Violations'} ({violations.length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Code</th><th style={th}>Gold ID</th><th style={th}>Status</th><th style={th}>Weight (g)</th></tr></thead>
            <tbody>
              {violations.map((v: any, i: number) => (
                <tr key={i}>
                  <td style={td}>{v.code}</td>
                  <td style={td}>{v.goldId}</td>
                  <td style={td}>{v.status}</td>
                  <td style={td}>{fmtNum(v.weightGross)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* المؤلفون (ERP) */}
      {data.custody && typeof data.custody === 'object' && (
        <Card>
          <h3 style={{ color: '#ffd700', fontSize: 15, marginBottom: 12 }}>{language === 'AR' ? 'تغطية السجل (ERP)' : language === 'FR' ? 'Couverture ERP' : 'ERP Coverage'}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Metric</th><th style={th}>Value</th></tr></thead>
            <tbody>
              <tr><td style={td}>With Inventory</td><td style={td}>{data.custody.withInventory}</td></tr>
              <tr><td style={td}>Missing Inventory</td><td style={td}>{data.custody.missingInventoryCount}</td></tr>
              <tr><td style={td}>Total Weight (g)</td><td style={td}>{fmtNum(data.custody.weightGrams ?? 0)}</td></tr>
            </tbody>
          </table>
        </Card>
      )}

      {/* التوزيع حسب المعدن */}
      {data.ledger?.byMetal && typeof data.ledger.byMetal === 'object' && (
        <Card>
          <h3 style={{ color: '#ffd700', fontSize: 15, marginBottom: 12 }}>{language === 'AR' ? 'التوزيع حسب المعدن' : language === 'FR' ? 'Par métal' : 'By Metal'}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>{language === 'AR' ? 'معدن' : 'Metal'}</th><th style={th}>Weight (g)</th></tr></thead>
            <tbody>
              {Object.entries(data.ledger.byMetal).map(([m, w]: any) => (
                <tr key={m}><td style={td}>{m}</td><td style={td}>{fmtNum(w)}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* توزيع الوزن */}
      {data.heldWeights && (
        <Card>
          <h3 style={{ color: '#ffd700', fontSize: 15, marginBottom: 12 }}>{language === 'AR' ? 'توزيع الأوزان المحفوظة' : 'Weight Distribution'}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>n</th><th style={th}>Min</th><th style={th}>Max</th><th style={th}>Mean</th><th style={th}>Median</th><th style={th}>SD</th><th style={th}>CV</th></tr></thead>
            <tbody>
              <tr>
                <td style={td}>{data.heldWeights.n}</td>
                <td style={td}>{fmtNum(data.heldWeights.min)}</td>
                <td style={td}>{fmtNum(data.heldWeights.max)}</td>
                <td style={td}>{fmtNum(data.heldWeights.mean)}</td>
                <td style={td}>{fmtNum(data.heldWeights.median)}</td>
                <td style={td}>{fmtNum(data.heldWeights.stdDev)}</td>
                <td style={td}>{fmtNum(data.heldWeights.cv)}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      )}

      <div style={{ marginTop: 16 }}>
        <GoldButton onClick={load}>{language === 'AR' ? 'إعادة الفحص' : language === 'FR' ? 'Re-vérifier' : 'Re-check'}</GoldButton>
      </div>
    </PageShell>
  );
}

/* ─────────────────────── AssetMutationsPage ─────────────────────────────── */
// عمليات الدمج (Merge) والتقسيم (Split) للأصول

export function AssetMutationsPage({ language, currency }: { language: Language; currency: Currency }) {
  const mode = useState<'merge' | 'split'>('merge');
  const [tab, setTab] = mode;
  const [assetIds, setAssetIds] = useState('');
  const [assetId, setAssetId] = useState('');
  const [serial, setSerial] = useState('');
  const [splitParts, setSplitParts] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const title = language === 'AR' ? 'عمليات الدمج والتقسيم' : language === 'FR' ? 'Fusion & Division' : 'Merge & Split Operations';
  const subtitle = language === 'AR'
    ? 'إعادة هيكلة الأصول مع الحفاظ على مبدأ الحفظ L = C + S'
    : language === 'FR'
    ? 'Restructurer les actifs en préservant la conservation'
    : 'Restructure assets while preserving conservation';

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let body: any;
      if (tab === 'merge') {
        body = {
          assetIds: assetIds.split(',').map((s) => s.trim()).filter(Boolean),
          newSerialNumber: serial || undefined,
          reason: 'Merge via ERP operations console',
        };
      } else {
        const parts = splitParts
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => line.split(/[,\s;]+/).map((n) => Number(n)).filter((n) => Number.isFinite(n)))
          .filter((p) => p.length > 0);
        const maxOther = Math.max(...parts.map((p) => p.length));
        body = {
          splits: parts.map((p) => ({
            weightGross: p[0],
            weightNet: p[1] || p[0],
            nameTranslations: { ar: `جزء ${p[0]}g`, fr: `Part ${p[0]}g`, en: `Part ${p[0]}g` },
          })),
          reason: 'Split via ERP operations console',
        };
        if (body.splits.length === 0) throw new Error('Enter at least 2 split parts (one per line, comma separated)');
        void maxOther;
      }

      const url = tab === 'merge' ? '/api/v1/assets/merge' : `/api/v1/assets/${assetId}/split`;
      const res = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success && json.data) setResult(json.data);
      else setError(json.error?.message || json.error || 'Operation failed');
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [tab, assetIds, assetId, serial, splitParts]);

  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, color: '#b8a88a', fontSize: 13 };
  const textareaStyle: React.CSSProperties = {
    width: '100%', minHeight: 110, padding: '10px 12px', background: 'rgba(30,30,45,0.8)',
    border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical',
  };

  return (
    <PageShell title={title} subtitle={subtitle} language={language}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {(['merge', 'split'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setTab(m); setError(null); setResult(null); }}
            style={{
              padding: '9px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: tab === m ? '1px solid #c6a969' : '1px solid #333',
              background: tab === m ? 'rgba(198,169,105,0.15)' : 'rgba(255,255,255,0.02)',
              color: tab === m ? '#ffd700' : '#8a8a9a',
            }}
          >
            {language === 'AR' ? (m === 'merge' ? 'دمج' : 'تقسيم') : m === 'merge' ? 'Merge' : 'Split'}
          </button>
        ))}
      </div>

      {tab === 'merge' ? (
        <>
          <label style={labelStyle}>{language === 'AR' ? 'معرّفات الأصول (مفصولة بفواصل)' : 'Asset IDs (comma-separated)'}</label>
          <TextField value={assetIds} onChange={(e) => setAssetIds(e.target.value)} placeholder="uuid1, uuid2, uuid3" />
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>{language === 'AR' ? 'الرقم التسلسلي الجديد (اختياري)' : 'New serial number (optional)'}</label>
            <TextField value={serial} onChange={(e) => setSerial(e.target.value)} />
          </div>
        </>
      ) : (
        <>
          <label style={labelStyle}>{language === 'AR' ? 'معرّف الأصل المصدر' : 'Source asset ID'}</label>
          <TextField value={assetId} onChange={(e) => setAssetId(e.target.value)} placeholder="uuid" />
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>
              {language === 'AR' ? 'الأجزاء — كل سطر: الوزن، الوزن الصافي (اختياري)' : language === 'FR' ? 'Parts — une ligne: poids, poids net (opt.)' : 'Parts — one per line: gross, net (opt.)'}
            </label>
            <textarea value={splitParts} onChange={(e) => setSplitParts(e.target.value)} style={textareaStyle} placeholder={'50\n30\n20'} />
          </div>
        </>
      )}

      <div style={{ marginTop: 16 }}>
        <GoldButton onClick={run} disabled={loading || (tab === 'split' && !assetId)}>
          {loading ? '...' : language === 'AR' ? 'تنفيذ' : language === 'FR' ? 'Exécuter' : 'Execute'}
        </GoldButton>
      </div>

      {result && (
        <Card>
          <h3 style={{ color: '#ffd700', fontSize: 15, marginBottom: 12 }}>{result.operation} — OK</h3>
          <pre style={{ color: '#c0c0d0', fontSize: 12, whiteSpace: 'pre-wrap', margin: 0 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}
      {error && <div style={{ marginTop: 16 }}><ErrorBox message={error} /></div>}
    </PageShell>
  );
}

export {};
