"use client";

import { calculatePaint } from "@/calculations/construction";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  formatNumber,
  ResultValue,
  parseNumber,
  useShareableState,
} from "../shared";
import {
  type BuildingState,
  fieldsComplete,
  length,
  optionalOpening,
} from "./helpers";

const paintDefaults: BuildingState = {
  roomLength: "5",
  roomWidth: "4",
  wallHeight: "2,7",
  coverage: "0,1",
  layers: "2",
  canVolume: "2,5",
  reserve: "5",
  openingWidth: "0,9",
  openingHeight: "2,1",
  openingCount: "1",
};

export function PaintCalculator() {
  const controls = useShareableState("kraska", paintDefaults);
  const roomLength = length(controls.state.roomLength, "m");
  const roomWidth = length(controls.state.roomWidth, "m");
  const wallHeight = length(controls.state.wallHeight, "m");
  const coveragePerLayerLPerM2 = parseNumber(controls.state.coverage);
  const layers = parseNumber(controls.state.layers, { integer: true });
  const canVolumeL = parseNumber(controls.state.canVolume);
  const reservePercent = parseNumber(controls.state.reserve);
  const openings = optionalOpening(
    controls.state.openingWidth,
    controls.state.openingHeight,
    controls.state.openingCount,
  );
  const result =
    roomLength &&
    roomWidth &&
    wallHeight &&
    coveragePerLayerLPerM2 !== null &&
    layers !== null &&
    canVolumeL !== null &&
    reservePercent !== null &&
    openings
      ? calculatePaint({
          room: { length: roomLength, width: roomWidth, wallHeight },
          openings,
          coveragePerLayerLPerM2,
          layers,
          canVolumeL,
          reservePercent,
        })
      : null;
  const complete = fieldsComplete(controls.state, [
    "roomLength",
    "roomWidth",
    "wallHeight",
    "coverage",
    "layers",
    "canVolume",
    "reserve",
  ]);
  return (
    <CalculatorFrame
      result={
        result ? (
          <>
            <ResultValue
              primary
              label="Купить банок"
              value={`${result.cansToBuy} шт.`}
            />
            <ResultValue
              label="Литров с запасом"
              value={`${formatNumber(result.litresWithReserve, 2)} л`}
            />
            <ResultValue
              label="Расчётно без запаса"
              value={`${formatNumber(result.theoreticalLitres, 2)} л`}
            />
            <ResultValue
              label="Площадь окраски"
              value={`${formatNumber(result.theoreticalAreaM2, 2)} м²`}
            />
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result
          ? `Результат расчёта: купить ${result.cansToBuy} банок краски`
          : null
      }
      error={
        complete && !result
          ? "Проверьте размеры комнаты, расход, число слоёв, объём банки и проёмы: их площадь должна быть меньше площади стен."
          : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <fieldset className="grid gap-4 rounded-xl border border-line p-4 sm:col-span-2 sm:grid-cols-3">
        <legend className="px-2 text-sm font-extrabold">Комната</legend>
        <Field
          label="Длина"
          value={controls.state.roomLength}
          onChange={(v) => controls.setField("roomLength", v)}
          unit="м"
        />
        <Field
          label="Ширина"
          value={controls.state.roomWidth}
          onChange={(v) => controls.setField("roomWidth", v)}
          unit="м"
        />
        <Field
          label="Высота стен"
          value={controls.state.wallHeight}
          onChange={(v) => controls.setField("wallHeight", v)}
          unit="м"
        />
      </fieldset>
      <Field
        label="Расход на один слой"
        value={controls.state.coverage}
        onChange={(v) => controls.setField("coverage", v)}
        unit="л/м²"
        hint="Смотрите на банке краски, обычно 0,1–0,2 л/м²"
      />
      <Field
        label="Число слоёв"
        value={controls.state.layers}
        onChange={(v) => controls.setField("layers", v)}
        unit="шт."
      />
      <Field
        label="Объём банки"
        value={controls.state.canVolume}
        onChange={(v) => controls.setField("canVolume", v)}
        unit="л"
      />
      <Field
        label="Запас"
        value={controls.state.reserve}
        onChange={(v) => controls.setField("reserve", v)}
        unit="%"
      />
      <fieldset className="grid gap-4 rounded-xl border border-line p-4 sm:col-span-2 sm:grid-cols-3">
        <legend className="px-2 text-sm font-extrabold">
          Окна и двери, необязательно
        </legend>
        <Field
          label="Ширина одного проёма"
          value={controls.state.openingWidth}
          onChange={(v) => controls.setField("openingWidth", v)}
          unit="м"
        />
        <Field
          label="Высота одного проёма"
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
