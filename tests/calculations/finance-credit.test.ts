import { describe, expect, it } from "vitest";

import {
  calculateAmortization,
  calculateAnnuityPayment,
} from "../../calculations/finance/amortization";
import { calculateCredit } from "../../calculations/finance/credit";
import { FinanceValidationError } from "../../calculations/finance/validation";

function expectFinanceClose(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(
    Math.max(1e-9, Math.abs(expected) * 1e-9),
  );
}

describe("credit and shared amortization", () => {
  it("matches three independent golden fixtures", () => {
    const annuity = calculateCredit({
      principal: 1_000_000,
      annualRate: 12,
      months: 12,
      paymentType: "annuity",
    });
    expectFinanceClose(annuity.monthlyPayment!, 88_848.7886783417);
    expectFinanceClose(annuity.totalPayment, 1_066_185.4641401004);
    expectFinanceClose(annuity.totalInterest, 66_185.46414010049);

    const differential = calculateCredit({
      principal: 120_000,
      annualRate: 12,
      months: 12,
      paymentType: "differential",
    });
    expectFinanceClose(differential.firstPayment, 11_200);
    expectFinanceClose(differential.lastPayment, 10_100);
    expectFinanceClose(differential.totalInterest, 7_800);

    const zeroRate = calculateCredit({
      principal: 250_000,
      annualRate: 0,
      months: 10,
      paymentType: "annuity",
    });
    expectFinanceClose(zeroRate.monthlyPayment!, 25_000);
    expectFinanceClose(zeroRate.totalPayment, 250_000);
    expect(zeroRate.totalInterest).toBe(0);
  });

  it.each([
    [1, 0, 1, "annuity"],
    [1, 0, 1, "differential"],
    [100_000, 9.9, 36, "annuity"],
    [100_000, 9.9, 36, "differential"],
    [999_999.99, 17.25, 60, "annuity"],
    [4_500_000, 24, 120, "differential"],
    [10_000_000, 100, 600, "annuity"],
    [10_000_000, 1_000, 600, "annuity"],
    [1_000_000_000_000_000, 0, 600, "differential"],
    [300_000, 0.01, 2, "annuity"],
  ] as const)(
    "supports domain case principal=%s rate=%s months=%s type=%s",
    (principal, annualRate, months, paymentType) => {
      const result = calculateCredit({
        principal,
        annualRate,
        months,
        paymentType,
      });

      expect(result.schedule).toHaveLength(months);
      expect(result.schedule.length).toBeLessThanOrEqual(1_200);
      expect(result.schedule[result.schedule.length - 1].closingBalance).toBe(
        0,
      );
      expect(result.totalPayment).toBeGreaterThanOrEqual(principal);
      expect(Number.isFinite(result.totalPayment)).toBe(true);
    },
  );

  it.each([
    { principal: 0, annualRate: 12, months: 12 },
    { principal: -1, annualRate: 12, months: 12 },
    { principal: 1_000_000_000_000_001, annualRate: 12, months: 12 },
    { principal: 100_000, annualRate: -0.01, months: 12 },
    { principal: 100_000, annualRate: 1_000.01, months: 12 },
    { principal: 100_000, annualRate: 12, months: 0 },
    { principal: 100_000, annualRate: 12, months: 601 },
    { principal: 100_000, annualRate: 12, months: 12.5 },
    { principal: Number.NaN, annualRate: 12, months: 12 },
    { principal: 100_000, annualRate: Number.POSITIVE_INFINITY, months: 12 },
  ])("rejects invalid or boundary input %#", (input) => {
    expect(() => calculateCredit({ ...input, paymentType: "annuity" })).toThrow(
      FinanceValidationError,
    );
  });

  it("rejects an unsupported payment type", () => {
    expect(() =>
      calculateAmortization({
        principal: 100_000,
        annualRate: 10,
        months: 12,
        paymentType: "balloon" as "annuity",
      }),
    ).toThrow(TypeError);
  });

  it("reconciles principal exactly and preserves schedule invariants", () => {
    for (const paymentType of ["annuity", "differential"] as const) {
      for (const annualRate of [0, 0.01, 12, 99, 1_000]) {
        const result = calculateCredit({
          principal: 987_654.32,
          annualRate,
          months: 37,
          paymentType,
        });
        const principalPaid = result.schedule.reduce(
          (total, row) => total + row.principal,
          0,
        );

        expectFinanceClose(principalPaid, 987_654.32);
        expect(result.schedule[result.schedule.length - 1].closingBalance).toBe(
          0,
        );
        expect(
          result.schedule.every(
            (row) =>
              row.openingBalance >= 0 &&
              row.closingBalance >= 0 &&
              row.payment >= row.interest,
          ),
        ).toBe(true);
      }
    }
  });

  it("keeps annuity payments level and differential payments decreasing", () => {
    const annuity = calculateCredit({
      principal: 500_000,
      annualRate: 7.5,
      months: 24,
      paymentType: "annuity",
    });
    expectFinanceClose(annuity.monthlyPayment!, 22_499.79632581227);
    for (const row of annuity.schedule.slice(0, -1)) {
      expectFinanceClose(row.payment, annuity.monthlyPayment!);
    }

    const differential = calculateCredit({
      principal: 500_000,
      annualRate: 7.5,
      months: 24,
      paymentType: "differential",
    });
    for (let index = 1; index < differential.schedule.length; index += 1) {
      expect(differential.schedule[index].payment).toBeLessThanOrEqual(
        differential.schedule[index - 1].payment,
      );
    }
  });

  it("annuity payment decreases as term grows and increases with rate", () => {
    expect(calculateAnnuityPayment(1_000_000, 12, 24)).toBeLessThan(
      calculateAnnuityPayment(1_000_000, 12, 12),
    );
    expect(calculateAnnuityPayment(1_000_000, 13, 12)).toBeGreaterThan(
      calculateAnnuityPayment(1_000_000, 12, 12),
    );
  });
});
