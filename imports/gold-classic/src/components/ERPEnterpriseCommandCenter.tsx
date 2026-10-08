// ============================================================================
// GOLD PLATFORM — ERP ENTERPRISE COMMAND CENTER UI COMPONENT
// ============================================================================
// لوحة تحكم تشغيلية بـ 3 لغات لمراقبة المخزون، سجل التنبيهات الأمنية
// والتتبع اللحظي للخزائن
//
// الهوية البصرية: Deep Graphite + Precious Gold + Risk Red للتنبيهات

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

// ============================================================================
// TYPES
// ============================================================================

type Language = 'AR' | 'FR' | 'EN';

interface ERPData {
  overview: Record<string, number>;
  assetsByStatus: Array<{ status: string; count: number }>;
  assetsByMetal: Array<{ metal: string; count: number }>;
  recentEvents: Array<{
    action: string;
    description: string;
    severity: string;
    user: string;
    timestamp: string;
  }>;
}

interface FraudAlert {
  logId: string;
  asset: {
    goldId: string;
    serialNumber: string;
    metalType: string;
    weightGross: number;
  };
  riskLevel: number;
  riskLevelLabel: string;
  anomalyType: string;
  requiresHumanReview: boolean;
  isResolved: boolean;
  createdAt: string;
}

interface ERPCommandCenterProps {
  language: Language;
  currency: string;
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const T: Record<string, Record<Language, string>> = {
  title: { AR: 'لوحة التحكم التشغيلية', FR: 'Centre de Commandement Opérationnel', EN: 'Operational Command Center' },
  overview: { AR: 'نظرة عامة', FR: "Vue d'ensemble", EN: 'Overview' },
  inventory: { AR: 'المخزون', FR: 'Inventaire', EN: 'Inventory' },
  fraud_alerts: { AR: 'تنبيهات الاحتيال', FR: 'Alertes de fraude', EN: 'Fraud Alerts' },
  recent_events: { AR: 'آخر الأحداث', FR: 'Derniers événements', EN: 'Recent Events' },
  total_assets: { AR: 'إجمالي الأصول', FR: 'Total des actifs', EN: 'Total Assets' },
  in_custody: { AR: 'تحت الحيازة', FR: 'En conservation', EN: 'In Custody' },
  in_transit: { AR: 'في النقل', FR: 'En transit', EN: 'In Transit' },
  listed: { AR: 'معروض', FR: 'Listé', EN: 'Listed' },
  sold: { AR: 'مباع', FR: 'Vendu', EN: 'Sold' },
  pending_review: { AR: 'بانتظار المراجعة', FR: 'En attente de révision', EN: 'Pending Review' },
  risk_level: { AR: 'مستوى الخطورة', FR: 'Niveau de risque', EN: 'Risk Level' },
  anomaly_type: { AR: 'نوع الشذوذ', FR: "Type d'anomalie", EN: 'Anomaly Type' },
  action: { AR: 'الإجراء', FR: 'Action', EN: 'Action' },
  view_details: { AR: 'عرض التفاصيل', FR: 'Voir les détails', EN: 'View Details' },
  mark_resolved: { AR: 'تحديد كمحوّل', FR: 'Marquer comme résolu', EN: 'Mark Resolved' },
  system_of_record: { AR: 'نقطة التسجيل المركزي — ERP هو السجل التشغيلي الأساسي', FR: "Point d'enregistrement principal", EN: 'System of Record' },
  no_data: { AR: 'لا توجد بيانات', FR: 'Aucune donnée', EN: 'No Data' },
  by_status: { AR: 'حسب الحالة', FR: 'Par statut', EN: 'By Status' },
  by_metal: { AR: 'حسب نوع المعدن', FR: 'Par métal', EN: 'By Metal' },
  low: { AR: 'منخفض', FR: 'Faible', EN: 'Low' },
  medium: { AR: 'متوسط', FR: 'Moyen', EN: 'Medium' },
  high: { AR: 'عالي', FR: 'Élevé', EN: 'High' },
  critical: { AR: 'حرج', FR: 'Critique', EN: 'Critical' },
};

// ============================================================================
// ERP ENTERPRISE COMMAND CENTER COMPONENT
// ============================================================================

export const ERPEnterpriseCommandCenter: React.FC<ERPCommandCenterProps> = ({
  language,
  currency,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'fraud'>('overview');
  const [dashboardData, setDashboardData] = useState<ERPData | null>(null);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const direction = language === 'AR' ? 'rtl' : 'ltr';
  const { hasPermission } = useAuth();
  const allowed = hasPermission('report:view');

  // جلب البيانات
  const fetchData = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [dashboardRes, fraudRes] = await Promise.all([
        fetch(`/api/v1/erp/dashboard?lang=${language}&currency=${currency}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
        }),
        fetch(`/api/v1/erp/fraud-alerts?status=pending&lang=${language}&currency=${currency}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
        }),
      ]);

      if (dashboardRes.ok) {
        const dashData = await dashboardRes.json();
        setDashboardData(dashData.data);
      }

      if (fraudRes.ok) {
        const fraudData = await fraudRes.json();
        setFraudAlerts(fraudData.data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to fetch ERP data:', error);
    } finally {
      setLoading(false);
    }
  }, [language, currency, allowed]);

  useEffect(() => {
    fetchData();
    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // تحديد لون الخطورة
  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'CRITICAL': return 'var(--color-risk-red)';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return 'var(--color-warning)';
      case 'LOW': return 'var(--color-success)';
      default: return 'var(--color-primary-200)';
    }
  };

  const getRiskBadgeClass = (level: string): string => {
    switch (level) {
      case 'CRITICAL': return 'gold-badge--danger';
      case 'HIGH': return 'gold-badge--warning';
      case 'MEDIUM': return 'gold-badge--info';
      case 'LOW': return 'gold-badge--success';
      default: return 'gold-badge--info';
    }
  };

  if (!allowed) {
    return (
      <div dir={direction} style={{ padding: 'var(--space-xl)' }}>
        <div style={{ padding: 'var(--space-xl)', textAlign: 'center', background: 'rgba(198,169,105,0.05)', border: '1px solid rgba(198,169,105,0.15)', borderRadius: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🔒</div>
          <p style={{ color: 'var(--color-primary-100)', fontSize: '0.9rem', fontWeight: 600 }}>This dashboard requires the <code style={{ color: 'var(--color-gold-400)' }}>report:view</code> permission.</p>
          <p style={{ color: 'var(--color-primary-300)', fontSize: '0.8rem', marginTop: 8 }}>Contact your platform administrator to request access.</p>
        </div>
      </div>
    );
  }

  if (loading && !dashboardData) {
    return (
      <div className="gold-verification" dir={direction}>
        <div className="gold-spinner" style={{ margin: '0 auto', width: 48, height: 48 }} />
      </div>
    );
  }

  return (
    <div dir={direction} style={{ padding: 'var(--space-xl)' }}>
      {/* العنوان الرئيسي */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ color: 'var(--color-gold-400)', fontSize: '1.5rem', margin: 0 }}>
            {T.title[language]}
          </h1>
          <p style={{ color: 'var(--color-primary-300)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
            {T.system_of_record[language]}
          </p>
        </div>
        <button className="gold-btn gold-btn--ghost gold-btn--sm" onClick={fetchData}>
          ↻
        </button>
      </div>

      {/* شريط التبويب */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-xl)' }}>
        {(['overview', 'inventory', 'fraud'] as const).map((tab) => (
          <button
            key={tab}
            className={`gold-btn gold-btn--sm ${
              activeTab === tab ? 'gold-btn--primary' : 'gold-btn--ghost'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' ? T.overview[language] : tab === 'inventory' ? T.inventory[language] : T.fraud_alerts[language]}
          </button>
        ))}
      </div>

      {/* نظرة عامة */}
      {activeTab === 'overview' && dashboardData && (
        <>
          {/* إحصائيات */}
          <div className="gold-erp-grid">
            {Object.entries(dashboardData.overview).map(([label, value]) => (
              <div key={label} className="gold-erp-stat">
                <div className="gold-erp-stat__number">{value}</div>
                <div className="gold-erp-stat__label">{label}</div>
              </div>
            ))}
          </div>

          {/* توزيع الأصول */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginTop: 'var(--space-xl)' }}>
            {/* حسب الحالة */}
            <div className="gold-card">
              <div className="gold-card__header">
                <span className="gold-card__title">{T.by_status[language]}</span>
              </div>
              {dashboardData.assetsByStatus.map((item) => (
                <div key={item.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-primary-600)' }}>
                  <span style={{ color: 'var(--color-primary-200)', fontSize: '0.85rem' }}>{item.status}</span>
                  <span style={{ color: 'var(--color-gold-400)', fontWeight: 700 }}>{item.count}</span>
                </div>
              ))}
            </div>

            {/* حسب نوع المعدن */}
            <div className="gold-card">
              <div className="gold-card__header">
                <span className="gold-card__title">{T.by_metal[language]}</span>
              </div>
              {dashboardData.assetsByMetal.map((item) => (
                <div key={item.metal} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-primary-600)' }}>
                  <span style={{ color: 'var(--color-primary-200)', fontSize: '0.85rem' }}>{item.metal}</span>
                  <span style={{ color: 'var(--color-gold-400)', fontWeight: 700 }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* آخر الأحداث */}
          <div className="gold-card" style={{ marginTop: 'var(--space-xl)' }}>
            <div className="gold-card__header">
              <span className="gold-card__title">{T.recent_events[language]}</span>
            </div>
            <table className="gold-table">
              <thead>
                <tr>
                  <th>{T.action[language]}</th>
                  <th style={{ width: '40%' }}>{language === 'AR' ? 'الوصف' : language === 'FR' ? 'Description' : 'Description'}</th>
                  <th>{language === 'AR' ? 'المستخدم' : language === 'FR' ? 'Utilisateur' : 'User'}</th>
                  <th>{language === 'AR' ? 'الشدة' : language === 'FR' ? 'Sévérité' : 'Severity'}</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentEvents.map((event, index) => (
                  <tr key={index}>
                    <td>
                      <span className="gold-badge gold-badge--gold" style={{ fontSize: '0.7rem' }}>
                        {event.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-primary-200)' }}>
                      {event.description}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{event.user}</td>
                    <td>
                      <span className={`gold-badge ${event.severity === 'CRITICAL' ? 'gold-badge--danger' : event.severity === 'WARNING' ? 'gold-badge--warning' : 'gold-badge--info'}`}>
                        {event.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* المخزون */}
      {activeTab === 'inventory' && (
        <div className="gold-card">
          <div className="gold-card__header">
            <span className="gold-card__title">{T.inventory[language]}</span>
          </div>
          <p style={{ color: 'var(--color-primary-300)', textAlign: 'center', padding: 40 }}>
            {language === 'AR'
              ? 'يرجى زيارة صفحة المطابقة للحصول على تفاصيل المخزون الكاملة'
              : language === 'FR'
              ? 'Veuillez consulter la page de réconciliation pour les détails complets'
              : 'Visit the reconciliation page for full inventory details'}
          </p>
        </div>
      )}

      {/* تنبيهات الاحتيال */}
      {activeTab === 'fraud' && (
        <div className="gold-card">
          <div className="gold-card__header">
            <span className="gold-card__title">{T.fraud_alerts[language]}</span>
            <span className="gold-badge gold-badge--danger">
              {fraudAlerts.length} {T.pending_review[language]}
            </span>
          </div>

          {fraudAlerts.length === 0 ? (
            <p style={{ color: 'var(--color-primary-300)', textAlign: 'center', padding: 40 }}>
              {T.no_data[language]}
            </p>
          ) : (
            <table className="gold-table">
              <thead>
                <tr>
                  <th>{language === 'AR' ? 'الأصل' : language === 'FR' ? 'Actif' : 'Asset'}</th>
                  <th>{T.risk_level[language]}</th>
                  <th>{T.anomaly_type[language]}</th>
                  <th>{language === 'AR' ? 'التاريخ' : language === 'FR' ? 'Date' : 'Date'}</th>
                  <th>{T.action[language]}</th>
                </tr>
              </thead>
              <tbody>
                {fraudAlerts.map((alert) => (
                  <tr key={alert.logId}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{alert.asset.goldId}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-300)' }}>
                          {alert.asset.metalType} — {alert.asset.weightGross}g
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`gold-badge ${getRiskBadgeClass(alert.riskLevelLabel)}`}>
                        {alert.riskLevelLabel}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{alert.anomalyType}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-primary-300)' }}>
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="gold-btn gold-btn--ghost gold-btn--sm" style={{ fontSize: '0.7rem' }}>
                          {T.view_details[language]}
                        </button>
                        {!alert.isResolved && (
                          <button className="gold-btn gold-btn--secondary gold-btn--sm" style={{ fontSize: '0.7rem' }}>
                            {T.mark_resolved[language]}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default ERPEnterpriseCommandCenter;
