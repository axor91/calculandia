import {
  calculatePaint,
  type Length,
  type Opening,
  type PaintInput,
} from "../../calculations/construction";
import { describe, expect, it } from "vitest";

const m = (value: number): Length => ({ value, unit: "m" });
const cm = (value: number): Length => ({ value, unit: "cm" });

function opening(width: Length, height: Length, count = 1): Opening {
  return { width, height, count };
}

function paintInput(
  options: Partial<{
    roomLength: Length;
    roomWidth: Length;
    wallHeight: Length;
    openings: readonly Opening[];
    coveragePerLayerLPerM2: number;
    layers: number;
    canVolumeL: number;
    reservePercent: number;
  }> = {},
): PaintInput {
  return {
    room: {
      length: options.roomLength ?? m(5),
      width: options.roomWidth ?? m(4),
      wallHeight: options.wallHeight ?? m(2.7),
    },
    openings: options.openings ?? [],
    coveragePerLayerLPerM2: options.coveragePerLayerLPerM2 ?? 0.1,
    layers: options.layers ?? 2,
    canVolumeL: options.canVolumeL ?? 2.5,
    reservePercent: options.reservePercent ?? 5,
  };
}

describe("paint coverage and cans", () => {
  it.each([
    [
      paintInput({
        openings: [opening(m(0.9), m(2.1)), opening(m(1.5), m(1.4))],
      }),
      {
        theoreticalAreaM2: 44.61,
      },
    ],
    [
      paintInput({ reservePercent: 0 }),
      {
        theoreticalAreaM2: 48.6,
      },
    ],
    [
      paintInput({ roomLength: m(3), roomWidth: m(3), reservePercent: 0 }),
      {
        theoreticalAreaM2: 2 * (3 + 3) * 2.7,
      },
    ],
  ] satisfies readonly (readonly [
    PaintInput,
    Partial<Record<string, number>>,
  ])[])("golden: computes wall area, litres and cans %#", (input, expected) => {
    const result = calculatePaint(input);
    expect(result?.theoreticalAreaM2).toBeCloseTo(
      expected.theoreticalAreaM2 as number,
      9,
    );
  });

  it("golden: door and window deduction yields the documented cans", () => {
    const result = calculatePaint(
      paintInput({
        openings: [opening(m(0.9), m(2.1)), opening(m(1.5), m(1.4))],
      }),
    );
    expect(result?.perimeterM).toBeCloseTo(18, 12);
    expect(result?.grossWallAreaM2).toBeCloseTo(48.6, 12);
    expect(result?.openingsAreaM2).toBeCloseTo(3.99, 12);
    expect(result?.theoreticalAreaM2).toBeCloseTo(44.61, 9);
    expect(result?.theoreticalLitres).toBeCloseTo(8.922, 9);
    expect(result?.litresWithReserve).toBeCloseTo(9.3681, 9);
    expect(result?.cansToBuy).toBe(4);
  });

  it("golden: zero reserve keeps theoretical and with-reserve litres equal", () => {
    const result = calculatePaint(paintInput({ reservePercent: 0 }));
    expect(result?.theoreticalLitres).toBeCloseTo(9.72, 9);
    expect(result?.litresWithReserve).toBeCloseTo(9.72, 9);
    expect(result?.cansToBuy).toBe(4);
  });

  it.each([
    [paintInput({ layers: 1 }), 4.86],
    [paintInput({ layers: 3 }), 14.58],
    [paintInput({ coveragePerLayerLPerM2: 0.2 }), 19.44],
    [paintInput({ roomLength: cm(500), roomWidth: cm(400) }), 9.72],
    [paintInput({ canVolumeL: 5 }), 9.72],
    [paintInput({ canVolumeL: 10 }), 9.72],
    [paintInput({ reservePercent: 10 }), 9.72],
    [paintInput({ reservePercent: 50 }), 9.72],
    [paintInput({ layers: 5 }), 24.3],
    [
      paintInput({
        openings: [opening(m(1), m(2), 2)],
      }),
      8.92,
    ],
  ])("domain: unrounded theoretical litres for %#", (input, litres) => {
    const result = calculatePaint(input);
    expect(result?.theoreticalLitres).toBeCloseTo(litres, 9);
    expect(result?.litresWithReserve).toBeGreaterThanOrEqual(
      result?.theoreticalLitres as number,
    );
    expect(result?.cansToBuy).toBeGreaterThanOrEqual(
      (result?.litresWithReserve as number) / (result?.canVolumeL as number),
    );
  });

  it.each([
    paintInput({ roomLength: m(0) }),
    paintInput({ wallHeight: m(-1) }),
    paintInput({ coveragePerLayerLPerM2: 0.04 }),
    paintInput({ coveragePerLayerLPerM2: 0.51 }),
    paintInput({ layers: 0 }),
    paintInput({ layers: 6 }),
    paintInput({ layers: 1.5 }),
    paintInput({ canVolumeL: 0.4 }),
    paintInput({ canVolumeL: 21 }),
    paintInput({ reservePercent: -1 }),
    paintInput({ reservePercent: 51 }),
    paintInput({ openings: [opening(m(20), m(2.5))] }),
    paintInput({ openings: [opening(m(1), m(1), 0)] }),
  ])("invalid/boundary: rejects bad paint input %#", (input) => {
    expect(calculatePaint(input)).toBeNull();
  });

  it("keeps theoretical litres separate from reserve and is monotonic", () => {
    const base = calculatePaint(paintInput({ reservePercent: 0 }));
    const reserved = calculatePaint(paintInput({ reservePercent: 20 }));
    expect(base?.theoreticalLitres).toBeCloseTo(
      reserved?.theoreticalLitres as number,
      9,
    );
    expect(reserved?.litresWithReserve).toBeGreaterThan(
      base?.litresWithReserve as number,
    );
    expect(reserved?.cansToBuy).toBeGreaterThanOrEqual(
      base?.cansToBuy as number,
    );
  });

  it("does not overbuy a can for a decimal-exact volume", () => {
    const result = calculatePaint(
      paintInput({
        roomLength: m(2),
        roomWidth: m(2),
        wallHeight: m(2.5),
        coveragePerLayerLPerM2: 0.1,
        layers: 1,
        canVolumeL: 2,
        reservePercent: 0,
      }),
    );
    expect(result?.theoreticalLitres).toBeCloseTo(2, 9);
    expect(result?.cansToBuy).toBe(1);
  });

  it("explicit opening reduces the painted area versus no opening", () => {
    const plain = calculatePaint(paintInput());
    const withOpening = calculatePaint(
      paintInput({ openings: [opening(m(1), m(2))] }),
    );
    expect(withOpening?.theoreticalAreaM2).toBeLessThan(
      plain?.theoreticalAreaM2 as number,
    );
    expect(withOpening?.openingsAreaM2).toBeCloseTo(2, 12);
  });
});
