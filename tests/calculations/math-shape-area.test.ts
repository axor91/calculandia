import { describe, expect, it } from "vitest";

import {
  calculateCircleArea,
  calculateRectangleArea,
  calculateTrapezoidArea,
  calculateTriangleBaseHeightArea,
  calculateTriangleSidesArea,
} from "../../calculations/math/shape-area";

function expectArea(
  result: ReturnType<typeof calculateRectangleArea>,
  expected: number,
): void {
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value).toBeCloseTo(expected, 9);
}

describe("площадь фигур", () => {
  it("проходит три независимых golden case из спеки", () => {
    expectArea(calculateRectangleArea(3, 4), 12);
    expectArea(calculateTriangleSidesArea(3, 4, 5), 6);
    expectArea(calculateCircleArea(1), Math.PI);
    expectArea(calculateTrapezoidArea(3, 5, 4), 16);
  });

  it.each([
    [1, 1, 1],
    [2, 5, 10],
    [10, 0.5, 5],
    [1000, 1000, 1_000_000],
    [0.1, 0.1, 0.01],
  ])("прямоугольник domain case %#", (a, b, expected) => {
    expectArea(calculateRectangleArea(a, b), expected);
  });

  it.each([
    [6, 4, 12],
    [10, 10, 50],
    [5, 2, 5],
  ])(
    "треугольник по основанию и высоте domain case %#",
    (base, height, expected) => {
      expectArea(calculateTriangleBaseHeightArea(base, height), expected);
    },
  );

  it.each([
    [3, 4, 5, 6],
    [5, 5, 6, 12],
    [13, 14, 15, 84],
  ])(
    "треугольник по трём сторонам (Герон) domain case %#",
    (a, b, c, expected) => {
      expectArea(calculateTriangleSidesArea(a, b, c), expected);
    },
  );

  it.each([
    [1, Math.PI],
    [2, Math.PI * 4],
    [0.5, Math.PI * 0.25],
  ])("круг domain case %#", (radius, expected) => {
    expectArea(calculateCircleArea(radius), expected);
  });

  it.each([
    [3, 5, 4, 16],
    [2, 2, 3, 6],
    [10, 20, 5, 75],
  ])("трапеция domain case %#", (a, b, height, expected) => {
    expectArea(calculateTrapezoidArea(a, b, height), expected);
  });

  it.each([
    ["rectangle zero width", () => calculateRectangleArea(0, 5), "domain"],
    [
      "rectangle negative height",
      () => calculateRectangleArea(5, -1),
      "domain",
    ],
    [
      "triangle base non-finite",
      () => calculateTriangleBaseHeightArea(Number.NaN, 5),
      "not-finite",
    ],
    [
      "triangle inequality violated (degenerate)",
      () => calculateTriangleSidesArea(1, 1, 2),
      "domain",
    ],
    [
      "triangle inequality violated",
      () => calculateTriangleSidesArea(1, 1, 5),
      "domain",
    ],
    ["circle zero radius", () => calculateCircleArea(0), "domain"],
    [
      "circle infinite radius",
      () => calculateCircleArea(Infinity),
      "not-finite",
    ],
    [
      "trapezoid negative side",
      () => calculateTrapezoidArea(-3, 5, 4),
      "domain",
    ],
  ] as const)("отклоняет invalid/boundary case %s", (_label, run, code) => {
    expect(run()).toMatchObject({ ok: false, error: { code } });
  });

  it("масштабирование линейных размеров в k раз даёт k² по площади", () => {
    const k = 3;
    const rectangleBase = calculateRectangleArea(4, 5);
    const rectangleScaled = calculateRectangleArea(4 * k, 5 * k);
    expect(rectangleBase.ok && rectangleScaled.ok).toBe(true);
    if (rectangleBase.ok && rectangleScaled.ok) {
      expect(rectangleScaled.value).toBeCloseTo(rectangleBase.value * k * k, 9);
    }

    const triangleBase = calculateTriangleSidesArea(3, 4, 5);
    const triangleScaled = calculateTriangleSidesArea(3 * k, 4 * k, 5 * k);
    expect(triangleBase.ok && triangleScaled.ok).toBe(true);
    if (triangleBase.ok && triangleScaled.ok) {
      expect(triangleScaled.value).toBeCloseTo(triangleBase.value * k * k, 9);
    }

    const circleBase = calculateCircleArea(2);
    const circleScaled = calculateCircleArea(2 * k);
    expect(circleBase.ok && circleScaled.ok).toBe(true);
    if (circleBase.ok && circleScaled.ok) {
      expect(circleScaled.value).toBeCloseTo(circleBase.value * k * k, 9);
    }

    const trapezoidBase = calculateTrapezoidArea(3, 5, 4);
    const trapezoidScaled = calculateTrapezoidArea(3 * k, 5 * k, 4 * k);
    expect(trapezoidBase.ok && trapezoidScaled.ok).toBe(true);
    if (trapezoidBase.ok && trapezoidScaled.ok) {
      expect(trapezoidScaled.value).toBeCloseTo(trapezoidBase.value * k * k, 9);
    }
  });
});
