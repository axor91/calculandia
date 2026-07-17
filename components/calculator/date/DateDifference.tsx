"use client";

import {
  calculateDateDifference,
  parseCalendarDate,
} from "@/calculations/date";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  formatNumber,
  ResultValue,
  useShareableState,
} from "../shared";

type DateDifferenceState = { first: string; second: string };
const dateDifferenceDefaults: DateDifferenceState = {
  first: "2020-01-15",
  second: "2023-03-10",
};

export function DateDifferenceCalculator() {
  const controls = useShareableState("raznica-dat", dateDifferenceDefaults);
  const first = parseCalendarDate(controls.state.first);
  const second = parseCalendarDate(controls.state.second);
  const result =
    first && second ? calculateDateDifference({ first, second }) : null;
  const complete = Boolean(controls.state.first && controls.state.second);
  return (
    <CalculatorFrame
      result={
        result ? (
          <>
            <ResultValue
              primary
              label="Разница"
              value={`${result.years} г. ${result.months} мес. ${result.days} дн.`}
            />
            <ResultValue
              label="Всего дней"
              value={formatNumber(result.absoluteDays, 0)}
            />
            <ResultValue
              label="Порядок дат"
              value={
                result.reversed ? "Введены в обратном порядке" : "По порядку"
              }
            />
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result
          ? `Результат расчёта: ${result.years} лет ${result.months} месяцев ${result.days} дней`
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
        label="Первая дата"
        type="date"
        min="1900-01-01"
        max="2100-12-31"
        value={controls.state.first}
        onChange={(v) => controls.setField("first", v)}
      />
      <Field
        label="Вторая дата"
        type="date"
        min="1900-01-01"
        max="2100-12-31"
        value={controls.state.second}
        onChange={(v) => controls.setField("second", v)}
      />
    </CalculatorFrame>
  );
}
