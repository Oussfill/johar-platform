// ============================================================================
// GOLD PLATFORM — WORKER MANAGEMENT & PAYROLL PAGE
// ============================================================================
// نظام إدارة العمال وشؤونهم المالية
// - إدارة أنواع العمال (الرمز، الاسم، الراتب الأساسي)
// - إدارة سجل العمال (اختيار النوع + الراتب من الأدمن)
// - نظام الرواتب الديناميكي (تنفيذ دفعة، صرف، إلغاء)

import React, { useState, useEffect, useCallback } from 'react';
import {
  PageShell,
  Card,
  GoldButton,
  TextField,
  Loading,
  ErrorBox,
  DataTable,
  Td,
  Badge,
  StatCard,
  fmtNum,
  fmtMoney,
  fmtDate,
} from '../components/UiKit';
import type { Language, Currency } from '../components/UiKit';
import { apiFetch } from '../utils/apiFetch';

interface WorkerTypeRow {
  id: string;
  code: string;
  name: Record<string, string>;
  baseSalary: number;
  salaryCurrency: string;
  isActive: boolean;
  workersCount: number;
}

interface WorkerRow {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  workerType: { id: string; code: string; name: Record<string, string> };
  salary: number;
  salaryCurrency: string;
  hireDate?: string;
  status: string;
}

interface PayrollRow {
  id: string;
  worker: { id: string; name: string; workerType: string };
  amount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  method?: string;
  paidAt?: string;
}

interface PayrollOverview {
  activeWorkers: number;
  monthlyGrossPayroll: number;
  paidThisMonth: number;
  paidThisMonthCount: number;
  outstandingTotal: number;
  outstandingCount: number;
}

type Tab = 'workers' | 'types' | 'payroll';

const EMPTY_TYPE = { code: '', nameAr: '', nameFr: '', nameEn: '', baseSalary: '', salaryCurrency: 'DZD' };
const EMPTY_WORKER = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  workerTypeId: '',
  salary: '',
  salaryCurrency: 'DZD',
  hireDate: '',
};

export function AdminWorkersPage({ language }: { language: Language; currency: Currency }) {
  const [tab, setTab] = useState<Tab>('workers');

  const [types, setTypes] = useState<WorkerTypeRow[]>([]);
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [payments, setPayments] = useState<PayrollRow[]>([]);
  const [overview, setOverview] = useState<PayrollOverview | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; message: string } | null>(null);

  const [typeForm, setTypeForm] = useState(EMPTY_TYPE);
  const [workerForm, setWorkerForm] = useState(EMPTY_WORKER);
  const [period, setPeriod] = useState({ periodStart: '', periodEnd: '' });
  const [submitting, setSubmitting] = useState(false);

  const t = useCallback((key: string): string => {
    const map: Record<string, Record<Language, string>> = {
      title: { AR: 'إدارة العمال والرواتب', FR: 'Gestion du personnel & paie', EN: 'Worker & Payroll Management' },
      workers: { AR: 'العمال', FR: 'Personnel', EN: 'Workers' },
      types: { AR: 'أنواع العمال', FR: 'Types de poste', EN: 'Worker Types' },
      payroll: { AR: 'الرواتب', FR: 'Paie', EN: 'Payroll' },
      firstName: { AR: 'الاسم الأول', FR: 'Prénom', EN: 'First name' },
      lastName: { AR: 'اللقب', FR: 'Nom', EN: 'Last name' },
      phone: { AR: 'الهاتف', FR: 'Téléphone', EN: 'Phone' },
      email: { AR: 'البريد الإلكتروني', FR: 'E-mail', EN: 'Email' },
      type: { AR: 'نوع العامل', FR: 'Type de poste', EN: 'Worker type' },
      salary: { AR: 'الراتب', FR: 'Salaire', EN: 'Salary' },
      currency: { AR: 'العملة', FR: 'Devise', EN: 'Currency' },
      hireDate: { AR: 'تاريخ التوظيف', FR: 'Date embauche', EN: 'Hire date' },
      status: { AR: 'الحالة', FR: 'Statut', EN: 'Status' },
      actions: { AR: 'إجراءات', FR: 'Actions', EN: 'Actions' },
      add: { AR: 'إضافة', FR: 'Ajouter', EN: 'Add' },
      save: { AR: 'حفظ', FR: 'Enregistrer', EN: 'Save' },
      cancel: { AR: 'إلغاء', FR: 'Annuler', EN: 'Cancel' },
      edit: { AR: 'تعديل', FR: 'Modifier', EN: 'Edit' },
      delete: { AR: 'حذف', FR: 'Supprimer', EN: 'Delete' },
      code: { AR: 'الرمز', FR: 'Code', EN: 'Code' },
      nameAr: { AR: 'الاسم (عربي)', FR: 'Nom (AR)', EN: 'Name (AR)' },
      nameFr: { AR: 'الاسم (فرنسي)', FR: 'Nom (FR)', EN: 'Name (FR)' },
      nameEn: { AR: 'الاسم (إنجليزي)', FR: 'Nom (EN)', EN: 'Name (EN)' },
      baseSalary: { AR: 'الراتب الأساسي', FR: 'Salaire de base', EN: 'Base salary' },
      workersCount: { AR: 'عدد العمال', FR: 'Effectifs', EN: 'Workers' },
      active: { AR: 'مفعل', FR: 'Actif', EN: 'Active' },
      inactive: { AR: 'معطل', FR: 'Inactif', EN: 'Inactive' },
      empty: { AR: 'لا توجد بيانات', FR: 'Aucune donnée', EN: 'No data' },
      runPayroll: { AR: 'تنفيذ دورة رواتب', FR: 'Lancer la paie', EN: 'Run payroll' },
      periodStart: { AR: 'بداية الفترة', FR: 'Début période', EN: 'Period start' },
      periodEnd: { AR: 'نهاية الفترة', FR: 'Fin période', EN: 'Period end' },
      pay: { AR: 'صرف', FR: 'Payer', EN: 'Pay' },
      cancelPay: { AR: 'إلغاء', FR: 'Annuler', EN: 'Cancel' },
      period: { AR: 'الفترة', FR: 'Période', EN: 'Period' },
      amount: { AR: 'المبلغ', FR: 'Montant', EN: 'Amount' },
      activeWorkers: { AR: 'العمال النشطون', FR: 'Effectifs actifs', EN: 'Active workers' },
      monthlyGross: { AR: 'التكلفة الشهرية', FR: 'Masse salariale', EN: 'Monthly payroll' },
      paidThisMonth: { AR: 'المصروف هذا الشهر', FR: 'Payé ce mois', EN: 'Paid this month' },
      outstanding: { AR: 'مستحق غير مسدد', FR: 'Impayé', EN: 'Outstanding' },
      total: { AR: 'الإجمالي', FR: 'Total', EN: 'Total' },
      workerToAdd: { AR: 'إضافة عامل جديد', FR: 'Ajouter un employé', EN: 'Add new worker' },
      typeToAdd: { AR: 'إضافة نوع جديد', FR: 'Ajouter un type', EN: 'Add new type' },
      saved: { AR: 'تم الحفظ بنجاح', FR: 'Enregistré avec succès', EN: 'Saved successfully' },
      errorSave: { AR: 'حدث خطأ في الحفظ', FR: 'Erreur d\'enregistrement', EN: 'Save error' },
      missingSalary: { AR: 'الراتب مطلوب', FR: 'Salaire requis', EN: 'Salary required' },
      selectType: { AR: 'اختر النوع...', FR: 'Choisir un type...', EN: 'Select type...' },
      terminated: { AR: 'إنهاء', FR: 'Licencier', EN: 'Terminate' },
      terminatedDone: { AR: 'تم إنهاء الخدمة', FR: 'Contrat terminé', EN: 'Employment terminated' },
    };
    return map[key]?.[language] || key;
  }, [language]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [typesR, workersR, payrollR, overviewR] = await Promise.all([
        apiFetch('/api/v1/hr/worker-types'),
        apiFetch('/api/v1/hr/workers?limit=100'),
        apiFetch('/api/v1/hr/payroll'),
        apiFetch('/api/v1/hr/payroll/overview'),
      ]);
      const [tj, wj, pj, oj] = await Promise.all([
        typesR.json(), workersR.json(), payrollR.json(), overviewR.json(),
      ]);
      if (typesR.ok) setTypes(tj.data?.types || []);
      if (workersR.ok) setWorkers(wj.data?.workers || []);
      if (payrollR.ok) setPayments(pj.data?.payments || []);
      if (overviewR.ok) setOverview(oj.data?.payroll || null);
      if (!typesR.ok || !workersR.ok) setError('Failed to load some lists');
    } catch (e: any) {
      setError(e?.message || 'Load error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const showNote = (ok: boolean, message: string) => {
    setNote({ ok, message });
    setTimeout(() => setNote(null), 4000);
  };

  const submitType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.code || !typeForm.nameAr || typeForm.baseSalary === '') {
      showNote(false, t('errorSave'));
      return;
    }
    setSubmitting(true);
    try {
      const r = await apiFetch('/api/v1/hr/worker-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: typeForm.code,
          nameTranslations: { ar: typeForm.nameAr, fr: typeForm.nameFr || undefined, en: typeForm.nameEn || undefined },
          baseSalary: Number(typeForm.baseSalary) || 0,
          salaryCurrency: typeForm.salaryCurrency || undefined,
        }),
      });
      const j = await r.json();
      if (r.ok) {
        showNote(true, t('saved'));
        setTypeForm(EMPTY_TYPE);
        loadAll();
      } else {
        showNote(false, j?.error?.message || t('errorSave'));
      }
    } catch (err: any) {
      showNote(false, err?.message || t('errorSave'));
    } finally {
      setSubmitting(false);
    }
  };

  const submitWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerForm.firstName || !workerForm.lastName || !workerForm.workerTypeId || workerForm.salary === '') {
      showNote(false, t('errorSave'));
      return;
    }
    setSubmitting(true);
    try {
      const r = await apiFetch('/api/v1/hr/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: workerForm.firstName,
          lastName: workerForm.lastName,
          phone: workerForm.phone || undefined,
          email: workerForm.email || undefined,
          workerTypeId: workerForm.workerTypeId,
          salary: Number(workerForm.salary) || 0,
          salaryCurrency: workerForm.salaryCurrency || undefined,
          hireDate: workerForm.hireDate || undefined,
        }),
      });
      const j = await r.json();
      if (r.ok) {
        showNote(true, t('saved'));
        setWorkerForm(EMPTY_WORKER);
        loadAll();
      } else {
        showNote(false, j?.error?.message || t('errorSave'));
      }
    } catch (err: any) {
      showNote(false, err?.message || t('errorSave'));
    } finally {
      setSubmitting(false);
    }
  };

  const runPayroll = async () => {
    if (!period.periodStart || !period.periodEnd) { showNote(false, t('errorSave')); return; }
    setSubmitting(true);
    try {
      const r = await apiFetch('/api/v1/hr/payroll/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(period),
      });
      const j = await r.json();
      if (r.ok) showNote(true, `${t('saved')} (${j.data?.created ?? 0})`);
      else showNote(false, j?.error?.message || t('errorSave'));
      loadAll();
    } catch (err: any) {
      showNote(false, err?.message || t('errorSave'));
    } finally {
      setSubmitting(false);
    }
  };

  const paySalary = async (id: string) => {
    try {
      const r = await apiFetch(`/api/v1/hr/payroll/${id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'BANK' }),
      });
      if (r.ok) { showNote(true, t('saved')); loadAll(); }
      else showNote(false, t('errorSave'));
    } catch (err: any) {
      showNote(false, err?.message || t('errorSave'));
    }
  };

  const cancelPayment = async (id: string) => {
    try {
      const r = await apiFetch(`/api/v1/hr/payroll/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (r.ok) { showNote(true, t('saved')); loadAll(); }
      else showNote(false, t('errorSave'));
    } catch (err: any) {
      showNote(false, err?.message || t('errorSave'));
    }
  };

  const toggleType = async (type: WorkerTypeRow) => {
    try {
      const r = await apiFetch(`/api/v1/hr/worker-types/${type.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !type.isActive }),
      });
      if (r.ok) loadAll();
    } catch { /* ignore */ }
  };

  const terminateWorker = async (w: WorkerRow) => {
    try {
      const r = await apiFetch(`/api/v1/hr/workers/${w.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (r.ok) { showNote(true, t('terminatedDone')); loadAll(); }
    } catch { /* ignore */ }
  };

  const activeTypes = types.filter((ty) => ty.isActive);
  const nameOf = (labels: Record<string, string> | undefined) => {
    if (!labels) return '—';
    return labels[language] || labels.en || labels.fr || labels.ar || '—';
  };

  const tabButton = (id: Tab, label: string) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '8px 16px',
        borderRadius: 8,
        border: '1px solid rgba(198,169,105,0.25)',
        background: tab === id ? 'linear-gradient(135deg,#c6a969,#a67c00)' : 'transparent',
        color: tab === id ? '#0a0a0f' : '#c6a969',
        fontWeight: 700,
        cursor: 'pointer',
        fontSize: 13,
      }}
    >
      {label}
    </button>
  );

  const formRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid rgba(198,169,105,0.25)',
    background: 'rgba(10,10,15,0.8)',
    color: '#e6e6f0',
    fontSize: 13,
    outline: 'none',
  };

  return (
    <PageShell title={t('title')} subtitle="JOHAR ERP" icon="👷" language={language}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {tabButton('workers', t('workers'))}
        {tabButton('types', t('types'))}
        {tabButton('payroll', t('payroll'))}
      </div>

      {note && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 8,
          marginBottom: 16,
          background: note.ok ? 'rgba(60,185,126,0.12)' : 'rgba(232,86,74,0.12)',
          border: `1px solid ${note.ok ? '#3cb97e' : '#e8564a'}44`,
          color: note.ok ? '#3cb97e' : '#e8564a',
          fontWeight: 600,
          fontSize: 13,
        }}>
          {note.message}
        </div>
      )}

      {loading && <Loading />}
      {error && <ErrorBox message={error} />}

      {!loading && overview && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <StatCard label={t('activeWorkers')} value={fmtNum(overview.activeWorkers || 0)} icon="👷" />
          <StatCard label={t('monthlyGross')} value={fmtMoney(overview.monthlyGrossPayroll || 0, 'DZD')} icon="💼" />
          <StatCard label={t('paidThisMonth')} value={fmtMoney(overview.paidThisMonth || 0, 'DZD')} icon="✅" color="#3cb97e" />
          <StatCard label={t('outstanding')} value={fmtMoney(overview.outstandingTotal || 0, 'DZD')} icon="⏳" color="#f5a623" />
        </div>
      )}

      {!loading && !error && tab === 'workers' && (
        <Card title={t('workerToAdd')}>
          <form onSubmit={submitWorker} style={{ display: 'flex', flexDirection: 'column', gap: 14, background: 'none' }}>
            <div style={formRow}>
              <TextField placeholder={t('firstName')} value={workerForm.firstName}
                onChange={(e) => setWorkerForm({ ...workerForm, firstName: e.target.value })} />
              <TextField placeholder={t('lastName')} value={workerForm.lastName}
                onChange={(e) => setWorkerForm({ ...workerForm, lastName: e.target.value })} />
              <TextField placeholder={t('phone')} value={workerForm.phone}
                onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })} />
              <TextField placeholder={t('email')} value={workerForm.email}
                onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })} />
            </div>
            <div style={formRow}>
              <select
                style={selectStyle}
                value={workerForm.workerTypeId}
                onChange={(e) => setWorkerForm({ ...workerForm, workerTypeId: e.target.value })}
              >
                <option value="">{t('selectType')}</option>
                {activeTypes.map((ty) => (
                  <option key={ty.id} value={ty.id}>{nameOf(ty.name)} ({ty.code}) — {fmtNum(ty.baseSalary)}</option>
                ))}
              </select>
              <TextField placeholder={t('salary')} type="number" min="0" value={workerForm.salary}
                onChange={(e) => setWorkerForm({ ...workerForm, salary: e.target.value })} />
              <select
                style={selectStyle}
                value={workerForm.salaryCurrency}
                onChange={(e) => setWorkerForm({ ...workerForm, salaryCurrency: e.target.value })}
              >
                <option value="DZD">DZD</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
              <TextField placeholder={t('hireDate')} type="date" value={workerForm.hireDate}
                onChange={(e) => setWorkerForm({ ...workerForm, hireDate: e.target.value })} />
            </div>
            <div>
              <GoldButton type="submit" disabled={submitting}>{t('add')}</GoldButton>
              <GoldButton type="button" onClick={() => setWorkerForm(EMPTY_WORKER)}>{t('cancel')}</GoldButton>
            </div>
          </form>
        </Card>
      )}

      {!loading && !error && tab === 'workers' && (
        <Card title={t('workers')} style={{ marginTop: 16 }}>
          <DataTable columns={[t('firstName'), t('lastName'), t('type'), t('salary'), t('hireDate'), t('status'), t('actions')]}>
            {workers.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '10px 12px', color: '#8a8a9a', fontSize: 13 }}>{t('empty')}</td></tr>
            ) : workers.map((w) => (
              <tr key={w.id}>
                <Td>{w.firstName}</Td>
                <Td>{w.lastName}</Td>
                <Td>{nameOf(w.workerType.name)}</Td>
                <Td>{fmtNum(w.salary)} {w.salaryCurrency}</Td>
                <Td>{w.hireDate ? fmtDate(w.hireDate, language) : '—'}</Td>
                <Td><Badge value={w.status} /></Td>
                <Td>
                  {w.status === 'ACTIVE' && (
                    <button onClick={() => terminateWorker(w)} style={{ color: '#e8564a', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                      {t('terminated')}
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </DataTable>
        </Card>
      )}

      {!loading && !error && tab === 'types' && (
        <Card title={t('typeToAdd')}>
          <form onSubmit={submitType} style={{ display: 'flex', flexDirection: 'column', gap: 14, background: 'none' }}>
            <div style={formRow}>
              <TextField placeholder={t('code')} value={typeForm.code}
                onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })} />
              <TextField placeholder={t('nameAr')} value={typeForm.nameAr}
                onChange={(e) => setTypeForm({ ...typeForm, nameAr: e.target.value })} />
              <TextField placeholder={t('nameFr')} value={typeForm.nameFr}
                onChange={(e) => setTypeForm({ ...typeForm, nameFr: e.target.value })} />
              <TextField placeholder={t('nameEn')} value={typeForm.nameEn}
                onChange={(e) => setTypeForm({ ...typeForm, nameEn: e.target.value })} />
            </div>
            <div style={formRow}>
              <TextField placeholder={t('baseSalary')} type="number" min="0" value={typeForm.baseSalary}
                onChange={(e) => setTypeForm({ ...typeForm, baseSalary: e.target.value })} />
              <select
                style={selectStyle}
                value={typeForm.salaryCurrency}
                onChange={(e) => setTypeForm({ ...typeForm, salaryCurrency: e.target.value })}
              >
                <option value="DZD">DZD</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <GoldButton type="submit" disabled={submitting}>{t('add')}</GoldButton>
              <GoldButton type="button" onClick={() => setTypeForm(EMPTY_TYPE)}>{t('cancel')}</GoldButton>
            </div>
          </form>
        </Card>
      )}

      {!loading && !error && tab === 'types' && (
        <Card title={t('types')} style={{ marginTop: 16 }}>
          <DataTable columns={[t('code'), t('nameEn'), t('nameAr'), t('baseSalary'), t('workersCount'), t('status'), t('actions')]}>
            {types.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '10px 12px', color: '#8a8a9a', fontSize: 13 }}>{t('empty')}</td></tr>
            ) : types.map((ty) => (
              <tr key={ty.id}>
                <Td><code style={{ color: '#c6a969' }}>{ty.code}</code></Td>
                <Td>{nameOf(ty.name)}</Td>
                <Td>{ty.name?.ar || '—'}</Td>
                <Td>{fmtNum(ty.baseSalary)} {ty.salaryCurrency}</Td>
                <Td>{ty.workersCount}</Td>
                <Td><Badge value={ty.isActive ? 'ACTIVE' : 'INACTIVE'} color={ty.isActive ? '#3cb97e' : '#8a8a9a'} /></Td>
                <Td>
                  <button onClick={() => toggleType(ty)} style={{ color: '#5b8ff9', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    {ty.isActive ? t('inactive') : t('active')}
                  </button>
                </Td>
              </tr>
            ))}
          </DataTable>
        </Card>
      )}

      {!loading && !error && tab === 'payroll' && (
        <Card title={t('runPayroll')}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField placeholder={t('periodStart')} type="date" value={period.periodStart}
              onChange={(e) => setPeriod({ ...period, periodStart: e.target.value })} />
            <TextField placeholder={t('periodEnd')} type="date" value={period.periodEnd}
              onChange={(e) => setPeriod({ ...period, periodEnd: e.target.value })} />
            <GoldButton onClick={runPayroll} disabled={submitting}>{t('runPayroll')}</GoldButton>
          </div>
        </Card>
      )}

      {!loading && !error && tab === 'payroll' && (
        <Card title={t('payroll')} style={{ marginTop: 16 }}>
          <DataTable columns={[t('worker') + ' / ' + t('type'), t('period'), t('amount'), t('status'), t('actions')]}>
            {payments.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '10px 12px', color: '#8a8a9a', fontSize: 13 }}>{t('empty')}</td></tr>
            ) : payments.map((p) => (
              <tr key={p.id}>
                <Td>{p.worker.name} <span style={{ color: '#8a8a9a' }}>({p.worker.workerType})</span></Td>
                <Td>{fmtDate(p.periodStart, language)} → {fmtDate(p.periodEnd, language)}</Td>
                <Td>{fmtNum(p.amount)} {p.currency}</Td>
                <Td><Badge value={p.status} /></Td>
                <Td>
                  {p.status === 'PENDING' && (
                    <>
                      <button onClick={() => paySalary(p.id)} style={{ color: '#3cb97e', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, marginInlineEnd: 10 }}>
                        {t('pay')}
                      </button>
                      <button onClick={() => cancelPayment(p.id)} style={{ color: '#e8564a', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                        {t('cancelPay')}
                      </button>
                    </>
                  )}
                </Td>
              </tr>
            ))}
          </DataTable>
        </Card>
      )}
    </PageShell>
  );
}