"use client";

import {
  calculateConcrete,
  calculateTile,
  calculateWallpaper,
  type Length,
  type Opening,
} from "@/calculations/construction";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  formatNumber,
  ResultValue,
  SelectField,
  parseNumber,
  useShareableState,
} from "./shared";

type BuildingState = Record<string, string>;

function fieldsComplete(state: BuildingState, keys: readonly string[]) {
  return keys.every((key) => state[key]?.trim() !== "");
}

function length(value: string, unit: Length["unit"]): Length | null {
  const parsed = parseNumber(value);
  return parsed === null ? null : { value: parsed, unit };
}

function optionalOpening(
  width: string,
  height: string,
  count: string,
): Opening[] | null {
  if (!width.trim() && !height.trim()) return [];
  const parsedWidth = length(width, "m");
  const parsedHeight = length(height, "m");
  const parsedCount = parseNumber(count, { integer: true });
  return parsedWidth && parsedHeight && parsedCount !== null
    ? [{ width: parsedWidth, height: parsedHeight, count: parsedCount }]
    : null;
}

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
