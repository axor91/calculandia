import { calculationError, type MathCalculationResult } from "./result";

const MIN_VALUES = 2;
const MAX_VALUES = 10;
const MAX_INPUT_VALUE = 1e15;

export type GcdLcmResult = {
  gcd: number;
  lcm: number;
};

/**
 * Euclidean algorithm on regular numbers. Fractions.ts keeps its own bigint
 * variant private for exact rational reduction; this module works with plain
 * safe integers up to 1e15, so a dedicated numeric implementation avoids
 * bigint conversions on every step without duplicating the fraction engine's
 * public surface.
 */
function euclideanGcd(a: number, b: number): number {
  let x = a;
  let y = b;
  while (y !== 0) {
    const remainder = x % y;
    x = y;
    y = remainder;
  }
  return x;
}

export function calculateGcdLcm(
  values: readonly number[],
): MathCalculationResult<GcdLcmResult> {
  if (values.length < MIN_VALUES || values.length > MAX_VALUES) {
    return calculationError("domain", "values");
  }

  for (const [index, value] of values.entries()) {
    if (!Number.isFinite(value) || !Number.isSafeInteger(value)) {
      return calculationError("not-safe-integer", `values.${index}`);
    }
    if (value < 1 || value > MAX_INPUT_VALUE) {
      return calculationError("domain", `values.${index}`);
    }
  }

  let gcd = values[0]!;
  for (let index = 1; index < values.length; index += 1) {
    gcd = euclideanGcd(gcd, values[index]!);
  }

  let lcm = values[0]!;
  for (let index = 1; index < values.length; index += 1) {
    const step = values[index]!;
    const stepGcd = euclideanGcd(lcm, step);
    const next = (lcm / stepGcd) * step;
    if (!Number.isFinite(next) || !Number.isSafeInteger(next)) {
      return calculationError("overflow", "lcm");
    }
    lcm = next;
  }

  return { ok: true, value: { gcd, lcm } };
}
