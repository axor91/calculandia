import {
  addDaysExact,
  calculateWeekday,
  parseCalendarDate,
  type CalendarDate,
} from "../../calculations/date";
import { describe, expect, it } from "vitest";

function date(value: string): CalendarDate {
  const parsed = parseCalendarDate(value);
  if (!parsed) throw new Error(`Invalid test fixture: ${value}`);
  return parsed;
}

describe("weekday for a calendar date", () => {
  it.each([
    ["1961-04-12", "среда", 3],
    ["2000-02-29", "вторник", 2],
    ["2026-07-16", "четверг", 4],
  ])("golden: %s is %s", (fixture, name, weekdayIndex) => {
    expect(calculateWeekday(date(fixture))).toMatchObject({
      name,
      weekdayIndex,
    });
  });

  it.each([
    ["1900-01-01", "понедельник", 1],
    ["2100-12-31", "пятница", 5],
    ["1900-06-15", "пятница", 5],
    ["1999-12-31", "пятница", 5],
    ["2005-11-23", "среда", 3],
    ["2016-02-29", "понедельник", 1],
    ["2020-01-01", "среда", 3],
    ["2050-07-04", "понедельник", 1],
    ["2075-03-15", "пятница", 5],
    ["2099-08-30", "воскресенье", 7],
    ["1901-01-01", "вторник", 2],
    ["2099-12-31", "четверг", 4],
  ])("domain: %s falls on %s (day %i)", (fixture, name, weekdayIndex) => {
    const result = calculateWeekday(date(fixture));
    expect(result).toMatchObject({ name, weekdayIndex });
    expect(result?.weekdayIndex).toBeGreaterThanOrEqual(1);
    expect(result?.weekdayIndex).toBeLessThanOrEqual(7);
  });

  it.each([
    [{ year: 2026, month: 2, day: 30 }],
    [{ year: 1899, month: 12, day: 31 }],
    [{ year: 2101, month: 1, day: 1 }],
    [{ year: 2024.5, month: 1, day: 1 }],
    [{ year: 2024, month: 13, day: 1 }],
    [{ year: 2024, month: 2, day: 29.5 }],
  ])("invalid/boundary: rejects unsupported input %#", (invalid) => {
    expect(calculateWeekday(invalid as CalendarDate)).toBeNull();
  });

  it("rejects malformed ISO fixtures via parseCalendarDate", () => {
    expect(parseCalendarDate("2026-02-30")).toBeNull();
    expect(parseCalendarDate("")).toBeNull();
  });

  it("adding seven calendar days keeps the same weekday", () => {
    const fixtures = [
      "2026-07-16",
      "2000-02-29",
      "1900-01-01",
      "2099-12-24",
      "2024-12-25",
    ];
    for (const fixture of fixtures) {
      const start = date(fixture);
      const shifted = addDaysExact(start, 7);
      expect(shifted).not.toBeNull();
      expect(calculateWeekday(shifted as CalendarDate)?.name).toBe(
        calculateWeekday(start)?.name,
      );
    }
  });

  it.each(["UTC", "Europe/Moscow", "Pacific/Auckland"])(
    "is independent of host timezone %s",
    (timezone) => {
      const previous = process.env.TZ;
      process.env.TZ = timezone;
      try {
        expect(calculateWeekday(date("2026-07-16"))).toMatchObject({
          name: "четверг",
          weekdayIndex: 4,
        });
      } finally {
        process.env.TZ = previous;
      }
    },
  );
});
