export const MIN_CALENDAR_YEAR = 1900;
export const MAX_CALENDAR_YEAR = 2100;
export const MAX_CALENDAR_INTERVAL_YEARS = 200;

export type CalendarDate = Readonly<{
  year: number;
  month: number;
  day: number;
}>;

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year: number, month: number): number | null {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if (month === 4 || month === 6 || month === 9 || month === 11) return 30;
  return 31;
}

export function isCalendarDate(value: unknown): value is CalendarDate {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const candidate = value as Record<string, unknown>;
  if (
    !Number.isInteger(candidate.year) ||
    !Number.isInteger(candidate.month) ||
    !Number.isInteger(candidate.day)
  ) {
    return false;
  }

  const year = candidate.year as number;
  const month = candidate.month as number;
  const day = candidate.day as number;
  const maximumDay = daysInMonth(year, month);

  return (
    year >= MIN_CALENDAR_YEAR &&
    year <= MAX_CALENDAR_YEAR &&
    maximumDay !== null &&
    day >= 1 &&
    day <= maximumDay
  );
}

export function parseCalendarDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const date = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };

  return isCalendarDate(date) ? date : null;
}

export function formatCalendarDate(date: CalendarDate): string | null {
  if (!isCalendarDate(date)) return null;
  return `${String(date.year).padStart(4, "0")}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

function daysBeforeYear(year: number): number {
  const previousYear = year - 1;
  return (
    365 * previousYear +
    Math.floor(previousYear / 4) -
    Math.floor(previousYear / 100) +
    Math.floor(previousYear / 400)
  );
}

export function calendarDateToOrdinal(date: CalendarDate): number | null {
  if (!isCalendarDate(date)) return null;

  let ordinal = daysBeforeYear(date.year);
  for (let month = 1; month < date.month; month += 1) {
    ordinal += daysInMonth(date.year, month) as number;
  }
  return ordinal + date.day;
}

const minimumOrdinal = calendarDateToOrdinal({
  year: MIN_CALENDAR_YEAR,
  month: 1,
  day: 1,
}) as number;
const maximumOrdinal = calendarDateToOrdinal({
  year: MAX_CALENDAR_YEAR,
  month: 12,
  day: 31,
}) as number;

export function ordinalToCalendarDate(ordinal: number): CalendarDate | null {
  if (
    !Number.isSafeInteger(ordinal) ||
    ordinal < minimumOrdinal ||
    ordinal > maximumOrdinal
  ) {
    return null;
  }

  let low = MIN_CALENDAR_YEAR;
  let high = MAX_CALENDAR_YEAR;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const firstDay = daysBeforeYear(middle) + 1;
    const nextFirstDay = daysBeforeYear(middle + 1) + 1;

    if (ordinal < firstDay) {
      high = middle - 1;
    } else if (ordinal >= nextFirstDay) {
      low = middle + 1;
    } else {
      let dayOfYear = ordinal - firstDay + 1;
      let month = 1;
      while (month <= 12) {
        const monthLength = daysInMonth(middle, month) as number;
        if (dayOfYear <= monthLength) {
          return { year: middle, month, day: dayOfYear };
        }
        dayOfYear -= monthLength;
        month += 1;
      }
    }
  }

  return null;
}

export function compareCalendarDates(
  first: CalendarDate,
  second: CalendarDate,
): -1 | 0 | 1 | null {
  const firstOrdinal = calendarDateToOrdinal(first);
  const secondOrdinal = calendarDateToOrdinal(second);
  if (firstOrdinal === null || secondOrdinal === null) return null;
  return firstOrdinal < secondOrdinal
    ? -1
    : firstOrdinal > secondOrdinal
      ? 1
      : 0;
}

export function addYearsClamped(
  date: CalendarDate,
  years: number,
): CalendarDate | null {
  if (!isCalendarDate(date) || !Number.isSafeInteger(years)) return null;

  const targetYear = date.year + years;
  if (targetYear < MIN_CALENDAR_YEAR || targetYear > MAX_CALENDAR_YEAR) {
    return null;
  }

  return {
    year: targetYear,
    month: date.month,
    day: Math.min(date.day, daysInMonth(targetYear, date.month) as number),
  };
}

export function addMonthsClamped(
  date: CalendarDate,
  months: number,
): CalendarDate | null {
  if (!isCalendarDate(date) || !Number.isSafeInteger(months)) return null;

  const absoluteMonth = date.year * 12 + (date.month - 1) + months;
  const targetYear = Math.floor(absoluteMonth / 12);
  const targetMonth = absoluteMonth - targetYear * 12 + 1;
  if (targetYear < MIN_CALENDAR_YEAR || targetYear > MAX_CALENDAR_YEAR) {
    return null;
  }

  return {
    year: targetYear,
    month: targetMonth,
    day: Math.min(date.day, daysInMonth(targetYear, targetMonth) as number),
  };
}

export function addDaysExact(
  date: CalendarDate,
  days: number,
): CalendarDate | null {
  const ordinal = calendarDateToOrdinal(date);
  if (ordinal === null || !Number.isSafeInteger(days)) return null;
  return ordinalToCalendarDate(ordinal + days);
}

export function isWithinCalendarInterval(
  first: CalendarDate,
  second: CalendarDate,
): boolean {
  const order = compareCalendarDates(first, second);
  if (order === null) return false;

  const earlier = order <= 0 ? first : second;
  const later = order <= 0 ? second : first;
  if (earlier.year + MAX_CALENDAR_INTERVAL_YEARS > MAX_CALENDAR_YEAR) {
    return true;
  }
  const boundary = addYearsClamped(earlier, MAX_CALENDAR_INTERVAL_YEARS);
  return boundary !== null && compareCalendarDates(later, boundary) !== 1;
}
