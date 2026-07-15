import { describe, expect, it } from "vitest";

import {
  calculatePartAsPercent,
  calculatePercentage,
  calculatePercentOfNumber,
  calculateWholeFromPart,
} from "../../calculations/math/percent-of-number";
import { multiplyDivide } from "../../calculations/math/number";

function expectValue(
  result: ReturnType<typeof calculatePercentOfNumber>,
  expected: number,
): void {
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value).toBeCloseTo(expected, 10);
}

describe("процент от числа", () => {
  it("avoids an intermediate underflow when operation order can preserve the value", () => {
    expect(multiplyDivide(1e-300, 1e-300, 1e-300)).toEqual({
      ok: true,
      value: 1e-300,
    });
  });
  it("проходит три независимых golden case из норматива", () => {
    expectValue(calculatePercentOfNumber(250, 20), 50);
    expectValue(calculatePartAsPercent(50, 200), 25);
    expectValue(calculateWholeFromPart(50, 20), 250);
  });

  it.each([
    [0, 75, 0],
    [500, 0, 0],
    [200, 150, 300],
    [-200, 25, -50],
    [200, -25, -50],
    [0.25, 12.5, 0.03125],
    [1_000_000, 0.01, 100],
    [Number.MAX_VALUE, 1, Number.MAX_VALUE / 100],
    [8, 12.5, 1],
    [-8, -12.5, 1],
  ])("считает domain case %#", (number, percent, expected) => {
    expectValue(calculatePercentOfNumber(number, percent), expected);
  });

  it("диспетчер не смешивает semantics трёх режимов", () => {
    expectValue(
      calculatePercentage({
        mode: "percent-of-number",
        number: 250,
        percent: 20,
      }),
      50,
    );
    expectValue(
      calculatePercentage({ mode: "part-as-percent", part: 50, whole: 200 }),
      25,
    );
    expectValue(
      calculatePercentage({ mode: "whole-from-part", part: 50, percent: 20 }),
      250,
    );
  });

  it.each([
    ["part/zero", calculatePartAsPercent(1, 0), "zero-denominator"],
    ["whole/zero", calculateWholeFromPart(1, 0), "zero-denominator"],
    ["NaN", calculatePercentOfNumber(Number.NaN, 1), "not-finite"],
    ["Infinity", calculatePercentOfNumber(1, Infinity), "not-finite"],
    [
      "overflow",
      calculatePercentOfNumber(Number.MAX_VALUE, Number.MAX_VALUE),
      "overflow",
    ],
  ])("отклоняет invalid/boundary case %s", (_label, result, code) => {
    expect(result).toMatchObject({ ok: false, error: { code } });
  });

  it("сохраняет round-trip whole → part → whole на устойчивом domain", () => {
    for (let number = -100; number <= 100; number += 7) {
      for (let percent = 1; percent <= 200; percent += 13) {
        const part = calculatePercentOfNumber(number, percent);
        expect(part.ok).toBe(true);
        if (!part.ok) continue;

        const restored = calculateWholeFromPart(part.value, percent);
        expect(restored.ok).toBe(true);
        if (restored.ok) expect(restored.value).toBeCloseTo(number, 10);
      }
    }
  });
});
