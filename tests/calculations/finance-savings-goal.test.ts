import { describe, expect, it } from "vitest";

import { calculateDeposit } from "../../calculations/finance/deposit";
import { calculateSavingsGoal } from "../../calculations/finance/savings-goal";
import { FinanceValidationError } from "../../calculations/finance/validation";

function expectFinanceClose(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(
    Math.max(1e-9, Math.abs(expected) * 1e-9),
  );
}

describe("savings goal", () => {
  it("matches three independent golden fixtures", () => {
    const zeroRate = calculateSavingsGoal({
      targetAmount: 120_000,
      months: 12,
      annualRate: 0,
      initialAmount: 0,
    });
    expectFinanceClose(zeroRate.requiredContribution, 10_000);

    const withInitial = calculateSavingsGoal({
      targetAmount: 122_110,
      months: 2,
      annualRate: 12,
      initialAmount: 100_000,
    });
    expectFinanceClose(withInitial.requiredContribution, 10_000);

    const fromZero = calculateSavingsGoal({
      targetAmount: 100_000,
      months: 12,
      annualRate: 12,
      initialAmount: 0,
    });
    expectFinanceClose(fromZero.requiredContribution, 7_884.878867834168);
  });

  it.each([
    [100_000, 12, 0, 0],
    [100_000, 12, 12, 0],
    [1, 1, 0, 0],
    [1, 600, 1_000, 1],
    [999_999.99, 24, 17.25, 10_000],
    [1_000_000_000_000_000, 600, 0, 0],
    [250_000, 36, 7.25, 1_000],
    [250_000, 120, 100, 50_000],
    [10_000, 600, 12, 0],
    [500_000, 60, 9.9, 100_000],
  ] as const)(
    "supports domain case target=%s months=%s rate=%s initial=%s",
    (targetAmount, months, annualRate, initialAmount) => {
      const result = calculateSavingsGoal({
        targetAmount,
        months,
        annualRate,
        initialAmount,
      });

      expect(Number.isFinite(result.requiredContribution)).toBe(true);
      expect(result.requiredContribution).toBeGreaterThanOrEqual(0);
      expect(result.projectedFinalBalance).toBeGreaterThanOrEqual(0);
    },
  );

  it.each([
    { targetAmount: 0, months: 12, annualRate: 12, initialAmount: 0 },
    { targetAmount: -1, months: 12, annualRate: 12, initialAmount: 0 },
    {
      targetAmount: 1_000_000_000_000_001,
      months: 12,
      annualRate: 12,
      initialAmount: 0,
    },
    { targetAmount: 100_000, months: 0, annualRate: 12, initialAmount: 0 },
    { targetAmount: 100_000, months: 601, annualRate: 12, initialAmount: 0 },
    { targetAmount: 100_000, months: 12.5, annualRate: 12, initialAmount: 0 },
    { targetAmount: 100_000, months: 12, annualRate: -1, initialAmount: 0 },
    { targetAmount: 100_000, months: 12, annualRate: 1_001, initialAmount: 0 },
    { targetAmount: 100_000, months: 12, annualRate: 12, initialAmount: -1 },
    {
      targetAmount: 100_000,
      months: 12,
      annualRate: 12,
      initialAmount: 1_000_000_000_000_001,
    },
  ])("rejects invalid or boundary input %#", (input) => {
    expect(() => calculateSavingsGoal(input)).toThrow(FinanceValidationError);
  });

  it("reports the goal as already reached when the initial amount is enough", () => {
    const result = calculateSavingsGoal({
      targetAmount: 100_000,
      months: 12,
      annualRate: 12,
      initialAmount: 200_000,
    });
    expect(result.goalReachedWithoutContributions).toBe(true);
    expect(result.requiredContribution).toBe(0);
    expect(result.projectedFinalBalance).toBeGreaterThanOrEqual(100_000);
  });

  it("reconciles the required contribution against the deposit forward recurrence", () => {
    // The shared deposit engine requires a positive initial principal, so this
    // reconciliation only covers cases with a nonzero starting amount; the
    // zero-initial case is covered by the golden fixture above instead.
    for (const [targetAmount, months, annualRate, initialAmount] of [
      [122_110, 2, 12, 100_000],
      [100_000, 12, 12, 1],
      [250_000, 36, 7.25, 1_000],
    ] as const) {
      const goal = calculateSavingsGoal({
        targetAmount,
        months,
        annualRate,
        initialAmount,
      });
      if (goal.goalReachedWithoutContributions) continue;
      const deposit = calculateDeposit({
        initialPrincipal: initialAmount,
        annualRate,
        months,
        monthlyContribution: goal.requiredContribution,
      });
      expectFinanceClose(deposit.finalBalance, targetAmount);
    }
  });

  it("requires a strictly smaller contribution as the rate rises", () => {
    const base = {
      targetAmount: 500_000,
      months: 36,
      initialAmount: 0,
    };
    const low = calculateSavingsGoal({
      ...base,
      annualRate: 1,
    }).requiredContribution;
    const mid = calculateSavingsGoal({
      ...base,
      annualRate: 10,
    }).requiredContribution;
    const high = calculateSavingsGoal({
      ...base,
      annualRate: 20,
    }).requiredContribution;

    expect(low).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(high);
  });
});
