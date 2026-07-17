"use client";

import { calculateWeekday, parseCalendarDate } from "@/calculations/date";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  ResultValue,
  useShareableState,
} from "../shared";
import { localCalendarDate } from "../state";

type WeekdayState = { date: string };
const weekdayDefaults: WeekdayState = { date: "2026-07-16" };

export function WeekdayCalculator() {
  const controls = useShareableState("den-nedeli", weekdayDefaults);
  const date = parseCalendarDate(controls.state.date);
  const result = date ? calculateWeekday(date) : null;
  const complete = Boolean(controls.state.date);
  const name = result
    ? result.name[0].toUpperCase() + result.name.slice(1)
    : "";
  return (
    <CalculatorFrame
      result={
        result ? (
          <>
            <ResultValue primary label="День недели" value={name} />
            <ResultValue
              label="Номер дня (пн = 1)"
              value={String(result.weekdayIndex)}
            />
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={result ? `Результат расчёта: ${name}` : null}
      error={
        complete && !result
          ? "Введите корректную дату с 1900 по 2100 год."
          : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <div className="sm:col-span-2">
        <Field
          label="Дата"
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
    </CalculatorFrame>
  );
}
