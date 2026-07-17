import { describe, expect, it } from "vitest";

import { calculateDiscount } from "../../calculations/finance/discount";
import { FinanceValidationError } from "../../calculations/finance/validation";

function expectFinanceClose(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(
    Math.max(1e-9, Math.abs(expected) * 1e-9),
  );
}

describe("discount", () => {
  it("matches three independent golden fixtures", () => {
    const single = calculateDiscount({
      mode: "price",
      price: 1_000,
      discountPercent: 15,
    });
    if (single.mode !== "price") throw new Error("unexpected mode");
    expectFinanceClose(single.finalPrice, 850);
    expectFinanceClose(single.savings, 150);

    const stacked = calculateDiscount({
      mode: "price",
      price: 1_000,
      discountPercent: 20,
      secondDiscountPercent: 10,
    });
    if (stacked.mode !== "price") throw new Error("unexpected mode");
    expectFinanceClose(stacked.finalPrice, 720);
    expectFinanceClose(stacked.savings, 280);
    expectFinanceClose(stacked.effectiveDiscountPercent, 28);

    const compare = calculateDiscount({
      mode: "compare",
      oldPrice: 2_500,
      newPrice: 2_000,
    });
    if (compare.mode !== "compare") throw new Error("unexpected mode");
    expectFinanceClose(compare.discountPercent, 20);
    expectFinanceClose(compare.savings, 500);
  });

  it("confirms the stacked discount is not the naive sum", () => {
    const stacked = calculateDiscount({
      mode: "price",
      price: 1_000,
      discountPercent: 20,
      secondDiscountPercent: 10,
    });
    if (stacked.mode !== "price") throw new Error("unexpected mode");
    expect(stacked.effectiveDiscountPercent).not.toBeCloseTo(30, 6);
    expectFinanceClose(stacked.effectiveDiscountPercent, 28);
  });

  it.each([
    [500, 10, 0],
    [500, 0, 0],
    [500, 100, 0],
    [500, 0, 100],
    [500, 50, 50],
    [1, 1, 1],
    [1_000_000_000_000_000, 0, 0],
    [999_999.99, 17.25, 5],
    [10_000, 33.33, 33.33],
    [250_000, 100, 100],
  ] as const)(
    "supports domain case price=%s discount1=%s discount2=%s",
    (price, discountPercent, secondDiscountPercent) => {
      const result = calculateDiscount({
        mode: "price",
        price,
        discountPercent,
        secondDiscountPercent,
      });
      if (result.mode !== "price") throw new Error("unexpected mode");

      expect(Number.isFinite(result.finalPrice)).toBe(true);
      expect(result.finalPrice).toBeGreaterThanOrEqual(0);
      expect(result.finalPrice).toBeLessThanOrEqual(price);
      expect(result.savings).toBeGreaterThanOrEqual(0);
    },
  );

  it.each([
    { mode: "price" as const, price: 0, discountPercent: 10 },
    { mode: "price" as const, price: -1, discountPercent: 10 },
    {
      mode: "price" as const,
      price: 1_000_000_000_000_001,
      discountPercent: 10,
    },
    { mode: "price" as const, price: 500, discountPercent: -1 },
    { mode: "price" as const, price: 500, discountPercent: 101 },
    {
      mode: "price" as const,
      price: 500,
      discountPercent: 10,
      secondDiscountPercent: -1,
    },
    {
      mode: "price" as const,
      price: 500,
      discountPercent: 10,
      secondDiscountPercent: 101,
    },
    { mode: "compare" as const, oldPrice: 0, newPrice: 0 },
    { mode: "compare" as const, oldPrice: 100, newPrice: -1 },
    { mode: "compare" as const, oldPrice: 100, newPrice: 101 },
  ])("rejects invalid or boundary input %#", (input) => {
    expect(() => calculateDiscount(input)).toThrow(FinanceValidationError);
  });

  it("rejects an unsupported mode", () => {
    expect(() =>
      calculateDiscount({ mode: "bogus" } as unknown as Parameters<
        typeof calculateDiscount
      >[0]),
    ).toThrow(TypeError);
  });

  it("defaults the second discount to zero when omitted", () => {
    const withSecond = calculateDiscount({
      mode: "price",
      price: 1_000,
      discountPercent: 15,
      secondDiscountPercent: 0,
    });
    const withoutSecond = calculateDiscount({
      mode: "price",
      price: 1_000,
      discountPercent: 15,
    });
    expect(withoutSecond).toEqual(withSecond);
  });

  it("gives the same final price regardless of the order of two sequential discounts", () => {
    const first = calculateDiscount({
      mode: "price",
      price: 2_000,
      discountPercent: 15,
      secondDiscountPercent: 25,
    });
    const swapped = calculateDiscount({
      mode: "price",
      price: 2_000,
      discountPercent: 25,
      secondDiscountPercent: 15,
    });
    if (first.mode !== "price" || swapped.mode !== "price") {
      throw new Error("unexpected mode");
    }
    expectFinanceClose(first.finalPrice, swapped.finalPrice);
  });

  it("treats a 100% discount as a free final price", () => {
    const result = calculateDiscount({
      mode: "price",
      price: 750,
      discountPercent: 100,
    });
    if (result.mode !== "price") throw new Error("unexpected mode");
    expect(result.finalPrice).toBe(0);
    expect(result.savings).toBe(750);
  });

  it("treats new price equal to old price as zero discount", () => {
    const result = calculateDiscount({
      mode: "compare",
      oldPrice: 1_200,
      newPrice: 1_200,
    });
    if (result.mode !== "compare") throw new Error("unexpected mode");
    expect(result.discountPercent).toBe(0);
    expect(result.savings).toBe(0);
  });
});
