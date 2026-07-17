"use client";

import { useEffect, useRef, useState } from "react";
import type {
  AmortizationResult,
  AmortizationRow,
} from "@/calculations/finance";
import { formatMoney, parseNumber, ResultValue } from "../shared";

export type FinanceState = Record<string, string>;

export function safeCalculate<T>(calculation: () => T): {
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

export function parseRequired(state: FinanceState, keys: readonly string[]) {
  const result: Record<string, number> = {};
  for (const key of keys) {
    const value = parseNumber(state[key], {
      integer:
        key === "months" ||
        key === "paymentsMade" ||
        key === "remainingMonths" ||
        key === "newMonths",
    });
    if (value === null) return null;
    result[key] = value;
  }
  return result;
}

export function sameState(first: FinanceState, second: FinanceState) {
  const keys = Object.keys(first);
  return (
    keys.length === Object.keys(second).length &&
    keys.every((key) => first[key] === second[key])
  );
}

export function financeNotice(
  state: FinanceState,
  dirtyMessage: string,
  dirty: boolean,
  rateKeys: readonly string[] = ["rate"],
) {
  if (dirty) return dirtyMessage;
  const highRate = rateKeys.some((key) => {
    const raw = state[key];
    if (raw === undefined) return false;
    const rate = parseNumber(raw);
    return rate !== null && rate > 100;
  });
  return highRate
    ? "Ставка выше 100% годовых. Значение допустимо для моделирования, но обязательно проверьте, что не ошиблись в единицах."
    : null;
}

export function useRestoredSubmission(
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

export function LoanSummary({ result }: { result: AmortizationResult }) {
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

export function ScheduleTable({
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
