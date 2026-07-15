import { calculators } from "./calculators";
import { categories } from "./categories";
import type {
  CalculatorDefinition,
  CalculatorSlug,
  CategoryDefinition,
  CategoryId,
} from "./types";
import { assertValidCatalog } from "./validate";

assertValidCatalog();

export { calculators, categories };
export type * from "./types";

export function getPublishedCalculators(): readonly CalculatorDefinition[] {
  return calculators.filter((calculator) => calculator.status === "published");
}

export function getCalculator(slug: string): CalculatorDefinition | undefined {
  return calculators.find(
    (calculator) =>
      calculator.slug === slug && calculator.status === "published",
  );
}

export function getCategory(id: string): CategoryDefinition | undefined {
  return categories.find((category) => category.id === id);
}

export function getCategoryCalculators(
  categoryId: CategoryId,
): readonly CalculatorDefinition[] {
  return getPublishedCalculators().filter(
    (calculator) => calculator.category === categoryId,
  );
}

export function getRelatedCalculators(
  slugs: readonly CalculatorSlug[],
): readonly CalculatorDefinition[] {
  return slugs
    .map((slug) => getCalculator(slug))
    .filter((calculator) => calculator !== undefined);
}
