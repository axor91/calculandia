import { calculateAmortization, type AmortizationResult } from "./amortization";
import { assertNonNegativeAmount, assertPositiveAmount } from "./validation";

export interface RefinanceInput {
  currentBalance: number;
  currentAnnualRate: number;
  remainingMonths: number;
  newAnnualRate: number;
  newMonths: number;
  fee: number;
}

export interface RefinanceResult {
  currentBalance: number;
  fee: number;
  current: AmortizationResult;
  refinanced: AmortizationResult;
  savings: number;
  isBeneficial: boolean;
}

export function calculateRefinance(input: RefinanceInput): RefinanceResult {
  const {
    currentBalance,
    currentAnnualRate,
    remainingMonths,
    newAnnualRate,
    newMonths,
    fee,
  } = input;
  assertPositiveAmount(currentBalance, "currentBalance");
  assertNonNegativeAmount(fee, "fee");

  const current = calculateAmortization({
    principal: currentBalance,
    annualRate: currentAnnualRate,
    months: remainingMonths,
    paymentType: "annuity",
  });
  const refinanced = calculateAmortization({
    principal: currentBalance,
    annualRate: newAnnualRate,
    months: newMonths,
    paymentType: "annuity",
  });

  const savings = current.totalInterest - (refinanced.totalInterest + fee);

  return {
    currentBalance,
    fee,
    current,
    refinanced,
    savings,
    isBeneficial: savings > 0,
  };
}
