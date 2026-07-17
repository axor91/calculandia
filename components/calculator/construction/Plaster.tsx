"use client";

import { calculatePlaster } from "@/calculations/construction";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  formatNumber,
  ResultValue,
  parseNumber,
  useShareableState,
} from "../shared";
import { type BuildingState, fieldsComplete } from "./helpers";

const plasterDefaults: BuildingState = {
  area: "20",
  thickness: "10",
  consumption: "8,5",
  packageWeight: "30",
  reserve: "5",
};

export function PlasterCalculator() {
  const controls = useShareableState("shtukaturka", plasterDefaults);
  const areaM2 = parseNumber(controls.state.area);
  const thicknessMm = parseNumber(controls.state.thickness);
  const consumptionKgPerM2At10mm = parseNumber(controls.state.consumption);
  const packageKg = parseNumber(controls.state.packageWeight);
  const reservePercent = parseNumber(controls.state.reserve);
  const result =
    areaM2 !== null &&
    thicknessMm !== null &&
    consumptionKgPerM2At10mm !== null &&
    packageKg !== null &&
    reservePercent !== null
      ? calculatePlaster({
          areaM2,
          thicknessMm,
          consumptionKgPerM2At10mm,
          packageKg,
          reservePercent,
        })
      : null;
  const complete = fieldsComplete(controls.state, [
    "area",
    "thickness",
    "consumption",
    "packageWeight",
    "reserve",
  ]);
  return (
    <CalculatorFrame
      result={
        result ? (
          <>
            <ResultValue
              primary
              label="Купить мешков"
              value={`${result.bagsToBuy} шт.`}
            />
            <ResultValue
              label="Кг с запасом"
              value={`${formatNumber(result.kgWithReserve, 2)} кг`}
            />
            <ResultValue
              label="Расчётно без запаса"
              value={`${formatNumber(result.theoreticalKg, 2)} кг`}
            />
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result
          ? `Результат расчёта: купить ${result.bagsToBuy} мешков штукатурки`
          : null
      }
      error={
        complete && !result
          ? "Проверьте площадь, толщину слоя, расход и фасовку мешка."
          : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <Field
        label="Площадь поверхности"
        value={controls.state.area}
        onChange={(v) => controls.setField("area", v)}
        unit="м²"
        hint="Для стены с проёмами вычтите их площадь заранее"
      />
      <Field
        label="Средняя толщина слоя"
        value={controls.state.thickness}
        onChange={(v) => controls.setField("thickness", v)}
        unit="мм"
      />
      <Field
        label="Расход при слое 10 мм"
        value={controls.state.consumption}
        onChange={(v) => controls.setField("consumption", v)}
        unit="кг/м²"
        hint="Смотрите на мешке производителя"
      />
      <Field
        label="Фасовка"
        value={controls.state.packageWeight}
        onChange={(v) => controls.setField("packageWeight", v)}
        unit="кг"
      />
      <div className="sm:col-span-2">
        <Field
          label="Запас"
          value={controls.state.reserve}
          onChange={(v) => controls.setField("reserve", v)}
          unit="%"
        />
      </div>
    </CalculatorFrame>
  );
}
