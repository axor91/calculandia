import { requireFinite } from "./number";
import { calculationError, type MathCalculationResult } from "./result";

const MIN_VALUES = 2;
const MAX_VALUES = 200;

export type MeanResult = {
  mean: number;
  sum: number;
  count: number;
};

export type WeightedMeanResult = {
  mean: number;
  weightSum: number;
};

export function calculateMean(
  values: readonly number[],
): MathCalculationResult<MeanResult> {
  if (values.length < MIN_VALUES || values.length > MAX_VALUES) {
    return calculationError("domain", "values");
  }

  let sum = 0;
  for (const [index, value] of values.entries()) {
    const valid = requireFinite(value, `values.${index}`);
    if (!valid.ok) return valid;
    sum += value;
  }

  const mean = sum / values.length;
  if (!Number.isFinite(sum) || !Number.isFinite(mean)) {
    return calculationError("overflow");
  }

  return { ok: true, value: { mean, sum, count: values.length } };
}

export function calculateWeightedMean(
  values: readonly number[],
  weights: readonly number[],
): MathCalculationResult<WeightedMeanResult> {
  if (values.length < MIN_VALUES || values.length > MAX_VALUES) {
    return calculationError("domain", "values");
  }
  if (weights.length !== values.length) {
    return calculationError("domain", "weights");
  }

  let weightedSum = 0;
  let weightSum = 0;
  for (const [index, value] of values.entries()) {
    const validValue = requireFinite(value, `values.${index}`);
    if (!validValue.ok) return validValue;

    const weight = weights[index]!;
    const validWeight = requireFinite(weight, `weights.${index}`);
    if (!validWeight.ok) return validWeight;
    if (weight < 0) return calculationError("domain", `weights.${index}`);

    weightedSum += value * weight;
    weightSum += weight;
  }

  if (weightSum <= 0) {
    return calculationError("zero-denominator", "weights");
  }

  const mean = weightedSum / weightSum;
  if (!Number.isFinite(weightedSum) || !Number.isFinite(mean)) {
    return calculationError("overflow");
  }

  return { ok: true, value: { mean, weightSum } };
}
