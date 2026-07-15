"use client";

import {
  calculateAge,
  calculateDateShift,
  calculateDaysBetween,
  formatCalendarDate,
  parseCalendarDate,
  type CalendarDate,
} from "@/calculations/date";
import {
  CalculatorFrame,
  CheckboxField,
  EmptyResult,
  Field,
  formatNumber,
  ResultValue,
  parseNumber,
  useShareableState,
} from "./shared";
import { localCalendarDate } from "./state";

function formatDate(date: CalendarDate | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(date.year, date.month - 1, date.day)));
}

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

type AgeState = { birth: string; asOf: string };
const ageDefaults: AgeState = { birth: "1990-05-20", asOf: "2025-05-20" };

export function AgeCalculator() {
  const controls = useShareableState("vozrast", ageDefaults);
  const birthDate = parseCalendarDate(controls.state.birth);
  const asOf = parseCalendarDate(controls.state.asOf);
  const result = birthDate && asOf ? calculateAge({ birthDate, asOf }) : null;
  const complete = Boolean(controls.state.birth && controls.state.asOf);
  return (
    <CalculatorFrame
      result={
        result ? (
          <>
            <ResultValue
              primary
              label="Полный возраст"
              value={`${result.years} лет`}
            />
            <ResultValue
              label="Точно"
              value={`${result.years} лет, ${result.months} мес., ${result.days} дн.`}
            />
            <ResultValue
              label="Следующий день рождения"
              value={formatDate(result.nextBirthday)}
            />
            {result.daysUntilNextBirthday !== null ? (
              <ResultValue
                label="До него"
                value={`${result.daysUntilNextBirthday} дн.`}
              />
            ) : null}
            {birthDate?.month === 2 && birthDate.day === 29 ? (
              <ResultValue
                label="29 февраля в невисокосный год"
                value="Считается 28 февраля"
              />
            ) : null}
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result ? `Результат расчёта: полный возраст ${result.years} лет` : null
      }
      error={
        complete && !result
          ? "Дата рождения должна быть не позже даты расчёта; интервал — не более 200 лет."
          : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <Field
        label="Дата рождения"
        type="date"
        min="1900-01-01"
        max="2100-12-31"
        value={controls.state.birth}
        onChange={(v) => controls.setField("birth", v)}
      />
      <Field
        label="Возраст на дату"
        type="date"
        min="1900-01-01"
        max="2100-12-31"
        value={controls.state.asOf}
        onChange={(v) => controls.setField("asOf", v)}
      />
      <div className="sm:col-span-2">
        <button
          type="button"
          onClick={() => controls.setField("asOf", localCalendarDate())}
          className="min-h-11 rounded-xl px-3 text-sm font-bold text-teal hover:bg-mint"
        >
          Рассчитать на сегодня
        </button>
      </div>
    </CalculatorFrame>
  );
}
