import { describe, expect, it } from "vitest";

import { calculateRefinance } from "../../calculations/finance/refinance";
import { FinanceValidationError } from "../../calculations/finance/validation";

function expectFinanceClose(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(
    Math.max(1e-9, Math.abs(expected) * 1e-9),
  );
}

function sumInterest(schedule: readonly { interest: number }[]): number {
  return schedule.reduce((total, row) => total + row.interest, 0);
}

describe("refinance", () => {
  it("matches three independent golden fixtures", () => {
    const beneficial = calculateRefinance({
      currentBalance: 1_000_000,
      currentAnnualRate: 12,
      remainingMonths: 12,
      newAnnualRate: 6,
      newMonths: 12,
      fee: 5_000,
    });
    expectFinanceClose(beneficial.current.monthlyPayment!, 88_848.7886783417);
    expectFinanceClose(beneficial.current.totalInterest, 66_185.46414010052);
    expectFinanceClose(
      beneficial.refinanced.monthlyPayment!,
      86_066.42970708237,
    );
    expectFinanceClose(beneficial.refinanced.totalInterest, 32_797.15648496739);
    expectFinanceClose(beneficial.savings, 28_388.307655133132);
    expect(beneficial.isBeneficial).toBe(true);

    const worse = calculateRefinance({
      currentBalance: 1_000_000,
      currentAnnualRate: 12,
      remainingMonths: 12,
      newAnnualRate: 20,
      newMonths: 12,
      fee: 5_000,
    });
    expectFinanceClose(worse.refinanced.totalInterest, 111_614.07076496014);
    expectFinanceClose(worse.savings, -50_428.60662485962);
    expect(worse.isBeneficial).toBe(false);

    const zeroRate = calculateRefinance({
      currentBalance: 500_000,
      currentAnnualRate: 0,
      remainingMonths: 12,
      newAnnualRate: 0,
      newMonths: 12,
      fee: 0,
    });
    expectFinanceClose(zeroRate.current.monthlyPayment!, 41_666.666666666664);
    expect(zeroRate.current.totalInterest).toBe(0);
    expect(zeroRate.refinanced.totalInterest).toBe(0);
    expectFinanceClose(zeroRate.savings, 0);
  });

  it.each([
    [1_000_000, 12, 12, 6, 12, 0],
    [1_000_000, 12, 12, 6, 24, 0],
    [1_000_000, 12, 12, 12, 12, 0],
    [500_000, 9.9, 36, 7.25, 36, 10_000],
    [999_999.99, 17.25, 60, 5, 24, 500],
    [4_500_000, 24, 120, 15, 180, 20_000],
    [10_000_000, 100, 600, 90, 600, 0],
    [1_000_000_000_000_000, 0, 600, 0, 600, 0],
    [300_000, 0.01, 2, 0.01, 2, 1],
    [10_000, 1_000, 1, 1_000, 1, 0],
  ] as const)(
    "supports domain case balance=%s r1=%s k=%s r2=%s m=%s fee=%s",
    (
      currentBalance,
      currentAnnualRate,
      remainingMonths,
      newAnnualRate,
      newMonths,
      fee,
    ) => {
      const result = calculateRefinance({
        currentBalance,
        currentAnnualRate,
        remainingMonths,
        newAnnualRate,
        newMonths,
        fee,
      });

      expect(Number.isFinite(result.savings)).toBe(true);
      expect(result.current.schedule).toHaveLength(remainingMonths);
      expect(result.refinanced.schedule).toHaveLength(newMonths);
      expect(
        result.current.schedule[result.current.schedule.length - 1]
          .closingBalance,
      ).toBe(0);
      expect(
        result.refinanced.schedule[result.refinanced.schedule.length - 1]
          .closingBalance,
      ).toBe(0);
    },
  );

  it.each([
    {
      currentBalance: 0,
      currentAnnualRate: 12,
      remainingMonths: 12,
      newAnnualRate: 6,
      newMonths: 12,
      fee: 0,
    },
    {
      currentBalance: -1,
      currentAnnualRate: 12,
      remainingMonths: 12,
      newAnnualRate: 6,
      newMonths: 12,
      fee: 0,
    },
    {
      currentBalance: 1_000_000_000_000_001,
      currentAnnualRate: 12,
      remainingMonths: 12,
      newAnnualRate: 6,
      newMonths: 12,
      fee: 0,
    },
    {
      currentBalance: 1_000_000,
      currentAnnualRate: -1,
      remainingMonths: 12,
      newAnnualRate: 6,
      newMonths: 12,
      fee: 0,
    },
    {
      currentBalance: 1_000_000,
      currentAnnualRate: 12,
      remainingMonths: 0,
      newAnnualRate: 6,
      newMonths: 12,
      fee: 0,
    },
    {
      currentBalance: 1_000_000,
      currentAnnualRate: 12,
      remainingMonths: 601,
      newAnnualRate: 6,
      newMonths: 12,
      fee: 0,
    },
    {
      currentBalance: 1_000_000,
      currentAnnualRate: 12,
      remainingMonths: 12,
      newAnnualRate: 1_001,
      newMonths: 12,
      fee: 0,
    },
    {
      currentBalance: 1_000_000,
      currentAnnualRate: 12,
      remainingMonths: 12,
      newAnnualRate: 6,
      newMonths: 0,
      fee: 0,
    },
    {
      currentBalance: 1_000_000,
      currentAnnualRate: 12,
      remainingMonths: 12,
      newAnnualRate: 6,
      newMonths: 601,
      fee: 0,
    },
    {
      currentBalance: 1_000_000,
      currentAnnualRate: 12,
      remainingMonths: 12,
      newAnnualRate: 6,
      newMonths: 12,
      fee: -1,
    },
  ])("rejects invalid or boundary input %#", (input) => {
    expect(() => calculateRefinance(input)).toThrow(FinanceValidationError);
  });

  it("reconciles the last payment of both schedules exactly", () => {
    const result = calculateRefinance({
      currentBalance: 987_654.32,
      currentAnnualRate: 9.5,
      remainingMonths: 37,
      newAnnualRate: 6.5,
      newMonths: 41,
      fee: 2_500,
    });

    const currentPrincipalPaid = result.current.schedule.reduce(
      (total, row) => total + row.principal,
      0,
    );
    const refinancedPrincipalPaid = result.refinanced.schedule.reduce(
      (total, row) => total + row.principal,
      0,
    );
    expectFinanceClose(currentPrincipalPaid, 987_654.32);
    expectFinanceClose(refinancedPrincipalPaid, 987_654.32);
    expect(
      sumInterest(result.current.schedule) === result.current.totalInterest,
    ).toBe(true);
    expect(
      sumInterest(result.refinanced.schedule) ===
        result.refinanced.totalInterest,
    ).toBe(true);
  });

  it("has zero savings minus the fee when the new terms equal the current terms", () => {
    const result = calculateRefinance({
      currentBalance: 750_000,
      currentAnnualRate: 15,
      remainingMonths: 24,
      newAnnualRate: 15,
      newMonths: 24,
      fee: 3_000,
    });
    expectFinanceClose(result.savings, -3_000);
    expect(result.isBeneficial).toBe(false);
  });

  it("increases savings as the new rate decreases", () => {
    const base = {
      currentBalance: 1_000_000,
      currentAnnualRate: 12,
      remainingMonths: 24,
      newMonths: 24,
      fee: 1_000,
    };
    const highNewRate = calculateRefinance({
      ...base,
      newAnnualRate: 11,
    }).savings;
    const lowNewRate = calculateRefinance({
      ...base,
      newAnnualRate: 5,
    }).savings;
    expect(lowNewRate).toBeGreaterThan(highNewRate);
  });
});
