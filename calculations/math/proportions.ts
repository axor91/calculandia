import { multiplyDivide, requireFinite } from "./number";
import { calculationError, type MathCalculationResult } from "./result";

export type ProportionPosition = "a" | "b" | "c" | "d";

export type ProportionInput =
  | { unknown: "a"; b: number; c: number; d: number }
  | { unknown: "b"; a: number; c: number; d: number }
  | { unknown: "c"; a: number; b: number; d: number }
  | { unknown: "d"; a: number; b: number; c: number };

export type ProportionSolution = {
  position: ProportionPosition;
  value: number;
};

function validateKnownValues(
  input: ProportionInput,
): MathCalculationResult<true> {
  for (const [field, value] of Object.entries(input)) {
    if (field === "unknown") continue;
    const valid = requireFinite(value as number, field);
    if (!valid.ok) return valid;
  }

  return { ok: true, value: true };
}

function solved(
  position: ProportionPosition,
  result: MathCalculationResult<number>,
): MathCalculationResult<ProportionSolution> {
  return result.ok
    ? { ok: true, value: { position, value: result.value } }
    : result;
}

export function solveProportion(
  input: ProportionInput,
): MathCalculationResult<ProportionSolution> {
  const valid = validateKnownValues(input);
  if (!valid.ok) return valid;

  switch (input.unknown) {
    case "a":
      if (input.b === 0) return calculationError("zero-denominator", "b");
      if (input.d === 0) return calculationError("zero-denominator", "d");
      return solved("a", multiplyDivide(input.b, input.c, input.d));

    case "b": {
      if (input.d === 0) return calculationError("zero-denominator", "d");
      if (input.c === 0) return calculationError("no-solution", "c");
      const result = multiplyDivide(input.a, input.d, input.c);
      if (result.ok && result.value === 0) {
        return calculationError("no-solution", "b");
      }
      return solved("b", result);
    }

    case "c":
      if (input.b === 0) return calculationError("zero-denominator", "b");
      if (input.d === 0) return calculationError("zero-denominator", "d");
      return solved("c", multiplyDivide(input.a, input.d, input.b));

    case "d": {
      if (input.b === 0) return calculationError("zero-denominator", "b");
      if (input.a === 0) return calculationError("no-solution", "a");
      const result = multiplyDivide(input.b, input.c, input.a);
      if (result.ok && result.value === 0) {
        return calculationError("no-solution", "d");
      }
      return solved("d", result);
    }
  }
}
