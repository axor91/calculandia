import { describe, expect, it } from "vitest";

import {
  applyFractionOperation,
  calculateFractions,
  formatRational,
  fractionFromMixed,
  normalizeRational,
  toMixedFraction,
  type Rational,
} from "../../calculations/math/fractions";

function expectRational(
  result: ReturnType<typeof calculateFractions>,
  numerator: bigint,
  denominator: bigint,
): void {
  expect(result).toEqual({ ok: true, value: { numerator, denominator } });
}

const proper = (numerator: number, denominator: number) => ({
  whole: 0,
  numerator,
  denominator,
});

describe("арифметика дробей", () => {
  it("проходит три независимых golden case из норматива", () => {
    const first = calculateFractions(
      { whole: -2, numerator: 1, denominator: 3 },
      { whole: 1, numerator: 0, denominator: 1 },
      "add",
    );
    expectRational(first, -4n, 3n);
    if (first.ok) expect(formatRational(first.value)).toBe("-1 1/3");

    const second = calculateFractions(proper(-1, 2), proper(1, 4), "add");
    expectRational(second, -1n, 4n);
    if (second.ok) expect(formatRational(second.value)).toBe("-1/4");

    expect(
      calculateFractions(proper(1, 2), proper(0, 1), "divide"),
    ).toMatchObject({ ok: false, error: { code: "division-by-zero" } });
  });

  it.each([
    [proper(1, 2), proper(1, 3), "add", 5n, 6n],
    [proper(3, 4), proper(1, 6), "subtract", 7n, 12n],
    [proper(2, 3), proper(9, 10), "multiply", 3n, 5n],
    [proper(5, 6), proper(10, 9), "divide", 3n, 4n],
    [proper(-2, 3), proper(-3, 7), "multiply", 2n, 7n],
    [proper(-2, 3), proper(3, 7), "divide", -14n, 9n],
    [{ whole: 2, numerator: 7, denominator: 3 }, proper(1, 3), "add", 14n, 3n],
    [proper(0, 5), proper(0, 9), "add", 0n, 1n],
    [proper(1, -2), proper(1, 4), "add", -1n, 4n],
    [proper(15, 35), proper(6, 14), "add", 6n, 7n],
  ] as const)(
    "считает domain case %#",
    (left, right, operation, numerator, denominator) => {
      expectRational(
        calculateFractions(left, right, operation),
        numerator,
        denominator,
      );
    },
  );

  it("не теряет точность на произведениях safe-integer inputs", () => {
    const max = Number.MAX_SAFE_INTEGER;
    expectRational(
      calculateFractions(proper(max, 1), proper(max - 1, 1), "multiply"),
      BigInt(max) * BigInt(max - 1),
      1n,
    );
  });

  it("сохраняет знак proper negative при mixed rendering", () => {
    const mixed = toMixedFraction({ numerator: -1n, denominator: 2n });
    expect(mixed).toEqual({
      sign: -1,
      whole: 0n,
      numerator: 1n,
      denominator: 2n,
    });
    expect(formatRational({ numerator: -1n, denominator: 2n })).toBe("-1/2");
  });

  it("поддерживает явный отрицательный ноль для -0 1/2", () => {
    expect(
      fractionFromMixed({ whole: -0, numerator: 1, denominator: 2 }),
    ).toEqual({
      ok: true,
      value: { numerator: -1n, denominator: 2n },
    });
  });

  it.each([
    ["zero denominator", proper(1, 0), "zero-denominator"],
    ["fractional numerator", proper(1.5, 2), "not-safe-integer"],
    [
      "unsafe whole",
      { whole: Number.MAX_SAFE_INTEGER + 1, numerator: 0, denominator: 1 },
      "not-safe-integer",
    ],
    ["NaN", proper(Number.NaN, 2), "not-safe-integer"],
    [
      "ambiguous mixed sign",
      { whole: 2, numerator: -1, denominator: 3 },
      "ambiguous-sign",
    ],
    [
      "negative denominator conflicts with whole",
      { whole: -2, numerator: 1, denominator: -3 },
      "ambiguous-sign",
    ],
  ] as const)("отклоняет invalid/boundary case %s", (_label, input, code) => {
    expect(fractionFromMixed(input)).toMatchObject({
      ok: false,
      error: { code },
    });
  });

  it("нормализация всегда сокращает дробь и оставляет denominator положительным", () => {
    function gcd(first: bigint, second: bigint): bigint {
      let a = first < 0n ? -first : first;
      let b = second < 0n ? -second : second;
      while (b !== 0n) [a, b] = [b, a % b];
      return a;
    }

    for (let numerator = -20; numerator <= 20; numerator += 1) {
      for (let denominator = -20; denominator <= 20; denominator += 1) {
        if (denominator === 0) continue;
        const result = normalizeRational(
          BigInt(numerator),
          BigInt(denominator),
        );
        expect(result.ok).toBe(true);
        if (!result.ok) continue;
        expect(result.value.denominator).toBeGreaterThan(0n);
        expect(gcd(result.value.numerator, result.value.denominator)).toBe(1n);
      }
    }
  });

  it("сложение и последующее вычитание возвращает исходную дробь", () => {
    const values: Rational[] = [
      { numerator: -7n, denominator: 9n },
      { numerator: 0n, denominator: 1n },
      { numerator: 3n, denominator: 5n },
      { numerator: 100n, denominator: 13n },
    ];

    for (const left of values) {
      for (const right of values) {
        const sum = applyFractionOperation(left, right, "add");
        expect(sum.ok).toBe(true);
        if (!sum.ok) continue;
        const restored = applyFractionOperation(sum.value, right, "subtract");
        const canonical = normalizeRational(left.numerator, left.denominator);
        expect(restored).toEqual(canonical);
      }
    }
  });
});
