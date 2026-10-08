import { StatsService } from "../modules/stats/stats.service";

describe("StatsService (ported math from gold)", () => {
  let service: StatsService;

  beforeEach(() => {
    service = new StatsService();
  });

  describe("descriptive", () => {
    it("computes mean, std and median", () => {
      const s = service.descriptive([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(s.count).toBe(10);
      expect(s.mean).toBe(5.5);
      expect(s.std).toBeCloseTo(3.027, 2);
      expect(s.median).toBe(5.5);
      expect(s.min).toBe(1);
      expect(s.max).toBe(10);
      expect(s.sum).toBe(55);
    });

    it("rejects an empty array", () => {
      expect(() => service.descriptive([])).toThrow();
    });
  });

  describe("ttest (Welch)", () => {
    it("rejects the null when groups differ", () => {
      const a = [1, 2, 3, 2, 1];
      const b = [8, 9, 7, 8, 10];
      const r = service.ttest(a, b);
      expect(r.pValue).toBeLessThan(0.05);
      expect(r.significant).toBe(true);
    });

    it("does not flag identical groups", () => {
      const a = [3, 4, 5];
      const b = [3, 4, 5];
      const r = service.ttest(a, b);
      expect(r.significant).toBe(false);
    });
  });

  describe("anova", () => {
    it("detects a difference across three groups", () => {
      const r = service.anova([
        [1, 2, 1, 2],
        [5, 6, 5, 6],
        [9, 10, 9, 10],
      ]);
      expect(r.pValue).toBeLessThan(0.05);
      expect(r.f).toBeGreaterThan(0);
    });
  });

  describe("correlation", () => {
    it("returns 1 for a perfectly linear relation", () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      expect(service.correlation(x, y).r).toBeCloseTo(1, 6);
    });

    it("returns 0 for uncorrelated points", () => {
      const x = [1, 2, 3, 4, 5];
      const y = [5, 3, 1, 3, 5];
      expect(service.correlation(x, y).r).toBeCloseTo(0, 6);
    });
  });

  describe("regression", () => {
    it("fits y = a + b*x", () => {
      const x = [1, 2, 3, 4, 5];
      const y = [3, 5, 7, 9, 11];
      const r = service.regression(x, y);
      expect(r.slope).toBeCloseTo(2, 6);
      expect(r.intercept).toBeCloseTo(1, 6);
      expect(r.r2).toBeCloseTo(1, 6);
    });
  });

  describe("cronbachAlpha", () => {
    it("is 1 for perfectly consistent items", () => {
      const items = [
        [1, 2, 3, 4],
        [1, 2, 3, 4],
      ];
      expect(service.cronbachAlpha(items).alpha).toBeCloseTo(1, 6);
    });

    it("reports a finite acceptable value for noisy items", () => {
      const items = [
        [1, 2, 3, 4, 5, 6],
        [2, 1, 4, 3, 6, 5],
      ];
      const r = service.cronbachAlpha(items);
      expect(Number.isNaN(r.alpha)).toBe(false);
      expect(r.alpha).toBeGreaterThan(0.8);
    });
  });
});