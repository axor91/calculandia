import {
  calculateAmortization,
  type AmortizationResult,
  type AmortizationRow,
} from "./amortization";
import {
  assertAnnualRate,
  assertFiniteCalculation,
  assertLoanMonths,
  assertNumberInRange,
  assertPositiveAmount,
  assertScheduleLength,
  FinanceValidationError,
  MAX_FINANCIAL_AMOUNT,
} from "./validation";

export type EarlyRepaymentStrategy = "reduce-term" | "reduce-payment";

export interface EarlyRepaymentInput {
  principal: number;
  annualRate: number;
  months: number;
  paymentsMade: number;
  prepayment: number;
}

export interface EarlyRepaymentStrategyResult {
  strategy: EarlyRepaymentStrategy;
  newTermMonths: number;
  remainingPayments: number;
  /** Theoretical regular payment after prepayment. */
  monthlyPayment: number;
  revisedTotalInterest: number;
  interestSavings: number;
  remainingSchedule: readonly AmortizationRow[];
}

export interface EarlyRepaymentComparison {
  baseline: AmortizationResult;
  paymentsMade: number;
  prepayment: number;
  balanceAfterScheduledPayment: number;
  balanceAfterPrepayment: number;
  interestPaidBeforePrepayment: number;
  reduceTerm: EarlyRepaymentStrategyResult;
  reducePayment: EarlyRepaymentStrategyResult;
}

function rebaseScheduleMonths(
  schedule: readonly AmortizationRow[],
  paymentsMade: number,
): AmortizationRow[] {
  return schedule.map((row) => ({
    ...row,
    month: row.month + paymentsMade,
  }));
}

function buildReducedTermSchedule(
  balanceAfterPrepayment: number,
  monthlyRate: number,
  originalPayment: number,
  paymentsMade: number,
): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  let balance = balanceAfterPrepayment;

  for (let index = 0; balance > 0; index += 1) {
    assertScheduleLength(index + 1);
    const openingBalance = balance;
    const interest = openingBalance * monthlyRate;
    const amountDue = openingBalance + interest;
    const payment = Math.min(originalPayment, amountDue);
    const principal = payment - interest;

    if (!(principal > 0)) {
      throw new FinanceValidationError(
        "prepayment",
        "calculation-overflow",
        "scheduled payment does not reduce principal",
      );
    }

    const closesLoan = payment === amountDue;
    balance = closesLoan ? 0 : Math.max(0, openingBalance - principal);
    assertFiniteCalculation(payment, `remainingSchedule[${index}].payment`);
    assertFiniteCalculation(
      balance,
      `remainingSchedule[${index}].closingBalance`,
    );

    schedule.push({
      month: paymentsMade + index + 1,
      openingBalance,
      payment,
      principal,
      interest,
      closingBalance: balance,
    });
  }

  return schedule;
}

function sumInterest(schedule: readonly AmortizationRow[]): number {
  return schedule.reduce((total, row) => total + row.interest, 0);
}

export function compareEarlyRepayment(
  input: EarlyRepaymentInput,
): EarlyRepaymentComparison {
  const { principal, annualRate, months, paymentsMade, prepayment } = input;
  assertPositiveAmount(principal, "principal");
  assertAnnualRate(annualRate);
  assertLoanMonths(months);
  assertNumberInRange(paymentsMade, "paymentsMade", {
    min: 1,
    max: months - 1,
    integer: true,
  });
  assertNumberInRange(prepayment, "prepayment", {
    min: Number.MIN_VALUE,
    max: MAX_FINANCIAL_AMOUNT,
  });

  const baseline = calculateAmortization({
    principal,
    annualRate,
    months,
    paymentType: "annuity",
  });
  const balanceAfterScheduledPayment =
    baseline.schedule[paymentsMade - 1].closingBalance;

  if (prepayment >= balanceAfterScheduledPayment) {
    throw new FinanceValidationError(
      "prepayment",
      "invalid-prepayment",
      "prepayment must be less than the balance after the scheduled payment",
    );
  }

  const balanceAfterPrepayment = balanceAfterScheduledPayment - prepayment;
  if (
    !(balanceAfterPrepayment > 0) ||
    !(balanceAfterPrepayment < balanceAfterScheduledPayment)
  ) {
    throw new FinanceValidationError(
      "prepayment",
      "invalid-prepayment",
      "prepayment is below numeric precision for the current balance",
    );
  }
  const interestPaidBeforePrepayment = sumInterest(
    baseline.schedule.slice(0, paymentsMade),
  );
  const originalPayment = baseline.monthlyPayment!;
  const reduceTermSchedule = buildReducedTermSchedule(
    balanceAfterPrepayment,
    baseline.monthlyRate,
    originalPayment,
    paymentsMade,
  );
  const reducePaymentAmortization = calculateAmortization({
    principal: balanceAfterPrepayment,
    annualRate,
    months: months - paymentsMade,
    paymentType: "annuity",
  });
  const reducePaymentSchedule = rebaseScheduleMonths(
    reducePaymentAmortization.schedule,
    paymentsMade,
  );
  const reduceTermInterest = sumInterest(reduceTermSchedule);
  const reducePaymentInterest = sumInterest(reducePaymentSchedule);
  const reduceTermTotalInterest =
    interestPaidBeforePrepayment + reduceTermInterest;
  const reducePaymentTotalInterest =
    interestPaidBeforePrepayment + reducePaymentInterest;

  const reduceTerm: EarlyRepaymentStrategyResult = {
    strategy: "reduce-term",
    newTermMonths: paymentsMade + reduceTermSchedule.length,
    remainingPayments: reduceTermSchedule.length,
    monthlyPayment: originalPayment,
    revisedTotalInterest: reduceTermTotalInterest,
    interestSavings: Math.max(
      0,
      baseline.totalInterest - reduceTermTotalInterest,
    ),
    remainingSchedule: reduceTermSchedule,
  };
  const reducePayment: EarlyRepaymentStrategyResult = {
    strategy: "reduce-payment",
    newTermMonths: months,
    remainingPayments: months - paymentsMade,
    monthlyPayment: reducePaymentAmortization.monthlyPayment!,
    revisedTotalInterest: reducePaymentTotalInterest,
    interestSavings: Math.max(
      0,
      baseline.totalInterest - reducePaymentTotalInterest,
    ),
    remainingSchedule: reducePaymentSchedule,
  };

  assertFiniteCalculation(reduceTerm.interestSavings, "interestSavings");
  assertFiniteCalculation(reducePayment.interestSavings, "interestSavings");

  return {
    baseline,
    paymentsMade,
    prepayment,
    balanceAfterScheduledPayment,
    balanceAfterPrepayment,
    interestPaidBeforePrepayment,
    reduceTerm,
    reducePayment,
  };
}

export function calculateEarlyRepayment(
  input: EarlyRepaymentInput,
  strategy: EarlyRepaymentStrategy,
): EarlyRepaymentStrategyResult {
  const comparison = compareEarlyRepayment(input);

  if (strategy === "reduce-term") {
    return comparison.reduceTerm;
  }
  if (strategy === "reduce-payment") {
    return comparison.reducePayment;
  }

  throw new TypeError("strategy must be reduce-term or reduce-payment");
}
