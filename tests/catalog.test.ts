import { describe, expect, it } from "vitest";
import { calculators, getCalculator } from "../lib/catalog";

describe("calculator catalog", () => {
  it("contains only unique public ids", () => {
    const ids = calculators.map((calculator) => calculator.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(0);
  });

  it("resolves every published calculator by id", () => {
    for (const calculator of calculators) {
      expect(getCalculator(calculator.id)).toEqual(calculator);
    }
  });

  it("does not resolve unknown ids", () => {
    expect(getCalculator("unknown")).toBeUndefined();
    expect(getCalculator("equations")).toBeUndefined();
  });
});
