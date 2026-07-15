import { describe, expect, it } from "vitest";
import { FixedWindowRateLimiter } from "../lib/fixed-window-rate-limit";

describe("fixed window rate limiter", () => {
  it("isolates one exhausted client from another client", () => {
    const limiter = new FixedWindowRateLimiter({
      windowMs: 60_000,
      perKeyLimit: 3,
      globalLimit: 10,
    });

    expect(limiter.consume("attacker", 1_000)).toBe(true);
    expect(limiter.consume("attacker", 1_000)).toBe(true);
    expect(limiter.consume("attacker", 1_000)).toBe(true);
    expect(limiter.consume("attacker", 1_000)).toBe(false);
    expect(limiter.consume("legitimate", 1_000)).toBe(true);
  });

  it("enforces the independent global ceiling", () => {
    const limiter = new FixedWindowRateLimiter({
      windowMs: 60_000,
      perKeyLimit: 2,
      globalLimit: 3,
    });

    expect(limiter.consume("a", 1_000)).toBe(true);
    expect(limiter.consume("b", 1_000)).toBe(true);
    expect(limiter.consume("c", 1_000)).toBe(true);
    expect(limiter.consume("d", 1_000)).toBe(false);
  });

  it("resets both counters after the window", () => {
    const limiter = new FixedWindowRateLimiter({
      windowMs: 100,
      perKeyLimit: 1,
      globalLimit: 2,
    });

    expect(limiter.consume("a", 1_000)).toBe(true);
    expect(limiter.consume("a", 1_050)).toBe(false);
    expect(limiter.consume("a", 1_100)).toBe(true);
  });
});
