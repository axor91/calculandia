// Процентное изменение (от первого числа)
export function calculatePercentDifference(
  baseValue: number,
  nextValue: number,
): number | null {
  if (
    !Number.isFinite(baseValue) ||
    !Number.isFinite(nextValue) ||
    baseValue === 0
  ) {
    return null;
  }
  const diff = ((nextValue - baseValue) / Math.abs(baseValue)) * 100;
  return diff;
}

// Процентная разница от среднего (симметричная)
export function calculatePercentDifferenceAverage(
  value1: number,
  value2: number,
): number | null {
  if (!Number.isFinite(value1) || !Number.isFinite(value2)) {
    return null;
  }
  const average = (value1 + value2) / 2;
  if (average === 0) {
    return null;
  }
  const diff = (Math.abs(value1 - value2) / average) * 100;
  return diff;
}

// Процентное соотношение (от меньшего числа)
export function calculatePercentRatio(
  value1: number,
  value2: number,
): number | null {
  if (!Number.isFinite(value1) || !Number.isFinite(value2)) {
    return null;
  }
  const smaller = Math.min(Math.abs(value1), Math.abs(value2));
  const larger = Math.max(Math.abs(value1), Math.abs(value2));

  if (smaller === 0) {
    return null;
  }

  const diff = ((larger - smaller) / smaller) * 100;
  return diff;
}
