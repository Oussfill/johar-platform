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
    custodyChain: 'سلسلة الحيازة',
    custodyChainSub: 'تتبع سجل امتلاك الأصول ونقلها',
    custodyTransfers: 'نقل الحيازة',
    custodyTransfersSub: 'طلب وتسجيل نقل الأصول بين المواقع',
    custodyApprovals: 'اعتمادات ثنائية',
    custodyApprovalsSub: 'إدارة طلبات الاعتماد المتعددة (مبدأ الأربعة أعين)',
    logisticsTracking: 'التتبع اللوجستي',
    logisticsTrackingSub: 'تتبع الشحنات والنقل اللوجستي',
    assetId: 'رقم الأصل',
    goldId: 'معرّف الذهب',
    warehouse: 'المخزن',
    destination: 'الوجهة',
    reason: 'السبب',
    amount: 'المبلغ',
    transferRequest: 'طلب نقل',
    approve: 'اعتماد',
    locationTransfer: 'نقل الموقع',
    highValue: 'قيمة عالية',
    requiresSecondApprovalNote: 'قيمة تتجاوز 50,000 دولار — يتطلب اعتماد المشرف الثانٍ (Four-Eyes)',
    inTransit: 'في الطريق',
    delivered: 'تم التسليم',
    noPendingRequests: 'لا توجد طلبات معلقة',
    noTrackingData: 'منظومة التتبع اللوجستي تعمل عبر تطبيق الجوال + IoT',
    source: 'المصدر',
    lastUpdate: 'آخر تحديث',
    status: 'الحالة',
    total: 'الإجمالي',
    pending: 'معلّق',
    active: 'نشط',
    selectAsset: 'اختر الأصل',
    toLocation: 'إلى الموقع',
    submit: 'إرسال',
    success: 'تم بنجاح',
    requester: 'الطالب',
    created: 'تاريخ الإنشاء',
    requestId: 'رقم الطلب',
    approveProgress: 'تقدم الاعتماد',
    coordinates: 'الإحداثيات',
    lastTransferDate: 'آخر تاريخ نقل',
  },
  EN: {
    custodyChain: 'Chain of Custody',
    custodyChainSub: 'Track asset ownership and transfer records',
    custodyTransfers: 'Custody Transfers',
    custodyTransfersSub: 'Request and record asset transfers between locations',
    custodyApprovals: 'Dual Approvals',
    custodyApprovalsSub: 'Manage multi-approval transfer requests (Four-Eyes Principle)',
    logisticsTracking: 'Logistics Tracking',
    logisticsTrackingSub: 'Track shipments and logistics transport',
    assetId: 'Asset ID',
    goldId: 'Gold ID',
    warehouse: 'Warehouse',
    destination: 'Destination',
    reason: 'Reason',
    amount: 'Amount',
    transferRequest: 'Transfer Request',
    approve: 'Approve',
    locationTransfer: 'Location Transfer',
    highValue: 'High Value',
    requiresSecondApprovalNote: 'Value exceeds $50,000 — requires second supervisor approval (Four-Eyes)',
    inTransit: 'In Transit',
    delivered: 'Delivered',
    noPendingRequests: 'No pending requests',
    noTrackingData: 'Logistics tracking operates via mobile app + IoT',
    source: 'Source',
    lastUpdate: 'Last Update',
    status: 'Status',
    total: 'Total',
    pending: 'Pending',
    active: 'Active',
    selectAsset: 'Select Asset',
    toLocation: 'To Location',
    submit: 'Submit',
    success: 'Success',
    requester: 'Requester',
    created: 'Created',
    requestId: 'Request ID',
    approveProgress: 'Approval Progress',
    coordinates: 'Coordinates',
    lastTransferDate: 'Last Transfer Date',
  },
  FR: {
    custodyChain: 'Chaîne de Garde',
    custodyChainSub: 'Suivre les enregistrements de propriété et de transfert',
    custodyTransfers: 'Transferts de Garde',
    custodyTransfersSub: 'Demander et enregistrer les transferts d\'actifs entre sites',
    custodyApprovals: 'Approbations Doubles',
    custodyApprovalsSub: 'Gérer les demandes de transfert multi-approbations (Principe des Quatre Yeux)',
    logisticsTracking: 'Suivi Logistique',
    logisticsTrackingSub: 'Suivre les envois et le transport logistique',
    assetId: 'ID de l\'Actif',
    goldId: 'ID Or',
    warehouse: 'Entrepôt',
    destination: 'Destination',
    reason: 'Motif',
    amount: 'Montant',
    transferRequest: 'Demande de Transfert',
    approve: 'Approuver',
    locationTransfer: 'Transfert de Lieu',
    highValue: 'Valeur Élevée',
    requiresSecondApprovalNote: 'Valeur dépassant 50 000 $ — nécessite l\'approbation du deuxième superviseur (Quatre Yeux)',
    inTransit: 'En Transit',
    delivered: 'Livré',
    noPendingRequests: 'Aucune demande en attente',
    noTrackingData: 'Le suivi logistique fonctionne via l\'application mobile + IoT',
    source: 'Source',
    lastUpdate: 'Dernière Mise à Jour',
    status: 'Statut',
    total: 'Total',
    pending: 'En Attente',
    active: 'Actif',
    selectAsset: 'Sélectionner l\'Actif',
    toLocation: 'Vers le Lieu',
    submit: 'Soumettre',
    success: 'Succès',
    requester: 'Demandeur',
    created: 'Créé',
    requestId: 'ID de Demande',
    approveProgress: 'Progression de l\'Approbation',
    coordinates: 'Coordonnées',
    lastTransferDate: 'Dernier Transfert',
  },
};

function t(lang: Language, key: string): string {
  return T[lang]?.[key] || T.EN[key] || key;
}

/* ───────── 1. CustodyChainPage ───────── */

export function CustodyChainPage({ language, currency }: { language: Language; currency: Currency }) {
  const { data: assets, loading, error } = useFetch<any[]>('/api/v1/assets');

  const total = assets?.length ?? 0;
  const pending = assets?.filter((a: any) => (a.custodyStatus || a.status)?.toUpperCase() === 'PENDING').length ?? 0;
  const active = assets?.filter((a: any) => (a.custodyStatus || a.status)?.toUpperCase() === 'ACTIVE').length ?? 0;

  return (
    <PageShell title={t(language, 'custodyChain')} subtitle={t(language, 'custodyChainSub')} icon="🔗" language={language}>
      {loading && <Loading />}
      {error && <ErrorBox message={String(error)} />}
      {!loading && !error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatCard label={t(language, 'total')} value={fmtNum(total)} icon="📦" />
            <StatCard label={t(language, 'pending')} value={fmtNum(pending)} icon="⏳" color="#f5a623" />
            <StatCard label={t(language, 'active')} value={fmtNum(active)} icon="✅" color="#3cb97e" />
          </div>
          {!assets || assets.length === 0 ? (
            <Empty text={t(language, 'noPendingRequests')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {assets.map((asset: any, idx: number) => (
                <Card key={asset.id ?? idx}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ color: '#c6a969', fontSize: 16, fontWeight: 700 }}>
                        {t(language, 'goldId')}: {asset.goldId ?? asset.id}
                      </div>
                      <div style={{ color: '#8a8a9a', fontSize: 13, marginTop: 4 }}>
                        {t(language, 'warehouse')}: {asset.warehouse ?? asset.location ?? '—'}
                      </div>
                      <div style={{ color: '#5a5a68', fontSize: 12, marginTop: 2 }}>
                        {t(language, 'created')}: {fmtDate(asset.createdAt, language)}
                      </div>
                      {asset.lastTransferDate && (
                        <div style={{ color: '#5a5a68', fontSize: 12, marginTop: 2 }}>
                          {t(language, 'lastTransferDate')}: {fmtDateTime(asset.lastTransferDate, language)}
                        </div>
                      )}
                    </div>
                    <Badge value={asset.custodyStatus ?? asset.status ?? 'UNKNOWN'} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}

/* ───────── 2. CustodyTransfersPage ───────── */

export function CustodyTransfersPage({ language, currency }: { language: Language; currency: Currency }) {
  const { data: assets } = useFetch<any[]>('/api/v1/assets');
  const { data: approvals, loading: approvalsLoading, error: approvalsError } = useFetch<any[]>('/api/v1/custody/pending-approvals');

  const [form, setForm] = useState({ assetId: '', toLocation: '', reason: '', amount: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ requestId: string; requiresDualApproval: boolean; approvalCount: number; amount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setError(null);
    setResult(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiFetch('/api/v1/custody/transfer-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: form.assetId,
          toLocation: form.toLocation,
          reason: form.reason,
          amount: normalizeNumber(form.amount),
        }),
      });
      const json = await res.json();
      if (json.data) {
        setResult(json.data);
        setForm({ assetId: '', toLocation: '', reason: '', amount: '' });
      } else {
        setError(json.error || json.message || 'Transfer request failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  }, [form]);

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

  return (
    <PageShell title={t(language, 'custodyTransfers')} subtitle={t(language, 'custodyTransfersSub')} icon="🔄" language={language}>
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: '#b8a88a', fontSize: 13 }}>{t(language, 'selectAsset')}</label>
            <select value={form.assetId} onChange={set('assetId')} style={selectStyle}>
              <option value="">{t(language, 'selectAsset')}</option>
              {assets?.map((a: any) => (
                <option key={a.id} value={a.id}>{a.goldId ?? a.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: '#b8a88a', fontSize: 13 }}>{t(language, 'destination')}</label>
            <TextField value={form.toLocation} onChange={set('toLocation')} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: '#b8a88a', fontSize: 13 }}>{t(language, 'reason')}</label>
            <TextField value={form.reason} onChange={set('reason')} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: '#b8a88a', fontSize: 13 }}>{t(language, 'amount')}</label>
            <TextField value={form.amount} onChange={set('amount')} type="number" />
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'left' }}>
          <GoldButton onClick={handleSubmit} disabled={submitting}>
            {submitting ? '...' : t(language, 'transferRequest')}
          </GoldButton>
        </div>

        {result && (
          <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(60,185,126,0.1)', border: '1px solid rgba(60,185,126,0.3)', borderRadius: 8, color: '#3cb97e', fontSize: 13 }}>
            <strong>{t(language, 'success')}</strong>
            <div style={{ marginTop: 6 }}>
              {t(language, 'requestId')}: {result.requestId}
            </div>
            {result.requiresDualApproval && (
              <div style={{
                marginTop: 10,
                padding: '10px 14px',
                background: 'rgba(245,166,35,0.1)',
                border: '1px solid rgba(245,166,35,0.4)',
                color: '#f5a623',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
              }}>
                ⚠️ {t(language, 'requiresSecondApprovalNote')}
              </div>
            )}
          </div>
        )}

        {error && <div style={{ marginTop: 20 }}><ErrorBox message={error} /></div>}
      </Card>

      <Card title={t(language, 'pending')} style={{ marginTop: 20 }}>
        {approvalsLoading && <Loading />}
        {approvalsError && <ErrorBox message={String(approvalsError)} />}
        {!approvalsLoading && !approvalsError && (
          !approvals || approvals.length === 0 ? (
            <Empty text={t(language, 'noPendingRequests')} />
          ) : (
            <DataTable columns={[t(language, 'requestId'), t(language, 'goldId'), t(language, 'amount'), t(language, 'status')]}>
              {approvals.map((ap: any, idx: number) => (
                <tr key={ap.id ?? idx}>
                  <Td>{ap.transferRequestId ?? ap.id}</Td>
                  <Td>{ap.transferRequest?.assetGoldId ?? '—'}</Td>
                  <Td>{fmtMoney(normalizeNumber(ap.transferRequest?.amount), currency)}</Td>
                  <Td><Badge value={ap.status ?? ap.transferRequest?.status ?? 'PENDING'} /></Td>
                </tr>
              ))}
            </DataTable>
          )
        )}
      </Card>
    </PageShell>
  );
}

/* ───────── 3. CustodyApprovalsPage ───────── */

export function CustodyApprovalsPage({ language, currency }: { language: Language; currency: Currency }) {
  const [approvals, setApprovals] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/custody/pending-approvals');
      const json = await res.json();
      const payload = json.data ?? json;
      if (Array.isArray(payload)) {
        setApprovals(payload);
      } else if (payload && typeof payload === 'object') {
        const arrayKey = Object.keys(payload).find((k) => Array.isArray(payload[k]));
        setApprovals(arrayKey ? payload[arrayKey] : [payload]);
      } else {
        setApprovals([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  const handleApprove = useCallback(async (requestId: string) => {
    setApprovingId(requestId);
    setSuccessMsg(null);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/custody/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const json = await res.json();
      if (json.data?.approved) {
        setSuccessMsg(`${t(language, 'success')} — ${t(language, 'approveProgress')}: ${json.data.remainingApprovals ?? 0}`);
        fetchApprovals();
      } else {
        setError(json.error || json.message || 'Approval failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setApprovingId(null);
    }
  }, [fetchApprovals, language]);

  return (
    <PageShell title={t(language, 'custodyApprovals')} subtitle={t(language, 'custodyApprovalsSub')} icon="✅" language={language}>
      {loading && <Loading />}
      {error && <ErrorBox message={error} />}
      {successMsg && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(60,185,126,0.1)', border: '1px solid rgba(60,185,126,0.3)', borderRadius: 8, color: '#3cb97e', fontSize: 13 }}>
          {successMsg}
        </div>
      )}
      {!loading && !error && (
        !approvals || approvals.length === 0 ? (
          <Empty text={t(language, 'noPendingRequests')} />
        ) : (
          <Card>
            <DataTable columns={[
              t(language, 'requestId'),
              t(language, 'goldId'),
              t(language, 'amount'),
              t(language, 'status'),
              t(language, 'requester'),
              t(language, 'created'),
              t(language, 'approve'),
            ]}>
              {approvals.map((ap: any, idx: number) => {
                const req = ap.transferRequest ?? {};
                const isHighValue = normalizeNumber(req.amount) > 50000;
                return (
                  <tr key={ap.id ?? idx}>
                    <Td>{ap.transferRequestId ?? ap.id}</Td>
                    <Td>{req.assetGoldId ?? '—'}</Td>
                    <Td>{fmtMoney(normalizeNumber(req.amount), currency)}</Td>
                    <Td><Badge value={ap.status ?? req.status ?? 'PENDING'} /></Td>
                    <Td>{ap.approvedById ?? ap.requesterId ?? '—'}</Td>
                    <Td>{fmtDate(ap.createdAt, language)}</Td>
                    <Td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <GoldButton
                          onClick={() => handleApprove(ap.transferRequestId ?? ap.id)}
                          disabled={approvingId === (ap.transferRequestId ?? ap.id)}
                          style={{ fontSize: 11, padding: '6px 12px' }}
                        >
                          {approvingId === (ap.transferRequestId ?? ap.id) ? '...' : t(language, 'approve')}
                        </GoldButton>
                        {isHighValue && (
                          <div style={{ fontSize: 11, color: '#f5a623' }}>
                            {t(language, 'approveProgress')}: {ap.approvalCount ?? 1}/2
                          </div>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </DataTable>
          </Card>
        )
      )}
    </PageShell>
  );
}

/* ───────── 4. LogisticsTrackingPage ───────── */

export function LogisticsTrackingPage({ language, currency }: { language: Language; currency: Currency }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch('/api/v1/logistics')
      .then((r) => {
        if (r.status === 404) throw new Error('NOT_FOUND');
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        const payload = json.data ?? json;
        if (Array.isArray(payload)) {
          setItems(payload);
        } else if (payload && typeof payload === 'object') {
          const arrayKey = Object.keys(payload).find((k) => Array.isArray(payload[k]));
          setItems(arrayKey ? payload[arrayKey] : []);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.message === 'NOT_FOUND') {
          setNotFound(true);
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <PageShell title={t(language, 'logisticsTracking')} subtitle={t(language, 'logisticsTrackingSub')} icon="🚚" language={language}>
      {loading && <Loading />}
      {!loading && notFound && (
        <Empty text={t(language, 'noTrackingData')} />
      )}
      {!loading && !notFound && items.length === 0 && (
        <Empty text={t(language, 'noPendingRequests')} />
      )}
      {!loading && !notFound && items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {items.map((item: any, idx: number) => (
            <Card key={item.id ?? idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ color: '#c6a969', fontSize: 15, fontWeight: 700 }}>#{item.id ?? idx}</span>
                <Badge value={item.status ?? 'UNKNOWN'} />
              </div>
              <div style={{ fontSize: 13, color: '#c0c0d0', lineHeight: 1.8 }}>
                <div>{t(language, 'source')}: {item.origin ?? '—'}</div>
                <div>{t(language, 'destination')}: {item.destination ?? '—'}</div>
                <div>{t(language, 'lastUpdate')}: {fmtDateTime(item.lastUpdate ?? item.updatedAt, language)}</div>
                {item.gpsLatitude != null && item.gpsLongitude != null && (
                  <div>{t(language, 'coordinates')}: {item.gpsLatitude}, {item.gpsLongitude}</div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}

export {};
