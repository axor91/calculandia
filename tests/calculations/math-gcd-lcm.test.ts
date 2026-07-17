import { describe, expect, it } from "vitest";

import { calculateGcdLcm } from "../../calculations/math/gcd-lcm";

function expectGcdLcm(
  result: ReturnType<typeof calculateGcdLcm>,
  gcd: number,
  lcm: number,
): void {
  expect(result).toEqual({ ok: true, value: { gcd, lcm } });
}

describe("НОД и НОК", () => {
  it("проходит три независимых golden case из спеки", () => {
    expectGcdLcm(calculateGcdLcm([12, 18]), 6, 36);
    expectGcdLcm(calculateGcdLcm([7, 13]), 1, 91);
    expectGcdLcm(calculateGcdLcm([48, 180, 36]), 12, 720);
  });

  it.each([
    [[12, 18], 6, 36],
    [[8, 12], 4, 24],
    [[100, 75], 25, 300],
    [[6, 10, 15], 1, 30],
    [[1, 1], 1, 1],
    [[9, 9], 9, 9],
    [[17, 34, 51], 17, 102],
    [[2, 3, 4, 5], 1, 60],
    [[1_000_000_000_000, 1], 1, 1_000_000_000_000],
    [[21, 6], 3, 42],
  ])("считает domain case %#", (values, gcd, lcm) => {
    expectGcdLcm(calculateGcdLcm(values), gcd, lcm);
  });

  it.each([
    ["single value", [5], "domain"],
    ["empty", [], "domain"],
    ["eleven values", Array.from({ length: 11 }, () => 2), "domain"],
    ["zero", [0, 5], "domain"],
    ["negative", [-4, 8], "domain"],
    ["non-integer", [4.5, 8], "not-safe-integer"],
    ["above max value", [1e15 + 1, 2], "domain"],
    ["NaN", [Number.NaN, 2], "not-safe-integer"],
  ] as const)("отклоняет invalid/boundary case %s", (_label, values, code) => {
    expect(calculateGcdLcm(values as number[])).toMatchObject({
      ok: false,
      error: { code },
    });
  });

  it("НОД делит каждое входное значение", () => {
    const samples = [
      [12, 18],
      [48, 180, 36],
      [17, 34, 51],
      [100, 75, 125],
    ];
    for (const values of samples) {
      const result = calculateGcdLcm(values);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      for (const value of values) {
        expect(value % result.value.gcd).toBe(0);
      }
    }
  });

  it("НОК делится на каждое входное значение", () => {
    const samples = [
      [12, 18],
      [48, 180, 36],
      [17, 34, 51],
      [100, 75, 125],
    ];
    for (const values of samples) {
      const result = calculateGcdLcm(values);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      for (const value of values) {
        expect(result.value.lcm % value).toBe(0);
      }
    }
  });

  it("для двух чисел НОД × НОК = произведение чисел", () => {
    const pairs: [number, number][] = [
      [12, 18],
      [7, 13],
      [100, 75],
      [21, 6],
    ];
    for (const [a, b] of pairs) {
      const result = calculateGcdLcm([a, b]);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.value.gcd * result.value.lcm).toBe(a * b);
    }
  });
});
