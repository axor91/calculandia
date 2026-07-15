export const lengthUnits = ["mm", "cm", "m"] as const;
export type LengthUnit = (typeof lengthUnits)[number];

export type Length = Readonly<{
  value: number;
  unit: LengthUnit;
}>;

export const MAX_LENGTH_METRES = 10_000;
export const MAX_CONSTRUCTION_COUNT = 10_000;
export const MAX_OPENING_ROWS = 100;
export const MAX_RESERVE_PERCENT = 100;
export const MAX_CALCULATED_QUANTITY = 1_000_000_000_000_000;

const metresPerUnit: Readonly<Record<LengthUnit, number>> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
};

export function lengthToMetres(
  length: Length,
  options: Readonly<{ allowZero?: boolean }> = {},
): number | null {
  if (
    !length ||
    typeof length !== "object" ||
    !Number.isFinite(length.value) ||
    !lengthUnits.includes(length.unit)
  ) {
    return null;
  }

  const metres = length.value * metresPerUnit[length.unit];
  const validMinimum = options.allowZero ? metres >= 0 : metres > 0;
  return validMinimum && metres <= MAX_LENGTH_METRES ? metres : null;
}

export function isConstructionCount(value: number): boolean {
  return (
    Number.isSafeInteger(value) && value >= 1 && value <= MAX_CONSTRUCTION_COUNT
  );
}

export function isReservePercent(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= MAX_RESERVE_PERCENT;
}

export function isCalculatedQuantity(value: number): boolean {
  return (
    Number.isFinite(value) && value > 0 && value <= MAX_CALCULATED_QUANTITY
  );
}

export function ceilQuantity(value: number): number {
  return Math.ceil(value);
}

export function floorQuantity(value: number): number {
  return Math.floor(value);
}

function decimalFraction(value: number): readonly [bigint, bigint] {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError("Decimal quantity must be finite and non-negative");
  }
  const [coefficient, exponentText = "0"] = value.toString().split("e");
  const exponent = Number(exponentText);
  const [integer, fraction = ""] = coefficient.split(".");
  const digits = BigInt(`${integer}${fraction}`);
  const scale = fraction.length - exponent;
  return scale >= 0
    ? [digits, 10n ** BigInt(scale)]
    : [digits * 10n ** BigInt(-scale), 1n];
}

function decimalRatioParts(
  numerator: number,
  denominator: number,
): readonly [bigint, bigint] {
  if (!(denominator > 0)) {
    throw new RangeError("Decimal denominator must be positive");
  }
  const [numeratorValue, numeratorScale] = decimalFraction(numerator);
  const [denominatorValue, denominatorScale] = decimalFraction(denominator);
  return [numeratorValue * denominatorScale, numeratorScale * denominatorValue];
}

export function ceilDecimalRatio(
  numerator: number,
  denominator: number,
): number {
  const [value, scale] = decimalRatioParts(numerator, denominator);
  const quotient = value / scale;
  return Number(value % scale === 0n ? quotient : quotient + 1n);
}

export function floorDecimalRatio(
  numerator: number,
  denominator: number,
): number {
  const [value, scale] = decimalRatioParts(numerator, denominator);
  return Number(value / scale);
}

export function multiplyDecimal(value: number, multiplier: number): number {
  if (!Number.isSafeInteger(multiplier) || multiplier < 0) {
    throw new RangeError("Decimal multiplier must be a non-negative integer");
  }
  const [decimal, scale] = decimalFraction(value);
  return Number(decimal * BigInt(multiplier)) / Number(scale);
}
