"use client";

import { useMemo, useState } from "react";
import {
  calculateMortgage,
  type LoanPaymentType,
} from "@/calculations/finance";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  formatMoney,
  ResultValue,
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

const mortgageDefaults: FinanceState = {
  price: "8500000",
  downPayment: "1700000",
  rate: "16,5",
  months: "240",
  paymentType: "annuity",
};

export function MortgageCalculator() {
  const controls = useShareableState("ipoteka", mortgageDefaults, {
    paymentType: ["annuity", "differential"],
  });
  const [submitted, setSubmitted] = useState<FinanceState>(mortgageDefaults);
  useRestoredSubmission(controls.restoreVersion, controls.state, setSubmitted);
  const calculation = useMemo(
    () =>
      safeCalculate(() => {
        const values = parseRequired(submitted, [
          "price",
          "downPayment",
          "rate",
          "months",
        ]);
        if (!values) throw new Error();
        return calculateMortgage({
          price: values.price,
          downPayment: values.downPayment,
          annualRate: values.rate,
          months: values.months,
          paymentType: submitted.paymentType as LoanPaymentType,
        });
      }),
    [submitted],
  );
  const reset = () => {
    controls.reset();
    setSubmitted(mortgageDefaults);
  };
  const dirty = !sameState(controls.state, submitted);

  return (
    <>
      <CalculatorFrame
        result={
          calculation.value ? (
            <>
              <ResultValue
                label="Сумма кредита"
                value={formatMoney(calculation.value.financedAmount)}
              />
              <LoanSummary result={calculation.value} />
            </>
          ) : (
            <EmptyResult />
          )
        }
        resultAnnouncement={
          calculation.value
            ? `Результат расчёта: ипотечный платёж ${formatMoney(calculation.value.monthlyPayment ?? calculation.value.firstPayment)}`
            : null
        }
        error={
          calculation.error
            ? "Первоначальный взнос должен быть меньше стоимости жилья. Проверьте также ставку и срок."
            : null
        }
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
          label="Стоимость жилья"
          value={controls.state.price}
          onChange={(v) => controls.setField("price", v)}
          unit="₽"
        />
        <Field
          label="Первоначальный взнос"
          value={controls.state.downPayment}
          onChange={(v) => controls.setField("downPayment", v)}
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
          hint="Например, 240 месяцев — это 20 лет"
        />
        <div className="sm:col-span-2">
          <SelectField
            label="Тип платежа"
            value={controls.state.paymentType}
            onChange={(v) => controls.setField("paymentType", v)}
            options={[
              { value: "annuity", label: "Аннуитетный" },
              { value: "differential", label: "Дифференцированный" },
            ]}
          />
        </div>
      </CalculatorFrame>
      {calculation.value ? (
        <ScheduleTable rows={calculation.value.schedule} />
      ) : null}
    </>
  );
}
