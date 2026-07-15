import {
  calculateAmortization,
  type AmortizationResult,
  type LoanPaymentType,
} from "./amortization";
import {
  assertAnnualRate,
  assertLoanMonths,
  assertNonNegativeAmount,
  assertPositiveAmount,
  FinanceValidationError,
} from "./validation";

export interface MortgageInput {
  price: number;
  downPayment: number;
  annualRate: number;
  months: number;
  paymentType: LoanPaymentType;
}

export interface MortgageResult extends AmortizationResult {
  price: number;
  downPayment: number;
  financedAmount: number;
}

export function calculateMortgage(input: MortgageInput): MortgageResult {
  const { price, downPayment, annualRate, months, paymentType } = input;
  assertPositiveAmount(price, "price");
  assertNonNegativeAmount(downPayment, "downPayment");
  assertAnnualRate(annualRate);
  assertLoanMonths(months);

  if (downPayment >= price) {
    throw new FinanceValidationError(
      "downPayment",
      "invalid-down-payment",
      "downPayment must be less than price",
    );
  }

  const financedAmount = price - downPayment;
  const amortization = calculateAmortization({
    principal: financedAmount,
    annualRate,
    months,
    paymentType,
  });

  return {
    ...amortization,
    price,
    downPayment,
    financedAmount,
  };
}
