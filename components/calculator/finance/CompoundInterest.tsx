"use client";

import { useMemo } from "react";
import {
  calculateCompoundInterest,
  type CompoundingFrequency,
} from "@/calculations/finance";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  formatMoney,
  formatNumber,
  ResultValue,
  SelectField,
  useShareableState,
} from "../shared";
import {
  financeNotice,
  parseRequired,
  safeCalculate,
  type FinanceState,
} from "./helpers";

const compoundInterestDefaults: FinanceState = {
  principal: "100000",
  rate: "12",
  months: "12",
  frequency: "monthly",
};

const frequencyLabels: Record<CompoundingFrequency, string> = {
  monthly: "Ежемесячно",
  quarterly: "Ежеквартально",
  yearly: "Ежегодно",
};

export function CompoundInterestCalculator() {
  const controls = useShareableState(
    "slozhnyj-procent",
    compoundInterestDefaults,
    { frequency: ["monthly", "quarterly", "yearly"] },
  );
  const calculation = useMemo(
    () =>
      safeCalculate(() => {
        const values = parseRequired(controls.state, [
          "principal",
          "rate",
          "months",
        ]);
        if (!values) throw new Error();
        return calculateCompoundInterest({
          principal: values.principal,
          annualRate: values.rate,
          months: values.months,
          frequency: controls.state.frequency as CompoundingFrequency,
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
              label="Итоговая сумма"
              value={formatMoney(calculation.value.futureValue)}
            />
            <ResultValue
              label="Доход"
              value={formatMoney(calculation.value.income)}
            />
            <ResultValue
              label="Эффективная годовая ставка"
              value={`${formatNumber(calculation.value.effectiveAnnualRate, 4)} %`}
            />
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        calculation.value
          ? `Результат расчёта: итоговая сумма ${formatMoney(calculation.value.futureValue)}`
          : null
      }
      error={
        calculation.error
          ? "Срок должен быть кратен периоду капитализации (для ежеквартальной — 3 месяцам, для ежегодной — 12 месяцам); проверьте также сумму и ставку."
          : null
      }
      notice={financeNotice(controls.state, "", false)}
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <Field
        label="Начальная сумма"
        value={controls.state.principal}
        onChange={(v) => controls.setField("principal", v)}
        unit="₽"
      />
      <Field
        label="Годовая ставка"
        value={controls.state.rate}
        onChange={(v) => controls.setField("rate", v)}
        unit="%"
      />
      <Field
        label="Срок"
        value={controls.state.months}
        onChange={(v) => controls.setField("months", v)}
        unit="мес."
      />
      <SelectField
        label="Периодичность капитализации"
        value={controls.state.frequency}
        onChange={(v) => controls.setField("frequency", v)}
        options={[
          { value: "monthly", label: frequencyLabels.monthly },
          { value: "quarterly", label: frequencyLabels.quarterly },
          { value: "yearly", label: frequencyLabels.yearly },
        ]}
      />
    </CalculatorFrame>
  );
}
