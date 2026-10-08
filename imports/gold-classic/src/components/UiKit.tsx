// ============================================================================
// GOLD PLATFORM — SHARED UI KIT
// ============================================================================
// مجموعة مكونات واجهة موحدة: صفحة، بطاقة، جدول، شارة، تحميل، و useFetch

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';

export type Language = 'AR' | 'FR' | 'EN';
export type Currency = 'DZD' | 'EUR' | 'USD';

// ─── Hook جلب البيانات ─────────────────────────────────────────────────────
// يستخرج أول مصفوفة من الاستجابة المتداخلة تلقائياً
export function useFetch<T>(url: string | null): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiFetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        const payload = json.data ?? json;
        if (Array.isArray(payload)) {
          setData(payload as T);
        } else if (typeof payload === 'object' && payload !== null) {
          const arrayKey = Object.keys(payload).find((k) => Array.isArray(payload[k]));
          if (arrayKey) setData(payload[arrayKey] as T);
          else setData(payload as T);
        } else {
          setData(payload as T);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Network error');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}

export function normalizeNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function fmtMoney(n: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

export function fmtNum(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

export function fmtDate(iso: string | null | undefined, lang: Language): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const locale = lang === 'AR' ? 'ar-DZ' : lang === 'FR' ? 'fr-FR' : 'en-US';
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function fmtDateTime(iso: string | null | undefined, lang: Language): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const locale = lang === 'AR' ? 'ar-DZ' : lang === 'FR' ? 'fr-FR' : 'en-US';
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── غلاف الصفحة ───────────────────────────────────────────────────────────
export const PageShell: React.FC<{
  title: string;
  subtitle?: string;
  icon?: string;
  language: Language;
  children: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ title, subtitle, icon, language, children, actions }) => {
  return (
    <div dir={language === 'AR' ? 'rtl' : 'ltr'} style={{ padding: 'clamp(12px, 3vw, 28px)', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {icon && <span style={{ fontSize: 30 }}>{icon}</span>}
          <div>
            <h1 style={{ color: '#c6a969', fontSize: 24, fontWeight: 800, margin: 0 }}>{title}</h1>
            {subtitle && <p style={{ color: '#8a8a9a', fontSize: 14, margin: '4px 0 0' }}>{subtitle}</p>}
          </div>
        </div>
        {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
      </div>
      {children}
    </div>
  );
};

// ─── بطاقة إحصائية ─────────────────────────────────────────────────────────
export const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: string;
  color?: string;
  sub?: string;
}> = ({ label, value, icon, color = '#c6a969', sub }) => (
  <div style={{
    background: 'rgba(20, 20, 30, 0.9)',
    border: '1px solid rgba(198, 169, 105, 0.12)',
    borderRadius: 12,
    padding: '18px 16px',
    flex: '1 1 170px',
    minWidth: 150,
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', top: -20, right: -20, width: 80, height: 80,
      borderRadius: '50%', background: `${color}18`, filter: 'blur(2px)',
    }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
    </div>
    <div style={{ color: '#c0c0d0', fontSize: 13, fontWeight: 600 }}>{label}</div>
    {sub && <div style={{ color: '#7a7a88', fontSize: 11, marginTop: 4 }}>{sub}</div>}
  </div>
);

// ─── بطاقة حاوية ───────────────────────────────────────────────────────────
export const Card: React.FC<{ title?: string; children: React.ReactNode; style?: React.CSSProperties; onClick?: React.MouseEventHandler<HTMLDivElement> }> = ({ title, children, style, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: 'rgba(20, 20, 30, 0.9)',
      border: '1px solid rgba(198, 169, 105, 0.12)',
      borderRadius: 12,
      padding: 20,
      ...style,
    }}
  >
    {title && <h3 style={{ color: '#c6a969', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>{title}</h3>}
    {children}
  </div>
);

// ─── جدول بيانات ───────────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  color: '#8a8a9a',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  borderBottom: '1px solid rgba(198,169,105,0.15)',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  fontSize: 13,
  color: '#c0c0d0',
  whiteSpace: 'nowrap',
};

export const DataTable: React.FC<{
  columns: string[];
  children: React.ReactNode;
  dir?: string;
}> = ({ columns, children, dir = 'ltr' }) => (
  <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
      <thead>
        <tr>{columns.map((c, i) => <th key={i} style={{ ...thStyle, textAlign: dir === 'rtl' ? 'right' : 'left' }}>{c}</th>)}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export const Td: React.FC<{ children?: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <td style={{ ...tdStyle, ...style }}>{children || '—'}</td>
);

// ─── شارة حالة ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  PASS: '#3cb97e', ACTIVE: '#3cb97e', COMPLETED: '#3cb97e', APPROVED: '#3cb97e', HELD: '#3cb97e', RELEASED: '#3cb97e',
  PENDING: '#f5a623', FIRST_APPROVED: '#f5a623', HOLD: '#f5a623', REQUESTED: '#f5a623', NOTARY_CERTIFIED: '#f5a623',
  FAIL: '#e8564a', REJECTED: '#e8564a', DECOMMISSIONED: '#e8564a', OVERDUE: '#e8564a', CRITICAL: '#dc3545', HIGH: '#e8564a',
  MEDIUM: '#f5a623', MODERATE: '#f5a623', LOW: '#5b8ff9', INFO: '#5b8ff9',
};

export const Badge: React.FC<{ value: string; color?: string }> = ({ value, color }) => {
  const c = color || STATUS_COLORS[value.toUpperCase()] || '#8a8a9a';
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      background: `${c}1a`,
      border: `1px solid ${c}44`,
      color: c,
      fontSize: 11,
      fontWeight: 700,
    }}>
      {value}
    </span>
  );
};

// ─── مؤشر تحميل ────────────────────────────────────────────────────────────
export const Loading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div style={{ padding: '60px 0', textAlign: 'center', color: '#8a8a9a' }}>
    <div style={{ display: 'inline-flex', gap: 8 }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#c6a969', animation: 'gPulse 1s infinite' }} />
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#c6a969', animation: 'gPulse 1s infinite 150ms' }} />
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#c6a969', animation: 'gPulse 1s infinite 300ms' }} />
    </div>
    <p style={{ marginTop: 12, fontSize: 13 }}>{text}</p>
    <style>{`@keyframes gPulse { 0%,80%,100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }`}</style>
  </div>
);

// ─── رسالة خطأ ─────────────────────────────────────────────────────────────
export const ErrorBox: React.FC<{ message: string }> = ({ message }) => (
  <div style={{
    padding: '16px 20px',
    background: 'rgba(220, 53, 69, 0.1)',
    border: '1px solid rgba(220, 53, 69, 0.3)',
    borderRadius: 10,
    color: '#dc3545',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }}>
    <span>⚠️</span>
    <span>{message}</span>
  </div>
);

// ─── فارغ ──────────────────────────────────────────────────────────────────
export const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ padding: '30px 0', textAlign: 'center', color: '#666', fontSize: 13 }}>{text}</div>
);

// ─── زر نمطي ───────────────────────────────────────────────────────────────
export const GoldButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...rest }) => (
  <button
    {...rest}
    style={{
      padding: '9px 18px',
      background: 'linear-gradient(135deg, #c6a969, #a67c00)',
      border: 'none',
      borderRadius: 8,
      color: '#0a0a0f',
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      ...rest.style,
    }}
  >
    {children}
  </button>
);

// ─── حقل إدخال نمطي ────────────────────────────────────────────────────────
export const TextField: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ ...rest }) => (
  <input
    {...rest}
    style={{
      width: '100%',
      padding: '9px 12px',
      background: 'rgba(30, 30, 45, 0.8)',
      border: '1px solid #333',
      borderRadius: 8,
      color: '#fff',
      fontSize: 13,
      outline: 'none',
      boxSizing: 'border-box',
      ...rest.style,
    }}
  />
);

// ─── سجل تدقيق/أحداث بسيط ──────────────────────────────────────────────────
export const EventList: React.FC<{
  events: Array<{ title: string; description?: string; severity?: string; user?: string; time?: string | null }>;
  lang: Language;
}> = ({ events, lang }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    {events.length === 0 ? <Empty text="No recent events" /> : events.map((ev, i) => {
      const c = STATUS_COLORS[(ev.severity || '').toUpperCase()] || '#8a8a9a';
      return (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 12px', background: 'rgba(255,255,255,0.02)',
          borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)',
        }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#e0e0ec', fontSize: 13, fontWeight: 600 }}>{ev.title}</div>
            {ev.description && <div style={{ color: '#8a8a9a', fontSize: 12 }}>{ev.description}</div>}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {ev.user && <div style={{ color: '#7a7a88', fontSize: 11 }}>{ev.user}</div>}
            {ev.time && <div style={{ color: '#5a5a68', fontSize: 11 }}>{ev.time}</div>}
          </div>
        </div>
      );
    })}
  </div>
);