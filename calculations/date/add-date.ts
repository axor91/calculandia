import {
  addDaysExact,
  addMonthsClamped,
  addYearsClamped,
  calendarDateToOrdinal,
  isCalendarDate,
  isWithinCalendarInterval,
  type CalendarDate,
} from "./calendar";

export const MAX_DATE_OFFSET_YEARS = 200;
export const MAX_DATE_OFFSET_MONTHS = 2400;
export const MAX_DATE_OFFSET_DAYS = 73_049;

export type AddDateInput = Readonly<{
  date: CalendarDate;
  years: number;
  months: number;
  days: number;
}>;

export type AddDateResult = Readonly<{
  date: CalendarDate;
  signedCalendarDaysFromStart: number;
  appliedInOrder: readonly ["years", "months", "days"];
}>;

function isOffset(value: number, maximumAbsoluteValue: number): boolean {
  return Number.isSafeInteger(value) && Math.abs(value) <= maximumAbsoluteValue;
}

export function calculateDateShift(input: AddDateInput): AddDateResult | null {
  if (
    !input ||
    typeof input !== "object" ||
    !isCalendarDate(input.date) ||
    !isOffset(input.years, MAX_DATE_OFFSET_YEARS) ||
    !isOffset(input.months, MAX_DATE_OFFSET_MONTHS) ||
    !isOffset(input.days, MAX_DATE_OFFSET_DAYS)
  ) {
    return null;
  }

  const afterYears = addYearsClamped(input.date, input.years);
  if (!afterYears) return null;
  const afterMonths = addMonthsClamped(afterYears, input.months);
  if (!afterMonths) return null;
  const result = addDaysExact(afterMonths, input.days);
  if (!result || !isWithinCalendarInterval(input.date, result)) return null;

  return {
    date: result,
    signedCalendarDaysFromStart:
      (calendarDateToOrdinal(result) as number) -
      (calendarDateToOrdinal(input.date) as number),
    appliedInOrder: ["years", "months", "days"],
  };
}
