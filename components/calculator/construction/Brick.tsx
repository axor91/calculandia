"use client";

import { calculateBrick, type BrickFormat } from "@/calculations/construction";
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
import {
  type BuildingState,
  fieldsComplete,
  length,
  optionalOpening,
} from "./helpers";

const brickFormatOptions: readonly { value: BrickFormat; label: string }[] = [
  { value: "single", label: "Одинарный (1НФ, 250×120×65)" },
  { value: "oneAndHalf", label: "Полуторный (1,4НФ, 250×120×88)" },
  { value: "double", label: "Двойной (2,1НФ, 250×120×138)" },
];

const brickThicknessOptions = [
  { value: "0.12", label: "0,5 кирпича (12 см)" },
  { value: "0.25", label: "1 кирпич (25 см)" },
  { value: "0.38", label: "1,5 кирпича (38 см)" },
  { value: "0.51", label: "2 кирпича (51 см)" },
];

const brickDefaults: BuildingState = {
  wallLength: "5",
  wallHeight: "3",
  thickness: "0.25",
  format: "single",
  joint: "10",
  reserve: "5",
  openingWidth: "",
  openingHeight: "",
  openingCount: "1",
};

export function BrickCalculator() {
  const controls = useShareableState("kirpich", brickDefaults, {
    thickness: brickThicknessOptions.map((option) => option.value),
    format: brickFormatOptions.map((option) => option.value),
  });
  const wallLength = length(controls.state.wallLength, "m");
  const wallHeight = length(controls.state.wallHeight, "m");
  const wallThicknessM = parseNumber(controls.state.thickness);
  const jointMm = parseNumber(controls.state.joint);
  const reservePercent = parseNumber(controls.state.reserve);
  const openings = optionalOpening(
    controls.state.openingWidth,
    controls.state.openingHeight,
    controls.state.openingCount,
  );
  const result =
    wallLength &&
    wallHeight &&
    wallThicknessM !== null &&
    jointMm !== null &&
    reservePercent !== null &&
    openings
      ? calculateBrick({
          wall: { length: wallLength, height: wallHeight },
          openings,
          wallThicknessM,
          format: controls.state.format as BrickFormat,
          jointMm,
          reservePercent,
        })
      : null;
  const complete = fieldsComplete(controls.state, [
    "wallLength",
    "wallHeight",
    "thickness",
    "format",
    "joint",
    "reserve",
  ]);
  return (
    <CalculatorFrame
      result={
        result ? (
          <>
            <ResultValue
              primary
              label="Купить кирпича"
              value={`${result.bricksWithReserve} шт.`}
            />
            <ResultValue
              label="Расчётно без запаса"
              value={`${result.theoreticalBricks} шт.`}
            />
            <ResultValue
              label="Объём кладки"
              value={`${formatNumber(result.masonryVolumeM3, 3)} м³`}
            />
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result
          ? `Результат расчёта: купить ${result.bricksWithReserve} кирпичей`
          : null
      }
      error={
        complete && !result
          ? "Проверьте размеры стены, шов (5–15 мм) и проёмы: их площадь должна быть меньше площади стены."
          : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <Field
        label="Длина стены"
        value={controls.state.wallLength}
        onChange={(v) => controls.setField("wallLength", v)}
        unit="м"
      />
      <Field
        label="Высота стены"
        value={controls.state.wallHeight}
        onChange={(v) => controls.setField("wallHeight", v)}
        unit="м"
      />
      <SelectField
        label="Толщина кладки"
        value={controls.state.thickness}
        onChange={(v) => controls.setField("thickness", v)}
        options={brickThicknessOptions}
      />
      <SelectField
        label="Формат кирпича"
        value={controls.state.format}
        onChange={(v) => controls.setField("format", v)}
        options={brickFormatOptions}
      />
      <Field
        label="Толщина шва"
        value={controls.state.joint}
        onChange={(v) => controls.setField("joint", v)}
        unit="мм"
        hint="Обычно 10 мм, диапазон 5–15 мм"
      />
      <Field
        label="Запас"
        value={controls.state.reserve}
        onChange={(v) => controls.setField("reserve", v)}
        unit="%"
        hint="На бой и подрезку, обычно 5%"
      />
      <fieldset className="grid gap-4 rounded-xl border border-line p-4 sm:col-span-2 sm:grid-cols-3">
        <legend className="px-2 text-sm font-extrabold">
          Проём, необязательно
        </legend>
        <Field
          label="Ширина"
          value={controls.state.openingWidth}
          onChange={(v) => controls.setField("openingWidth", v)}
          unit="м"
        />
        <Field
          label="Высота"
          value={controls.state.openingHeight}
          onChange={(v) => controls.setField("openingHeight", v)}
          unit="м"
        />
        <Field
          label="Количество"
          value={controls.state.openingCount}
          onChange={(v) => controls.setField("openingCount", v)}
          unit="шт."
        />
      </fieldset>
    </CalculatorFrame>
  );
}
