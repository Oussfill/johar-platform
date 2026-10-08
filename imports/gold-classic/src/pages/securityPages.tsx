import React, { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { useAuth } from '../components/AuthContext';
import {
  PageShell, useFetch, StatCard, Card, DataTable, Td, Badge, Loading,
  ErrorBox, Empty, GoldButton, TextField, fmtMoney, fmtNum, fmtDate,
  fmtDateTime, normalizeNumber,
} from '../components/UiKit';
import type { Language, Currency } from '../components/UiKit';

const T: Record<string, Record<Language, string>> = {
  '\u0643\u0634\u0641 \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0644': { AR: '\u0643\u0634\u0641 \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0644', FR: 'D\u00e9tection de Fraude', EN: 'Fraud Detection' },
  '\u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0628\u0634\u0631\u064a\u0629': { AR: '\u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0628\u0634\u0631\u064a\u0629', FR: 'R\u00e9vision Humaine', EN: 'Human Review' },
  'KYC / AML': { AR: 'KYC / AML', FR: 'KYC / AML', EN: 'KYC / AML' },
  '\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062e\u0637\u0648\u0631\u0629': { AR: '\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062e\u0637\u0648\u0631\u0629', FR: 'Niveau de Risque', EN: 'Risk Level' },
  '\u0627\u0644\u0642\u0627\u0639\u062f\u0629': { AR: '\u0627\u0644\u0642\u0627\u0639\u062f\u0629', FR: 'R\u00e8gle', EN: 'Rule' },
  '\u0627\u0644\u0639\u0645\u064a\u0644': { AR: '\u0627\u0644\u0639\u0645\u064a\u0644', FR: 'Client', EN: 'Customer' },
  '\u0646\u0648\u0639 \u0627\u0644\u0648\u062b\u064a\u0642\u0629': { AR: '\u0646\u0648\u0639 \u0627\u0644\u0648\u062b\u064a\u0642\u0629', FR: 'Type de Document', EN: 'Document Type' },
  '\u0627\u0644\u062d\u0627\u0644\u0629': { AR: '\u0627\u0644\u062d\u0627\u0644\u0629', FR: 'Statut', EN: 'Status' },
  '\u0627\u0644\u062a\u0627\u0631\u064a\u062e': { AR: '\u0627\u0644\u062a\u0627\u0631\u064a\u062e', FR: 'Date', EN: 'Date' },
  '\u0645\u062e\u0627\u0644\u0641\u0627\u062a': { AR: '\u0645\u062e\u0627\u0644\u0641\u0627\u062a', FR: 'Anomalies', EN: 'Anomalies' },
  '\u062a\u0648\u0635\u064a\u0627\u062a': { AR: '\u062a\u0648\u0635\u064a\u0627\u062a', FR: 'Recommandations', EN: 'Recommendations' },
  '\u0641\u062d\u0635 \u0627\u062d\u062a\u064a\u0627\u0644': { AR: '\u0641\u062d\u0635 \u0627\u062d\u062a\u064a\u0627\u0644', FR: 'V\u00e9rification de Fraude', EN: 'Fraud Check' },
  '\u0627\u0639\u062a\u0645\u0627\u062f': { AR: '\u0627\u0639\u062a\u0645\u0627\u062f', FR: 'Approuver', EN: 'Approve' },
  '\u0631\u0641\u0636': { AR: '\u0631\u0641\u0636', FR: 'Rejeter', EN: 'Reject' },
  '\u0646\u0642\u0627\u0637': { AR: '\u0646\u0642\u0627\u0637', FR: 'Score', EN: 'Score' },
  '\u0642\u0648\u0627\u0639\u062f \u0645\u0641\u0639\u0644\u0629': { AR: '\u0642\u0648\u0627\u0639\u062f \u0645\u0641\u0639\u0644\u0629', FR: 'R\u00e8gles D\u00e9clench\u00e9es', EN: 'Triggered Rules' },
  '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a': { AR: '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a', FR: 'Total des Alertes', EN: 'Total Alerts' },
  '\u0645\u0639\u0644\u0642': { AR: '\u0645\u0639\u0644\u0642', FR: 'En Attente', EN: 'Pending' },
  '\u0645\u0634\u062a\u0628\u0647 \u0628\u0647': { AR: '\u0645\u0634\u062a\u0628\u0647 \u0628\u0647', FR: 'Suspect', EN: 'Suspect' },
  '\u0627\u0633\u062a\u0644\u0627\u0645': { AR: '\u0627\u0633\u062a\u0644\u0627\u0645', FR: 'Soumis', EN: 'Submitted' },
  '\u0625\u0641\u0635\u0627\u062d \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a': { AR: '\u0625\u0641\u0635\u0627\u062d \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a', FR: 'Avertissement IA', EN: 'AI Disclaimer' },
  '\u0642\u0631\u0627\u0631 \u0646\u0647\u0627\u0626\u064a \u0645\u0633\u0624\u0648\u0644\u064a\u0629 \u0627\u0644\u0645\u0631\u0627\u062c\u0639 \u0627\u0644\u0628\u0634\u0631\u064a': {
    AR: '\u0647\u0630\u0627 \u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0645\u0642\u062f\u0645 \u0628\u0648\u0627\u0633\u0637\u0629 \u0645\u062d\u0631\u0643 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0644\u0644\u0645\u0633\u0627\u0639\u062f\u0629 \u2014 \u0627\u0644\u0642\u0631\u0627\u0631 \u0627\u0644\u0646\u0647\u0627\u0626\u064a \u0628\u0645\u0633\u0624\u0648\u0644\u064a\u0629 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645/\u0627\u0644\u0645\u0631\u0627\u062c\u0639 \u0627\u0644\u0628\u0634\u0631\u064a',
    FR: "Cette analyse est fournie par le moteur d'intelligence artificielle \u00e0 titre d'assistance \u2014 La d\u00e9cision finale rel\u00e8ve de la responsabilit\u00e9 de l'utilisateur/r\u00e9viseur humain",
    EN: 'This analysis is provided by the AI engine for assistance \u2014 Final decision is the responsibility of the human reviewer',
  },
  '\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0648\u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0644': {
    AR: '\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0648\u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0644',
    FR: 'Surveillance des alertes et v\u00e9rification des fraudes',
    EN: 'Monitor alerts and verify fraud',
  },
  '\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0645\u0634\u0628\u0648\u0647\u0629 \u0648\u0627\u0644\u0642\u0631\u0627\u0631 \u0627\u0644\u0646\u0647\u0627\u0626\u064a': {
    AR: '\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0645\u0634\u0628\u0648\u0647\u0629 \u0648\u0627\u0644\u0642\u0631\u0627\u0631 \u0627\u0644\u0646\u0647\u0627\u0626\u064a',
    FR: '\u00c9l\u00e9ments suspects et d\u00e9cision finale',
    EN: 'Review flagged items \u2014 final decision by human',
  },
  '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0647\u0648\u064a\u0629 \u0648\u0645\u0643\u0627\u0641\u062d\u0629 \u063a\u0633\u0644 \u0627\u0644\u0623\u0645\u0648\u0627\u0644': {
    AR: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0647\u0648\u064a\u0629 \u0648\u0645\u0643\u0627\u0641\u062d\u0629 \u063a\u0633\u0644 \u0627\u0644\u0623\u0645\u0648\u0627\u0644',
    FR: 'Gestion KYC et Lutte anti-blanchiment',
    EN: 'KYC & Anti-Money Laundering Management',
  },
  '\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0639\u0627\u0644\u064a\u0629 \u0627\u0644\u062e\u0637\u0648\u0631\u0629': { AR: '\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0639\u0627\u0644\u064a\u0629 \u0627\u0644\u062e\u0637\u0648\u0631\u0629', FR: 'Alertes \u00c9lev\u00e9es/Critiques', EN: 'High/Critical Alerts' },
  '\u0645\u0646\u062e\u0641\u0636\u0629': { AR: '\u0645\u0646\u062e\u0641\u0636\u0629', FR: 'Faible', EN: 'Low' },
  '\u0645\u062a\u0648\u0633\u0637\u0629': { AR: '\u0645\u062a\u0648\u0633\u0637\u0629', FR: 'Moyen', EN: 'Medium' },
  '\u0639\u0627\u0644\u064a\u0629': { AR: '\u0639\u0627\u0644\u064a\u0629', FR: '\u00c9lev\u00e9', EN: 'High' },
  '\u062d\u0631\u062c\u0629': { AR: '\u062d\u0631\u062c\u0629', FR: 'Critique', EN: 'Critical' },
  '\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0623\u0635\u0644': { AR: '\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0623\u0635\u0644', FR: "ID de l'Actif", EN: 'Asset ID' },
  '\u062a\u0641\u0627\u0635\u064a\u0644': { AR: '\u062a\u0641\u0627\u0635\u064a\u0644', FR: 'D\u00e9tails', EN: 'Details' },
  '\u0641\u062d\u0635 \u0627\u062d\u062a\u064a\u0627\u0644 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a': {
    AR: '\u0641\u062d\u0635 \u0627\u062d\u062a\u064a\u0627\u0644 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a',
    FR: 'V\u00e9rification IA de Fraude',
    EN: 'AI Fraud Check',
  },
  '\u062c\u0627\u0631\u064a \u0627\u0644\u0641\u062d\u0635...': { AR: '\u062c\u0627\u0631\u064a \u0627\u0644\u0641\u062d\u0635...', FR: 'V\u00e9rification en cours...', EN: 'Checking...' },
  '\u0625\u062f\u062e\u0627\u0644 \u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0623\u0635\u0644 \u0623\u0648\u0644\u0627\u064b': {
    AR: '\u0623\u062f\u062e\u0644 \u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0623\u0635\u0644 \u0623\u0648\u0644\u0627\u064b',
    FR: "Entrez l'ID de l'actif d'abord",
    EN: 'Enter an Asset ID first',
  },
  '\u0623\u062d\u062f\u062b': { AR: '\u0623\u062d\u062f\u062b', FR: '\u00c9v\u00e9nements', EN: 'Events' },
  '\u062a\u0645 \u0627\u0644\u0627\u0639\u062a\u0645\u0627\u062f \u0628\u0646\u062c\u0627\u062d': { AR: '\u062a\u0645 \u0627\u0644\u0627\u0639\u062a\u0645\u0627\u062f \u0628\u0646\u062c\u0627\u062d', FR: 'Approuv\u00e9 avec succ\u00e8s', EN: 'Approved successfully' },
  '\u062a\u0645 \u0627\u0644\u0631\u0641\u0636': { AR: '\u062a\u0645 \u0627\u0644\u0631\u0641\u0636', FR: 'Rejet\u00e9', EN: 'Rejected' },
  '\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u0646\u0628\u064a\u0647\u0627\u062a': { AR: '\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u0646\u0628\u064a\u0647\u0627\u062a', FR: 'Aucune alerte', EN: 'No alerts' },
  '\u0644\u0627 \u062a\u0648\u062c\u062f \u0639\u0646\u0627\u0635\u0631 \u0644\u0644\u0645\u0631\u0627\u062c\u0639\u0629': {
    AR: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0639\u0646\u0627\u0635\u0631 \u0644\u0644\u0645\u0631\u0627\u062c\u0639\u0629',
    FR: 'Aucun \u00e9l\u00e9ment \u00e0 r\u00e9viser',
    EN: 'No items to review',
  },
  '\u0627\u0644\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0645\u0631\u062c\u0639\u064a': { AR: '\u0627\u0644\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0645\u0631\u062c\u0639\u064a', FR: 'ID de R\u00e9f\u00e9rence', EN: 'Reference ID' },
  '\u0639\u0646\u0627\u0635\u0631 \u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629': { AR: '\u0639\u0646\u0627\u0635\u0631 \u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629', FR: '\u00c9l\u00e9ments en R\u00e9vision', EN: 'Items Under Review' },
  '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0627\u0644\u0645\u0634\u0628\u0648\u0647\u0629': {
    AR: '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0627\u0644\u0645\u0634\u0628\u0648\u0647\u0629',
    FR: 'Total Alertes Suspectes',
    EN: 'Total Flagged',
  },
};

function t(lang: Language, key: string): string {
  return T[key]?.[lang] ?? T[key]?.['EN'] ?? key;
}

const DISCLAIMER_STYLE: React.CSSProperties = {
  background: 'rgba(245,166,35,0.08)',
  border: '1px solid rgba(245,166,35,0.3)',
  color: '#f5a623',
  fontSize: 12,
  padding: '10px 14px',
  borderRadius: 8,
};

function AiDisclaimer({ language }: { language: Language }) {
  return (
    <div style={DISCLAIMER_STYLE}>
      <strong>{t(language, '\u0625\u0641\u0635\u0627\u062d \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a')}</strong>: {t(language, '\u0642\u0631\u0627\u0631 \u0646\u0647\u0627\u0626\u064a \u0645\u0633\u0624\u0648\u0644\u064a\u0629 \u0627\u0644\u0645\u0631\u0627\u062c\u0639 \u0627\u0644\u0628\u0634\u0631\u064a')}
    </div>
  );
}

/* ─────────────────────────── SecurityFraudPage ─────────────────────────── */

export function SecurityFraudPage({ language, currency }: { language: Language; currency: Currency }) {
  const { hasPermission } = useAuth();
  const canFraud = hasPermission('compliance:read');
  const canDash = hasPermission('report:view');
  const { data: alerts, loading: l1, error: e1 } = useFetch<any[]>(canFraud ? '/api/v1/erp/fraud-alerts' : null);
  const { data: recentEvents } = useFetch<any[]>(canDash ? '/api/v1/erp/dashboard' : null);

  const [assetId, setAssetId] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const runFraudCheck = useCallback(async () => {
    if (!assetId.trim()) {
      setCheckError(t(language, '\u0625\u062f\u062e\u0627\u0644 \u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0623\u0635\u0644 \u0623\u0648\u0644\u0627\u064b'));
      return;
    }
    setChecking(true);
    setCheckResult(null);
    setCheckError(null);
    try {
      const res = await apiFetch('/api/v1/ai/fraud-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: assetId.trim() }),
      });
      const json = await res.json();
      setCheckResult(json.data ?? json);
    } catch (err: any) {
      setCheckError(err?.message || 'Network error');
    } finally {
      setChecking(false);
    }
  }, [assetId, language]);

const list = Array.isArray(alerts) ? alerts : [];

  if (!canFraud) return (
    <PageShell title={t(language, '\u0643\u0634\u0641 \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0644')} subtitle={t(language, '\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0648\u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0644')} language={language}>
      <div style={{ padding: '40px 24px', textAlign: 'center', background: 'rgba(198,169,105,0.05)', border: '1px solid rgba(198,169,105,0.15)', borderRadius: 12 }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>🔒</div>
        <p style={{ color: '#c0c0d0', fontSize: 15, fontWeight: 600 }}>This page requires the <code style={{ color: '#c6a969' }}>compliance:read</code> permission.</p>
        <p style={{ color: '#7a7a88', fontSize: 13, marginTop: 8 }}>Contact your platform administrator to request access.</p>
      </div>
    </PageShell>
  );

  if (l1) return (
    <PageShell title={t(language, '\u0643\u0634\u0641 \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0644')} subtitle={t(language, '\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0648\u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0644')} language={language}>
      <Loading />
    </PageShell>
  );
  if (e1) return (
    <PageShell title={t(language, '\u0643\u0634\u0641 \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0644')} subtitle={t(language, '\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0648\u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0644')} language={language}>
      <ErrorBox message={e1} />
    </PageShell>
  );

  const total = list.length;
  const highCritical = list.filter((a: any) => a.riskScore === 'HIGH' || a.riskScore === 'CRITICAL').length;
  const lowCount = list.filter((a: any) => a.riskScore === 'LOW').length;
  const medCount = list.filter((a: any) => a.riskScore === 'MEDIUM').length;
  const highCount = list.filter((a: any) => a.riskScore === 'HIGH').length;
  const critCount = list.filter((a: any) => a.riskScore === 'CRITICAL').length;

  return (
    <PageShell title={t(language, '\u0643\u0634\u0641 \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0644')} subtitle={t(language, '\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0648\u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0644')} language={language}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard label={t(language, '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a')} value={fmtNum(total)} icon="&#x1f6e1;&#xfe0f;" />
        <StatCard label={t(language, '\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0639\u0627\u0644\u064a\u0629 \u0627\u0644\u062e\u0637\u0648\u0631\u0629')} value={fmtNum(highCritical)} icon="&#x26a0;&#xfe0f;" color="#e8564a" />
        <StatCard label={t(language, '\u0645\u0646\u062e\u0641\u0636\u0629')} value={fmtNum(lowCount)} icon="&#x1f535;" color="#5b8ff9" />
        <StatCard label={t(language, '\u0645\u062a\u0648\u0633\u0637\u0629')} value={fmtNum(medCount)} icon="&#x1f7e1;" color="#f5a623" />
        <StatCard label={t(language, '\u0639\u0627\u0644\u064a\u0629')} value={fmtNum(highCount)} icon="&#x1f7e0;" color="#e8564a" />
        <StatCard label={t(language, '\u062d\u0631\u062c\u0629')} value={fmtNum(critCount)} icon="&#x1f534;" color="#dc3545" />
      </div>

      <Card title={t(language, '\u062a\u0646\u0628\u064a\u0647\u0627\u062a')} style={{ marginBottom: 16 }}>
        {list.length === 0 ? (
          <Empty text={t(language, '\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u0646\u0628\u064a\u0647\u0627\u062a')} />
        ) : (
          <DataTable
            columns={[t(language, '\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062e\u0637\u0648\u0631\u0629'), t(language, '\u0627\u0644\u0642\u0627\u0639\u062f\u0629'), t(language, '\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0623\u0635\u0644'), t(language, '\u062a\u0641\u0627\u0635\u064a\u0644'), t(language, '\u0627\u0644\u062a\u0627\u0631\u064a\u062e')]}
            dir={language === 'AR' ? 'rtl' : 'ltr'}
          >
            {list.map((alert: any, i: number) => (
              <tr key={i}>
                <Td><Badge value={alert.riskScore || '\u2014'} /></Td>
                <Td>{alert.ruleName}</Td>
                <Td>{alert.assetGoldId}</Td>
                <Td>{alert.details}</Td>
                <Td>{fmtDateTime(alert.createdAt, language)}</Td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      {Array.isArray(recentEvents) && recentEvents.length > 0 && (
        <Card title={t(language, '\u0623\u062d\u062f\u062b')} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentEvents.slice(0, 10).map((ev: any, i: number) => (
              <div key={i} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, fontSize: 13, color: '#c0c0d0' }}>
                <span style={{ color: '#c6a969', fontWeight: 600 }}>{ev.title || ev.action || ''}</span>
                {ev.description && <span> \u2014 {ev.description}</span>}
                {(ev.time || ev.createdAt) && (
                  <span style={{ color: '#5a5a68', fontSize: 11, marginLeft: 8 }}>
                    {fmtDateTime(ev.time || ev.createdAt, language)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title={t(language, '\u0641\u062d\u0635 \u0627\u062d\u062a\u064a\u0627\u0644 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a')}>
        <AiDisclaimer language={language} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginTop: 14 }}>
<div style={{ flex: 1 }}>
            <div style={{ marginBottom: 6, color: '#b8a88a', fontSize: 13 }}>{t(language, '\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0623\u0635\u0644')}</div>
            <TextField
              value={assetId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAssetId(e.target.value);
                setCheckError(null);
                setCheckResult(null);
              }}
            />
          </div>
          <GoldButton onClick={runFraudCheck} disabled={checking}>
            {checking ? t(language, '\u062c\u0627\u0631\u064a \u0627\u0644\u0641\u062d\u0635...') : t(language, '\u0641\u062d\u0635 \u0627\u062d\u062a\u064a\u0627\u0644')}
          </GoldButton>
        </div>

        {checkError && <div style={{ marginTop: 14 }}><ErrorBox message={checkError} /></div>}

        {checkResult && (
          <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,215,0,0.1)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
              <span style={{ color: '#b8a88a', fontSize: 13, fontWeight: 600 }}>{t(language, '\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062e\u0637\u0648\u0631\u0629')}:</span>
              <Badge value={checkResult.riskScore || '\u2014'} />
            </div>

            {Array.isArray(checkResult.anomalies) && checkResult.anomalies.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: '#c6a969', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t(language, '\u0645\u062e\u0627\u0644\u0641\u0627\u062a')}</div>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#c0c0d0', fontSize: 13 }}>
                  {checkResult.anomalies.map((a: string, i: number) => (
                    <li key={i} style={{ marginBottom: 2 }}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(checkResult.recommendations) && checkResult.recommendations.length > 0 && (
              <div>
                <div style={{ color: '#c6a969', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t(language, '\u062a\u0648\u0635\u064a\u0627\u062a')}</div>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#c0c0d0', fontSize: 13 }}>
                  {checkResult.recommendations.map((r: string, i: number) => (
                    <li key={i} style={{ marginBottom: 2 }}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    </PageShell>
  );
}

/* ───────────────────────── SecurityHumanReviewPage ──────────────────────── */

export function SecurityHumanReviewPage({ language, currency }: { language: Language; currency: Currency }) {
  const { hasPermission } = useAuth();
  const canFraud = hasPermission('compliance:read');
  const { data: alerts, loading: l1, error: e1 } = useFetch<any[]>(canFraud ? '/api/v1/erp/fraud-alerts' : null);
  const { data: stats } = useFetch<Record<string, any>>(canFraud ? '/api/v1/compliance/stats' : null);

  const [reviewed, setReviewed] = useState<Record<number, 'APPROVED' | 'REJECTED'>>({});
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 3000);
    return () => clearTimeout(timer);
  }, [banner]);

  const handleAction = useCallback((idx: number, action: 'APPROVED' | 'REJECTED') => {
    setReviewed((prev) => ({ ...prev, [idx]: action }));
    setBanner(action === 'APPROVED' ? t(language, '\u062a\u0645 \u0627\u0644\u0627\u0639\u062a\u0645\u0627\u062f \u0628\u0646\u062c\u0627\u062d') : t(language, '\u062a\u0645 \u0627\u0644\u0631\u0641\u0636'));
  }, [language]);

const allAlerts = Array.isArray(alerts) ? alerts : [];

  if (!canFraud) return (
    <PageShell title={t(language, '\u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0628\u0634\u0631\u064a\u0629')} subtitle={t(language, '\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0645\u0634\u0628\u0648\u0647\u0629 \u0648\u0627\u0644\u0642\u0631\u0627\u0631 \u0627\u0644\u0646\u0647\u0627\u0626\u064a')} language={language}>
      <div style={{ padding: '40px 24px', textAlign: 'center', background: 'rgba(198,169,105,0.05)', border: '1px solid rgba(198,169,105,0.15)', borderRadius: 12 }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>🔒</div>
        <p style={{ color: '#c0c0d0', fontSize: 15, fontWeight: 600 }}>This page requires the <code style={{ color: '#c6a969' }}>compliance:read</code> permission.</p>
        <p style={{ color: '#7a7a88', fontSize: 13, marginTop: 8 }}>Contact your platform administrator to request access.</p>
      </div>
    </PageShell>
  );

  const flagged = allAlerts.filter((a: any) =>
    a.riskScore === 'HIGH' || a.riskScore === 'CRITICAL' || a.status === 'FLAGGED'
  );

  if (l1) return (
    <PageShell title={t(language, '\u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0628\u0634\u0631\u064a\u0629')} subtitle={t(language, '\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0645\u0634\u0628\u0648\u0647\u0629 \u0648\u0627\u0644\u0642\u0631\u0627\u0631 \u0627\u0644\u0646\u0647\u0627\u0626\u064a')} language={language}>
      <Loading />
    </PageShell>
  );
  if (e1) return (
    <PageShell title={t(language, '\u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0628\u0634\u0631\u064a\u0629')} subtitle={t(language, '\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0645\u0634\u0628\u0648\u0647\u0629 \u0648\u0627\u0644\u0642\u0631\u0627\u0631 \u0627\u0644\u0646\u0647\u0627\u0626\u064a')} language={language}>
      <ErrorBox message={e1} />
    </PageShell>
  );

  return (
    <PageShell title={t(language, '\u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0628\u0634\u0631\u064a\u0629')} subtitle={t(language, '\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0645\u0634\u0628\u0648\u0647\u0629 \u0648\u0627\u0644\u0642\u0631\u0627\u0631 \u0627\u0644\u0646\u0647\u0627\u0626\u064a')} language={language}>
      <Card style={{ marginBottom: 16 }}>
        <AiDisclaimer language={language} />
      </Card>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatCard label={t(language, '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a')} value={fmtNum(allAlerts.length)} icon="&#x1f6e1;&#xfe0f;" />
        <StatCard label={t(language, '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0627\u0644\u0645\u0634\u0628\u0648\u0647\u0629')} value={fmtNum(flagged.length)} icon="&#x26a0;&#xfe0f;" color="#e8564a" />
      </div>

      {banner && (
        <div style={{ padding: '12px 16px', background: 'rgba(60,185,126,0.1)', border: '1px solid rgba(60,185,126,0.3)', borderRadius: 8, color: '#3cb97e', fontSize: 13, marginBottom: 16 }}>
          {banner}
        </div>
      )}

      <Card title={t(language, '\u0639\u0646\u0627\u0635\u0631 \u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629')}>
        {flagged.length === 0 ? (
          <Empty text={t(language, '\u0644\u0627 \u062a\u0648\u062c\u062f \u0639\u0646\u0627\u0635\u0631 \u0644\u0644\u0645\u0631\u0627\u062c\u0639\u0629')} />
        ) : (
          <DataTable
            columns={[t(language, '\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062e\u0637\u0648\u0631\u0629'), t(language, '\u0627\u0644\u0642\u0627\u0639\u062f\u0629'), t(language, '\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0623\u0635\u0644'), t(language, '\u0627\u0644\u062a\u0627\u0631\u064a\u062e'), t(language, '\u0627\u0644\u062d\u0627\u0644\u0629'), '']}
            dir={language === 'AR' ? 'rtl' : 'ltr'}
          >
            {flagged.map((item: any, i: number) => {
              const rev = reviewed[i];
              return (
                <tr key={i} style={rev ? { background: 'rgba(60,185,126,0.05)' } : undefined}>
                  <Td><Badge value={item.riskScore || '\u2014'} /></Td>
                  <Td>{item.ruleName}</Td>
                  <Td>{item.assetGoldId}</Td>
                  <Td>{fmtDateTime(item.createdAt, language)}</Td>
                  <Td>{rev ? <Badge value={rev} /> : <Badge value={item.status || t(language, '\u0645\u0639\u0644\u0642')} />}</Td>
                  <Td>
                    {!rev && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <GoldButton onClick={() => handleAction(i, 'APPROVED')} style={{ padding: '5px 12px', fontSize: 11 }}>
                          {t(language, '\u0627\u0639\u062a\u0645\u0627\u062f')}
                        </GoldButton>
                        <button
                          onClick={() => handleAction(i, 'REJECTED')}
                          style={{
                            padding: '5px 12px',
                            fontSize: 11,
                            background: 'rgba(220,53,69,0.15)',
                            border: '1px solid rgba(220,53,69,0.3)',
                            borderRadius: 6,
                            color: '#dc3545',
                            cursor: 'pointer',
                            fontWeight: 700,
                          }}
                        >
                          {t(language, '\u0631\u0641\u0636')}
                        </button>
                      </div>
                    )}
                  </Td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Card>
    </PageShell>
  );
}

/* ───────────────────────── ComplianceKycAmlPage ───────────────────────── */

export function ComplianceKycAmlPage({ language, currency }: { language: Language; currency: Currency }) {
  const { data: kycQueue, loading: lKyc, error: eKyc } = useFetch<any[]>('/api/v1/compliance/kyc-queue');
  const { data: amlScreenings, loading: lAml, error: eAml } = useFetch<any[]>('/api/v1/compliance/aml-screening');
  const { data: stats } = useFetch<Record<string, any>>('/api/v1/compliance/stats');

  if (lKyc || lAml) return (
    <PageShell title="KYC / AML" subtitle={t(language, '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0647\u0648\u064a\u0629 \u0648\u0645\u0643\u0627\u0641\u062d\u0629 \u063a\u0633\u0644 \u0627\u0644\u0623\u0645\u0648\u0627\u0644')} language={language}>
      <Loading />
    </PageShell>
  );
  if (eKyc || eAml) return (
    <PageShell title="KYC / AML" subtitle={t(language, '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0647\u0648\u064a\u0629 \u0648\u0645\u0643\u0627\u0641\u062d\u0629 \u063a\u0633\u0644 \u0627\u0644\u0623\u0645\u0648\u0627\u0644')} language={language}>
      <ErrorBox message={eKyc || eAml || ''} />
    </PageShell>
  );

  const kycList = Array.isArray(kycQueue) ? kycQueue : [];
  const amlList = Array.isArray(amlScreenings) ? amlScreenings : [];

  const statEntries = stats
    ? Object.entries(stats).filter(([, v]) => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v))))
    : [];

  return (
    <PageShell title="KYC / AML" subtitle={t(language, '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0647\u0648\u064a\u0629 \u0648\u0645\u0643\u0627\u0641\u062d\u0629 \u063a\u0633\u0644 \u0627\u0644\u0623\u0645\u0648\u0627\u0644')} language={language}>
      {statEntries.length > 0 && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          {statEntries.map(([key, val]) => (
            <StatCard
              key={key}
              label={key}
              value={fmtNum(normalizeNumber(val))}
              icon="&#x1f4ca;"
              sub={fmtMoney(normalizeNumber(val), currency)}
            />
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card title="KYC">
          {kycList.length === 0 ? (
            <Empty text={t(language, '\u0644\u0627 \u062a\u0648\u062c\u062f \u0639\u0646\u0627\u0635\u0631 \u0644\u0644\u0645\u0631\u0627\u062c\u0639\u0629')} />
          ) : (
            <DataTable
              columns={[t(language, '\u0627\u0644\u0639\u0645\u064a\u0644'), t(language, '\u0646\u0648\u0639 \u0627\u0644\u0648\u062b\u064a\u0642\u0629'), t(language, '\u0627\u0644\u062d\u0627\u0644\u0629'), t(language, '\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062e\u0637\u0648\u0631\u0629'), t(language, '\u0627\u0644\u062a\u0627\u0631\u064a\u062e')]}
              dir={language === 'AR' ? 'rtl' : 'ltr'}
            >
              {kycList.map((item: any, i: number) => (
                <tr key={i}>
                  <Td>{item.customerName}</Td>
                  <Td>{item.documentType}</Td>
                  <Td><Badge value={item.status || '\u2014'} /></Td>
                  <Td><Badge value={item.riskLevel || '\u2014'} /></Td>
                  <Td>{fmtDate(item.submittedAt, language)}</Td>
                </tr>
              ))}
            </DataTable>
          )}
        </Card>

        <Card title="AML">
          {amlList.length === 0 ? (
            <Empty text={t(language, '\u0644\u0627 \u062a\u0648\u062c\u062f \u0639\u0646\u0627\u0635\u0631 \u0644\u0644\u0645\u0631\u0627\u062c\u0639\u0629')} />
          ) : (
            <DataTable
              columns={[t(language, '\u0627\u0644\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0645\u0631\u062c\u0639\u064a'), t(language, '\u0627\u0644\u0639\u0645\u064a\u0644'), t(language, '\u0627\u0644\u0646\u0642\u0627\u0637'), t(language, '\u0627\u0644\u062d\u0627\u0644\u0629'), t(language, '\u0642\u0648\u0627\u0639\u062f \u0645\u0641\u0639\u0644\u0629'), t(language, '\u0627\u0644\u062a\u0627\u0631\u064a\u062e')]}
              dir={language === 'AR' ? 'rtl' : 'ltr'}
            >
              {amlList.map((item: any, i: number) => (
                <tr key={i}>
                  <Td>{item.referenceId}</Td>
                  <Td>{item.customerName}</Td>
                  <Td>{fmtMoney(normalizeNumber(item.score), currency)}</Td>
                  <Td><Badge value={item.status || '\u2014'} /></Td>
                  <Td>{Array.isArray(item.triggeredRules) ? item.triggeredRules.join(', ') : String(item.triggeredRules ?? '\u2014')}</Td>
                  <Td>{fmtDateTime(item.createdAt, language)}</Td>
                </tr>
              ))}
            </DataTable>
          )}
        </Card>
      </div>
    </PageShell>
  );
}

export {};
