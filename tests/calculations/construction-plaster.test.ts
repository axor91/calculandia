import {
  calculatePlaster,
  type PlasterInput,
} from "../../calculations/construction";
import { describe, expect, it } from "vitest";

function plasterInput(
  options: Partial<{
    areaM2: number;
    thicknessMm: number;
    consumptionKgPerM2At10mm: number;
    packageKg: number;
    reservePercent: number;
  }> = {},
): PlasterInput {
  return {
    areaM2: options.areaM2 ?? 20,
    thicknessMm: options.thicknessMm ?? 15,
    consumptionKgPerM2At10mm: options.consumptionKgPerM2At10mm ?? 8.5,
    packageKg: options.packageKg ?? 30,
    reservePercent: options.reservePercent ?? 5,
  };
}

describe("plaster consumption and bags", () => {
  it("golden: 20 m², 15 mm, 8.5 kg/m² at 10 mm, 5% reserve, 30 kg bags", () => {
    const result = calculatePlaster(plasterInput());
    expect(result?.theoreticalKg).toBeCloseTo(255, 9);
    expect(result?.kgWithReserve).toBeCloseTo(267.75, 9);
    expect(result?.bagsToBuy).toBe(9);
  });

  it("golden: zero reserve keeps theoretical and with-reserve kg equal", () => {
    const result = calculatePlaster(plasterInput({ reservePercent: 0 }));
    expect(result?.theoreticalKg).toBeCloseTo(255, 9);
    expect(result?.kgWithReserve).toBeCloseTo(255, 9);
    expect(result?.bagsToBuy).toBe(9);
  });

  it("golden: 10 mm base layer thickness matches the manufacturer rate directly", () => {
    const result = calculatePlaster(plasterInput({ thicknessMm: 10 }));
    expect(result?.theoreticalKg).toBeCloseTo(170, 9);
    expect(result?.kgWithReserve).toBeCloseTo(178.5, 9);
    expect(result?.bagsToBuy).toBe(6);
  });

  it.each([
    [plasterInput({ thicknessMm: 50 }), 850, 892.5, 30],
    [plasterInput({ consumptionKgPerM2At10mm: 4 }), 120, 126, 5],
    [plasterInput({ consumptionKgPerM2At10mm: 20 }), 600, 630, 21],
    [plasterInput({ packageKg: 5 }), 255, 267.75, 54],
    [plasterInput({ packageKg: 50 }), 255, 267.75, 6],
    [plasterInput({ areaM2: 100, thicknessMm: 10 }), 850, 892.5, 30],
    [plasterInput({ reservePercent: 100 }), 255, 510, 17],
    [
      plasterInput({
        areaM2: 10,
        thicknessMm: 10,
        consumptionKgPerM2At10mm: 9,
        reservePercent: 0,
        packageKg: 30,
      }),
      90,
      90,
      3,
    ],
    [plasterInput({ areaM2: 1 }), 12.75, 13.3875, 1],
    [
      plasterInput({
        areaM2: 0.5,
        thicknessMm: 5,
        consumptionKgPerM2At10mm: 4,
        reservePercent: 0,
      }),
      1,
      1,
      1,
    ],
  ])("domain: ceiling bags for %#", (input, theoretical, withReserve, bags) => {
    const result = calculatePlaster(input);
    expect(result?.theoreticalKg).toBeCloseTo(theoretical, 9);
    expect(result?.kgWithReserve).toBeCloseTo(withReserve, 9);
    expect(result?.bagsToBuy).toBe(bags);
    expect(result?.bagsToBuy).toBeGreaterThanOrEqual(
      (result?.kgWithReserve as number) / (result?.packageKg as number),
    );
  });

  it.each([
    plasterInput({ areaM2: 0 }),
    plasterInput({ areaM2: -1 }),
    plasterInput({ thicknessMm: 4 }),
    plasterInput({ thicknessMm: 51 }),
    plasterInput({ consumptionKgPerM2At10mm: 3.9 }),
    plasterInput({ consumptionKgPerM2At10mm: 20.1 }),
    plasterInput({ packageKg: 4 }),
    plasterInput({ packageKg: 51 }),
    plasterInput({ reservePercent: -1 }),
    plasterInput({ reservePercent: 101 }),
  ])("invalid/boundary: rejects bad plaster input %#", (input) => {
    expect(calculatePlaster(input)).toBeNull();
  });

  it("does not overbuy a bag for a decimal-exact weight", () => {
    const result = calculatePlaster(
      plasterInput({
        areaM2: 10,
        thicknessMm: 10,
        consumptionKgPerM2At10mm: 9,
        reservePercent: 0,
        packageKg: 30,
      }),
    );
    expect(result?.theoreticalKg).toBeCloseTo(90, 9);
    expect(result?.bagsToBuy).toBe(3);
  });

  it("keeps theoretical kg separate from reserve and is monotonic", () => {
    const base = calculatePlaster(plasterInput({ reservePercent: 0 }));
    const reserved = calculatePlaster(plasterInput({ reservePercent: 30 }));
    expect(base?.theoreticalKg).toBeCloseTo(
      reserved?.theoreticalKg as number,
      9,
    );
    expect(reserved?.kgWithReserve).toBeGreaterThan(
      base?.kgWithReserve as number,
    );
    expect(reserved?.bagsToBuy).toBeGreaterThanOrEqual(
      base?.bagsToBuy as number,
    );
  });
});
