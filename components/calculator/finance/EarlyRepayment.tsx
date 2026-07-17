"use client";

import { useMemo, useState } from "react";
import { compareEarlyRepayment } from "@/calculations/finance";
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

const earlyDefaults: FinanceState = {
  principal: "3000000",
  rate: "16",
  months: "120",
  paymentsMade: "12",
  prepayment: "500000",
};

export function EarlyRepaymentCalculator() {
  const controls = useShareableState("dosrochnoe-pogashenie", earlyDefaults);
  const [submitted, setSubmitted] = useState<FinanceState>(earlyDefaults);
  useRestoredSubmission(controls.restoreVersion, controls.state, setSubmitted);
  const calculation = useMemo(
    () =>
      safeCalculate(() => {
        const values = parseRequired(submitted, [
          "principal",
          "rate",
          "months",
          "paymentsMade",
          "prepayment",
        ]);
        if (!values) throw new Error();
        return compareEarlyRepayment({
          principal: values.principal,
          annualRate: values.rate,
          months: values.months,
          paymentsMade: values.paymentsMade,
          prepayment: values.prepayment,
        });
      }),
    [submitted],
  );
  const reset = () => {
    controls.reset();
    setSubmitted(earlyDefaults);
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
                label="Экономия при сокращении срока"
                value={formatMoney(result.reduceTerm.interestSavings)}
              />
              <ResultValue
                label="Проценты без досрочного"
                value={formatMoney(result.baseline.totalInterest)}
              />
              <ResultValue
                label="Проценты при сокращении срока"
                value={formatMoney(result.reduceTerm.revisedTotalInterest)}
              />
              <ResultValue
                label="Новый срок"
                value={`${result.reduceTerm.newTermMonths} мес.`}
              />
              <ResultValue
                label="Экономия при снижении платежа"
                value={formatMoney(result.reducePayment.interestSavings)}
              />
              <ResultValue
                label="Проценты при снижении платежа"
                value={formatMoney(result.reducePayment.revisedTotalInterest)}
              />
              <ResultValue
                label="Новый платёж"
                value={formatMoney(result.reducePayment.monthlyPayment)}
              />
              <ResultValue
                label="Остаток после досрочного"
                value={formatMoney(result.balanceAfterPrepayment)}
              />
            </>
          ) : (
            <EmptyResult />
          )
        }
        resultAnnouncement={
          result
            ? `Результат расчёта: экономия при сокращении срока ${formatMoney(result.reduceTerm.interestSavings)}`
            : null
        }
        error={
          calculation.error
            ? "Досрочный платёж должен быть меньше остатка долга; номер платежа — внутри срока кредита."
            : null
        }
        notice={financeNotice(
          controls.state,
          "Поля изменены. Нажмите «Рассчитать», чтобы обновить сравнение и графики.",
          dirty,
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
          label="Начальная сумма кредита"
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
          label="Исходный срок"
          value={controls.state.months}
          onChange={(v) => controls.setField("months", v)}
          unit="мес."
        />
        <Field
          label="Платежей уже сделано"
          value={controls.state.paymentsMade}
          onChange={(v) => controls.setField("paymentsMade", v)}
          unit="мес."
        />
        <div className="sm:col-span-2">
          <Field
            label="Сумма досрочного платежа"
            value={controls.state.prepayment}
            onChange={(v) => controls.setField("prepayment", v)}
            unit="₽"
            hint="Считаем, что платёж внесён сразу после очередного регулярного платежа"
          />
        </div>
      </CalculatorFrame>
      {result ? (
        <>
          <ScheduleTable
            rows={result.reduceTerm.remainingSchedule}
            title="График при сокращении срока"
          />
          <ScheduleTable
            rows={result.reducePayment.remainingSchedule}
            title="График при снижении платежа"
          />
        </>
      ) : null}
    </>
  );
}
