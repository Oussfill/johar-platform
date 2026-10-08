import React, { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';
import {
  PageShell, useFetch, StatCard, Card, DataTable, Td, Badge, Loading,
  ErrorBox, Empty, GoldButton, fmtNum, fmtDate,
  fmtDateTime, normalizeNumber,
} from '../components/UiKit';
import type { Language, Currency } from '../components/UiKit';

// ─── Three-language strings ──────────────────────────────────────────────────
const T: Record<Language, Record<string, string>> = {
  AR: {
    labRequests: 'طلبات الفحص',
    labRecords: 'سجلات المختبر',
    labCertificates: 'إصدار شهادات',
    orderNumber: 'رقم الطلب',
    asset: 'المعدن/الأصل',
    purity: 'النقاوة',
    weight: 'الوزن',
    status: 'الحالة',
    date: 'التاريخ',
    instrumentType: 'نوع الجهاز',
    lastCalibration: 'آخر معايرة',
    issue: 'إصدار',
    certificateIssued: 'تم إصدار الشهادة',
    totalAssays: 'عدد الفحوصات',
    passRate: 'نسبة النجاح',
    avgTurnaround: 'مدة الإنجاز',
    noData: 'لا توجد بيانات',
    occupiedInstruments: 'أجهزة مشغولة',
    totalOrders: 'إجمالي الطلبات',
    completed: 'مكتمل',
    inProgress: 'قيد التنفيذ',
    readingRecords: 'سجلات القراءة',
    selectGoldId: 'اختر المعدن/الأصل',
    issueCertificate: 'إصدار الشهادة',
    certificateNumber: 'رقم الشهادة',
    instrumentLogs: 'سجلات الأجهزة',
    performanceStats: 'إحصائيات الأداء',
  },
  EN: {
    labRequests: 'Lab Requests',
    labRecords: 'Lab Records',
    labCertificates: 'Issue Certificates',
    orderNumber: 'Order #',
    asset: 'Asset',
    purity: 'Purity',
    weight: 'Weight',
    status: 'Status',
    date: 'Date',
    instrumentType: 'Instrument Type',
    lastCalibration: 'Last Calibration',
    issue: 'Issue',
    certificateIssued: 'Certificate Issued',
    totalAssays: 'Total Assays',
    passRate: 'Pass Rate',
    avgTurnaround: 'Avg Turnaround',
    noData: 'No data available',
    occupiedInstruments: 'Occupied Instruments',
    totalOrders: 'Total Orders',
    completed: 'Completed',
    inProgress: 'In Progress',
    readingRecords: 'Reading Records',
    selectGoldId: 'Select gold / asset',
    issueCertificate: 'Issue Certificate',
    certificateNumber: 'Certificate #',
    instrumentLogs: 'Instrument Logs',
    performanceStats: 'Performance Stats',
  },
  FR: {
    labRequests: 'Demandes de labo',
    labRecords: 'Registres du laboratoire',
    labCertificates: 'Émettre des certificats',
    orderNumber: 'N° de commande',
    asset: 'Actif',
    purity: 'Pureté',
    weight: 'Poids',
    status: 'Statut',
    date: 'Date',
    instrumentType: "Type d'instrument",
    lastCalibration: 'Dernière calibration',
    issue: 'Émettre',
    certificateIssued: 'Certificat émis',
    totalAssays: 'Total des analyses',
    passRate: 'Taux de réussite',
    avgTurnaround: 'Délai moyen',
    noData: 'Aucune donnée disponible',
    occupiedInstruments: 'Instruments occupés',
    totalOrders: 'Total des commandes',
    completed: 'Terminé',
    inProgress: 'En cours',
    readingRecords: 'Registres de lecture',
    selectGoldId: 'Sélectionner or / actif',
    issueCertificate: 'Émettre le certificat',
    certificateNumber: 'N° de certificat',
    instrumentLogs: "Journaux d'instruments",
    performanceStats: 'Statistiques de performance',
  },
};

const PERF_LABELS: Record<string, { key: string; icon: string }> = {
  totalAssays: { key: 'totalAssays', icon: '🔬' },
  passRate: { key: 'passRate', icon: '✅' },
  avgTurnaroundDays: { key: 'avgTurnaround', icon: '⏱️' },
  occupiedInstruments: { key: 'occupiedInstruments', icon: '⚙️' },
};

// ─── 1. LabRequestsPage ──────────────────────────────────────────────────────
export const LabRequestsPage: React.FC<{ language: Language; currency: Currency }> = ({ language, currency }) => {
  const t = T[language];
  const dir = language === 'AR' ? 'rtl' : 'ltr';
  const { data: orders, loading, error } = useFetch<any[]>('/api/v1/assay/orders');

  const total = orders?.length ?? 0;
  const completed = orders?.filter((o) => o?.status === 'COMPLETED').length ?? 0;
  const inProgress = orders?.filter((o) => o?.status === 'IN_PROGRESS').length ?? 0;

  return (
    <PageShell title={t.labRequests} icon="🔬" language={language}>
      {loading && <Loading />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && (
        <>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
            <StatCard label={t.totalOrders} value={fmtNum(total)} icon="📦" color="#c6a969" />
            <StatCard label={t.completed} value={fmtNum(completed)} icon="✅" color="#3cb97e" />
            <StatCard label={t.inProgress} value={fmtNum(inProgress)} icon="⏳" color="#f5a623" />
          </div>
          <Card title={t.labRequests}>
            {(!orders || orders.length === 0) ? (
              <Empty text={t.noData} />
            ) : (
              <DataTable columns={[t.orderNumber, t.asset, t.status, t.date]} dir={dir}>
                {orders.map((o: any, i: number) => (
                  <tr key={o?.id ?? i}>
                    <Td>{o?.orderNumber ?? o?.id ?? '—'}</Td>
                    <Td>{o?.asset?.goldId ?? o?.goldId ?? '—'}</Td>
                    <Td><Badge value={o?.status ?? '—'} /></Td>
                    <Td>{fmtDate(o?.createdAt, language)}</Td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Card>
        </>
      )}
    </PageShell>
  );
};

// ─── 2. LabRecordsPage ───────────────────────────────────────────────────────
export const LabRecordsPage: React.FC<{ language: Language; currency: Currency }> = ({ language, currency }) => {
  const t = T[language];
  const dir = language === 'AR' ? 'rtl' : 'ltr';
  const { data: logs, loading: logsLoading, error: logsError } = useFetch<any[]>('/api/v1/assay/instrument-logs');
  const { data: orders, loading: ordersLoading, error: ordersError } = useFetch<any[]>('/api/v1/assay/orders');

  const loading = logsLoading || ordersLoading;
  const error = logsError || ordersError;
  const instrumentLogs = Array.isArray(logs) ? logs : [];

  return (
    <PageShell title={t.labRecords} icon="📋" language={language}>
      {loading && <Loading />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && (
        <>
          <Card title={t.instrumentLogs} style={{ marginBottom: 20 }}>
            {instrumentLogs.length === 0 ? (
              <Empty text={t.noData} />
            ) : (
              <DataTable columns={[t.instrumentType, t.status, t.lastCalibration]} dir={dir}>
                {instrumentLogs.map((log: any, i: number) => (
                  <tr key={i}>
                    <Td>{log?.type ?? '—'}</Td>
                    <Td><Badge value={log?.status ?? '—'} /></Td>
                    <Td>{fmtDateTime(log?.lastCalibration, language)}</Td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Card>
          <Card title={t.readingRecords}>
            {(!orders || orders.length === 0) ? (
              <Empty text={t.noData} />
            ) : (
              <DataTable columns={[t.asset, t.purity, t.weight, t.status]} dir={dir}>
                {orders.map((o: any, i: number) => (
                  <tr key={o?.id ?? i}>
                    <Td>{o?.asset?.goldId ?? o?.goldId ?? '—'}</Td>
                    <Td>{o?.reading?.purity ?? '—'}</Td>
                    <Td>{o?.reading?.weight != null ? fmtNum(normalizeNumber(o.reading.weight)) : '—'}</Td>
                    <Td><Badge value={o?.status ?? '—'} /></Td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Card>
        </>
      )}
    </PageShell>
  );
};

// ─── 3. LabCertificatesPage ──────────────────────────────────────────────────
export const LabCertificatesPage: React.FC<{ language: Language; currency: Currency }> = ({ language, currency }) => {
  const t = T[language];
  const { data: orders, loading: ordersLoading, error: ordersError } = useFetch<any[]>('/api/v1/assay/orders');

  const [perf, setPerf] = useState<Record<string, unknown> | null>(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfError, setPerfError] = useState<string | null>(null);
  const [selectedGoldId, setSelectedGoldId] = useState('');
  const [certNumber, setCertNumber] = useState<string | null>(null);
  const [certCounter, setCertCounter] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setPerfLoading(true);
    setPerfError(null);
    apiFetch('/api/v1/assay/lab-performance')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        const payload = json.data ?? json;
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          setPerf(payload as Record<string, unknown>);
        } else {
          setPerf(null);
        }
        setPerfLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setPerfError(err instanceof Error ? err.message : 'Network error');
        setPerfLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setCertNumber(null);
  }, [selectedGoldId]);

  const handleIssue = useCallback(() => {
    if (!selectedGoldId) return;
    const num = `CERT-2026-${String(certCounter).padStart(4, '0')}`;
    setCertNumber(num);
    setCertCounter((c) => c + 1);
  }, [selectedGoldId, certCounter]);

  const loading = ordersLoading || perfLoading;
  const error = ordersError || perfError;

  const completedOrders = Array.isArray(orders) ? orders.filter((o: any) => o?.status === 'COMPLETED') : [];
  const goldIds = completedOrders.map((o: any) => o?.asset?.goldId ?? o?.goldId).filter(Boolean);

  const perfData: Record<string, unknown> = perf ?? {};
  const numericEntries = Object.entries(perfData).filter(
    ([, v]) => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)))
  );

  const labelFor = (k: string): string => {
    const mapped = PERF_LABELS[k];
    if (mapped) return t[mapped.key];
    return k.charAt(0).toUpperCase() + k.slice(1);
  };

  return (
    <PageShell title={t.labCertificates} icon="🏆" language={language}>
      {loading && <Loading />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && (
        <>
          {numericEntries.length > 0 && (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
              {numericEntries.map(([k, v]) => {
                const numVal = normalizeNumber(v);
                const isPercent = k.toLowerCase().includes('rate');
                const isTurnaround = k.toLowerCase().includes('turnaround');
                return (
                  <StatCard
                    key={k}
                    label={labelFor(k)}
                    value={isPercent ? `${numVal.toFixed(1)}%` : isTurnaround ? `${fmtNum(numVal)}d` : fmtNum(numVal)}
                    icon={PERF_LABELS[k]?.icon ?? '📊'}
                    color="#c6a969"
                  />
                );
              })}
            </div>
          )}
          <Card title={t.issue}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480 }}>
              <label style={{ color: '#8a8a9a', fontSize: 12, fontWeight: 600 }}>{t.selectGoldId}</label>
              <select
                value={selectedGoldId}
                onChange={(e) => { setSelectedGoldId(e.target.value); }}
                style={{
                  padding: '9px 12px',
                  background: 'rgba(30, 30, 45, 0.8)',
                  border: '1px solid #333',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                <option value="">{t.selectGoldId}</option>
                {goldIds.map((gid: string) => (
                  <option key={gid} value={gid}>{gid}</option>
                ))}
              </select>
              <GoldButton onClick={handleIssue} disabled={!selectedGoldId}>
                📜 {t.issueCertificate}
              </GoldButton>
              {certNumber && (
                <div style={{
                  padding: '14px 18px',
                  background: 'rgba(60, 185, 126, 0.12)',
                  border: '1px solid rgba(60, 185, 126, 0.35)',
                  borderRadius: 10,
                  color: '#3cb97e',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <span>✅</span>
                  <span>{t.certificateIssued}: <strong>{certNumber}</strong></span>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </PageShell>
  );
};

export {};