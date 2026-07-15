import { describe, expect, it } from "vitest";
import {
  developmentOrigin,
  normalizeOrigin,
  productionOrigin,
  resolveSiteOrigin,
} from "../lib/site";

describe("site origin", () => {
  it("uses the canonical origin in production", () => {
    expect(resolveSiteOrigin("production", undefined)).toBe(productionOrigin);
    expect(resolveSiteOrigin("production", productionOrigin)).toBe(
      productionOrigin,
    );
  });

  it("rejects a non-canonical production origin", () => {
    expect(() =>
      resolveSiteOrigin("production", "http://localhost:3212"),
    ).toThrow(productionOrigin);
  });

  it("allows a normalized local development origin", () => {
    expect(resolveSiteOrigin("development", undefined)).toBe(developmentOrigin);
    expect(normalizeOrigin("http://localhost:3212/")).toBe(developmentOrigin);
  });

  it("rejects path, query and fragment components", () => {
    for (const value of [
      "https://calculandia.ru/path",
      "https://calculandia.ru?preview=1",
      "https://calculandia.ru#preview",
    ]) {
      expect(() => normalizeOrigin(value)).toThrow();
    }
  });
});
