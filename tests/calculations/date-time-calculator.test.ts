import {
  calculateTimeArithmetic,
  calculateTimeIntervalSum,
  type TimeDuration,
} from "../../calculations/date";
import { describe, expect, it } from "vitest";

function d(hours: number, minutes: number): TimeDuration {
  return { hours, minutes };
}

describe("time arithmetic on hours and minutes", () => {
  it.each([
    [d(2, 45), d(1, 30), "add" as const, 255, 1, 0, 4, 15],
    [d(5, 0), d(6, 30), "subtract" as const, -90, -1, 0, 1, 30],
  ])(
    "golden: %j %s %j → %i minutes",
    (first, second, operation, totalMinutes, sign, days, hours, minutes) => {
      expect(calculateTimeArithmetic({ first, second, operation })).toEqual({
        totalMinutes,
        sign,
        days,
        hours,
        minutes,
      });
    },
  );

  it("golden: eight 0:45 intervals sum to 6:00", () => {
    const intervals = Array.from({ length: 8 }, () => d(0, 45));
    expect(calculateTimeIntervalSum({ intervals })).toEqual({
      totalMinutes: 360,
      sign: 1,
      days: 0,
      hours: 6,
      minutes: 0,
    });
  });

  it.each([
    [d(0, 0), d(0, 0), "add" as const, 0, 0, 0, 0, 0],
    [d(1, 0), d(0, 30), "add" as const, 90, 1, 0, 1, 30],
    [d(23, 30), d(1, 0), "add" as const, 1470, 1, 1, 0, 30],
    [d(0, 30), d(1, 0), "subtract" as const, -30, -1, 0, 0, 30],
    [d(48, 0), d(0, 0), "add" as const, 2880, 1, 2, 0, 0],
    [d(0, 0), d(0, 1), "subtract" as const, -1, -1, 0, 0, 1],
    [
      d(9999, 59),
      d(0, 1),
      "add" as const,
      9999 * 60 + 60,
      1,
      Math.floor((9999 * 60 + 60) / 1440),
      Math.floor(((9999 * 60 + 60) % 1440) / 60),
      ((9999 * 60 + 60) % 1440) % 60,
    ],
    [d(10, 15), d(10, 15), "subtract" as const, 0, 0, 0, 0, 0],
    [d(1, 59), d(0, 1), "add" as const, 120, 1, 0, 2, 0],
    [d(100, 0), d(4, 0), "subtract" as const, 5760, 1, 4, 0, 0],
  ])(
    "domain: %j %s %j",
    (first, second, operation, totalMinutes, sign, days, hours, minutes) => {
      expect(calculateTimeArithmetic({ first, second, operation })).toEqual({
        totalMinutes,
        sign,
        days,
        hours,
        minutes,
      });
    },
  );

  it.each([
    [d(-1, 0), d(0, 0), "add" as const],
    [d(0, 60), d(0, 0), "add" as const],
    [d(0, -1), d(0, 0), "add" as const],
    [d(10000, 0), d(0, 0), "add" as const],
    [d(0, 0.5), d(0, 0), "add" as const],
    [d(0, 0), d(0, 0), "multiply" as never],
    [d(1, 0), d(1, 0), "" as never],
  ])(
    "invalid/boundary: rejects unsupported time input %#",
    (first, second, operation) => {
      expect(calculateTimeArithmetic({ first, second, operation })).toBeNull();
    },
  );

  it.each([
    { intervals: [] },
    { intervals: [d(0, 45)] },
    { intervals: Array.from({ length: 21 }, () => d(0, 30)) },
    { intervals: [d(0, 45), d(-1, 0)] },
    { intervals: [d(0, 45), d(0, 60)] },
  ])("invalid/boundary: rejects unsupported interval list %#", (input) => {
    expect(calculateTimeIntervalSum(input)).toBeNull();
  });

  it("returns null for a missing input object", () => {
    expect(calculateTimeArithmetic(null as never)).toBeNull();
    expect(calculateTimeIntervalSum(null as never)).toBeNull();
  });

  it("addition is commutative", () => {
    const first = d(3, 40);
    const second = d(11, 25);
    const ab = calculateTimeArithmetic({ first, second, operation: "add" });
    const ba = calculateTimeArithmetic({
      first: second,
      second: first,
      operation: "add",
    });
    expect(ab).toEqual(ba);
  });

  it("a + b - b recomposes a", () => {
    const cases: readonly [TimeDuration, TimeDuration][] = [
      [d(2, 45), d(1, 30)],
      [d(0, 0), d(5, 15)],
      [d(500, 30), d(200, 45)],
    ];
    for (const [first, second] of cases) {
      const sum = calculateTimeArithmetic({ first, second, operation: "add" });
      expect(sum).not.toBeNull();
      const back = calculateTimeArithmetic({
        first: { hours: sum!.hours + sum!.days * 24, minutes: sum!.minutes },
        second,
        operation: "subtract",
      });
      expect(back?.totalMinutes).toBe(first.hours * 60 + first.minutes);
    }
  });
});
