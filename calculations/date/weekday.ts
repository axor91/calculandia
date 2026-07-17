import { calendarDateToOrdinal, type CalendarDate } from "./calendar";

export const weekdayNames = [
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
  "воскресенье",
] as const;

export type WeekdayResult = Readonly<{
  weekdayIndex: number;
  name: (typeof weekdayNames)[number];
}>;

// calendarDateToOrdinal counts days since the proleptic Gregorian year 1
// (0001-01-01 has ordinal 1), which was a Monday. Weekday follows directly
// from that day count without any host Date/timezone lookup.
export function calculateWeekday(date: CalendarDate): WeekdayResult | null {
  const ordinal = calendarDateToOrdinal(date);
  if (ordinal === null) return null;

  const mondayZeroIndex = (ordinal - 1) % 7;
  return {
    weekdayIndex: mondayZeroIndex + 1,
    name: weekdayNames[mondayZeroIndex],
  };
}
