import {
  calculateLaminate,
  type LaminateInput,
  type Length,
} from "../../calculations/construction";
import { describe, expect, it } from "vitest";

const m = (value: number): Length => ({ value, unit: "m" });
const cm = (value: number): Length => ({ value, unit: "cm" });

function laminateInput(
  options: Partial<{
    roomLength: Length;
    roomWidth: Length;
    packAreaM2: number;
    reservePercent: number;
  }> = {},
): LaminateInput {
  return {
    room: {
      length: options.roomLength ?? m(5),
      width: options.roomWidth ?? m(4),
    },
    packAreaM2: options.packAreaM2 ?? 2.131,
    reservePercent: options.reservePercent ?? 5,
  };
}

describe("laminate area and packs", () => {
  it.each([
    [
      laminateInput(),
      { theoreticalAreaM2: 20, areaWithReserveM2: 21, packsToBuy: 10 },
    ],
    [
      laminateInput({ reservePercent: 0 }),
      { theoreticalAreaM2: 20, areaWithReserveM2: 20, packsToBuy: 10 },
    ],
    [
      laminateInput({
        roomLength: m(4),
        roomWidth: m(2),
        packAreaM2: 2,
        reservePercent: 0,
      }),
      { theoreticalAreaM2: 8, areaWithReserveM2: 8, packsToBuy: 4 },
    ],
  ] satisfies readonly (readonly [
    LaminateInput,
    Partial<Record<string, number>>,
  ])[])(
    "golden: computes room area, reserve and package ceiling %#",
    (input, expected) => {
      const result = calculateLaminate(input);
      expect(result?.theoreticalAreaM2).toBeCloseTo(
        expected.theoreticalAreaM2 as number,
        9,
      );
      expect(result?.areaWithReserveM2).toBeCloseTo(
        expected.areaWithReserveM2 as number,
        9,
      );
      expect(result?.packsToBuy).toBe(expected.packsToBuy);
    },
  );

  it.each([
    [laminateInput({ reservePercent: 10 }), 22, 11],
    [laminateInput({ reservePercent: 20 }), 24, 12],
    [laminateInput({ roomLength: m(3), roomWidth: m(3) }), 9.45, 5],
    [laminateInput({ packAreaM2: 1 }), 21, 21],
    [laminateInput({ packAreaM2: 5 }), 21, 5],
    [laminateInput({ packAreaM2: 0.5 }), 21, 42],
    [laminateInput({ roomLength: cm(500), roomWidth: cm(400) }), 21, 10],
    [laminateInput({ roomLength: m(10), roomWidth: m(8) }), 84, 40],
    [laminateInput({ reservePercent: 100 }), 40, 19],
    [laminateInput({ packAreaM2: 2.5, reservePercent: 0 }), 20, 8],
  ])("domain: ceiling packages for %#", (input, areaWithReserve, packs) => {
    const result = calculateLaminate(input);
    expect(result?.areaWithReserveM2).toBeCloseTo(areaWithReserve, 9);
    expect(result?.packsToBuy).toBe(packs);
    expect(result?.packsToBuy).toBeGreaterThanOrEqual(
      (result?.areaWithReserveM2 as number) / (result?.packAreaM2 as number),
    );
  });

  it.each([
    laminateInput({ roomLength: m(0) }),
    laminateInput({ roomWidth: m(-1) }),
    laminateInput({ packAreaM2: 0.4 }),
    laminateInput({ packAreaM2: 5.1 }),
    laminateInput({ reservePercent: -1 }),
    laminateInput({ reservePercent: 101 }),
  ])("invalid/boundary: rejects bad laminate input %#", (input) => {
    expect(calculateLaminate(input)).toBeNull();
  });

  it("does not overbuy a pack for a decimal-exact area", () => {
    const result = calculateLaminate(
      laminateInput({
        roomLength: m(4),
        roomWidth: m(2),
        packAreaM2: 2,
        reservePercent: 0,
      }),
    );
    expect(result?.theoreticalAreaM2).toBeCloseTo(8, 12);
    expect(result?.packsToBuy).toBe(4);
  });

  it("keeps theoretical area separate from reserve and is monotonic", () => {
    const base = calculateLaminate(laminateInput({ reservePercent: 0 }));
    const reserved = calculateLaminate(laminateInput({ reservePercent: 25 }));
    expect(base?.theoreticalAreaM2).toBeCloseTo(
      reserved?.theoreticalAreaM2 as number,
      9,
    );
    expect(reserved?.areaWithReserveM2).toBeGreaterThan(
      base?.areaWithReserveM2 as number,
    );
    expect(reserved?.packsToBuy).toBeGreaterThanOrEqual(
      base?.packsToBuy as number,
    );
  });
});
