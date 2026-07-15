import { describe, expect, it } from "vitest";

import {
  solveProportion,
  type ProportionInput,
} from "../../calculations/math/proportions";

function expectSolution(input: ProportionInput, expected: number): void {
  const result = solveProportion(input);
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value.value).toBeCloseTo(expected, 10);
}

describe("пропорции", () => {
  it("проходит три независимых hand-calculated golden case", () => {
    expectSolution({ unknown: "d", a: 2, b: 5, c: 8 }, 20);
    expectSolution({ unknown: "a", b: 9, c: 6, d: 3 }, 18);
    expectSolution({ unknown: "b", a: 15, c: 10, d: 4 }, 6);
  });

  it.each([
    [{ unknown: "a", b: 4, c: 6, d: 8 }, 3],
    [{ unknown: "b", a: 3, c: 6, d: 8 }, 4],
    [{ unknown: "c", a: 3, b: 4, d: 8 }, 6],
    [{ unknown: "d", a: 3, b: 4, c: 6 }, 8],
    [{ unknown: "a", b: -4, c: 6, d: 8 }, -3],
    [{ unknown: "b", a: -3, c: 6, d: 8 }, -4],
    [{ unknown: "c", a: 0, b: 4, d: 8 }, 0],
    [{ unknown: "d", a: 3, b: -4, c: 6 }, -8],
    [{ unknown: "a", b: 0.5, c: 0.25, d: 2 }, 0.0625],
    [{ unknown: "c", a: 1e150, b: 2e150, d: 4 }, 2],
  ] as const)(
    "считает unknown в каждой позиции, case %#",
    (input, expected) => {
      expectSolution(input, expected);
    },
  );

  it.each([
    [
      "known b denominator zero",
      { unknown: "a", b: 0, c: 2, d: 3 },
      "zero-denominator",
    ],
    [
      "known d denominator zero",
      { unknown: "a", b: 1, c: 2, d: 0 },
      "zero-denominator",
    ],
    [
      "division coefficient zero",
      { unknown: "b", a: 1, c: 0, d: 2 },
      "no-solution",
    ],
    [
      "solved b would be zero",
      { unknown: "b", a: 0, c: 2, d: 3 },
      "no-solution",
    ],
    [
      "solved d would be zero",
      { unknown: "d", a: 1, b: 2, c: 0 },
      "no-solution",
    ],
    ["not finite", { unknown: "c", a: Infinity, b: 2, d: 3 }, "not-finite"],
    [
      "overflow",
      { unknown: "a", b: Number.MAX_VALUE, c: Number.MAX_VALUE, d: 1 },
      "overflow",
    ],
  ] as const)("отклоняет invalid/boundary case %s", (_label, input, code) => {
    expect(solveProportion(input)).toMatchObject({
      ok: false,
      error: { code },
    });
  });

  it("решение каждой позиции восстанавливает a/b = c/d", () => {
    const complete = { a: 6, b: 15, c: 14, d: 35 };
    const inputs: ProportionInput[] = [
      { unknown: "a", b: complete.b, c: complete.c, d: complete.d },
      { unknown: "b", a: complete.a, c: complete.c, d: complete.d },
      { unknown: "c", a: complete.a, b: complete.b, d: complete.d },
      { unknown: "d", a: complete.a, b: complete.b, c: complete.c },
    ];

    for (const input of inputs) {
      const result = solveProportion(input);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.value.value).toBeCloseTo(
        complete[result.value.position],
        12,
      );
    }
  });
});
