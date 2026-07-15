import {
  calculateAmortization,
  type AmortizationResult,
  type LoanTerms,
} from "./amortization";

export type CreditInput = LoanTerms;
export type CreditResult = AmortizationResult;

export function calculateCredit(input: CreditInput): CreditResult {
  return calculateAmortization(input);
}
