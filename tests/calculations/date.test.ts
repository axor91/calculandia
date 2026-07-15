import {
  calculateAge,
  calculateDateShift,
  calculateDaysBetween,
  formatCalendarDate,
  isCalendarDate,
  isLeapYear,
  parseCalendarDate,
  type CalendarDate,
} from "../../calculations/date";
import { describe, expect, it } from "vitest";

function date(value: string): CalendarDate {
  const parsed = parseCalendarDate(value);
  if (!parsed) throw new Error(`Invalid test fixture: ${value}`);
  return parsed;
}

describe("local Gregorian calendar tuples", () => {
  it.each([
    [1900, false],
    [1996, true],
    [2000, true],
    [2004, true],
    [2100, false],
  ])("applies Gregorian leap-year rules to %i", (year, expected) => {
    expect(isLeapYear(year)).toBe(expected);
  });

  it.each([
    "1900-01-01",
    "1999-12-31",
    "2000-02-29",
    "2024-02-29",
    "2100-12-31",
  ])("strictly round-trips %s", (fixture) => {
    expect(formatCalendarDate(date(fixture))).toBe(fixture);
  });

  it.each([
    "",
    "2024-2-01",
    "2024-02-1",
    "2024-02-30",
    "1900-02-29",
    "2101-01-01",
    "1899-12-31",
    "2024-01-01T00:00:00Z",
  ])("rejects malformed or unsupported ISO calendar input %j", (fixture) => {
    expect(parseCalendarDate(fixture)).toBeNull();
  });
});

describe("days between dates", () => {
  it.each([
    ["2024-03-01", "2024-03-02", false, 1, 0, 1],
    ["2024-02-28", "2024-03-01", false, 2, 0, 2],
    ["2024-03-01", "2024-03-17", false, 16, 2, 2],
    ["2024-03-17", "2024-03-01", false, -16, 2, 2],
  ])(
    "golden: %s → %s (includeEnd=%s)",
    (start, end, includeEnd, totalDays, fullWeeks, remainderDays) => {
      expect(
        calculateDaysBetween({
          start: date(start),
          end: date(end),
          includeEnd,
        }),
      ).toMatchObject({ totalDays, fullWeeks, remainderDays });
    },
  );

  it.each([
    ["2024-01-01", "2024-01-01", false, 0, "same"],
    ["2024-01-01", "2024-01-01", true, 1, "same"],
    ["2023-12-31", "2024-01-01", false, 1, "forward"],
    ["2024-01-01", "2023-12-31", false, -1, "backward"],
    ["2024-03-01", "2024-03-17", true, 17, "forward"],
    ["2024-03-17", "2024-03-01", true, -17, "backward"],
    ["1900-02-28", "1900-03-01", false, 1, "forward"],
    ["2000-02-28", "2000-03-01", false, 2, "forward"],
    ["2099-12-31", "2100-01-01", false, 1, "forward"],
    ["1900-01-01", "2100-01-01", false, 73_049, "forward"],
    ["2020-02-29", "2021-02-28", false, 365, "forward"],
    ["2021-02-28", "2024-02-29", false, 1096, "forward"],
  ])(
    "domain: %s → %s gives signed calendar boundaries",
    (start, end, includeEnd, totalDays, direction) => {
      const result = calculateDaysBetween({
        start: date(start),
        end: date(end),
        includeEnd,
      });
      expect(result).toMatchObject({
        totalDays,
        direction,
        includesEnd: includeEnd,
      });
      expect(result?.absoluteDays).toBe(Math.abs(totalDays));
    },
  );

  it.each([
    [{ year: 2024, month: 2, day: 30 }, date("2024-03-01"), false],
    [{ year: 1899, month: 12, day: 31 }, date("1900-01-01"), false],
    [date("1900-01-01"), { year: 2101, month: 1, day: 1 }, false],
    [date("1900-01-01"), date("2100-01-02"), false],
    [date("1900-12-31"), date("2100-12-31"), "yes"],
    [{ year: 2024.5, month: 1, day: 1 }, date("2024-01-02"), false],
  ])(
    "invalid/boundary: rejects unsupported input %#",
    (start, end, includeEnd) => {
      expect(
        calculateDaysBetween({
          start: start as CalendarDate,
          end: end as CalendarDate,
          includeEnd: includeEnd as boolean,
        }),
      ).toBeNull();
    },
  );

  it.each(["UTC", "Europe/Moscow", "America/New_York", "Pacific/Auckland"])(
    "is independent of host timezone %s and DST transitions",
    (timezone) => {
      const previous = process.env.TZ;
      process.env.TZ = timezone;
      try {
        expect(
          calculateDaysBetween({
            start: date("2024-03-09"),
            end: date("2024-03-12"),
            includeEnd: false,
          })?.totalDays,
        ).toBe(3);
      } finally {
        process.env.TZ = previous;
      }
    },
  );

  it("preserves sign symmetry and the week breakdown invariant", () => {
    for (let day = 1; day <= 28; day += 1) {
      const start = date(`2024-01-${String(day).padStart(2, "0")}`);
      const end = date("2024-12-31");
      const forward = calculateDaysBetween({ start, end, includeEnd: false });
      const backward = calculateDaysBetween({
        start: end,
        end: start,
        includeEnd: false,
      });
      expect(forward?.totalDays).toBe(-(backward?.totalDays as number));
      expect(
        (forward?.fullWeeks as number) * 7 + (forward?.remainderDays as number),
      ).toBe(forward?.absoluteDays);
    }
  });
});

describe("add or subtract a calendar period", () => {
  it.each([
    ["2024-01-31", 0, 1, 0, "2024-02-29"],
    ["2024-02-29", 1, 0, 0, "2025-02-28"],
    ["2024-03-01", 0, 0, -1, "2024-02-29"],
  ])(
    "golden: %s + (%iy, %im, %id) = %s",
    (base, years, months, days, expected) => {
      const result = calculateDateShift({
        date: date(base),
        years,
        months,
        days,
      });
      expect(formatCalendarDate(result?.date as CalendarDate)).toBe(expected);
    },
  );

  it.each([
    ["2023-01-31", 0, 1, 0, "2023-02-28"],
    ["2024-03-31", 0, -1, 0, "2024-02-29"],
    ["2024-01-31", 0, 1, 1, "2024-03-01"],
    ["2020-02-29", 1, 1, 0, "2021-03-28"],
    ["2024-06-15", 0, 12, 0, "2025-06-15"],
    ["2000-02-29", -1, 0, 0, "1999-02-28"],
    ["1999-12-31", 0, 0, 1, "2000-01-01"],
    ["2100-02-28", 0, 0, 1, "2100-03-01"],
    ["2024-08-31", 0, 6, 0, "2025-02-28"],
    ["2024-05-15", 0, 0, -45, "2024-03-31"],
    ["2024-05-15", 0, 0, 0, "2024-05-15"],
  ])(
    "domain: applies years, months, then days for %s",
    (base, years, months, days, expected) => {
      const result = calculateDateShift({
        date: date(base),
        years,
        months,
        days,
      });
      expect(formatCalendarDate(result?.date as CalendarDate)).toBe(expected);
      expect(result?.appliedInOrder).toEqual(["years", "months", "days"]);
    },
  );

  it.each([
    [{ year: 2023, month: 2, day: 29 }, 0, 0, 1],
    [date("2024-01-01"), 0.5, 0, 0],
    [date("2024-01-01"), 0, Number.NaN, 0],
    [date("2024-01-01"), 201, 0, 0],
    [date("2024-01-01"), 0, 2401, 0],
    [date("2024-01-01"), 0, 0, 73_050],
    [date("2100-12-31"), 0, 0, 1],
    [date("1900-01-01"), 0, 0, -1],
  ])(
    "invalid/boundary: rejects unsupported shift %#",
    (base, years, months, days) => {
      expect(
        calculateDateShift({
          date: base as CalendarDate,
          years,
          months,
          days,
        }),
      ).toBeNull();
    },
  );

  it("is timezone-independent and day shifts round-trip away from boundaries", () => {
    for (const timezone of ["UTC", "Europe/Moscow", "America/Los_Angeles"]) {
      const previous = process.env.TZ;
      process.env.TZ = timezone;
      try {
        const shifted = calculateDateShift({
          date: date("2024-03-10"),
          years: 0,
          months: 0,
          days: 50,
        });
        const restored = calculateDateShift({
          date: shifted?.date as CalendarDate,
          years: 0,
          months: 0,
          days: -50,
        });
        expect(formatCalendarDate(restored?.date as CalendarDate)).toBe(
          "2024-03-10",
        );
      } finally {
        process.env.TZ = previous;
      }
    }
  });
});

describe("calendar age", () => {
  it.each([
    ["1990-05-20", "2026-07-15", 36, 1, 25],
    ["2000-02-29", "2025-02-28", 25, 0, 0],
    ["2024-01-31", "2024-03-30", 0, 1, 30],
  ])(
    "golden: %s as of %s is %iy %im %id",
    (birthDate, asOf, years, months, days) => {
      expect(
        calculateAge({ birthDate: date(birthDate), asOf: date(asOf) }),
      ).toMatchObject({ years, months, days });
    },
  );

  it.each([
    ["2024-07-15", "2024-07-15", 0, 0, 0],
    ["2000-06-15", "2024-06-14", 23, 11, 30],
    ["2000-06-15", "2024-06-15", 24, 0, 0],
    ["2024-02-29", "2024-03-29", 0, 1, 0],
    ["2020-12-31", "2021-02-28", 0, 2, 0],
    ["1900-01-01", "2000-01-01", 100, 0, 0],
    ["2000-02-29", "2024-02-29", 24, 0, 0],
    ["2000-02-29", "2023-02-27", 22, 11, 30],
    ["2010-10-10", "2026-01-01", 15, 2, 22],
    ["2025-12-31", "2026-01-01", 0, 0, 1],
    ["1900-01-01", "2100-01-01", 200, 0, 0],
  ])(
    "domain: computes full calendar components for %s → %s",
    (birthDate, asOf, years, months, days) => {
      const result = calculateAge({
        birthDate: date(birthDate),
        asOf: date(asOf),
      });
      expect(result).toMatchObject({ years, months, days });
      expect(result?.years).toBeGreaterThanOrEqual(0);
      expect(result?.months).toBeGreaterThanOrEqual(0);
      expect(result?.months).toBeLessThan(12);
      expect(result?.days).toBeGreaterThanOrEqual(0);
    },
  );

  it.each([
    [{ year: 2001, month: 2, day: 29 }, date("2024-01-01")],
    [date("2024-01-02"), date("2024-01-01")],
    [{ year: 1899, month: 12, day: 31 }, date("2024-01-01")],
    [date("2024-01-01"), { year: 2101, month: 1, day: 1 }],
    [date("1900-01-01"), date("2100-01-02")],
    [{ year: Number.NaN, month: 1, day: 1 }, date("2024-01-01")],
  ])("invalid/boundary: rejects impossible age input %#", (birthDate, asOf) => {
    expect(
      calculateAge({
        birthDate: birthDate as CalendarDate,
        asOf: asOf as CalendarDate,
      }),
    ).toBeNull();
  });

  it("uses the documented February 28 policy for leap-day birthdays", () => {
    const result = calculateAge({
      birthDate: date("2000-02-29"),
      asOf: date("2026-02-27"),
    });
    expect(result).toMatchObject({
      nextBirthday: date("2026-02-28"),
      daysUntilNextBirthday: 1,
      leapDayBirthdayPolicy: "february-28-in-non-leap-year",
    });
  });

  it("recomposes every tested age tuple using the same clamp order", () => {
    const fixtures = [
      ["1990-05-20", "2026-07-15"],
      ["2000-02-29", "2025-02-28"],
      ["2024-01-31", "2024-03-30"],
      ["2000-06-15", "2024-06-14"],
    ] as const;

    for (const [birth, asOf] of fixtures) {
      const age = calculateAge({ birthDate: date(birth), asOf: date(asOf) });
      const recomposed = calculateDateShift({
        date: date(birth),
        years: age?.years as number,
        months: age?.months as number,
        days: age?.days as number,
      });
      expect(formatCalendarDate(recomposed?.date as CalendarDate)).toBe(asOf);
    }
  });

  it.each(["UTC", "Asia/Tokyo", "America/New_York"])(
    "does not change in timezone %s",
    (timezone) => {
      const previous = process.env.TZ;
      process.env.TZ = timezone;
      try {
        expect(
          calculateAge({
            birthDate: date("1990-05-20"),
            asOf: date("2026-07-15"),
          }),
        ).toMatchObject({ years: 36, months: 1, days: 25 });
      } finally {
        process.env.TZ = previous;
      }
    },
  );
});

describe("calendar date validation invariant", () => {
  it("accepts only supported integer tuples", () => {
    expect(isCalendarDate({ year: 2024, month: 2, day: 29 })).toBe(true);
    expect(isCalendarDate({ year: 2024, month: 2, day: 29.1 })).toBe(false);
  });
});
