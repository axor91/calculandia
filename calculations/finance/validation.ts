export const MAX_FINANCIAL_AMOUNT = 1_000_000_000_000_000;
export const MAX_ANNUAL_RATE = 1_000;
export const MIN_LOAN_MONTHS = 1;
export const MAX_LOAN_MONTHS = 600;
export const MAX_SCHEDULE_ROWS = 1_200;

export type FinanceValidationCode =
  | "not-finite"
  | "not-integer"
  | "below-minimum"
  | "above-maximum"
  | "invalid-down-payment"
  | "invalid-prepayment"
  | "schedule-limit"
  | "calculation-overflow";

export class FinanceValidationError extends RangeError {
  readonly code: FinanceValidationCode;
  readonly field: string;

  constructor(field: string, code: FinanceValidationCode, message: string) {
    super(message);
    this.name = "FinanceValidationError";
    this.field = field;
    this.code = code;
  }
}

interface NumberBounds {
  min: number;
  max: number;
  integer?: boolean;
}

export function assertNumberInRange(
  value: number,
  field: string,
  { min, max, integer = false }: NumberBounds,
): void {
  if (!Number.isFinite(value)) {
    throw new FinanceValidationError(
      field,
      "not-finite",
      `${field} must be finite`,
    );
  }

  if (integer && !Number.isInteger(value)) {
    throw new FinanceValidationError(
      field,
      "not-integer",
      `${field} must be an integer`,
    );
  }

  if (value < min) {
    throw new FinanceValidationError(
      field,
      "below-minimum",
      `${field} must be at least ${min}`,
    );
  }

  if (value > max) {
    throw new FinanceValidationError(
      field,
      "above-maximum",
      `${field} must be at most ${max}`,
    );
  }
}

export function assertPositiveAmount(value: number, field: string): void {
  assertNumberInRange(value, field, {
    min: Number.MIN_VALUE,
    max: MAX_FINANCIAL_AMOUNT,
  });
}

export function assertNonNegativeAmount(value: number, field: string): void {
  assertNumberInRange(value, field, {
    min: 0,
    max: MAX_FINANCIAL_AMOUNT,
  });
}

export function assertAnnualRate(value: number): void {
  assertNumberInRange(value, "annualRate", {
    min: 0,
    max: MAX_ANNUAL_RATE,
  });
}

export function assertLoanMonths(value: number, field = "months"): void {
  assertNumberInRange(value, field, {
    min: MIN_LOAN_MONTHS,
    max: MAX_LOAN_MONTHS,
    integer: true,
  });
}

export function assertScheduleLength(length: number): void {
  if (!Number.isInteger(length) || length < 0 || length > MAX_SCHEDULE_ROWS) {
    throw new FinanceValidationError(
      "schedule",
      "schedule-limit",
      `schedule may contain at most ${MAX_SCHEDULE_ROWS} rows`,
    );
  }
}

export function assertFiniteCalculation(value: number, field: string): void {
  if (!Number.isFinite(value)) {
    throw new FinanceValidationError(
      field,
      "calculation-overflow",
      `${field} is outside the supported calculation range`,
    );
  }
}
