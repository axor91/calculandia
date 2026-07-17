"use client";

import { calculateAge, parseCalendarDate } from "@/calculations/date";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  ResultValue,
  useShareableState,
} from "../shared";
import { localCalendarDate } from "../state";
import { formatDate } from "./helpers";

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
