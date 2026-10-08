// ============================================================================
// GOLD PLATFORM — STATISTICS SERVICE (تحليل إحصائي متكامل)
// ============================================================================
// محرك التحليل الإحصائي — يعالج البيانات برمجياً (بدون اعتماديات خارجية)
// يتضمن: إحصائيات وصفية، اختبار T للعينات المستقلة، ANOVA أحادي الاتجاه،
//         ارتباط بيرسون، انحدار خطي بسيط، معامل ألفا كرونباخ
//
// ملاحظة عددية:
//   - كل الدوال ترجع null لغياب البيانات الكافية
//   - قيم p محسوبة عبر regularized incomplete beta function
//     (انشقاق continued-fraction بخوارزمية Numerical Recipes)

// ============================================================================
// KERNEL: دالة غاما اللوغاريتمية + beta غير المكتملة
// ============================================================================

/** log-gamma (تقريب Lanczos) */
export function gammaln(x: number): number {
  const cof = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.1208650973866179e-2,
    -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += cof[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

/** continued fraction لتعبئة beta غير المكتملة */
function betacf(x: number, a: number, b: number): number {
  const MAXIT = 100;
  const EPS = 3e-7;
  const FPMIN = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** regularized incomplete beta I_x(a,b) */
export function betainc(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    gammaln(a + b) -
      gammaln(a) -
      gammaln(b) +
      a * Math.log(x) +
      b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(x, a, b)) / a;
  }
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

// ============================================================================
// CDFs — التوزيعات التراكمية
// ============================================================================

/** قيمة p ثنائية الذيل لاختبار t */
export function tTwoTailedP(t: number, df: number): number {
  if (!Number.isFinite(t) || df <= 0) return NaN;
  const x = df / (df + t * t);
  return 2 * (1 - betainc(x, df / 2, 0.5));
}

/** قيمة p لاختبار F (ANOVA) */
export function fTestP(F: number, df1: number, df2: number): number {
  if (!Number.isFinite(F) || df1 <= 0 || df2 <= 0) return NaN;
  if (F <= 0) return 1;
  const x = (df1 * F) / (df1 * F + df2);
  return 1 - betainc(x, df1 / 2, df2 / 2);
}

// ============================================================================
// مخرجات الاختبار (واجهات)
// ============================================================================

export interface DescriptiveStatsResult {
  n: number;
  sum: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  mode: number[];
  q1: number;
  q3: number;
  range: number;
  variance: number;
  stdDev: number;
  se: number;
  cv: number;
  skewness: number;
  kurtosis: number;
}

export interface TTestResult {
  type: 't-test';
  nA: number;
  nB: number;
  meanA: number;
  meanB: number;
  meanDiff: number;
  stdDevA: number;
  stdDevB: number;
  tStatistic: number;
  df: number;
  pValue: number;
  significant: boolean;
  alpha: number;
  interpretation: string;
}

export interface AnovaResult {
  type: 'anova';
  k: number;
  n: number;
  groupMeans: number[];
  grandMean: number;
  ssBetween: number;
  ssWithin: number;
  dfBetween: number;
  dfWithin: number;
  msBetween: number;
  msWithin: number;
  FStatistic: number;
  pValue: number;
  significant: boolean;
  alpha: number;
}

export interface CorrelationResult {
  type: 'correlation';
  n: number;
  r: number;
  rSquared: number;
  covariance: number;
  slope: number | null;
  intercept: number | null;
  tStatistic?: number;
  pValue: number;
  strength: string;
  direction: string;
  sampleSize: number;
  enough: boolean;
  significant: boolean;
  alpha: number;
}

export interface RegressionResult {
  type: 'regression';
  n: number;
  slope: number;
  intercept: number;
  r: number;
  rSquared: number;
  stdErrorSlope: number | null;
  tStatisticSlope: number | null;
  pValueSlope: number | null;
  sse: number;
  sst: number;
  residualStdDev: number;
  equation: string;
  significant: boolean;
  alpha: number;
}

export interface CronbachResult {
  type: 'cronbach';
  k: number;
  n: number;
  sumItemVariances: number;
  totalVariance: number;
  alpha: number;
  scale: string;
  acceptable: boolean;
}

// ============================================================================
// دوال حسابية أساسية
// ============================================================================

function mean(values: number[]): number {
  if (values.length === 0) return NaN;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** تباين العينة */
function sampleVariance(values: number[]): number {
  if (values.length < 2) return NaN;
  const m = mean(values);
  return values.reduce((a, v) => a + (v - m) ** 2, 0) / (values.length - 1);
}

function stdDev(values: number[]): number {
  return Math.sqrt(sampleVariance(values));
}

function clean(values: number[]): number[] {
  return values.filter((v) => Number.isFinite(v));
}

// ============================================================================
// 1. الإحصائيات الوصفية
// ============================================================================

export function descriptiveStats(values: number[]): DescriptiveStatsResult | null {
  const data = clean(values);
  const n = data.length;
  if (n < 1) return null;

  const sum = data.reduce((a, b) => a + b, 0);
  const meanValue = sum / n;
  const sorted = [...data].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[n - 1];
  const median =
    n % 2 === 1
      ? sorted[(n - 1) / 2]
      : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const q1 =
    n % 2 === 1
      ? descriptiveStats(sorted.slice(0, Math.floor(n / 2)))?.median ?? min
      : descriptiveStats(sorted.slice(0, n / 2))?.median ?? min;
  const q3 =
    n % 2 === 1
      ? descriptiveStats(sorted.slice(Math.floor(n / 2) + 1))?.median ?? max
      : descriptiveStats(sorted.slice(n / 2))?.median ?? max;
  const range = max - min;

  const freq = new Map<number, number>();
  data.forEach((v) => freq.set(v, (freq.get(v) || 0) + 1));
  let mode: number[] = [];
  let maxFreq = 0;
  freq.forEach((count, v) => {
    if (count > maxFreq) {
      maxFreq = count;
      mode = [v];
    } else if (count === maxFreq) {
      mode.push(v);
    }
  });
  if (mode.length === data.length) mode = [];

  const variance = n > 1 ? sampleVariance(data) : 0;
  const standardDeviation = Math.sqrt(variance);
  const se = n > 1 ? standardDeviation / Math.sqrt(n) : 0;
  const cv = meanValue !== 0 ? standardDeviation / Math.abs(meanValue) : 0;

  // الانحراف والتفلطح (ملاحظة: حسابات العينة)
  let skewness = 0;
  let kurtosis = 0;
  if (n > 2 && standardDeviation > 0) {
    skewness =
      data.reduce((a, v) => a + Math.pow((v - meanValue) / standardDeviation, 3), 0) *
      (n / ((n - 1) * (n - 2)));
    kurtosis =
      (data.reduce((a, v) => a + Math.pow((v - meanValue) / standardDeviation, 4), 0) *
        (n * (n + 1))) /
        ((n - 1) * (n - 2) * (n - 3)) -
      (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
  }

  return {
    n,
    sum,
    min,
    max,
    mean: meanValue,
    median,
    mode,
    q1,
    q3,
    range,
    variance,
    stdDev: standardDeviation,
    se,
    cv,
    skewness,
    kurtosis,
  };
}

// ============================================================================
// 2. اختبار t للعينات المستقلة (Welch)
// ============================================================================

export function independentTTest(
  groupA: number[],
  groupB: number[],
  alpha: number = 0.05,
): TTestResult | null {
  const a = clean(groupA);
  const b = clean(groupB);
  const nA = a.length;
  const nB = b.length;
  if (nA < 2 || nB < 2) return null;

  const meanA = mean(a);
  const meanB = mean(b);
  const va = sampleVariance(a);
  const vb = sampleVariance(b);
  const meanDiff = meanA - meanB;
  const se = Math.sqrt(va / nA + vb / nB);

  if (se === 0) return null;

  const tStatistic = meanDiff / se;
  // درجات حرية Welch-Satterthwaite
  const df =
    Math.pow(va / nA + vb / nB, 2) /
    (Math.pow(va / nA, 2) / (nA - 1) + Math.pow(vb / nB, 2) / (nB - 1));
  const pValue = tTwoTailedP(tStatistic, df);
  const significant = pValue < alpha;

  return {
    type: 't-test',
    nA,
    nB,
    meanA,
    meanB,
    meanDiff,
    stdDevA: Math.sqrt(va),
    stdDevB: Math.sqrt(vb),
    tStatistic,
    df,
    pValue,
    significant,
    alpha,
    interpretation: significant
      ? `p = ${pValue.toFixed(4)} < α = ${alpha} → فرق معنوي بين المجموعتين`
      : `p = ${pValue.toFixed(4)} ≥ α = ${alpha} → لا فرق معنوي إحصائياً`,
  };
}

// ============================================================================
// 3. ANOVA أحادي الاتجاه
// ============================================================================

export function oneWayAnova(
  groups: number[][],
  alpha: number = 0.05,
): AnovaResult | null {
  const cleaned = groups
    .map((g) => clean(g))
    .filter((g) => g.length > 0);
  const k = cleaned.length;
  if (k < 2) return null;

  const all = cleaned.flat();
  const n = all.length;
  const grandMean = mean(all);

  let ssBetween = 0;
  let ssWithin = 0;
  const groupMeans = cleaned.map((g) => mean(g));

  for (let i = 0; i < cleaned.length; i++) {
    const g = cleaned[i];
    const gm = groupMeans[i];
    ssBetween += g.length * Math.pow(gm - grandMean, 2);
    for (const v of g) {
      ssWithin += Math.pow(v - gm, 2);
    }
  }

  const dfBetween = k - 1;
  const dfWithin = n - k;
  if (dfWithin <= 0) return null;

  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  if (msWithin === 0) return null;

  const FStatistic = msBetween / msWithin;
  const pValue = fTestP(FStatistic, dfBetween, dfWithin);
  const significant = pValue < alpha;

  return {
    type: 'anova',
    k,
    n,
    groupMeans,
    grandMean,
    ssBetween,
    ssWithin,
    dfBetween,
    dfWithin,
    msBetween,
    msWithin,
    FStatistic,
    pValue,
    significant,
    alpha,
  };
}

// ============================================================================
// 4. ارتباط بيرسون
// ============================================================================

export function pearsonCorrelation(
  x: number[],
  y: number[],
  alpha: number = 0.05,
): CorrelationResult | null {
  if (x.length !== y.length) return null;
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < x.length; i++) {
    if (Number.isFinite(x[i]) && Number.isFinite(y[i])) {
      pairs.push([x[i], y[i]]);
    }
  }
  const n = pairs.length;
  if (n < 3) return null;

  const xs = pairs.map((p) => p[0]);
  const ys = pairs.map((p) => p[1]);
  const mx = mean(xs);
  const my = mean(ys);

  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (const [xi, yi] of pairs) {
    const dx = xi - mx;
    const dy = yi - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }

  const denom = Math.sqrt(dx2 * dy2);
  if (denom === 0) return null;
  const r = num / denom;
  const covariance = num / (n - 1);

  const absR = Math.abs(r);
  const strength =
    absR >= 0.8 ? 'قوي جداً' : absR >= 0.6 ? 'قوي' : absR >= 0.4 ? 'متوسط' : absR >= 0.2 ? 'ضعيف' : 'ضعيف جداً';
  const direction = r >= 0 ? 'إيجابي (طردي)' : 'سلبي (عكسي)';

  let tStatistic: number | undefined;
  let pValue = 1;
  let enough = n >= 4;
  let significant = false;
  if (enough && absR < 1) {
    tStatistic = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r);
    const df = n - 2;
    pValue = tTwoTailedP(tStatistic, df);
    significant = pValue < alpha;
  }

  let slope: number | null = null;
  let intercept: number | null = null;
  if (dx2 > 0) {
    slope = num / dx2;
    intercept = my - slope * mx;
  }

  return {
    type: 'correlation',
    n,
    r,
    rSquared: r * r,
    covariance,
    slope,
    intercept,
    tStatistic,
    pValue,
    strength,
    direction,
    sampleSize: n,
    enough,
    significant,
    alpha,
  };
}

// ============================================================================
// 5. الانحدار الخطي البسيط
// ============================================================================

export function linearRegression(
  x: number[],
  y: number[],
  alpha: number = 0.05,
): RegressionResult | null {
  if (x.length !== y.length) return null;
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < x.length; i++) {
    if (Number.isFinite(x[i]) && Number.isFinite(y[i])) {
      pairs.push([x[i], y[i]]);
    }
  }
  const n = pairs.length;
  if (n < 3) return null;

  const xs = pairs.map((p) => p[0]);
  const ys = pairs.map((p) => p[1]);
  const mx = mean(xs);
  const my = mean(ys);

  let sxy = 0;
  let sxx = 0;
  for (const [xi, yi] of pairs) {
    sxy += (xi - mx) * (yi - my);
    sxx += Math.pow(xi - mx, 2);
  }
  if (sxx === 0) return null;

  const slope = sxy / sxx;
  const intercept = my - slope * mx;

  const predicted = pairs.map(([xi]) => intercept + slope * xi);
  const sse = pairs.reduce((acc, [xi, yi], i) => acc + Math.pow(yi - predicted[i], 2), 0);
  const sst = ys.reduce((acc, yi) => acc + Math.pow(yi - my, 2), 0);
  const r = sst > 0 ? Math.sqrt(Math.max(0, 1 - sse / sst)) * (slope >= 0 ? 1 : -1) : 0;
  const rSquared = r * r;

  let stdErrorSlope: number | null = null;
  let tStatisticSlope: number | null = null;
  let pValueSlope: number | null = null;
  if (n > 2) {
    const residualStdDev = Math.sqrt(sse / (n - 2));
    stdErrorSlope = residualStdDev / Math.sqrt(sxx);
    if (stdErrorSlope > 0) {
      tStatisticSlope = slope / stdErrorSlope;
      pValueSlope = tTwoTailedP(tStatisticSlope, n - 2);
    }
  }

  return {
    type: 'regression',
    n,
    slope,
    intercept,
    r,
    rSquared,
    stdErrorSlope,
    tStatisticSlope,
    pValueSlope,
    sse,
    sst,
    residualStdDev: n > 2 ? Math.sqrt(sse / (n - 2)) : 0,
    equation: `y = ${slope.toFixed(6)}x + ${intercept.toFixed(6)}`,
    significant: pValueSlope !== null ? pValueSlope < alpha : false,
    alpha,
  };
}

// ============================================================================
// 6. معامل ألفا كرونباخ (الموثوقية)
// ============================================================================

/**
 * معامل ألفا كرونباخ لموثوقية الاستبيان
 * @param items مصفوفة الأسئلة: items[i] = كل إجابات السؤال i عبر المبحوثين
 */
export function cronbachAlpha(items: number[][]): CronbachResult | null {
  const cleanItems = items.map((it) => clean(it));
  const valid = cleanItems.filter((it) => it.length > 0);
  const k = valid.length;
  if (k < 2) return null;

  // كل سؤال يجب أن يكون له نفس عدد الإجابات
  const n = valid[0].length;
  if (valid.some((it) => it.length !== n)) return null;
  if (n < 2) return null;

  const itemVariances = valid.map((it) => sampleVariance(it));
  const sumItemVariances = itemVariances.reduce((a, b) => a + b, 0);

  // تباين مجموع الدرجات لكل مبحوث
  const totals: number[] = [];
  for (let j = 0; j < n; j++) {
    let s = 0;
    for (const it of valid) s += it[j];
    totals.push(s);
  }
  const totalVariance = sampleVariance(totals);
  if (totalVariance === 0) return null;

  const alpha = (k / (k - 1)) * (1 - sumItemVariances / totalVariance);
  const clamped = Math.max(0, Math.min(1, alpha));

  const scale =
    clamped >= 0.9
      ? 'ممتاز'
      : clamped >= 0.8
      ? 'جيد'
      : clamped >= 0.7
      ? 'مقبول'
      : clamped >= 0.6
      ? 'ضعيف'
      : 'غير مقبول';

  return {
    type: 'cronbach',
    k,
    n,
    sumItemVariances,
    totalVariance,
    alpha: clamped,
    scale,
    acceptable: clamped >= 0.7,
  };
}