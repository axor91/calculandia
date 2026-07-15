import { describe, expect, it } from "vitest";
import {
  MAX_SHARE_FRAGMENT_LENGTH,
  decodeShareState,
  encodeShareState,
  localCalendarDate,
  parseLocalizedNumber,
} from "../components/calculator/state";

describe("calculator input and share state", () => {
  it.each([
    ["1 234,56", 1234.56],
    ["1\u00a0234.56", 1234.56],
    ["-0,25", -0.25],
  ])("parses localized number %s", (input, expected) => {
    expect(parseLocalizedNumber(input)).toBe(expected);
  });

  it.each(["", "1e3", "Infinity", "1,2,3", "x"])(
    "rejects ambiguous input %s",
    (input) => expect(parseLocalizedNumber(input)).toBeNull(),
  );

  it("round-trips allowlisted state and booleans", () => {
    const defaults = { mode: "a", amount: "10", enabled: false };
    const encoded = encodeShareState("demo", {
      mode: "b",
      amount: "1 250,5",
      enabled: true,
    });
    expect(encoded).not.toBeNull();
    expect(
      decodeShareState(`#${encoded}`, "demo", defaults, {
        mode: ["a", "b"],
      }),
    ).toEqual({ mode: "b", amount: "1 250,5", enabled: true });
  });

  it("keeps safe defaults for forged enum and boolean values", () => {
    expect(
      decodeShareState(
        "#calc=demo&v=1&mode=forged&enabled=yes&unknown=value",
        "demo",
        { mode: "safe", enabled: false },
        { mode: ["safe", "other"] },
      ),
    ).toEqual({ mode: "safe", enabled: false });
  });

  it("rejects a mismatched slug, version and oversized fragment", () => {
    const defaults = { amount: "10" };
    expect(decodeShareState("#calc=other&v=1", "demo", defaults)).toBeNull();
    expect(decodeShareState("#calc=demo&v=2", "demo", defaults)).toBeNull();
    expect(
      decodeShareState(
        `#${"x".repeat(MAX_SHARE_FRAGMENT_LENGTH + 1)}`,
        "demo",
        defaults,
      ),
    ).toBeNull();
  });

  it("formats a local calendar day without converting it to UTC", () => {
    const localDate = new Date(2026, 6, 16, 0, 5, 0);
    expect(localCalendarDate(localDate)).toBe("2026-07-16");
  });
});
