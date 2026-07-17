"use client";

import { useMemo, useState } from "react";
import { calculateRefinance } from "@/calculations/finance";
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
  sameState,
  ScheduleTable,
  useRestoredSubmission,
  type FinanceState,
} from "./helpers";

const refinanceDefaults: FinanceState = {
  currentBalance: "1000000",
  currentRate: "12",
  remainingMonths: "12",
  newRate: "6",
  newMonths: "12",
  fee: "5000",
};

export function RefinanceCalculator() {
  const controls = useShareableState("refinansirovanie", refinanceDefaults);
  const [submitted, setSubmitted] = useState<FinanceState>(refinanceDefaults);
  useRestoredSubmission(controls.restoreVersion, controls.state, setSubmitted);
  const calculation = useMemo(
    () =>
      safeCalculate(() => {
        const values = parseRequired(submitted, [
          "currentBalance",
          "currentRate",
          "remainingMonths",
          "newRate",
          "newMonths",
          "fee",
        ]);
        if (!values) throw new Error();
        return calculateRefinance({
          currentBalance: values.currentBalance,
          currentAnnualRate: values.currentRate,
          remainingMonths: values.remainingMonths,
          newAnnualRate: values.newRate,
          newMonths: values.newMonths,
          fee: values.fee,
        });
      }),
    [submitted],
  );
  const reset = () => {
    controls.reset();
    setSubmitted(refinanceDefaults);
  };
  const dirty = !sameState(controls.state, submitted);
  const result = calculation.value;

  return (
    <>
      <CalculatorFrame
        result={
          result ? (
            <>
              <ResultValue
                primary
                label={
                  result.isBeneficial
                    ? "Экономия от рефинансирования"
                    : "Рефинансирование невыгодно, перерасход"
                }
                value={formatMoney(Math.abs(result.savings))}
              />
              <ResultValue
                label="Текущий платёж"
                value={formatMoney(
                  result.current.monthlyPayment ?? result.current.firstPayment,
                )}
              />
              <ResultValue
                label="Новый платёж"
                value={formatMoney(
                  result.refinanced.monthlyPayment ??
                    result.refinanced.firstPayment,
                )}
              />
              <ResultValue
                label="Переплата по текущему кредиту"
                value={formatMoney(result.current.totalInterest)}
              />
              <ResultValue
                label="Переплата по новому кредиту"
                value={formatMoney(result.refinanced.totalInterest)}
              />
              <ResultValue
                label="Расходы на оформление"
                value={formatMoney(result.fee)}
              />
            </>
          ) : (
            <EmptyResult />
          )
        }
        resultAnnouncement={
          result
            ? `Результат расчёта: ${result.isBeneficial ? "экономия" : "перерасход"} ${formatMoney(Math.abs(result.savings))}`
            : null
        }
        error={
          calculation.error
            ? "Проверьте суммы, ставки (0–1000%) и сроки (1–600 месяцев); расходы на оформление не могут быть отрицательными."
            : null
        }
        notice={financeNotice(
          controls.state,
          "Поля изменены. Нажмите «Рассчитать», чтобы обновить результат и график.",
          dirty,
          ["currentRate", "newRate"],
        )}
        onReset={reset}
        onShare={() => {
          setSubmitted({ ...controls.state });
          void controls.copyLink();
        }}
        shareStatus={controls.shareStatus}
        onSubmit={() => setSubmitted({ ...controls.state })}
      >
        <Field
          label="Текущий остаток долга"
          value={controls.state.currentBalance}
          onChange={(v) => controls.setField("currentBalance", v)}
          unit="₽"
        />
        <Field
          label="Текущая годовая ставка"
          value={controls.state.currentRate}
          onChange={(v) => controls.setField("currentRate", v)}
          unit="%"
        />
        <Field
          label="Оставшийся срок"
          value={controls.state.remainingMonths}
          onChange={(v) => controls.setField("remainingMonths", v)}
          unit="мес."
        />
        <Field
          label="Новая годовая ставка"
          value={controls.state.newRate}
          onChange={(v) => controls.setField("newRate", v)}
          unit="%"
        />
        <Field
          label="Новый срок"
          value={controls.state.newMonths}
          onChange={(v) => controls.setField("newMonths", v)}
          unit="мес."
        />
        <Field
          label="Расходы на оформление"
          value={controls.state.fee}
          onChange={(v) => controls.setField("fee", v)}
          unit="₽"
          hint="Разовые расходы оплачиваются отдельно и не включаются в тело нового кредита"
        />
      </CalculatorFrame>
      {result ? (
        <ScheduleTable
          rows={result.refinanced.schedule}
          title="График нового кредита"
        />
      ) : null}
    </>
  );
}
