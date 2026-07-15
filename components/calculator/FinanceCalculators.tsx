"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateCredit,
  calculateDeposit,
  calculateMortgage,
  compareEarlyRepayment,
  type AmortizationResult,
  type AmortizationRow,
  type DepositResult,
  type LoanPaymentType,
} from "@/calculations/finance";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  formatMoney,
  ResultValue,
  SelectField,
  parseNumber,
  useShareableState,
} from "./shared";

type FinanceState = Record<string, string>;

function safeCalculate<T>(calculation: () => T): {
  value: T | null;
  error: string | null;
} {
  try {
    return { value: calculation(), error: null };
  } catch {
    return {
      value: null,
      error:
        "Проверьте значения: суммы должны быть положительными, срок — от 1 до 600 месяцев, ставка — от 0 до 1000%.",
    };
  }
}

function parseRequired(state: FinanceState, keys: readonly string[]) {
  const result: Record<string, number> = {};
  for (const key of keys) {
    const value = parseNumber(state[key], {
      integer: key === "months" || key === "paymentsMade",
    });
    if (value === null) return null;
    result[key] = value;
  }
  return result;
}

function sameState(first: FinanceState, second: FinanceState) {
  const keys = Object.keys(first);
  return (
    keys.length === Object.keys(second).length &&
    keys.every((key) => first[key] === second[key])
  );
}

function financeNotice(
  state: FinanceState,
  dirtyMessage: string,
  dirty: boolean,
) {
  if (dirty) return dirtyMessage;
  const rate = parseNumber(state.rate);
  return rate !== null && rate > 100
    ? "Ставка выше 100% годовых. Значение допустимо для моделирования, но обязательно проверьте, что не ошиблись в единицах."
    : null;
}

function useRestoredSubmission(
  restoreVersion: number,
  state: FinanceState,
  submit: (state: FinanceState) => void,
) {
  const appliedVersion = useRef(0);
  useEffect(() => {
    if (restoreVersion <= appliedVersion.current) return;
    appliedVersion.current = restoreVersion;
    submit({ ...state });
  }, [restoreVersion, state, submit]);
}

function LoanSummary({ result }: { result: AmortizationResult }) {
  return (
    <>
      <ResultValue
        primary
        label={
          result.paymentType === "annuity"
            ? "Ежемесячный платёж"
            : "Первый платёж"
        }
        value={formatMoney(result.monthlyPayment ?? result.firstPayment)}
      />
      {result.paymentType === "differential" ? (
        <ResultValue
          label="Последний платёж"
          value={formatMoney(result.lastPayment)}
        />
      ) : null}
      <ResultValue
        label="Переплата"
        value={formatMoney(result.totalInterest)}
      />
      <ResultValue
        label="Всего выплат"
        value={formatMoney(result.totalPayment)}
      />
    </>
  );
}

function ScheduleTable({
  rows,
  title = "График платежей",
}: {
  rows: readonly AmortizationRow[];
  title?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section className="mt-6 rounded-[24px] border border-line bg-white p-4 sm:p-6">
      <details onToggle={(event) => setExpanded(event.currentTarget.open)}>
        <summary className="cursor-pointer text-lg font-extrabold text-ink">
          {title} · {rows.length} мес.
        </summary>
        {expanded ? (
          <div
            className="mt-4 max-h-[34rem] overflow-auto rounded-xl border border-line focus:ring-4 focus:ring-teal/20"
            tabIndex={0}
            role="region"
            aria-label={`${title}: прокручиваемая таблица`}
          >
            <table className="w-full min-w-[720px] border-collapse text-right text-sm number-tabular">
              <caption className="sr-only">{title}</caption>
              <thead className="sticky top-0 bg-canvas text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="p-3 text-left">Месяц</th>
                  <th className="p-3">Платёж</th>
                  <th className="p-3">Основной долг</th>
                  <th className="p-3">Проценты</th>
                  <th className="p-3">Остаток</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.month} className="border-t border-line">
                    <th
                      scope="row"
                      className="sticky left-0 bg-white p-3 text-left font-bold"
                    >
                      {row.month}
                    </th>
                    <td className="p-3">{formatMoney(row.payment)}</td>
                    <td className="p-3">{formatMoney(row.principal)}</td>
                    <td className="p-3">{formatMoney(row.interest)}</td>
                    <td className="p-3">{formatMoney(row.closingBalance)}</td>
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
