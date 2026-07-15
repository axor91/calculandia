import { describe, it, expect } from "vitest";
import { calculateMortgage } from "../logic/mortgage";

describe("mortgage logic", () => {
  it("returns null for invalid inputs and non-positive values", () => {
    expect(calculateMortgage(NaN as unknown as number, 0, 10, 20)).toBeNull();
    expect(calculateMortgage(1, NaN as unknown as number, 10, 20)).toBeNull();
    expect(calculateMortgage(1, 0, NaN as unknown as number, 20)).toBeNull();
    expect(calculateMortgage(1, 0, 10, NaN as unknown as number)).toBeNull();
    expect(calculateMortgage(-1, 0, 10, 20)).toBeNull();
    expect(calculateMortgage(100, -1, 10, 20)).toBeNull();
    expect(calculateMortgage(100, 0, 0, 20)).toBeNull();
    expect(calculateMortgage(100, 0, 10, 0)).toBeNull();
  });

  it("returns null when initial payment >= price", () => {
    expect(calculateMortgage(1000, 1000, 10, 10)).toBeNull();
    expect(calculateMortgage(1000, 1500, 10, 10)).toBeNull();
  });

  it("calculates monthly payment with annuity formula", () => {
    const result = calculateMortgage(1_000_000, 200_000, 12, 20);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.loanAmount).toBe(800_000);
      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.totalPayment).toBeCloseTo(result.monthlyPayment * 240, 6);
      expect(result.overpayment).toBeCloseTo(
        result.totalPayment - result.loanAmount,
        6,
      );
    }
  });
});
