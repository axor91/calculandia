import { describe, expect, it } from "vitest";
import { getHealthStatus } from "../lib/health";

describe("health status", () => {
  const sha = "a".repeat(40);

  it("fails closed without an immutable build id", () => {
    expect(getHealthStatus(null)).toEqual({
      status: "unhealthy",
      version: null,
      httpStatus: 503,
    });
    expect(getHealthStatus("development").httpStatus).toBe(503);
    expect(getHealthStatus("forged-release").httpStatus).toBe(503);
  });

  it("returns an exact clean git build id", () => {
    expect(getHealthStatus(sha)).toEqual({
      status: "ok",
      version: sha,
      httpStatus: 200,
    });
  });

  it("allows an explicit dirty suffix for local review artifacts", () => {
    expect(getHealthStatus(`${sha}-dirty`)).toEqual({
      status: "ok",
      version: `${sha}-dirty`,
      httpStatus: 200,
    });
  });
});
