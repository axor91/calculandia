"use client";

import { calculateLaminate } from "@/calculations/construction";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  formatNumber,
  ResultValue,
  parseNumber,
  useShareableState,
} from "../shared";
import { type BuildingState, fieldsComplete, length } from "./helpers";

const laminateDefaults: BuildingState = {
  roomLength: "5",
  roomWidth: "4",
  packArea: "2,131",
  reserve: "5",
};

export function LaminateCalculator() {
  const controls = useShareableState("laminat", laminateDefaults);
  const roomLength = length(controls.state.roomLength, "m");
  const roomWidth = length(controls.state.roomWidth, "m");
  const packAreaM2 = parseNumber(controls.state.packArea);
  const reservePercent = parseNumber(controls.state.reserve);
  const result =
    roomLength && roomWidth && packAreaM2 !== null && reservePercent !== null
      ? calculateLaminate({
          room: { length: roomLength, width: roomWidth },
          packAreaM2,
          reservePercent,
        })
      : null;
  const complete = fieldsComplete(controls.state, [
    "roomLength",
    "roomWidth",
    "packArea",
    "reserve",
  ]);
  return (
    <CalculatorFrame
      result={
        result ? (
          <>
            <ResultValue
              primary
              label="Купить упаковок"
              value={`${result.packsToBuy} шт.`}
            />
            <ResultValue
              label="Площадь с запасом"
              value={`${formatNumber(result.areaWithReserveM2, 2)} м²`}
            />
            <ResultValue
              label="Расчётно без запаса"
              value={`${formatNumber(result.theoreticalAreaM2, 2)} м²`}
            />
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result
          ? `Результат расчёта: купить ${result.packsToBuy} упаковок ламината`
          : null
      }
      error={
        complete && !result
          ? "Проверьте размеры комнаты, площадь упаковки и запас: запас — от 0 до 100%."
          : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <Field
        label="Длина комнаты"
        value={controls.state.roomLength}
        onChange={(v) => controls.setField("roomLength", v)}
        unit="м"
      />
      <Field
        label="Ширина комнаты"
        value={controls.state.roomWidth}
        onChange={(v) => controls.setField("roomWidth", v)}
        unit="м"
      />
      <Field
        label="Площадь с упаковки"
        value={controls.state.packArea}
        onChange={(v) => controls.setField("packArea", v)}
        unit="м²"
        hint="Указана на пачке ламината"
      />
      <Field
        label="Запас"
        value={controls.state.reserve}
        onChange={(v) => controls.setField("reserve", v)}
        unit="%"
        hint="Для укладки по диагонали берите 10%"
      />
    </CalculatorFrame>
  );
}
