import {
  calculateCountdown,
  parseCalendarDate,
  type CalendarDate,
} from "../../calculations/date";
import { describe, expect, it } from "vitest";

function date(value: string): CalendarDate {
  const parsed = parseCalendarDate(value);
  if (!parsed) throw new Error(`Invalid test fixture: ${value}`);
  return parsed;
}

describe("countdown to a target date", () => {
  it.each([
    ["2026-07-16", "2027-01-01", 169, "forward"],
    ["2026-07-16", "2026-07-17", 1, "forward"],
    ["2026-07-16", "2026-07-01", -15, "backward"],
  ])(
    "golden: asOf %s → target %s is %i days",
    (asOf, target, totalDays, direction) => {
      expect(
        calculateCountdown({ asOf: date(asOf), target: date(target) }),
      ).toMatchObject({ totalDays, direction });
    },
  );

  it.each([
    ["2024-03-01", "2024-03-02", 1, "forward"],
    ["2024-02-28", "2024-03-01", 2, "forward"],
    ["2024-01-01", "2024-01-01", 0, "same"],
    ["2020-02-29", "2021-02-28", 365, "forward"],
    ["2100-01-01", "1900-01-01", -73_049, "backward"],
    ["2026-07-01", "2026-07-16", 15, "forward"],
    ["2026-01-01", "2025-12-31", -1, "backward"],
    ["1900-01-01", "1900-01-08", 7, "forward"],
    ["2026-07-16", "2026-07-16", 0, "same"],
    ["2000-02-29", "2000-03-01", 1, "forward"],
  ])(
    "domain: asOf %s → target %s gives signed day count",
    (asOf, target, totalDays, direction) => {
      const result = calculateCountdown({
        asOf: date(asOf),
        target: date(target),
      });
      expect(result).toMatchObject({
        totalDays,
        direction,
        absoluteDays: Math.abs(totalDays),
      });
      expect(result!.fullWeeks * 7 + result!.remainderDays).toBe(
        result!.absoluteDays,
      );
    },
  );

  it.each([
    [{ year: 2024, month: 2, day: 30 }, date("2024-03-01")],
    [date("1900-01-01"), { year: 1899, month: 12, day: 31 }],
    [date("1900-01-01"), { year: 2101, month: 1, day: 1 }],
    [date("1900-01-01"), date("2100-01-02")],
    [{ year: 2024.5, month: 1, day: 1 }, date("2024-01-02")],
  ])("invalid/boundary: rejects unsupported input %#", (asOf, target) => {
    expect(
      calculateCountdown({
        asOf: asOf as CalendarDate,
        target: target as CalendarDate,
      }),
    ).toBeNull();
  });

  it("returns null for a null or missing input object", () => {
    expect(calculateCountdown(null as never)).toBeNull();
    expect(
      calculateCountdown({ asOf: date("2024-01-01") } as never),
    ).toBeNull();
  });

  it("preserves sign symmetry: swapping asOf and target negates totalDays", () => {
    const a = date("2024-01-01");
    const b = date("2024-12-31");
    const forward = calculateCountdown({ asOf: a, target: b });
    const backward = calculateCountdown({ asOf: b, target: a });
    expect(forward?.totalDays).toBe(-(backward?.totalDays as number));
    expect(forward?.absoluteDays).toBe(backward?.absoluteDays);
  });

  it.each(["UTC", "Europe/Moscow", "America/New_York"])(
    "is independent of host timezone %s",
    (timezone) => {
      const previous = process.env.TZ;
      process.env.TZ = timezone;
      try {
        expect(
          calculateCountdown({
            asOf: date("2026-07-16"),
            target: date("2027-01-01"),
          })?.totalDays,
        ).toBe(169);
      } finally {
        process.env.TZ = previous;
      }
    },
  );
});
