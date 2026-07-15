import type { CalculatorComponentId } from "@/catalog";
import dynamic from "next/dynamic";

const calculators: Record<CalculatorComponentId, React.ComponentType> = {
  "percent-of-number": dynamic(() =>
    import("./MathCalculators").then(
      (module) => module.PercentOfNumberCalculator,
    ),
  ),
  "percent-change": dynamic(() =>
    import("./MathCalculators").then(
      (module) => module.PercentChangeCalculator,
    ),
  ),
  fractions: dynamic(() =>
    import("./MathCalculators").then((module) => module.FractionsCalculator),
  ),
  proportion: dynamic(() =>
    import("./MathCalculators").then((module) => module.ProportionCalculator),
  ),
  mortgage: dynamic(() =>
    import("./FinanceCalculators").then((module) => module.MortgageCalculator),
  ),
  credit: dynamic(() =>
    import("./FinanceCalculators").then((module) => module.CreditCalculator),
  ),
  deposit: dynamic(() =>
    import("./FinanceCalculators").then((module) => module.DepositCalculator),
  ),
  "early-repayment": dynamic(() =>
    import("./FinanceCalculators").then(
      (module) => module.EarlyRepaymentCalculator,
    ),
  ),
  "days-between": dynamic(() =>
    import("./DateCalculators").then((module) => module.DaysBetweenCalculator),
  ),
  "add-date": dynamic(() =>
    import("./DateCalculators").then((module) => module.AddDateCalculator),
  ),
  age: dynamic(() =>
    import("./DateCalculators").then((module) => module.AgeCalculator),
  ),
  concrete: dynamic(() =>
    import("./ConstructionCalculators").then(
      (module) => module.ConcreteCalculator,
    ),
  ),
  tile: dynamic(() =>
    import("./ConstructionCalculators").then((module) => module.TileCalculator),
  ),
  wallpaper: dynamic(() =>
    import("./ConstructionCalculators").then(
      (module) => module.WallpaperCalculator,
    ),
  ),
};

export default function CalculatorRunner({
  component,
}: {
  component: CalculatorComponentId;
}) {
  const Component = calculators[component];
  return <Component />;
}
