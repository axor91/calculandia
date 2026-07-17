import { describe, expect, it } from "vitest";

import {
  calculateMean,
  calculateWeightedMean,
} from "../../calculations/math/mean";

function expectMean(
  result: ReturnType<typeof calculateMean>,
  mean: number,
  sum: number,
  count: number,
): void {
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.value.mean).toBeCloseTo(mean, 9);
  expect(result.value.sum).toBeCloseTo(sum, 9);
  expect(result.value.count).toBe(count);
}

describe("среднее значение", () => {
  it("проходит три независимых golden case из спеки", () => {
    expectMean(calculateMean([2, 4, 9]), 5, 15, 3);
    expectMean(calculateMean([-5, 5]), 0, 0, 2);
    const weighted = calculateWeightedMean([2, 4], [1, 3]);
    expect(weighted.ok).toBe(true);
    if (weighted.ok) {
      expect(weighted.value.mean).toBeCloseTo(3.5, 9);
      expect(weighted.value.weightSum).toBe(4);
    }
  });

  it.each([
    [[1, 2, 3], 2],
    [[10, 10, 10], 10],
    [[0, 0], 0],
    [[1, 100], 50.5],
    [[-1, -2, -3, -4], -2.5],
    [[1.5, 2.5, 3.5], 2.5],
    [Array.from({ length: 200 }, () => 5), 5],
    [[1, 2], 1.5],
    [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5.5],
    [[-100, 100], 0],
  ])("считает domain case %#", (values, mean) => {
    const result = calculateMean(values as number[]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.mean).toBeCloseTo(mean as number, 9);
  });

  it.each([
    ["single value", [1], "domain"],
    ["empty", [], "domain"],
    ["201 values", Array.from({ length: 201 }, () => 1), "domain"],
    ["NaN", [1, Number.NaN], "not-finite"],
    ["Infinity", [1, Infinity], "not-finite"],
  ] as const)("отклоняет invalid/boundary case %s", (_label, values, code) => {
    expect(calculateMean(values as number[])).toMatchObject({
      ok: false,
      error: { code },
    });
  });

  it.each([
    ["negative weight", [1, 2], [-1, 1], "domain"],
    ["zero weight sum", [1, 2], [0, 0], "zero-denominator"],
    ["length mismatch", [1, 2, 3], [1, 1], "domain"],
    ["single value", [1], [1], "domain"],
    ["not finite weight", [1, 2], [1, Infinity], "not-finite"],
  ] as const)(
    "отклоняет invalid/boundary weighted case %s",
    (_label, values, weights, code) => {
      expect(calculateWeightedMean(values, weights)).toMatchObject({
        ok: false,
        error: { code },
      });
    },
  );

  it("среднее лежит между минимумом и максимумом списка", () => {
    const samples = [
      [1, 2, 3],
      [-10, 0, 10, 20],
      [5, 5, 5],
      [-1, -2, -3, -4, -5],
    ];
    for (const values of samples) {
      const result = calculateMean(values);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.value.mean).toBeGreaterThanOrEqual(Math.min(...values));
      expect(result.value.mean).toBeLessThanOrEqual(Math.max(...values));
    }
  });

  it("перестановка списка не меняет среднее", () => {
    const values = [3, 1, 4, 1, 5, 9, 2, 6];
    const shuffled = [...values].reverse();
    const original = calculateMean(values);
    const permuted = calculateMean(shuffled);
    expect(original.ok).toBe(true);
    expect(permuted.ok).toBe(true);
    if (original.ok && permuted.ok) {
      expect(permuted.value.mean).toBeCloseTo(original.value.mean, 9);
    }
  });
});
