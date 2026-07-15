import {
  addMonthsClamped,
  addYearsClamped,
  calendarDateToOrdinal,
  compareCalendarDates,
  daysInMonth,
  isCalendarDate,
  isWithinCalendarInterval,
  type CalendarDate,
} from "./calendar";

export const leapDayBirthdayPolicy = "february-28-in-non-leap-year" as const;

export type AgeInput = Readonly<{
  birthDate: CalendarDate;
  asOf: CalendarDate;
}>;

export type AgeResult = Readonly<{
  years: number;
  months: number;
  days: number;
  nextBirthday: CalendarDate | null;
  daysUntilNextBirthday: number | null;
  leapDayBirthdayPolicy: typeof leapDayBirthdayPolicy;
}>;

function birthdayInYear(
  birthDate: CalendarDate,
  year: number,
): CalendarDate | null {
  const maximumDay = daysInMonth(year, birthDate.month);
  if (maximumDay === null) return null;
  const candidate = {
    year,
    month: birthDate.month,
    day: Math.min(birthDate.day, maximumDay),
  };
  return isCalendarDate(candidate) ? candidate : null;
}

export function calculateAge(input: AgeInput): AgeResult | null {
  if (
    !input ||
    typeof input !== "object" ||
    !isCalendarDate(input.birthDate) ||
    !isCalendarDate(input.asOf) ||
    compareCalendarDates(input.birthDate, input.asOf) === 1 ||
    !isWithinCalendarInterval(input.birthDate, input.asOf)
  ) {
    return null;
  }

  let years = input.asOf.year - input.birthDate.year;
  let cursor = addYearsClamped(input.birthDate, years);
  if (!cursor) return null;
  if (compareCalendarDates(cursor, input.asOf) === 1) {
    years -= 1;
    cursor = addYearsClamped(input.birthDate, years);
    if (!cursor) return null;
  }

  let months = 0;
  for (let candidateMonths = 1; candidateMonths <= 11; candidateMonths += 1) {
    const candidate = addMonthsClamped(cursor, candidateMonths);
    if (!candidate || compareCalendarDates(candidate, input.asOf) === 1) break;
    months = candidateMonths;
  }

  const monthCursor = addMonthsClamped(cursor, months) as CalendarDate;
  const days =
    (calendarDateToOrdinal(input.asOf) as number) -
    (calendarDateToOrdinal(monthCursor) as number);

  let nextBirthday = birthdayInYear(input.birthDate, input.asOf.year);
  if (nextBirthday && compareCalendarDates(nextBirthday, input.asOf) === -1) {
    nextBirthday = birthdayInYear(input.birthDate, input.asOf.year + 1);
  }

  return {
    years,
    months,
    days,
    nextBirthday,
    daysUntilNextBirthday: nextBirthday
      ? (calendarDateToOrdinal(nextBirthday) as number) -
        (calendarDateToOrdinal(input.asOf) as number)
      : null,
    leapDayBirthdayPolicy,
  };
}
