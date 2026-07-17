"use client";

import { useMemo } from "react";
import { calculateSavingsGoal } from "@/calculations/finance";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  formatMoney,
  ResultValue,
  useShareableState,
} from "../shared";
import {
  financeNotice,
  parseRequired,
  safeCalculate,
  type FinanceState,
} from "./helpers";

const savingsGoalDefaults: FinanceState = {
  targetAmount: "1000000",
  months: "24",
  rate: "10",
  initialAmount: "0",
};

export function SavingsGoalCalculator() {
  const controls = useShareableState("nakopleniya", savingsGoalDefaults);
  const calculation = useMemo(
    () =>
      safeCalculate(() => {
        const values = parseRequired(controls.state, [
          "targetAmount",
          "months",
          "rate",
          "initialAmount",
        ]);
        if (!values) throw new Error();
        return calculateSavingsGoal({
          targetAmount: values.targetAmount,
          months: values.months,
          annualRate: values.rate,
          initialAmount: values.initialAmount,
        });
      }),
    [controls.state],
  );

  return (
    <CalculatorFrame
      result={
        calculation.value ? (
          <>
            <ResultValue
              primary
              label="Ежемесячный взнос"
              value={formatMoney(calculation.value.requiredContribution)}
            />
            <ResultValue
              label="Итог к концу срока"
              value={formatMoney(calculation.value.projectedFinalBalance)}
            />
            {calculation.value.goalReachedWithoutContributions ? (
              <p className="mt-3 text-sm font-semibold text-teal-dark">
                Цель уже достигается за счёт начальной суммы и процентов —
                пополнения не требуются.
              </p>
            ) : null}
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        calculation.value
          ? `Результат расчёта: ежемесячный взнос ${formatMoney(calculation.value.requiredContribution)}`
          : null
      }
      error={
        calculation.error
          ? "Проверьте значения: целевая сумма должна быть положительной, срок — от 1 до 600 месяцев, начальная сумма — не отрицательной."
          : null
      }
      notice={financeNotice(controls.state, "", false)}
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <Field
        label="Целевая сумма"
        value={controls.state.targetAmount}
        onChange={(v) => controls.setField("targetAmount", v)}
        unit="₽"
      />
      <Field
        label="Срок"
        value={controls.state.months}
        onChange={(v) => controls.setField("months", v)}
        unit="мес."
      />
      <Field
        label="Годовая ставка"
        value={controls.state.rate}
        onChange={(v) => controls.setField("rate", v)}
        unit="%"
      />
      <Field
        label="Уже накоплено"
        value={controls.state.initialAmount}
        onChange={(v) => controls.setField("initialAmount", v)}
        unit="₽"
        hint="Стартовая сумма, если она уже есть; по умолчанию 0"
      />
    </CalculatorFrame>
  );
}
