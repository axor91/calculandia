import { calculators } from "./calculators";
import { categories } from "./categories";
import type { CalculatorComponentId, SourceRecord } from "./types";

export const calculatorComponentIds = [
  "percent-of-number",
  "percent-change",
  "fractions",
  "proportion",
  "mortgage",
  "credit",
  "deposit",
  "early-repayment",
  "days-between",
  "add-date",
  "age",
  "concrete",
  "tile",
  "wallpaper",
  "mean",
  "gcd-lcm",
  "quadratic-equation",
  "shape-area",
  "compound-interest",
  "savings-goal",
  "refinance",
  "discount",
  "countdown",
  "date-difference",
  "weekday",
  "time-calculator",
  "paint",
  "laminate",
  "brick",
  "plaster",
] as const satisfies readonly CalculatorComponentId[];

export type CatalogIssue = {
  path: string;
  message: string;
};

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function isStrictIsoDate(value: string): boolean {
  if (!isoDatePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validateCatalog(): CatalogIssue[] {
  const issues: CatalogIssue[] = [];
  const categoryIds = new Set(categories.map((category) => category.id));
  const componentIds = new Set<string>(calculatorComponentIds);
  const usedComponents = new Set<string>();
  const slugs = new Set<string>();

  if (categories.length !== 4) {
    issues.push({
      path: "categories",
      message: "Launch catalog must contain exactly four categories",
    });
  }
  if (calculators.length !== 30) {
    issues.push({
      path: "calculators",
      message: "Launch catalog must contain exactly thirty calculators",
    });
  }

  for (const calculator of calculators) {
    const path = `calculators.${calculator.slug}`;
    const aliases: readonly string[] = calculator.aliases;
    const assumptions: readonly string[] = calculator.assumptions;
    const sources: readonly SourceRecord[] = calculator.sources;
    const examples: readonly unknown[] = calculator.examples;
    const sections: readonly unknown[] = calculator.sections;
    const faq: readonly unknown[] = calculator.faq;
    const related: readonly string[] = calculator.related;
    if (slugs.has(calculator.slug))
      issues.push({ path, message: "Duplicate calculator slug" });
    slugs.add(calculator.slug);

    if (calculator.path !== `/kalkulyator/${calculator.slug}`) {
      issues.push({
        path: `${path}.path`,
        message: "Path must be derived from slug",
      });
    }
    if (!categoryIds.has(calculator.category)) {
      issues.push({ path: `${path}.category`, message: "Unknown category" });
    }
    if (!componentIds.has(calculator.component)) {
      issues.push({
        path: `${path}.component`,
        message: "Unknown calculator component",
      });
    }
    if (usedComponents.has(calculator.component)) {
      issues.push({
        path: `${path}.component`,
        message: "A launch component must map to exactly one calculator",
      });
    }
    usedComponents.add(calculator.component);
    if (calculator.status !== "published") {
      issues.push({
        path: `${path}.status`,
        message: "Every launch manifest entry must be published",
      });
    }
    if (calculator.seo.title.length < 35 || calculator.seo.title.length > 70) {
      issues.push({
        path: `${path}.seo.title`,
        message: "SEO title must contain 35–70 characters",
      });
    }
    if (
      calculator.seo.description.length < 100 ||
      calculator.seo.description.length > 180
    ) {
      issues.push({
        path: `${path}.seo.description`,
        message: "SEO description must contain 100–180 characters",
      });
    }
    for (const [field, value] of [
      ["contentUpdatedAt", calculator.contentUpdatedAt],
      ["formulaReviewedAt", calculator.formulaReviewedAt],
      ["sourceCheckedAt", calculator.sourceCheckedAt],
    ] as const) {
      if (!isStrictIsoDate(value)) {
        issues.push({
          path: `${path}.${field}`,
          message: "Expected a valid ISO calendar date",
        });
      }
    }
    if (aliases.length < 2 || new Set(aliases).size !== aliases.length) {
      issues.push({
        path: `${path}.aliases`,
        message: "At least two unique search aliases are required",
      });
    }
    if (assumptions.length === 0 || sources.length < 2) {
      issues.push({ path, message: "Assumptions and sources are required" });
    }
    if (!sources.some((source) => source.href.startsWith("https://"))) {
      issues.push({
        path: `${path}.sources`,
        message: "At least one independent HTTPS source is required",
      });
    }
    if (new Set(sources.map((source) => source.href)).size !== sources.length) {
      issues.push({
        path: `${path}.sources`,
        message: "Source URLs must be unique",
      });
    }
    for (const [index, source] of sources.entries()) {
      if (!source.title.trim() || !source.note.trim()) {
        issues.push({
          path: `${path}.sources.${index}`,
          message: "Source title and note are required",
        });
      }
      if (!(
        source.href.startsWith("https://") || source.href.startsWith("/")
      )) {
        issues.push({
          path: `${path}.sources.${index}.href`,
          message: "Source must be HTTPS or an internal absolute path",
        });
      }
    }
    if (examples.length < 2 || sections.length < 2 || faq.length < 2) {
      issues.push({
        path,
        message: "Two examples, content sections and FAQ items are required",
      });
    }
    if (
      related.length === 0 ||
      related.includes(calculator.slug) ||
      new Set(related).size !== related.length
    ) {
      issues.push({
        path: `${path}.related`,
        message: "Related graph must be non-empty, unique and exclude self",
      });
    }
  }

  for (const calculator of calculators) {
    for (const related of calculator.related) {
      if (!slugs.has(related)) {
        issues.push({
          path: `calculators.${calculator.slug}.related`,
          message: `Unknown related slug: ${related}`,
        });
      }
    }
  }

  return issues;
}

export function assertValidCatalog(): void {
  const issues = validateCatalog();
  if (issues.length > 0) {
    throw new Error(
      issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"),
    );
  }
}
