"use client";

import { calculateConcrete } from "@/calculations/construction";
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
import { type BuildingState, fieldsComplete, length } from "./helpers";

const concreteDefaults: BuildingState = {
  shape: "rectangular",
  length: "8",
  width: "0,4",
  height: "0,6",
  diameter: "0,4",
  count: "1",
  reserve: "10",
};

export function ConcreteCalculator() {
  const controls = useShareableState("beton", concreteDefaults, {
    shape: ["rectangular", "cylinder"],
  });
  const height = length(controls.state.height, "m");
  const count = parseNumber(controls.state.count, { integer: true });
  const reservePercent = parseNumber(controls.state.reserve);
  let result = null;
  if (height && count !== null && reservePercent !== null) {
    if (controls.state.shape === "rectangular") {
      const shapeLength = length(controls.state.length, "m");
      const width = length(controls.state.width, "m");
      if (shapeLength && width)
        result = calculateConcrete({
          shape: "rectangular",
          length: shapeLength,
          width,
          height,
          count,
          reservePercent,
        });
    } else {
      const diameter = length(controls.state.diameter, "m");
      if (diameter)
        result = calculateConcrete({
          shape: "cylinder",
          diameter,
          height,
          count,
          reservePercent,
        });
    }
  }
  const complete = fieldsComplete(
    controls.state,
    controls.state.shape === "rectangular"
      ? ["length", "width", "height", "count", "reserve"]
      : ["diameter", "height", "count", "reserve"],
  );
  return (
    <CalculatorFrame
      result={
        result ? (
          <>
            <ResultValue
              primary
              label="Заказать бетона"
              value={`${formatNumber(result.volumeWithReserveM3, 3)} м³`}
            />
            <ResultValue
              label="Чистый объём"
              value={`${formatNumber(result.theoreticalVolumeM3, 3)} м³`}
            />
            <ResultValue
              label="Запас"
              value={`${formatNumber(result.reserveVolumeM3, 3)} м³`}
            />
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result
          ? `Результат расчёта: заказать ${formatNumber(result.volumeWithReserveM3, 3)} кубических метра бетона`
          : null
      }
      error={
        complete && !result
          ? "Все размеры и количество должны быть больше нуля, запас — от 0 до 100%."
          : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <div className="sm:col-span-2">
        <SelectField
          label="Форма конструкции"
          value={controls.state.shape}
          onChange={(v) => controls.setField("shape", v)}
          options={[
            { value: "rectangular", label: "Прямоугольная" },
            { value: "cylinder", label: "Цилиндрическая" },
          ]}
        />
      </div>
      {controls.state.shape === "rectangular" ? (
        <>
          <Field
            label="Длина"
            value={controls.state.length}
            onChange={(v) => controls.setField("length", v)}
            unit="м"
          />
          <Field
            label="Ширина"
            value={controls.state.width}
            onChange={(v) => controls.setField("width", v)}
            unit="м"
          />
        </>
      ) : (
        <div className="sm:col-span-2">
          <Field
            label="Диаметр"
            value={controls.state.diameter}
            onChange={(v) => controls.setField("diameter", v)}
            unit="м"
          />
        </div>
      )}
      <Field
        label="Высота / глубина"
        value={controls.state.height}
        onChange={(v) => controls.setField("height", v)}
        unit="м"
      />
      <Field
        label="Количество"
        value={controls.state.count}
        onChange={(v) => controls.setField("count", v)}
        unit="шт."
      />
      <div className="sm:col-span-2">
        <Field
          label="Запас"
          value={controls.state.reserve}
          onChange={(v) => controls.setField("reserve", v)}
          unit="%"
          hint="Обычно 5–10% на потери и неровности"
        />
      </div>
    </CalculatorFrame>
  );
}
