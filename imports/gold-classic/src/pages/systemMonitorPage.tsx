import React from 'react';
import { useFetch, PageShell, StatCard, Card, Loading, ErrorBox, Badge, fmtDate, fmtDateTime } from '../components/UiKit';
import type { Language, Currency } from '../components/UiKit';

interface SystemHealth {
  database: { status: string };
  uptime: { seconds: number; formatted: string };
  memory: { rss: string; heapUsed: string; heapTotal: string };
  activeConnections: number;
}

interface Integration {
  name: string;
  nameAr: string;
  status: string;
  lastChecked: string;
}

export function SystemMonitorPage({ language, currency }: { language: Language; currency: Currency }) {
  const health = useFetch<SystemHealth>('/api/v1/system/health');
  const integrations = useFetch<Integration[]>('/api/v1/system/integrations');

  const isLoading = health.loading || integrations.loading;
  const hasError = health.error || integrations.error;

  const t = (key: string): string => {
    const map: Record<string, Record<Language, string>> = {
      title: { AR: 'مراقبة النظام', FR: 'Surveillance du système', EN: 'System Monitor' },
      subtitle: { AR: 'صحة النظام، التكاملات، مراقبة SLA', FR: 'Santé système, intégrations, suivi SLA', EN: 'System health, integrations, SLA monitoring' },
      dbStatus: { AR: 'حالة قاعدة البيانات', FR: 'État de la base de données', EN: 'Database Status' },
      uptime: { AR: 'مدة التشغيل', FR: 'Durée de fonctionnement', EN: 'Uptime' },
      memory: { AR: 'الذاكرة', FR: 'Mémoire', EN: 'Memory' },
      activeConns: { AR: 'الاتصالات النشطة', FR: 'Connexions actives', EN: 'Active Connections' },
      integrationsTitle: { AR: 'التكاملات الخارجية', FR: 'Intégrations externes', EN: 'External Integrations' },
      status: { AR: 'الحالة', FR: 'Statut', EN: 'Status' },
      lastChecked: { AR: 'آخر فحص', FR: 'Dernière vérification', EN: 'Last Checked' },
      noIntegrations: { AR: 'لا توجد تكاملات', FR: 'Aucune intégration', EN: 'No integrations' },
      connected: { AR: 'متصل', FR: 'Connecté', EN: 'Connected' },
      disconnected: { AR: 'غير متصل', FR: 'Déconnecté', EN: 'Disconnected' },
    };
    return (map[key] && map[key][language]) || key;
  };

  if (isLoading) return <PageShell title={t('title')} subtitle={t('subtitle')} language={language}><Loading /></PageShell>;
  if (hasError) return <PageShell title={t('title')} subtitle={t('subtitle')} language={language}><ErrorBox message={String(health.error || integrations.error)} /></PageShell>;

  const h = health.data;
  const ints = integrations.data || [];

  return (
    <PageShell title={t('title')} subtitle={t('subtitle')} icon="📊" language={language}>
      {h && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard
            label={t('dbStatus')}
            value={h.database.status === 'connected' ? '🟢' : '🔴'}
            icon="🗄️"
            color={h.database.status === 'connected' ? '#3cb97e' : '#dc3545'}
          />
          <StatCard label={t('uptime')} value={h.uptime.formatted} icon="⏱️" />
          <StatCard label={t('memory')} value={h.memory.heapUsed} icon="🧠" />
          <StatCard label={t('activeConns')} value={h.activeConnections} icon="🔌" />
        </div>
      )}

      <Card title={t('integrationsTitle')}>
        {ints.length === 0 ? (
          <Empty text={t('noIntegrations')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ints.map((int, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <span style={{ color: '#c0c0d0', fontWeight: 600 }}>{language === 'AR' ? int.nameAr : int.name}</span>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Badge value={int.status === 'active' ? t('connected') : t('disconnected')} color={int.status === 'active' ? '#3cb97e' : '#dc3545'} />
                  <span style={{ color: '#8a8a9a', fontSize: 12 }}>{fmtDateTime(int.lastChecked, language)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageShell>
  );
}

export default SystemMonitorPage;