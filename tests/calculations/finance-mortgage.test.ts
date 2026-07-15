import { describe, expect, it } from "vitest";

import { calculateMortgage } from "../../calculations/finance/mortgage";
import { FinanceValidationError } from "../../calculations/finance/validation";

function expectFinanceClose(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(
    Math.max(1e-9, Math.abs(expected) * 1e-9),
  );
}

describe("mortgage", () => {
  it("matches three independent golden fixtures", () => {
    const annuity = calculateMortgage({
      price: 1_250_000,
      downPayment: 250_000,
      annualRate: 12,
      months: 12,
      paymentType: "annuity",
    });
    expect(annuity.financedAmount).toBe(1_000_000);
    expectFinanceClose(annuity.monthlyPayment!, 88_848.7886783417);
    expectFinanceClose(annuity.totalInterest, 66_185.46414010049);

    const zeroRate = calculateMortgage({
      price: 500_000,
      downPayment: 100_000,
      annualRate: 0,
      months: 20,
      paymentType: "annuity",
    });
    expect(zeroRate.financedAmount).toBe(400_000);
    expectFinanceClose(zeroRate.monthlyPayment!, 20_000);
    expect(zeroRate.totalInterest).toBe(0);

    const differential = calculateMortgage({
      price: 1_200_000,
      downPayment: 0,
      annualRate: 12,
      months: 12,
      paymentType: "differential",
    });
    expectFinanceClose(differential.firstPayment, 112_000);
    expectFinanceClose(differential.lastPayment, 101_000);
    expectFinanceClose(differential.totalInterest, 78_000);
  });

  it.each([
    [1, 0, 0, 1, "annuity"],
    [100_000, 99_999, 0, 1, "differential"],
    [5_000_000, 1_000_000, 6.5, 360, "annuity"],
    [5_000_000, 1_000_000, 6.5, 360, "differential"],
    [12_000_000, 2_400_000, 17.9, 240, "annuity"],
    [12_000_000, 0, 17.9, 240, "differential"],
    [999_999.99, 123_456.78, 0.01, 60, "annuity"],
    [10_000_000, 9_999_999.99, 1_000, 600, "annuity"],
    [1_000_000_000_000_000, 0, 0, 600, "differential"],
    [8_750_000, 875_000, 25, 2, "annuity"],
  ] as const)(
    "supports domain case price=%s down=%s rate=%s months=%s type=%s",
    (price, downPayment, annualRate, months, paymentType) => {
      const result = calculateMortgage({
        price,
        downPayment,
        annualRate,
        months,
        paymentType,
      });

      expect(result.financedAmount).toBe(price - downPayment);
      expect(result.schedule).toHaveLength(months);
      expect(result.schedule[result.schedule.length - 1].closingBalance).toBe(
        0,
      );
    },
  );

  it.each([
    { price: 0, downPayment: 0, annualRate: 12, months: 12 },
    {
      price: 1_000_000_000_000_001,
      downPayment: 0,
      annualRate: 12,
      months: 12,
    },
    { price: 100_000, downPayment: -1, annualRate: 12, months: 12 },
    { price: 100_000, downPayment: 100_000, annualRate: 12, months: 12 },
    { price: 100_000, downPayment: 100_001, annualRate: 12, months: 12 },
    { price: 100_000, downPayment: 0, annualRate: -1, months: 12 },
    { price: 100_000, downPayment: 0, annualRate: 1_001, months: 12 },
    { price: 100_000, downPayment: 0, annualRate: 12, months: 0 },
    { price: 100_000, downPayment: 0, annualRate: 12, months: 601 },
    { price: Number.NaN, downPayment: 0, annualRate: 12, months: 12 },
  ])("rejects invalid or boundary input %#", (input) => {
    expect(() =>
      calculateMortgage({ ...input, paymentType: "annuity" }),
    ).toThrow(FinanceValidationError);
  });

  it("financed amount and paid principal reconcile without cent rounding", () => {
    const result = calculateMortgage({
      price: 9_876_543.21,
      downPayment: 1_234_567.89,
      annualRate: 18.75,
      months: 359,
      paymentType: "annuity",
    });
    const principalPaid = result.schedule.reduce(
      (total, row) => total + row.principal,
      0,
    );

    expectFinanceClose(principalPaid, result.financedAmount);
    expect(result.schedule[result.schedule.length - 1].closingBalance).toBe(0);
  });
});
