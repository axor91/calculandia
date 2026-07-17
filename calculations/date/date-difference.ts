import { calculateCalendarComponentDifference } from "./age";
import { compareCalendarDates, type CalendarDate } from "./calendar";
import { calculateDaysBetween } from "./days-between";

export type DateDifferenceInput = Readonly<{
  first: CalendarDate;
  second: CalendarDate;
}>;

export type DateDifferenceResult = Readonly<{
  years: number;
  months: number;
  days: number;
  totalDays: number;
  absoluteDays: number;
  direction: "forward" | "backward" | "same";
  reversed: boolean;
}>;

export function calculateDateDifference(
  input: DateDifferenceInput,
): DateDifferenceResult | null {
  if (!input || typeof input !== "object") return null;

  const order = compareCalendarDates(input.first, input.second);
  if (order === null) return null;

  const earlier = order === 1 ? input.second : input.first;
  const later = order === 1 ? input.first : input.second;

  const components = calculateCalendarComponentDifference(earlier, later);
  const daysBetween = calculateDaysBetween({
    start: input.first,
    end: input.second,
    includeEnd: false,
  });
  if (!components || !daysBetween) return null;

  return {
    years: components.years,
    months: components.months,
    days: components.days,
    totalDays: daysBetween.totalDays,
    absoluteDays: daysBetween.absoluteDays,
    direction: daysBetween.direction,
    reversed: order === 1,
  };
}
