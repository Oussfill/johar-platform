import React, { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';
import {
  PageShell, useFetch, StatCard, Card, DataTable, Td, Badge, Loading,
  ErrorBox, Empty, fmtNum, fmtDate, fmtDateTime, normalizeNumber,
} from '../components/UiKit';
import type { Language, Currency } from '../components/UiKit';

/* ───────── translations ───────── */
// المفاتيح مكتوبة بأحرف كبيرة AR / FR / EN — الوصول عبر T[key][language]

const T: Record<string, Record<Language, string>> = {
  auditLogs: { AR: 'سجل التدقيق', FR: "Journal d'audit", EN: 'Audit Logs' },
  auditLogsSubtitle: { AR: 'سجل كامل لعمليات المنصة', FR: 'Journal complet des opérations de la plateforme', EN: 'Full journal of platform operations' },
  blockchainEvidence: { AR: 'الأدلة المشفرة', FR: 'Preuves Blockchain', EN: 'Blockchain Evidence' },
  hashEvidenceSubtitle: { AR: 'التمرير: أدلة التجزئة', FR: 'Défilement : preuves de hachage', EN: 'Scroll: Hash Evidence' },
  userManagement: { AR: 'إدارة المستخدمين', FR: 'Gestion des Utilisateurs', EN: 'User Management' },
  userManagementSubtitle: { AR: 'المستخدمون والأدوار وصول مفتاح API', FR: 'Utilisateurs, rôles et accès par clé API', EN: 'Users, roles and API key access' },
  action: { AR: 'العمل', FR: 'Action', EN: 'Action' },
  description: { AR: 'الوصف', FR: 'Description', EN: 'Description' },
  severity: { AR: 'الخطورة', FR: 'Gravité', EN: 'Severity' },
  category: { AR: 'التصنيف', FR: 'Catégorie', EN: 'Category' },
  user: { AR: 'المستخدم', FR: 'Utilisateur', EN: 'User' },
  date: { AR: 'التاريخ', FR: 'Date', EN: 'Date' },
  blockNumber: { AR: 'رقم الكتلة', FR: 'Numéro de Bloc', EN: 'Block Number' },
  evidenceId: { AR: 'معرّف الدليل', FR: 'ID de Preuve', EN: 'Evidence ID' },
  assetGoldId: { AR: 'رقم الذهب', FR: 'ID Or', EN: 'Asset Gold ID' },
  network: { AR: 'الشبكة', FR: 'Réseau', EN: 'Network' },
  operation: { AR: 'العملية', FR: 'Opération', EN: 'Operation' },
  hash: { AR: 'التجزئة', FR: 'Empreinte', EN: 'Hash' },
  status: { AR: 'حالة', FR: 'Statut', EN: 'Status' },
  nineRoles: { AR: 'الأدوار التسعة', FR: 'Les Neuf Rôles', EN: 'Nine Roles' },
  keyName: { AR: 'اسم المفتاح', FR: 'Nom de la Clé', EN: 'Key Name' },
  keyPrefix: { AR: 'البادئة', FR: 'Préfixe', EN: 'Prefix' },
  environment: { AR: 'البيئة', FR: 'Environnement', EN: 'Environment' },
  apiKey: { AR: 'مفتاح API', FR: 'Clé API', EN: 'API Key' },
  expires: { AR: 'انتهاء', FR: 'Expiration', EN: 'Expires' },
  active: { AR: 'النشط', FR: 'Actif', EN: 'Active' },
  inactive: { AR: 'غير نشط', FR: 'Inactif', EN: 'Inactive' },
  email: { AR: 'البريد الإلكتروني', FR: 'E-mail', EN: 'Email' },
  department: { AR: 'القسم', FR: 'Département', EN: 'Department' },
  partyKey: { AR: 'مفتاح الطرف', FR: 'Clé Partenaire', EN: 'Party Key' },
  platformKey: { AR: 'مفتاح المنصة', FR: 'Clé Plateforme', EN: 'Platform Key' },
  name: { AR: 'الاسم', FR: 'Nom', EN: 'Name' },
  roleCode: { AR: 'رمز الدور', FR: 'Code du Rôle', EN: 'Role Code' },
  usersSection: { AR: 'المستخدمون', FR: 'Utilisateurs', EN: 'Users' },
  apiKeysSection: { AR: 'مفاتيح API', FR: 'Clés API', EN: 'API Keys' },
  totalLogs: { AR: 'إجمالي السجلات', FR: 'Total des Journaux', EN: 'Total Logs' },
  infoCount: { AR: 'معلومات', FR: 'Info', EN: 'Info' },
  lowCount: { AR: 'منخفض', FR: 'Bas', EN: 'Low' },
  mediumCount: { AR: 'متوسط', FR: 'Moyen', EN: 'Medium' },
  highCount: { AR: 'مرتفع', FR: 'Élevé', EN: 'High' },
  criticalCount: { AR: 'حرج', FR: 'Critique', EN: 'Critical' },
  totalEvidence: { AR: 'إجمالي الأدلة', FR: 'Total des Preuves', EN: 'Total Evidence' },
  verifiedEvidence: { AR: 'موثَّق', FR: 'Vérifié', EN: 'Verified' },
  pendingEvidence: { AR: 'قيد الانتظار', FR: 'En Attente', EN: 'Pending' },
  txid: { AR: 'معرّف المعاملة', FR: 'ID de Transaction', EN: 'Tx ID' },
  logsEmpty: { AR: 'لا توجد سجلات تدقيق بعد', FR: "Aucun journal d'audit", EN: 'No audit logs yet' },
  evidenceEmpty: { AR: 'لا توجد أدلة مشفرة بعد', FR: 'Aucune preuve blockchain', EN: 'No blockchain evidence yet' },
  employeesEmpty: { AR: 'لا يوجد موظفون بعد', FR: 'Aucun employé', EN: 'No employees yet' },
  keysEmpty: { AR: 'لا توجد مفاتيح API بعد', FR: 'Aucune clé API', EN: 'No API keys yet' },
  blockchainBanner: {
    AR: 'البلوكتشين نظام إثبات فقط — لا تُخزَّن بيانات شخصية/KYC عليه',
    FR: "La blockchain est un système de preuve uniquement — aucune donnée personnelle/KYC n'y est stockée",
    EN: 'Blockchain is proof-only — no personal/KYC data is stored on it',
  },
  zeroTrust: {
    AR: 'Zero-Trust — كل طلب يتحقق من الدور والصلاحية على الخادم',
    FR: 'Zero-Trust — chaque requête est validée côté serveur (rôle et permissions)',
    EN: 'Zero-Trust — every request is validated server-side (role & permissions)',
  },
};

const tr = (key: string, language: Language): string => T[key]?.[language] ?? key;

/* ───────── shared helpers ───────── */

const userNameOf = (u: unknown): string => {
  if (!u) return '—';
  if (typeof u === 'string') return u;
  const o = u as { firstName?: string; lastName?: string };
  return [o.firstName, o.lastName].filter(Boolean).join(' ') || '—';
};

const shortHash = (h: string): string => (h && h.length > 12 ? `${h.slice(0, 12)}…` : h || '—');

const roleCodeOf = (role: unknown): string => {
  if (!role) return '—';
  if (typeof role === 'string') return role;
  return (role as { roleCode?: string }).roleCode || '—';
};

const InfoBanner: React.FC<{
  icon: string;
  text: string;
  background: string;
  border: string;
  color: string;
}> = ({ icon, text, background, border, color }) => (
  <div
    dir="ltr"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 16px',
      borderRadius: 10,
      marginBottom: 20,
      background,
      border,
      color,
      fontSize: 13,
      fontWeight: 600,
      lineHeight: 1.6,
    }}
  >
    <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
    <span dir="auto">{text}</span>
  </div>
);

/* ───────── data shapes ───────── */

interface AuditLogRow {
  action: string;
  description?: string;
  severity: string;
  category: string;
  createdAt?: string;
  user?: string | { firstName?: string; lastName?: string };
}

interface BlockchainEvidenceRow {
  evidenceId: string;
  assetGoldId: string;
  hash: string;
  blockNumber: number | string;
  network: string;
  operation: string;
  status: string;
  timestamp?: string;
  txId?: string;
}

interface EmployeeAccount {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string | { roleCode?: string; nameEn?: string; nameAr?: string };
  department?: string;
  isActive?: boolean;
}

interface ApiKeyEntry {
  name: string;
  prefix?: string;
  environment?: string;
  isActive: boolean;
  createdAt?: string;
  expiresAt?: string;
}

const ROLES: Array<{ code: string; en: string; ar: string }> = [
  { code: 'SUPER_ADMIN', en: 'Super Admin', ar: 'مدير النظام' },
  { code: 'ADMIN', en: 'Admin', ar: 'مدير العمليات' },
  { code: 'CUSTODY_MANAGER', en: 'Custody Manager', ar: 'مدير الخزائن' },
  { code: 'LAB_DIRECTOR', en: 'Lab Director', ar: 'مدير المختبر' },
  { code: 'LAB_TECHNICIAN', en: 'Lab Technician', ar: 'تقني المختبر' },
  { code: 'CUSTODIAN', en: 'Custodian', ar: 'الحارس' },
  { code: 'AUDITOR', en: 'Auditor', ar: 'المفتش' },
  { code: 'MARKETPLACE_SELLER', en: 'Marketplace Seller', ar: 'التاجر' },
  { code: 'VIEWER', en: 'Viewer', ar: 'مشاهد' },
];

/* ───────── 1. AdminAuditLogsPage ───────── */

export const AdminAuditLogsPage: React.FC<{ language: Language; currency: Currency }> = ({ language }) => {
  const t = (key: string) => tr(key, language);
  const dir = language === 'AR' ? 'rtl' : 'ltr';
  const { data: logs, loading, error } = useFetch<AuditLogRow[]>('/api/v1/compliance/audit-logs');

  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const loadStats = useCallback(() => {
    apiFetch('/api/v1/audit/stats')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((json) => {
        setStats((json.data ?? json) as Record<string, unknown>);
        setStatsError(null);
      })
      .catch((err: Error) => setStatsError(err.message || 'Network error'));
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const auditCount = (variants: string[]): number => {
    if (!stats) return 0;
    for (const v of variants) {
      const direct = stats[v];
      if (direct !== undefined && direct !== null) {
        const n = Number(direct);
        if (Number.isFinite(n)) return n;
      }
    }
    for (const groupKey of ['severityCounts', 'bySeverity', 'severity', 'counts'] as const) {
      const group = stats[groupKey];
      if (group && typeof group === 'object') {
        const g = group as Record<string, unknown>;
        for (const v of variants) {
          const val = g[v];
          if (val !== undefined && val !== null) {
            const n = Number(val);
            if (Number.isFinite(n)) return n;
          }
        }
      }
    }
    return 0;
  };

  const cInfo = auditCount(['INFO', 'info', 'infoCount', 'countInfo']);
  const cLow = auditCount(['LOW', 'low', 'lowCount', 'countLow']);
  const cMedium = auditCount(['MEDIUM', 'medium', 'mediumCount', 'countMedium']);
  const cHigh = auditCount(['HIGH', 'high', 'highCount', 'countHigh']);
  const cCritical = auditCount(['CRITICAL', 'critical', 'criticalCount', 'countCritical']);
  const total = auditCount(['total', 'totalCount', 'totalLogs', 'count', 'logs', 'TOTAL']);
  const totalSafe = total || cInfo + cLow + cMedium + cHigh + cCritical;

  return (
    <PageShell title={t('auditLogs')} subtitle={t('auditLogsSubtitle')} icon="📋" language={language}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label={t('totalLogs')} value={fmtNum(totalSafe)} icon="📋" />
        <StatCard label={t('infoCount')} value={fmtNum(cInfo)} icon="ℹ️" color="#5b8ff9" />
        <StatCard label={t('lowCount')} value={fmtNum(cLow)} icon="🟢" color="#5b8ff9" />
        <StatCard label={t('mediumCount')} value={fmtNum(cMedium)} icon="🟠" color="#f5a623" />
        <StatCard label={t('highCount')} value={fmtNum(cHigh)} icon="🔴" color="#e8564a" />
        <StatCard label={t('criticalCount')} value={fmtNum(cCritical)} icon="⛔" color="#dc3545" />
      </div>

      {statsError && <ErrorBox message={String(statsError)} />}

      {loading && <Loading />}
      {error && <ErrorBox message={String(error)} />}
      {!loading && !error && (
        !logs || logs.length === 0 ? (
          <Empty text={t('logsEmpty')} />
        ) : (
          <DataTable columns={[t('action'), t('description'), t('severity'), t('category'), t('user'), t('date')]} dir={dir}>
            {logs.map((log, idx) => (
              <tr key={idx}>
                <Td>{log.action}</Td>
                <Td style={{ maxWidth: 320, whiteSpace: 'normal' }}>{log.description || '—'}</Td>
                <Td><Badge value={log.severity} /></Td>
                <Td>{log.category || '—'}</Td>
                <Td>{userNameOf(log.user)}</Td>
                <Td>{fmtDateTime(log.createdAt, language)}</Td>
              </tr>
            ))}
          </DataTable>
        )
      )}
    </PageShell>
  );
};

/* ───────── 2. AdminBlockchainPage ───────── */

export const AdminBlockchainPage: React.FC<{ language: Language; currency: Currency }> = ({ language }) => {
  const t = (key: string) => tr(key, language);
  const dir = language === 'AR' ? 'rtl' : 'ltr';
  const { data: evidence, loading, error } = useFetch<BlockchainEvidenceRow[]>('/api/v1/system/blockchain-evidence');

  const evList = evidence ?? [];
  const verified = evList.filter((e) => e.status === 'VERIFIED').length;
  const pending = evList.filter((e) => e.status === 'PENDING').length;

  return (
    <PageShell title={t('blockchainEvidence')} subtitle={t('hashEvidenceSubtitle')} icon="⛓️" language={language}>
      <InfoBanner
        icon="🔒"
        text={t('blockchainBanner')}
        background="rgba(245,166,35,0.1)"
        border="1px solid rgba(245,166,35,0.4)"
        color="#f5a623"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label={t('totalEvidence')} value={fmtNum(evList.length)} icon="⛓️" />
        <StatCard label={t('verifiedEvidence')} value={fmtNum(verified)} icon="✅" color="#3cb97e" />
        <StatCard label={t('pendingEvidence')} value={fmtNum(pending)} icon="⏳" color="#f5a623" />
      </div>

      {loading && <Loading />}
      {error && <ErrorBox message={String(error)} />}
      {!loading && !error && (
        !evList || evList.length === 0 ? (
          <Empty text={t('evidenceEmpty')} />
        ) : (
          <DataTable
            columns={[t('evidenceId'), t('assetGoldId'), t('operation'), t('network'), t('blockNumber'), t('status'), t('hash'), t('date'), t('txid')]}
            dir={dir}
          >
            {evList.map((ev, idx) => (
              <tr key={ev.evidenceId ?? idx}>
                <Td>{ev.evidenceId || '—'}</Td>
                <Td>{ev.assetGoldId || '—'}</Td>
                <Td>{ev.operation || '—'}</Td>
                <Td>{ev.network || '—'}</Td>
                <Td>{normalizeNumber(ev.blockNumber) || '—'}</Td>
                <Td><Badge value={ev.status} color={ev.status === 'VERIFIED' ? '#3cb97e' : '#f5a623'} /></Td>
                <Td style={{ fontFamily: 'monospace' }}>{shortHash(ev.hash)}</Td>
                <Td>{fmtDateTime(ev.timestamp, language)}</Td>
                <Td style={{ fontFamily: 'monospace' }}>{ev.txId || '—'}</Td>
              </tr>
            ))}
          </DataTable>
        )
      )}
    </PageShell>
  );
};

/* ───────── 3. AdminUsersRbacPage ───────── */

export const AdminUsersRbacPage: React.FC<{ language: Language; currency: Currency }> = ({ language }) => {
  const t = (key: string) => tr(key, language);
  const dir = language === 'AR' ? 'rtl' : 'ltr';
  const { data: employees, loading, error } = useFetch<EmployeeAccount[]>('/api/v1/hr/employees');
  const { data: apiKeys, loading: keysLoading, error: keysError } = useFetch<ApiKeyEntry[]>('/api/v1/system/api-keys');

  const fullName = (e: EmployeeAccount) => [e.firstName, e.lastName].filter(Boolean).join(' ') || '—';

  return (
    <PageShell title={t('userManagement')} subtitle={t('userManagementSubtitle')} icon="👥" language={language}>
      <InfoBanner
        icon="🛡️"
        text={t('zeroTrust')}
        background="rgba(91,143,249,0.08)"
        border="1px solid rgba(91,143,249,0.3)"
        color="#5b8ff9"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 20, marginBottom: 20 }}>
        <Card title={t('usersSection')}>
          {loading && <Loading />}
          {error && <ErrorBox message={String(error)} />}
          {!loading && !error && (
            !employees || employees.length === 0 ? (
              <Empty text={t('employeesEmpty')} />
            ) : (
              <DataTable columns={[t('name'), t('email'), t('roleCode'), t('department'), t('status')]} dir={dir}>
                {employees.map((emp, idx) => (
                  <tr key={idx}>
                    <Td>{fullName(emp)}</Td>
                    <Td>{emp.email || '—'}</Td>
                    <Td><Badge value={roleCodeOf(emp.role)} /></Td>
                    <Td>{emp.department || '—'}</Td>
                    <Td>
                      <Badge value={emp.isActive ? t('active') : t('inactive')} color={emp.isActive ? '#3cb97e' : '#8a8a9a'} />
                    </Td>
                  </tr>
                ))}
              </DataTable>
            )
          )}
        </Card>

        <Card title={t('apiKeysSection')}>
          {keysLoading && <Loading />}
          {keysError && <ErrorBox message={String(keysError)} />}
          {!keysLoading && !keysError && (
            !apiKeys || apiKeys.length === 0 ? (
              <Empty text={t('keysEmpty')} />
            ) : (
              <DataTable columns={[t('keyName'), t('keyPrefix'), t('environment'), t('status'), t('expires')]} dir={dir}>
                {apiKeys.map((key, idx) => (
                  <tr key={idx}>
                    <Td>{key.name || '—'}</Td>
                    <Td style={{ fontFamily: 'monospace' }}>{key.prefix ? `${key.prefix}…` : '—'}</Td>
                    <Td>{key.environment || '—'}</Td>
                    <Td>
                      <Badge value={key.isActive ? t('active') : t('inactive')} color={key.isActive ? '#3cb97e' : '#8a8a9a'} />
                    </Td>
                    <Td>{fmtDate(key.expiresAt, language)}</Td>
                  </tr>
                ))}
              </DataTable>
            )
          )}
        </Card>
      </div>

      <Card title={t('nineRoles')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {ROLES.map((r) => (
            <div
              key={r.code}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(198,169,105,0.12)',
                borderRadius: 8,
                flexWrap: 'wrap',
              }}
            >
              <Badge value={r.code} />
              <span style={{ color: '#c0c0d0', fontSize: 13, fontWeight: 600 }}>{r.en}</span>
              <span style={{ color: '#8a8a9a', fontSize: 12 }}>{r.ar}</span>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
};

export {};