import { describe, expect, it } from "vitest";

import { calculateCompoundInterest } from "../../calculations/finance/compound-interest";
import { FinanceValidationError } from "../../calculations/finance/validation";

function expectFinanceClose(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(
    Math.max(1e-9, Math.abs(expected) * 1e-9),
  );
}

describe("compound interest", () => {
  it("matches three independent golden fixtures", () => {
    const monthly = calculateCompoundInterest({
      principal: 100_000,
      annualRate: 12,
      months: 12,
      frequency: "monthly",
    });
    expectFinanceClose(monthly.futureValue, 112_682.50301319698);
    expectFinanceClose(monthly.income, 12_682.50301319698);

    const quarterly = calculateCompoundInterest({
      principal: 100_000,
      annualRate: 12,
      months: 12,
      frequency: "quarterly",
    });
    expectFinanceClose(quarterly.futureValue, 112_550.881);
    expectFinanceClose(quarterly.income, 12_550.881);

    const yearly = calculateCompoundInterest({
      principal: 100_000,
      annualRate: 12,
      months: 12,
      frequency: "yearly",
    });
    expectFinanceClose(yearly.futureValue, 112_000);
    expectFinanceClose(yearly.income, 12_000);
  });

  it("matches the effective annual rate golden fixture", () => {
    const monthly = calculateCompoundInterest({
      principal: 100_000,
      annualRate: 12,
      months: 12,
      frequency: "monthly",
    });
    expectFinanceClose(monthly.effectiveAnnualRate, 12.682503013196978);
  });

  it.each([
    [1, 0, 1, "monthly"],
    [1, 0, 12, "yearly"],
    [100_000, 5, 12, "monthly"],
    [100_000, 5, 12, "quarterly"],
    [100_000, 5, 12, "yearly"],
    [999_999.99, 0.01, 24, "monthly"],
    [1_000_000_000_000_000, 0, 600, "monthly"],
    [250_000, 7.25, 36, "quarterly"],
    [250_000, 100, 120, "yearly"],
    [10_000, 12, 600, "monthly"],
  ] as const)(
    "supports domain case principal=%s rate=%s months=%s frequency=%s",
    (principal, annualRate, months, frequency) => {
      const result = calculateCompoundInterest({
        principal,
        annualRate,
        months,
        frequency,
      });

      expect(Number.isFinite(result.futureValue)).toBe(true);
      expect(result.futureValue).toBeGreaterThanOrEqual(principal);
      expect(result.income).toBeGreaterThanOrEqual(0);
    },
  );

  it.each([
    { principal: 0, annualRate: 12, months: 12, frequency: "monthly" },
    { principal: -1, annualRate: 12, months: 12, frequency: "monthly" },
    {
      principal: 1_000_000_000_000_001,
      annualRate: 12,
      months: 12,
      frequency: "monthly",
    },
    { principal: 100_000, annualRate: -1, months: 12, frequency: "monthly" },
    {
      principal: 100_000,
      annualRate: 1_001,
      months: 12,
      frequency: "monthly",
    },
    { principal: 100_000, annualRate: 12, months: 0, frequency: "monthly" },
    { principal: 100_000, annualRate: 12, months: 601, frequency: "monthly" },
    {
      principal: 100_000,
      annualRate: 12,
      months: 13,
      frequency: "quarterly",
    },
    { principal: 100_000, annualRate: 12, months: 13, frequency: "yearly" },
    { principal: 100_000, annualRate: 12, months: 10, frequency: "yearly" },
  ] as const)("rejects invalid or boundary input %#", (input) => {
    expect(() => calculateCompoundInterest(input)).toThrow();
  });

  it("rejects an unsupported capitalization frequency", () => {
    expect(() =>
      calculateCompoundInterest({
        principal: 100_000,
        annualRate: 12,
        months: 12,
        frequency: "weekly" as "monthly",
      }),
    ).toThrow(TypeError);
  });

  it("keeps the future value equal to the principal at a zero rate", () => {
    for (const frequency of ["monthly", "quarterly", "yearly"] as const) {
      const result = calculateCompoundInterest({
        principal: 50_000,
        annualRate: 0,
        months: 12,
        frequency,
      });
      expect(result.futureValue).toBe(50_000);
      expect(result.income).toBe(0);
      expect(result.effectiveAnnualRate).toBe(0);
    }
  });

  it("is monotonic in principal, rate, and term", () => {
    const base = {
      principal: 100_000,
      annualRate: 10,
      months: 12,
      frequency: "monthly",
    } as const;
    const baseFv = calculateCompoundInterest(base).futureValue;

    expect(
      calculateCompoundInterest({ ...base, principal: 110_000 }).futureValue,
    ).toBeGreaterThan(baseFv);
    expect(
      calculateCompoundInterest({ ...base, annualRate: 11 }).futureValue,
    ).toBeGreaterThan(baseFv);
    expect(
      calculateCompoundInterest({ ...base, months: 24 }).futureValue,
    ).toBeGreaterThan(baseFv);
  });

  it("gives more frequent capitalization a higher future value at the same nominal rate", () => {
    const monthly = calculateCompoundInterest({
      principal: 100_000,
      annualRate: 12,
      months: 12,
      frequency: "monthly",
    }).futureValue;
    const quarterly = calculateCompoundInterest({
      principal: 100_000,
      annualRate: 12,
      months: 12,
      frequency: "quarterly",
    }).futureValue;
    const yearly = calculateCompoundInterest({
      principal: 100_000,
      annualRate: 12,
      months: 12,
      frequency: "yearly",
    }).futureValue;

    expect(monthly).toBeGreaterThan(quarterly);
    expect(quarterly).toBeGreaterThan(yearly);
  });

  it("rejects a term that is not a whole multiple of the capitalization period", () => {
    expect(() =>
      calculateCompoundInterest({
        principal: 100_000,
        annualRate: 12,
        months: 10,
        frequency: "quarterly",
      }),
    ).toThrow(FinanceValidationError);
    expect(() =>
      calculateCompoundInterest({
        principal: 100_000,
        annualRate: 12,
        months: 18,
        frequency: "yearly",
      }),
    ).toThrow(FinanceValidationError);
  });
});
