import { describe, expect, it } from "vitest";

import {
  calculateRelativePercentChange,
  calculateSymmetricPercentDifference,
} from "../../calculations/math/percent-change";

type Result = ReturnType<typeof calculateRelativePercentChange>;

function expectValue(result: Result, expected: number): void {
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value).toBeCloseTo(expected, 9);
}

describe("процентное изменение", () => {
  it("проходит три независимых golden case из норматива", () => {
    expectValue(calculateRelativePercentChange(100, 120), 20);
    expectValue(calculateRelativePercentChange(120, 100), -100 / 6);
    expectValue(calculateSymmetricPercentDifference(100, 120), 200 / 11);
  });

  it.each([
    [100, 100, 0],
    [100, 0, -100],
    [25, 50, 100],
    [80, 60, -25],
    [0.5, 0.75, 50],
    [1, 1.01, 1],
  ])("считает relative domain case %#", (oldValue, newValue, expected) => {
    expectValue(calculateRelativePercentChange(oldValue, newValue), expected);
  });

  it.each([
    [0, 5, 200],
    [5, 0, 200],
    [10, 10, 0],
    [10, 30, 100],
    [Number.MAX_VALUE, Number.MAX_VALUE, 0],
  ])("считает symmetric domain case %#", (first, second, expected) => {
    expectValue(calculateSymmetricPercentDifference(first, second), expected);
  });

  it.each([
    ["relative zero base", calculateRelativePercentChange(0, 1), "domain"],
    ["relative negative base", calculateRelativePercentChange(-1, 1), "domain"],
    ["relative negative next", calculateRelativePercentChange(1, -1), "domain"],
    [
      "symmetric both zero",
      calculateSymmetricPercentDifference(0, 0),
      "domain",
    ],
    [
      "symmetric negative",
      calculateSymmetricPercentDifference(-1, 2),
      "domain",
    ],
    ["not finite", calculateRelativePercentChange(1, Infinity), "not-finite"],
  ])("отклоняет invalid/boundary case %s", (_label, result, code) => {
    expect(result).toMatchObject({ ok: false, error: { code } });
  });

  it("симметричная разница инвариантна к порядку и лежит в [0, 200]", () => {
    for (let first = 0; first <= 50; first += 3) {
      for (let second = 1; second <= 50; second += 4) {
        const direct = calculateSymmetricPercentDifference(first, second);
        const reverse = calculateSymmetricPercentDifference(second, first);
        expect(direct.ok && reverse.ok).toBe(true);
        if (!direct.ok || !reverse.ok) continue;
        expect(direct.value).toBeCloseTo(reverse.value, 12);
        expect(direct.value).toBeGreaterThanOrEqual(0);
        expect(direct.value).toBeLessThanOrEqual(200);
      }
    }
  });
});
