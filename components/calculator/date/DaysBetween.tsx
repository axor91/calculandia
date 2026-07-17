"use client";

import { calculateDaysBetween, parseCalendarDate } from "@/calculations/date";
import {
  CalculatorFrame,
  CheckboxField,
  EmptyResult,
  Field,
  formatNumber,
  ResultValue,
  useShareableState,
} from "../shared";

type DaysState = { start: string; end: string; includeEnd: boolean };
const daysDefaults: DaysState = {
  start: "2026-07-01",
  end: "2026-07-15",
  includeEnd: false,
};

export function DaysBetweenCalculator() {
  const controls = useShareableState("dni-mezhdu-datami", daysDefaults);
  const start = parseCalendarDate(controls.state.start);
  const end = parseCalendarDate(controls.state.end);
  const result =
    start && end
      ? calculateDaysBetween({
          start,
          end,
          includeEnd: controls.state.includeEnd,
        })
      : null;
  const complete = Boolean(controls.state.start && controls.state.end);
  const direction = result?.direction === "backward" ? " назад" : "";
  return (
    <CalculatorFrame
      result={
        result ? (
          <>
            <ResultValue
              primary
              label="Между датами"
              value={`${formatNumber(result.absoluteDays, 0)} дн.${direction}`}
            />
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
      resultAnnouncement={
        result
          ? `Результат расчёта: ${formatNumber(result.absoluteDays, 0)} дней${direction}`
          : null
      }
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
        label="Начальная дата"
        type="date"
        min="1900-01-01"
        max="2100-12-31"
        value={controls.state.start}
        onChange={(v) => controls.setField("start", v)}
      />
      <Field
        label="Конечная дата"
        type="date"
        min="1900-01-01"
        max="2100-12-31"
        value={controls.state.end}
        onChange={(v) => controls.setField("end", v)}
      />
      <div className="sm:col-span-2">
        <CheckboxField
          label="Включить конечный день"
          checked={controls.state.includeEnd}
          onChange={(v) => controls.setField("includeEnd", v)}
          hint="Например, с 1 по 1 июля включительно — один день"
        />
      </div>
    </CalculatorFrame>
  );
}
