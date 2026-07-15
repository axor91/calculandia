import { describe, expect, it } from "vitest";
import { parseClientErrorEvent } from "../lib/client-error-schema";

describe("client error event schema", () => {
  it("accepts only the bounded public event fields", () => {
    expect(
      parseClientErrorEvent({
        source: "route_boundary",
        context: "/calculator/mortgage",
        digest: "abc_123",
      }),
    ).toEqual({
      source: "route_boundary",
      context: "/calculator/mortgage",
      digest: "abc_123",
    });
  });

  it("rejects messages, stacks and calculator values", () => {
    for (const event of [
      { source: "route_boundary", context: "/", message: "secret" },
      { source: "route_boundary", context: "/", stack: "secret" },
      { source: "route_boundary", context: "/", principal: 10_000_000 },
    ]) {
      expect(parseClientErrorEvent(event)).toBeNull();
    }
  });

  it("rejects unbounded or malformed fields", () => {
    expect(
      parseClientErrorEvent({ source: "unknown", context: "/" }),
    ).toBeNull();
    expect(
      parseClientErrorEvent({
        source: "route_boundary",
        context: "x".repeat(97),
      }),
    ).toBeNull();
    expect(
      parseClientErrorEvent({
        source: "route_boundary",
        context: "/",
        digest: "bad digest",
      }),
    ).toBeNull();
  });
});
