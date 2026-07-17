import {
  assertAnnualRate,
  assertFiniteCalculation,
  assertLoanMonths,
  assertNonNegativeAmount,
  assertPositiveAmount,
} from "./validation";

export interface SavingsGoalInput {
  targetAmount: number;
  months: number;
  annualRate: number;
  initialAmount: number;
}

export interface SavingsGoalResult {
  targetAmount: number;
  months: number;
  annualRate: number;
  initialAmount: number;
  monthlyRate: number;
  requiredContribution: number;
  projectedFinalBalance: number;
  goalReachedWithoutContributions: boolean;
}

export function calculateSavingsGoal(
  input: SavingsGoalInput,
): SavingsGoalResult {
  const { targetAmount, months, annualRate, initialAmount } = input;
  assertPositiveAmount(targetAmount, "targetAmount");
  assertLoanMonths(months);
  assertAnnualRate(annualRate);
  assertNonNegativeAmount(initialAmount, "initialAmount");

  const monthlyRate = annualRate / 12 / 100;
  const growthFactor = Math.pow(1 + monthlyRate, months);
  const initialAtMaturity = initialAmount * growthFactor;
  const goalReachedWithoutContributions = initialAtMaturity >= targetAmount;

  const requiredContribution = goalReachedWithoutContributions
    ? 0
    : monthlyRate === 0
      ? (targetAmount - initialAmount) / months
      : (targetAmount - initialAtMaturity) / ((growthFactor - 1) / monthlyRate);

  const projectedFinalBalance = goalReachedWithoutContributions
    ? initialAtMaturity
    : monthlyRate === 0
      ? initialAmount + requiredContribution * months
      : initialAtMaturity +
        requiredContribution * ((growthFactor - 1) / monthlyRate);

  assertFiniteCalculation(requiredContribution, "requiredContribution");
  assertFiniteCalculation(projectedFinalBalance, "projectedFinalBalance");

  return {
    targetAmount,
    months,
    annualRate,
    initialAmount,
    monthlyRate,
    requiredContribution,
    projectedFinalBalance,
    goalReachedWithoutContributions,
  };
}
