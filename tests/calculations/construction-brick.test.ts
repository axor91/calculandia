import {
  calculateBrick,
  type BrickInput,
  type Length,
  type Opening,
} from "../../calculations/construction";
import { describe, expect, it } from "vitest";

const m = (value: number): Length => ({ value, unit: "m" });
const cm = (value: number): Length => ({ value, unit: "cm" });

function opening(width: Length, height: Length, count = 1): Opening {
  return { width, height, count };
}

function brickInput(
  options: Partial<{
    wallLength: Length;
    wallHeight: Length;
    openings: readonly Opening[];
    wallThicknessM: number;
    format: BrickInput["format"];
    jointMm: number;
    reservePercent: number;
  }> = {},
): BrickInput {
  return {
    wall: {
      length: options.wallLength ?? m(5),
      height: options.wallHeight ?? m(3),
    },
    openings: options.openings ?? [],
    wallThicknessM: options.wallThicknessM ?? 0.25,
    format: options.format ?? "single",
    jointMm: options.jointMm ?? 10,
    reservePercent: options.reservePercent ?? 5,
  };
}

describe("brick masonry volume and packaging", () => {
  it("golden: single brick, 1-brick wall, 10mm joint, 5% reserve", () => {
    const result = calculateBrick(brickInput());
    expect(result?.wallAreaM2).toBeCloseTo(15, 12);
    expect(result?.masonryVolumeM3).toBeCloseTo(3.75, 12);
    expect(result?.brickVolumeWithJointM3).toBeCloseTo(0.002535, 12);
    expect(result?.bricksPerM3).toBeCloseTo(1 / 0.002535, 6);
    expect(result?.theoreticalBricks).toBe(1480);
    expect(result?.bricksWithReserve).toBe(1554);
  });

  it("golden: half-brick wall thickness reduces the masonry volume", () => {
    const result = calculateBrick(brickInput({ wallThicknessM: 0.12 }));
    expect(result?.masonryVolumeM3).toBeCloseTo(1.8, 9);
    expect(result?.theoreticalBricks).toBe(711);
    expect(result?.bricksWithReserve).toBe(747);
  });

  it("golden: two-brick wall thickness with double format", () => {
    const result = calculateBrick(
      brickInput({ wallThicknessM: 0.51, format: "double" }),
    );
    expect(result?.masonryVolumeM3).toBeCloseTo(7.65, 9);
    expect(result?.brickVolumeWithJointM3).toBeCloseTo(0.0050024, 9);
    expect(result?.theoreticalBricks).toBe(1530);
    expect(result?.bricksWithReserve).toBe(1607);
  });

  it.each([
    [brickInput({ format: "oneAndHalf" }), 1133, 1190],
    [brickInput({ format: "double" }), 750, 788],
    [brickInput({ jointMm: 5 }), 1681, 1766],
    [brickInput({ jointMm: 15 }), 1311, 1377],
    [brickInput({ reservePercent: 0 }), 1480, 1480],
    [brickInput({ reservePercent: 20 }), 1480, 1776],
    [brickInput({ openings: [opening(m(1), m(2))] }), 1283, 1348],
    [brickInput({ wallLength: cm(500), wallHeight: cm(300) }), 1480, 1554],
    [brickInput({ wallThicknessM: 0.38 }), 2249, 2362],
    [
      brickInput({
        wallLength: m(10),
        wallHeight: m(3),
        wallThicknessM: 0.38,
        format: "oneAndHalf",
        reservePercent: 10,
      }),
      3442,
      3787,
    ],
  ])(
    "domain: ceiling brick count with reserve for %#",
    (input, theoretical, withReserve) => {
      const result = calculateBrick(input);
      expect(result?.theoreticalBricks).toBe(theoretical);
      expect(result?.bricksWithReserve).toBe(withReserve);
      expect(result?.bricksWithReserve).toBeGreaterThanOrEqual(
        result?.theoreticalBricks as number,
      );
    },
  );

  it.each([
    brickInput({ wallLength: m(0) }),
    brickInput({ wallHeight: m(-1) }),
    brickInput({ wallThicknessM: 0.2 }),
    brickInput({ jointMm: 4 }),
    brickInput({ jointMm: 16 }),
    brickInput({ reservePercent: -1 }),
    brickInput({ reservePercent: 101 }),
    brickInput({ format: "triple" as BrickInput["format"] }),
    brickInput({ openings: [opening(m(5), m(3))] }),
    brickInput({ openings: [opening(m(1), m(1), 0)] }),
  ])("invalid/boundary: rejects bad brick input %#", (input) => {
    expect(calculateBrick(input)).toBeNull();
  });

  it("matches the documented ~394 bricks/m³ reference for a single-brick, 10mm-joint wall", () => {
    const result = calculateBrick(brickInput({ wallThicknessM: 0.25 }));
    expect(result?.bricksPerM3).toBeCloseTo(394.48, 1);
  });

  it("keeps theoretical count separate from reserve and is monotonic", () => {
    const base = calculateBrick(brickInput({ reservePercent: 0 }));
    const reserved = calculateBrick(brickInput({ reservePercent: 15 }));
    expect(base?.theoreticalBricks).toBe(reserved?.theoreticalBricks);
    expect(reserved?.bricksWithReserve).toBeGreaterThanOrEqual(
      base?.bricksWithReserve as number,
    );
  });

  it("explicit opening reduces the wall area and never increases brick count", () => {
    const plain = calculateBrick(brickInput());
    const withOpening = calculateBrick(
      brickInput({ openings: [opening(m(1), m(2))] }),
    );
    expect(withOpening?.wallAreaM2).toBeLessThan(plain?.wallAreaM2 as number);
    expect(withOpening?.theoreticalBricks).toBeLessThanOrEqual(
      plain?.theoreticalBricks as number,
    );
  });
});
