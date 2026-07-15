import { calculationError, type MathCalculationResult } from "./result";

export type Rational = Readonly<{
  numerator: bigint;
  denominator: bigint;
}>;

export type MixedFractionInput = Readonly<{
  whole: number;
  numerator: number;
  denominator: number;
}>;

export type FractionOperation = "add" | "subtract" | "multiply" | "divide";

export type MixedFraction = Readonly<{
  sign: -1 | 0 | 1;
  whole: bigint;
  numerator: bigint;
  denominator: bigint;
}>;

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function greatestCommonDivisor(first: bigint, second: bigint): bigint {
  let a = absolute(first);
  let b = absolute(second);

  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }

  return a === 0n ? 1n : a;
}

export function normalizeRational(
  numerator: bigint,
  denominator: bigint,
): MathCalculationResult<Rational> {
  if (denominator === 0n) {
    return calculationError("zero-denominator", "denominator");
  }
  if (numerator === 0n) {
    return { ok: true, value: { numerator: 0n, denominator: 1n } };
  }

  const sign = denominator < 0n ? -1n : 1n;
  const signedNumerator = numerator * sign;
  const positiveDenominator = absolute(denominator);
  const divisor = greatestCommonDivisor(signedNumerator, positiveDenominator);

  return {
    ok: true,
    value: {
      numerator: signedNumerator / divisor,
      denominator: positiveDenominator / divisor,
    },
  };
}

function requireSafeInteger(
  value: number,
  field: string,
): MathCalculationResult<number> {
  if (!Number.isSafeInteger(value)) {
    return calculationError("not-safe-integer", field);
  }

  return { ok: true, value };
}

export function fractionFromMixed(
  input: MixedFractionInput,
): MathCalculationResult<Rational> {
  const validWhole = requireSafeInteger(input.whole, "whole");
  if (!validWhole.ok) return validWhole;

  const validNumerator = requireSafeInteger(input.numerator, "numerator");
  if (!validNumerator.ok) return validNumerator;

  const validDenominator = requireSafeInteger(input.denominator, "denominator");
  if (!validDenominator.ok) return validDenominator;
  if (input.denominator === 0) {
    return calculationError("zero-denominator", "denominator");
  }

  const denominator = BigInt(Math.abs(input.denominator));
  const normalizedNumerator =
    BigInt(input.numerator) * BigInt(Math.sign(input.denominator));
  const hasWholePart = input.whole !== 0 || Object.is(input.whole, -0);

  if (hasWholePart && normalizedNumerator < 0n) {
    return calculationError("ambiguous-sign", "numerator");
  }

  if (!hasWholePart) {
    return normalizeRational(normalizedNumerator, denominator);
  }

  const magnitude =
    BigInt(Math.abs(input.whole)) * denominator + normalizedNumerator;
  const isNegative = input.whole < 0 || Object.is(input.whole, -0);

  return normalizeRational(isNegative ? -magnitude : magnitude, denominator);
}

export function applyFractionOperation(
  left: Rational,
  right: Rational,
  operation: FractionOperation,
): MathCalculationResult<Rational> {
  const normalizedLeft = normalizeRational(left.numerator, left.denominator);
  if (!normalizedLeft.ok) return normalizedLeft;

  const normalizedRight = normalizeRational(right.numerator, right.denominator);
  if (!normalizedRight.ok) return normalizedRight;

  const a = normalizedLeft.value;
  const b = normalizedRight.value;

  switch (operation) {
    case "add":
      return normalizeRational(
        a.numerator * b.denominator + b.numerator * a.denominator,
        a.denominator * b.denominator,
      );
    case "subtract":
      return normalizeRational(
        a.numerator * b.denominator - b.numerator * a.denominator,
        a.denominator * b.denominator,
      );
    case "multiply":
      return normalizeRational(
        a.numerator * b.numerator,
        a.denominator * b.denominator,
      );
    case "divide":
      if (b.numerator === 0n) {
        return calculationError("division-by-zero", "right");
      }
      return normalizeRational(
        a.numerator * b.denominator,
        a.denominator * b.numerator,
      );
  }
}

export function calculateFractions(
  left: MixedFractionInput,
  right: MixedFractionInput,
  operation: FractionOperation,
): MathCalculationResult<Rational> {
  const leftFraction = fractionFromMixed(left);
  if (!leftFraction.ok) {
    return {
      ok: false,
      error: {
        ...leftFraction.error,
        field: `left.${leftFraction.error.field}`,
      },
    };
  }

  const rightFraction = fractionFromMixed(right);
  if (!rightFraction.ok) {
    return {
      ok: false,
      error: {
        ...rightFraction.error,
        field: `right.${rightFraction.error.field}`,
      },
    };
  }

  return applyFractionOperation(
    leftFraction.value,
    rightFraction.value,
    operation,
  );
}

export function toMixedFraction(rational: Rational): MixedFraction {
  const normalized = normalizeRational(
    rational.numerator,
    rational.denominator,
  );
  if (!normalized.ok) {
    throw new RangeError("A mixed fraction requires a non-zero denominator");
  }

  const { numerator, denominator } = normalized.value;
  if (numerator === 0n) {
    return { sign: 0, whole: 0n, numerator: 0n, denominator: 1n };
  }

  const magnitude = absolute(numerator);
  return {
    sign: numerator < 0n ? -1 : 1,
    whole: magnitude / denominator,
    numerator: magnitude % denominator,
    denominator,
  };
}

export function formatRational(rational: Rational, mixed = true): string {
  const normalized = normalizeRational(
    rational.numerator,
    rational.denominator,
  );
  if (!normalized.ok) {
    throw new RangeError(
      "A formatted fraction requires a non-zero denominator",
    );
  }

  const canonical = normalized.value;
  const value = toMixedFraction(canonical);
  if (value.sign === 0) return "0";

  const prefix = value.sign < 0 ? "-" : "";
  if (!mixed || value.whole === 0n) {
    const numerator = mixed ? value.numerator : absolute(canonical.numerator);
    const denominator = canonical.denominator;
    return `${prefix}${numerator}/${denominator}`;
  }
  if (value.numerator === 0n) return `${prefix}${value.whole}`;

  return `${prefix}${value.whole} ${value.numerator}/${value.denominator}`;
}
