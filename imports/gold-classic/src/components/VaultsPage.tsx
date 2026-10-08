import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/apiFetch';

type Language = 'AR' | 'FR' | 'EN';
type Currency = 'DZD' | 'EUR' | 'USD';

interface VaultsPageProps {
  language: Language;
  currency: Currency;
}

interface Vault {
  vaultId: string;
  vaultCode: string;
  name: string;
  warehouse: { code: string; name: string; location: any; securityLevel: string };
  securityGrade: string;
  capacityKg: string;
  currentOccupancyKg: string;
  occupancyPercent: string;
  temperatureControl: boolean;
  humidityControl: boolean;
  fireSupression: boolean;
  cctvMonitoring: boolean;
  accessControl: string;
  assetCount: number;
  insuranceValue: string | null;
  insuranceCurrency: string;
  lastInspectionAt: string | null;
  isActive: boolean;
}

interface VaultDetail extends Vault {
  climateControl: { temperature: boolean; humidity: boolean; fireSupression: boolean };
  monitoring: { cctv: boolean; accessControl: string };
  insurance: { value: string | null; currency: string };
  assets: Array<{
    inventoryId: string; custodyStatus: string; compartmentRef: string | null;
    currentValue: string | null; goldId: string; serialNumber: string;
    metalType: string; karat: number; weightNet: string; measuredPurity: string;
    productType: string; assetStatus: string;
  }>;
}

const t: Record<Language, Record<string, string>> = {
  AR: {
    title: 'إدارة الخزائن والمخازن',
    subtitle: 'مراقبة وإدارة الخزائن الآمنة وتخزين الأصول',
    warehouses: 'المخازن',
    vaults: 'الخزائن',
    all: 'الكل',
    security: 'الأمان',
    capacity: 'السعة',
    occupancy: 'الإشغال',
    assets: 'الأصول',
    climate: 'التحكم المناخي',
    monitoring: 'المراقبة',
    inspection: 'الفحص',
    none: 'لا يوجد',
    details: 'التفاصيل',
    back: 'رجوع',
    noVaults: 'لا توجد خزائن',
    code: 'الكود',
    grade: 'درجة الأمان',
    access: 'نوع الوصول',
    totalCapacity: 'إجمالي السعة',
    currentLoad: 'الحمولة الحالية',
    lastInspection: 'آخر فحص',
    insurance: 'التأمين',
  },
  FR: {
    title: 'Gestion des Coffres et Entrepôts',
    subtitle: 'Surveillance et gestion des coffres-forts et du stockage',
    warehouses: 'Entrepôts',
    vaults: 'Coffres-forts',
    all: 'Tous',
    security: 'Sécurité',
    capacity: 'Capacité',
    occupancy: 'Occupation',
    assets: 'Actifs',
    climate: 'Contrôle climatique',
    monitoring: 'Surveillance',
    inspection: 'Inspection',
    none: 'Aucun',
    details: 'Détails',
    back: 'Retour',
    noVaults: 'Aucun coffre-fort',
    code: 'Code',
    grade: 'Niveau sécurité',
    access: 'Contrôle d\'accès',
    totalCapacity: 'Capacité totale',
    currentLoad: 'Charge actuelle',
    lastInspection: 'Dernière inspection',
    insurance: 'Assurance',
  },
  EN: {
    title: 'Vaults & Warehouses Management',
    subtitle: 'Monitor and manage secure vaults and asset storage',
    warehouses: 'Warehouses',
    vaults: 'Vaults',
    all: 'All',
    security: 'Security',
    capacity: 'Capacity',
    occupancy: 'Occupancy',
    assets: 'Assets',
    climate: 'Climate Control',
    monitoring: 'Monitoring',
    inspection: 'Inspection',
    none: 'None',
    details: 'Details',
    back: 'Back',
    noVaults: 'No vaults found',
    code: 'Code',
    grade: 'Security Grade',
    access: 'Access Control',
    totalCapacity: 'Total Capacity',
    currentLoad: 'Current Load',
    lastInspection: 'Last Inspection',
    insurance: 'Insurance',
  },
};

const securityColors: Record<string, string> = {
  STANDARD: 'var(--color-info)',
  ENHANCED: 'var(--color-warning)',
  HIGH_SECURITY: 'var(--color-gold-400)',
  MILITARY_GRADE: 'var(--color-risk-red)',
};

const VaultsPage: React.FC<VaultsPageProps> = ({ language, currency }) => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState<VaultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVaults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/vaults?lang=${language}&currency=${currency}`);
      const data = await res.json();
      if (data.success) setVaults(data.data.vaults);
      else setError(data.error?.message || 'Failed to load vaults');
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [language, currency]);

  const fetchVaultDetail = useCallback(async (vaultId: string) => {
    try {
      const res = await apiFetch(`/api/v1/vaults/${vaultId}?lang=${language}&currency=${currency}`);
      const data = await res.json();
      if (data.success) setSelectedVault(data.data);
    } catch (e) { /* ignore */ }
  }, [language, currency]);

  useEffect(() => { fetchVaults(); }, [fetchVaults]);

  const tx = t[language];

  if (selectedVault) {
    return (
      <div style={{ padding: 'var(--space-xl)' }}>
        <button className="gold-btn gold-btn--ghost" onClick={() => setSelectedVault(null)}>
          ← {tx.back}
        </button>
        <h2 style={{ color: 'var(--color-gold-400)', margin: 'var(--space-lg) 0 var(--space-sm)' }}>
          {selectedVault.name}
        </h2>
        <p style={{ color: 'var(--color-primary-200)', marginBottom: 'var(--space-xl)' }}>
          {tx.code}: {selectedVault.vaultCode} | {tx.grade}: {selectedVault.securityGrade}
        </p>

        <div className="gold-erp-grid">
          <div className="gold-erp-stat">
            <div className="gold-erp-stat__number">{selectedVault.assetCount}</div>
            <div className="gold-erp-stat__label">{tx.assets}</div>
          </div>
          <div className="gold-erp-stat">
            <div className="gold-erp-stat__number">{selectedVault.occupancyPercent}%</div>
            <div className="gold-erp-stat__label">{tx.occupancy}</div>
          </div>
          <div className="gold-erp-stat">
            <div className="gold-erp-stat__number">{selectedVault.capacityKg} kg</div>
            <div className="gold-erp-stat__label">{tx.capacity}</div>
          </div>
          <div className="gold-erp-stat">
            <div className="gold-erp-stat__number">{selectedVault.insuranceValue || tx.none}</div>
            <div className="gold-erp-stat__label">{tx.insurance}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginTop: 'var(--space-xl)' }}>
          <div className="gold-card">
            <h3 style={{ color: 'var(--color-gold-400)', marginBottom: 'var(--space-md)' }}>{tx.climate}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <span>🌡️ Temperature: <span className="gold-badge gold-badge--success">{selectedVault.climateControl.temperature ? 'Active' : 'Off'}</span></span>
              <span>💧 Humidity: <span className="gold-badge gold-badge--success">{selectedVault.climateControl.humidity ? 'Active' : 'Off'}</span></span>
              <span>🔥 Fire Suppression: <span className="gold-badge gold-badge--success">{selectedVault.climateControl.fireSupression ? 'Active' : 'Off'}</span></span>
            </div>
          </div>
          <div className="gold-card">
            <h3 style={{ color: 'var(--color-gold-400)', marginBottom: 'var(--space-md)' }}>{tx.monitoring}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <span>📹 CCTV: <span className="gold-badge gold-badge--success">{selectedVault.monitoring.cctv ? 'Active' : 'Off'}</span></span>
              <span>🔐 Access: <span className="gold-badge gold-badge--gold">{selectedVault.monitoring.accessControl}</span></span>
            </div>
          </div>
        </div>

        {selectedVault.assets.length > 0 && (
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <h3 style={{ color: 'var(--color-gold-400)', marginBottom: 'var(--space-md)' }}>{tx.assets} ({selectedVault.assets.length})</h3>
            <table className="gold-table">
              <thead>
                <tr>
                  <th>{tx.code}</th>
                  <th>Metal</th>
                  <th>Karat</th>
                  <th>Weight</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {selectedVault.assets.map((a) => (
                  <tr key={a.inventoryId}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{a.goldId}</td>
                    <td><span className="gold-badge gold-badge--gold">{a.metalType}</span></td>
                    <td>{a.karat}K</td>
                    <td>{a.weightNet}g</td>
                    <td><span className={`gold-badge gold-badge--${a.custodyStatus === 'SECURE' ? 'success' : 'warning'}`}>{a.custodyStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-xl)' }}>
      <h1 style={{ color: 'var(--color-gold-400)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>{tx.title}</h1>
      <p style={{ color: 'var(--color-primary-200)', marginBottom: 'var(--space-xl)' }}>{tx.subtitle}</p>

      {loading && <div className="gold-spinner" style={{ margin: 'var(--space-3xl) auto' }} />}
      {error && <div style={{ color: 'var(--color-risk-red)', textAlign: 'center', padding: 'var(--space-xl)' }}>{error}</div>}

      {!loading && !error && vaults.length === 0 && (
        <p style={{ color: 'var(--color-primary-300)', textAlign: 'center', padding: 'var(--space-3xl)' }}>{tx.noVaults}</p>
      )}

      {!loading && !error && vaults.length > 0 && (
        <div className="gold-erp-grid">
          {vaults.map((v) => (
            <div
              key={v.vaultId}
              className="gold-card"
              style={{ cursor: 'pointer' }}
              onClick={() => fetchVaultDetail(v.vaultId)}
            >
              <div className="gold-card__header">
                <span className="gold-card__title">{v.name}</span>
                <span className="gold-badge gold-badge--gold">{v.vaultCode}</span>
              </div>

              <div style={{ marginBottom: 'var(--space-md)' }}>
                <span className="gold-badge" style={{ backgroundColor: securityColors[v.securityGrade] + '22', color: securityColors[v.securityGrade], border: `1px solid ${securityColors[v.securityGrade]}44` }}>
                  {v.securityGrade}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span style={{ color: 'var(--color-primary-300)', fontSize: '0.85rem' }}>{tx.occupancy}</span>
                <span style={{ color: 'var(--color-gold-400)', fontWeight: 600 }}>{v.occupancyPercent}%</span>
              </div>
              <div style={{ background: 'var(--color-primary-600)', borderRadius: 'var(--radius-full)', height: '8px', marginBottom: 'var(--space-md)' }}>
                <div style={{
                  background: `linear-gradient(90deg, var(--color-gold-600), var(--color-gold-400))`,
                  height: '100%',
                  borderRadius: 'var(--radius-full)',
                  width: `${Math.min(Number(v.occupancyPercent), 100)}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ color: 'var(--color-primary-400)' }}>{tx.assets}</span>
                  <span style={{ color: 'var(--color-primary-100)', marginLeft: 'var(--space-xs)', fontWeight: 600 }}>{v.assetCount}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-primary-400)' }}>{tx.capacity}</span>
                  <span style={{ color: 'var(--color-primary-100)', marginLeft: 'var(--space-xs)' }}>{v.capacityKg}kg</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
                {v.cctvMonitoring && <span className="gold-badge gold-badge--success" style={{ fontSize: '0.7rem' }}>CCTV</span>}
                {v.temperatureControl && <span className="gold-badge gold-badge--info" style={{ fontSize: '0.7rem' }}>TEMP</span>}
                {v.humidityControl && <span className="gold-badge gold-badge--info" style={{ fontSize: '0.7rem' }}>HUM</span>}
                {v.fireSupression && <span className="gold-badge gold-badge--warning" style={{ fontSize: '0.7rem' }}>FIRE</span>}
                <span className="gold-badge gold-badge--gold" style={{ fontSize: '0.7rem' }}>{v.accessControl}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VaultsPage;
