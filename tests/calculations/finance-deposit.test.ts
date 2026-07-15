import { describe, expect, it } from "vitest";

import { calculateDeposit } from "../../calculations/finance/deposit";
import { FinanceValidationError } from "../../calculations/finance/validation";

function expectFinanceClose(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(
    Math.max(1e-9, Math.abs(expected) * 1e-9),
  );
}

describe("deposit", () => {
  it("matches three independent golden fixtures", () => {
    const oneMonth = calculateDeposit({
      initialPrincipal: 100_000,
      annualRate: 12,
      months: 1,
      monthlyContribution: 0,
    });
    expectFinanceClose(oneMonth.finalBalance, 101_000);
    expectFinanceClose(oneMonth.interestIncome, 1_000);

    const twoMonths = calculateDeposit({
      initialPrincipal: 100_000,
      annualRate: 12,
      months: 2,
      monthlyContribution: 10_000,
    });
    expectFinanceClose(twoMonths.schedule[0].closingBalance, 111_000);
    expectFinanceClose(twoMonths.finalBalance, 122_110);
    expectFinanceClose(twoMonths.totalUserContributions, 120_000);
    expectFinanceClose(twoMonths.interestIncome, 2_110);

    const zeroRate = calculateDeposit({
      initialPrincipal: 50_000,
      annualRate: 0,
      months: 3,
      monthlyContribution: 5_000,
    });
    expectFinanceClose(zeroRate.finalBalance, 65_000);
    expect(zeroRate.interestIncome).toBe(0);
  });

  it.each([
    [1, 0, 1, 0],
    [1, 1_000, 600, 0],
    [100_000, 5, 12, 1_000],
    [100_000, 5, 12, 0],
    [999_999.99, 0.01, 2, 0.01],
    [1_000_000_000_000_000, 0, 600, 1_000_000_000_000_000],
    [250_000, 7.25, 36, 10_000],
    [250_000, 100, 120, 10_000],
    [10_000, 12, 1, 10_000],
    [10_000, 12, 600, 10_000],
  ] as const)(
    "supports domain case principal=%s rate=%s months=%s contribution=%s",
    (initialPrincipal, annualRate, months, monthlyContribution) => {
      const result = calculateDeposit({
        initialPrincipal,
        annualRate,
        months,
        monthlyContribution,
      });

      expect(result.schedule).toHaveLength(months);
      expect(result.schedule.length).toBeLessThanOrEqual(1_200);
      expect(Number.isFinite(result.finalBalance)).toBe(true);
      expect(result.finalBalance).toBeGreaterThanOrEqual(
        result.totalUserContributions,
      );
    },
  );

  it.each([
    { initialPrincipal: 0, annualRate: 12, months: 12, monthlyContribution: 0 },
    {
      initialPrincipal: -1,
      annualRate: 12,
      months: 12,
      monthlyContribution: 0,
    },
    {
      initialPrincipal: 1_000_000_000_000_001,
      annualRate: 12,
      months: 12,
      monthlyContribution: 0,
    },
    {
      initialPrincipal: 100_000,
      annualRate: -1,
      months: 12,
      monthlyContribution: 0,
    },
    {
      initialPrincipal: 100_000,
      annualRate: 1_001,
      months: 12,
      monthlyContribution: 0,
    },
    {
      initialPrincipal: 100_000,
      annualRate: 12,
      months: 0,
      monthlyContribution: 0,
    },
    {
      initialPrincipal: 100_000,
      annualRate: 12,
      months: 601,
      monthlyContribution: 0,
    },
    {
      initialPrincipal: 100_000,
      annualRate: 12,
      months: 1.5,
      monthlyContribution: 0,
    },
    {
      initialPrincipal: 100_000,
      annualRate: 12,
      months: 12,
      monthlyContribution: -1,
    },
    {
      initialPrincipal: 100_000,
      annualRate: 12,
      months: 12,
      monthlyContribution: 1_000_000_000_000_001,
    },
  ])("rejects invalid or boundary input %#", (input) => {
    expect(() => calculateDeposit(input)).toThrow(FinanceValidationError);
  });

  it("adds every contribution after interest, including the final month", () => {
    const result = calculateDeposit({
      initialPrincipal: 2_000,
      annualRate: 24,
      months: 24,
      monthlyContribution: 125,
    });

    for (const row of result.schedule) {
      expectFinanceClose(
        row.closingBalance,
        row.openingBalance * 1.02 + row.contribution,
      );
      expect(row.contribution).toBe(125);
    }
    expect(result.schedule[result.schedule.length - 1].contribution).toBe(125);
    expectFinanceClose(
      result.finalBalance - result.totalUserContributions,
      result.interestIncome,
    );
  });

  it("is monotonic in principal, rate, contribution, and term", () => {
    const base = {
      initialPrincipal: 100_000,
      annualRate: 10,
      months: 12,
      monthlyContribution: 1_000,
    };
    const baseBalance = calculateDeposit(base).finalBalance;

    expect(
      calculateDeposit({ ...base, initialPrincipal: 110_000 }).finalBalance,
    ).toBeGreaterThan(baseBalance);
    expect(
      calculateDeposit({ ...base, annualRate: 11 }).finalBalance,
    ).toBeGreaterThan(baseBalance);
    expect(
      calculateDeposit({ ...base, monthlyContribution: 2_000 }).finalBalance,
    ).toBeGreaterThan(baseBalance);
    expect(
      calculateDeposit({ ...base, months: 13 }).finalBalance,
    ).toBeGreaterThan(baseBalance);
  });
});
