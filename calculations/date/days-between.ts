import {
  calendarDateToOrdinal,
  compareCalendarDates,
  isCalendarDate,
  isWithinCalendarInterval,
  type CalendarDate,
} from "./calendar";

export type DaysBetweenInput = Readonly<{
  start: CalendarDate;
  end: CalendarDate;
  includeEnd: boolean;
}>;

export type DaysBetweenResult = Readonly<{
  totalDays: number;
  absoluteDays: number;
  fullWeeks: number;
  remainderDays: number;
  direction: "forward" | "backward" | "same";
  includesEnd: boolean;
}>;

export function calculateDaysBetween(
  input: DaysBetweenInput,
): DaysBetweenResult | null {
  if (
    !input ||
    typeof input !== "object" ||
    !isCalendarDate(input.start) ||
    !isCalendarDate(input.end) ||
    typeof input.includeEnd !== "boolean" ||
    !isWithinCalendarInterval(input.start, input.end)
  ) {
    return null;
  }

  const startOrdinal = calendarDateToOrdinal(input.start) as number;
  const endOrdinal = calendarDateToOrdinal(input.end) as number;
  const exclusiveDays = endOrdinal - startOrdinal;
  const totalDays = input.includeEnd
    ? exclusiveDays + (exclusiveDays < 0 ? -1 : 1)
    : exclusiveDays;
  const absoluteDays = Math.abs(totalDays);
  const order = compareCalendarDates(input.start, input.end);

  return {
    totalDays,
    absoluteDays,
    fullWeeks: Math.floor(absoluteDays / 7),
    remainderDays: absoluteDays % 7,
    direction: order === 0 ? "same" : order === -1 ? "forward" : "backward",
    includesEnd: input.includeEnd,
  };
}
