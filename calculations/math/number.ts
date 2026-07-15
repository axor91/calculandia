import { calculationError, type MathCalculationResult } from "./result";

export function requireFinite(
  value: number,
  field: string,
): MathCalculationResult<number> {
  if (!Number.isFinite(value)) {
    return calculationError("not-finite", field);
  }

  return { ok: true, value };
}

export function finiteNumberResult(
  value: number,
): MathCalculationResult<number> {
  if (!Number.isFinite(value)) {
    return calculationError("overflow");
  }

  return { ok: true, value: Object.is(value, -0) ? 0 : value };
}

/** Computes a * b / divisor while avoiding an avoidable intermediate overflow. */
export function multiplyDivide(
  a: number,
  b: number,
  divisor: number,
): MathCalculationResult<number> {
  if (divisor === 0) {
    return calculationError("division-by-zero");
  }

  const product = a * b;
  const direct = product / divisor;
  if (Number.isFinite(direct) && (direct !== 0 || a === 0 || b === 0)) {
    return finiteNumberResult(direct);
  }

  const divideAFirst = (a / divisor) * b;
  if (Number.isFinite(divideAFirst) && divideAFirst !== 0) {
    return finiteNumberResult(divideAFirst);
  }

  const divideBFirst = a * (b / divisor);
  if (Number.isFinite(divideBFirst) && divideBFirst !== 0) {
    return finiteNumberResult(divideBFirst);
  }

  return finiteNumberResult(direct);
}
