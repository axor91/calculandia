import { describe, expect, it } from "vitest";

import {
  calculateEarlyRepayment,
  compareEarlyRepayment,
} from "../../calculations/finance/early-repayment";
import { FinanceValidationError } from "../../calculations/finance/validation";

function expectFinanceClose(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(
    Math.max(1e-9, Math.abs(expected) * 1e-9),
  );
}

describe("one-time early repayment", () => {
  it("matches the independent 12% golden fixture for both strategies", () => {
    const result = compareEarlyRepayment({
      principal: 1_000_000,
      annualRate: 12,
      months: 12,
      paymentsMade: 3,
      prepayment: 100_000,
    });

    expectFinanceClose(result.baseline.monthlyPayment!, 88_848.7886783417);
    expectFinanceClose(result.balanceAfterScheduledPayment, 761_080.2854257568);
    expectFinanceClose(result.balanceAfterPrepayment, 661_080.2854257568);
    expect(result.reduceTerm.remainingPayments).toBe(8);
    expect(result.reduceTerm.newTermMonths).toBe(11);
    expectFinanceClose(
      result.reduceTerm.revisedTotalInterest,
      57_020.10260027919,
    );
    expectFinanceClose(result.reduceTerm.interestSavings, 9_165.361539821294);
    expectFinanceClose(result.reducePayment.monthlyPayment, 77_174.7523933736);
    expectFinanceClose(
      result.reducePayment.revisedTotalInterest,
      61_119.137575387496,
    );
    expectFinanceClose(
      result.reducePayment.interestSavings,
      5_066.326564712991,
    );
  });

  it("matches the independent zero-rate golden fixture", () => {
    const result = compareEarlyRepayment({
      principal: 120_000,
      annualRate: 0,
      months: 12,
      paymentsMade: 3,
      prepayment: 20_000,
    });

    expectFinanceClose(result.balanceAfterScheduledPayment, 90_000);
    expectFinanceClose(result.balanceAfterPrepayment, 70_000);
    expect(result.reduceTerm.remainingPayments).toBe(7);
    expect(result.reduceTerm.newTermMonths).toBe(10);
    expectFinanceClose(result.reduceTerm.monthlyPayment, 10_000);
    expect(result.reduceTerm.revisedTotalInterest).toBe(0);
    expect(result.reduceTerm.interestSavings).toBe(0);
    expect(result.reducePayment.remainingPayments).toBe(9);
    expectFinanceClose(result.reducePayment.monthlyPayment, 7_777.777777777778);
    expect(result.reducePayment.revisedTotalInterest).toBe(0);
    expect(result.reducePayment.interestSavings).toBe(0);
  });

  it("matches a third independent positive-rate golden fixture", () => {
    const result = compareEarlyRepayment({
      principal: 120_000,
      annualRate: 12,
      months: 12,
      paymentsMade: 3,
      prepayment: 20_000,
    });

    expectFinanceClose(result.balanceAfterScheduledPayment, 91_329.63425109081);
    expectFinanceClose(result.balanceAfterPrepayment, 71_329.63425109081);
    expect(result.reduceTerm.newTermMonths).toBe(10);
    expectFinanceClose(
      result.reduceTerm.revisedTotalInterest,
      6_183.905080345508,
    );
    expectFinanceClose(result.reduceTerm.interestSavings, 1_758.350616466551);
    expectFinanceClose(result.reducePayment.monthlyPayment, 8_327.047384407383);
    expectFinanceClose(
      result.reducePayment.revisedTotalInterest,
      6_928.99038386946,
    );
    expectFinanceClose(
      result.reducePayment.interestSavings,
      1_013.265312942598,
    );
  });

  it.each([
    [120_000, 0, 12, 1, 1],
    [120_000, 12, 12, 11, 1],
    [1_000_000, 12, 360, 12, 100_000],
    [1_000_000, 0.01, 600, 599, 1],
    [999_999.99, 99, 60, 20, 10_000],
    [10_000_000, 25, 240, 100, 1_000_000],
    [10_000_000, 1_000, 24, 12, 1_000],
    [1_000_000_000, 7.5, 120, 60, 100_000_000],
    [500_000, 15, 2, 1, 10_000],
    [250_000, 3.25, 37, 13, 25_000],
  ] as const)(
    "supports domain case principal=%s rate=%s months=%s paid=%s prepayment=%s",
    (principal, annualRate, months, paymentsMade, prepayment) => {
      const result = compareEarlyRepayment({
        principal,
        annualRate,
        months,
        paymentsMade,
        prepayment,
      });

      expect(result.balanceAfterPrepayment).toBeGreaterThan(0);
      expect(result.reduceTerm.remainingPayments).toBeLessThanOrEqual(
        months - paymentsMade,
      );
      expect(result.reducePayment.remainingPayments).toBe(
        months - paymentsMade,
      );
      expect(
        result.reduceTerm.remainingSchedule[
          result.reduceTerm.remainingSchedule.length - 1
        ].closingBalance,
      ).toBe(0);
      expect(
        result.reducePayment.remainingSchedule[
          result.reducePayment.remainingSchedule.length - 1
        ].closingBalance,
      ).toBe(0);
      expect(result.reduceTerm.remainingSchedule.length).toBeLessThanOrEqual(
        1_200,
      );
    },
  );

  it.each([
    {
      principal: 0,
      annualRate: 12,
      months: 12,
      paymentsMade: 3,
      prepayment: 1,
    },
    {
      principal: 100_000,
      annualRate: -1,
      months: 12,
      paymentsMade: 3,
      prepayment: 1,
    },
    {
      principal: 100_000,
      annualRate: 12,
      months: 0,
      paymentsMade: 1,
      prepayment: 1,
    },
    {
      principal: 100_000,
      annualRate: 12,
      months: 12,
      paymentsMade: 0,
      prepayment: 1,
    },
    {
      principal: 100_000,
      annualRate: 12,
      months: 12,
      paymentsMade: 12,
      prepayment: 1,
    },
    {
      principal: 100_000,
      annualRate: 12,
      months: 12,
      paymentsMade: 1.5,
      prepayment: 1,
    },
    {
      principal: 100_000,
      annualRate: 12,
      months: 12,
      paymentsMade: 3,
      prepayment: 0,
    },
    {
      principal: 100_000,
      annualRate: 12,
      months: 12,
      paymentsMade: 3,
      prepayment: -1,
    },
    {
      principal: Number.NaN,
      annualRate: 12,
      months: 12,
      paymentsMade: 3,
      prepayment: 1,
    },
  ])("rejects invalid or boundary input %#", (input) => {
    expect(() => compareEarlyRepayment(input)).toThrow(FinanceValidationError);
  });

  it("rejects a prepayment equal to or above the post-payment balance", () => {
    const seed = compareEarlyRepayment({
      principal: 100_000,
      annualRate: 12,
      months: 12,
      paymentsMade: 3,
      prepayment: 1,
    });

    for (const prepayment of [
      seed.balanceAfterScheduledPayment,
      seed.balanceAfterScheduledPayment + 1,
    ]) {
      expect(() =>
        compareEarlyRepayment({
          principal: 100_000,
          annualRate: 12,
          months: 12,
          paymentsMade: 3,
          prepayment,
        }),
      ).toThrow(FinanceValidationError);
    }
  });

  it("exposes one selected strategy without changing comparison semantics", () => {
    const input = {
      principal: 750_000,
      annualRate: 14,
      months: 60,
      paymentsMade: 12,
      prepayment: 100_000,
    };
    const comparison = compareEarlyRepayment(input);

    expect(calculateEarlyRepayment(input, "reduce-term")).toEqual(
      comparison.reduceTerm,
    );
    expect(calculateEarlyRepayment(input, "reduce-payment")).toEqual(
      comparison.reducePayment,
    );
    expect(() =>
      calculateEarlyRepayment(input, "other" as "reduce-term"),
    ).toThrow(TypeError);
  });

  it("applies prepayment after scheduled interest and reconciles both endings", () => {
    const result = compareEarlyRepayment({
      principal: 800_000,
      annualRate: 18,
      months: 120,
      paymentsMade: 24,
      prepayment: 200_000,
    });
    const paidRow = result.baseline.schedule[23];

    expectFinanceClose(
      result.balanceAfterScheduledPayment,
      paidRow.closingBalance,
    );
    expectFinanceClose(
      result.balanceAfterPrepayment,
      paidRow.closingBalance - 200_000,
    );
    expect(result.reduceTerm.interestSavings).toBeGreaterThanOrEqual(0);
    expect(result.reducePayment.interestSavings).toBeGreaterThanOrEqual(0);
    expect(result.reduceTerm.interestSavings).toBeGreaterThan(
      result.reducePayment.interestSavings,
    );
    expect(
      result.reduceTerm.remainingSchedule[
        result.reduceTerm.remainingSchedule.length - 1
      ].closingBalance,
    ).toBe(0);
    expect(
      result.reducePayment.remainingSchedule[
        result.reducePayment.remainingSchedule.length - 1
      ].closingBalance,
    ).toBe(0);
  });
});
