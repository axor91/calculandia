"use client";

import { useMemo, useState } from "react";
import { calculateCredit, type LoanPaymentType } from "@/calculations/finance";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  formatMoney,
  SelectField,
  useShareableState,
} from "../shared";
import {
  financeNotice,
  LoanSummary,
  parseRequired,
  safeCalculate,
  sameState,
  ScheduleTable,
  useRestoredSubmission,
  type FinanceState,
} from "./helpers";

const creditDefaults: FinanceState = {
  principal: "500000",
  rate: "17,9",
  months: "36",
  paymentType: "annuity",
};

export function CreditCalculator() {
  const controls = useShareableState("kredit", creditDefaults, {
    paymentType: ["annuity", "differential"],
  });
  const [submitted, setSubmitted] = useState<FinanceState>(creditDefaults);
  useRestoredSubmission(controls.restoreVersion, controls.state, setSubmitted);
  const calculation = useMemo(
    () =>
      safeCalculate(() => {
        const values = parseRequired(submitted, [
          "principal",
          "rate",
          "months",
        ]);
        if (!values) throw new Error();
        return calculateCredit({
          principal: values.principal,
          annualRate: values.rate,
          months: values.months,
          paymentType: submitted.paymentType as LoanPaymentType,
        });
      }),
    [submitted],
  );
  const reset = () => {
    controls.reset();
    setSubmitted(creditDefaults);
  };
  const dirty = !sameState(controls.state, submitted);

  return (
    <>
      <CalculatorFrame
        result={
          calculation.value ? (
            <LoanSummary result={calculation.value} />
          ) : (
            <EmptyResult />
          )
        }
        resultAnnouncement={
          calculation.value
            ? `Результат расчёта: платёж ${formatMoney(calculation.value.monthlyPayment ?? calculation.value.firstPayment)}`
            : null
        }
        error={calculation.error}
        notice={financeNotice(
          controls.state,
          "Поля изменены. Нажмите «Рассчитать», чтобы обновить результат и график.",
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
          label="Сумма кредита"
          value={controls.state.principal}
          onChange={(v) => controls.setField("principal", v)}
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
        <SelectField
          label="Тип платежа"
          value={controls.state.paymentType}
          onChange={(v) => controls.setField("paymentType", v)}
          options={[
            { value: "annuity", label: "Аннуитетный" },
            { value: "differential", label: "Дифференцированный" },
          ]}
        />
      </CalculatorFrame>
      {calculation.value ? (
        <ScheduleTable rows={calculation.value.schedule} />
      ) : null}
    </>
  );
}
