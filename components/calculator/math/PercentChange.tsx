"use client";

import {
  calculateRelativePercentChange,
  calculateSymmetricPercentDifference,
} from "@/calculations/math/percent-change";
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

type ChangeState = { mode: string; old: string; next: string };
const changeDefaults: ChangeState = {
  mode: "relative",
  old: "800",
  next: "920",
};

export function PercentChangeCalculator() {
  const controls = useShareableState("procentnoe-izmenenie", changeDefaults, {
    mode: ["relative", "symmetric"],
  });
  const oldValue = parseNumber(controls.state.old);
  const newValue = parseNumber(controls.state.next);
  const result =
    oldValue === null || newValue === null
      ? null
      : controls.state.mode === "relative"
        ? calculateRelativePercentChange(oldValue, newValue)
        : calculateSymmetricPercentDifference(oldValue, newValue);
  const parseError =
    (controls.state.old.trim() !== "" && oldValue === null) ||
    (controls.state.next.trim() !== "" && newValue === null);
  const direction =
    result?.ok && controls.state.mode === "relative"
      ? result.value > 0
        ? "Рост"
        : result.value < 0
          ? "Снижение"
          : "Без изменения"
      : "Разница";

  return (
    <CalculatorFrame
      result={
        result?.ok ? (
          <ResultValue
            primary
            label={direction}
            value={`${formatNumber(Math.abs(result.value), 6)} %`}
          />
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result?.ok
          ? `Результат расчёта: ${direction}, ${formatNumber(Math.abs(result.value), 6)} процентов`
          : null
      }
      error={
        parseError
          ? "Введите обычные конечные числа без экспоненты; можно использовать точку или запятую."
          : result && !result.ok
            ? "Для относительного изменения исходное значение должно быть больше нуля; значения не могут быть отрицательными."
            : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <div className="sm:col-span-2">
        <SelectField
          label="Метод"
          value={controls.state.mode}
          onChange={(value) => controls.setField("mode", value)}
          options={[
            { value: "relative", label: "Относительное изменение" },
            { value: "symmetric", label: "Симметричная разница" },
          ]}
        />
      </div>
      <Field
        label={controls.state.mode === "relative" ? "Было" : "Первое значение"}
        value={controls.state.old}
        onChange={(value) => controls.setField("old", value)}
      />
      <Field
        label={controls.state.mode === "relative" ? "Стало" : "Второе значение"}
        value={controls.state.next}
        onChange={(value) => controls.setField("next", value)}
      />
    </CalculatorFrame>
  );
}
