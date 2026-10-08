// ============================================================================
// GOLD PLATFORM — HOME DASHBOARD
// ============================================================================
// لوحة التحكم الرئيسية — إحصائيات الأصول، الخزائن، التنبيهات، وأحدث الأحداث

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { useAuth } from './AuthContext';

type Language = 'AR' | 'FR' | 'EN';
type Currency = 'DZD' | 'EUR' | 'USD';

interface Overview {
  totalAssets: number;
  activeAssets: number;
  totalVaults: number;
  totalWarehouses: number;
  fraudAlerts7d: number;
  pendingTransfers: number;
  completedAssays30d: number;
}

interface DashboardData {
  overview: Overview;
  assetsByStatus: Array<{ status: string; count: number }>;
  assetsByMetal: Array<{ metal: string; count: number }>;
  recentEvents: Array<{
    action: string;
    description: string;
    severity: string;
    user: string;
    timestamp: string;
  }>;
  systemOfRecord: { ar: string; fr: string; en: string };
}

const T: Record<Language, Record<string, string>> = {
  AR: {
    title: 'لوحة التحكم الرئيسية',
    welcome: 'مرحباً بك في منصة جوهر لإدارة الذهب والمعادن الثمينة',
    total_assets: 'إجمالي الأصول',
    active_assets: 'أصول نشطة',
    vaults: 'الخزائن',
    warehouses: 'المخازن',
    fraud_alerts: 'تنبيهات احتيال (7 أيام)',
    pending_transfers: 'نقل معلق',
    completed_assays: 'فحوصات ناجحة (30 يوم)',
    recent_events: 'أحدث الأحداث',
    assets_by_status: 'الأصول حسب الحالة',
    assets_by_metal: 'الأصول حسب المعدن',
    event_user: 'المستخدم',
    event_time: 'التاريخ',
    loading: 'جاري التحميل...',
    error: 'تعذر تحميل البيانات',
    currency: 'العملة',
    system_of_record: 'سجل النظام',
  },
  FR: {
    title: 'Tableau de Bord Principal',
    welcome: 'Bienvenue sur la plateforme JOHAR de gestion de l\'or',
    total_assets: 'Total Actifs',
    active_assets: 'Actifs Actifs',
    vaults: 'Coffres',
    warehouses: 'Entrepôts',
    fraud_alerts: 'Alertes Fraude (7j)',
    pending_transfers: 'Transferts en Attente',
    completed_assays: 'Analyses Réussies (30j)',
    recent_events: 'Événements Récents',
    assets_by_status: 'Actifs par Statut',
    assets_by_metal: 'Actifs par Métal',
    event_user: 'Utilisateur',
    event_time: 'Date',
    loading: 'Chargement...',
    error: 'Erreur de chargement',
    currency: 'Devise',
    system_of_record: 'Système de référence',
  },
  EN: {
    title: 'Home Dashboard',
    welcome: 'Welcome to the JOHAR Precious Metals Management System',
    total_assets: 'Total Assets',
    active_assets: 'Active Assets',
    vaults: 'Vaults',
    warehouses: 'Warehouses',
    fraud_alerts: 'Fraud Alerts (7d)',
    pending_transfers: 'Pending Transfers',
    completed_assays: 'Completed Assays (30d)',
    recent_events: 'Recent Events',
    assets_by_status: 'Assets by Status',
    assets_by_metal: 'Assets by Metal',
    event_user: 'User',
    event_time: 'Date',
    loading: 'Loading...',
    error: 'Failed to load data',
    currency: 'Currency',
    system_of_record: 'System of Record',
  },
};

function useDashboard(enabled: boolean): { data: DashboardData | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiFetch('/api/v1/erp/dashboard')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json.data as DashboardData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Network error');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [enabled]);

  return { data, loading, error };
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  sub?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, sub }) => (
  <div style={{
    background: 'rgba(20, 20, 30, 0.9)',
    border: '1px solid rgba(198, 169, 105, 0.12)',
    borderRadius: 12,
    padding: '20px 16px',
    flex: '1 1 180px',
    minWidth: 160,
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', top: -20, right: -20, width: 80, height: 80,
      borderRadius: '50%', background: `${color}18`, filter: 'blur(2px)',
    }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
    </div>
    <div style={{ color: '#c0c0d0', fontSize: 13, fontWeight: 600 }}>{label}</div>
    {sub && <div style={{ color: '#7a7a88', fontSize: 11, marginTop: 4 }}>{sub}</div>}
  </div>
);

const SEVERITY_COLORS: Record<string, string> = {
  INFO: '#5b8ff9',
  LOW: '#5b8ff9',
  MEDIUM: '#f5a623',
  MODERATE: '#f5a623',
  HIGH: '#e8564a',
  CRITICAL: '#dc3545',
};

export const HomeDashboard: React.FC<{ language: Language; currency: Currency }> = ({ language, currency }) => {
  const { hasPermission } = useAuth();
  const allowed = hasPermission('report:view');
  const { data, loading, error } = useDashboard(allowed);
  const t = T[language];
  const dir = language === 'AR' ? 'rtl' : 'ltr';

  const fmt = useCallback((n: number | undefined) =>
    (n ?? 0).toLocaleString('en-US'), []);

  if (!allowed) {
    return (
      <div dir={dir} style={{ padding: '32px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: '#c6a969', fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>
            {t.title}
          </h1>
          <p style={{ color: '#8a8a9a', fontSize: 14, margin: 0 }}>{t.welcome}</p>
        </div>
        <div style={{
          padding: '40px 24px',
          background: 'rgba(198, 169, 105, 0.05)',
          border: '1px solid rgba(198, 169, 105, 0.15)',
          borderRadius: 12,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🔒</div>
          <p style={{ color: '#c0c0d0', fontSize: 15, fontWeight: 600 }}>This dashboard requires the <code style={{ color: '#c6a969' }}>report:view</code> permission.</p>
          <p style={{ color: '#7a7a88', fontSize: 13, marginTop: 8 }}>Contact your platform administrator to request access.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#8a8a9a' }}>
        <div style={{ fontSize: 32, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</div>
        <p style={{ marginTop: 12 }}>{t.loading}</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#dc3545' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <p>{t.error}</p>
      </div>
    );
  }

  const { overview } = data;

  return (
    <div dir={dir} style={{ padding: '32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* العنوان */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#c6a969', fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>
          {t.title}
        </h1>
        <p style={{ color: '#8a8a9a', fontSize: 14, margin: 0 }}>{t.welcome}</p>
      </div>

      {/* بطاقات الإحصائيات */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
        <StatCard label={t.total_assets} value={fmt(overview.totalAssets)} icon="💎" color="#c6a969" />
        <StatCard label={t.active_assets} value={fmt(overview.activeAssets)} icon="✅" color="#3cb97e" />
        <StatCard label={t.vaults} value={fmt(overview.totalVaults)} icon="🏦" color="#5b8ff9" />
        <StatCard label={t.warehouses} value={fmt(overview.totalWarehouses)} icon="🏭" color="#8b7be8" />
        <StatCard label={t.completed_assays} value={fmt(overview.completedAssays30d)} icon="🔬" color="#e8a13c" />
        <StatCard
          label={t.fraud_alerts}
          value={fmt(overview.fraudAlerts7d)}
          icon="🛡️"
          color={(overview.fraudAlerts7d ?? 0) > 0 ? '#e8564a' : '#3cb97e'}
          sub={currency}
        />
        <StatCard label={t.pending_transfers} value={fmt(overview.pendingTransfers)} icon="🚚" color="#4ecdc4" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 28 }}>
        {/* الأصول حسب الحالة */}
        <div style={{
          background: 'rgba(20, 20, 30, 0.9)',
          border: '1px solid rgba(198, 169, 105, 0.12)',
          borderRadius: 12,
          padding: 20,
        }}>
          <h3 style={{ color: '#c6a969', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>
            {t.assets_by_status}
          </h3>
          {data.assetsByStatus.length === 0 ? (
            <p style={{ color: '#666', fontSize: 13 }}>—</p>
          ) : (
            data.assetsByStatus.map((s) => {
              const pct = overview.totalAssets > 0 ? Math.round((s.count / overview.totalAssets) * 100) : 0;
              return (
                <div key={s.status} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#c0c0d0', fontSize: 13 }}>{s.status}</span>
                    <span style={{ color: '#c6a969', fontSize: 13, fontWeight: 700 }}>{s.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #c6a969, #a67c00)',
                      borderRadius: 4,
                      transition: 'width 0.4s',
                    }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* الأصول حسب المعدن */}
        <div style={{
          background: 'rgba(20, 20, 30, 0.9)',
          border: '1px solid rgba(198, 169, 105, 0.12)',
          borderRadius: 12,
          padding: 20,
        }}>
          <h3 style={{ color: '#c6a969', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>
            {t.assets_by_metal}
          </h3>
          {data.assetsByMetal.length === 0 ? (
            <p style={{ color: '#666', fontSize: 13 }}>—</p>
          ) : (
            data.assetsByMetal.map((m) => {
              const pct = overview.totalAssets > 0 ? Math.round((m.count / overview.totalAssets) * 100) : 0;
              return (
                <div key={m.metal} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#c0c0d0', fontSize: 13 }}>{m.metal}</span>
                    <span style={{ color: '#c6a969', fontSize: 13, fontWeight: 700 }}>{m.count}</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #a67c00, #dcb96b)',
                      borderRadius: 4,
                      transition: 'width 0.4s',
                    }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* سجل النظام */}
      <div style={{
        marginBottom: 28,
        padding: '14px 20px',
        background: 'rgba(198, 169, 105, 0.05)',
        border: '1px solid rgba(198, 169, 105, 0.15)',
        borderRadius: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🗄️</span>
          <span style={{ color: '#c6a969', fontSize: 13, fontWeight: 700 }}>{t.system_of_record}:</span>
          <span style={{ color: '#8a8a9a', fontSize: 13 }}>{data.systemOfRecord[language === 'AR' ? 'ar' : language === 'FR' ? 'fr' : 'en']}</span>
        </div>
      </div>

      {/* أحدث الأحداث */}
      <div style={{
        background: 'rgba(20, 20, 30, 0.9)',
        border: '1px solid rgba(198, 169, 105, 0.12)',
        borderRadius: 12,
        padding: 20,
      }}>
        <h3 style={{ color: '#c6a969', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>
          {t.recent_events}
        </h3>
        {data.recentEvents.length === 0 ? (
          <p style={{ color: '#666', fontSize: 13 }}>—</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.recentEvents.map((ev, i) => {
              const severityColor = SEVERITY_COLORS[ev.severity] || '#8a8a9a';
              const dt = new Date(ev.timestamp);
              const time = dt.toLocaleString(language === 'AR' ? 'ar-DZ' : language === 'FR' ? 'fr-FR' : 'en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              });
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', background: 'rgba(255,255,255,0.02)',
                  borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)',
                }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: severityColor, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#e0e0ec', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ev.action}
                    </div>
                    <div style={{ color: '#8a8a9a', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ev.description}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: '#7a7a88', fontSize: 11 }}>{time}</div>
                    <div style={{ color: '#5a5a68', fontSize: 11 }}>{ev.user}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeDashboard;