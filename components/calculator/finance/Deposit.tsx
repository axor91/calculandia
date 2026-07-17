"use client";

import { useMemo, useState } from "react";
import { calculateDeposit, type DepositResult } from "@/calculations/finance";
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
  useRestoredSubmission,
  type FinanceState,
} from "./helpers";

const depositDefaults: FinanceState = {
  principal: "300000",
  rate: "15",
  months: "24",
  contribution: "10000",
};

function DepositTable({ result }: { result: DepositResult }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section className="mt-6 rounded-[24px] border border-line bg-white p-4 sm:p-6">
      <details onToggle={(event) => setExpanded(event.currentTarget.open)}>
        <summary className="cursor-pointer text-lg font-extrabold text-ink">
          Начисления по месяцам · {result.months} мес.
        </summary>
        {expanded ? (
          <div
            className="mt-4 max-h-[34rem] overflow-auto rounded-xl border border-line focus:ring-4 focus:ring-teal/20"
            tabIndex={0}
            role="region"
            aria-label="Начисления по вкладу: прокручиваемая таблица"
          >
            <table className="w-full min-w-[620px] text-right text-sm number-tabular">
              <caption className="sr-only">Начисления по вкладу</caption>
              <thead className="sticky top-0 bg-canvas text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="p-3 text-left">Месяц</th>
                  <th className="p-3">Баланс</th>
                  <th className="p-3">Проценты</th>
                  <th className="p-3">Пополнение</th>
                  <th className="p-3">Итого</th>
                </tr>
              </thead>
              <tbody>
                {result.schedule.map((row) => (
                  <tr key={row.month} className="border-t border-line">
                    <th
                      scope="row"
                      className="sticky left-0 bg-white p-3 text-left"
                    >
                      {row.month}
                    </th>
                    <td className="p-3">{formatMoney(row.openingBalance)}</td>
                    <td className="p-3">{formatMoney(row.interest)}</td>
                    <td className="p-3">{formatMoney(row.contribution)}</td>
                    <td className="p-3 font-bold">
                      {formatMoney(row.closingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </details>
    </section>
  );
}

export function DepositCalculator() {
  const controls = useShareableState("vklad", depositDefaults);
  const [submitted, setSubmitted] = useState<FinanceState>(depositDefaults);
  useRestoredSubmission(controls.restoreVersion, controls.state, setSubmitted);
  const calculation = useMemo(
    () =>
      safeCalculate(() => {
        const values = parseRequired(submitted, [
          "principal",
          "rate",
          "months",
          "contribution",
        ]);
        if (!values) throw new Error();
        return calculateDeposit({
          initialPrincipal: values.principal,
          annualRate: values.rate,
          months: values.months,
          monthlyContribution: values.contribution,
        });
      }),
    [submitted],
  );
  const reset = () => {
    controls.reset();
    setSubmitted(depositDefaults);
  };
  const dirty = !sameState(controls.state, submitted);
  return (
    <>
      <CalculatorFrame
        result={
          calculation.value ? (
            <>
              <ResultValue
                primary
                label="Сумма в конце срока"
                value={formatMoney(calculation.value.finalBalance)}
              />
              <ResultValue
                label="Доход"
                value={formatMoney(calculation.value.interestIncome)}
              />
              <ResultValue
                label="Внесено своих средств"
                value={formatMoney(calculation.value.totalUserContributions)}
              />
            </>
          ) : (
            <EmptyResult />
          )
        }
        resultAnnouncement={
          calculation.value
            ? `Результат расчёта: сумма в конце срока ${formatMoney(calculation.value.finalBalance)}`
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
        <Field
          label="Ежемесячное пополнение"
          value={controls.state.contribution}
          onChange={(v) => controls.setField("contribution", v)}
          unit="₽"
          hint="Пополнение учитывается после начисления процентов"
        />
      </CalculatorFrame>
      {calculation.value ? <DepositTable result={calculation.value} /> : null}
    </>
  );
}
