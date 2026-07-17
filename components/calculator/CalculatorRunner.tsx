"use client";

import type { CalculatorComponentId } from "@/catalog";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const calculators: Record<CalculatorComponentId, React.ComponentType> = {
  "percent-of-number": dynamic(() =>
    import("./math/PercentOfNumber").then(
      (module) => module.PercentOfNumberCalculator,
    ),
  ),
  "percent-change": dynamic(() =>
    import("./math/PercentChange").then(
      (module) => module.PercentChangeCalculator,
    ),
  ),
  fractions: dynamic(() =>
    import("./math/Fractions").then((module) => module.FractionsCalculator),
  ),
  proportion: dynamic(() =>
    import("./math/Proportion").then((module) => module.ProportionCalculator),
  ),
  mean: dynamic(() =>
    import("./math/Mean").then((module) => module.MeanCalculator),
  ),
  "gcd-lcm": dynamic(() =>
    import("./math/GcdLcm").then((module) => module.GcdLcmCalculator),
  ),
  "quadratic-equation": dynamic(() =>
    import("./math/QuadraticEquation").then(
      (module) => module.QuadraticEquationCalculator,
    ),
  ),
  "shape-area": dynamic(() =>
    import("./math/ShapeArea").then((module) => module.ShapeAreaCalculator),
  ),
  mortgage: dynamic(() =>
    import("./finance/Mortgage").then((module) => module.MortgageCalculator),
  ),
  credit: dynamic(() =>
    import("./finance/Credit").then((module) => module.CreditCalculator),
  ),
  deposit: dynamic(() =>
    import("./finance/Deposit").then((module) => module.DepositCalculator),
  ),
  "early-repayment": dynamic(() =>
    import("./finance/EarlyRepayment").then(
      (module) => module.EarlyRepaymentCalculator,
    ),
  ),
  "compound-interest": dynamic(() =>
    import("./finance/CompoundInterest").then(
      (module) => module.CompoundInterestCalculator,
    ),
  ),
  "savings-goal": dynamic(() =>
    import("./finance/SavingsGoal").then(
      (module) => module.SavingsGoalCalculator,
    ),
  ),
  refinance: dynamic(() =>
    import("./finance/Refinance").then((module) => module.RefinanceCalculator),
  ),
  discount: dynamic(() =>
    import("./finance/Discount").then((module) => module.DiscountCalculator),
  ),
  "days-between": dynamic(() =>
    import("./date/DaysBetween").then((module) => module.DaysBetweenCalculator),
  ),
  "add-date": dynamic(() =>
    import("./date/AddDate").then((module) => module.AddDateCalculator),
  ),
  age: dynamic(() =>
    import("./date/Age").then((module) => module.AgeCalculator),
  ),
  countdown: dynamic(() =>
    import("./date/Countdown").then((module) => module.CountdownCalculator),
  ),
  "date-difference": dynamic(() =>
    import("./date/DateDifference").then(
      (module) => module.DateDifferenceCalculator,
    ),
  ),
  weekday: dynamic(() =>
    import("./date/Weekday").then((module) => module.WeekdayCalculator),
  ),
  "time-calculator": dynamic(() =>
    import("./date/Time").then((module) => module.TimeCalculator),
  ),
  concrete: dynamic(() =>
    import("./construction/Concrete").then(
      (module) => module.ConcreteCalculator,
    ),
  ),
  tile: dynamic(() =>
    import("./construction/Tile").then((module) => module.TileCalculator),
  ),
  wallpaper: dynamic(() =>
    import("./construction/Wallpaper").then(
      (module) => module.WallpaperCalculator,
    ),
  ),
  paint: dynamic(() =>
    import("./construction/Paint").then((module) => module.PaintCalculator),
  ),
  laminate: dynamic(() =>
    import("./construction/Laminate").then(
      (module) => module.LaminateCalculator,
    ),
  ),
  brick: dynamic(() =>
    import("./construction/Brick").then((module) => module.BrickCalculator),
  ),
  plaster: dynamic(() =>
    import("./construction/Plaster").then((module) => module.PlasterCalculator),
  ),
};

export default function CalculatorRunner({
  component,
}: {
  component: CalculatorComponentId;
}) {
  const [interactive, setInteractive] = useState(false);
  const Component = calculators[component];

  useEffect(() => setInteractive(true), []);

  return (
    <div
      data-calculator-ready={interactive ? "true" : "false"}
      aria-busy={!interactive}
      inert={!interactive}
    >
      <Component />
    </div>
  );
}
