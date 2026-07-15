import { finiteNumberResult, requireFinite } from "./number";
import { calculationError, type MathCalculationResult } from "./result";

export function calculateRelativePercentChange(
  oldValue: number,
  newValue: number,
): MathCalculationResult<number> {
  const validOld = requireFinite(oldValue, "oldValue");
  if (!validOld.ok) return validOld;

  const validNew = requireFinite(newValue, "newValue");
  if (!validNew.ok) return validNew;

  if (oldValue <= 0) return calculationError("domain", "oldValue");
  if (newValue < 0) return calculationError("domain", "newValue");

  const difference = newValue - oldValue;
  const result = Number.isFinite(difference)
    ? (difference / oldValue) * 100
    : (newValue / oldValue - 1) * 100;

  return finiteNumberResult(result);
}

export function calculateSymmetricPercentDifference(
  first: number,
  second: number,
): MathCalculationResult<number> {
  const validFirst = requireFinite(first, "first");
  if (!validFirst.ok) return validFirst;

  const validSecond = requireFinite(second, "second");
  if (!validSecond.ok) return validSecond;

  if (first < 0) return calculationError("domain", "first");
  if (second < 0) return calculationError("domain", "second");
  if (first === 0 && second === 0) {
    return calculationError("domain");
  }
  if (first === second) return { ok: true, value: 0 };

  const scale = Math.max(first, second);
  const scaledFirst = first / scale;
  const scaledSecond = second / scale;
  const result =
    (200 * Math.abs(scaledFirst - scaledSecond)) / (scaledFirst + scaledSecond);

  return finiteNumberResult(result);
}
