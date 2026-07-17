import { requireFinite } from "./number";
import { calculationError, type MathCalculationResult } from "./result";

export type QuadraticSolution =
  | { kind: "two-real"; x1: number; x2: number; discriminant: number }
  | { kind: "one-real"; x: number; discriminant: number }
  | { kind: "complex"; re: number; im: number; discriminant: number };

/**
 * Sign used by the numerically stable formula below. Zero is treated as
 * positive so the b = 0 case still avoids the q = 0 degeneracy.
 */
function signOrPositive(value: number): 1 | -1 {
  return value < 0 ? -1 : 1;
}

export function calculateQuadratic(
  a: number,
  b: number,
  c: number,
): MathCalculationResult<QuadraticSolution> {
  const validA = requireFinite(a, "a");
  if (!validA.ok) return validA;
  const validB = requireFinite(b, "b");
  if (!validB.ok) return validB;
  const validC = requireFinite(c, "c");
  if (!validC.ok) return validC;

  if (a === 0) {
    return calculationError("domain", "a");
  }

  const discriminant = b * b - 4 * a * c;
  if (!Number.isFinite(discriminant)) {
    return calculationError("overflow", "discriminant");
  }

  if (discriminant < 0) {
    const re = -b / (2 * a);
    const im = Math.sqrt(-discriminant) / (2 * Math.abs(a));
    if (!Number.isFinite(re) || !Number.isFinite(im)) {
      return calculationError("overflow");
    }
    return { ok: true, value: { kind: "complex", re, im, discriminant } };
  }

  if (discriminant === 0) {
    const x = -b / (2 * a);
    if (!Number.isFinite(x)) return calculationError("overflow");
    return { ok: true, value: { kind: "one-real", x, discriminant } };
  }

  // Numerically stable formula (avoids catastrophic cancellation between
  // -b and sqrt(discriminant) when they are close in magnitude):
  // q = -(b + sign(b) * sqrt(D)) / 2; x1 = q / a; x2 = c / q.
  const sqrtDiscriminant = Math.sqrt(discriminant);
  const q = -(b + signOrPositive(b) * sqrtDiscriminant) / 2;
  const x1 = q / a;
  const x2 = c / q;
  if (!Number.isFinite(x1) || !Number.isFinite(x2)) {
    return calculationError("overflow");
  }

  return {
    ok: true,
    value: {
      kind: "two-real",
      x1: Math.min(x1, x2),
      x2: Math.max(x1, x2),
      discriminant,
    },
  };
}
