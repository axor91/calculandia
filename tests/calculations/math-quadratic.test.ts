import { describe, expect, it } from "vitest";

import { calculateQuadratic } from "../../calculations/math/quadratic";

const TOLERANCE = 1e-9;

function closeTo(actual: number, expected: number): boolean {
  return (
    Math.abs(actual - expected) <=
    Math.max(1e-9, TOLERANCE * Math.abs(expected))
  );
}

describe("квадратное уравнение", () => {
  it("проходит три независимых golden case из спеки", () => {
    const first = calculateQuadratic(1, -5, 6);
    expect(first.ok).toBe(true);
    if (first.ok && first.value.kind === "two-real") {
      expect(first.value.x1).toBeCloseTo(2, 9);
      expect(first.value.x2).toBeCloseTo(3, 9);
      expect(first.value.discriminant).toBeCloseTo(1, 9);
    } else {
      throw new Error("expected two-real");
    }

    const second = calculateQuadratic(1, 2, 1);
    expect(second.ok).toBe(true);
    if (second.ok && second.value.kind === "one-real") {
      expect(second.value.x).toBeCloseTo(-1, 9);
    } else {
      throw new Error("expected one-real");
    }

    const third = calculateQuadratic(1, 1, 1);
    expect(third.ok).toBe(true);
    if (third.ok && third.value.kind === "complex") {
      expect(third.value.discriminant).toBeCloseTo(-3, 9);
      expect(third.value.re).toBeCloseTo(-0.5, 9);
      expect(third.value.im).toBeCloseTo(Math.sqrt(3) / 2, 9);
    } else {
      throw new Error("expected complex");
    }
  });

  it.each([
    [1, -3, 2, 1, 2],
    [2, -4, -6, -1, 3],
    [1, 0, -4, -2, 2],
    [1, -7, 12, 3, 4],
    [1, -10, 21, 3, 7],
    [1, 1, -6, -3, 2],
    [1, -2, -8, -2, 4],
    [1, -1, -12, -3, 4],
    [2, 7, 3, -3, -0.5],
    [1, -100000, 1, undefined, undefined],
  ] as const)("считает domain case %#", (a, b, c, x1, x2) => {
    const result = calculateQuadratic(a, b, c);
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.kind !== "two-real") return;
    if (x1 === undefined || x2 === undefined) return;
    expect(closeTo(result.value.x1, x1)).toBe(true);
    expect(closeTo(result.value.x2, x2)).toBe(true);
  });

  it("считает домен-кейсы с проверкой Виета", () => {
    const cases: [number, number, number][] = [
      [1, -3, 2],
      [2, -4, -6],
      [1, -7, 12],
      [1, -10, 21],
      [5, -5, 0],
      [1, -2, -8],
      [3, 5, -2],
      [1, -1, -6],
      [1, 4, 3],
      [2, 7, 3],
    ];
    for (const [a, b, c] of cases) {
      const result = calculateQuadratic(a, b, c);
      expect(result.ok).toBe(true);
      if (!result.ok || result.value.kind !== "two-real") continue;
      const { x1, x2 } = result.value;
      expect(closeTo(x1 + x2, -b / a)).toBe(true);
      expect(closeTo(x1 * x2, c / a)).toBe(true);
    }
  });

  it("устойчива при близких по модулю -b и sqrt(D) (избегает катастрофического сокращения)", () => {
    // a=1, b=-100000, c=1: корни близки к 0.00001 и 99999.99999 —
    // наивная формула теряет точность на маленьком корне.
    const result = calculateQuadratic(1, -100000, 1);
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.kind !== "two-real") return;
    const { x1, x2 } = result.value;
    expect(closeTo(x1 * x2, 1)).toBe(true);
    expect(closeTo(x1 + x2, 100000)).toBe(true);
    expect(x1).toBeGreaterThan(0);
  });

  it.each([
    ["a is zero", [0, 1, 1], "domain"],
    ["a NaN", [Number.NaN, 1, 1], "not-finite"],
    ["b Infinity", [1, Infinity, 1], "not-finite"],
    ["c NaN", [1, 1, Number.NaN], "not-finite"],
    ["a is negative zero", [-0, 1, 1], "domain"],
  ] as const)("отклоняет invalid/boundary case %s", (_label, args, code) => {
    const [a, b, c] = args;
    expect(calculateQuadratic(a, b, c)).toMatchObject({
      ok: false,
      error: { code },
    });
  });

  it("одиночный корень при нулевом дискриминанте", () => {
    const result = calculateQuadratic(1, -4, 4);
    expect(result.ok).toBe(true);
    if (result.ok && result.value.kind === "one-real") {
      expect(result.value.x).toBeCloseTo(2, 9);
      expect(result.value.discriminant).toBeCloseTo(0, 9);
    }
  });

  it("комплексные корни при отрицательном дискриминанте", () => {
    const result = calculateQuadratic(1, 0, 4);
    expect(result.ok).toBe(true);
    if (result.ok && result.value.kind === "complex") {
      expect(result.value.re).toBeCloseTo(0, 9);
      expect(result.value.im).toBeCloseTo(2, 9);
      expect(result.value.im).toBeGreaterThan(0);
    }
  });
});
