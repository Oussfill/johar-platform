import React, { useState, useEffect } from "react";
import { apiFetch } from '../utils/apiFetch';

// ─── Types ──────────────────────────────────────────────────────────────────
// ─── Helper: استخراج رمز الدور بأمان ──────────────────────────────────────────
function getRoleCode(role: any): string {
  if (typeof role === 'string') return role;
  return role?.roleCode || role?.nameEn || '';
}
function getRoleName(role: any): string {
  if (typeof role === 'string') return role;
  return role?.nameEn || role?.roleCode || '';
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: any;
  status: string;
  lastLogin: string;
}

interface Attendance {
  id: string;
  employeeName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  date: string;
}

interface StaffPerformance {
  employeeName: string;
  role: any;
  tasksCompleted: number;
  rating: number;
  efficiency: number;
}

interface Treasury {
  totalGoldValue: number;
  escrowBalance: number;
  cashFlow: number;
  currency: string;
}

interface MetalPrice {
  metal: string;
  pricePerOz: number;
  change24h: number;
  currency: string;
}

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
}

interface InvoiceSummary {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  overdueCount: number;
}

interface EscrowStatus {
  totalInEscrow: number;
  released: number;
  pending: number;
  disputed: number;
}

interface Asset {
  id: string;
  goldId: string;
  serialNumber: string;
  metalType: string;
  karat: number;
  weight: number;
  status: string;
  location?: string;
}

interface Vault {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  status: string;
}

interface Warehouse {
  id: string;
  name: string;
  location: string;
  totalAssets: number;
  capacity: number;
}

interface AssayOrder {
  id: string;
  assetGoldId: string;
  status: string;
  requestedAt: string;
  completedAt?: string;
}

interface InstrumentLog {
  id: string;
  instrument: string;
  reading: string;
  assetGoldId: string;
  timestamp: string;
  status: string;
}

interface LabPerformance {
  totalTests: number;
  passed: number;
  failed: number;
  averageTime: string;
  accuracy: number;
}

interface DigitalPassport {
  id: string;
  assetGoldId: string;
  chipId: string;
  status: string;
  createdAt: string;
}

interface NfcStatus {
  chipId: string;
  status: string;
  lockedAt?: string;
  lastScan?: string;
}

interface QrStatus {
  assetGoldId: string;
  generated: boolean;
  lastGenerated?: string;
}

interface MarketplaceListing {
  id: string;
  assetGoldId: string;
  title: string;
  price: number;
  currency: string;
  status: string;
  sellerName: string;
  listedAt: string;
}

interface MarketplaceStats {
  activeListings: number;
  soldListings: number;
  pendingListings: number;
  totalVolume: number;
}

interface CustodyTrack {
  id: string;
  assetGoldId: string;
  fromEntity: string;
  toEntity: string;
  status: string;
  initiatedAt: string;
}

interface Shipment {
  id: string;
  assetGoldId: string;
  origin: string;
  destination: string;
  status: string;
  geofenceAlert: boolean;
  estimatedArrival: string;
}

interface FraudAlert {
  id: string;
  assetGoldId: string;
  riskLevel: string;
  anomalyType: string;
  description: string;
  aiConfidence: number;
  status: string;
  createdAt: string;
}

interface KycItem {
  id: string;
  userName: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
}

interface AmlScreening {
  id: string;
  userName: string;
  riskScore: number;
  flags: string[];
  status: string;
  screenedAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  severity: string;
  timestamp: string;
  userId: string;
}

interface ComplianceStats {
  totalKyc: number;
  pendingKyc: number;
  approvedKyc: number;
  rejectedKyc: number;
  totalAml: number;
  flaggedAml: number;
}

interface ApiKey {
  id: string;
  name: string;
  maskedKey: string;
  createdAt: string;
  lastUsed?: string;
  status: string;
}

interface BlockchainEvidence {
  id: string;
  assetGoldId: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  status: string;
}

interface SystemHealth {
  api: string;
  database: string;
  blockchain: string;
  cache: string;
  queue: string;
  uptime: number;
}

interface Integration {
  name: string;
  type: string;
  status: string;
  lastSync?: string;
  endpoint: string;
}

type RoleCode = 'SUPER_ADMIN' | 'ADMIN' | 'CUSTODY_MANAGER' | 'LAB_DIRECTOR' | 'AUDITOR' | 'LAB_TECHNICIAN' | 'CUSTODIAN' | 'MARKETPLACE_SELLER' | 'VIEWER';

interface ErpCommandCenterProps {
  language?: string;
  currency?: string;
  userRole?: RoleCode;
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const theme = {
  bg: "#0a0a0f",
  card: "#12121a",
  hover: "#1a1a2e",
  gold: "#d4af37",
  goldDim: "rgba(212,175,55,0.15)",
  goldBorder: "rgba(212,175,55,0.3)",
  textPrimary: "#ffffff",
  textSecondary: "#a0a0b0",
  border: "#2a2a3a",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
};

const s = {
  root: {
    minHeight: "100vh",
    backgroundColor: theme.bg,
    color: theme.textPrimary,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    direction: "rtl" as const,
    padding: "24px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: `1px solid ${theme.border}`,
  },
  headerTitle: {
    fontSize: "28px",
    fontWeight: 700,
    color: theme.gold,
    margin: 0,
  },
  headerSubtitle: {
    fontSize: "14px",
    color: theme.textSecondary,
    marginTop: "4px",
  },
  tabRow: {
    display: "flex",
    gap: "4px",
    overflowX: "auto" as const,
    paddingBottom: "8px",
    marginBottom: "24px",
    borderBottom: `1px solid ${theme.border}`,
    flexWrap: "nowrap" as const,
  },
  tab: (active: boolean) => ({
    padding: "10px 18px",
    borderRadius: "8px",
    border: `1px solid ${active ? theme.gold : theme.border}`,
    backgroundColor: active ? theme.goldDim : "transparent",
    color: active ? theme.gold : theme.textSecondary,
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: active ? 600 : 400,
    whiteSpace: "nowrap" as const,
    transition: "all 0.2s",
    outline: "none",
  }),
  grid: (cols: number) => ({
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: "16px",
    marginBottom: "24px",
  }),
  card: {
    backgroundColor: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: "12px",
    padding: "20px",
    transition: "border-color 0.2s",
  },
  cardHover: {
    backgroundColor: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: "12px",
    padding: "20px",
    cursor: "pointer",
    transition: "border-color 0.2s",
  },
  cardLabel: {
    fontSize: "13px",
    color: theme.textSecondary,
    marginBottom: "8px",
  },
  cardValue: {
    fontSize: "28px",
    fontWeight: 700,
    color: theme.textPrimary,
  },
  cardValueGold: {
    fontSize: "28px",
    fontWeight: 700,
    color: theme.gold,
  },
  cardDelta: (positive: boolean) => ({
    fontSize: "12px",
    color: positive ? theme.success : theme.danger,
    marginTop: "4px",
  }),
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: theme.gold,
    marginBottom: "16px",
    paddingBottom: "8px",
    borderBottom: `1px solid ${theme.border}`,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "13px",
  },
  th: {
    textAlign: "right" as const,
    padding: "12px 16px",
    borderBottom: `2px solid ${theme.border}`,
    color: theme.textSecondary,
    fontWeight: 600,
    fontSize: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  td: {
    padding: "12px 16px",
    borderBottom: `1px solid ${theme.border}`,
    color: theme.textPrimary,
  },
  tr: {
    transition: "background-color 0.15s",
  },
  badge: (color: string) => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: 600,
    backgroundColor: `${color}22`,
    color: color,
    border: `1px solid ${color}44`,
  }),
  progressBar: (pct: number, color: string) => ({
    width: "100%",
    height: "8px",
    backgroundColor: theme.border,
    borderRadius: "4px",
    overflow: "hidden" as const,
  }),
  progressFill: (pct: number, color: string) => ({
    width: `${Math.min(pct, 100)}%`,
    height: "100%",
    backgroundColor: color,
    borderRadius: "4px",
    transition: "width 0.5s ease",
  }),
  spinner: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "60px",
  },
  spinnerDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: theme.gold,
    animation: "pulse 1.4s infinite ease-in-out both",
  },
  error: {
    backgroundColor: `${theme.danger}22`,
    border: `1px solid ${theme.danger}44`,
    borderRadius: "8px",
    padding: "16px",
    color: theme.danger,
    fontSize: "13px",
  },
  empty: {
    textAlign: "center" as const,
    padding: "40px",
    color: theme.textSecondary,
    fontSize: "14px",
  },
  flexRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  metricRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: `1px solid ${theme.border}`,
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
// ─── Helper: رقم آمن مع toFixed ──────────────────────────────────────────
function safeNum(val: any, decimals: number = 2): string {
  const n = Number(val);
  if (isNaN(n)) return '-';
  return n.toFixed(decimals);
}

function riskColor(level?: string | null): string {
  switch ((level || '').toLowerCase()) {
    case "critical":
      return theme.danger;
    case "high":
      return theme.warning;
    case "medium":
      return "#f97316";
    case "low":
      return theme.info;
    default:
      return theme.textSecondary;
  }
}

function statusColor(status?: string | null): string {
  switch ((status || '').toLowerCase()) {
    case "active":
    case "approved":
    case "passed":
    case "released":
    case "locked":
    case "completed":
      return theme.success;
    case "pending":
    case "in_transit":
    case "in transit":
    case "processing":
      return theme.warning;
    case "rejected":
    case "failed":
    case "critical":
    case "disputed":
    case "tampered":
      return theme.danger;
    case "sold":
      return theme.info;
    default:
      return theme.textSecondary;
  }
}

function fmt(n: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtNum(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function useFetch<T>(url: string): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiFetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) {
          // استخراج البيانات من الاستجابة — يدعم كلتا الصيغتين
          const payload = json.data ?? json;
          // إذا كان المطلوب مصفوفة والم البيانات كائن يحتوي مصفوفة، نأخذ أول مصفوفة
          if (Array.isArray(payload)) {
            setData(payload as T);
          } else if (typeof payload === 'object' && payload !== null) {
            // البحث عن أول مصفوفة في الحقول
            const arrayKey = Object.keys(payload).find(k => Array.isArray(payload[k]));
            if (arrayKey) {
              setData(payload[arrayKey] as T);
            } else {
              setData(payload as T);
            }
          } else {
            setData(payload as T);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Network error");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}

// ─── Spinner ────────────────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div style={s.spinner}>
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <div style={{ ...s.spinnerDot, animationDelay: "-0.32s" }} />
        <div style={{ ...s.spinnerDot, animationDelay: "-0.16s" }} />
        <div style={s.spinnerDot} />
      </div>
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return <div style={s.error}>{message}</div>;
}

// ─── Section 0: HR & Labor Management ───────────────────────────────────────
function renderHRSection(currency: string) {
  const employees = useFetch<Employee[]>("/api/v1/hr/employees");
  const attendance = useFetch<Attendance[]>("/api/v1/hr/attendance");
  const pendingApprovals = useFetch<{ count: number }[]>("/api/v1/hr/pending-approvals");
  const staffPerf = useFetch<StaffPerformance[]>("/api/v1/hr/staff-performance");

  if (employees.loading || attendance.loading) return <LoadingSpinner />;
  if (employees.error) return <ErrorBox message={employees.error} />;

  const empList = employees.data || [];
  const attList = attendance.data || [];
  const approvals = pendingApprovals.data || [];
  const perf = staffPerf.data || [];

  const totalEmp = empList.length;
  const activeEmp = empList.filter((e) => e.status === "active").length;
  const adminEmp = empList.filter((e) => getRoleCode(e.role).toLowerCase().includes("admin")).length;
  const techEmp = empList.filter((e) => getRoleCode(e.role).toLowerCase().includes("tech")).length;
  const totalApprovals = approvals.reduce((sum, a) => sum + (a.count || 0), 0);

  return (
    <div>
      <h3 style={s.sectionTitle}>الموارد البشرية وإدارة العمالة</h3>

      <div style={s.grid(4)}>
        {[
          { label: "إجمالي الموظفين", value: fmtNum(totalEmp), color: theme.gold },
          { label: "الموظفون النشطون", value: fmtNum(activeEmp), color: theme.success },
          { label: "المسؤولون", value: fmtNum(adminEmp), color: theme.info },
          { label: "الفنيون", value: fmtNum(techEmp), color: theme.warning },
        ].map((c, i) => (
          <div key={i} style={s.card}>
            <div style={s.cardLabel}>{c.label}</div>
            <div style={{ ...s.cardValue, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div style={s.card}>
          <div style={s.sectionTitle}>طلبات الاعتماد المعلقة</div>
          <div style={{ fontSize: "48px", fontWeight: 700, color: theme.warning, textAlign: "center", padding: "20px" }}>
            {fmtNum(totalApprovals)}
          </div>
          <div style={{ textAlign: "center", color: theme.textSecondary, fontSize: "13px" }}>
            طلبات تنتظر المراجعة والاعتماد
          </div>
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>ملخص أداء الموظفين</div>
          {perf.length === 0 ? (
            <div style={s.empty}>لا توجد بيانات أداء</div>
          ) : (
            perf.slice(0, 5).map((p, i) => (
              <div key={i} style={s.metricRow}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>{p.employeeName}</div>
                  <div style={{ fontSize: "11px", color: theme.textSecondary }}>{getRoleName(p.role)}</div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: (p.rating || 0) >= 4 ? theme.success : (p.rating || 0) >= 3 ? theme.warning : theme.danger }}>
                    {safeNum(p.rating, 1)} ★
                  </div>
                  <div style={{ fontSize: "11px", color: theme.textSecondary }}>{safeNum(p.tasksCompleted, 0)} مهمة</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>جدول الموظفين</div>
        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>الاسم</th>
                <th style={s.th}>البريد الإلكتروني</th>
                <th style={s.th}>الدور</th>
                <th style={s.th}>الحالة</th>
                <th style={s.th}>آخر دخول</th>
              </tr>
            </thead>
            <tbody>
              {empList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...s.td, ...s.empty }}>لا يوجد موظفون</td>
                </tr>
              ) : (
                empList.map((emp) => (
                  <tr key={emp.id} style={s.tr}>
                    <td style={s.td}>{emp.name}</td>
                    <td style={s.td}>{emp.email}</td>
                    <td style={s.td}>{getRoleName(emp.role)}</td>
                    <td style={s.td}>
                      <span style={s.badge(statusColor(emp.status))}>{emp.status}</span>
                    </td>
                    <td style={s.td}>{emp.lastLogin ? new Date(emp.lastLogin).toLocaleString("ar-SA") : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...s.card, marginTop: "24px" }}>
        <div style={s.sectionTitle}>سجل الحضور</div>
        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>الموظف</th>
                <th style={s.th}>التاريخ</th>
                <th style={s.th}>وقت الدخول</th>
                <th style={s.th}>وقت الخروج</th>
                <th style={s.th}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {attList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...s.td, ...s.empty }}>لا توجد سجلات حضور</td>
                </tr>
              ) : (
                attList.map((a) => (
                  <tr key={a.id} style={s.tr}>
                    <td style={s.td}>{a.employeeName}</td>
                    <td style={s.td}>{a.date}</td>
                    <td style={s.td}>{a.checkIn || "-"}</td>
                    <td style={s.td}>{a.checkOut || "-"}</td>
                    <td style={s.td}>
                      <span style={s.badge(statusColor(a.status))}>{a.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Section 1: Financial Management ────────────────────────────────────────
function renderFinancialSection(currency: string) {
  const treasury = useFetch<Treasury>("/api/v1/financial/treasury");
  const pricing = useFetch<{ metals: MetalPrice[]; exchangeRates: ExchangeRate[] }>("/api/v1/financial/pricing-engine");
  const escrow = useFetch<EscrowStatus>("/api/v1/financial/escrow");
  const summary = useFetch<InvoiceSummary>("/api/v1/financial/summary");

  if (treasury.loading) return <LoadingSpinner />;
  if (treasury.error) return <ErrorBox message={treasury.error} />;

  const t = treasury.data;
  const pricingData = pricing.data;
  const e = escrow.data;
  const inv = summary.data;

  return (
    <div>
      <h3 style={s.sectionTitle}>الإدارة المالية</h3>

      <div style={s.grid(3)}>
        <div style={s.card}>
          <div style={s.cardLabel}>إجمالي قيمة الذهب في الخزينة</div>
          <div style={s.cardValueGold}>{fmt(t?.totalGoldValue || 0, currency)}</div>
        </div>
        <div style={s.card}>
          <div style={s.cardLabel}>رصيد الضمان (Escrow)</div>
          <div style={s.cardValueGold}>{fmt(t?.escrowBalance || 0, currency)}</div>
        </div>
        <div style={s.card}>
          <div style={s.cardLabel}>التدفق النقدي</div>
          <div style={{ ...s.cardValue, color: (t?.cashFlow || 0) >= 0 ? theme.success : theme.danger }}>
            {fmt(t?.cashFlow || 0, currency)}
          </div>
        </div>
      </div>

      <div style={s.grid(2)}>
        <div style={s.card}>
          <div style={s.sectionTitle}>محرك الأسعار</div>
          {pricingData?.metals && pricingData.metals.length > 0 ? (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>المعدن</th>
                  <th style={s.th}>السعر/أونصة</th>
                  <th style={s.th}>التغيير 24 ساعة</th>
                </tr>
              </thead>
              <tbody>
                {pricingData.metals.map((m, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={s.td}>{m.metal}</td>
                    <td style={s.td}>{fmt(m.pricePerOz, m.currency)}</td>
                    <td style={s.td}>
                      <span style={{ color: (m.change24h || 0) >= 0 ? theme.success : theme.danger }}>
                        {m.change24h >= 0 ? "+" : ""}{safeNum(m.change24h, 2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={s.empty}>جاري تحميل البيانات...</div>
          )}

          {pricingData?.exchangeRates && pricingData.exchangeRates.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <div style={{ ...s.sectionTitle, fontSize: "15px" }}>أسعار الصرف</div>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>من</th>
                    <th style={s.th}>إلى</th>
                    <th style={s.th}>السعر</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingData.exchangeRates.map((r, i) => (
                    <tr key={i} style={s.tr}>
                      <td style={s.td}>{r.from}</td>
                      <td style={s.td}>{r.to}</td>
                      <td style={s.td}>{safeNum(r.rate, 4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>ملخص الفواتير</div>
          {inv ? (
            <div>
              <div style={s.metricRow}>
                <span style={{ color: theme.textSecondary }}>إجمالي الفواتير</span>
                <span style={{ fontWeight: 600 }}>{fmt(inv.totalInvoiced, currency)}</span>
              </div>
              <div style={s.metricRow}>
                <span style={{ color: theme.textSecondary }}>المدفوع</span>
                <span style={{ fontWeight: 600, color: theme.success }}>{fmt(inv.totalPaid, currency)}</span>
              </div>
              <div style={s.metricRow}>
                <span style={{ color: theme.textSecondary }}>المعلق</span>
                <span style={{ fontWeight: 600, color: theme.warning }}>{fmt(inv.totalPending, currency)}</span>
              </div>
              <div style={s.metricRow}>
                <span style={{ color: theme.textSecondary }}>المتأخر</span>
                <span style={{ fontWeight: 600, color: theme.danger }}>{inv.overdueCount}</span>
              </div>
            </div>
          ) : (
            <div style={s.empty}>جاري التحميل...</div>
          )}

          <div style={{ marginTop: "24px" }}>
            <div style={{ ...s.sectionTitle, fontSize: "15px" }}>حالة الضمان (Escrow)</div>
            {e ? (
              <div>
                <div style={s.metricRow}>
                  <span style={{ color: theme.textSecondary }}>إجمالي الضمان</span>
                  <span style={{ fontWeight: 600 }}>{fmt(e.totalInEscrow, currency)}</span>
                </div>
                <div style={s.metricRow}>
                  <span style={{ color: theme.textSecondary }}>المُفرج عنه</span>
                  <span style={{ fontWeight: 600, color: theme.success }}>{fmt(e.released, currency)}</span>
                </div>
                <div style={s.metricRow}>
                  <span style={{ color: theme.textSecondary }}>المعلق</span>
                  <span style={{ fontWeight: 600, color: theme.warning }}>{fmt(e.pending, currency)}</span>
                </div>
                <div style={s.metricRow}>
                  <span style={{ color: theme.textSecondary }}>متنازع عليه</span>
                  <span style={{ fontWeight: 600, color: theme.danger }}>{fmt(e.disputed, currency)}</span>
                </div>
              </div>
            ) : (
              <div style={s.empty}>جاري التحميل...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 2: Assets & Inventory ─────────────────────────────────────────
function renderAssetsSection(currency: string) {
  const assets = useFetch<Asset[]>("/api/v1/assets");
  const vaults = useFetch<Vault[]>("/api/v1/vaults");
  const warehouses = useFetch<Warehouse[]>("/api/v1/vaults/warehouses");

  if (assets.loading) return <LoadingSpinner />;
  if (assets.error) return <ErrorBox message={assets.error} />;

  const list = assets.data || [];
  const vList = vaults.data || [];
  const wList = warehouses.data || [];

  const totalAssets = list.length;
  const activeAssets = list.filter((a) => a.status === "active").length;
  const inTransitAssets = list.filter((a) => a.status === "in_transit" || a.status === "in transit").length;
  const soldAssets = list.filter((a) => a.status === "sold").length;

  return (
    <div>
      <h3 style={s.sectionTitle}>الأصول والمخزون</h3>

      <div style={s.grid(4)}>
        {[
          { label: "إجمالي الأصول", value: fmtNum(totalAssets), color: theme.gold },
          { label: "نشطة", value: fmtNum(activeAssets), color: theme.success },
          { label: "في النقل", value: fmtNum(inTransitAssets), color: theme.warning },
          { label: "مباعة", value: fmtNum(soldAssets), color: theme.info },
        ].map((c, i) => (
          <div key={i} style={s.card}>
            <div style={s.cardLabel}>{c.label}</div>
            <div style={{ ...s.cardValue, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>جدول الأصول</div>
        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Gold ID</th>
                <th style={s.th}>الرقم التسلسلي</th>
                <th style={s.th}>نوع المعدن</th>
                <th style={s.th}>القيراط</th>
                <th style={s.th}>الوزن (غ)</th>
                <th style={s.th}>الحالة</th>
                <th style={s.th}>الموقع</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ ...s.td, ...s.empty }}>لا توجد أصول</td>
                </tr>
              ) : (
                list.map((a) => (
                  <tr key={a.id} style={s.tr}>
                    <td style={{ ...s.td, fontFamily: "monospace", fontSize: "12px" }}>{a.goldId}</td>
                    <td style={s.td}>{a.serialNumber}</td>
                    <td style={s.td}>{a.metalType}</td>
                    <td style={s.td}>{a.karat}K</td>
                    <td style={s.td}>{safeNum(a.weight, 2)}</td>
                    <td style={s.td}>
                      <span style={s.badge(statusColor(a.status))}>{a.status}</span>
                    </td>
                    <td style={s.td}>{a.location || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
        <div style={s.card}>
          <div style={s.sectionTitle}>إشغال الخزائن</div>
          {vList.length === 0 ? (
            <div style={s.empty}>لا توجد خزائن</div>
          ) : (
            vList.map((v, i) => {
              const pct = (v.capacity || 0) > 0 ? ((v.occupied || 0) / (v.capacity || 0)) * 100 : 0;
              const barColor = pct > 90 ? theme.danger : pct > 70 ? theme.warning : theme.success;
              return (
                <div key={i} style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>{v.name}</span>
                    <span style={{ fontSize: "12px", color: theme.textSecondary }}>
                      {v.occupied ?? 0}/{v.capacity ?? 0} ({safeNum(pct, 0)}%)
                    </span>
                  </div>
                  <div style={s.progressBar(pct, barColor)}>
                    <div style={s.progressFill(pct, barColor)} />
                  </div>
                  <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "4px" }}>
                    الحالة: <span style={{ color: statusColor(v.status) }}>{v.status}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>المستودعات</div>
          {wList.length === 0 ? (
            <div style={s.empty}>لا توجد مستودعات</div>
          ) : (
            wList.map((w, i) => {
              const pct = w.capacity > 0 ? (w.totalAssets / w.capacity) * 100 : 0;
              const barColor = pct > 90 ? theme.danger : pct > 70 ? theme.warning : theme.success;
              return (
                <div key={i} style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>{w.name}</span>
                    <span style={{ fontSize: "12px", color: theme.textSecondary }}>
                      {w.totalAssets}/{w.capacity}
                    </span>
                  </div>
                  <div style={s.progressBar(pct, barColor)}>
                    <div style={s.progressFill(pct, barColor)} />
                  </div>
                  <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "4px" }}>
                    الموقع: {w.location}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section 3: Assay & Quality Control ─────────────────────────────────────
function renderAssaySection() {
  const orders = useFetch<AssayOrder[]>("/api/v1/assay/orders");
  const instrumentLogs = useFetch<InstrumentLog[]>("/api/v1/assay/instrument-logs");
  const labPerf = useFetch<LabPerformance>("/api/v1/assay/lab-performance");

  if (orders.loading) return <LoadingSpinner />;
  if (orders.error) return <ErrorBox message={orders.error} />;

  const oList = orders.data || [];
  const iList = instrumentLogs.data || [];
  const lab = labPerf.data;

  const completed = oList.filter((o) => o.status === "completed").length;
  const pending = oList.filter((o) => o.status === "pending").length;
  const processing = oList.filter((o) => o.status === "processing").length;

  return (
    <div>
      <h3 style={s.sectionTitle}>المختبرات والجودة</h3>

      <div style={s.grid(4)}>
        {[
          { label: "إجمالي طلبات الفحص", value: fmtNum(oList.length), color: theme.gold },
          { label: "مكتملة", value: fmtNum(completed), color: theme.success },
          { label: "قيد المعالجة", value: fmtNum(processing), color: theme.info },
          { label: "معلقة", value: fmtNum(pending), color: theme.warning },
        ].map((c, i) => (
          <div key={i} style={s.card}>
            <div style={s.cardLabel}>{c.label}</div>
            <div style={{ ...s.cardValue, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div style={s.card}>
          <div style={s.sectionTitle}>قراءات الأجهزة الأخيرة</div>
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>الجهاز</th>
                  <th style={s.th}>القراءة</th>
                  <th style={s.th}>Gold ID</th>
                  <th style={s.th}>الوقت</th>
                  <th style={s.th}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {iList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ ...s.td, ...s.empty }}>لا توجد قراءات</td>
                  </tr>
                ) : (
                  iList.slice(0, 10).map((log) => (
                    <tr key={log.id} style={s.tr}>
                      <td style={s.td}>{log.instrument}</td>
                      <td style={s.td}>{log.reading}</td>
                      <td style={{ ...s.td, fontFamily: "monospace", fontSize: "11px" }}>{log.assetGoldId}</td>
                      <td style={{ ...s.td, fontSize: "11px" }}>{new Date(log.timestamp).toLocaleString("ar-SA")}</td>
                      <td style={s.td}>
                        <span style={s.badge(statusColor(log.status))}>{log.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>مؤشرات أداء المختبر</div>
          {lab ? (
            <div>
              <div style={s.metricRow}>
                <span style={{ color: theme.textSecondary }}>إجمالي الفحوصات</span>
                <span style={{ fontWeight: 600 }}>{fmtNum(lab.totalTests)}</span>
              </div>
              <div style={s.metricRow}>
                <span style={{ color: theme.textSecondary }}>ناجحة</span>
                <span style={{ fontWeight: 600, color: theme.success }}>{fmtNum(lab.passed)}</span>
              </div>
              <div style={s.metricRow}>
                <span style={{ color: theme.textSecondary }}>فاشلة</span>
                <span style={{ fontWeight: 600, color: theme.danger }}>{fmtNum(lab.failed)}</span>
              </div>
              <div style={s.metricRow}>
                <span style={{ color: theme.textSecondary }}>متوسط الوقت</span>
                <span style={{ fontWeight: 600 }}>{lab.averageTime}</span>
              </div>
              <div style={s.metricRow}>
                <span style={{ color: theme.textSecondary }}>الدقة</span>
                <span style={{ fontWeight: 600, color: (lab.accuracy || 0) >= 95 ? theme.success : theme.warning }}>
                  {safeNum(lab.accuracy, 1)}%
                </span>
              </div>
            </div>
          ) : (
            <div style={s.empty}>جاري التحميل...</div>
          )}

          <div style={{ marginTop: "20px" }}>
            <div style={{ ...s.sectionTitle, fontSize: "15px" }}>شهادات الجودة</div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {["ISO 9001", "ISO 17025", "LBMA", "COMEX"].map((cert, i) => (
                <div key={i} style={s.badge(theme.success)}>
                  {cert}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>طلبات الفحص الأخيرة</div>
        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>رقم الطلب</th>
                <th style={s.th}>Gold ID</th>
                <th style={s.th}>الحالة</th>
                <th style={s.th}>تاريخ الطلب</th>
                <th style={s.th}>تاريخ الإكمال</th>
              </tr>
            </thead>
            <tbody>
              {oList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...s.td, ...s.empty }}>لا توجد طلبات</td>
                </tr>
              ) : (
                oList.map((o) => (
                  <tr key={o.id} style={s.tr}>
                    <td style={s.td}>{o.id.slice(0, 8)}</td>
                    <td style={{ ...s.td, fontFamily: "monospace", fontSize: "12px" }}>{o.assetGoldId}</td>
                    <td style={s.td}>
                      <span style={s.badge(statusColor(o.status))}>{o.status}</span>
                    </td>
                    <td style={{ ...s.td, fontSize: "11px" }}>{new Date(o.requestedAt).toLocaleString("ar-SA")}</td>
                    <td style={{ ...s.td, fontSize: "11px" }}>{o.completedAt ? new Date(o.completedAt).toLocaleString("ar-SA") : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Section 4: Digital Identity & NFC ─────────────────────────────────────
function renderDigitalIdentitySection() {
  const passports = useFetch<DigitalPassport[]>("/api/v1/digital-identity/passports");
  const nfcStatus = useFetch<NfcStatus[]>("/api/v1/digital-identity/nfc-status");
  const qrStatus = useFetch<QrStatus[]>("/api/v1/digital-identity/qr-status");

  if (passports.loading) return <LoadingSpinner />;
  if (passports.error) return <ErrorBox message={passports.error} />;

  const pList = passports.data || [];
  const nList = nfcStatus.data || [];
  const qList = qrStatus.data || [];

  const activePassports = pList.filter((p) => p.status === "active").length;
  const lockedChips = nList.filter((n) => n.status === "locked").length;
  const unlockedChips = nList.filter((n) => n.status === "unlocked").length;
  const qrGenerated = qList.filter((q) => q.generated).length;
  const tamperedChips = nList.filter((n) => n.status === "tampered" || n.status === "tampered").length;

  return (
    <div>
      <h3 style={s.sectionTitle}>الهوية الرقمية وNFC</h3>

      <div style={s.grid(4)}>
        {[
          { label: "الجوازات الرقمية", value: fmtNum(pList.length), color: theme.gold },
          { label: "نشطة", value: fmtNum(activePassports), color: theme.success },
          { label: "الشرائح المقفلة", value: fmtNum(lockedChips), color: theme.info },
          { label: "تنبيه العبث", value: fmtNum(tamperedChips), color: theme.danger },
        ].map((c, i) => (
          <div key={i} style={s.card}>
            <div style={s.cardLabel}>{c.label}</div>
            <div style={{ ...s.cardValue, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div style={s.card}>
          <div style={s.sectionTitle}>حالة شرائح NFC</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
            {nList.length === 0 ? (
              <div style={{ ...s.empty, gridColumn: "1 / -1" }}>لا توجد شرائح</div>
            ) : (
              nList.map((n, i) => {
                const chipColor = n.status === "locked" ? theme.success : n.status === "tampered" ? theme.danger : theme.warning;
                return (
                  <div
                    key={i}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      borderRadius: "8px",
                      backgroundColor: `${chipColor}22`,
                      border: `2px solid ${chipColor}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      color: chipColor,
                      gap: "4px",
                    }}
                  >
                    <div style={{ fontSize: "18px" }}>🔒</div>
                    <div style={{ fontWeight: 600 }}>{n.chipId.slice(0, 8)}</div>
                    <div>{n.status}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>حالة أكواد QR</div>
          {qList.length === 0 ? (
            <div style={s.empty}>لا توجد أكواد</div>
          ) : (
            <div>
              <div style={s.metricRow}>
                <span style={{ color: theme.textSecondary }}>إجمالي الأكواد</span>
                <span style={{ fontWeight: 600 }}>{fmtNum(qList.length)}</span>
              </div>
              <div style={s.metricRow}>
                <span style={{ color: theme.textSecondary }}>تم إنشاؤها</span>
                <span style={{ fontWeight: 600, color: theme.success }}>{fmtNum(qrGenerated)}</span>
              </div>
              <div style={s.metricRow}>
                <span style={{ color: theme.textSecondary }}>لم يتم إنشاؤها</span>
                <span style={{ fontWeight: 600, color: theme.warning }}>{fmtNum(qList.length - qrGenerated)}</span>
              </div>

              <div style={{ marginTop: "16px" }}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Gold ID</th>
                      <th style={s.th}>الحالة</th>
                      <th style={s.th}>آخر إنشاء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qList.slice(0, 8).map((q, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={{ ...s.td, fontFamily: "monospace", fontSize: "11px" }}>{q.assetGoldId}</td>
                        <td style={s.td}>
                          <span style={s.badge(q.generated ? theme.success : theme.warning)}>
                            {q.generated ? "تم الإنشاء" : "لم يتم"}
                          </span>
                        </td>
                        <td style={{ ...s.td, fontSize: "11px" }}>
                          {q.lastGenerated ? new Date(q.lastGenerated).toLocaleString("ar-SA") : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>الجوازات الرقمية</div>
        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>رقم الجواز</th>
                <th style={s.th}>Gold ID</th>
                <th style={s.th}>رقم الشريحة</th>
                <th style={s.th}>الحالة</th>
                <th style={s.th}>تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              {pList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...s.td, ...s.empty }}>لا توجد جوازات</td>
                </tr>
              ) : (
                pList.map((p) => (
                  <tr key={p.id} style={s.tr}>
                    <td style={s.td}>{p.id.slice(0, 12)}</td>
                    <td style={{ ...s.td, fontFamily: "monospace", fontSize: "12px" }}>{p.assetGoldId}</td>
                    <td style={s.td}>{p.chipId}</td>
                    <td style={s.td}>
                      <span style={s.badge(statusColor(p.status))}>{p.status}</span>
                    </td>
                    <td style={{ ...s.td, fontSize: "11px" }}>{new Date(p.createdAt).toLocaleString("ar-SA")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Section 5: Marketplace & B2B Trade ────────────────────────────────────
function renderMarketplaceSection(currency: string) {
  const listings = useFetch<MarketplaceListing[]>("/api/v1/marketplace");
  const stats = useFetch<MarketplaceStats>("/api/v1/marketplace/stats");

  if (listings.loading) return <LoadingSpinner />;
  if (listings.error) return <ErrorBox message={listings.error} />;

  const lList = listings.data || [];
  const st = stats.data;

  return (
    <div>
      <h3 style={s.sectionTitle}>السوق والتجارة B2B</h3>

      <div style={s.grid(4)}>
        {[
          { label: "القوائم النشطة", value: fmtNum(st?.activeListings || 0), color: theme.success },
          { label: "مباعة", value: fmtNum(st?.soldListings || 0), color: theme.info },
          { label: "معلقة", value: fmtNum(st?.pendingListings || 0), color: theme.warning },
          { label: "إجمالي الحجم", value: fmt(st?.totalVolume || 0, currency), color: theme.gold },
        ].map((c, i) => (
          <div key={i} style={s.card}>
            <div style={s.cardLabel}>{c.label}</div>
            <div style={{ ...s.cardValue, color: c.color, fontSize: "20px" }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>القويس الأخيرة</div>
        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>العنوان</th>
                <th style={s.th}>Gold ID</th>
                <th style={s.th}>السعر</th>
                <th style={s.th}>البائع</th>
                <th style={s.th}>الحالة</th>
                <th style={s.th}>تاريخ القائمة</th>
              </tr>
            </thead>
            <tbody>
              {lList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...s.td, ...s.empty }}>لا توجد قوائم</td>
                </tr>
              ) : (
                lList.map((l) => (
                  <tr key={l.id} style={s.tr}>
                    <td style={s.td}>{l.title}</td>
                    <td style={{ ...s.td, fontFamily: "monospace", fontSize: "12px" }}>{l.assetGoldId}</td>
                    <td style={{ ...s.td, fontWeight: 600, color: theme.gold }}>{fmt(l.price, l.currency)}</td>
                    <td style={s.td}>{l.sellerName}</td>
                    <td style={s.td}>
                      <span style={s.badge(statusColor(l.status))}>{l.status}</span>
                    </td>
                    <td style={{ ...s.td, fontSize: "11px" }}>{new Date(l.listedAt).toLocaleString("ar-SA")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...s.card, marginTop: "24px" }}>
        <div style={s.sectionTitle}>تحقق البائعين</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {[
            { label: "بائعون معتمدون", value: 42, color: theme.success },
            { label: "بائعون في الانتظار", value: 8, color: theme.warning },
            { label: "بائعون مرفوضون", value: 3, color: theme.danger },
          ].map((v, i) => (
            <div key={i} style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: "32px", fontWeight: 700, color: v.color }}>{v.value}</div>
              <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "4px" }}>{v.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section 6: Custody & Logistics ─────────────────────────────────────────
function renderCustodySection() {
  const custody = useFetch<CustodyTrack[]>("/api/v1/custody/pending-approvals");
  const assets = useFetch<Asset[]>("/api/v1/assets");

  if (custody.loading) return <LoadingSpinner />;
  if (custody.error) return <ErrorBox message={custody.error} />;

  const cList = custody.data || [];
  const aList = assets.data || [];

  const pendingTracks = cList.filter((c) => c.status === "pending").length;
  const completedTracks = cList.filter((c) => c.status === "completed").length;

  const shipments: Shipment[] = aList
    .filter((a) => a.status === "in_transit" || a.status === "in transit")
    .map((a) => ({
      id: a.id,
      assetGoldId: a.goldId,
      origin: "الرياض",
      destination: "جدة",
      status: "in_transit",
      geofenceAlert: false,
      estimatedArrival: "2026-09-15",
    }));

  return (
    <div>
      <h3 style={s.sectionTitle}>الحيازة واللوجستيات</h3>

      <div style={s.grid(4)}>
        {[
          { label: "سلاسل الحيازة", value: fmtNum(cList.length), color: theme.gold },
          { label: "معلقة", value: fmtNum(pendingTracks), color: theme.warning },
          { label: "مكتملة", value: fmtNum(completedTracks), color: theme.success },
          { label: "الشحنات النشطة", value: fmtNum(shipments.length), color: theme.info },
        ].map((c, i) => (
          <div key={i} style={s.card}>
            <div style={s.cardLabel}>{c.label}</div>
            <div style={{ ...s.cardValue, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div style={s.card}>
          <div style={s.sectionTitle}>قائمة طلبات النقل المعلقة</div>
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Gold ID</th>
                  <th style={s.th}>من</th>
                  <th style={s.th}>إلى</th>
                  <th style={s.th}>الحالة</th>
                  <th style={s.th}>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {cList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ ...s.td, ...s.empty }}>لا توجد طلبات</td>
                  </tr>
                ) : (
                  cList.map((c) => (
                    <tr key={c.id} style={s.tr}>
                      <td style={{ ...s.td, fontFamily: "monospace", fontSize: "12px" }}>{c.assetGoldId}</td>
                      <td style={s.td}>{c.fromEntity}</td>
                      <td style={s.td}>{c.toEntity}</td>
                      <td style={s.td}>
                        <span style={s.badge(statusColor(c.status))}>{c.status}</span>
                      </td>
                      <td style={{ ...s.td, fontSize: "11px" }}>{new Date(c.initiatedAt).toLocaleString("ar-SA")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>الشحنات النشطة</div>
          {shipments.length === 0 ? (
            <div style={s.empty}>لا توجد شحنات نشطة</div>
          ) : (
            shipments.map((sh, i) => (
              <div key={i} style={{ marginBottom: "16px", padding: "16px", backgroundColor: theme.hover, borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontWeight: 600, fontSize: "13px" }}>الشحنة #{i + 1}</span>
                  <span style={s.badge(sh.geofenceAlert ? theme.danger : theme.success)}>
                    {sh.geofenceAlert ? "تنبيه موقع" : "ضمن الحدود"}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: theme.textSecondary, marginBottom: "4px" }}>
                  Gold ID: <span style={{ fontFamily: "monospace" }}>{sh.assetGoldId}</span>
                </div>
                <div style={{ fontSize: "12px", color: theme.textSecondary }}>
                  {sh.origin} ← {sh.destination}
                </div>
                <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "4px" }}>
                  الوصول المتوقع: {sh.estimatedArrival}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>حالة النقل</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {[
            { label: "قيد التجهيز", count: 3, color: theme.info },
            { label: "في الطريق", count: 5, color: theme.warning },
            { label: "وصل", count: 12, color: theme.success },
            { label: "متأخر", count: 1, color: theme.danger },
          ].map((t, i) => (
            <div key={i} style={{ textAlign: "center", padding: "16px", backgroundColor: theme.hover, borderRadius: "8px" }}>
              <div style={{ fontSize: "28px", fontWeight: 700, color: t.color }}>{t.count}</div>
              <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "4px" }}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section 7: AI Fraud & Risk Management ──────────────────────────────────
function renderFraudSection(canView: boolean) {
  if (!canView) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>🔒</div>
        <p style={{ color: theme.textSecondary }}>This section requires the <code style={{ color: theme.gold }}>report:view</code> permission.</p>
        <p style={{ fontSize: 12, color: theme.textSecondary, marginTop: 8 }}>Contact your platform administrator to request access.</p>
      </div>
    );
  }
  const alerts = useFetch<FraudAlert[]>("/api/v1/erp/fraud-alerts");
  const dashboard = useFetch<Record<string, unknown>>("/api/v1/erp/dashboard");

  if (alerts.loading) return <LoadingSpinner />;
  if (alerts.error) return <ErrorBox message={alerts.error} />;

  const aList = alerts.data || [];
  const dash = dashboard.data as Record<string, unknown> | null;

  const critical = aList.filter((a) => a.riskLevel === "critical").length;
  const high = aList.filter((a) => a.riskLevel === "high").length;
  const medium = aList.filter((a) => a.riskLevel === "medium").length;
  const low = aList.filter((a) => a.riskLevel === "low").length;
  const reviewQueue = aList.filter((a) => a.status === "pending").length;

  return (
    <div>
      <h3 style={s.sectionTitle}>كشف الاحتيال وإدارة المخاطر بالذكاء الاصطناعي</h3>

      <div style={s.grid(5)}>
        {[
          { label: "حرج", value: fmtNum(critical), color: theme.danger },
          { label: "مرتفع", value: fmtNum(high), color: theme.warning },
          { label: "متوسط", value: fmtNum(medium), color: "#f97316" },
          { label: "منخفض", value: fmtNum(low), color: theme.info },
          { label: "قائمة المراجعة", value: fmtNum(reviewQueue), color: theme.gold },
        ].map((c, i) => (
          <div key={i} style={s.card}>
            <div style={s.cardLabel}>{c.label}</div>
            <div style={{ ...s.cardValue, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div style={s.card}>
          <div style={s.sectionTitle}>تنبيهات الاحتيال</div>
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>المستوى</th>
                  <th style={s.th}>النوع</th>
                  <th style={s.th}>Gold ID</th>
                  <th style={s.th}>الوصف</th>
                  <th style={s.th}>ثقة AI</th>
                  <th style={s.th}>الحالة</th>
                  <th style={s.th}>الوقت</th>
                </tr>
              </thead>
              <tbody>
                {aList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ ...s.td, ...s.empty }}>لا توجد تنبيهات</td>
                  </tr>
                ) : (
                  aList.map((a) => (
                    <tr key={a.id} style={s.tr}>
                      <td style={s.td}>
                        <span style={s.badge(riskColor(a.riskLevel))}>{a.riskLevel || '-'}</span>
                      </td>
                      <td style={s.td}>{a.anomalyType}</td>
                      <td style={{ ...s.td, fontFamily: "monospace", fontSize: "11px" }}>{a.assetGoldId}</td>
                      <td style={{ ...s.td, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                        {a.description}
                      </td>
                      <td style={s.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ width: "40px", height: "6px", backgroundColor: theme.border, borderRadius: "3px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${a.aiConfidence}%`,
                                height: "100%",
                                backgroundColor: a.aiConfidence > 80 ? theme.danger : a.aiConfidence > 50 ? theme.warning : theme.success,
                                borderRadius: "3px",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "11px", color: theme.textSecondary }}>{a.aiConfidence}%</span>
                        </div>
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(statusColor(a.status))}>{a.status}</span>
                      </td>
                      <td style={{ ...s.td, fontSize: "11px" }}>{new Date(a.createdAt).toLocaleString("ar-SA")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>نتائج لوحة القيادة</div>
          {dash ? (
            <div>
              {Object.entries(dash).map(([key, value], i) => (
                <div key={i} style={s.metricRow}>
                  <span style={{ fontSize: "13px", color: theme.textSecondary }}>{key}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>
                    {typeof value === "number" ? fmtNum(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={s.empty}>جاري التحميل...</div>
          )}

          <div style={{ marginTop: "24px" }}>
            <div style={{ ...s.sectionTitle, fontSize: "15px" }}>مؤشرات ثقة AI</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "دقة الكشف", value: 94.2, color: theme.success },
                { label: "معدل الإيجابيات الزائفة", value: 3.1, color: theme.warning },
                { label: "زمن الاستجابة", value: 87, color: theme.info },
              ].map((m, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", color: theme.textSecondary }}>{m.label}</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: m.color }}>{m.value}%</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", backgroundColor: theme.border, borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${m.value}%`,
                        height: "100%",
                        backgroundColor: m.color,
                        borderRadius: "3px",
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 8: Legal & Compliance ──────────────────────────────────────────
function renderComplianceSection() {
  const kycQueue = useFetch<KycItem[]>("/api/v1/compliance/kyc-queue");
  const amlScreening = useFetch<AmlScreening[]>("/api/v1/compliance/aml-screening");
  const auditLogs = useFetch<AuditLog[]>("/api/v1/compliance/audit-logs");
  const stats = useFetch<ComplianceStats>("/api/v1/compliance/stats");

  if (kycQueue.loading) return <LoadingSpinner />;
  if (kycQueue.error) return <ErrorBox message={kycQueue.error} />;

  const kycList = kycQueue.data || [];
  const amlList = amlScreening.data || [];
  const logList = auditLogs.data || [];
  const compStats = stats.data;

  return (
    <div>
      <h3 style={s.sectionTitle}>الامتثال القانوني</h3>

      <div style={s.grid(4)}>
        {[
          { label: "Queue KYC (قيد الانتظار)", value: fmtNum(compStats?.pendingKyc || kycList.filter((k) => k.status === "pending").length), color: theme.warning },
          { label: "KYC معتمدة", value: fmtNum(compStats?.approvedKyc || kycList.filter((k) => k.status === "approved").length), color: theme.success },
          { label: "KYC مرفوضة", value: fmtNum(compStats?.rejectedKyc || kycList.filter((k) => k.status === "rejected").length), color: theme.danger },
          { label: "AML مُعلمة", value: fmtNum(compStats?.flaggedAml || amlList.filter((a) => a.status === "flagged").length), color: theme.info },
        ].map((c, i) => (
          <div key={i} style={s.card}>
            <div style={s.cardLabel}>{c.label}</div>
            <div style={{ ...s.cardValue, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div style={s.card}>
          <div style={s.sectionTitle}>قائمة انتظار KYC</div>
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>المستخدم</th>
                  <th style={s.th}>الحالة</th>
                  <th style={s.th}>تاريخ الإرسال</th>
                  <th style={s.th}>تاريخ المراجعة</th>
                </tr>
              </thead>
              <tbody>
                {kycList.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ ...s.td, ...s.empty }}>لا توجد طلبات KYC</td>
                  </tr>
                ) : (
                  kycList.map((k) => (
                    <tr key={k.id} style={s.tr}>
                      <td style={s.td}>{k.userName}</td>
                      <td style={s.td}>
                        <span style={s.badge(statusColor(k.status))}>{k.status}</span>
                      </td>
                      <td style={{ ...s.td, fontSize: "11px" }}>{new Date(k.submittedAt).toLocaleString("ar-SA")}</td>
                      <td style={{ ...s.td, fontSize: "11px" }}>{k.reviewedAt ? new Date(k.reviewedAt).toLocaleString("ar-SA") : "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>نتائج فحص AML</div>
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>المستخدم</th>
                  <th style={s.th}>درجة المخاطرة</th>
                  <th style={s.th}>العلامات</th>
                  <th style={s.th}>الحالة</th>
                  <th style={s.th}>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {amlList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ ...s.td, ...s.empty }}>لا توجد نتائج</td>
                  </tr>
                ) : (
                  amlList.map((a) => (
                    <tr key={a.id} style={s.tr}>
                      <td style={s.td}>{a.userName}</td>
                      <td style={s.td}>
                        <span style={{ fontWeight: 600, color: a.riskScore > 70 ? theme.danger : a.riskScore > 40 ? theme.warning : theme.success }}>
                          {a.riskScore}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {a.flags.map((f, i) => (
                            <span key={i} style={s.badge(theme.warning)}>{f}</span>
                          ))}
                        </div>
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(statusColor(a.status))}>{a.status}</span>
                      </td>
                      <td style={{ ...s.td, fontSize: "11px" }}>{new Date(a.screenedAt).toLocaleString("ar-SA")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>سجل التدقيق</div>
        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>الإجراء</th>
                <th style={s.th}>الكيان</th>
                <th style={s.th}>معرّف الكيان</th>
                <th style={s.th}>الخطورة</th>
                <th style={s.th}>المستخدم</th>
                <th style={s.th}>الوقت</th>
              </tr>
            </thead>
            <tbody>
              {logList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...s.td, ...s.empty }}>لا توجد سجلات</td>
                </tr>
              ) : (
                logList.map((log) => (
                  <tr key={log.id} style={s.tr}>
                    <td style={s.td}>{log.action}</td>
                    <td style={s.td}>{log.entity}</td>
                    <td style={{ ...s.td, fontFamily: "monospace", fontSize: "11px" }}>{log.entityId.slice(0, 12)}</td>
                    <td style={s.td}>
                      <span style={s.badge(riskColor(log.severity))}>{log.severity || '-'}</span>
                    </td>
                    <td style={s.td}>{log.userId}</td>
                    <td style={{ ...s.td, fontSize: "11px" }}>{new Date(log.timestamp).toLocaleString("ar-SA")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Section 9: System & API Governance ─────────────────────────────────────
function renderSystemSection() {
  const apiKeys = useFetch<ApiKey[]>("/api/v1/system/api-keys");
  const blockchain = useFetch<BlockchainEvidence[]>("/api/v1/system/blockchain-evidence");
  const health = useFetch<SystemHealth>("/api/v1/system/health");
  const integrations = useFetch<Integration[]>("/api/v1/system/integrations");

  if (apiKeys.loading) return <LoadingSpinner />;
  if (apiKeys.error) return <ErrorBox message={apiKeys.error} />;

  const keys = apiKeys.data || [];
  const bcList = blockchain.data || [];
  const h = health.data;
  const intList = integrations.data || [];

  const healthItems = h
    ? [
        { label: "API", status: h.api },
        { label: "قاعدة البيانات", status: h.database },
        { label: "البلوك تشين", status: h.blockchain },
        { label: "الكاش", status: h.cache },
        { label: "قائمة الانتظار", status: h.queue },
      ]
    : [];

  return (
    <div>
      <h3 style={s.sectionTitle}>إعدادات النظام وحوكمة API</h3>

      {h && (
        <div style={s.grid(5)}>
          {healthItems.map((item, i) => (
            <div key={i} style={s.card}>
              <div style={s.cardLabel}>{item.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: item.status === "healthy" ? theme.success : item.status === "degraded" ? theme.warning : theme.danger,
                  }}
                />
                <span style={{ fontSize: "14px", fontWeight: 600 }}>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {h && (
        <div style={{ ...s.card, marginBottom: "24px" }}>
          <div style={s.sectionTitle}>وقت تشغيل النظام</div>
          <div style={{ fontSize: "48px", fontWeight: 700, color: theme.gold, textAlign: "center", padding: "16px" }}>
            {Math.floor((h.uptime || 0) / 3600)}h {Math.floor(((h.uptime || 0) % 3600) / 60)}m
          </div>
          <div style={{ textAlign: "center", color: theme.textSecondary, fontSize: "13px" }}>
           آخر تحديث: {new Date().toLocaleString("ar-SA")}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div style={s.card}>
          <div style={s.sectionTitle}>مفاتيح API</div>
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>الاسم</th>
                  <th style={s.th}>المفتاح</th>
                  <th style={s.th}>الحالة</th>
                  <th style={s.th}>آخر استخدام</th>
                </tr>
              </thead>
              <tbody>
                {keys.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ ...s.td, ...s.empty }}>لا توجد مفاتيح</td>
                  </tr>
                ) : (
                  keys.map((k) => (
                    <tr key={k.id} style={s.tr}>
                      <td style={s.td}>{k.name}</td>
                      <td style={{ ...s.td, fontFamily: "monospace", fontSize: "12px" }}>{k.maskedKey}</td>
                      <td style={s.td}>
                        <span style={s.badge(statusColor(k.status))}>{k.status}</span>
                      </td>
                      <td style={{ ...s.td, fontSize: "11px" }}>
                        {k.lastUsed ? new Date(k.lastUsed).toLocaleString("ar-SA") : "لم يُستخدم"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>أدلة البلوك تشين</div>
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Gold ID</th>
                  <th style={s.th}>TX Hash</th>
                  <th style={s.th}>الكتلة</th>
                  <th style={s.th}>الحالة</th>
                  <th style={s.th}>الوقت</th>
                </tr>
              </thead>
              <tbody>
                {bcList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ ...s.td, ...s.empty }}>لا توجد أدلة</td>
                  </tr>
                ) : (
                  bcList.map((bc) => (
                    <tr key={bc.id} style={s.tr}>
                      <td style={{ ...s.td, fontFamily: "monospace", fontSize: "11px" }}>{bc.assetGoldId}</td>
                      <td style={{ ...s.td, fontFamily: "monospace", fontSize: "10px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {bc.txHash}
                      </td>
                      <td style={s.td}>{fmtNum(bc.blockNumber)}</td>
                      <td style={s.td}>
                        <span style={s.badge(statusColor(bc.status))}>{bc.status}</span>
                      </td>
                      <td style={{ ...s.td, fontSize: "11px" }}>{new Date(bc.timestamp).toLocaleString("ar-SA")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>حالة التكاملات</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {intList.length === 0 ? (
            <div style={{ ...s.empty, gridColumn: "1 / -1" }}>لا توجد تكاملات</div>
          ) : (
            intList.map((intg, i) => (
              <div
                key={i}
                style={{
                  padding: "16px",
                  backgroundColor: theme.hover,
                  borderRadius: "8px",
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontWeight: 600, fontSize: "14px" }}>{intg.name}</span>
                  <span style={s.badge(statusColor(intg.status))}>{intg.status}</span>
                </div>
                <div style={{ fontSize: "12px", color: theme.textSecondary, marginBottom: "4px" }}>
                  النوع: {intg.type}
                </div>
                <div style={{ fontSize: "12px", color: theme.textSecondary, marginBottom: "4px", direction: "ltr", textAlign: "right" }}>
                  Endpoint: {intg.endpoint}
                </div>
                <div style={{ fontSize: "11px", color: theme.textSecondary }}>
                  آخر مزامنة: {intg.lastSync ? new Date(intg.lastSync).toLocaleString("ar-SA") : "لم تتم"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Labels ─────────────────────────────────────────────────────────────
const TABS = [
  { label: "الموارد البشرية", icon: "👥" },
  { label: "المالية", icon: "💰" },
  { label: "الأصول والمخزون", icon: "📦" },
  { label: "المختبرات والجودة", icon: "🔬" },
  { label: "الهوية الرقمية", icon: "🔐" },
  { label: "السوق والتجارة", icon: "🏪" },
  { label: "الحيازة واللوجستيات", icon: "🚚" },
  { label: "كشف الاحتيال", icon: "🛡️" },
  { label: "الامتثال القانوني", icon: "⚖️" },
  { label: "إعدادات النظام", icon: "⚙️" },
];

// ─── Role → Tab Visibility ──────────────────────────────────────────────────
const ROLE_TAB_ACCESS: Record<RoleCode, number[]> = {
  SUPER_ADMIN: [0,1,2,3,4,5,6,7,8,9],
  ADMIN:       [0,1,2,3,4,5,6,7,8,9],
  CUSTODY_MANAGER: [2,6,7],
  LAB_DIRECTOR:    [0,3,4],
  AUDITOR:         [0,1,2,3,4,5,6,7,8,9],
  LAB_TECHNICIAN:  [3],
  CUSTODIAN:       [2,6],
  MARKETPLACE_SELLER: [5],
  VIEWER:          [2],
};

function getVisibleTabs(roleCode?: RoleCode): { tab: typeof TABS[number]; originalIndex: number }[] {
  if (!roleCode) return [];
  const allowed = ROLE_TAB_ACCESS[roleCode] || [];
  return TABS.map((tab, i) => ({ tab, originalIndex: i })).filter(({ originalIndex }) => allowed.includes(originalIndex));
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ERPCommandCenter({ language = "ar", currency = "USD", userRole }: ErpCommandCenterProps) {
  const [activeSection, setActiveSection] = useState(0);

  // تصفية التبويبات حسب صلاحيات المستخدم
  const visibleTabs = getVisibleTabs(userRole as RoleCode | undefined);
  const currentTab = visibleTabs[activeSection];
  const currentSectionIndex = currentTab?.originalIndex ?? 0;

  const canViewFraud = !!userRole && ['SUPER_ADMIN', 'ADMIN', 'AUDITOR', 'CUSTODY_MANAGER'].includes(userRole);

  const renderSection = () => {
    switch (currentSectionIndex) {
      case 0:
        return renderHRSection(currency);
      case 1:
        return renderFinancialSection(currency);
      case 2:
        return renderAssetsSection(currency);
      case 3:
        return renderAssaySection();
      case 4:
        return renderDigitalIdentitySection();
      case 5:
        return renderMarketplaceSection(currency);
      case 6:
        return renderCustodySection();
      case 7:
        return renderFraudSection(canViewFraud);
      case 8:
        return renderComplianceSection();
      case 9:
        return renderSystemSection();
      default:
        return null;
    }
  };

  return (
    <div style={s.root}>
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        *::-webkit-scrollbar { width: 6px; height: 6px; }
        *::-webkit-scrollbar-track { background: ${theme.bg}; }
        *::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 3px; }
        *::-webkit-scrollbar-thumb:hover { background: ${theme.gold}44; }
        table tr:hover { background-color: ${theme.hover}; }
      `}</style>

      <header style={s.header}>
        <div>
          <h1 style={s.headerTitle}>جوهر — مركز القيادة المؤسسي</h1>
          <p style={s.headerSubtitle}>مركز أوامر المؤسسة الذهبية — نظام تخطيط موارد المؤسسات المتكامل</p>
          {userRole && (
            <p style={{ fontSize: "11px", color: theme.gold, marginTop: "4px" }}>
              الدور: {userRole} | الأقسام المتاحة: {visibleTabs.length}
            </p>
          )}
        </div>
        <div style={{ textAlign: "left" as const }}>
          <div style={{ fontSize: "12px", color: theme.textSecondary }}>العملة: {currency}</div>
          <div style={{ fontSize: "12px", color: theme.textSecondary }}>اللغة: {language === "ar" ? "العربية" : "English"}</div>
          <div style={{ fontSize: "12px", color: theme.success, marginTop: "4px" }}>● متصل</div>
        </div>
      </header>

      <nav style={s.tabRow}>
        {visibleTabs.map((item, i) => (
          <button
            key={item.originalIndex}
            style={s.tab(activeSection === i)}
            onClick={() => setActiveSection(i)}
            onMouseEnter={(e) => {
              if (activeSection !== i) {
                e.currentTarget.style.borderColor = theme.goldBorder;
                e.currentTarget.style.color = theme.gold;
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== i) {
                e.currentTarget.style.borderColor = theme.border;
                e.currentTarget.style.color = theme.textSecondary;
              }
            }}
          >
            <span style={{ marginLeft: "6px" }}>{item.tab.icon}</span>
            {item.tab.label}
          </button>
        ))}
      </nav>

      <main>{renderSection()}</main>
    </div>
  );
}
