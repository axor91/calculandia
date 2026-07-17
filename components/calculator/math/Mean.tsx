"use client";

import { calculateMean, calculateWeightedMean } from "@/calculations/math/mean";
import {
  CalculatorFrame,
  EmptyResult,
  formatNumber,
  ResultValue,
  SelectField,
  useShareableState,
} from "../shared";
import { ListField, parseNumberList } from "./helpers";

type MeanState = { mode: string; values: string; weights: string };
const meanDefaults: MeanState = {
  mode: "simple",
  values: "2, 4, 9",
  weights: "1, 3",
};

export function MeanCalculator() {
  const controls = useShareableState("srednee-znachenie", meanDefaults, {
    mode: ["simple", "weighted"],
  });
  const isWeighted = controls.state.mode === "weighted";
  const values = parseNumberList(controls.state.values);
  const weights = isWeighted ? parseNumberList(controls.state.weights) : null;
  const simpleResult = !isWeighted && values ? calculateMean(values) : null;
  const weightedResult =
    isWeighted && values && weights
      ? calculateWeightedMean(values, weights)
      : null;
  const result = isWeighted ? weightedResult : simpleResult;
  const parseError =
    (controls.state.values.trim() !== "" && values === null) ||
    (isWeighted && controls.state.weights.trim() !== "" && weights === null);

  return (
    <CalculatorFrame
      result={
        simpleResult?.ok ? (
          <>
            <ResultValue
              primary
              label="Среднее"
              value={formatNumber(simpleResult.value.mean, 6)}
            />
            <ResultValue
              label="Количество значений"
              value={formatNumber(simpleResult.value.count, 0)}
            />
            <ResultValue
              label="Сумма"
              value={formatNumber(simpleResult.value.sum, 6)}
            />
          </>
        ) : weightedResult?.ok ? (
          <>
            <ResultValue
              primary
              label="Взвешенное среднее"
              value={formatNumber(weightedResult.value.mean, 6)}
            />
            <ResultValue
              label="Сумма весов"
              value={formatNumber(weightedResult.value.weightSum, 6)}
            />
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result?.ok
          ? `Результат расчёта: среднее ${formatNumber(result.value.mean, 6)}`
          : null
      }
      error={
        parseError
          ? "Введите числа через запятую, пробел или с новой строки; можно использовать точку или запятую как разделитель дробной части."
          : result && !result.ok
            ? isWeighted
              ? "Нужно от 2 до 200 значений, весов ровно столько же, все веса неотрицательны, а их сумма больше нуля."
              : "Нужно от 2 до 200 конечных значений."
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
          onChange={(value) => controls.setField("mode", value)}
          options={[
            { value: "simple", label: "Простое среднее" },
            { value: "weighted", label: "Взвешенное среднее" },
          ]}
        />
      </div>
      <div className="sm:col-span-2">
        <ListField
          label="Значения"
          value={controls.state.values}
          onChange={(value) => controls.setField("values", value)}
          hint="От 2 до 200 чисел через запятую, пробел или с новой строки."
        />
      </div>
      {isWeighted ? (
        <div className="sm:col-span-2">
          <ListField
            label="Веса"
            value={controls.state.weights}
            onChange={(value) => controls.setField("weights", value)}
            hint="Столько же чисел, сколько значений; вес не может быть отрицательным, а их сумма — нулевой."
          />
        </div>
      ) : null}
    </CalculatorFrame>
  );
}
