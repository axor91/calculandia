"use client";

import {
  calculatePercentage,
  type PercentCalculation,
} from "@/calculations/math/percent-of-number";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  formatNumber,
  ResultValue,
  SelectField,
  parseNumber,
  useShareableState,
} from "../shared";

type PercentState = { mode: string; first: string; second: string };
const percentDefaults: PercentState = {
  mode: "percent-of-number",
  first: "15",
  second: "2400",
};

export function PercentOfNumberCalculator() {
  const controls = useShareableState("procent-ot-chisla", percentDefaults, {
    mode: ["percent-of-number", "part-as-percent", "whole-from-part"],
  });
  const first = parseNumber(controls.state.first);
  const second = parseNumber(controls.state.second);
  let input: PercentCalculation | null = null;
  if (first !== null && second !== null) {
    if (controls.state.mode === "percent-of-number") {
      input = { mode: "percent-of-number", percent: first, number: second };
    } else if (controls.state.mode === "part-as-percent") {
      input = { mode: "part-as-percent", part: first, whole: second };
    } else {
      input = { mode: "whole-from-part", part: first, percent: second };
    }
  }
  const result = input ? calculatePercentage(input) : null;
  const parseError =
    (controls.state.first.trim() !== "" && first === null) ||
    (controls.state.second.trim() !== "" && second === null);
  const substitution =
    input?.mode === "percent-of-number"
      ? `${formatNumber(input.number, 8)} × ${formatNumber(input.percent, 8)} / 100`
      : input?.mode === "part-as-percent"
        ? `${formatNumber(input.part, 8)} / ${formatNumber(input.whole, 8)} × 100`
        : input?.mode === "whole-from-part"
          ? `${formatNumber(input.part, 8)} × 100 / ${formatNumber(input.percent, 8)}`
          : null;
  const labels =
    controls.state.mode === "percent-of-number"
      ? ["Процент", "Число"]
      : controls.state.mode === "part-as-percent"
        ? ["Часть", "Целое"]
        : ["Часть", "Процент"];

  return (
    <CalculatorFrame
      result={
        result?.ok ? (
          <>
            <ResultValue
              primary
              label={
                controls.state.mode === "part-as-percent"
                  ? "Доля в процентах"
                  : "Ответ"
              }
              value={`${formatNumber(result.value, 8)}${controls.state.mode === "part-as-percent" ? " %" : ""}`}
            />
            {substitution ? (
              <ResultValue label="Подстановка" value={substitution} />
            ) : null}
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result?.ok
          ? `Результат расчёта: ${formatNumber(result.value, 8)}${controls.state.mode === "part-as-percent" ? " процентов" : ""}`
          : null
      }
      error={
        parseError
          ? "Введите обычные конечные числа без экспоненты; можно использовать точку или запятую."
          : result && !result.ok
            ? "Проверьте делитель: он не может быть равен нулю."
            : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <div className="sm:col-span-2">
        <SelectField
          label="Что найти"
          value={controls.state.mode}
          onChange={(value) => controls.setField("mode", value)}
          options={[
            { value: "percent-of-number", label: "Процент от числа" },
            {
              value: "part-as-percent",
              label: "Сколько процентов составляет часть",
            },
            { value: "whole-from-part", label: "Целое по части и проценту" },
          ]}
        />
      </div>
      <Field
        label={labels[0]}
        value={controls.state.first}
        onChange={(value) => controls.setField("first", value)}
        unit={controls.state.mode === "percent-of-number" ? "%" : undefined}
      />
      <Field
        label={labels[1]}
        value={controls.state.second}
        onChange={(value) => controls.setField("second", value)}
        unit={controls.state.mode === "whole-from-part" ? "%" : undefined}
      />
    </CalculatorFrame>
  );
}
