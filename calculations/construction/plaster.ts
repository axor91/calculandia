import {
  ceilDecimalRatio,
  isCalculatedQuantity,
  isReservePercent,
} from "./units";

export const MIN_PLASTER_THICKNESS_MM = 5;
export const MAX_PLASTER_THICKNESS_MM = 50;
export const MIN_PLASTER_CONSUMPTION_KG_PER_M2 = 4;
export const MAX_PLASTER_CONSUMPTION_KG_PER_M2 = 20;
export const MIN_PLASTER_PACKAGE_KG = 5;
export const MAX_PLASTER_PACKAGE_KG = 50;

export type PlasterInput = Readonly<{
  areaM2: number;
  thicknessMm: number;
  consumptionKgPerM2At10mm: number;
  packageKg: number;
  reservePercent: number;
}>;

export type PlasterResult = Readonly<{
  areaM2: number;
  thicknessMm: number;
  consumptionKgPerM2At10mm: number;
  theoreticalKg: number;
  reservePercent: number;
  kgWithReserve: number;
  packageKg: number;
  bagsToBuy: number;
}>;

function isPlasterThickness(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= MIN_PLASTER_THICKNESS_MM &&
    value <= MAX_PLASTER_THICKNESS_MM
  );
}

function isPlasterConsumption(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= MIN_PLASTER_CONSUMPTION_KG_PER_M2 &&
    value <= MAX_PLASTER_CONSUMPTION_KG_PER_M2
  );
}

function isPlasterPackage(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= MIN_PLASTER_PACKAGE_KG &&
    value <= MAX_PLASTER_PACKAGE_KG
  );
}

export function calculatePlaster(input: PlasterInput): PlasterResult | null {
  if (
    !input ||
    typeof input !== "object" ||
    !isCalculatedQuantity(input.areaM2) ||
    !isPlasterThickness(input.thicknessMm) ||
    !isPlasterConsumption(input.consumptionKgPerM2At10mm) ||
    !isPlasterPackage(input.packageKg) ||
    !isReservePercent(input.reservePercent)
  ) {
    return null;
  }

  const theoreticalKg =
    input.areaM2 * (input.thicknessMm / 10) * input.consumptionKgPerM2At10mm;
  const kgWithReserve = theoreticalKg * (1 + input.reservePercent / 100);

  if (
    !isCalculatedQuantity(theoreticalKg) ||
    !isCalculatedQuantity(kgWithReserve)
  ) {
    return null;
  }

  const bagsToBuy = ceilDecimalRatio(kgWithReserve, input.packageKg);
  if (!isCalculatedQuantity(bagsToBuy)) return null;

  return {
    areaM2: input.areaM2,
    thicknessMm: input.thicknessMm,
    consumptionKgPerM2At10mm: input.consumptionKgPerM2At10mm,
    theoreticalKg,
    reservePercent: input.reservePercent,
    kgWithReserve,
    packageKg: input.packageKg,
    bagsToBuy,
  };
}
