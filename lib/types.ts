export type CategoryId = "math" | "finance";

export type CalculatorComponentId =
  | "PercentDiffCalculator"
  | "MortgageCalculator"
  | "FractionsCalculator"
  | "DaysCalculator";

export type CategoryDefinition = {
  id: CategoryId;
  name: string;
  description: string;
};

export type CalculatorDefinition = {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  description: string;
  component: CalculatorComponentId;
  seo: {
    title: string;
    description: string;
  };
  updatedAt: string;
  status: "published" | "draft";
};
