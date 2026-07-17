import { describe, expect, it } from "vitest";
import {
  calculators,
  categories,
  getCategoryCalculators,
  getPublishedCalculators,
} from "../catalog";
import { validateCatalog } from "../catalog/validate";

describe("launch catalog", () => {
  it("passes the complete structural contract", () => {
    expect(validateCatalog()).toEqual([]);
  });

  it("contains exactly the approved launch cut line", () => {
    expect(categories).toHaveLength(4);
    expect(calculators).toHaveLength(30);
    expect(getPublishedCalculators()).toHaveLength(30);
  });

  it("publishes every category with its full group", () => {
    expect(getCategoryCalculators("matematika")).toHaveLength(8);
    expect(getCategoryCalculators("finansy")).toHaveLength(8);
    expect(getCategoryCalculators("data-i-vremya")).toHaveLength(7);
    expect(getCategoryCalculators("stroitelstvo")).toHaveLength(7);
  });

  it("keeps paths, slugs and related targets deterministic", () => {
    const slugs = new Set(calculators.map((calculator) => calculator.slug));
    for (const calculator of calculators) {
      expect(calculator.path).toBe(`/kalkulyator/${calculator.slug}`);
      for (const related of calculator.related)
        expect(slugs.has(related)).toBe(true);
    }
  });
});
