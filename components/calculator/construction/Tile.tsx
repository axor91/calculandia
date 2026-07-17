"use client";

import { calculateTile } from "@/calculations/construction";
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

const tileDefaults: BuildingState = {
  surfaceWidth: "3",
  surfaceHeight: "2,7",
  surfaceCount: "1",
  tileWidth: "60",
  tileHeight: "30",
  reserve: "10",
  piecesPerBox: "8",
  openingWidth: "",
  openingHeight: "",
  openingCount: "1",
};

export function TileCalculator() {
  const controls = useShareableState("plitka", tileDefaults);
  const surfaceWidth = length(controls.state.surfaceWidth, "m");
  const surfaceHeight = length(controls.state.surfaceHeight, "m");
  const tileWidth = length(controls.state.tileWidth, "cm");
  const tileHeight = length(controls.state.tileHeight, "cm");
  const surfaceCount = parseNumber(controls.state.surfaceCount, {
    integer: true,
  });
  const reservePercent = parseNumber(controls.state.reserve);
  const piecesPerBox = parseNumber(controls.state.piecesPerBox, {
    integer: true,
  });
  const openings = optionalOpening(
    controls.state.openingWidth,
    controls.state.openingHeight,
    controls.state.openingCount,
  );
  const result =
    surfaceWidth &&
    surfaceHeight &&
    tileWidth &&
    tileHeight &&
    surfaceCount !== null &&
    reservePercent !== null &&
    piecesPerBox !== null &&
    openings
      ? calculateTile({
          surface: {
            width: surfaceWidth,
            height: surfaceHeight,
            count: surfaceCount,
          },
          tile: { width: tileWidth, height: tileHeight },
          openings,
          reservePercent,
          piecesPerBox,
        })
      : null;
  const complete = fieldsComplete(controls.state, [
    "surfaceWidth",
    "surfaceHeight",
    "surfaceCount",
    "tileWidth",
    "tileHeight",
    "reserve",
    "piecesPerBox",
  ]);
  return (
    <CalculatorFrame
      result={
        result ? (
          <>
            <ResultValue
              primary
              label="Купить"
              value={`${result.boxesToBuy} упак.`}
            />
            <ResultValue label="Плиток" value={`${result.piecesToBuy} шт.`} />
            <ResultValue
              label="Расчётно без запаса"
              value={`${formatNumber(result.theoreticalPieces, 2)} шт.`}
            />
            <ResultValue
              label="Полезная площадь без запаса"
              value={`${formatNumber(result.theoreticalAreaM2, 2)} м²`}
            />
            <ResultValue
              label="Площадь покупки"
              value={`${formatNumber(result.purchaseAreaM2, 2)} м²`}
            />
            <ResultValue
              label="Площадь с запасом"
              value={`${formatNumber(result.areaWithReserveM2, 2)} м²`}
            />
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result
          ? `Результат расчёта: купить ${result.boxesToBuy} упаковок плитки`
          : null
      }
      error={
        complete && !result
          ? "Проверьте размеры, количество в упаковке и проёмы: их площадь должна быть меньше площади поверхности."
          : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <fieldset className="grid gap-4 rounded-xl border border-line p-4 sm:col-span-2 sm:grid-cols-3">
        <legend className="px-2 text-sm font-extrabold">Поверхность</legend>
        <Field
          label="Ширина"
          value={controls.state.surfaceWidth}
          onChange={(v) => controls.setField("surfaceWidth", v)}
          unit="м"
        />
        <Field
          label="Высота"
          value={controls.state.surfaceHeight}
          onChange={(v) => controls.setField("surfaceHeight", v)}
          unit="м"
        />
        <Field
          label="Количество"
          value={controls.state.surfaceCount}
          onChange={(v) => controls.setField("surfaceCount", v)}
          unit="шт."
        />
      </fieldset>
      <Field
        label="Ширина плитки"
        value={controls.state.tileWidth}
        onChange={(v) => controls.setField("tileWidth", v)}
        unit="см"
      />
      <Field
        label="Высота плитки"
        value={controls.state.tileHeight}
        onChange={(v) => controls.setField("tileHeight", v)}
        unit="см"
      />
      <Field
        label="Плиток в упаковке"
        value={controls.state.piecesPerBox}
        onChange={(v) => controls.setField("piecesPerBox", v)}
        unit="шт."
      />
      <Field
        label="Запас"
        value={controls.state.reserve}
        onChange={(v) => controls.setField("reserve", v)}
        unit="%"
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
