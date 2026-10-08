// ============================================================================
// JOHAR — CONTROL CENTER PAGE (بند 21 في BRD)
// ============================================================================
// لوحة التحكم المؤسسية: 5 بطاقات KPI + لوحات حية
// (معاملات، مخاطر، أدلة بلوكشين، مالية، لوجستيك، دعم)
// الوصول: SA / OM / AU (PAGE_ACCESS) + الخادم يفرض report:view platform

import React, { useEffect, useState, useCallback } from 'react';
import {
  PageShell,
  StatCard,
  Card,
  DataTable,
  Td,
  Badge,
  Loading,
  ErrorBox,
  Empty,
  EventList,
  fmtNum,
  fmtMoney,
  fmtDateTime,
} from '../components/UiKit';
import type { Language, Currency } from '../components/UiKit';
import { apiFetch } from '../utils/apiFetch';

interface SummaryData {
  generatedAt?: string;
  database?: string;
  kpis: {
    vaa: { verifiedActiveAssets: number; totalAssets: number; verificationRate: number };
    users: { verified: number; registered: number };
    organizations: { verified: number; total: number };
    escrow: { openCount: number; totalHeld: number; byCurrency: Record<string, { count: number; sum: number }> };
    hitlQueue: { pendingAiResults: number; openFraudLogs: number };
  };
  trade?: {
    sales: {
      ordersByStatus: Record<string, number>;
      ordersValueByCurrency: Record<string, number>;
      invoicesByStatus: Record<string, number>;
      invoicesValueByCurrency: Record<string, number>;
      pipeline: Record<string, number>;
    };
    procurement: {
      requestsByStatus: Record<string, number>;
      rfqsByStatus: Record<string, number>;
      purchaseOrdersByStatus: Record<string, number>;
      purchaseOrdersValueByCurrency: Record<string, number>;
      goodsReceiptsByInspection: Record<string, number>;
      suppliersByStatus: Record<string, number>;
      suppliersByCategory: Record<string, number>;
    };
  };
  liveTransactions: Array<{
    id: string; action: string; entityType: string; severity: string; category: string;
    description?: string | null; createdAt: string;
  }>;
  auditLast24h: Record<string, number>;
  assetStatus?: Record<string, number>;
  contactByStatus: Record<string, number>;
  risk: { openFraudAlerts: number; openFraudCritical: number };
  blockchain: {
    totalEvidence: number; verifiedEvidence: number;
    recent: Array<{ eventType: string; sourceSystem: string; currentHash: string; isVerified: boolean; createdAt: string }>;
  };
  logistics: { totalEvents: number; byType: Array<{ eventType: string; count: number }> };
}

type Lang = Language;

export function ControlCenterPage({ language }: { language: Language; currency: Currency }) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const badgeSum = (rec: Record<string, number>): number =>
    Object.values(rec || {}).reduce((a, b) => a + (Number(b) || 0), 06);

  const sumCurrency = (rec: Record<string, number>): number =>
    Object.values(rec || {}).reduce((a, b) => a + (Number(b) || 0), 0);

  const topCurrency = (rec: Record<string, number>): string => {
    const entries = Object.entries(rec || {});
    if (entries.length === 0) return 'USD';
    return entries.reduce((a, b) => (Number(a[1]) >= Number(b[1]) ? a : b))[0];
  };

  const t = (key: string): string => {
    const map: Record<string, Record<Lang, string>> = {
      title: { AR: 'مركز التحكم — JOHAR', FR: 'Centre de Contrôle — JOHAR', EN: 'JOHAR Control Center' },
      subtitle: { AR: 'نظرة المؤسسة الحية: KPIs، معاملات، مخاطر، أدلة، مالية، لوجستيك', FR: 'Vue institutionnelle en direct', EN: 'Live institutional overview' },
      trade: { AR: 'التجارة والمشتريات (بند 31.3)', FR: 'Commerce et achats (§31.3)', EN: 'Trade & Procurement (§31.3)' },
      tradePipeline: { AR: 'قناة التجارة', FR: 'Pipeline commercial', EN: 'Trade Pipeline' },
      salesOrders: { AR: 'أوامر البيع', FR: 'Commandes de vente', EN: 'Sales Orders' },
      salesValue: { AR: 'قيمة المبيعات', FR: 'Valeur des ventes', EN: 'Sales Value' },
      invoices: { AR: 'فواتير البيع', FR: 'Factures de vente', EN: 'Sales Invoices' },
      purchaseOrders: { AR: 'أوامر الشراء', FR: 'Commandes d\'achat', EN: 'Purchase Orders' },
      suppliers: { AR: 'الموردون', FR: 'Fournisseurs', EN: 'Suppliers' },
      count: { AR: 'العدد', FR: 'Nombre', EN: 'Count' },
      subtitle: { AR: 'نظرة المؤسسة الحية: KPIs، معاملات، مخاطر، أدلة، مالية، لوجستيك', FR: 'Vue institutionnelle en direct', EN: 'Live institutional overview' },
      vaa: { AR: 'أصول نشطة موثقة (VAA)', FR: 'Actifs vérifiés actifs (VAA)', EN: 'Verified Active Assets (VAA)' },
      verifiedUsers: { AR: 'مستخدمون موثقون', FR: 'Utilisateurs vérifiés', EN: 'Verified Users' },
      verifiedOrgs: { AR: 'مؤسسات موثقة', FR: 'Organisations vérifiées', EN: 'Verified Organizations' },
      openEscrow: { AR: 'ضمانات مفتوحة', FR: 'Séquestres ouverts', EN: 'Open Escrow' },
      hitlQueue: { AR: 'طابور المراجعة البشرية', FR: 'File de revue humaine', EN: 'Human Review Queue' },
      refresh: { AR: 'تحديث', FR: 'Actualiser', EN: 'Refresh' },
      liveTx: { AR: 'المعاملات الحية', FR: 'Transactions en direct', EN: 'Live Transactions' },
      risk: { AR: 'مراقبة المخاطر', FR: 'Surveillance des risques', EN: 'Risk Monitor' },
      blockchain: { AR: 'أدلة البلوكشين', FR: 'Preuves Blockchain', EN: 'Blockchain Evidence' },
      finance: { AR: 'النظرة المالية', FR: 'Aperçu financier', EN: 'Financial Overview' },
      logistics: { AR: 'اللوجستيك', FR: 'Logistique', EN: 'Logistics' },
      support: { AR: 'قائمة الدعم', FR: 'File d\'assistance', EN: 'Support Queue' },
      audit24h: { AR: 'التدقيق (24 ساعة)', FR: 'Audit (24h)', EN: 'Audit (24h)' },
      db: { AR: 'قاعدة البيانات', FR: 'Base de données', EN: 'Database' },
      green: { AR: 'أخضر', FR: 'Vert', EN: 'Green' },
      yellow: { AR: 'أصفر', FR: 'Jaune', EN: 'Yellow' },
      red: { AR: 'أحمر', FR: 'Rouge', EN: 'Red' },
      openFraud: { AR: 'إنذارات احتيال مفتوحة', FR: 'Alertes fraude ouvertes', EN: 'Open Fraud Alerts' },
      criticalFraud: { AR: 'احتيال حرِج', FR: 'Fraude critique', EN: 'Critical Fraud' },
      integrity: { AR: 'النزاهة', FR: 'Intégrité', EN: 'Integrity' },
      verified: { AR: 'موثقة', FR: 'Vérifiées', EN: 'Verified' },
      total: { AR: 'إجمالي', FR: 'Total', EN: 'Total' },
      noEvents: { AR: 'لا توجد أحداث حديثة', FR: 'Aucun événement récent', EN: 'No recent events' },
      denied: { AR: 'مرفوض — تتطلب صلاحية تقارير المنصة (report:view)', FR: 'Refusé — privilège report:view requis', EN: 'Denied — platform report:view required' },
      connected: { AR: 'متصل', FR: 'Connectée', EN: 'Connected' },
      disconnected: { AR: 'غير متصل', FR: 'Déconnectée', EN: 'Disconnected' },
      trade: { AR: 'التجارة والمشتريات', FR: 'Commerce et Approvisionnement', EN: 'Trade & Procurement' },
      salesOrders: { AR: 'أوامر البيع', FR: 'Commandes de vente', EN: 'Sales Orders' },
      salesValue: { AR: 'قيمة المبيعات', FR: 'Valeur des ventes', EN: 'Sales Value' },
      invoices: { AR: 'فواتير البيع', FR: 'Factures de vente', EN: 'Sales Invoices' },
      purchaseOrders: { AR: 'أوامر الشراء', FR: 'Commandes d\'achat', EN: 'Purchase Orders' },
      suppliers: { AR: 'الموردون', FR: 'Fournisseurs', EN: 'Suppliers' },
      tradePipeline: { AR: 'قناة التجارة', FR: 'Pipeline commercial', EN: 'Trade Pipeline' },
      count: { AR: 'العدد', FR: 'Nombre', EN: 'Count' },
    };
    return (map[key] && map[key][language]) || key;
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, tradeRes] = await Promise.all([
        apiFetch('/api/v1/control-center/summary'),
        apiFetch('/api/v1/control-center/trade-overview'),
      ]);
      const [summaryJson, tradeJson] = await Promise.all([
        summaryRes.json().catch(() => ({})),
        tradeRes.json().catch(() => ({})),
      ]);
      if (!summaryRes.ok || !tradeRes.ok) {
        const err = (summaryJson as any)?.error || (tradeJson as any)?.error;
        setError((err && err.message) || `${summaryRes.status} ${summaryRes.statusText}`);
        return;
      }
      const merged: SummaryData = { ...(summaryJson as any).data, trade: (tradeJson as any).data };
      setData(merged);
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const riskBox = (color: string, label: string, value: number) => (
    <div style={{
      flex: '1 1 120px', padding: '14px 16px', borderRadius: 10,
      background: `${color}12`, border: `1px solid ${color}55`, textAlign: 'center',
    }}>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ color: '#8a8a9a', fontSize: 12, fontWeight: 600, marginTop: 4 }}>{label}</div>
    </div>
  );

  if (loading) return <PageShell title={t('title')} subtitle={t('subtitle')} icon="🧭" language={language}><Loading text="JOHAR" /></PageShell>;
  if (error) return <PageShell title={t('title')} subtitle={t('subtitle')} icon="🧭" language={language}><ErrorBox message={error} /></PageShell>;
  if (!data) return <PageShell title={t('title')} subtitle={t('subtitle')} icon="🧭" language={language}><Empty text="—" /></PageShell>;

  const k = data.kpis;
  const riskRed = (data.auditLast24h.ERROR || 0) + (data.auditLast24h.CRITICAL || 0) + data.risk.openFraudCritical;
  const riskYellow = (data.auditLast24h.WARNING || 0) + (data.risk.openFraudAlerts - data.risk.openFraudCritical);
  const riskGreen = k.organizations.verified + k.users.verified;

  return (
    <PageShell
      title={t('title')}
      subtitle={t('subtitle')}
      icon="🧭"
      language={language}
      actions={<button onClick={load} style={{
        padding: '9px 18px', background: 'linear-gradient(135deg, #c6a969, #a67c00)',
        border: 'none', borderRadius: 8, color: '#0a0a0f', fontSize: 13, fontWeight: 700, cursor: 'pointer',
      }}>⟳ {t('refresh')}</button>}
    >
      {/* ── 5 بطاقات KPI ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
        <StatCard label={t('vaa')} value={`${fmtNum(k.vaa.verifiedActiveAssets)} / ${fmtNum(k.vaa.totalAssets)}`} icon="🥇" sub={`${k.vaa.verificationRate}%`} color="#c6a969" />
        <StatCard label={t('verifiedUsers')} value={`${fmtNum(k.users.verified)} / ${fmtNum(k.users.registered)}`} icon="👤" color="#3cb97e" />
        <StatCard label={t('verifiedOrgs')} value={`${fmtNum(k.organizations.verified)} / ${fmtNum(k.organizations.total)}`} icon="🏢" color="#5b8ff9" />
        <StatCard label={t('openEscrow')} value={fmtNum(k.escrow.openCount)} icon="🔒" sub={fmtMoney(k.escrow.totalHeld, 'USD')} color="#a67c00" />
        <StatCard label={t('hitlQueue')} value={fmtNum(k.hitlQueue.pendingAiResults + k.hitlQueue.openFraudLogs)} icon="👥" sub={`AI ${k.hitlQueue.pendingAiResults} · ${t('openFraud')} ${k.hitlQueue.openFraudLogs}`} color="#f5a623" />
      </div>

      {/* ── بطاقة التجارة (Trade §31.3) ── */}
      {data.trade && (
        <Card title={`💱 ${t('trade')}`}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
            <div style={{ flex: '1 1 170px', padding: '14px 16px', borderRadius: 10, background: '#0e3a5f12', border: '1px solid #0e3a5f55' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#5aa0e8' }}>{fmtNum(badgeSum(data.trade.sales.ordersByStatus))}</div>
              <div style={{ color: '#8a8a9a', fontSize: 11, fontWeight: 600, marginTop: 4 }}>{t('salesOrders')}</div>
            </div>
            <div style={{ flex: '1 1 170px', padding: '14px 16px', borderRadius: 10, background: '#5b8ff912', border: '1px solid #5b8ff955' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#7aa2ff' }}>{fmtMoney(sumCurrency(data.trade.sales.ordersValueByCurrency), topCurrency(data.trade.sales.ordersValueByCurrency))}</div>
              <div style={{ color: '#8a8a9a', fontSize: 11, fontWeight: 600, marginTop: 4 }}>{t('salesValue')}</div>
            </div>
            <div style={{ flex: '1 1 170px', padding: '14px 16px', borderRadius: 10, background: '#a67c0012', border: '1px solid #a67c0055' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#e0b050' }}>{fmtNum(badgeSum(data.trade.sales.invoicesByStatus))}</div>
              <div style={{ color: '#8a8a9a', fontSize: 11, fontWeight: 600, marginTop: 4 }}>{t('invoices')}</div>
            </div>
            <div style={{ flex: '1 1 170px', padding: '14px 16px', borderRadius: 10, background: '#3cb97e12', border: '1px solid #3cb97e55' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#3cb97e' }}>{fmtNum(badgeSum(data.trade.procurement.purchaseOrdersByStatus))}</div>
              <div style={{ color: '#8a8a9a', fontSize: 11, fontWeight: 600, marginTop: 4 }}>{t('purchaseOrders')}</div>
            </div>
            <div style={{ flex: '1 1 170px', padding: '14px 16px', borderRadius: 10, background: '#8a4fff12', border: '1px solid #8a4fff55' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#a78bfa' }}>{fmtNum(badgeSum(data.trade.procurement.suppliersByStatus))}</div>
              <div style={{ color: '#8a8a9a', fontSize: 11, fontWeight: 600, marginTop: 4 }}>{t('suppliers')}</div>
            </div>
          </div>
          <Card title={`📈 ${t('tradePipeline')}`}>
            <DataTable columns={['', t('count')]}>
              {Object.entries(data.trade.sales.pipeline).map(([stage, count]) => (
                <tr key={stage}>
                  <Td><Badge value={stage} /></Td>
                  <Td>{fmtNum(count)}</Td>
                </tr>
              ))}
            </DataTable>
          </Card>
        </Card>
      )}

      {/* ── لوحات حية ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
        {/* المعاملات الحية */}
        <Card title={t('liveTx')}>
          <EventList
            lang={language}
            events={data.liveTransactions.map((tx) => ({
              title: tx.action,
              description: `${tx.entityType}${tx.description ? ' — ' + tx.description : ''}`,
              severity: tx.severity,
              time: fmtDateTime(tx.createdAt, language),
            }))}
          />
        </Card>

        {/* مراقبة المخاطر */}
        <Card title={t('risk')}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {riskBox('#3cb97e', t('green'), riskGreen)}
            {riskBox('#f5a623', t('yellow'), riskYellow)}
            {riskBox('#dc3545', t('red'), riskRed)}
          </div>
          <div style={{ fontSize: 13, color: '#c0c0d0', lineHeight: 1.9 }}>
            <div>⚠️ {t('openFraud')}: <b style={{ color: '#f5a623' }}>{data.risk.openFraudAlerts}</b></div>
            <div>🚨 {t('criticalFraud')}: <b style={{ color: '#dc3545' }}>{data.risk.openFraudCritical}</b></div>
            <div>🛡️ {t('db')}: <Badge value={data.database === 'connected' ? t('connected') : t('disconnected')} color={data.database === 'connected' ? '#3cb97e' : '#dc3545'} /></div>
          </div>
        </Card>

        {/* أدلة البلوكشين */}
        <Card title={t('blockchain')}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <StatCard label={t('total')} value={fmtNum(data.blockchain.totalEvidence)} icon="⛓️" color="#c6a969" />
            <StatCard label={t('verified')} value={fmtNum(data.blockchain.verifiedEvidence)} icon="✅" color="#3cb97e" />
          </div>
          {data.blockchain.recent.length === 0 ? <Empty text={t('noEvents')} /> : (
            <DataTable columns={['Event', 'System', 'Hash', 'Time']}>
              {data.blockchain.recent.map((ev) => (
                <tr key={ev.currentHash}>
                  <Td><Badge value={ev.eventType} /></Td>
                  <Td>{ev.sourceSystem}</Td>
                  <Td style={{ fontFamily: 'Consolas, monospace', fontSize: 11, color: '#7a7a88' }}>
                    {ev.currentHash.slice(0, 12)}…{ev.isVerified ? ' ✓' : ''}
                  </Td>
                  <Td style={{ fontSize: 11 }}>{fmtDateTime(ev.createdAt, language)}</Td>
                </tr>
              ))}
            </DataTable>
          )}
        </Card>

        {/* النظرة المالية + التدقيق */}
        <Card title={t('finance')}>
          <div style={{ marginBottom: 12, fontSize: 13, color: '#c0c0d0' }}>
            {t('openEscrow')}: <b style={{ color: '#a67c00' }}>{fmtNum(k.escrow.openCount)}</b> — {fmtMoney(k.escrow.totalHeld, 'USD')}
          </div>
          <DataTable columns={['Currency', t('openEscrow'), 'Held']}>
            {Object.entries(k.escrow.byCurrency).map(([cur, v]) => (
              <tr key={cur}>
                <Td><Badge value={cur} /></Td>
                <Td>{v.count}</Td>
                <Td>{fmtMoney(v.sum, cur)}</Td>
              </tr>
            ))}
          </DataTable>
          <div style={{ marginTop: 14, fontSize: 13, color: '#8a8a9a' }}>
            {t('audit24h')}: INFO {fmtNum(data.auditLast24h.INFO || 0)} · WARNING {fmtNum(data.auditLast24h.WARNING || 0)} · ERROR {fmtNum(data.auditLast24h.ERROR || 0)} · CRITICAL {fmtNum(data.auditLast24h.CRITICAL || 0)}
          </div>
        </Card>

        {/* اللوجستيك + الدعم */}
        <Card title={`${t('logistics')} + ${t('support')}`}>
          <div style={{ marginBottom: 8, fontSize: 13, color: '#c0c0d0' }}>
            📦 {t('logistics')}: <b>{fmtNum(data.logistics.totalEvents)}</b> رصد حدث
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {data.logistics.byType.map((l) => <Badge key={l.eventType} value={`${l.eventType} (${l.count})`} />)}
          </div>
          <div style={{ fontSize: 13, color: '#c0c0d0', marginBottom: 8 }}>
            🎧 {t('support')}:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(data.contactByStatus).map(([s, c]) => <Badge key={s} value={`${s} (${c})`} />)}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}