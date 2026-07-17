import {
  assertFiniteCalculation,
  assertNonNegativeAmount,
  assertNumberInRange,
  assertPositiveAmount,
} from "./validation";

export interface DiscountPriceInput {
  mode: "price";
  price: number;
  discountPercent: number;
  secondDiscountPercent?: number;
}

export interface DiscountComparisonInput {
  mode: "compare";
  oldPrice: number;
  newPrice: number;
}

export type DiscountInput = DiscountPriceInput | DiscountComparisonInput;

export interface DiscountPriceResult {
  mode: "price";
  price: number;
  discountPercent: number;
  secondDiscountPercent: number;
  finalPrice: number;
  savings: number;
  effectiveDiscountPercent: number;
}

export interface DiscountComparisonResult {
  mode: "compare";
  oldPrice: number;
  newPrice: number;
  savings: number;
  discountPercent: number;
}

export type DiscountResult = DiscountPriceResult | DiscountComparisonResult;

function assertPercent(value: number, field: string): void {
  assertNumberInRange(value, field, { min: 0, max: 100 });
}

export function calculateDiscount(input: DiscountInput): DiscountResult {
  if (input.mode === "price") {
    const { price, discountPercent, secondDiscountPercent = 0 } = input;
    assertPositiveAmount(price, "price");
    assertPercent(discountPercent, "discountPercent");
    assertPercent(secondDiscountPercent, "secondDiscountPercent");

    const finalPrice =
      price * (1 - discountPercent / 100) * (1 - secondDiscountPercent / 100);
    const savings = price - finalPrice;
    const effectiveDiscountPercent = (savings / price) * 100;

    assertFiniteCalculation(finalPrice, "finalPrice");
    assertFiniteCalculation(savings, "savings");

    return {
      mode: "price",
      price,
      discountPercent,
      secondDiscountPercent,
      finalPrice,
      savings,
      effectiveDiscountPercent,
    };
  }

  if (input.mode === "compare") {
    const { oldPrice, newPrice } = input;
    assertPositiveAmount(oldPrice, "oldPrice");
    assertNonNegativeAmount(newPrice, "newPrice");
    assertNumberInRange(newPrice, "newPrice", { min: 0, max: oldPrice });

    const savings = oldPrice - newPrice;
    const discountPercent = (savings / oldPrice) * 100;

    assertFiniteCalculation(discountPercent, "discountPercent");

    return {
      mode: "compare",
      oldPrice,
      newPrice,
      savings,
      discountPercent,
    };
  }

  throw new TypeError("mode must be price or compare");
}
