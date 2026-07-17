"use client";

import {
  calculateTimeArithmetic,
  calculateTimeIntervalSum,
  type TimeDuration,
} from "@/calculations/date";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  ResultValue,
  SelectField,
  TextareaField,
  useShareableState,
} from "../shared";

type TimeCalculatorState = {
  mode: string;
  firstTime: string;
  operation: string;
  secondTime: string;
  intervals: string;
};
const timeCalculatorDefaults: TimeCalculatorState = {
  mode: "arithmetic",
  firstTime: "2:45",
  operation: "add",
  secondTime: "1:30",
  intervals: "0:45\n0:45\n0:45\n0:45\n0:45\n0:45\n0:45\n0:45",
};

function parseTimeText(value: string): TimeDuration | null {
  const match = /^(\d{1,4}):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  if (hours > 9999) return null;
  return { hours, minutes: Number(match[2]) };
}

function formatSignedClock(result: {
  sign: -1 | 0 | 1;
  days: number;
  hours: number;
  minutes: number;
}) {
  const sign = result.sign < 0 ? "-" : "";
  const clock = `${result.hours}:${String(result.minutes).padStart(2, "0")}`;
  return result.days > 0
    ? `${sign}${result.days} дн. ${clock}`
    : `${sign}${clock}`;
}

export function TimeCalculator() {
  const controls = useShareableState(
    "kalkulyator-vremeni",
    timeCalculatorDefaults,
    { mode: ["arithmetic", "sum"], operation: ["add", "subtract"] },
  );
  const isSum = controls.state.mode === "sum";

  const firstDuration = parseTimeText(controls.state.firstTime);
  const secondDuration = parseTimeText(controls.state.secondTime);
  const arithmeticResult =
    firstDuration && secondDuration
      ? calculateTimeArithmetic({
          first: firstDuration,
          second: secondDuration,
          operation:
            controls.state.operation === "subtract" ? "subtract" : "add",
        })
      : null;

  const intervalLines = controls.state.intervals
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const parsedIntervals = intervalLines.map(parseTimeText);
  const intervalsComplete =
    intervalLines.length >= 2 &&
    parsedIntervals.every(
      (duration): duration is TimeDuration => duration !== null,
    );
  const sumResult = intervalsComplete
    ? calculateTimeIntervalSum({ intervals: parsedIntervals as TimeDuration[] })
    : null;

  const result = isSum ? sumResult : arithmeticResult;
  const complete = isSum
    ? intervalLines.length > 0
    : Boolean(controls.state.firstTime && controls.state.secondTime);

  return (
    <CalculatorFrame
      result={
        result ? (
          <ResultValue primary label="Итог" value={formatSignedClock(result)} />
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result ? `Результат расчёта: ${formatSignedClock(result)}` : null
      }
      error={
        complete && !result
          ? "Используйте формат чч:мм (часы 0–9999, минуты 0–59). Для суммы нужно от 2 до 20 строк."
          : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <div className="sm:col-span-2">
        <SelectField
          label="Режим"
          value={controls.state.mode}
          onChange={(v) => controls.setField("mode", v)}
          options={[
            { value: "arithmetic", label: "Сложить/вычесть два времени" },
            { value: "sum", label: "Сумма списка интервалов" },
          ]}
        />
      </div>
      {isSum ? (
        <div className="sm:col-span-2">
          <TextareaField
            label="Интервалы (чч:мм, по одному на строку)"
            value={controls.state.intervals}
            onChange={(v) => controls.setField("intervals", v)}
            hint="От 2 до 20 строк, только положительные значения, без часовых поясов."
            rows={6}
          />
        </div>
      ) : (
        <>
          <Field
            label="Первое время"
            value={controls.state.firstTime}
            onChange={(v) => controls.setField("firstTime", v)}
            hint="Формат чч:мм"
          />
          <SelectField
            label="Операция"
            value={controls.state.operation}
            onChange={(v) => controls.setField("operation", v)}
            options={[
              { value: "add", label: "Сложить" },
              { value: "subtract", label: "Вычесть" },
            ]}
          />
          <div className="sm:col-span-2">
            <Field
              label="Второе время"
              value={controls.state.secondTime}
              onChange={(v) => controls.setField("secondTime", v)}
              hint="Формат чч:мм"
            />
          </div>
        </>
      )}
    </CalculatorFrame>
  );
}
