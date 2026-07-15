export type MathErrorCode =
  | "not-finite"
  | "not-safe-integer"
  | "zero-denominator"
  | "domain"
  | "overflow"
  | "division-by-zero"
  | "ambiguous-sign"
  | "no-solution";

export type MathCalculationError = {
  code: MathErrorCode;
  field?: string;
};

export type MathCalculationResult<T> =
  { ok: true; value: T } | { ok: false; error: MathCalculationError };

export function calculationError(
  code: MathErrorCode,
  field?: string,
): MathCalculationResult<never> {
  return { ok: false, error: field === undefined ? { code } : { code, field } };
}
