// ============================================================================
// GOLD PLATFORM — STATISTICAL ANALYSIS PAGE (أداة التحليل الإحصائي "SPSS")
// ============================================================================

import React, { useState, useCallback } from 'react';
import { apiFetch } from '../utils/apiFetch';
import {
  PageShell, Card, Loading, ErrorBox, GoldButton, TextField,
} from '../components/UiKit';
import type { Language, Currency } from '../components/UiKit';

type TestKind = 'descriptive' | 't-test' | 'anova' | 'correlation' | 'regression' | 'cronbach';

const T: Record<Language, Record<string, string>> = {
  AR: {
    title: 'التحليل الإحصائي',
    subtitle: 'SPSS Studio — إحصاءات وصفية، اختبارات، انحدار، وموثوقية كرونباخ',
    test: 'نوع الاختبار',
    data: 'البيانات',
    run: 'تشغيل التحليل',
    running: 'جارٍ التحليل...',
    descHint: 'أدخل قيماً مفصولة بفواصل، مثال: 21.5, 22.1, 20.9, 23.0',
    groupAHint: 'المجموعة الأولى (A) — قيم بفواصل',
    groupBHint: 'المجموعة الثانية (B) — قيم بفواصل',
    groupsHint: 'كل سطر = مجموعة، القيم مفصولة بفواصل',
    xHint: 'المتغير المستقل (X) — قيم بفواصل',
    yHint: 'المتغير التابع (Y) — قيم بفواصل',
    cronbachHint: 'كل سطر = مبحوث، درجات الأسئلة مفصولة بفواصل',
    result: 'النتائج',
    significant: 'معنوي',
    notSignificant: 'غير معنوي',
  },
  FR: {
    title: 'Analyse Statistique',
    subtitle: 'SPSS Studio — descriptives, tests, régression et fiabilité de Cronbach',
    test: "Type de test",
    data: 'Données',
    run: 'Lancer l\u2019analyse',
    running: 'Analyse en cours...',
    descHint: 'Valeurs séparées par des virgules, ex: 21.5, 22.1, 20.9',
    groupAHint: 'Groupe A — valeurs séparées par des virgules',
    groupBHint: 'Groupe B — valeurs séparées par des virgules',
    groupsHint: 'Un groupe par ligne, valeurs séparées par des virgules',
    xHint: 'Variable indépendante (X)',
    yHint: 'Variable dépendante (Y)',
    cronbachHint: 'Une ligne par répondant, scores séparés par des virgules',
    result: 'Résultats',
    significant: 'Significatif',
    notSignificant: 'Non significatif',
  },
  EN: {
    title: 'Statistical Analysis',
    subtitle: 'SPSS Studio — descriptive stats, tests, regression & Cronbach reliability',
    test: 'Test Type',
    data: 'Data',
    run: 'Run Analysis',
    running: 'Analyzing...',
    descHint: 'Comma-separated values, e.g. 21.5, 22.1, 20.9',
    groupAHint: 'Group A — comma-separated values',
    groupBHint: 'Group B — comma-separated values',
    groupsHint: 'One group per line, comma-separated values',
    xHint: 'Independent variable (X) — comma-separated',
    yHint: 'Dependent variable (Y) — comma-separated',
    cronbachHint: 'One respondent per line, item scores comma-separated',
    result: 'Results',
    significant: 'Significant',
    notSignificant: 'Not significant',
  },
};

function t(lang: Language, key: string): string {
  return (T[lang] && T[lang][key]) || T.EN[key] || key;
}

function parseNums(text: string): number[] {
  return text
    .split(/[,\s;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

function parseGroups(text: string): number[][] {
  return text
    .split(/\r?\n/)
    .map((line) => parseNums(line))
    .filter((g) => g.length > 0);
}

function transposeItemized(rows: number[][]): number[][] {
  if (rows.length === 0) return [];
  const cols = Math.max(...rows.map((r) => r.length));
  const items: number[][] = Array.from({ length: cols }, () => []);
  for (const row of rows) {
    for (let c = 0; c < row.length; c++) items[c].push(row[c]);
  }
  return items.filter((it) => it.length >= 2);
}

const TEST_TESTS: TestKind[] = ['descriptive', 't-test', 'anova', 'correlation', 'regression', 'cronbach'];

const TEST_ENUM_LABELS: Record<TestKind, Record<Language, string>> = {
  descriptive: { AR: 'إحصاءات وصفية', FR: 'Statistiques descriptives', EN: 'Descriptive Statistics' },
  't-test': { AR: 'اختبار T (عينتان)', FR: 'Test T (2 échantillons)', EN: 'Independent T-Test' },
  anova: { AR: 'ANOVA أحادي الاتجاه', FR: 'ANOVA à un facteur', EN: 'One-Way ANOVA' },
  correlation: { AR: 'ارتباط بيرسون', FR: 'Corrélation de Pearson', EN: 'Pearson Correlation' },
  regression: { AR: 'انحدار خطي بسيط', FR: 'Régression linéaire', EN: 'Linear Regression' },
  cronbach: { AR: 'ألفا كرونباخ', FR: 'Alpha de Cronbach', EN: "Cronbach's Alpha" },
};

function sig(lang: Language, ok: boolean): string {
  return ok ? t(lang, 'significant') : t(lang, 'notSignificant');
}

function fmt(n: number | null | undefined, digits = 4): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return Number(n).toFixed(digits);
}

// ─── مكون عرض نتيجة ───────────────────────────────────────────────────────
const Row: React.FC<{ label: string; value: React.ReactNode; strong?: boolean }> = ({ label, value, strong }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <span style={{ color: '#8a8a9a', fontSize: 13 }}>{label}</span>
    <span style={{ color: strong ? '#ffd700' : '#e0d5c1', fontSize: 13, fontWeight: strong ? 700 : 400 }}>{value}</span>
  </div>
);

function ResultView({ lang, payload }: { lang: Language; payload: any }) {
  if (!payload) return null;
  const r = payload.result || payload;
  const alpha = payload.alpha ?? 0.05;

  const sectionTitle: React.CSSProperties = { color: '#c6a969', fontSize: 14, fontWeight: 700, margin: '0 0 4px' };

  if (payload.test === 'descriptive') {
    return (
      <div>
        <h3 style={sectionTitle}>{t(lang, 'result')} — Descriptive</h3>
        <Row label="N" value={r.n} />
        <Row label="Σ" value={fmt(r.sum, 4)} />
        <Row label="Mean" value={fmt(r.mean, 4)} strong />
        <Row label="Median" value={fmt(r.median, 4)} />
        <Row label="Mode" value={r.mode.length ? r.mode.map((m: number) => fmt(m, 4)).join(', ') : '—'} />
        <Row label="Min / Max" value={`${fmt(r.min, 4)} / ${fmt(r.max, 4)}`} />
        <Row label="Q1 / Q3" value={`${fmt(r.q1, 4)} / ${fmt(r.q3, 4)}`} />
        <Row label="Range" value={fmt(r.range, 4)} />
        <Row label="Variance" value={fmt(r.variance, 4)} />
        <Row label="Std Dev" value={fmt(r.stdDev, 4)} />
        <Row label="Std Error" value={fmt(r.se, 4)} />
        <Row label="CV" value={fmt(r.cv, 3)} />
        <Row label="Skewness" value={fmt(r.skewness, 3)} />
        <Row label="Kurtosis" value={fmt(r.kurtosis, 3)} />
      </div>
    );
  }

  if (payload.test === 't-test') {
    return (
      <div>
        <h3 style={sectionTitle}>{t(lang, 'result')} — T-Test (Welch)</h3>
        <Row label="n₁ / n₂" value={`${r.nA} / ${r.nB}`} />
        <Row label="Mean₁ / Mean₂" value={`${fmt(r.meanA, 4)} / ${fmt(r.meanB, 4)}`} />
        <Row label="Mean Difference" value={fmt(r.meanDiff, 4)} />
        <Row label="SD₁ / SD₂" value={`${fmt(r.stdDevA, 4)} / ${fmt(r.stdDevB, 4)}`} />
        <Row label="t Statistic" value={fmt(r.tStatistic, 4)} strong />
        <Row label="df (Welch)" value={fmt(r.df, 2)} />
        <Row label="p-value" value={fmt(r.pValue, 6)} strong />
        <Row label={sig(lang, r.significant)} value={r.significant ? '✅' : '❌'} />
        <Row label={'α'} value={String(alpha)} />
      </div>
    );
  }

  if (payload.test === 'anova') {
    return (
      <div>
        <h3 style={sectionTitle}>{t(lang, 'result')} — ANOVA</h3>
        <Row label="k (groups)" value={r.k} />
        <Row label="N" value={r.n} />
        <Row label="Group Means" value={r.groupMeans.map((m: number) => fmt(m, 3)).join(', ')} />
        <Row label="SS Between / Within" value={`${fmt(r.ssBetween, 2)} / ${fmt(r.ssWithin, 2)}`} />
        <Row label="df Between / Within" value={`${r.dfBetween} / ${r.dfWithin}`} />
        <Row label="MS Between / Within" value={`${fmt(r.msBetween, 3)} / ${fmt(r.msWithin, 3)}`} />
        <Row label="F Statistic" value={fmt(r.FStatistic, 4)} strong />
        <Row label="p-value" value={fmt(r.pValue, 6)} strong />
        <Row label={sig(lang, r.significant)} value={r.significant ? '✅' : '❌'} />
      </div>
    );
  }

  if (payload.test === 'correlation') {
    return (
      <div>
        <h3 style={sectionTitle}>{t(lang, 'result')} — Pearson</h3>
        <Row label="n (pairs)" value={r.n} />
        <Row label="r" value={fmt(r.r, 4)} strong />
        <Row label="r²" value={fmt(r.rSquared, 4)} />
        <Row label="Strength" value={r.strength} />
        <Row label="Direction" value={r.direction} />
        <Row label="Covariance" value={fmt(r.covariance, 4)} />
        {r.slope !== null && <Row label="slope" value={fmt(r.slope, 4)} />}
        {r.intercept !== null && <Row label="intercept" value={fmt(r.intercept, 4)} />}
        {r.enough && <Row label="t / p" value={`${fmt(r.tStatistic, 4)} / ${fmt(r.pValue, 6)}`} />}
        {r.enough && <Row label={sig(lang, r.significant)} value={r.significant ? '✅' : '❌'} />}
      </div>
    );
  }

  if (payload.test === 'regression') {
    return (
      <div>
        <h3 style={sectionTitle}>{t(lang, 'result')} — Regression</h3>
        <Row label="Equation" value={r.equation} strong />
        <Row label="n" value={r.n} />
        <Row label="slope (β₁)" value={fmt(r.slope, 6)} />
        <Row label="intercept (β₀)" value={fmt(r.intercept, 6)} />
        <Row label="r" value={fmt(r.r, 4)} />
        <Row label="r²" value={fmt(r.rSquared, 4)} strong />
        <Row label="SSE / SST" value={`${fmt(r.sse, 3)} / ${fmt(r.sst, 3)}`} />
        <Row label="Residual SD" value={fmt(r.residualStdDev, 4)} />
        {r.pValueSlope !== null && <Row label="p (slope)" value={fmt(r.pValueSlope, 6)} />}
        {r.pValueSlope !== null && <Row label={sig(lang, r.significant)} value={r.significant ? '✅' : '❌'} />}
      </div>
    );
  }

  if (payload.test === 'cronbach') {
    return (
      <div>
        <h3 style={sectionTitle}>{t(lang, 'result')} — Cronbach α</h3>
        <Row label="k (items)" value={r.k} />
        <Row label="n (respondents)" value={r.n} />
        <Row label="Σσ² items" value={fmt(r.sumItemVariances, 4)} />
        <Row label="σ² total" value={fmt(r.totalVariance, 4)} />
        <Row label="α" value={fmt(r.alpha, 4)} strong />
        <Row label="Scale" value={r.scale} />
        <Row label="Acceptable ≥ 0.7" value={r.acceptable ? '✅' : '❌'} />
      </div>
    );
  }

  return <pre style={{ color: '#c0c0d0', fontSize: 12, whiteSpace: 'pre-wrap' }}>{JSON.stringify(payload, null, 2)}</pre>;
}

// ─── الصفحة الرئيسية لأداة التحليل ─────────────────────────────────────────
export function StatAnalysisPage({ language, currency }: { language: Language; currency: Currency }) {
  const [test, setTest] = useState<TestKind>('descriptive');
  const [text, setText] = useState('');
  const [textB, setTextB] = useState('');
  const [alpha, setAlpha] = useState('0.05');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let data: Record<string, any> = {};
      if (test === 'descriptive') data = { data: parseNums(text) };
      else if (test === 't-test') data = { groupA: parseNums(text), groupB: parseNums(textB) };
      else if (test === 'anova') data = { groups: parseGroups(text) };
      else if (test === 'correlation') data = { x: parseNums(text), y: parseNums(textB) };
      else if (test === 'regression') data = { x: parseNums(text), y: parseNums(textB) };
      else if (test === 'cronbach') data = { items: transposeItemized(parseGroups(text)) };

      const a = Number(alpha);
      const res = await apiFetch('/api/v1/stats/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test, data, alpha: Number.isFinite(a) && a > 0 ? a : 0.05 }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setResult(json.data);
      } else {
        setError(json.error?.message || json.error || 'Analysis failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [test, text, textB, alpha]);

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
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, color: '#b8a88a', fontSize: 13 };
  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 120,
    padding: '10px 12px',
    background: 'rgba(30,30,45,0.8)',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#fff',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  };

  const hintKey =
    test === 'descriptive'
      ? 'descHint'
      : test === 't-test'
      ? 'groupAHint'
      : test === 'anova'
      ? 'groupsHint'
      : test === 'cronbach'
      ? 'cronbachHint'
      : 'xHint';

  return (
    <PageShell title={t(language, 'title')} subtitle={t(language, 'subtitle')} language={language}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, maxWidth: 900 }}>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={labelStyle}>{t(language, 'test')}</label>
              <select value={test} onChange={(e) => { setTest(e.target.value as TestKind); setResult(null); setError(null); }} style={selectStyle}>
                {TEST_TESTS.map((k) => (
                  <option key={k} value={k}>{TEST_ENUM_LABELS[k][language]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>α</label>
              <TextField value={alpha} onChange={(e) => setAlpha(e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>{t(language, 'data')}</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t(language, hintKey)}
              style={textareaStyle}
            />
            {(test === 't-test' || test === 'correlation' || test === 'regression') && (
              <>
                <label style={{ ...labelStyle, marginTop: 12 }}>{t(language, test === 't-test' ? 'groupBHint' : 'yHint')}</label>
                <textarea
                  value={textB}
                  onChange={(e) => setTextB(e.target.value)}
                  placeholder={t(language, test === 't-test' ? 'groupBHint' : 'yHint')}
                  style={textareaStyle}
                />
              </>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <GoldButton onClick={run} disabled={loading}>
              {loading ? t(language, 'running') : t(language, 'run')}
            </GoldButton>
          </div>
        </Card>

        {loading && <Card><Loading text={t(language, 'running')} /></Card>}
        {error && <ErrorBox message={error} />}
        {result && (
          <Card>
            <ResultView lang={language} payload={result} />
          </Card>
        )}
      </div>
    </PageShell>
  );
}

export default StatAnalysisPage;