"use client";

import {
  calculateDateShift,
  formatCalendarDate,
  parseCalendarDate,
} from "@/calculations/date";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  formatNumber,
  ResultValue,
  useShareableState,
  parseNumber,
} from "../shared";
import { localCalendarDate } from "../state";
import { formatDate } from "./helpers";

type AddState = { date: string; years: string; months: string; days: string };
const addDefaults: AddState = {
  date: "2026-07-15",
  years: "0",
  months: "1",
  days: "0",
};

export function AddDateCalculator() {
  const controls = useShareableState("pribavit-k-date", addDefaults);
  const date = parseCalendarDate(controls.state.date);
  const years = parseNumber(controls.state.years, { integer: true });
  const months = parseNumber(controls.state.months, { integer: true });
  const days = parseNumber(controls.state.days, { integer: true });
  const result =
    date && years !== null && months !== null && days !== null
      ? calculateDateShift({ date, years, months, days })
      : null;
  const complete = [
    controls.state.date,
    controls.state.years,
    controls.state.months,
    controls.state.days,
  ].every((value) => value.trim() !== "");
  return (
    <CalculatorFrame
      result={
        result ? (
          <>
            <ResultValue
              primary
              label="Новая дата"
              value={formatDate(result.date)}
            />
            <ResultValue
              label="Сдвиг в календарных днях"
              value={formatNumber(result.signedCalendarDaysFromStart, 0)}
            />
            <ResultValue
              label="ISO"
              value={formatCalendarDate(result.date) ?? "—"}
            />
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result ? `Результат расчёта: ${formatDate(result.date)}` : null
      }
      error={
        complete && !result
          ? "Дата или сдвиг вне поддерживаемого диапазона. Используйте целые годы, месяцы и дни."
          : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <div className="sm:col-span-2">
        <Field
          label="Исходная дата"
          type="date"
          min="1900-01-01"
          max="2100-12-31"
          value={controls.state.date}
          onChange={(v) => controls.setField("date", v)}
        />
        <button
          type="button"
          onClick={() => controls.setField("date", localCalendarDate())}
          className="mt-2 min-h-11 rounded-xl px-3 text-sm font-bold text-teal hover:bg-mint"
        >
          Подставить сегодня
        </button>
      </div>
      <Field
        label="Годы"
        value={controls.state.years}
        onChange={(v) => controls.setField("years", v)}
        hint="Можно указать отрицательное число"
      />
      <Field
        label="Месяцы"
        value={controls.state.months}
        onChange={(v) => controls.setField("months", v)}
        hint="Применяются после лет"
      />
      <div className="sm:col-span-2">
        <Field
          label="Дни"
          value={controls.state.days}
          onChange={(v) => controls.setField("days", v)}
          hint="Применяются последними"
        />
      </div>
    </CalculatorFrame>
  );
}
