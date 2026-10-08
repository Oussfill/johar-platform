import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';
import {
  PageShell, useFetch, StatCard, Card, DataTable, Td, Badge, Loading,
  ErrorBox, Empty, fmtMoney, fmtNum, fmtDate, fmtDateTime, normalizeNumber,
} from '../components/UiKit';
import type { Language, Currency } from '../components/UiKit';

/* ───────── three-language strings ───────── */

const T: Record<string, Record<Language, string>> = {
  treasury:          { AR: 'الخزينة',             EN: 'Treasury',            FR: 'Trésorerie' },
  escrow:            { AR: 'الضمان المالي',        EN: 'Financial Escrow',    FR: 'Sécquestre Financier' },
  pricingEngine:     { AR: 'محرك التسعير',         EN: 'Pricing Engine',      FR: 'Moteur de Tarification' },
  invoices:          { AR: 'الفواتير',            EN: 'Invoices',            FR: 'Factures' },
  revenueToday:      { AR: 'إيرادات اليوم',        EN: "Today's Revenue",     FR: "Revenus du Jour" },
  thisWeek:          { AR: 'هذا الأسبوع',         EN: 'This Week',           FR: 'Cette Semaine' },
  thisMonth:         { AR: 'هذا الشهر',           EN: 'This Month',          FR: 'Ce Mois' },
  thisYear:          { AR: 'هذه السنة',            EN: 'This Year',           FR: 'Cette Année' },
  outstanding:       { AR: 'مبالغ مستحقة',         EN: 'Outstanding',         FR: 'Impayés' },
  overdue:           { AR: 'متأخرة',              EN: 'Overdue',             FR: 'En Retard' },
  pending:           { AR: 'قيد الانتظار',         EN: 'Pending',             FR: 'En Attente' },
  goldReserves:      { AR: 'احتياطي الذهب',        EN: 'Gold Reserves',       FR: "Réserves d'Or" },
  assetsValue:       { AR: 'قيمة الأصول',          EN: 'Assets Value',        FR: 'Valeur des Actifs' },
  escrowCode:        { AR: 'رمز الضمان',           EN: 'Escrow Code',         FR: 'Code Sécquestre' },
  holdAmount:        { AR: 'مبلغ الحجز',           EN: 'Hold Amount',         FR: 'Montant Bloqué' },
  platformFee:       { AR: 'رسوم المنصة',          EN: 'Platform Fee',        FR: 'Frais de Plateforme' },
  netAmount:         { AR: 'المبلغ الصافي',        EN: 'Net Amount',          FR: 'Montant Net' },
  expires:           { AR: 'انتهاء',               EN: 'Expires',             FR: 'Expire' },
  metal:             { AR: 'معدن',                 EN: 'Metal',               FR: 'Métal' },
  pricePerGram:      { AR: 'سعر لكل غرام',        EN: 'Price / Gram',        FR: 'Prix / Gramme' },
  exchangeRate:      { AR: 'سعر الصرف',            EN: 'Exchange Rate',       FR: 'Taux de Change' },
  invoiceNumber:     { AR: 'رقم الفاتورة',        EN: 'Invoice #',           FR: 'N° Facture' },
  customer:          { AR: 'العميل',               EN: 'Customer',            FR: 'Client' },
  paid:              { AR: 'المدفوع',              EN: 'Paid',                FR: 'Payé' },
  remaining:         { AR: 'المتبقي',              EN: 'Outstanding',         FR: 'Impayé' },
  dueAt:             { AR: 'استحقاق',              EN: 'Due Date',            FR: "Date d'Échéance" },
  pricingFormula:    { AR: 'صيغة التسعير',         EN: 'Pricing Formula',     FR: 'Formule de Tarification' },
  totalHeld:         { AR: 'إجمالي محجوز',         EN: 'Total Held',          FR: 'Total Bloqué' },
  released:          { AR: 'مطلق',                 EN: 'Released',            FR: 'Libéré' },
  held:              { AR: 'محتجز',                EN: 'Held',                FR: 'Détenu' },
  status:            { AR: 'الحالة',               EN: 'Status',              FR: 'Statut' },
  currency:          { AR: 'العملة',               EN: 'Currency',            FR: 'Devise' },
  total:             { AR: 'الإجمالي',             EN: 'Total',               FR: 'Total' },
  count:             { AR: 'العدد',                EN: 'Count',               FR: 'Nombre' },
  noData:            { AR: 'لا توجد بيانات',      EN: 'No data available',   FR: 'Aucune donnée' },
  updated:           { AR: 'آخر تحديث',            EN: 'Updated',             FR: 'Mis à jour' },
};

function t(lang: Language, key: string): string {
  return T[key]?.[lang] || T[key]?.EN || key;
}

/* ───────── helper: extract array from { data: { <collection>: [...] } } ───────── */

function extractArray<T = any>(json: any, ...keys: string[]): T[] {
  const payload = json?.data ?? json;
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    for (const k of keys) {
      if (Array.isArray(payload[k])) return payload[k] as T[];
    }
    const first = Object.values(payload).find((v) => Array.isArray(v));
    if (first) return first as T[];
  }
  return [];
}

function extractObject(json: any, ...keys: string[]): Record<string, any> {
  const payload = json?.data ?? json;
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    for (const k of keys) {
      if (payload[k] && typeof payload[k] === 'object' && !Array.isArray(payload[k])) {
        return payload[k] as Record<string, any>;
      }
    }
    return payload as Record<string, any>;
  }
  return {};
}

/* ───────── 1. FinanceTreasuryPage ───────── */

export function FinanceTreasuryPage({ language, currency }: { language: Language; currency: Currency }) {
  const [summary, setSummary] = useState<Record<string, any> | null>(null);
  const [treasury, setTreasury] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      apiFetch('/api/v1/financial/summary').then((r) => r.json()),
      apiFetch('/api/v1/financial/treasury').then((r) => r.json()),
    ])
      .then(([summaryJson, treasuryJson]) => {
        if (cancelled) return;
        setSummary(extractObject(summaryJson, 'summary'));
        const tObj = extractObject(treasuryJson, 'treasury');
        setTreasury(tObj);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load treasury data');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const revenueByPeriod: Record<string, { amount?: number; currency?: string }> =
    summary?.revenueByPeriod ?? {};
  const outstandingPayments: Record<string, number> =
    summary?.outstandingPayments ?? {};

  const treasuryNumeric: [string, number][] = [];
  if (treasury) {
    Object.entries(treasury).forEach(([k, v]) => {
      if (typeof v === 'number') treasuryNumeric.push([k, v]);
    });
  }

  return (
    <PageShell title={t(language, 'treasury')} subtitle="" icon="🏦" language={language}>
      {loading && <Loading />}
      {error && <ErrorBox message={error} />}

      {!loading && !error && (
        <>
          <Card title={t(language, 'treasury')} style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              <StatCard
                label={t(language, 'revenueToday')}
                value={fmtMoney(normalizeNumber(revenueByPeriod?.today?.amount ?? 0), currency)}
                icon="💰"
              />
              <StatCard
                label={t(language, 'thisWeek')}
                value={fmtMoney(normalizeNumber(revenueByPeriod?.thisWeek?.amount ?? 0), currency)}
                icon="📊"
              />
              <StatCard
                label={t(language, 'thisMonth')}
                value={fmtMoney(normalizeNumber(revenueByPeriod?.thisMonth?.amount ?? 0), currency)}
                icon="📈"
              />
              <StatCard
                label={t(language, 'thisYear')}
                value={fmtMoney(normalizeNumber(revenueByPeriod?.thisYear?.amount ?? 0), currency)}
                icon="🏆"
              />
            </div>
          </Card>

          <Card title={t(language, 'outstanding')} style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              <StatCard
                label={t(language, 'total')}
                value={fmtMoney(normalizeNumber(outstandingPayments?.total ?? 0), currency)}
                icon="💵"
              />
              <StatCard
                label={t(language, 'overdue')}
                value={fmtMoney(normalizeNumber(outstandingPayments?.overdue ?? 0), currency)}
                icon="⚠️"
                color="#e74c3c"
              />
              <StatCard
                label={t(language, 'pending')}
                value={fmtMoney(normalizeNumber(outstandingPayments?.pending ?? 0), currency)}
                icon="⏳"
                color="#f5a623"
              />
            </div>
          </Card>

          <Card title={t(language, 'goldReserves')} style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              <StatCard
                label={t(language, 'assetsValue')}
                value={fmtMoney(normalizeNumber(treasury?.assetsValue ?? 0), currency)}
                icon="🏦"
              />
              {treasuryNumeric.length > 0 &&
                treasuryNumeric.map(([k, v]) => (
                  <StatCard key={k} label={k} value={fmtNum(v)} icon="📊" />
                ))}
            </div>
          </Card>

          {Array.isArray(treasury?.goldHoldings) && treasury.goldHoldings.length > 0 && (
            <Card title={t(language, 'goldReserves')}>
              <DataTable columns={['ID', t(language, 'metal'), t(language, 'total')]}>
                {treasury.goldHoldings.map((h: any, idx: number) => (
                  <tr key={h.id ?? idx}>
                    <Td>{h.id ?? h.goldId ?? idx + 1}</Td>
                    <Td>{h.metal ?? h.type ?? '—'}</Td>
                    <Td>{fmtNum(normalizeNumber(h.weight ?? h.amount ?? h.quantity ?? 0))}</Td>
                  </tr>
                ))}
              </DataTable>
            </Card>
          )}

          {!treasuryNumeric.length && !treasury?.goldHoldings && (
            <Empty text={t(language, 'noData')} />
          )}
        </>
      )}
    </PageShell>
  );
}

/* ───────── 2. FinanceEscrowPage ───────── */

interface EscrowEntry {
  escrowCode: string;
  holdAmount: number;
  currency: string;
  status: string;
  platformFee: number;
  netAmount: number;
  expiresAt: string;
}

export function FinanceEscrowPage({ language, currency }: { language: Language; currency: Currency }) {
  const { data: escrowsRaw, loading, error } = useFetch<any[]>('/api/v1/financial/escrow');

  const escrows: EscrowEntry[] = Array.isArray(escrowsRaw) ? escrowsRaw : [];
  const total = escrows.length;
  const totalHold = escrows.reduce((s, e) => s + normalizeNumber(e.holdAmount), 0);
  const releasedCount = escrows.filter((e) => e.status?.toUpperCase() === 'RELEASED').length;
  const heldCount = escrows.filter((e) => e.status?.toUpperCase() === 'HELD').length;

  return (
    <PageShell title={t(language, 'escrow')} subtitle="" icon="🔒" language={language}>
      {loading && <Loading />}
      {error && <ErrorBox message={String(error)} />}

      {!loading && !error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatCard label={t(language, 'count')} value={fmtNum(total)} icon="📋" />
            <StatCard label={t(language, 'totalHeld')} value={fmtMoney(totalHold, currency)} icon="💰" />
            <StatCard label={t(language, 'released')} value={fmtNum(releasedCount)} icon="✅" color="#3cb97e" />
            <StatCard label={t(language, 'held')} value={fmtNum(heldCount)} icon="🔒" color="#f5a623" />
          </div>

          {total === 0 ? (
            <Empty text={t(language, 'noData')} />
          ) : (
            <DataTable columns={[
              t(language, 'escrowCode'),
              t(language, 'holdAmount'),
              t(language, 'currency'),
              t(language, 'platformFee'),
              t(language, 'netAmount'),
              t(language, 'status'),
              t(language, 'expires'),
            ]}>
              {escrows.map((e, idx) => (
                <tr key={e.escrowCode ?? idx}>
                  <Td>{e.escrowCode ?? '—'}</Td>
                  <Td>{fmtMoney(normalizeNumber(e.holdAmount), currency)}</Td>
                  <Td>{e.currency ?? currency}</Td>
                  <Td>{fmtMoney(normalizeNumber(e.platformFee), currency)}</Td>
                  <Td>{fmtMoney(normalizeNumber(e.netAmount), currency)}</Td>
                  <Td><Badge value={e.status ?? 'UNKNOWN'} /></Td>
                  <Td>{fmtDate(e.expiresAt, language)}</Td>
                </tr>
              ))}
            </DataTable>
          )}
        </>
      )}
    </PageShell>
  );
}

/* ───────── 3. FinancePricingPage ───────── */

interface MetalEntry {
  type: string;
  pricePerGram: number;
  currency: string;
  timestamp: string;
}

interface ExchangeRateEntry {
  pair: string;
  rate: number;
}

export function FinancePricingPage({ language, currency }: { language: Language; currency: Currency }) {
  const [metals, setMetals] = useState<MetalEntry[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiFetch('/api/v1/financial/pricing-engine')
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const m = extractArray(json, 'metals');
        const er = extractArray(json, 'exchangeRates');
        setMetals(m as MetalEntry[]);
        setExchangeRates(er as ExchangeRateEntry[]);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load pricing data');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const goldLatest = metals.find((m) => m.type?.toUpperCase() === 'GOLD');
  const silverLatest = metals.find((m) => m.type?.toUpperCase() === 'SILVER');

  return (
    <PageShell title={t(language, 'pricingEngine')} subtitle="" icon="💲" language={language}>
      {loading && <Loading />}
      {error && <ErrorBox message={error} />}

      {!loading && !error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            {goldLatest && (
              <StatCard
                label={`${t(language, 'goldReserves')} (${t(language, 'pricePerGram')})`}
                value={fmtMoney(normalizeNumber(goldLatest.pricePerGram), goldLatest.currency || currency)}
                icon="🥇"
                color="#FFD700"
              />
            )}
            {silverLatest && (
              <StatCard
                label={`${t(language, 'metal')} Silver (${t(language, 'pricePerGram')})`}
                value={fmtMoney(normalizeNumber(silverLatest.pricePerGram), silverLatest.currency || currency)}
                icon="🥈"
                color="#C0C0C0"
              />
            )}
          </div>

          <Card title={t(language, 'pricingFormula')} style={{ marginBottom: 24, textAlign: 'center' }}>
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(198,169,105,0.15), rgba(255,215,0,0.08))',
              border: '1px solid rgba(255,215,0,0.3)',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              color: '#c6a969',
              letterSpacing: 1,
              lineHeight: 1.8,
            }}>
              {language === 'AR'
                ? 'السعر النهائي = المعدن + التصنيع + الشهادة + التأمين + اللوجستيات + الرسوم + الضرائب'
                : language === 'FR'
                ? 'PRIX FINAL = MÉTAL + FABRICATION + CERTIFICATION + ASSURANCE + LOGISTIQUE + FRAIS + TAXES'
                : 'FINAL PRICE = METAL + MANUFACTURING + CERTIFICATION + INSURANCE + LOGISTICS + FEE + TAXES'}
            </div>
          </Card>

          {metals.length > 0 && (
            <Card title={t(language, 'metal')} style={{ marginBottom: 24 }}>
              <DataTable columns={[t(language, 'metal'), t(language, 'pricePerGram'), t(language, 'currency'), t(language, 'updated')]}>
                {metals.map((m, idx) => (
                  <tr key={m.type ?? idx}>
                    <Td>{m.type ?? '—'}</Td>
                    <Td>{fmtMoney(normalizeNumber(m.pricePerGram), m.currency || currency)}</Td>
                    <Td>{m.currency ?? '—'}</Td>
                    <Td>{fmtDateTime(m.timestamp, language)}</Td>
                  </tr>
                ))}
              </DataTable>
            </Card>
          )}

          {exchangeRates.length > 0 && (
            <Card title={t(language, 'exchangeRate')}>
              <DataTable columns={[t(language, 'exchangeRate'), t(language, 'total')]}>
                {exchangeRates.map((er, idx) => (
                  <tr key={er.pair ?? idx}>
                    <Td>{er.pair ?? '—'}</Td>
                    <Td>{fmtNum(normalizeNumber(er.rate))}</Td>
                  </tr>
                ))}
              </DataTable>
            </Card>
          )}

          {metals.length === 0 && exchangeRates.length === 0 && (
            <Empty text={t(language, 'noData')} />
          )}
        </>
      )}
    </PageShell>
  );
}

/* ───────── 4. FinanceInvoicesPage ───────── */

interface InvoiceEntry {
  invoiceNumber: string;
  customerName: string;
  total: number;
  currency: string;
  paidAmount: number;
  status: string;
  dueAt: string;
}

export function FinanceInvoicesPage({ language, currency }: { language: Language; currency: Currency }) {
  const { data: invoicesRaw, loading, error } = useFetch<any[]>('/api/v1/financial/invoices');

  const invoices: InvoiceEntry[] = Array.isArray(invoicesRaw) ? invoicesRaw : [];
  const total = invoices.length;
  const paidCount = invoices.filter((i) => i.status?.toUpperCase() === 'PAID').length;
  const pendingCount = invoices.filter((i) => i.status?.toUpperCase() === 'PENDING').length;
  const overdueCount = invoices.filter((i) => i.status?.toUpperCase() === 'OVERDUE').length;

  return (
    <PageShell title={t(language, 'invoices')} subtitle="" icon="🧾" language={language}>
      {loading && <Loading />}
      {error && <ErrorBox message={String(error)} />}

      {!loading && !error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatCard label={t(language, 'count')} value={fmtNum(total)} icon="📋" />
            <StatCard label={t(language, 'paid')} value={fmtNum(paidCount)} icon="✅" color="#3cb97e" />
            <StatCard label={t(language, 'pending')} value={fmtNum(pendingCount)} icon="⏳" color="#f5a623" />
            <StatCard label={t(language, 'overdue')} value={fmtNum(overdueCount)} icon="🔴" color="#e74c3c" />
          </div>

          {total === 0 ? (
            <Empty text={t(language, 'noData')} />
          ) : (
            <DataTable columns={[
              t(language, 'invoiceNumber'),
              t(language, 'customer'),
              t(language, 'total'),
              t(language, 'paid'),
              t(language, 'remaining'),
              t(language, 'status'),
              t(language, 'dueAt'),
            ]}>
              {invoices.map((inv, idx) => (
                <tr key={inv.invoiceNumber ?? idx}>
                  <Td>{inv.invoiceNumber ?? '—'}</Td>
                  <Td>{inv.customerName ?? '—'}</Td>
                  <Td>{fmtMoney(normalizeNumber(inv.total), inv.currency || currency)}</Td>
                  <Td>{fmtMoney(normalizeNumber(inv.paidAmount), inv.currency || currency)}</Td>
                  <Td>{fmtMoney(normalizeNumber(inv.total - inv.paidAmount), inv.currency || currency)}</Td>
                  <Td><Badge value={inv.status ?? 'UNKNOWN'} /></Td>
                  <Td>{fmtDate(inv.dueAt, language)}</Td>
                </tr>
              ))}
            </DataTable>
          )}
        </>
      )}
    </PageShell>
  );
}

export {};
