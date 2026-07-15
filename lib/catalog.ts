import type { CalculatorDefinition, CategoryDefinition } from "./types";

export const categories = [
  {
    id: "math",
    name: "Математика",
    description: "Проценты, дроби и другие повседневные вычисления.",
  },
  {
    id: "finance",
    name: "Финансы",
    description: "Предварительная оценка кредитов и личных финансов.",
  },
] as const satisfies readonly CategoryDefinition[];

export const calculators = [
  {
    id: "percent-diff",
    slug: "percent-diff",
    name: "Процентная разница",
    category: "math",
    description: "Сравнение двух значений в процентах.",
    component: "PercentDiffCalculator",
    seo: {
      title: "Процентная разница между числами — калькулятор",
      description:
        "Рассчитайте процентное изменение и разницу между двумя значениями.",
    },
    updatedAt: "2026-07-15",
    status: "published",
  },
  {
    id: "mortgage",
    slug: "mortgage",
    name: "Ипотечный калькулятор",
    category: "finance",
    description:
      "Предварительный расчёт ипотечного кредита и графика платежей.",
    component: "MortgageCalculator",
    seo: {
      title: "Ипотечный калькулятор — платёж и переплата",
      description:
        "Оцените ежемесячный платёж, общую сумму и переплату по ипотеке.",
    },
    updatedAt: "2026-07-15",
    status: "published",
  },
  {
    id: "fractions",
    slug: "fractions",
    name: "Калькулятор дробей",
    category: "math",
    description: "Сложение, вычитание, умножение и деление дробей.",
    component: "FractionsCalculator",
    seo: {
      title: "Калькулятор дробей онлайн",
      description: "Выполняйте действия с обыкновенными и смешанными дробями.",
    },
    updatedAt: "2026-07-15",
    status: "published",
  },
  {
    id: "days",
    slug: "days",
    name: "Калькулятор дней",
    category: "math",
    description: "Календарный интервал и прибавление периода к дате.",
    component: "DaysCalculator",
    seo: {
      title: "Калькулятор дней между датами",
      description:
        "Узнайте календарный интервал или прибавьте период к выбранной дате.",
    },
    updatedAt: "2026-07-15",
    status: "published",
  },
] as const satisfies readonly CalculatorDefinition[];

export function getPublishedCalculators(): readonly CalculatorDefinition[] {
  return calculators.filter((calculator) => calculator.status === "published");
}

export function getCalculator(
  idOrSlug: string,
): CalculatorDefinition | undefined {
  return calculators.find(
    (calculator) =>
      calculator.status === "published" &&
      (calculator.id === idOrSlug || calculator.slug === idOrSlug),
  );
}

export function getCategory(
  categoryId: string,
): CategoryDefinition | undefined {
  return categories.find((category) => category.id === categoryId);
}
