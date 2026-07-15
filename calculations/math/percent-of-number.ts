import { multiplyDivide, requireFinite } from "./number";
import { calculationError, type MathCalculationResult } from "./result";

export type PercentCalculation =
  | { mode: "percent-of-number"; number: number; percent: number }
  | { mode: "part-as-percent"; part: number; whole: number }
  | { mode: "whole-from-part"; part: number; percent: number };

export function calculatePercentOfNumber(
  number: number,
  percent: number,
): MathCalculationResult<number> {
  const validNumber = requireFinite(number, "number");
  if (!validNumber.ok) return validNumber;

  const validPercent = requireFinite(percent, "percent");
  if (!validPercent.ok) return validPercent;

  return multiplyDivide(number, percent, 100);
}

export function calculatePartAsPercent(
  part: number,
  whole: number,
): MathCalculationResult<number> {
  const validPart = requireFinite(part, "part");
  if (!validPart.ok) return validPart;

  const validWhole = requireFinite(whole, "whole");
  if (!validWhole.ok) return validWhole;
  if (whole === 0) return calculationError("zero-denominator", "whole");

  return multiplyDivide(part, 100, whole);
}

export function calculateWholeFromPart(
  part: number,
  percent: number,
): MathCalculationResult<number> {
  const validPart = requireFinite(part, "part");
  if (!validPart.ok) return validPart;

  const validPercent = requireFinite(percent, "percent");
  if (!validPercent.ok) return validPercent;
  if (percent === 0) {
    return calculationError("zero-denominator", "percent");
  }

  return multiplyDivide(part, 100, percent);
}

export function calculatePercentage(
  input: PercentCalculation,
): MathCalculationResult<number> {
  switch (input.mode) {
    case "percent-of-number":
      return calculatePercentOfNumber(input.number, input.percent);
    case "part-as-percent":
      return calculatePartAsPercent(input.part, input.whole);
    case "whole-from-part":
      return calculateWholeFromPart(input.part, input.percent);
  }
}
