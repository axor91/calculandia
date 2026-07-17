import { calculateDaysBetween } from "./days-between";
import type { CalendarDate } from "./calendar";

export type CountdownInput = Readonly<{
  asOf: CalendarDate;
  target: CalendarDate;
}>;

export type CountdownResult = Readonly<{
  totalDays: number;
  absoluteDays: number;
  fullWeeks: number;
  remainderDays: number;
  direction: "forward" | "backward" | "same";
}>;

export function calculateCountdown(
  input: CountdownInput,
): CountdownResult | null {
  if (!input || typeof input !== "object") return null;

  const result = calculateDaysBetween({
    start: input.asOf,
    end: input.target,
    includeEnd: false,
  });
  if (!result) return null;

  return {
    totalDays: result.totalDays,
    absoluteDays: result.absoluteDays,
    fullWeeks: result.fullWeeks,
    remainderDays: result.remainderDays,
    direction: result.direction,
  };
}
