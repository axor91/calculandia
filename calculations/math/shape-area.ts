import { requireFinite } from "./number";
import { calculationError, type MathCalculationResult } from "./result";

function requirePositive(
  value: number,
  field: string,
): MathCalculationResult<number> {
  const valid = requireFinite(value, field);
  if (!valid.ok) return valid;
  if (value <= 0) return calculationError("domain", field);
  return valid;
}

function areaResult(area: number): MathCalculationResult<number> {
  if (!Number.isFinite(area)) return calculationError("overflow");
  return { ok: true, value: area };
}

export function calculateRectangleArea(
  width: number,
  height: number,
): MathCalculationResult<number> {
  const validWidth = requirePositive(width, "width");
  if (!validWidth.ok) return validWidth;
  const validHeight = requirePositive(height, "height");
  if (!validHeight.ok) return validHeight;

  return areaResult(width * height);
}

export function calculateTriangleBaseHeightArea(
  base: number,
  height: number,
): MathCalculationResult<number> {
  const validBase = requirePositive(base, "base");
  if (!validBase.ok) return validBase;
  const validHeight = requirePositive(height, "height");
  if (!validHeight.ok) return validHeight;

  return areaResult((base * height) / 2);
}

export function calculateTriangleSidesArea(
  a: number,
  b: number,
  c: number,
): MathCalculationResult<number> {
  const validA = requirePositive(a, "a");
  if (!validA.ok) return validA;
  const validB = requirePositive(b, "b");
  if (!validB.ok) return validB;
  const validC = requirePositive(c, "c");
  if (!validC.ok) return validC;

  if (a + b <= c || a + c <= b || b + c <= a) {
    return calculationError("domain", "sides");
  }

  const s = (a + b + c) / 2;
  return areaResult(Math.sqrt(s * (s - a) * (s - b) * (s - c)));
}

export function calculateCircleArea(
  radius: number,
): MathCalculationResult<number> {
  const validRadius = requirePositive(radius, "radius");
  if (!validRadius.ok) return validRadius;

  return areaResult(Math.PI * radius * radius);
}

export function calculateTrapezoidArea(
  a: number,
  b: number,
  height: number,
): MathCalculationResult<number> {
  const validA = requirePositive(a, "a");
  if (!validA.ok) return validA;
  const validB = requirePositive(b, "b");
  if (!validB.ok) return validB;
  const validHeight = requirePositive(height, "height");
  if (!validHeight.ok) return validHeight;

  return areaResult(((a + b) / 2) * height);
}
