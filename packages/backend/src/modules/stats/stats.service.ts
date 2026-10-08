import { Injectable, BadRequestException } from "@nestjs/common";

interface Descriptive {
  count: number;
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  sum: number;
}

@Injectable()
export class StatsService {
  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((s, v) => s + v, 0) / values.length;
  }

  private median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private std(values: number[]): number {
    const n = values.length;
    if (n < 2) return 0;
    const me = this.mean(values);
    const variance = values.reduce((s, v) => s + (v - me) ** 2, 0) / (n - 1);
    return Math.sqrt(variance);
  }

  private normalCdf(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.SQRT2));
  }

  private erf(x: number): number {
    const t = 1 / (1 + 0.3275911 * Math.abs(x));
    const y =
      1 -
      ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
        0.254829592) *
        t *
        Math.exp(-x * x);
    return Math.sign(x) * y;
  }

  private studentTPValue(t: number, df: number): number {
    // Gaussian approximation of the two-tailed Student-t distribution tail
    const tail = 2 * (1 - this.normalCdf(Math.abs(t)));
    return Math.min(1, Math.max(0, tail));
  }

  private fPValue(f: number, df1: number, df2: number): number {
    // Tiku's approximation of the F distribution survival function
    if (f < 0) return 1;
    const x = (df2 * f) / (df1 * f + df2);
    const a = df2 / 2;
    const b = df1 / 2;
    const z = 1 - Math.pow(1 - x, b);
    return Math.min(1, Math.max(0, 1 - z));
  }

  private assertArray(value: any, label: string): number[] {
    if (!Array.isArray(value) || value.some((v) => typeof v !== "number" || Number.isNaN(v))) {
      throw new BadRequestException(`${label} must be an array of numbers`);
    }
    return value as number[];
  }

  descriptive(values: number[]): Descriptive {
    const arr = this.assertArray(values, "values");
    if (arr.length === 0) throw new BadRequestException("values cannot be empty");
    return {
      count: arr.length,
      mean: this.mean(arr),
      median: this.median(arr),
      std: this.std(arr),
      min: Math.min(...arr),
      max: Math.max(...arr),
      sum: arr.reduce((s, v) => s + v, 0),
    };
  }

  ttest(a: number[], b: number[]): any {
    const groupA = this.assertArray(a, "group A");
    const groupB = this.assertArray(b, "group B");
    if (groupA.length < 2 || groupB.length < 2) {
      throw new BadRequestException("Each group needs at least 2 values");
    }
    const meanA = this.mean(groupA);
    const meanB = this.mean(groupB);
    const varA = this.std(groupA) ** 2;
    const varB = this.std(groupB) ** 2;
    const se = Math.sqrt(varA / groupA.length + varB / groupB.length);
    const t = se === 0 ? 0 : Math.abs(meanA - meanB) / se;
    const df = Math.floor(
      Math.pow(varA / groupA.length + varB / groupB.length, 2) /
        (Math.pow(varA / groupA.length, 2) / (groupA.length - 1) +
          Math.pow(varB / groupB.length, 2) / (groupB.length - 1))
    );
    return {
      test: "t-test (Welch)",
      t,
      df,
      pValue: this.studentTPValue(t, df),
      meanA,
      meanB,
      significant: this.studentTPValue(t, df) < 0.05,
    };
  }

  anova(groups: number[][]): any {
    if (!Array.isArray(groups) || groups.length < 2) {
      throw new BadRequestException("groups must contain at least 2 arrays");
    }
    const parsed = groups.map((g) => this.assertArray(g, "group"));
    parsed.forEach((g) => {
      if (g.length < 2) throw new BadRequestException("Each group needs at least 2 values");
    });
    const grandMean = this.mean(parsed.flat());
    const n = parsed.reduce((s, g) => s + g.length, 0);
    const k = parsed.length;
    const ssBetween = parsed.reduce(
      (s, g) => s + g.length * (this.mean(g) - grandMean) ** 2,
      0
    );
    const ssWithin = parsed.reduce(
      (s, g) => s + g.reduce((si, v) => si + (v - this.mean(g)) ** 2, 0),
      0
    );
    const dfBetween = k - 1;
    const dfWithin = n - k;
    const msBetween = ssBetween / dfBetween;
    const msWithin = ssWithin / dfWithin;
    const f = msBetween / msWithin;
    return {
      test: "one-way ANOVA",
      f,
      dfBetween,
      dfWithin,
      ssBetween,
      ssWithin,
      pValue: this.fPValue(f, dfBetween, dfWithin),
      significant: this.fPValue(f, dfBetween, dfWithin) < 0.05,
    };
  }

  correlation(x: number[], y: number[]): any {
    const xs = this.assertArray(x, "x");
    const ys = this.assertArray(y, "y");
    if (xs.length !== ys.length || xs.length < 2) {
      throw new BadRequestException("x and y must have equal length >= 2");
    }
    const meanX = this.mean(xs);
    const meanY = this.mean(ys);
    let num = 0;
    let dx = 0;
    let dy = 0;
    for (let i = 0; i < xs.length; i++) {
      num += (xs[i] - meanX) * (ys[i] - meanY);
      dx += (xs[i] - meanX) ** 2;
      dy += (ys[i] - meanY) ** 2;
    }
    const r = dx === 0 || dy === 0 ? 0 : num / Math.sqrt(dx * dy);
    const df = xs.length - 2;
    const t = df <= 0 ? 0 : (r * Math.sqrt(df)) / Math.sqrt(1 - r * r);
    return {
      test: "Pearson correlation",
      r,
      n: xs.length,
      pValue: this.studentTPValue(t, df),
      significant: this.studentTPValue(t, df) < 0.05,
    };
  }

  regression(x: number[], y: number[]): any {
    const xs = this.assertArray(x, "x");
    const ys = this.assertArray(y, "y");
    if (xs.length !== ys.length || xs.length < 2) {
      throw new BadRequestException("x and y must have equal length >= 2");
    }
    const meanX = this.mean(xs);
    const meanY = this.mean(ys);
    let num = 0;
    let den = 0;
    for (let i = 0; i < xs.length; i++) {
      num += (xs[i] - meanX) * (ys[i] - meanY);
      den += (xs[i] - meanX) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = meanY - slope * meanX;
    const { r } = this.correlation(xs, ys);
    return { model: "y = a + b*x", intercept, slope, r2: r * r, n: xs.length };
  }

  cronbachAlpha(items: number[][]): any {
    if (!Array.isArray(items) || items.length < 2) {
      throw new BadRequestException("items must contain at least 2 arrays");
    }
    const parsed = items.map((i) => this.assertArray(i, "item"));
    const count = parsed[0].length;
    if (parsed.some((i) => i.length !== count) || count < 2) {
      throw new BadRequestException("All items must have the same length >= 2");
    }
    const itemVariances = parsed.map((i) => this.std(i) ** 2);
    const totalScores = parsed[0].map((_, idx) => parsed.reduce((s, i) => s + i[idx], 0));
    const totalVariance = this.std(totalScores) ** 2;
    const k = parsed.length;
    const alpha = (k / (k - 1)) * (1 - itemVariances.reduce((s, v) => s + v, 0) / totalVariance);
    return { alpha, items: k, respondents: count, acceptable: alpha >= 0.7 };
  }
}