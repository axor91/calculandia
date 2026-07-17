"use client";

import { calculateCountdown, parseCalendarDate } from "@/calculations/date";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  formatNumber,
  ResultValue,
  useShareableState,
} from "../shared";
import { localCalendarDate } from "../state";

type CountdownState = { asOf: string; target: string };
const countdownDefaults: CountdownState = {
  asOf: "2026-07-16",
  target: "2027-01-01",
};

export function CountdownCalculator() {
  const controls = useShareableState("skolko-dnej-do", countdownDefaults);
  const asOf = parseCalendarDate(controls.state.asOf);
  const target = parseCalendarDate(controls.state.target);
  const result = asOf && target ? calculateCountdown({ asOf, target }) : null;
  const complete = Boolean(controls.state.asOf && controls.state.target);
  const alreadyPassed = result ? result.totalDays < 0 : false;
  const primaryValue = result
    ? alreadyPassed
      ? `Дата уже прошла: ${formatNumber(result.absoluteDays, 0)} дн. назад`
      : `${formatNumber(result.absoluteDays, 0)} дн.`
    : "";
  return (
    <CalculatorFrame
      result={
        result ? (
          <>
            <ResultValue primary label="До даты" value={primaryValue} />
            <ResultValue
              label="Полных недель"
              value={String(result.fullWeeks)}
            />
            <ResultValue
              label="Остаток дней"
              value={String(result.remainderDays)}
            />
            <ResultValue
              label="Знаковый интервал"
              value={`${result.totalDays > 0 ? "+" : ""}${result.totalDays} дн.`}
            />
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={result ? `Результат расчёта: ${primaryValue}` : null}
      error={
        complete && !result
          ? "Введите корректные даты с 1900 по 2100 год. Максимальный интервал — 200 лет."
          : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <Field
        label="Целевая дата"
        type="date"
        min="1900-01-01"
        max="2100-12-31"
        value={controls.state.target}
        onChange={(v) => controls.setField("target", v)}
      />
      <div>
        <Field
          label="Точка отсчёта"
          type="date"
          min="1900-01-01"
          max="2100-12-31"
          value={controls.state.asOf}
          onChange={(v) => controls.setField("asOf", v)}
        />
        <button
          type="button"
          onClick={() => controls.setField("asOf", localCalendarDate())}
          className="mt-2 min-h-11 rounded-xl px-3 text-sm font-bold text-teal hover:bg-mint"
        >
          Подставить сегодня
        </button>
      </div>
    </CalculatorFrame>
  );
}
