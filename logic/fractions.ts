export type Fraction = { numerator: number; denominator: number };

export type MixedFraction = { whole: number; numerator: number; denominator: number };

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function simplifyFraction(fr: Fraction): Fraction {
  if (!Number.isFinite(fr.numerator) || !Number.isFinite(fr.denominator) || fr.denominator === 0) {
    return { numerator: NaN, denominator: NaN };
  }
  const sign = fr.denominator < 0 ? -1 : 1;
  const n = fr.numerator * sign;
  const d = Math.abs(fr.denominator);
  const g = gcd(n, d);
  return { numerator: n / g, denominator: d / g };
}

export function fromMixed(whole: number, numerator: number, denominator: number): Fraction | null {
  if (!Number.isFinite(denominator) || denominator === 0) return null;
  if (!Number.isFinite(whole)) whole = 0;
  if (!Number.isFinite(numerator)) numerator = 0;
  const sign = whole < 0 ? -1 : 1;
  const absWhole = Math.abs(whole);
  const improperNumerator = sign * (absWhole * denominator + numerator * sign);
  return simplifyFraction({ numerator: improperNumerator, denominator });
}

export function toMixed(fr: Fraction): MixedFraction | null {
  const s = simplifyFraction(fr);
  if (!Number.isFinite(s.numerator) || !Number.isFinite(s.denominator)) return null;
  const sign = s.numerator < 0 ? -1 : 1;
  const absNum = Math.abs(s.numerator);
  const whole = Math.trunc(absNum / s.denominator) * sign;
  const rest = absNum % s.denominator;
  return { whole, numerator: rest, denominator: s.denominator };
}

export function addFractions(a: Fraction, b: Fraction): Fraction | null {
  if (a.denominator === 0 || b.denominator === 0) return null;
  const n = a.numerator * b.denominator + b.numerator * a.denominator;
  const d = a.denominator * b.denominator;
  return simplifyFraction({ numerator: n, denominator: d });
}

export function subFractions(a: Fraction, b: Fraction): Fraction | null {
  return addFractions(a, { numerator: -b.numerator, denominator: b.denominator } as Fraction);
}

export function mulFractions(a: Fraction, b: Fraction): Fraction | null {
  if (a.denominator === 0 || b.denominator === 0) return null;
  return simplifyFraction({ numerator: a.numerator * b.numerator, denominator: a.denominator * b.denominator });
}

export function divFractions(a: Fraction, b: Fraction): Fraction | null {
  if (a.denominator === 0 || b.denominator === 0 || b.numerator === 0) return null;
  return simplifyFraction({ numerator: a.numerator * b.denominator, denominator: a.denominator * b.numerator });
}


