export const MAX_TIME_HOURS = 9999;
export const MIN_TIME_INTERVALS = 2;
export const MAX_TIME_INTERVALS = 20;

export type TimeDuration = Readonly<{ hours: number; minutes: number }>;

export type TimeOperation = "add" | "subtract";

export type TimeArithmeticInput = Readonly<{
  first: TimeDuration;
  second: TimeDuration;
  operation: TimeOperation;
}>;

export type TimeResult = Readonly<{
  totalMinutes: number;
  sign: -1 | 0 | 1;
  days: number;
  hours: number;
  minutes: number;
}>;

export type TimeIntervalSumInput = Readonly<{
  intervals: readonly TimeDuration[];
}>;

function toMinutes(duration: TimeDuration): number | null {
  if (
    !duration ||
    typeof duration !== "object" ||
    !Number.isInteger(duration.hours) ||
    !Number.isInteger(duration.minutes) ||
    duration.hours < 0 ||
    duration.hours > MAX_TIME_HOURS ||
    duration.minutes < 0 ||
    duration.minutes > 59
  ) {
    return null;
  }
  return duration.hours * 60 + duration.minutes;
}

function normalizeMinutes(totalMinutes: number): TimeResult {
  const sign = totalMinutes < 0 ? -1 : totalMinutes > 0 ? 1 : 0;
  const absoluteMinutes = Math.abs(totalMinutes);
  const days = Math.floor(absoluteMinutes / 1440);
  const remainderMinutes = absoluteMinutes % 1440;
  return {
    totalMinutes,
    sign,
    days,
    hours: Math.floor(remainderMinutes / 60),
    minutes: remainderMinutes % 60,
  };
}

export function calculateTimeArithmetic(
  input: TimeArithmeticInput,
): TimeResult | null {
  if (!input || typeof input !== "object") return null;
  if (input.operation !== "add" && input.operation !== "subtract") return null;

  const first = toMinutes(input.first);
  const second = toMinutes(input.second);
  if (first === null || second === null) return null;

  const totalMinutes =
    input.operation === "add" ? first + second : first - second;
  return normalizeMinutes(totalMinutes);
}

export function calculateTimeIntervalSum(
  input: TimeIntervalSumInput,
): TimeResult | null {
  if (
    !input ||
    typeof input !== "object" ||
    !Array.isArray(input.intervals) ||
    input.intervals.length < MIN_TIME_INTERVALS ||
    input.intervals.length > MAX_TIME_INTERVALS
  ) {
    return null;
  }

  let totalMinutes = 0;
  for (const interval of input.intervals) {
    const minutes = toMinutes(interval);
    if (minutes === null) return null;
    totalMinutes += minutes;
  }
  return normalizeMinutes(totalMinutes);
}
