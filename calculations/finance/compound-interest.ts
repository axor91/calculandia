import {
  assertAnnualRate,
  assertFiniteCalculation,
  assertLoanMonths,
  assertPositiveAmount,
  FinanceValidationError,
} from "./validation";

export type CompoundingFrequency = "monthly" | "quarterly" | "yearly";

const PERIODS_PER_YEAR: Record<CompoundingFrequency, number> = {
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

export interface CompoundInterestInput {
  principal: number;
  annualRate: number;
  months: number;
  frequency: CompoundingFrequency;
}

export interface CompoundInterestResult {
  principal: number;
  annualRate: number;
  months: number;
  frequency: CompoundingFrequency;
  periodRate: number;
  periods: number;
  futureValue: number;
  income: number;
  effectiveAnnualRate: number;
}

export function calculateCompoundInterest(
  input: CompoundInterestInput,
): CompoundInterestResult {
  const { principal, annualRate, months, frequency } = input;
  assertPositiveAmount(principal, "principal");
  assertAnnualRate(annualRate);
  assertLoanMonths(months);

  const periodsPerYear = PERIODS_PER_YEAR[frequency];
  if (periodsPerYear === undefined) {
    throw new TypeError("frequency must be monthly, quarterly or yearly");
  }

  const monthsPerPeriod = 12 / periodsPerYear;
  if (months % monthsPerPeriod !== 0) {
    throw new FinanceValidationError(
      "months",
      "not-integer",
      `months must be a whole multiple of ${monthsPerPeriod} for the selected capitalization period`,
    );
  }

  const periodRate = annualRate / periodsPerYear / 100;
  const periods = months / monthsPerPeriod;
  const futureValue =
    periodRate === 0
      ? principal
      : principal * Math.pow(1 + periodRate, periods);
  const income = futureValue - principal;
  const effectiveAnnualRate =
    (Math.pow(1 + periodRate, periodsPerYear) - 1) * 100;

  assertFiniteCalculation(futureValue, "futureValue");
  assertFiniteCalculation(income, "income");
  assertFiniteCalculation(effectiveAnnualRate, "effectiveAnnualRate");

  return {
    principal,
    annualRate,
    months,
    frequency,
    periodRate,
    periods,
    futureValue,
    income,
    effectiveAnnualRate,
  };
}
