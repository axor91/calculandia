"use client";

import { calculateWallpaper } from "@/calculations/construction";
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

const wallpaperDefaults: BuildingState = {
  roomLength: "5",
  roomWidth: "4",
  wallHeight: "2,7",
  rollWidth: "106",
  rollLength: "10",
  repeat: "64",
  allowance: "5",
  reserve: "10",
  openingWidth: "",
  openingHeight: "",
  openingCount: "1",
};

export function WallpaperCalculator() {
  const controls = useShareableState("oboi", wallpaperDefaults);
  const roomLength = length(controls.state.roomLength, "m");
  const roomWidth = length(controls.state.roomWidth, "m");
  const wallHeight = length(controls.state.wallHeight, "m");
  const rollWidth = length(controls.state.rollWidth, "cm");
  const rollLength = length(controls.state.rollLength, "m");
  const patternRepeat = length(controls.state.repeat, "cm");
  const trimAllowance = length(controls.state.allowance, "cm");
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
    rollWidth &&
    rollLength &&
    patternRepeat &&
    trimAllowance &&
    reservePercent !== null &&
    openings
      ? calculateWallpaper({
          room: { length: roomLength, width: roomWidth, wallHeight },
          roll: { width: rollWidth, length: rollLength },
          patternRepeat,
          trimAllowance,
          openings,
          reservePercent,
        })
      : null;
  const complete = fieldsComplete(controls.state, [
    "roomLength",
    "roomWidth",
    "wallHeight",
    "rollWidth",
    "rollLength",
    "repeat",
    "allowance",
    "reserve",
  ]);
  return (
    <CalculatorFrame
      result={
        result ? (
          <>
            <ResultValue
              primary
              label="Купить рулонов"
              value={`${result.rollsToBuy} шт.`}
            />
            <ResultValue
              label="Полотен с запасом"
              value={`${result.stripsWithReserve} шт.`}
            />
            <ResultValue
              label="Расчётно без запаса"
              value={`${formatNumber(result.theoreticalStrips, 2)} полотен`}
            />
            <ResultValue
              label="Полезная площадь без запаса"
              value={`${formatNumber(result.theoreticalAreaM2, 2)} м²`}
            />
            <ResultValue
              label="Полотен из рулона"
              value={`${result.stripsPerRoll} шт.`}
            />
            <ResultValue
              label="Длина полотна с раппортом"
              value={`${formatNumber(result.cutLengthM, 2)} м`}
            />
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result
          ? `Результат расчёта: купить ${result.rollsToBuy} рулонов обоев`
          : null
      }
      error={
        complete && !result
          ? "Проверьте размеры: рулона должно хватать хотя бы на одно полотно, а площадь проёмов должна быть меньше площади стен."
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
        label="Ширина рулона"
        value={controls.state.rollWidth}
        onChange={(v) => controls.setField("rollWidth", v)}
        unit="см"
      />
      <Field
        label="Длина рулона"
        value={controls.state.rollLength}
        onChange={(v) => controls.setField("rollLength", v)}
        unit="м"
      />
      <Field
        label="Раппорт рисунка"
        value={controls.state.repeat}
        onChange={(v) => controls.setField("repeat", v)}
        unit="см"
        hint="Для обоев без подгонки укажите 0; смещённый рисунок проверьте по этикетке"
      />
      <Field
        label="Монтажный припуск на полосу"
        value={controls.state.allowance}
        onChange={(v) => controls.setField("allowance", v)}
        unit="см"
        hint="Суммарно сверху и снизу; обычно 5–10 см"
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
