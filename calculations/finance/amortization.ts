import {
  assertAnnualRate,
  assertFiniteCalculation,
  assertLoanMonths,
  assertPositiveAmount,
  assertScheduleLength,
  FinanceValidationError,
} from "./validation";

export type LoanPaymentType = "annuity" | "differential";

export interface LoanTerms {
  principal: number;
  annualRate: number;
  months: number;
  paymentType: LoanPaymentType;
}

export interface AmortizationRow {
  month: number;
  openingBalance: number;
  payment: number;
  principal: number;
  interest: number;
  closingBalance: number;
}

export interface AmortizationResult {
  paymentType: LoanPaymentType;
  initialPrincipal: number;
  annualRate: number;
  monthlyRate: number;
  months: number;
  /** Theoretical unrounded payment for annuity loans; null for differential. */
  monthlyPayment: number | null;
  firstPayment: number;
  lastPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: readonly AmortizationRow[];
}

export function annualRateToMonthlyRate(annualRate: number): number {
  assertAnnualRate(annualRate);
  return annualRate / 12 / 100;
}

/**
 * Returns the theoretical unrounded annuity payment. The numerically stable
 * negative-power form avoids overflow at the supported maximum rate and term.
 */
export function calculateAnnuityPayment(
  principal: number,
  annualRate: number,
  months: number,
): number {
  assertPositiveAmount(principal, "principal");
  assertAnnualRate(annualRate);
  assertLoanMonths(months);

  const monthlyRate = annualRateToMonthlyRate(annualRate);
  const payment =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

  assertFiniteCalculation(payment, "monthlyPayment");
  if (!(payment > 0)) {
    throw new FinanceValidationError(
      "monthlyPayment",
      "calculation-overflow",
      "monthlyPayment is below numeric precision",
    );
  }
  return payment;
}

export function calculateAmortization(terms: LoanTerms): AmortizationResult {
  const { principal, annualRate, months, paymentType } = terms;
  assertPositiveAmount(principal, "principal");
  assertAnnualRate(annualRate);
  assertLoanMonths(months);
  assertScheduleLength(months);

  if (paymentType !== "annuity" && paymentType !== "differential") {
    throw new TypeError("paymentType must be annuity or differential");
  }

  const monthlyRate = annualRateToMonthlyRate(annualRate);
  const monthlyPayment =
    paymentType === "annuity"
      ? calculateAnnuityPayment(principal, annualRate, months)
      : null;
  const differentialPrincipal = principal / months;
  const schedule: AmortizationRow[] = [];
  let balance = principal;
  let totalPayment = 0;
  let totalInterest = 0;

  for (let month = 1; month <= months; month += 1) {
    const openingBalance = balance;
    const interest = openingBalance * monthlyRate;
    const isLast = month === months;
    const annuityClosingBalance =
      monthlyRate === 0
        ? (principal * (months - month)) / months
        : (principal * (1 - Math.pow(1 + monthlyRate, -(months - month)))) /
          (1 - Math.pow(1 + monthlyRate, -months));
    const principalPart = isLast
      ? openingBalance
      : paymentType === "annuity"
        ? Math.max(0, openingBalance - annuityClosingBalance)
        : Math.min(openingBalance, differentialPrincipal);
    const payment = interest + principalPart;

    balance = isLast
      ? 0
      : paymentType === "annuity"
        ? annuityClosingBalance
        : Math.max(0, openingBalance - principalPart);
    assertFiniteCalculation(payment, `schedule[${month - 1}].payment`);
    assertFiniteCalculation(balance, `schedule[${month - 1}].closingBalance`);

    totalPayment += payment;
    totalInterest += interest;
    schedule.push({
      month,
      openingBalance,
      payment,
      principal: principalPart,
      interest,
      closingBalance: balance,
    });
  }

  assertFiniteCalculation(totalPayment, "totalPayment");
  assertFiniteCalculation(totalInterest, "totalInterest");

  return {
    paymentType,
    initialPrincipal: principal,
    annualRate,
    monthlyRate,
    months,
    monthlyPayment,
    firstPayment: schedule[0].payment,
    lastPayment: schedule[schedule.length - 1].payment,
    totalPayment,
    totalInterest,
    schedule,
  };
}
