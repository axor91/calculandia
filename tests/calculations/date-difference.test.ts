import {
  calculateDateDifference,
  parseCalendarDate,
  type CalendarDate,
} from "../../calculations/date";
import { describe, expect, it } from "vitest";

function date(value: string): CalendarDate {
  const parsed = parseCalendarDate(value);
  if (!parsed) throw new Error(`Invalid test fixture: ${value}`);
  return parsed;
}

describe("calendar difference between two dates", () => {
  it.each([
    ["2020-01-15", "2023-03-10", 3, 1, 23, 1150],
    ["2024-01-31", "2024-03-01", 0, 1, 1, 30],
    ["2000-02-29", "2001-02-28", 1, 0, 0, 365],
  ])(
    "golden: %s → %s is %iy %im %id",
    (first, second, years, months, days, absoluteDays) => {
      const result = calculateDateDifference({
        first: date(first),
        second: date(second),
      });
      expect(result).toMatchObject({ years, months, days, absoluteDays });
    },
  );

  it.each([
    ["2024-07-15", "2024-07-15", 0, 0, 0, false, "same"],
    ["2000-06-15", "2024-06-14", 23, 11, 30, false, "forward"],
    ["2000-06-15", "2024-06-15", 24, 0, 0, false, "forward"],
    ["2024-02-29", "2024-03-29", 0, 1, 0, false, "forward"],
    ["2020-12-31", "2021-02-28", 0, 2, 0, false, "forward"],
    ["1900-01-01", "2000-01-01", 100, 0, 0, false, "forward"],
    ["2100-01-01", "1900-01-01", 200, 0, 0, true, "backward"],
    ["2024-03-01", "2024-01-31", 0, 1, 1, true, "backward"],
    ["2025-12-31", "2026-01-01", 0, 0, 1, false, "forward"],
    ["1900-01-01", "2100-01-01", 200, 0, 0, false, "forward"],
  ])(
    "domain: %s vs %s gives %iy %im %id (reversed=%s)",
    (first, second, years, months, days, reversed, direction) => {
      const result = calculateDateDifference({
        first: date(first),
        second: date(second),
      });
      expect(result).toMatchObject({
        years,
        months,
        days,
        reversed,
        direction,
      });
      expect(result?.years).toBeGreaterThanOrEqual(0);
      expect(result?.months).toBeGreaterThanOrEqual(0);
      expect(result?.months).toBeLessThan(12);
      expect(result?.days).toBeGreaterThanOrEqual(0);
    },
  );

  it.each([
    [{ year: 2024, month: 2, day: 30 }, date("2024-01-01")],
    [date("2024-01-01"), { year: 1899, month: 12, day: 31 }],
    [date("2024-01-01"), { year: 2101, month: 1, day: 1 }],
    [date("1900-01-01"), date("2100-01-02")],
    [{ year: Number.NaN, month: 1, day: 1 }, date("2024-01-01")],
  ])("invalid/boundary: rejects unsupported input %#", (first, second) => {
    expect(
      calculateDateDifference({
        first: first as CalendarDate,
        second: second as CalendarDate,
      }),
    ).toBeNull();
  });

  it("returns null for a missing input object", () => {
    expect(calculateDateDifference(null as never)).toBeNull();
  });

  it("swapping first and second keeps the same components but flips reversed/direction", () => {
    const fixtures: readonly [string, string][] = [
      ["2020-01-15", "2023-03-10"],
      ["2024-01-31", "2024-03-01"],
      ["2000-02-29", "2001-02-28"],
    ];
    for (const [a, b] of fixtures) {
      const forward = calculateDateDifference({
        first: date(a),
        second: date(b),
      });
      const backward = calculateDateDifference({
        first: date(b),
        second: date(a),
      });
      expect(backward).toMatchObject({
        years: forward?.years,
        months: forward?.months,
        days: forward?.days,
        absoluteDays: forward?.absoluteDays,
      });
      expect(forward?.reversed).toBe(false);
      expect(backward?.reversed).toBe(true);
      expect(forward?.totalDays).toBe(-(backward?.totalDays as number));
    }
  });

  it.each(["UTC", "Asia/Tokyo", "America/New_York"])(
    "does not change in timezone %s",
    (timezone) => {
      const previous = process.env.TZ;
      process.env.TZ = timezone;
      try {
        expect(
          calculateDateDifference({
            first: date("2020-01-15"),
            second: date("2023-03-10"),
          }),
        ).toMatchObject({ years: 3, months: 1, days: 23 });
      } finally {
        process.env.TZ = previous;
      }
    },
  );
});
