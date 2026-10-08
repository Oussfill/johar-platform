import React, { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';
import {
  PageShell, useFetch, StatCard, Card, DataTable, Td, Badge, Loading,
  ErrorBox, Empty, GoldButton, TextField, fmtMoney, fmtNum, fmtDate,
  fmtDateTime, normalizeNumber,
} from '../components/UiKit';
import type { Language, Currency } from '../components/UiKit';

/* ───────── translations ───────── */

const T: Record<Language, Record<string, string>> = {
  AR: {
    notaryGateway: 'بوابة كاتب العدل',
    notaryDashboardSubtitle: 'نظرة عامة على عمليات التوثيق',
    certifyContract: 'توثيق العقد',
    certifySubtitle: 'توثيق عقد البيع من قبل كاتب العدل',
    digitalRegistrar: 'الكاتب الرقمي',
    registrarSubtitle: 'تفعيل جوازات التمليك الرقمية',
    ownershipHistory: 'سجل التمليك',
    historySubtitle: 'السجل الزمني لعمليات التمليك',
    processNumber: 'رقم العملية',
    assetNumber: 'رقم الأصل',
    salePrice: 'سعر البيع',
    status: 'الحالة',
    step: 'الخطوة',
    createdAt: 'تاريخ الإنشاء',
    certifyButton: 'توثيق العقد',
    processIdLabel: 'رقم العملية',
    processIdHint: 'يجب على كاتب العدل توثيق عقد البيع. أدخل رقم العملية الذي أدخله العميل لتوثيق العقد.',
    certifySuccess: 'العقد موثق بنجاح',
    certifyError: 'فشل التوثيق',
    activatePassport: 'تفعيل الجواز',
    activateSuccess: 'تم تفعيل الجواز بنجاح',
    activateError: 'فشل التفعيل',
    currentStep: 'الخطوة الحالية',
    noProcesses: 'لا توجد عمليات',
    recentEvents: 'الأحداث الأخيرة',
    processes: 'العمليات',
    stats: 'الإحصائيات',
    notarizedAt: 'تاريخ التوثيق',
    keyIssuedAt: 'تاريخ إصدار المفتاح',
    activatedAt: 'تاريخ التفعيل',
    stat_total: 'الإجمالي',
    stat_count: 'العدد',
    stat_totalProcesses: 'إجمالي العمليات',
    stat_active: 'نشط',
    stat_pending: 'قيد الانتظار',
    stat_completed: 'مكتمل',
    stat_certified: 'موثق',
    stat_notarized: 'تم التوثيق',
    stat_failed: 'فشل',
    stat_rejected: 'مرفوض',
    stat_value: 'القيمة',
    stat_amount: 'المبلغ',
  },
  EN: {
    notaryGateway: 'Notary Gateway',
    notaryDashboardSubtitle: 'Overview of certification processes',
    certifyContract: 'Certify Contract',
    certifySubtitle: 'Notarize the sale contract by the notary',
    digitalRegistrar: 'Digital Registrar',
    registrarSubtitle: 'Activate digital ownership passports',
    ownershipHistory: 'Ownership History',
    historySubtitle: 'Chronological record of ownership processes',
    processNumber: 'Process ID',
    assetNumber: 'Asset Gold ID',
    salePrice: 'Sale Price',
    status: 'Status',
    step: 'Step',
    createdAt: 'Created At',
    certifyButton: 'Certify Contract',
    processIdLabel: 'Process ID',
    processIdHint: 'The notary must certify the sale contract. Enter the contract number provided by the customer to certify the contract.',
    certifySuccess: 'Contract certified successfully',
    certifyError: 'Certification failed',
    activatePassport: 'Activate Passport',
    activateSuccess: 'Passport activated successfully',
    activateError: 'Activation failed',
    currentStep: 'Current Step',
    noProcesses: 'No processes found',
    recentEvents: 'Recent Events',
    processes: 'Processes',
    stats: 'Statistics',
    notarizedAt: 'Notarized At',
    keyIssuedAt: 'Key Issued At',
    activatedAt: 'Activated At',
    stat_total: 'Total',
    stat_count: 'Count',
    stat_totalProcesses: 'Total Processes',
    stat_active: 'Active',
    stat_pending: 'Pending',
    stat_completed: 'Completed',
    stat_certified: 'Certified',
    stat_notarized: 'Notarized',
    stat_failed: 'Failed',
    stat_rejected: 'Rejected',
    stat_value: 'Value',
    stat_amount: 'Amount',
  },
  FR: {
    notaryGateway: 'Portail du Notaire',
    notaryDashboardSubtitle: 'Aperçu des processus de certification',
    certifyContract: 'Certifier le Contrat',
    certifySubtitle: 'Notariser le contrat de vente par le notaire',
    digitalRegistrar: 'Registre Numérique',
    registrarSubtitle: 'Activer les passeports de propriété numériques',
    ownershipHistory: 'Registre de Propriété',
    historySubtitle: 'Enregistrement chronologique des processus de propriété',
    processNumber: 'ID Processus',
    assetNumber: 'ID Or',
    salePrice: 'Prix de Vente',
    status: 'Statut',
    step: 'Étape',
    createdAt: 'Créé le',
    certifyButton: 'Certifier le Contrat',
    processIdLabel: 'ID Processus',
    processIdHint: 'Le notaire doit certifier le contrat de vente. Entrez le numéro de contrat fourni par le client pour certifier le contrat.',
    certifySuccess: 'Contrat certifié avec succès',
    certifyError: 'Échec de la certification',
    activatePassport: 'Activer le Passeport',
    activateSuccess: 'Passeport activé avec succès',
    activateError: "Échec de l'activation",
    currentStep: 'Étape Actuelle',
    noProcesses: 'Aucun processus trouvé',
    recentEvents: 'Événements Récents',
    processes: 'Processus',
    stats: 'Statistiques',
    notarizedAt: 'Notarié le',
    keyIssuedAt: 'Clé Délivrée le',
    activatedAt: 'Activé le',
    stat_total: 'Total',
    stat_count: 'Nombre',
    stat_totalProcesses: 'Total des Processus',
    stat_active: 'Actif',
    stat_pending: 'En attente',
    stat_completed: 'Terminé',
    stat_certified: 'Certifié',
    stat_notarized: 'Notarié',
    stat_failed: 'Échoué',
    stat_rejected: 'Rejeté',
    stat_value: 'Valeur',
    stat_amount: 'Montant',
  },
};

function tl(lang: Language, key: string): string {
  return T[lang]?.[key] || T.EN[key] || key;
}

const formatLabel = (key: string): string =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

const STAT_ICONS: Record<string, string> = {
  total: '📋', count: '📋', totalProcesses: '📋', processes: '📋',
  active: '✅', pending: '⏳', completed: '✔️', approved: '✔️',
  certified: '🔏', notarized: '🔏', notaryCertified: '🔏',
  value: '💰', amount: '💰', price: '💰',
  failed: '❌', rejected: '❌',
};

const EVENT_KEYS = new Set(['events', 'recentEvents', 'eventLog', 'auditLog', 'activity', 'recentEventsList']);

/* ═══════════════════════════════════════════════════════════════════════════════
   1. NotaryDashboardPage  (id: notary-dashboard)
   ═══════════════════════════════════════════════════════════════════════════════ */

export function NotaryDashboardPage({ language, currency }: { language: Language; currency: Currency }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/v1/ownership/auditor-overview')
      .then((r) => r.json() as Promise<any>)
      .then((json) => {
        if (cancelled) return;
        setData(json?.data ?? json);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load overview');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return (
    <PageShell title={tl(language, 'notaryGateway')} subtitle={tl(language, 'notaryDashboardSubtitle')} icon="🔏" language={language}>
      <Loading />
    </PageShell>
  );

  if (error) return (
    <PageShell title={tl(language, 'notaryGateway')} subtitle={tl(language, 'notaryDashboardSubtitle')} icon="🔏" language={language}>
      <ErrorBox message={error} />
    </PageShell>
  );

  if (!data || typeof data !== 'object') return (
    <PageShell title={tl(language, 'notaryGateway')} subtitle={tl(language, 'notaryDashboardSubtitle')} icon="🔏" language={language}>
      <Empty text={tl(language, 'noProcesses')} />
    </PageShell>
  );

  const entries = Object.entries(data) as [string, unknown][];
  const arrays: { key: string; items: any[] }[] = [];
  const topNumeric: { key: string; value: number }[] = [];
  const nestedNumeric: { parent: string; fields: { key: string; value: number }[] }[] = [];

  for (const [key, val] of entries) {
    if (Array.isArray(val) && val.length > 0) {
      arrays.push({ key, items: val });
    } else if (typeof val === 'number' && Number.isFinite(val)) {
      topNumeric.push({ key, value: val });
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      const nums = Object.entries(val as Record<string, unknown>)
        .filter(([, v]) => typeof v === 'number' && Number.isFinite(v))
        .map(([k, v]) => ({ key: k, value: v as number }));
      if (nums.length > 0) nestedNumeric.push({ parent: key, fields: nums });
    }
  }

  const statLabel = (key: string): string => {
    const mapped = tl(language, `stat_${key}`);
    return mapped !== `stat_${key}` ? mapped : formatLabel(key);
  };

  return (
    <PageShell title={tl(language, 'notaryGateway')} subtitle={tl(language, 'notaryDashboardSubtitle')} icon="🔏" language={language}>
      {topNumeric.length > 0 && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          {topNumeric.map(({ key, value }) => (
            <StatCard key={key} label={statLabel(key)} value={fmtNum(value)} icon={STAT_ICONS[key] || '📊'} />
          ))}
        </div>
      )}

      {nestedNumeric.map(({ parent, fields }) => (
        <div key={parent} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {fields.map(({ key, value }) => (
              <StatCard key={`${parent}.${key}`} label={statLabel(key)} value={fmtNum(value)} icon={STAT_ICONS[key] || '📊'} />
            ))}
          </div>
        </div>
      ))}

      {arrays.map(({ key, items }) => {
        if (EVENT_KEYS.has(key)) {
          return (
            <Card key={key} title={tl(language, 'recentEvents')}>
              {items.map((ev: any, i: number) => {
                const label = ev.title ?? ev.message ?? ev.description ?? ev.action ?? JSON.stringify(ev);
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)',
                    marginBottom: 8,
                  }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#c6a969', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#e0e0ec', fontSize: 13, fontWeight: 600 }}>{label}</div>
                      {ev.description && ev.title && (
                        <div style={{ color: '#8a8a9a', fontSize: 12 }}>{ev.description}</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {ev.user && <div style={{ color: '#7a7a88', fontSize: 11 }}>{ev.user}</div>}
                      {(ev.time ?? ev.timestamp ?? ev.createdAt) && (
                        <div style={{ color: '#5a5a68', fontSize: 11 }}>
                          {fmtDateTime(ev.time ?? ev.timestamp ?? ev.createdAt, language)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          );
        }

        return (
          <Card key={key} title={formatLabel(key)} style={{ marginBottom: 20 }}>
            <DataTable columns={[
              tl(language, 'processNumber'), tl(language, 'assetNumber'), tl(language, 'salePrice'),
              tl(language, 'status'), tl(language, 'step'), tl(language, 'createdAt'),
            ]}>
              {items.map((row: any, i: number) => (
                <tr key={row.processId ?? row.id ?? i}>
                  <Td>{row.processId ?? row.id ?? '—'}</Td>
                  <Td>{row.assetGoldId ?? row.goldId ?? '—'}</Td>
                  <Td>{fmtMoney(normalizeNumber(row.salePrice ?? row.price), currency)}</Td>
                  <Td><Badge value={row.status ?? '—'} /></Td>
                  <Td>{row.currentStep ?? row.step ?? '—'}</Td>
                  <Td>{fmtDate(row.createdAt, language)}</Td>
                </tr>
              ))}
            </DataTable>
          </Card>
        );
      })}

      {arrays.length === 0 && topNumeric.length === 0 && nestedNumeric.length === 0 && (
        <Empty text={tl(language, 'noProcesses')} />
      )}
    </PageShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   2. NotaryCertifyPage  (id: notary-certify)
   ═══════════════════════════════════════════════════════════════════════════════ */

export function NotaryCertifyPage({ language }: { language: Language; currency: Currency }) {
  const [processId, setProcessId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCertify = useCallback(async () => {
    if (!processId.trim()) return;
    setSubmitting(true);
    setSuccess(null);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/ownership/certify-notary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processId: processId.trim() }),
      });
      const json = await res.json() as any;
      if (json.data || json.success) {
        setSuccess(json.data || json);
        setProcessId('');
      } else {
        setError(json.error || json.message || tl(language, 'certifyError'));
      }
    } catch (err: any) {
      setError(err?.message || tl(language, 'certifyError'));
    } finally {
      setSubmitting(false);
    }
  }, [processId, language]);

  return (
    <PageShell title={tl(language, 'certifyContract')} subtitle={tl(language, 'certifySubtitle')} icon="🔏" language={language}>
      <Card>
        <div style={{
          marginBottom: 20, padding: '12px 16px',
          background: 'rgba(198,169,105,0.06)', borderRadius: 8,
          border: '1px solid rgba(198,169,105,0.1)',
        }}>
          <p style={{ color: '#b8a88a', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            {tl(language, 'processIdHint')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ display: 'block', marginBottom: 6, color: '#b8a88a', fontSize: 13 }}>
              {tl(language, 'processIdLabel')}
            </label>
            <TextField
              value={processId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setProcessId(e.target.value);
                setError(null);
                setSuccess(null);
              }}
              placeholder={tl(language, 'processIdLabel')}
            />
          </div>
          <GoldButton onClick={handleCertify} disabled={submitting || !processId.trim()}>
            {submitting ? '...' : tl(language, 'certifyButton')}
          </GoldButton>
        </div>

        {success && (
          <div style={{
            marginTop: 20, padding: '12px 16px',
            background: 'rgba(60,185,126,0.1)',
            border: '1px solid rgba(60,185,126,0.3)',
            borderRadius: 8, color: '#3cb97e', fontSize: 13,
          }}>
            <strong>{tl(language, 'certifySuccess')}</strong>
            <div style={{ marginTop: 6 }}>
              <pre style={{
                margin: 0, fontSize: 12, color: '#3cb97e',
                whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const,
              }}>
                {JSON.stringify(success, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: 20, padding: '12px 16px',
            background: 'rgba(220,53,69,0.1)',
            border: '1px solid rgba(220,53,69,0.3)',
            borderRadius: 8, color: '#dc3545', fontSize: 13,
          }}>
            <strong>{tl(language, 'certifyError')}</strong>
            <div style={{ marginTop: 6 }}>{error}</div>
          </div>
        )}
      </Card>
    </PageShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   3. DigitalRegistrarPage  (id: digital-registrar)
   ═══════════════════════════════════════════════════════════════════════════════ */

export function DigitalRegistrarPage({ language, currency }: { language: Language; currency: Currency }) {
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchProcesses = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch('/api/v1/ownership/my-processes')
      .then((r) => r.json() as Promise<any>)
      .then((json) => {
        const payload = json?.data ?? json;
        if (Array.isArray(payload)) {
          setProcesses(payload);
        } else if (typeof payload === 'object' && payload !== null) {
          const arrKey = Object.keys(payload).find((k) => Array.isArray(payload[k]));
          setProcesses(arrKey ? payload[arrKey] : []);
        } else {
          setProcesses([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load processes');
        setLoading(false);
      });
  }, []);

  useEffect(() => { fetchProcesses(); }, [fetchProcesses]);

  const handleActivate = useCallback(async (pid: string) => {
    setBanner(null);
    try {
      const res = await apiFetch('/api/v1/ownership/activate-passport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processId: pid }),
      });
      const json = await res.json() as any;
      if (json.data || json.success) {
        setBanner({ type: 'success', message: tl(language, 'activateSuccess') });
        fetchProcesses();
      } else {
        setBanner({ type: 'error', message: json.error || json.message || tl(language, 'activateError') });
      }
    } catch (err: any) {
      setBanner({ type: 'error', message: err?.message || tl(language, 'activateError') });
    }
  }, [fetchProcesses, language]);

  return (
    <PageShell title={tl(language, 'digitalRegistrar')} subtitle={tl(language, 'registrarSubtitle')} icon="📇" language={language}>
      {banner && (
        <div style={{
          marginBottom: 20, padding: '12px 16px', borderRadius: 8, fontSize: 13,
          background: banner.type === 'success' ? 'rgba(60,185,126,0.1)' : 'rgba(220,53,69,0.1)',
          border: `1px solid ${banner.type === 'success' ? 'rgba(60,185,126,0.3)' : 'rgba(220,53,69,0.3)'}`,
          color: banner.type === 'success' ? '#3cb97e' : '#dc3545',
        }}>
          {banner.message}
        </div>
      )}

      {loading && <Loading />}
      {error && <ErrorBox message={error} />}

      {!loading && !error && (!processes || processes.length === 0) && (
        <Empty text={tl(language, 'noProcesses')} />
      )}

      {!loading && !error && processes && processes.length > 0 && (
        <Card>
          <DataTable columns={[
            tl(language, 'processNumber'), tl(language, 'assetNumber'), tl(language, 'salePrice'),
            tl(language, 'status'), tl(language, 'currentStep'), '',
          ]}>
            {processes.map((p: any, i: number) => (
              <tr key={p.processId ?? p.id ?? i}>
                <Td>{p.processId ?? p.id ?? '—'}</Td>
                <Td>{p.assetGoldId ?? p.goldId ?? '—'}</Td>
                <Td>{fmtMoney(normalizeNumber(p.salePrice ?? p.price), currency)}</Td>
                <Td><Badge value={p.status ?? '—'} /></Td>
                <Td>{p.currentStep ?? '—'}</Td>
                <Td>
                  <GoldButton onClick={() => handleActivate(p.processId ?? p.id)}>
                    {tl(language, 'activatePassport')}
                  </GoldButton>
                </Td>
              </tr>
            ))}
          </DataTable>
        </Card>
      )}
    </PageShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   4. OwnershipHistoryPage  (id: ownership-history)
   ═══════════════════════════════════════════════════════════════════════════════ */

export function OwnershipHistoryPage({ language, currency }: { language: Language; currency: Currency }) {
  const { data: processes, loading, error } = useFetch<any[]>('/api/v1/ownership/my-processes');

  return (
    <PageShell title={tl(language, 'ownershipHistory')} subtitle={tl(language, 'historySubtitle')} icon="📜" language={language}>
      {loading && <Loading />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && (!processes || processes.length === 0) && (
        <Empty text={tl(language, 'noProcesses')} />
      )}

      {!loading && !error && processes && processes.length > 0 && (
        <div style={{ position: 'relative', paddingLeft: 32 }}>
          <div style={{
            position: 'absolute', left: 12, top: 0, bottom: 0,
            width: 2, background: 'rgba(198,169,105,0.15)',
          }} />

          {processes.map((p: any, i: number) => (
            <div key={p.processId ?? i} style={{ position: 'relative', marginBottom: 24 }}>
              <div style={{
                position: 'absolute', left: -28, top: 22,
                width: 12, height: 12, borderRadius: '50%',
                background: '#c6a969',
                border: '2px solid #0f0f1a',
              }} />

              <Card>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', flexWrap: 'wrap', gap: 8,
                  marginBottom: 12,
                }}>
                  <div>
                    <div style={{ color: '#c6a969', fontSize: 14, fontWeight: 700 }}>
                      {tl(language, 'processNumber')}: {p.processId ?? p.id ?? '—'}
                    </div>
                    <div style={{ color: '#8a8a9a', fontSize: 13, marginTop: 4 }}>
                      {tl(language, 'assetNumber')}: {p.assetGoldId ?? p.goldId ?? '—'}
                      {p.salePrice != null && (
                        <span style={{ marginLeft: 12 }}>
                          {tl(language, 'salePrice')}: {fmtMoney(normalizeNumber(p.salePrice), currency)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge value={p.status ?? '—'} />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12 }}>
                  <div style={{ color: '#8a8a9a' }}>
                    {tl(language, 'createdAt')}: <span style={{ color: '#c0c0d0' }}>{fmtDateTime(p.createdAt, language)}</span>
                  </div>
                  {p.notarizedAt && (
                    <div style={{ color: '#8a8a9a' }}>
                      {tl(language, 'notarizedAt')}: <span style={{ color: '#3cb97e' }}>{fmtDateTime(p.notarizedAt, language)}</span>
                    </div>
                  )}
                  {p.keyIssuedAt && (
                    <div style={{ color: '#8a8a9a' }}>
                      {tl(language, 'keyIssuedAt')}: <span style={{ color: '#5b8ff9' }}>{fmtDateTime(p.keyIssuedAt, language)}</span>
                    </div>
                  )}
                  {p.activatedAt && (
                    <div style={{ color: '#8a8a9a' }}>
                      {tl(language, 'activatedAt')}: <span style={{ color: '#3cb97e' }}>{fmtDateTime(p.activatedAt, language)}</span>
                    </div>
                  )}
                  {p.currentStep != null && (
                    <div style={{ color: '#8a8a9a' }}>
                      {tl(language, 'currentStep')}: <span style={{ color: '#c6a969' }}>{p.currentStep}</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

export {};
