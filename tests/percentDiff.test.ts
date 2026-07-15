import { describe, it, expect } from "vitest";
import {
  calculatePercentDifference,
  calculatePercentDifferenceAverage,
  calculatePercentRatio,
} from "../logic/percentDiff";

describe("percentDiff logic", () => {
  it("calculatePercentDifference returns null for invalid inputs or zero base", () => {
    expect(calculatePercentDifference(NaN as unknown as number, 2)).toBeNull();
    expect(calculatePercentDifference(1, NaN as unknown as number)).toBeNull();
    expect(calculatePercentDifference(0, 10)).toBeNull();
  });

  it("calculatePercentDifference works for positive/negative deltas", () => {
    expect(calculatePercentDifference(100, 120)).toBeCloseTo(20);
    expect(calculatePercentDifference(100, 80)).toBeCloseTo(-20);
    expect(calculatePercentDifference(-100, -50)).toBeCloseTo(50);
  });

  it("calculatePercentDifferenceAverage handles symmetry and zero average", () => {
    expect(calculatePercentDifferenceAverage(100, 120)).toBeCloseTo(
      (20 / 110) * 100,
    );
    expect(calculatePercentDifferenceAverage(120, 100)).toBeCloseTo(
      (20 / 110) * 100,
    );
    expect(calculatePercentDifferenceAverage(0, 0)).toBeNull();
  });

  it("calculatePercentRatio uses smaller value as base and returns null for zero smaller", () => {
    expect(calculatePercentRatio(100, 50)).toBeCloseTo(((100 - 50) / 50) * 100);
    expect(calculatePercentRatio(50, 100)).toBeCloseTo(((100 - 50) / 50) * 100);
    expect(calculatePercentRatio(0, 10)).toBeNull();
  });
});
