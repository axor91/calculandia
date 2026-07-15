import {
  assertAnnualRate,
  assertFiniteCalculation,
  assertLoanMonths,
  assertNonNegativeAmount,
  assertPositiveAmount,
  assertScheduleLength,
} from "./validation";

export interface DepositInput {
  initialPrincipal: number;
  annualRate: number;
  months: number;
  monthlyContribution: number;
}

export interface DepositRow {
  month: number;
  openingBalance: number;
  interest: number;
  contribution: number;
  closingBalance: number;
}

export interface DepositResult {
  initialPrincipal: number;
  annualRate: number;
  monthlyRate: number;
  months: number;
  monthlyContribution: number;
  totalUserContributions: number;
  interestIncome: number;
  finalBalance: number;
  schedule: readonly DepositRow[];
}

export function calculateDeposit(input: DepositInput): DepositResult {
  const { initialPrincipal, annualRate, months, monthlyContribution } = input;
  assertPositiveAmount(initialPrincipal, "initialPrincipal");
  assertAnnualRate(annualRate);
  assertLoanMonths(months);
  assertNonNegativeAmount(monthlyContribution, "monthlyContribution");
  assertScheduleLength(months);

  const monthlyRate = annualRate / 12 / 100;
  const schedule: DepositRow[] = [];
  let balance = initialPrincipal;
  let interestIncome = 0;

  for (let month = 1; month <= months; month += 1) {
    const openingBalance = balance;
    const interest = openingBalance * monthlyRate;
    balance = openingBalance + interest + monthlyContribution;
    interestIncome += interest;

    assertFiniteCalculation(interest, `schedule[${month - 1}].interest`);
    assertFiniteCalculation(balance, `schedule[${month - 1}].closingBalance`);
    schedule.push({
      month,
      openingBalance,
      interest,
      contribution: monthlyContribution,
      closingBalance: balance,
    });
  }

  const totalUserContributions =
    initialPrincipal + months * monthlyContribution;
  assertFiniteCalculation(totalUserContributions, "totalUserContributions");
  assertFiniteCalculation(interestIncome, "interestIncome");

  return {
    initialPrincipal,
    annualRate,
    monthlyRate,
    months,
    monthlyContribution,
    totalUserContributions,
    interestIncome,
    finalBalance: balance,
    schedule,
  };
}
