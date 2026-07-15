import {
  calculateConcrete,
  calculateTile,
  calculateWallpaper,
  ceilDecimalRatio,
  ceilQuantity,
  floorQuantity,
  lengthToMetres,
  type ConcreteInput,
  type Length,
  type Opening,
  type TileInput,
  type WallpaperInput,
} from "../../calculations/construction";
import { describe, expect, it } from "vitest";

const m = (value: number): Length => ({ value, unit: "m" });
const cm = (value: number): Length => ({ value, unit: "cm" });
const mm = (value: number): Length => ({ value, unit: "mm" });

function opening(width: Length, height: Length, count = 1): Opening {
  return { width, height, count };
}

function tileInput(
  options: Partial<{
    surfaceWidth: Length;
    surfaceHeight: Length;
    surfaceCount: number;
    tileWidth: Length;
    tileHeight: Length;
    openings: readonly Opening[];
    reservePercent: number;
    piecesPerBox: number;
  }> = {},
): TileInput {
  return {
    surface: {
      width: options.surfaceWidth ?? m(4),
      height: options.surfaceHeight ?? m(2.5),
      count: options.surfaceCount ?? 1,
    },
    tile: {
      width: options.tileWidth ?? m(0.5),
      height: options.tileHeight ?? m(0.5),
    },
    openings: options.openings ?? [],
    reservePercent: options.reservePercent ?? 10,
    piecesPerBox: options.piecesPerBox ?? 8,
  };
}

function wallpaperInput(
  options: Partial<{
    roomLength: Length;
    roomWidth: Length;
    wallHeight: Length;
    rollWidth: Length;
    rollLength: Length;
    patternRepeat: Length;
    trimAllowance: Length;
    openings: readonly Opening[];
    reservePercent: number;
  }> = {},
): WallpaperInput {
  return {
    room: {
      length: options.roomLength ?? m(4),
      width: options.roomWidth ?? m(3),
      wallHeight: options.wallHeight ?? m(2.5),
    },
    roll: {
      width: options.rollWidth ?? m(1),
      length: options.rollLength ?? m(10),
    },
    patternRepeat: options.patternRepeat ?? m(0),
    trimAllowance: options.trimAllowance ?? m(0),
    openings: options.openings ?? [],
    reservePercent: options.reservePercent ?? 0,
  };
}

describe("SI length normalization", () => {
  it("never rounds a fractional material quantity down at large values", () => {
    expect(ceilQuantity(1_000_000_000_000.5)).toBe(1_000_000_000_001);
    expect(ceilQuantity(1_000_000_000_000.0005)).toBe(1_000_000_000_001);
    expect(floorQuantity(999_999_999_999.9995)).toBe(999_999_999_999);
  });
  it("uses decimal ratios for exact material division without ULP overbuy", () => {
    expect(ceilDecimalRatio(2.7, 0.09)).toBe(30);
    expect(ceilDecimalRatio(30.000000001, 1)).toBe(31);
    expect(ceilDecimalRatio(999_999_999_990_001, 10_000)).toBe(100_000_000_000);
  });
  it.each([
    [m(1), 1],
    [cm(100), 1],
    [mm(1000), 1],
    [cm(250), 2.5],
    [mm(1), 0.001],
  ])("normalizes %j to metres", (input, expected) => {
    expect(lengthToMetres(input)).toBeCloseTo(expected, 12);
  });

  it.each([
    [m(0), undefined],
    [m(-1), undefined],
    [m(Number.NaN), undefined],
    [m(Number.POSITIVE_INFINITY), undefined],
    [{ value: 1, unit: "ft" } as unknown as Length, undefined],
    [m(10_001), undefined],
  ])("rejects an invalid dimension %j", (input) => {
    expect(lengthToMetres(input)).toBeNull();
  });

  it("allows an explicit zero only for a zero pattern repeat", () => {
    expect(lengthToMetres(m(0), { allowZero: true })).toBe(0);
  });
});

describe("concrete volume", () => {
  it.each([
    [
      {
        shape: "rectangular",
        length: m(4),
        width: m(3),
        height: m(0.2),
        count: 1,
        reservePercent: 10,
      },
      2.4,
      2.64,
    ],
    [
      {
        shape: "cylinder",
        diameter: m(2),
        height: m(3),
        count: 2,
        reservePercent: 0,
      },
      6 * Math.PI,
      6 * Math.PI,
    ],
    [
      {
        shape: "rectangular",
        length: cm(200),
        width: cm(100),
        height: mm(100),
        count: 1,
        reservePercent: 0,
      },
      0.2,
      0.2,
    ],
  ] satisfies readonly (readonly [ConcreteInput, number, number])[])(
    "golden: computes geometry and visible reserve for %#",
    (input, theoretical, withReserve) => {
      const result = calculateConcrete(input);
      expect(result?.theoreticalVolumeM3).toBeCloseTo(theoretical, 12);
      expect(result?.volumeWithReserveM3).toBeCloseTo(withReserve, 12);
      expect(result?.reserveVolumeM3).toBeCloseTo(
        withReserve - theoretical,
        12,
      );
    },
  );

  it.each([
    [
      {
        shape: "rectangular",
        length: m(1),
        width: m(1),
        height: m(1),
        count: 1,
        reservePercent: 0,
      },
      1,
    ],
    [
      {
        shape: "rectangular",
        length: mm(1000),
        width: cm(100),
        height: m(1),
        count: 1,
        reservePercent: 5,
      },
      1,
    ],
    [
      {
        shape: "rectangular",
        length: m(2),
        width: m(2),
        height: m(2),
        count: 3,
        reservePercent: 0,
      },
      24,
    ],
    [
      {
        shape: "rectangular",
        length: m(0.1),
        width: m(0.2),
        height: m(0.3),
        count: 1,
        reservePercent: 25,
      },
      0.006,
    ],
    [
      {
        shape: "cylinder",
        diameter: m(2),
        height: m(1),
        count: 1,
        reservePercent: 0,
      },
      Math.PI,
    ],
    [
      {
        shape: "cylinder",
        diameter: m(1),
        height: m(4),
        count: 2,
        reservePercent: 10,
      },
      2 * Math.PI,
    ],
    [
      {
        shape: "cylinder",
        diameter: cm(10),
        height: m(1),
        count: 1,
        reservePercent: 0,
      },
      Math.PI * 0.05 ** 2,
    ],
    [
      {
        shape: "rectangular",
        length: m(5),
        width: m(0.4),
        height: m(0.6),
        count: 10,
        reservePercent: 15,
      },
      12,
    ],
    [
      {
        shape: "rectangular",
        length: m(1),
        width: m(2),
        height: m(3),
        count: 1,
        reservePercent: 100,
      },
      6,
    ],
    [
      {
        shape: "cylinder",
        diameter: mm(500),
        height: cm(200),
        count: 4,
        reservePercent: 7.5,
      },
      0.5 * Math.PI,
    ],
  ] satisfies readonly (readonly [ConcreteInput, number])[])(
    "domain: returns an unrounded SI theoretical volume for %#",
    (input, theoretical) => {
      const result = calculateConcrete(input);
      expect(result?.theoreticalVolumeM3).toBeCloseTo(theoretical, 10);
      expect(result?.volumeWithReserveM3).toBeGreaterThanOrEqual(
        result?.theoreticalVolumeM3 as number,
      );
    },
  );

  it.each([
    {
      shape: "rectangular",
      length: m(0),
      width: m(1),
      height: m(1),
      count: 1,
      reservePercent: 0,
    },
    {
      shape: "rectangular",
      length: m(1),
      width: m(-1),
      height: m(1),
      count: 1,
      reservePercent: 0,
    },
    {
      shape: "cylinder",
      diameter: m(1),
      height: m(0),
      count: 1,
      reservePercent: 0,
    },
    {
      shape: "cylinder",
      diameter: m(1),
      height: m(1),
      count: 0,
      reservePercent: 0,
    },
    {
      shape: "cylinder",
      diameter: m(1),
      height: m(1),
      count: 1.5,
      reservePercent: 0,
    },
    {
      shape: "cylinder",
      diameter: m(1),
      height: m(1),
      count: 1,
      reservePercent: -1,
    },
    {
      shape: "cylinder",
      diameter: m(1),
      height: m(1),
      count: 1,
      reservePercent: 101,
    },
    {
      shape: "cone",
      diameter: m(1),
      height: m(1),
      count: 1,
      reservePercent: 0,
    },
  ])("invalid/boundary: rejects bad concrete input %#", (input) => {
    expect(calculateConcrete(input as ConcreteInput)).toBeNull();
  });

  it("is linear in count and monotonic in reserve", () => {
    const base: ConcreteInput = {
      shape: "rectangular",
      length: m(2),
      width: m(3),
      height: m(0.5),
      count: 1,
      reservePercent: 0,
    };
    const one = calculateConcrete(base) as NonNullable<
      ReturnType<typeof calculateConcrete>
    >;
    const four = calculateConcrete({ ...base, count: 4, reservePercent: 20 });
    expect(four?.theoreticalVolumeM3).toBeCloseTo(
      one.theoreticalVolumeM3 * 4,
      12,
    );
    expect(four?.volumeWithReserveM3).toBeGreaterThan(
      four?.theoreticalVolumeM3 as number,
    );
  });
});

describe("tile quantity and package rounding", () => {
  it("does not buy an extra tile or box for a decimal-exact layout", () => {
    const result = calculateTile(
      tileInput({
        surfaceWidth: m(1),
        surfaceHeight: m(2.7),
        tileWidth: m(0.3),
        tileHeight: m(0.3),
        reservePercent: 0,
        piecesPerBox: 10,
      }),
    );
    expect(result?.theoreticalPieces).toBeCloseTo(30, 12);
    expect(result?.piecesWithReserve).toBe(30);
    expect(result?.boxesToBuy).toBe(3);
    expect(result?.piecesToBuy).toBeGreaterThanOrEqual(
      result?.piecesWithReserve as number,
    );
  });
  it.each([
    [
      tileInput(),
      {
        theoreticalAreaM2: 10,
        piecesWithReserve: 44,
        boxesToBuy: 6,
        piecesToBuy: 48,
      },
    ],
    [
      tileInput({ openings: [opening(m(1), m(2))] }),
      {
        theoreticalAreaM2: 8,
        piecesWithReserve: 36,
        boxesToBuy: 5,
        piecesToBuy: 40,
      },
    ],
    [
      tileInput({
        surfaceWidth: m(2),
        surfaceHeight: m(2),
        tileWidth: cm(20),
        tileHeight: cm(20),
        reservePercent: 0,
        piecesPerBox: 10,
      }),
      {
        theoreticalAreaM2: 4,
        piecesWithReserve: 100,
        boxesToBuy: 10,
        piecesToBuy: 100,
      },
    ],
  ])(
    "golden: calculates net area, reserve, pieces and boxes %#",
    (input, expected) => {
      expect(calculateTile(input)).toMatchObject(expected);
    },
  );

  it.each([
    [tileInput({ reservePercent: 0 }), 40, 5],
    [tileInput({ surfaceWidth: cm(400), surfaceHeight: mm(2500) }), 44, 6],
    [
      tileInput({
        surfaceWidth: m(2),
        surfaceHeight: m(2),
        surfaceCount: 2,
        tileWidth: m(0.4),
        tileHeight: m(0.4),
        reservePercent: 0,
        piecesPerBox: 5,
      }),
      50,
      10,
    ],
    [
      tileInput({
        surfaceWidth: m(1),
        surfaceHeight: m(1),
        tileWidth: m(0.3),
        tileHeight: m(0.3),
        reservePercent: 0,
        piecesPerBox: 6,
      }),
      12,
      2,
    ],
    [
      tileInput({
        surfaceWidth: m(1),
        surfaceHeight: m(1),
        tileWidth: m(1),
        tileHeight: m(1),
        reservePercent: 0,
        piecesPerBox: 1,
      }),
      1,
      1,
    ],
    [tileInput({ reservePercent: 100 }), 80, 10],
    [tileInput({ piecesPerBox: 7, reservePercent: 0 }), 40, 6],
    [
      tileInput({
        openings: [opening(m(1), m(1)), opening(m(0.5), m(2), 2)],
        reservePercent: 0,
      }),
      28,
      4,
    ],
    [
      tileInput({
        surfaceWidth: mm(1000),
        surfaceHeight: mm(1000),
        tileWidth: mm(100),
        tileHeight: mm(100),
        reservePercent: 0,
        piecesPerBox: 20,
      }),
      100,
      5,
    ],
    [
      tileInput({
        surfaceWidth: m(3),
        surfaceHeight: m(3),
        tileWidth: m(0.6),
        tileHeight: m(0.3),
        reservePercent: 20,
        piecesPerBox: 12,
      }),
      60,
      5,
    ],
  ])(
    "domain: ceiling result for pieces and boxes %#",
    (input, pieces, boxes) => {
      const result = calculateTile(input);
      expect(result?.piecesWithReserve).toBe(pieces);
      expect(result?.boxesToBuy).toBe(boxes);
      expect(result?.piecesToBuy).toBe(
        (result?.boxesToBuy as number) * input.piecesPerBox,
      );
      expect(result?.piecesToBuy).toBeGreaterThanOrEqual(
        result?.piecesWithReserve as number,
      );
    },
  );

  it.each([
    tileInput({ surfaceWidth: m(0) }),
    tileInput({ tileHeight: m(-1) }),
    tileInput({ surfaceCount: 0 }),
    tileInput({ piecesPerBox: 0 }),
    tileInput({ reservePercent: -0.1 }),
    tileInput({ reservePercent: 100.1 }),
    tileInput({ openings: [opening(m(4), m(2.5))] }),
    tileInput({ openings: [opening(m(1), m(1), 0)] }),
    tileInput({
      openings: Array.from({ length: 101 }, () => opening(m(0.1), m(0.1))),
    }),
  ])("invalid/boundary: rejects bad tile input %#", (input) => {
    expect(calculateTile(input)).toBeNull();
  });

  it("keeps theoretical area separate and reserve monotonic", () => {
    const base = calculateTile(tileInput({ reservePercent: 0 }));
    const reserved = calculateTile(tileInput({ reservePercent: 15 }));
    expect(base?.theoreticalAreaM2).toBe(reserved?.theoreticalAreaM2);
    expect(reserved?.areaWithReserveM2).toBeGreaterThan(
      base?.areaWithReserveM2 as number,
    );
    expect(reserved?.piecesWithReserve).toBeGreaterThanOrEqual(
      base?.piecesWithReserve as number,
    );
  });
});

describe("wallpaper strips, repeat and roll rounding", () => {
  it("does not add a full repeat because of division noise", () => {
    const result = calculateWallpaper(
      wallpaperInput({
        wallHeight: m(2.7),
        trimAllowance: m(0),
        patternRepeat: m(0.3),
      }),
    );
    expect(result?.cutLengthM).toBeCloseTo(2.7, 12);
    expect(result?.cutLengthM).toBeGreaterThanOrEqual(2.7);
  });
  it("rejects an impractically tiny repeat without throwing", () => {
    const input = wallpaperInput({ patternRepeat: cm(1e-28) });
    expect(() => calculateWallpaper(input)).not.toThrow();
    expect(calculateWallpaper(input)).toBeNull();
  });
  it("adds the explicit mounting allowance before repeat alignment", () => {
    const result = calculateWallpaper(
      wallpaperInput({
        wallHeight: m(2.5),
        trimAllowance: cm(5),
        patternRepeat: cm(64),
      }),
    );
    expect(result?.trimAllowanceM).toBeCloseTo(0.05, 12);
    expect(result?.cutLengthM).toBeCloseTo(2.56, 12);
    expect(result?.stripsPerRoll).toBe(3);
  });
  it.each([
    [
      wallpaperInput(),
      {
        perimeterM: 14,
        theoreticalAreaM2: 35,
        cutLengthM: 2.5,
        stripsPerRoll: 4,
        theoreticalStrips: 14,
        stripsWithReserve: 14,
        rollsToBuy: 4,
      },
    ],
    [
      wallpaperInput({ patternRepeat: m(0.64) }),
      {
        cutLengthM: 2.56,
        stripsPerRoll: 3,
        stripsWithReserve: 14,
        rollsToBuy: 5,
      },
    ],
    [
      wallpaperInput({ openings: [opening(m(2), m(3))] }),
      {
        theoreticalAreaM2: 29,
        theoreticalStrips: 11.6,
        stripsWithReserve: 12,
        rollsToBuy: 3,
      },
    ],
  ])(
    "golden: converts perimeter and usable cuts into roll packages %#",
    (input, expected) => {
      const result = calculateWallpaper(input);
      expect(result).toMatchObject(expected);
      expect(result?.openingDeductionMethod).toBe("area-equivalent");
    },
  );

  it.each([
    [wallpaperInput({ reservePercent: 10 }), 4, 16],
    [
      wallpaperInput({
        roomLength: cm(400),
        roomWidth: cm(300),
        wallHeight: cm(250),
        rollWidth: cm(100),
        rollLength: cm(1000),
      }),
      4,
      14,
    ],
    [
      wallpaperInput({
        roomLength: m(2),
        roomWidth: m(2),
        wallHeight: m(2),
        rollWidth: m(0.5),
        rollLength: m(10),
      }),
      4,
      16,
    ],
    [wallpaperInput({ patternRepeat: m(0.5) }), 4, 14],
    [wallpaperInput({ patternRepeat: m(0.6), rollLength: m(12) }), 4, 14],
    [
      wallpaperInput({
        openings: [opening(m(1), m(2)), opening(m(2), m(1), 2)],
      }),
      3,
      12,
    ],
    [wallpaperInput({ reservePercent: 100 }), 7, 28],
    [wallpaperInput({ rollWidth: m(0.5) }), 7, 28],
    [wallpaperInput({ rollLength: m(5) }), 7, 14],
    [
      wallpaperInput({
        roomLength: mm(4000),
        roomWidth: mm(3000),
        wallHeight: mm(2500),
        rollWidth: mm(1000),
        rollLength: mm(10000),
        patternRepeat: mm(0),
      }),
      4,
      14,
    ],
  ])("domain: returns ceiling roll count %#", (input, rolls, strips) => {
    const result = calculateWallpaper(input);
    expect(result?.rollsToBuy).toBe(rolls);
    expect(result?.stripsWithReserve).toBe(strips);
    expect(result?.rollsToBuy).toBe(
      Math.ceil(
        (result?.stripsWithReserve as number) /
          (result?.stripsPerRoll as number),
      ),
    );
  });

  it.each([
    wallpaperInput({ roomLength: m(0) }),
    wallpaperInput({ wallHeight: m(-1) }),
    wallpaperInput({ rollWidth: m(0) }),
    wallpaperInput({ patternRepeat: m(-0.1) }),
    wallpaperInput({ patternRepeat: m(11) }),
    wallpaperInput({ reservePercent: -1 }),
    wallpaperInput({ reservePercent: 101 }),
    wallpaperInput({ openings: [opening(m(14), m(2.5))] }),
    wallpaperInput({ openings: [opening(m(1), m(1), 0)] }),
  ])("invalid/boundary: rejects bad wallpaper input %#", (input) => {
    expect(calculateWallpaper(input)).toBeNull();
  });

  it("makes reserve/repeat monotonic and openings explicit", () => {
    const plain = calculateWallpaper(wallpaperInput());
    const reserved = calculateWallpaper(wallpaperInput({ reservePercent: 20 }));
    const repeated = calculateWallpaper(
      wallpaperInput({ patternRepeat: m(0.64) }),
    );
    const withOpening = calculateWallpaper(
      wallpaperInput({ openings: [opening(m(2), m(2))] }),
    );

    expect(reserved?.rollsToBuy).toBeGreaterThanOrEqual(
      plain?.rollsToBuy as number,
    );
    expect(repeated?.rollsToBuy).toBeGreaterThanOrEqual(
      plain?.rollsToBuy as number,
    );
    expect(withOpening?.theoreticalAreaM2).toBeLessThan(
      plain?.theoreticalAreaM2 as number,
    );
    expect(withOpening?.openingsAreaM2).toBe(4);
    expect(plain?.cutLengthM).toBeGreaterThanOrEqual(2.5);
    expect(repeated?.cutLengthM).toBeGreaterThanOrEqual(2.5);
  });
});
